// =====================================================================================
//  Roots & Rust - ToonVibrant.shader (URP, HLSL)
//  Estilo "How to Fish": cel-shading con bandas suaves, colores súper saturados,
//  sombras azuladas, rim-light brillante y soporte de color por instancia.
//
//  - _BaseColor / _BaseMap          : color y textura base.
//  - _ShadowColor                   : tinte de la zona en sombra (azul/violeta por defecto).
//  - _RampThreshold / _RampSmooth   : dónde cae el corte luz/sombra y su suavidad.
//  - _MidBand*                      : segunda banda de luz intermedia (look "pintado").
//  - _Saturation                    : empuje de saturación final.
//  - _Rim*                          : brillo en los bordes (fresnel).
//  - _Spec*                         : brillo especular tipo cartoon.
//  - _Emission*                     : emisión (para bloom).
//  - _UseVertexColor                : multiplica por el color de vértice (terreno procedural).
//  - _InstanceColor (sin Properties): color por instancia vía MaterialPropertyBlock o
//                                     GPU Instancing. RGB = color, A = cuánto reemplaza a la base.
// =====================================================================================
Shader "RootsAndRust/ToonVibrant"
{
    Properties
    {
        [MainTexture] _BaseMap ("Textura Base", 2D) = "white" {}
        [MainColor] _BaseColor ("Color Base", Color) = (0.2, 0.85, 0.45, 1)
        _ShadowColor ("Color de Sombra", Color) = (0.38, 0.42, 0.85, 1)
        _ShadowStrength ("Intensidad de Sombra", Range(0, 1)) = 0.65

        [Header(Bandas Cel Shading)]
        _RampThreshold ("Umbral Luz/Sombra", Range(0, 1)) = 0.5
        _RampSmooth ("Suavidad del Corte", Range(0.001, 0.5)) = 0.06
        _MidBandThreshold ("Umbral Banda Media", Range(0, 1)) = 0.78
        _MidBandStrength ("Fuerza Banda Media", Range(0, 0.5)) = 0.12

        [Header(Color)]
        _Saturation ("Saturación", Range(0, 2.5)) = 1.35
        _AmbientStrength ("Luz Ambiental", Range(0, 2)) = 0.85
        [Toggle(_USE_VERTEX_COLOR)] _UseVertexColor ("Usar Color de Vértice", Float) = 0

        [Header(Rim Light)]
        [HDR] _RimColor ("Color Rim", Color) = (1, 0.95, 0.75, 1)
        _RimPower ("Potencia Rim", Range(0.5, 10)) = 3.5
        _RimIntensity ("Intensidad Rim", Range(0, 3)) = 0.75
        _RimLightAlign ("Rim sólo del lado iluminado", Range(0, 1)) = 0.4

        [Header(Especular Cartoon)]
        [HDR] _SpecColor ("Color Especular", Color) = (1, 1, 1, 1)
        _SpecSize ("Tamaño Especular", Range(0, 1)) = 0.12
        _SpecIntensity ("Intensidad Especular", Range(0, 2)) = 0.35

        [Header(Emision)]
        [HDR] _EmissionColor ("Color Emisión", Color) = (0, 0, 0, 1)
    }

    SubShader
    {
        Tags
        {
            "RenderType" = "Opaque"
            "RenderPipeline" = "UniversalPipeline"
            "Queue" = "Geometry"
        }
        LOD 300

        HLSLINCLUDE
        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

        // ---- Propiedades por material (compatibles con SRP Batcher) ----
        CBUFFER_START(UnityPerMaterial)
            float4 _BaseMap_ST;
            half4 _BaseColor;
            half4 _ShadowColor;
            half _ShadowStrength;
            half _RampThreshold;
            half _RampSmooth;
            half _MidBandThreshold;
            half _MidBandStrength;
            half _Saturation;
            half _AmbientStrength;
            half _UseVertexColor;
            half4 _RimColor;
            half _RimPower;
            half _RimIntensity;
            half _RimLightAlign;
            half4 _SpecColor;
            half _SpecSize;
            half _SpecIntensity;
            half4 _EmissionColor;
        CBUFFER_END

        // ---- Propiedad por instancia (GPU Instancing / MaterialPropertyBlock) ----
        UNITY_INSTANCING_BUFFER_START(ToonInstanceProps)
            UNITY_DEFINE_INSTANCED_PROP(half4, _InstanceColor)
        UNITY_INSTANCING_BUFFER_END(ToonInstanceProps)

        TEXTURE2D(_BaseMap);
        SAMPLER(sampler_BaseMap);

        half3 ApplySaturation(half3 color, half saturation)
        {
            half luma = dot(color, half3(0.2126h, 0.7152h, 0.0722h));
            return max(0.0h, lerp(luma.xxx, color, saturation));
        }
        ENDHLSL

        // =============================================================================
        //  Pase principal (Forward)
        // =============================================================================
        Pass
        {
            Name "ForwardToon"
            Tags { "LightMode" = "UniversalForward" }

            Cull Back
            ZWrite On

            HLSLPROGRAM
            #pragma target 3.5
            #pragma vertex ToonVert
            #pragma fragment ToonFrag

            #pragma shader_feature_local _USE_VERTEX_COLOR

            // Keywords de iluminación URP
            #pragma multi_compile _ _MAIN_LIGHT_SHADOWS _MAIN_LIGHT_SHADOWS_CASCADE _MAIN_LIGHT_SHADOWS_SCREEN
            #pragma multi_compile _ _ADDITIONAL_LIGHTS_VERTEX _ADDITIONAL_LIGHTS
            #pragma multi_compile_fragment _ _ADDITIONAL_LIGHT_SHADOWS
            #pragma multi_compile_fragment _ _SHADOWS_SOFT _SHADOWS_SOFT_LOW _SHADOWS_SOFT_MEDIUM _SHADOWS_SOFT_HIGH
            #pragma multi_compile _ _FORWARD_PLUS
            #pragma multi_compile _ _CLUSTER_LIGHT_LOOP
            #pragma multi_compile_fog
            #pragma multi_compile_instancing

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

            struct Attributes
            {
                float4 positionOS : POSITION;
                float3 normalOS   : NORMAL;
                float2 uv         : TEXCOORD0;
                half4  color      : COLOR;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            struct Varyings
            {
                float4 positionCS : SV_POSITION;
                float2 uv         : TEXCOORD0;
                float3 positionWS : TEXCOORD1;
                half3  normalWS   : TEXCOORD2;
                half4  color      : TEXCOORD3;
                half   fogFactor  : TEXCOORD4;
                UNITY_VERTEX_INPUT_INSTANCE_ID
                UNITY_VERTEX_OUTPUT_STEREO
            };

            Varyings ToonVert(Attributes input)
            {
                Varyings output = (Varyings)0;
                UNITY_SETUP_INSTANCE_ID(input);
                UNITY_TRANSFER_INSTANCE_ID(input, output);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(output);

                VertexPositionInputs posInputs = GetVertexPositionInputs(input.positionOS.xyz);
                VertexNormalInputs normInputs = GetVertexNormalInputs(input.normalOS);

                output.positionCS = posInputs.positionCS;
                output.positionWS = posInputs.positionWS;
                output.normalWS = normInputs.normalWS;
                output.uv = TRANSFORM_TEX(input.uv, _BaseMap);
                output.color = input.color;
                output.fogFactor = ComputeFogFactor(posInputs.positionCS.z);
                return output;
            }

            // Respuesta "cel" de una luz: devuelve cuánto ilumina (0..1) con bandas suaves.
            half ToonRamp(half ndl, half attenuation)
            {
                half lit = saturate(ndl * 0.5h + 0.5h) * attenuation;
                half band = smoothstep(_RampThreshold - _RampSmooth, _RampThreshold + _RampSmooth, lit);
                half mid = smoothstep(_MidBandThreshold - _RampSmooth, _MidBandThreshold + _RampSmooth, lit);
                return saturate(band + mid * _MidBandStrength);
            }

            half4 ToonFrag(Varyings input) : SV_Target
            {
                UNITY_SETUP_INSTANCE_ID(input);
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(input);

                // ---------- Albedo ----------
                half4 tex = SAMPLE_TEXTURE2D(_BaseMap, sampler_BaseMap, input.uv);
                half3 albedo = tex.rgb * _BaseColor.rgb;

                half4 instanceColor = UNITY_ACCESS_INSTANCED_PROP(ToonInstanceProps, _InstanceColor);
                albedo = lerp(albedo, tex.rgb * instanceColor.rgb, saturate(instanceColor.a));

                #if defined(_USE_VERTEX_COLOR)
                    albedo *= input.color.rgb;
                #endif

                half3 normalWS = normalize(input.normalWS);
                half3 viewDirWS = GetWorldSpaceNormalizeViewDir(input.positionWS);

                // ---------- Luz principal + sombras ----------
                float4 shadowCoord = TransformWorldToShadowCoord(input.positionWS);
                Light mainLight = GetMainLight(shadowCoord);
                half mainAtten = mainLight.shadowAttenuation * mainLight.distanceAttenuation;
                half ndl = dot(normalWS, mainLight.direction);
                half ramp = ToonRamp(ndl, mainAtten);

                // Sombra tintada (azulada) en vez de negra: clave del look vibrante.
                half3 shadowTint = lerp(half3(1, 1, 1), _ShadowColor.rgb, _ShadowStrength);
                half3 lightTint = lerp(shadowTint, half3(1, 1, 1), ramp);
                half3 color = albedo * lightTint * mainLight.color;

                // Especular cartoon (un "puntito" de brillo nítido)
                half3 halfDir = normalize(mainLight.direction + viewDirWS);
                half nh = saturate(dot(normalWS, halfDir));
                half specMask = smoothstep(1.0h - _SpecSize * 0.1h - 0.005h, 1.0h - _SpecSize * 0.1h + 0.005h, nh);
                color += specMask * ramp * _SpecColor.rgb * _SpecIntensity * mainLight.color;

                // ---------- Luces adicionales (también en bandas) ----------
                #if defined(_ADDITIONAL_LIGHTS) || defined(_FORWARD_PLUS) || defined(_CLUSTER_LIGHT_LOOP)
                    InputData inputData = (InputData)0;
                    inputData.positionWS = input.positionWS;
                    inputData.normalWS = normalWS;
                    inputData.viewDirectionWS = viewDirWS;
                    inputData.normalizedScreenSpaceUV = GetNormalizedScreenSpaceUV(input.positionCS);

                    uint additionalCount = GetAdditionalLightsCount();
                    LIGHT_LOOP_BEGIN(additionalCount)
                        Light addLight = GetAdditionalLight(lightIndex, input.positionWS, half4(1, 1, 1, 1));
                        half addAtten = addLight.distanceAttenuation * addLight.shadowAttenuation;
                        half addRamp = ToonRamp(dot(normalWS, addLight.direction), saturate(addAtten * 2.0h));
                        color += albedo * addLight.color * addRamp * saturate(addAtten);
                    LIGHT_LOOP_END
                #endif

                // ---------- Ambiente (esféricos armónicos) ----------
                half3 ambient = SampleSH(normalWS) * _AmbientStrength;
                color += albedo * ambient * lerp(_ShadowColor.rgb, half3(1, 1, 1), 0.5h) * 0.5h;

                // ---------- Rim light ----------
                half fresnel = pow(1.0h - saturate(dot(normalWS, viewDirWS)), _RimPower);
                half rimSide = lerp(1.0h, saturate(ndl * 0.5h + 0.5h), _RimLightAlign);
                color += fresnel * rimSide * _RimColor.rgb * _RimIntensity;

                // ---------- Saturación + emisión ----------
                color = ApplySaturation(color, _Saturation);
                color += _EmissionColor.rgb;

                color = MixFog(color, input.fogFactor);
                return half4(color, 1.0h);
            }
            ENDHLSL
        }

        // =============================================================================
        //  Pase de sombras (proyecta sombras)
        // =============================================================================
        Pass
        {
            Name "ShadowCaster"
            Tags { "LightMode" = "ShadowCaster" }

            ZWrite On
            ZTest LEqual
            ColorMask 0
            Cull Back

            HLSLPROGRAM
            #pragma target 3.5
            #pragma vertex ShadowVert
            #pragma fragment ShadowFrag
            #pragma multi_compile_instancing
            #pragma multi_compile_vertex _ _CASTING_PUNCTUAL_LIGHT_SHADOW

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

            float3 _LightDirection;
            float3 _LightPosition;

            struct ShadowAttributes
            {
                float4 positionOS : POSITION;
                float3 normalOS   : NORMAL;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            struct ShadowVaryings
            {
                float4 positionCS : SV_POSITION;
            };

            ShadowVaryings ShadowVert(ShadowAttributes input)
            {
                ShadowVaryings output;
                UNITY_SETUP_INSTANCE_ID(input);

                float3 positionWS = TransformObjectToWorld(input.positionOS.xyz);
                float3 normalWS = TransformObjectToWorldNormal(input.normalOS);

                #if defined(_CASTING_PUNCTUAL_LIGHT_SHADOW)
                    float3 lightDirectionWS = normalize(_LightPosition - positionWS);
                #else
                    float3 lightDirectionWS = _LightDirection;
                #endif

                float4 positionCS = TransformWorldToHClip(ApplyShadowBias(positionWS, normalWS, lightDirectionWS));
                #if UNITY_REVERSED_Z
                    positionCS.z = min(positionCS.z, UNITY_NEAR_CLIP_VALUE);
                #else
                    positionCS.z = max(positionCS.z, UNITY_NEAR_CLIP_VALUE);
                #endif
                output.positionCS = positionCS;
                return output;
            }

            half4 ShadowFrag(ShadowVaryings input) : SV_Target
            {
                return 0;
            }
            ENDHLSL
        }

        // =============================================================================
        //  Pase de profundidad (Depth prepass / SSAO / efectos)
        // =============================================================================
        Pass
        {
            Name "DepthOnly"
            Tags { "LightMode" = "DepthOnly" }

            ZWrite On
            ColorMask R
            Cull Back

            HLSLPROGRAM
            #pragma target 3.5
            #pragma vertex DepthVert
            #pragma fragment DepthFrag
            #pragma multi_compile_instancing

            struct DepthAttributes
            {
                float4 positionOS : POSITION;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            struct DepthVaryings
            {
                float4 positionCS : SV_POSITION;
                UNITY_VERTEX_OUTPUT_STEREO
            };

            DepthVaryings DepthVert(DepthAttributes input)
            {
                DepthVaryings output = (DepthVaryings)0;
                UNITY_SETUP_INSTANCE_ID(input);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(output);
                output.positionCS = TransformObjectToHClip(input.positionOS.xyz);
                return output;
            }

            half DepthFrag(DepthVaryings input) : SV_Target
            {
                return input.positionCS.z;
            }
            ENDHLSL
        }

        // =============================================================================
        //  Pase de profundidad + normales (SSAO, Decals)
        // =============================================================================
        Pass
        {
            Name "DepthNormals"
            Tags { "LightMode" = "DepthNormals" }

            ZWrite On
            Cull Back

            HLSLPROGRAM
            #pragma target 3.5
            #pragma vertex DepthNormalsVert
            #pragma fragment DepthNormalsFrag
            #pragma multi_compile_instancing

            struct DNAttributes
            {
                float4 positionOS : POSITION;
                float3 normalOS   : NORMAL;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            struct DNVaryings
            {
                float4 positionCS : SV_POSITION;
                half3  normalWS   : TEXCOORD0;
                UNITY_VERTEX_OUTPUT_STEREO
            };

            DNVaryings DepthNormalsVert(DNAttributes input)
            {
                DNVaryings output = (DNVaryings)0;
                UNITY_SETUP_INSTANCE_ID(input);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(output);
                output.positionCS = TransformObjectToHClip(input.positionOS.xyz);
                output.normalWS = TransformObjectToWorldNormal(input.normalOS);
                return output;
            }

            half4 DepthNormalsFrag(DNVaryings input) : SV_Target
            {
                return half4(NormalizeNormalPerPixel(input.normalWS), 0.0);
            }
            ENDHLSL
        }
    }

    FallBack "Hidden/Universal Render Pipeline/FallbackError"
}
