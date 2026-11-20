using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using RootsAndRust.Cinematic;
using RootsAndRust.Core;
using RootsAndRust.Gameplay;
using RootsAndRust.Networking;
using RootsAndRust.Player;
using RootsAndRust.UI;
using Unity.Netcode;
using Unity.Netcode.Components;
using Unity.Netcode.Transports.UTP;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using Object = UnityEngine.Object;
using Random = System.Random;

namespace RootsAndRust.EditorTools
{
    /// <summary>
    /// Asistente que deja el proyecto JUGABLE con un clic:
    ///   RootsAndRust > 1. Generar Escena y Prefabs Jugables
    ///
    /// Hace (y se puede re-ejecutar sin problemas, sobrescribe lo generado):
    ///   1. Importa los TMP Essential Resources si faltan.
    ///   2. Crea y asigna un URP Asset con sombras suaves, HDR y MSAA.
    ///   3. Crea los materiales ToonVibrant con la paleta del juego.
    ///   4. Crea los prefabs: jugadores, proyectiles, zonas y árbol dinámico.
    ///   5. Registra los prefabs de red y crea Resources/GameAssets.asset.
    ///   6. Construye la escena MainArena (terreno, iluminación, post-proceso, Árbol Corazón,
    ///      20 árboles, spawn points, NetworkManager, sistemas de juego, UI y cinemática).
    ///   7. Añade la escena a Build Settings y ajusta Player Settings para pruebas en red.
    /// </summary>
    public static class ProjectSetupWizard
    {
        const string Root = "Assets/_Project";
        const string PrefabDir = Root + "/Prefabs";
        const string MaterialDir = Root + "/Materials";
        const string SceneDir = Root + "/Scenes";
        const string SettingsDir = Root + "/Settings";
        const string MeshDir = Root + "/Meshes";
        const string ResourcesDir = Root + "/Resources";
        const string ScenePath = SceneDir + "/MainArena.unity";
        const string ToonShaderName = "RootsAndRust/ToonVibrant";

        const float ArenaHalfSize = 62f;
        const float PlayableHalfSize = 56f;
        const int TreeCount = 20;
        const float TrunkHeight = 5f;
        const float ClashZ = -8f;

        // =====================================================================
        //  MENÚS
        // =====================================================================

        [MenuItem("RootsAndRust/1. Generar Escena y Prefabs Jugables", priority = 1)]
        public static void GenerateEverything()
        {
            if (EditorApplication.isPlayingOrWillChangePlaymode)
            {
                EditorUtility.DisplayDialog("Roots & Rust", "Sal del modo Play antes de generar la escena.", "OK");
                return;
            }
            if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;

            try
            {
                Step("Creando carpetas...", 0.02f);
                EnsureFolders();

                Step("Comprobando TextMeshPro...", 0.05f);
                EnsureTmpEssentials();

                Step("Configurando URP...", 0.1f);
                SetupUniversalRenderPipeline();
                ConfigurePlayerSettings();

                Step("Creando escena vacía...", 0.15f);
                EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

                Step("Creando materiales ToonVibrant...", 0.2f);
                var mats = CreateMaterials();

                Step("Creando prefabs...", 0.35f);
                var prefabs = CreatePrefabs(mats);

                Step("Registrando prefabs de red...", 0.5f);
                var prefabList = RegisterNetworkPrefabs(prefabs);
                CreateGameAssets(prefabs, mats);

                Step("Construyendo la arena...", 0.6f);
                BuildScene(mats, prefabs, prefabList);

                Step("Guardando y regenerando IDs de red...", 0.9f);
                SaveAndRefreshNetworkIds(prefabs);
                AddSceneToBuildSettings();

                AssetDatabase.SaveAssets();
                AssetDatabase.Refresh();
            }
            catch (Exception e)
            {
                EditorUtility.ClearProgressBar();
                Debug.LogException(e);
                EditorUtility.DisplayDialog("Roots & Rust", "Algo falló generando el proyecto:\n\n" + e.Message + "\n\nRevisa la consola.", "OK");
                return;
            }
            EditorUtility.ClearProgressBar();

            Debug.Log("<color=#12C773><b>[Roots & Rust]</b></color> ¡Escena y prefabs generados! Pulsa Play y elige 'Host Local' para probar.");
            EditorUtility.DisplayDialog("Roots & Rust",
                "¡Listo! Se generó la escena MainArena con todos los prefabs.\n\n" +
                "1. Pulsa PLAY.\n2. Elige 'HOST LOCAL' (o 'CREAR SALA ONLINE').\n3. Elige tu bando.\n\n" +
                "Para el modo online, vincula antes el proyecto a Unity Cloud (Edit > Project Settings > Services).",
                "¡A jugar!");
        }

        [MenuItem("RootsAndRust/2. Abrir Escena MainArena", priority = 2)]
        public static void OpenArena()
        {
            if (!File.Exists(ScenePath))
            {
                EditorUtility.DisplayDialog("Roots & Rust", "La escena aún no existe. Ejecuta primero '1. Generar Escena y Prefabs Jugables'.", "OK");
                return;
            }
            if (EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo())
                EditorSceneManager.OpenScene(ScenePath);
        }

        static void Step(string message, float progress)
        {
            EditorUtility.DisplayProgressBar("Roots & Rust - Generando proyecto", message, progress);
        }

        // =====================================================================
        //  1. CARPETAS, TMP, URP, PLAYER SETTINGS
        // =====================================================================

        static void EnsureFolders()
        {
            foreach (var path in new[] { Root, PrefabDir, MaterialDir, SceneDir, SettingsDir, MeshDir, ResourcesDir })
            {
                if (AssetDatabase.IsValidFolder(path)) continue;
                string parent = Path.GetDirectoryName(path)?.Replace('\\', '/');
                AssetDatabase.CreateFolder(parent, Path.GetFileName(path));
            }
        }

        static void EnsureTmpEssentials()
        {
            if (AssetDatabase.FindAssets("t:TMP_Settings").Length > 0) return;
            string[] candidates =
            {
                "Packages/com.unity.ugui/Package Resources/TMP Essential Resources.unitypackage",
                "Packages/com.unity.textmeshpro/Package Resources/TMP Essential Resources.unitypackage"
            };
            foreach (var candidate in candidates)
            {
                string full = Path.GetFullPath(candidate);
                if (!File.Exists(full)) continue;
                AssetDatabase.ImportPackage(full, false);
                Debug.Log("[Roots & Rust] Importados TMP Essential Resources.");
                return;
            }
            Debug.LogWarning("[Roots & Rust] No se encontraron los TMP Essential Resources. Impórtalos desde Window > TextMeshPro > Import TMP Essential Resources.");
        }

        static void SetupUniversalRenderPipeline()
        {
            var current = GraphicsSettings.defaultRenderPipeline as UniversalRenderPipelineAsset;
            if (current != null)
            {
                Debug.Log("[Roots & Rust] Ya hay un URP Asset asignado (" + current.name + "). Se respeta.");
                return;
            }

            string rendererPath = SettingsDir + "/RootsAndRust_Renderer.asset";
            string assetPath = SettingsDir + "/RootsAndRust_URP.asset";

            var pipeline = AssetDatabase.LoadAssetAtPath<UniversalRenderPipelineAsset>(assetPath);
            if (pipeline == null)
            {
                var rendererData = ScriptableObject.CreateInstance<UniversalRendererData>();
                var postProcessData = TryGetDefaultPostProcessData();
                if (postProcessData != null) rendererData.postProcessData = postProcessData;
                AssetDatabase.CreateAsset(rendererData, rendererPath);

                pipeline = UniversalRenderPipelineAsset.Create(rendererData);
                AssetDatabase.CreateAsset(pipeline, assetPath);
            }

            pipeline.supportsHDR = true;
            pipeline.msaaSampleCount = 4;
            pipeline.shadowDistance = 110f;
            pipeline.shadowCascadeCount = 2;
            var so = new SerializedObject(pipeline);
            SetIfExists(so, "m_SoftShadowsSupported", true);
            SetIfExists(so, "m_MainLightShadowmapResolution", 2048);
            SetIfExists(so, "m_RequireDepthTexture", true);
            so.ApplyModifiedPropertiesWithoutUndo();
            EditorUtility.SetDirty(pipeline);

            GraphicsSettings.defaultRenderPipeline = pipeline;
            int originalLevel = QualitySettings.GetQualityLevel();
            for (int i = 0; i < QualitySettings.names.Length; i++)
            {
                QualitySettings.SetQualityLevel(i, false);
                QualitySettings.renderPipeline = pipeline;
            }
            QualitySettings.SetQualityLevel(originalLevel, false);
            AssetDatabase.SaveAssets();
            Debug.Log("[Roots & Rust] URP configurado: " + assetPath);
        }

        static PostProcessData TryGetDefaultPostProcessData()
        {
            var method = typeof(PostProcessData).GetMethod("GetDefaultPostProcessData", BindingFlags.Static | BindingFlags.NonPublic | BindingFlags.Public);
            if (method != null)
            {
                try { return method.Invoke(null, null) as PostProcessData; }
                catch (Exception) { /* sigue con la ruta conocida */ }
            }
            return AssetDatabase.LoadAssetAtPath<PostProcessData>("Packages/com.unity.render-pipelines.universal/Runtime/Data/PostProcessData.asset");
        }

        static void ConfigurePlayerSettings()
        {
            // Imprescindible para probar varias instancias a la vez en el mismo PC.
            PlayerSettings.runInBackground = true;
            PlayerSettings.colorSpace = ColorSpace.Linear;
            PlayerSettings.fullScreenMode = FullScreenMode.Windowed;
            PlayerSettings.defaultScreenWidth = 1280;
            PlayerSettings.defaultScreenHeight = 720;
            PlayerSettings.resizableWindow = true;
            PlayerSettings.productName = "Roots & Rust";
            PlayerSettings.companyName = "RootsAndRustTeam";
        }

        // =====================================================================
        //  2. MATERIALES
        // =====================================================================

        class MaterialLibrary
        {
            public CharacterMaterialSet Guardian = new CharacterMaterialSet();
            public CharacterMaterialSet Logger = new CharacterMaterialSet();
            public Material Ground, Bark, Stump, LeavesA, LeavesB, LeavesC, Sprout;
            public Material HeartBark, HeartCanopy, HeartCore, Rock, FlowerMagenta, FlowerYellow, Mushroom;
            public Material Industrial, Steel, Hazard, Charcoal;
            public Material ZoneBio, ZoneScorch, ZoneScorchCrack, SporeProjectile, SawProjectile;
            public Material PadGuardian, PadLogger, Particle, Skybox;
        }

        static MaterialLibrary CreateMaterials()
        {
            var m = new MaterialLibrary();

            // --- Guardianes (Activistas): esmeralda, lima, flores magenta/amarillo ---
            m.Guardian.body = Toon("M_Guardian_Body", Palette.Emerald);
            m.Guardian.accent = Toon("M_Guardian_Accent", Palette.Lime);
            m.Guardian.detail = Toon("M_Guardian_Detail", Palette.DeepLeaf);
            m.Guardian.skin = Toon("M_Skin", Palette.SkinTone, rim: 0.5f);
            m.Guardian.weapon = Toon("M_Guardian_Weapon", Palette.FlowerYellow, Palette.FlowerYellow * 0.4f);
            m.Guardian.glow = Toon("M_Guardian_Glow", Palette.FlowerMagenta, Palette.FlowerMagenta * 0.9f);

            // --- Taladores: naranja industrial, acero azulado, chispas ámbar ---
            m.Logger.body = Toon("M_Logger_Body", Palette.SteelBlue);
            m.Logger.accent = Toon("M_Logger_Accent", Palette.IndustrialOrange);
            m.Logger.detail = Toon("M_Logger_Detail", Palette.Charcoal);
            m.Logger.skin = m.Guardian.skin;
            m.Logger.weapon = Toon("M_Logger_Weapon", new Color(0.55f, 0.66f, 0.8f), default, spec: 0.9f);
            m.Logger.glow = Toon("M_Logger_Glow", Palette.SparkAmber, Palette.SparkAmber * 1.4f);

            // --- Mundo ---
            m.Ground = Toon("M_Ground", Color.white, rim: 0.15f, vertexColor: true, spec: 0f);
            m.Bark = Toon("M_Bark", Palette.Bark);
            m.Stump = Toon("M_Stump", new Color(0.78f, 0.52f, 0.3f));
            m.LeavesA = Toon("M_Leaves_A", Palette.Emerald, rim: 0.9f);
            m.LeavesB = Toon("M_Leaves_B", Palette.Lime, rim: 0.9f);
            m.LeavesC = Toon("M_Leaves_C", Palette.Moss, rim: 0.9f);
            m.Sprout = Toon("M_Sprout", Palette.Lime, Palette.Lime * 0.3f);
            m.HeartBark = Toon("M_Heart_Bark", new Color(0.55f, 0.3f, 0.45f));
            m.HeartCanopy = Toon("M_Heart_Canopy", Palette.HeartGlow, Palette.HeartGlow * 0.15f, rim: 1.4f);
            m.HeartCore = Toon("M_Heart_Core", Palette.FlowerMagenta, Palette.FlowerMagenta * 1.2f);
            m.Rock = Toon("M_Rock", Palette.Rock);
            m.FlowerMagenta = Toon("M_Flower_Magenta", Palette.FlowerMagenta, Palette.FlowerMagenta * 0.25f);
            m.FlowerYellow = Toon("M_Flower_Yellow", Palette.FlowerYellow, Palette.FlowerYellow * 0.25f);
            m.Mushroom = Toon("M_Mushroom", new Color(1f, 0.35f, 0.35f));
            m.Industrial = Toon("M_Industrial", Palette.IndustrialOrange);
            m.Steel = Toon("M_Steel", Palette.SteelBlue, default, spec: 0.9f);
            m.Hazard = Toon("M_Hazard", Palette.HazardYellow);
            m.Charcoal = Toon("M_Charcoal", Palette.Charcoal);

            // --- Zonas y proyectiles ---
            m.ZoneBio = Toon("M_Zone_Bio", Palette.Lime, Palette.Emerald * 0.6f, rim: 0.2f);
            m.ZoneScorch = Toon("M_Zone_Scorch", Palette.Charcoal, new Color(0.25f, 0.08f, 0f), rim: 0.2f);
            m.ZoneScorchCrack = Toon("M_Zone_ScorchCrack", Palette.SparkAmber, Palette.IndustrialOrange * 2f);
            m.SporeProjectile = Toon("M_Projectile_Spore", Palette.Lime, Palette.Lime * 2.2f);
            m.SawProjectile = Toon("M_Projectile_Saw", Palette.SparkAmber, Palette.SparkAmber * 2.2f);
            m.PadGuardian = Toon("M_Pad_Guardian", Palette.Emerald, Palette.Emerald * 0.5f);
            m.PadLogger = Toon("M_Pad_Logger", Palette.IndustrialOrange, Palette.IndustrialOrange * 0.5f);

            m.Particle = ParticleMaterial();
            m.Skybox = SkyboxMaterial();
            AssetDatabase.SaveAssets();
            return m;
        }

        static Material Toon(string name, Color color, Color emission = default, float rim = 0.75f, bool vertexColor = false, float spec = 0.35f)
        {
            string path = MaterialDir + "/" + name + ".mat";
            var shader = Shader.Find(ToonShaderName);
            if (shader == null)
            {
                Debug.LogWarning("[Roots & Rust] No se encontró el shader " + ToonShaderName + ". Se usa URP/Lit.");
                shader = Shader.Find("Universal Render Pipeline/Lit");
            }

            var material = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (material == null)
            {
                material = new Material(shader);
                AssetDatabase.CreateAsset(material, path);
            }
            else if (material.shader != shader)
            {
                material.shader = shader;
            }

            material.SetColor("_BaseColor", color);
            if (material.HasProperty("_EmissionColor")) material.SetColor("_EmissionColor", emission);
            if (material.HasProperty("_RimIntensity")) material.SetFloat("_RimIntensity", rim);
            if (material.HasProperty("_SpecIntensity")) material.SetFloat("_SpecIntensity", spec);
            if (material.HasProperty("_UseVertexColor"))
            {
                material.SetFloat("_UseVertexColor", vertexColor ? 1f : 0f);
                if (vertexColor) material.EnableKeyword("_USE_VERTEX_COLOR");
                else material.DisableKeyword("_USE_VERTEX_COLOR");
            }
            material.enableInstancing = true;
            EditorUtility.SetDirty(material);
            return material;
        }

        static Material ParticleMaterial()
        {
            string path = MaterialDir + "/M_Particles.mat";
            var material = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (material == null)
            {
                var shader = Shader.Find("Universal Render Pipeline/Particles/Unlit");
                if (shader == null) shader = Shader.Find("Sprites/Default");
                material = new Material(shader);
                AssetDatabase.CreateAsset(material, path);
            }

            // Partículas redondas y opacas (recorte alfa): se ven nítidas y "cartoon" con el Bloom.
            var circle = ParticleTexture();
            if (material.HasProperty("_BaseMap")) material.SetTexture("_BaseMap", circle);
            if (material.HasProperty("_MainTex")) material.SetTexture("_MainTex", circle);
            if (material.HasProperty("_BaseColor")) material.SetColor("_BaseColor", Color.white);
            if (material.HasProperty("_AlphaClip"))
            {
                material.SetFloat("_AlphaClip", 1f);
                material.SetFloat("_Cutoff", 0.5f);
                material.EnableKeyword("_ALPHATEST_ON");
            }
            material.enableInstancing = true;
            EditorUtility.SetDirty(material);
            return material;
        }

        /// <summary>Textura circular generada por código (se guarda como .asset, sin binarios para LFS).</summary>
        static Texture2D ParticleTexture()
        {
            string path = MaterialDir + "/T_ParticleCircle.asset";
            var texture = AssetDatabase.LoadAssetAtPath<Texture2D>(path);
            if (texture != null) return texture;

            const int size = 64;
            texture = new Texture2D(size, size, TextureFormat.RGBA32, true)
            {
                name = "T_ParticleCircle",
                wrapMode = TextureWrapMode.Clamp,
                filterMode = FilterMode.Bilinear
            };
            var pixels = new Color[size * size];
            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    float dx = (x + 0.5f) / size * 2f - 1f;
                    float dy = (y + 0.5f) / size * 2f - 1f;
                    float d = Mathf.Sqrt(dx * dx + dy * dy);
                    float alpha = 1f - Mathf.SmoothStep(0.8f, 1f, d);
                    pixels[y * size + x] = new Color(1f, 1f, 1f, alpha);
                }
            }
            texture.SetPixels(pixels);
            texture.Apply(true);
            AssetDatabase.CreateAsset(texture, path);
            return texture;
        }

        static Material SkyboxMaterial()
        {
            string path = MaterialDir + "/M_Sky.mat";
            var material = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (material == null)
            {
                var shader = Shader.Find("Skybox/Procedural");
                if (shader == null) return null;
                material = new Material(shader);
                AssetDatabase.CreateAsset(material, path);
            }
            // Cielo de mediodía soleado, azul turquesa y horizonte dorado.
            if (material.HasProperty("_SkyTint")) material.SetColor("_SkyTint", new Color(0.35f, 0.65f, 0.95f));
            if (material.HasProperty("_GroundColor")) material.SetColor("_GroundColor", new Color(0.55f, 0.8f, 0.7f));
            if (material.HasProperty("_AtmosphereThickness")) material.SetFloat("_AtmosphereThickness", 0.75f);
            if (material.HasProperty("_Exposure")) material.SetFloat("_Exposure", 1.35f);
            if (material.HasProperty("_SunSize")) material.SetFloat("_SunSize", 0.06f);
            EditorUtility.SetDirty(material);
            return material;
        }

        // =====================================================================
        //  3. PREFABS
        // =====================================================================

        class PrefabLibrary
        {
            public GameObject GuardianPlayer, LoggerPlayer, SporeProjectile, SawProjectile, BioZone, ScorchZone, Tree;

            public IEnumerable<GameObject> NetworkPrefabs()
            {
                yield return GuardianPlayer;
                yield return LoggerPlayer;
                yield return SporeProjectile;
                yield return SawProjectile;
                yield return BioZone;
                yield return ScorchZone;
                yield return Tree;
            }
        }

        static PrefabLibrary CreatePrefabs(MaterialLibrary m)
        {
            var p = new PrefabLibrary();
            p.BioZone = SavePrefab(BuildZone(ZoneType.BioSpore, m), "Zone_BioEsporas");
            p.ScorchZone = SavePrefab(BuildZone(ZoneType.Scorched, m), "Zone_SueloQuemado");
            p.SporeProjectile = SavePrefab(BuildProjectile(ProjectileKind.BioSpore, m, p.BioZone), "Projectile_Espora");
            p.SawProjectile = SavePrefab(BuildProjectile(ProjectileKind.ThermalSaw, m, p.ScorchZone), "Projectile_Sierra");
            p.GuardianPlayer = SavePrefab(BuildPlayer(Team.Guardianes, m, p.SporeProjectile), "Player_Activista");
            p.LoggerPlayer = SavePrefab(BuildPlayer(Team.Taladores, m, p.SawProjectile), "Player_Talador");
            p.Tree = SavePrefab(BuildTree(m), "DynamicTree");
            return p;
        }

        static GameObject SavePrefab(GameObject temp, string name)
        {
            string path = PrefabDir + "/" + name + ".prefab";
            var prefab = PrefabUtility.SaveAsPrefabAsset(temp, path);
            Object.DestroyImmediate(temp);
            return prefab;
        }

        // ---------------------------- Jugador ----------------------------

        static GameObject BuildPlayer(Team team, MaterialLibrary m, GameObject projectilePrefab)
        {
            bool guardian = team == Team.Guardianes;
            var go = new GameObject(guardian ? "Player_Activista" : "Player_Talador");

            var controller = go.AddComponent<CharacterController>();
            controller.height = 1.8f;
            controller.radius = 0.42f;
            controller.center = new Vector3(0f, 0.92f, 0f);
            controller.stepOffset = 0.45f;
            controller.slopeLimit = 50f;
            controller.skinWidth = 0.06f;

            go.AddComponent<NetworkObject>();

            // Movimiento con autoridad del dueño: el cliente mueve y el resto interpola.
            var netTransform = go.AddComponent<NetworkTransform>();
            netTransform.AuthorityMode = NetworkTransform.AuthorityModes.Owner;
            netTransform.SyncRotAngleX = false;
            netTransform.SyncRotAngleZ = false;
            netTransform.SyncScaleX = false;
            netTransform.SyncScaleY = false;
            netTransform.SyncScaleZ = false;
            netTransform.Interpolate = true;

            var identity = go.AddComponent<PlayerIdentity>();
            SetProp(identity, "team", team);

            go.AddComponent<Health>();

            var rig = CharacterVisualBuilder.Build(team, guardian ? m.Guardian : m.Logger, go.transform);
            var squash = go.AddComponent<ProceduralSquash>();
            SetProp(squash, "pivot", rig.SquashPivot);

            var tpc = go.AddComponent<ThirdPersonController>();
            SetProp(tpc, "canDash", !guardian);
            if (!guardian)
            {
                // Los Taladores son un pelín más rápidos en suelo, los Guardianes saltan más.
                SetProp(tpc, "moveSpeed", 6.8f);
            }
            else
            {
                SetProp(tpc, "jumpHeight", 1.9f);
            }

            var weapon = go.AddComponent<WeaponSystem>();
            SetProp(weapon, "projectilePrefab", projectilePrefab);
            SetProp(weapon, "muzzle", rig.Muzzle);
            SetProp(weapon, "fireCooldown", guardian ? 0.42f : 0.6f);
            SetProp(weapon, "projectileSpeed", guardian ? 26f : 30f);
            SetProp(weapon, "muzzleFx", guardian ? FxKind.MuzzleSpore : FxKind.MuzzleSaw);
            return go;
        }

        // ---------------------------- Proyectiles ----------------------------

        static GameObject BuildProjectile(ProjectileKind kind, MaterialLibrary m, GameObject zonePrefab)
        {
            bool spore = kind == ProjectileKind.BioSpore;
            var go = new GameObject(spore ? "Projectile_Espora" : "Projectile_Sierra");
            go.AddComponent<NetworkObject>();

            var netTransform = go.AddComponent<NetworkTransform>();
            netTransform.AuthorityMode = NetworkTransform.AuthorityModes.Server;
            netTransform.SyncRotAngleX = false;
            netTransform.SyncRotAngleY = false;
            netTransform.SyncRotAngleZ = false;
            netTransform.SyncScaleX = false;
            netTransform.SyncScaleY = false;
            netTransform.SyncScaleZ = false;
            netTransform.Interpolate = true;

            var visual = new GameObject("Visual").transform;
            visual.SetParent(go.transform, false);
            var spin = new GameObject("Spin").transform;
            spin.SetParent(visual, false);

            if (spore)
            {
                CharacterVisualBuilder.Part(PrimitiveType.Sphere, "Spore", spin, Vector3.zero, Vector3.one * 0.42f, m.SporeProjectile);
                for (int i = 0; i < 4; i++)
                {
                    float a = i * Mathf.PI * 0.5f;
                    CharacterVisualBuilder.Part(PrimitiveType.Sphere, "Seed" + i, spin,
                        new Vector3(Mathf.Cos(a) * 0.24f, 0f, Mathf.Sin(a) * 0.24f), Vector3.one * 0.14f, m.Guardian.glow);
                }
            }
            else
            {
                CharacterVisualBuilder.Part(PrimitiveType.Cylinder, "Disc", spin, Vector3.zero, new Vector3(0.8f, 0.03f, 0.8f), m.SawProjectile);
                CharacterVisualBuilder.Part(PrimitiveType.Cylinder, "Hub", spin, Vector3.zero, new Vector3(0.3f, 0.05f, 0.3f), m.Steel);
                for (int i = 0; i < 8; i++)
                {
                    float a = i * Mathf.PI * 0.25f;
                    CharacterVisualBuilder.Part(PrimitiveType.Cube, "Tooth" + i, spin,
                        new Vector3(Mathf.Cos(a) * 0.42f, 0f, Mathf.Sin(a) * 0.42f), new Vector3(0.12f, 0.04f, 0.12f), m.Logger.glow,
                        new Vector3(0f, -a * Mathf.Rad2Deg + 45f, 0f));
                }
            }
            visual.gameObject.AddComponent<ElasticPop>();

            // Estela de color.
            var trail = go.AddComponent<TrailRenderer>();
            trail.sharedMaterial = m.Particle;
            trail.time = spore ? 0.3f : 0.22f;
            trail.minVertexDistance = 0.1f;
            trail.widthCurve = new AnimationCurve(new Keyframe(0f, spore ? 0.32f : 0.4f), new Keyframe(1f, 0f));
            var gradient = new Gradient();
            gradient.SetKeys(
                new[]
                {
                    new GradientColorKey(spore ? Palette.Lime : Palette.SparkAmber, 0f),
                    new GradientColorKey(spore ? Palette.FlowerMagenta : Palette.IndustrialOrange, 1f)
                },
                new[] { new GradientAlphaKey(1f, 0f), new GradientAlphaKey(1f, 1f) });
            trail.colorGradient = gradient;
            trail.shadowCastingMode = ShadowCastingMode.Off;

            var projectile = go.AddComponent<NetworkProjectile>();
            SetProp(projectile, "kind", kind);
            SetProp(projectile, "impactZonePrefab", zonePrefab);
            SetProp(projectile, "spinVisual", spin);
            if (spore)
            {
                SetProp(projectile, "radius", 0.25f);
                SetProp(projectile, "gravity", 9f);
                SetProp(projectile, "lifetime", 4f);
                SetProp(projectile, "maxBounces", 0);
                SetProp(projectile, "playerDamage", 12f);
                SetProp(projectile, "regrowAmount", 0.5f);
                SetProp(projectile, "spinSpeed", 360f);
            }
            else
            {
                SetProp(projectile, "radius", 0.32f);
                SetProp(projectile, "gravity", 5f);
                SetProp(projectile, "lifetime", 3.5f);
                SetProp(projectile, "maxBounces", 3);
                SetProp(projectile, "playerDamage", 20f);
                SetProp(projectile, "treeDamage", 30f);
                SetProp(projectile, "spinSpeed", 1080f);
            }
            return go;
        }

        // ---------------------------- Zonas ----------------------------

        static GameObject BuildZone(ZoneType type, MaterialLibrary m)
        {
            bool bio = type == ZoneType.BioSpore;
            const float radius = 3.2f;
            var go = new GameObject(bio ? "Zone_BioEsporas" : "Zone_SueloQuemado");
            go.AddComponent<NetworkObject>();

            var visual = new GameObject("Visual").transform;
            visual.SetParent(go.transform, false);
            CharacterVisualBuilder.Part(PrimitiveType.Cylinder, "Disc", visual, Vector3.zero, new Vector3(radius * 2f, 0.03f, radius * 2f), bio ? m.ZoneBio : m.ZoneScorch);

            var rng = new Random(bio ? 7 : 13);
            if (bio)
            {
                // Mini flores, setas y brotes sobre la zona verde.
                for (int i = 0; i < 9; i++)
                {
                    Vector2 p = RandomInCircle(rng, radius * 0.85f);
                    var mat = i % 3 == 0 ? m.FlowerMagenta : i % 3 == 1 ? m.FlowerYellow : m.Sprout;
                    CharacterVisualBuilder.Part(PrimitiveType.Sphere, "Bloom" + i, visual, new Vector3(p.x, 0.12f, p.y), new Vector3(0.35f, 0.22f, 0.35f), mat);
                }
            }
            else
            {
                // Grietas incandescentes y tuercas sobre el suelo quemado.
                for (int i = 0; i < 6; i++)
                {
                    float angle = (float)rng.NextDouble() * 360f;
                    CharacterVisualBuilder.Part(PrimitiveType.Cube, "Crack" + i, visual, new Vector3(0f, 0.03f, 0f),
                        new Vector3(0.12f, 0.02f, radius * (1.2f + (float)rng.NextDouble() * 0.6f)), m.ZoneScorchCrack, new Vector3(0f, angle, 0f));
                }
                for (int i = 0; i < 5; i++)
                {
                    Vector2 p = RandomInCircle(rng, radius * 0.8f);
                    CharacterVisualBuilder.Part(PrimitiveType.Cylinder, "Nut" + i, visual, new Vector3(p.x, 0.06f, p.y), new Vector3(0.3f, 0.05f, 0.3f), m.Steel);
                }
            }
            var pop = visual.gameObject.AddComponent<ElasticPop>();
            SetProp(pop, "popOnEnable", false);

            var zone = go.AddComponent<EffectZone>();
            SetProp(zone, "type", type);
            SetProp(zone, "radius", radius);
            SetProp(zone, "lifetime", bio ? 10f : 12f);
            SetProp(zone, "visual", visual);
            return go;
        }

        // ---------------------------- Árbol dinámico ----------------------------

        static GameObject BuildTree(MaterialLibrary m)
        {
            var go = new GameObject("DynamicTree");
            go.AddComponent<NetworkObject>();
            var tree = go.AddComponent<DynamicTree>();

            // Tocón fijo (con collider).
            var stump = CharacterVisualBuilder.Part(PrimitiveType.Cylinder, "Stump", go.transform, new Vector3(0f, 0.45f, 0f), new Vector3(1.15f, 0.45f, 1.15f), m.Stump);
            var stumpCollider = stump.AddComponent<CapsuleCollider>();
            stumpCollider.radius = 0.5f;
            stumpCollider.height = 2f;
            stump.AddComponent<TreePart>().Setup(tree, TreePartType.Stump);
            for (int i = 0; i < 4; i++)
            {
                float a = i * Mathf.PI * 0.5f + 0.4f;
                CharacterVisualBuilder.Part(PrimitiveType.Sphere, "Root" + i, go.transform,
                    new Vector3(Mathf.Cos(a) * 0.6f, 0.1f, Mathf.Sin(a) * 0.6f), new Vector3(0.5f, 0.25f, 0.35f), m.Bark, new Vector3(0f, -a * Mathf.Rad2Deg, 0f));
            }

            // Brote que crece en el tocón con cada espora.
            var sprout = new GameObject("Sprout").transform;
            sprout.SetParent(go.transform, false);
            sprout.localPosition = new Vector3(0f, 0.9f, 0f);
            CharacterVisualBuilder.Part(PrimitiveType.Capsule, "Stem", sprout, new Vector3(0f, 0.35f, 0f), new Vector3(0.12f, 0.35f, 0.12f), m.Sprout);
            CharacterVisualBuilder.Part(PrimitiveType.Sphere, "LeafL", sprout, new Vector3(-0.2f, 0.65f, 0f), new Vector3(0.38f, 0.12f, 0.24f), m.LeavesB, new Vector3(0f, 0f, 20f));
            CharacterVisualBuilder.Part(PrimitiveType.Sphere, "LeafR", sprout, new Vector3(0.2f, 0.75f, 0f), new Vector3(0.38f, 0.12f, 0.24f), m.LeavesB, new Vector3(0f, 0f, -20f));
            CharacterVisualBuilder.Part(PrimitiveType.Sphere, "Bud", sprout, new Vector3(0f, 0.85f, 0f), Vector3.one * 0.18f, m.FlowerMagenta);

            // Tronco + copa: Rigidbody (cinemático hasta que lo talan) + NetworkTransform del servidor.
            var trunk = new GameObject("Trunk").transform;
            trunk.SetParent(go.transform, false);
            trunk.localPosition = new Vector3(0f, 0.92f, 0f);
            var body = trunk.gameObject.AddComponent<Rigidbody>();
            body.mass = 350f;
            body.isKinematic = true;
            body.interpolation = RigidbodyInterpolation.Interpolate;
            body.collisionDetectionMode = CollisionDetectionMode.ContinuousSpeculative;
            var trunkCollider = trunk.gameObject.AddComponent<CapsuleCollider>();
            trunkCollider.direction = 1;
            trunkCollider.radius = 0.42f;
            trunkCollider.height = TrunkHeight;
            trunkCollider.center = new Vector3(0f, TrunkHeight * 0.5f, 0f);
            var canopyCollider = trunk.gameObject.AddComponent<SphereCollider>();
            canopyCollider.radius = 1.9f;
            canopyCollider.center = new Vector3(0f, TrunkHeight + 0.6f, 0f);
            trunk.gameObject.AddComponent<TreePart>().Setup(tree, TreePartType.Trunk);

            var trunkNet = trunk.gameObject.AddComponent<NetworkTransform>();
            trunkNet.AuthorityMode = NetworkTransform.AuthorityModes.Server;
            trunkNet.SyncScaleX = false;
            trunkNet.SyncScaleY = false;
            trunkNet.SyncScaleZ = false;
            trunkNet.InLocalSpace = false;
            trunkNet.Interpolate = true;

            var trunkVisual = new GameObject("TrunkVisual").transform;
            trunkVisual.SetParent(trunk, false);
            CharacterVisualBuilder.Part(PrimitiveType.Cylinder, "Bark", trunkVisual, new Vector3(0f, TrunkHeight * 0.5f, 0f), new Vector3(0.78f, TrunkHeight * 0.5f, 0.78f), m.Bark);
            CharacterVisualBuilder.Part(PrimitiveType.Capsule, "Branch", trunkVisual, new Vector3(0.45f, TrunkHeight * 0.65f, 0f), new Vector3(0.22f, 0.6f, 0.22f), m.Bark, new Vector3(0f, 0f, -40f));
            var canopy = new GameObject("Canopy").transform;
            canopy.SetParent(trunkVisual, false);
            canopy.localPosition = new Vector3(0f, TrunkHeight + 0.4f, 0f);
            CharacterVisualBuilder.Part(PrimitiveType.Sphere, "LeafBall0", canopy, new Vector3(0f, 0.3f, 0f), Vector3.one * 3.2f, m.LeavesA);
            CharacterVisualBuilder.Part(PrimitiveType.Sphere, "LeafBall1", canopy, new Vector3(1.1f, -0.3f, 0.4f), Vector3.one * 2.2f, m.LeavesB);
            CharacterVisualBuilder.Part(PrimitiveType.Sphere, "LeafBall2", canopy, new Vector3(-1.0f, -0.2f, -0.5f), Vector3.one * 2.3f, m.LeavesC);
            CharacterVisualBuilder.Part(PrimitiveType.Sphere, "LeafBall3", canopy, new Vector3(0.1f, 1.4f, -0.2f), Vector3.one * 1.8f, m.LeavesB);
            // Flores en la copa.
            CharacterVisualBuilder.Part(PrimitiveType.Sphere, "Blossom0", canopy, new Vector3(1.2f, 0.9f, 1.2f), Vector3.one * 0.38f, m.FlowerMagenta);
            CharacterVisualBuilder.Part(PrimitiveType.Sphere, "Blossom1", canopy, new Vector3(-1.4f, 0.5f, 0.9f), Vector3.one * 0.32f, m.FlowerYellow);
            CharacterVisualBuilder.Part(PrimitiveType.Sphere, "Blossom2", canopy, new Vector3(0.3f, 1.9f, 0.8f), Vector3.one * 0.3f, m.FlowerMagenta);

            tree.EditorSetup(trunk, trunkVisual, body, trunkNet, stump.transform, sprout, TrunkHeight);
            return go;
        }

        // =====================================================================
        //  4. REGISTRO DE RED + GAME ASSETS
        // =====================================================================

        static NetworkPrefabsList RegisterNetworkPrefabs(PrefabLibrary prefabs)
        {
            NetworkPrefabsList list = null;
            foreach (var guid in AssetDatabase.FindAssets("t:NetworkPrefabsList"))
            {
                var candidate = AssetDatabase.LoadAssetAtPath<NetworkPrefabsList>(AssetDatabase.GUIDToAssetPath(guid));
                if (candidate == null) continue;
                if (list == null || candidate.name.Contains("Default")) list = candidate;
            }
            if (list == null)
            {
                list = ScriptableObject.CreateInstance<NetworkPrefabsList>();
                AssetDatabase.CreateAsset(list, SettingsDir + "/RootsAndRust_NetworkPrefabs.asset");
            }

            foreach (var prefab in prefabs.NetworkPrefabs())
            {
                if (prefab != null && !list.Contains(prefab))
                    list.Add(new NetworkPrefab { Prefab = prefab });
            }
            EditorUtility.SetDirty(list);
            AssetDatabase.SaveAssets();
            return list;
        }

        static void CreateGameAssets(PrefabLibrary p, MaterialLibrary m)
        {
            string path = ResourcesDir + "/" + GameAssets.ResourcePath + ".asset";
            var assets = AssetDatabase.LoadAssetAtPath<GameAssets>(path);
            if (assets == null)
            {
                assets = ScriptableObject.CreateInstance<GameAssets>();
                AssetDatabase.CreateAsset(assets, path);
            }
            assets.guardianPlayerPrefab = p.GuardianPlayer;
            assets.loggerPlayerPrefab = p.LoggerPlayer;
            assets.sporeProjectilePrefab = p.SporeProjectile;
            assets.sawProjectilePrefab = p.SawProjectile;
            assets.bioZonePrefab = p.BioZone;
            assets.scorchZonePrefab = p.ScorchZone;
            assets.guardianMaterials = m.Guardian;
            assets.loggerMaterials = m.Logger;
            assets.particleMaterial = m.Particle;
            EditorUtility.SetDirty(assets);
            AssetDatabase.SaveAssets();
        }

        // =====================================================================
        //  5. ESCENA
        // =====================================================================

        static void BuildScene(MaterialLibrary m, PrefabLibrary p, NetworkPrefabsList prefabList)
        {
            var scene = EditorSceneManager.GetActiveScene();

            var environment = new GameObject("--- ENTORNO ---").transform;
            var gameplay = new GameObject("--- GAMEPLAY ---").transform;
            var systems = new GameObject("--- SISTEMAS ---").transform;

            // ---------------- Iluminación ----------------
            var sunGo = new GameObject("Sol (Mediodía)");
            sunGo.transform.SetParent(environment);
            sunGo.transform.rotation = Quaternion.Euler(52f, -38f, 0f);
            var sun = sunGo.AddComponent<Light>();
            sun.type = LightType.Directional;
            sun.color = Palette.SunGold;
            sun.intensity = 1.45f;
            sun.shadows = LightShadows.Soft;
            sun.shadowStrength = 0.75f;

            SetupLightingAndFog(m, sun);

            // ---------------- Cámara + post-proceso ----------------
            var camGo = new GameObject("Main Camera");
            camGo.tag = "MainCamera";
            camGo.transform.SetParent(systems);
            camGo.transform.position = new Vector3(-30f, 28f, -42f);
            camGo.transform.LookAt(new Vector3(0f, 5f, 0f));
            var cam = camGo.AddComponent<Camera>();
            cam.fieldOfView = 60f;
            cam.nearClipPlane = 0.1f;
            cam.farClipPlane = 600f;
            cam.clearFlags = CameraClearFlags.Skybox;
            camGo.AddComponent<AudioListener>();
            var camData = cam.GetUniversalAdditionalCameraData();
            camData.renderPostProcessing = true;
            camData.antialiasing = AntialiasingMode.SubpixelMorphologicalAntiAliasing;

            var volumeGo = new GameObject("Global Volume (Vibrante)");
            volumeGo.transform.SetParent(environment);
            var volume = volumeGo.AddComponent<Volume>();
            volume.isGlobal = true;
            volume.priority = 1f;
            volume.sharedProfile = CreateVolumeProfile();

            // ---------------- Terreno ----------------
            var ground = new GameObject("Terreno Colorido");
            ground.transform.SetParent(environment);
            var groundMesh = CreateGroundMesh();
            ground.AddComponent<MeshFilter>().sharedMesh = groundMesh;
            var groundRenderer = ground.AddComponent<MeshRenderer>();
            groundRenderer.sharedMaterial = m.Ground;
            ground.AddComponent<MeshCollider>().sharedMesh = groundMesh;
            GameObjectUtility.SetStaticEditorFlags(ground, StaticEditorFlags.BatchingStatic);

            CreateBoundaryWalls(environment);
            ScatterDecorations(environment, m);

            // ---------------- Árbol Corazón ----------------
            var heart = BuildHeartTree(m);
            heart.transform.SetParent(gameplay);

            // ---------------- Árboles dinámicos ----------------
            var treesRoot = new GameObject("Árboles Dinámicos").transform;
            treesRoot.SetParent(gameplay);
            PlaceDynamicTrees(p.Tree, treesRoot);

            // ---------------- Bases y Spawn Points ----------------
            var guardianBase = BuildBase(Team.Guardianes, m, gameplay);
            var loggerBase = BuildBase(Team.Taladores, m, gameplay);

            // ---------------- NetworkManager ----------------
            var nmGo = new GameObject("NetworkManager");
            nmGo.transform.SetParent(null);
            var transport = nmGo.AddComponent<UnityTransport>();
            var networkManager = nmGo.AddComponent<NetworkManager>();
            if (networkManager.NetworkConfig == null) networkManager.NetworkConfig = new NetworkConfig();
            networkManager.NetworkConfig.NetworkTransport = transport;
            networkManager.NetworkConfig.PlayerPrefab = null;
            networkManager.NetworkConfig.ConnectionApproval = true;
            networkManager.NetworkConfig.Prefabs.NetworkPrefabsLists.Clear();
            networkManager.NetworkConfig.Prefabs.NetworkPrefabsLists.Add(prefabList);
            transport.SetConnectionData("127.0.0.1", 7777, "0.0.0.0");
            nmGo.AddComponent<ConnectionManager>();

            // ---------------- Sistemas de juego en red (in-scene NetworkObject) ----------------
            var gameSystems = new GameObject("GameSystems");
            gameSystems.AddComponent<NetworkObject>();
            var teamManager = gameSystems.AddComponent<TeamManager>();
            SetProp(teamManager, "guardianPlayerPrefab", p.GuardianPlayer);
            SetProp(teamManager, "loggerPlayerPrefab", p.LoggerPlayer);
            gameSystems.AddComponent<GameLoopManager>();
            gameSystems.AddComponent<NetworkFx>();

            // ---------------- UI ----------------
            var ui = new GameObject("UI");
            ui.transform.SetParent(systems);
            ui.AddComponent<LobbyUI>();
            ui.AddComponent<HUDManager>();

            // ---------------- Cinemática ----------------
            var cinematic = new GameObject("IntroCinematic");
            cinematic.transform.SetParent(systems);
            var intro = cinematic.AddComponent<IntroCinematicController>();
            SetProp(intro, "heartTree", heart.transform);
            SetProp(intro, "guardianBase", guardianBase);
            SetProp(intro, "loggerBase", loggerBase);
            SetProp(intro, "clashOffsetZ", ClashZ);

            EditorSceneManager.MarkSceneDirty(scene);
            EditorSceneManager.SaveScene(scene, ScenePath);
        }

        static void SetupLightingAndFog(MaterialLibrary m, Light sun)
        {
            if (m.Skybox != null) RenderSettings.skybox = m.Skybox;
            RenderSettings.sun = sun;

            // Ambiente "trilight": cielo cálido, horizonte turquesa, suelo azulado (sombras azuladas).
            RenderSettings.ambientMode = AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = new Color(0.62f, 0.78f, 1.0f);
            RenderSettings.ambientEquatorColor = new Color(0.62f, 0.86f, 0.78f);
            RenderSettings.ambientGroundColor = new Color(0.42f, 0.38f, 0.68f);
            RenderSettings.ambientIntensity = 1f;

            // Niebla atmosférica ligera turquesa/dorada.
            RenderSettings.fog = true;
            RenderSettings.fogMode = FogMode.ExponentialSquared;
            RenderSettings.fogColor = new Color(0.66f, 0.87f, 0.80f);
            RenderSettings.fogDensity = 0.0085f;

            // Sin bakes: todo en tiempo real para iterar rápido.
            string lightingPath = SettingsDir + "/RootsAndRust_Lighting.lighting";
            var lighting = AssetDatabase.LoadAssetAtPath<LightingSettings>(lightingPath);
            if (lighting == null)
            {
                lighting = new LightingSettings { name = "RootsAndRust_Lighting" };
                AssetDatabase.CreateAsset(lighting, lightingPath);
            }
            lighting.bakedGI = false;
            lighting.realtimeGI = false;
            Lightmapping.lightingSettings = lighting;
            DynamicGI.UpdateEnvironment();
        }

        static VolumeProfile CreateVolumeProfile()
        {
            string path = SettingsDir + "/RootsAndRust_Volume.asset";
            var existing = AssetDatabase.LoadAssetAtPath<VolumeProfile>(path);
            if (existing != null) AssetDatabase.DeleteAsset(path);

            var profile = ScriptableObject.CreateInstance<VolumeProfile>();
            AssetDatabase.CreateAsset(profile, path);

            var tonemapping = profile.Add<Tonemapping>(true);
            tonemapping.mode.Override(TonemappingMode.Neutral);

            var bloom = profile.Add<Bloom>(true);
            bloom.threshold.Override(0.95f);
            bloom.intensity.Override(0.75f);
            bloom.scatter.Override(0.68f);
            bloom.tint.Override(new Color(1f, 0.9f, 0.82f));

            var color = profile.Add<ColorAdjustments>(true);
            color.postExposure.Override(0.15f);
            color.contrast.Override(14f);
            color.saturation.Override(30f);

            var split = profile.Add<SplitToning>(true);
            split.shadows.Override(new Color(0.42f, 0.5f, 0.95f));
            split.highlights.Override(new Color(1f, 0.86f, 0.62f));
            split.balance.Override(-15f);

            var vignette = profile.Add<Vignette>(true);
            vignette.intensity.Override(0.2f);
            vignette.smoothness.Override(0.5f);
            vignette.color.Override(new Color(0.18f, 0.08f, 0.35f));

            foreach (var component in profile.components)
                AssetDatabase.AddObjectToAsset(component, profile);
            EditorUtility.SetDirty(profile);
            AssetDatabase.SaveAssets();
            return profile;
        }

        // ---------------------------- Terreno procedural ----------------------------

        /// <summary>Altura del terreno (la misma función coloca árboles, bases y decorados).</summary>
        static float GroundHeight(float x, float z)
        {
            float distanceFromCenter = Mathf.Sqrt(x * x + z * z);
            float hills = (Mathf.PerlinNoise(x * 0.035f + 11.3f, z * 0.035f + 7.1f) - 0.5f) * 2.6f
                          + (Mathf.PerlinNoise(x * 0.09f + 3.7f, z * 0.09f + 1.9f) - 0.5f) * 0.7f;
            // Zonas planas: centro (Árbol Corazón) y bases.
            float flattenCenter = Mathf.SmoothStep(0f, 1f, Mathf.InverseLerp(9f, 24f, distanceFromCenter));
            float flattenBases = Mathf.SmoothStep(0f, 1f, Mathf.InverseLerp(6f, 14f, Mathf.Min(
                Vector2.Distance(new Vector2(x, z), new Vector2(-48f, 0f)),
                Vector2.Distance(new Vector2(x, z), new Vector2(48f, 0f)))));
            float edge = Mathf.Max(Mathf.Abs(x), Mathf.Abs(z)) / ArenaHalfSize;
            float rim = Mathf.SmoothStep(0f, 1f, Mathf.InverseLerp(0.86f, 1.02f, edge)) * 10f;
            return hills * flattenCenter * flattenBases + rim;
        }

        static Vector3 OnGround(float x, float z) => new Vector3(x, GroundHeight(x, z), z);

        static Mesh CreateGroundMesh()
        {
            const int segments = 120;
            float size = ArenaHalfSize * 2f + 10f;
            float half = size * 0.5f;
            int vertsPerSide = segments + 1;

            var vertices = new Vector3[vertsPerSide * vertsPerSide];
            var colors = new Color[vertices.Length];
            var uvs = new Vector2[vertices.Length];
            for (int iz = 0; iz < vertsPerSide; iz++)
            {
                for (int ix = 0; ix < vertsPerSide; ix++)
                {
                    float x = -half + size * ix / segments;
                    float z = -half + size * iz / segments;
                    int i = iz * vertsPerSide + ix;
                    vertices[i] = OnGround(x, z);
                    uvs[i] = new Vector2((float)ix / segments, (float)iz / segments);
                    colors[i] = GroundColor(x, z, vertices[i].y);
                }
            }

            var triangles = new int[segments * segments * 6];
            int t = 0;
            for (int iz = 0; iz < segments; iz++)
            {
                for (int ix = 0; ix < segments; ix++)
                {
                    int a = iz * vertsPerSide + ix;
                    int b = a + 1;
                    int c = a + vertsPerSide;
                    int d = c + 1;
                    triangles[t++] = a; triangles[t++] = c; triangles[t++] = b;
                    triangles[t++] = b; triangles[t++] = c; triangles[t++] = d;
                }
            }

            string path = MeshDir + "/ArenaGround.asset";
            var mesh = AssetDatabase.LoadAssetAtPath<Mesh>(path);
            bool isNew = mesh == null;
            if (isNew) mesh = new Mesh();
            mesh.Clear();
            mesh.name = "ArenaGround";
            mesh.indexFormat = UnityEngine.Rendering.IndexFormat.UInt32;
            mesh.vertices = vertices;
            mesh.colors = colors;
            mesh.uv = uvs;
            mesh.triangles = triangles;
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();
            if (isNew) AssetDatabase.CreateAsset(mesh, path);
            else EditorUtility.SetDirty(mesh);
            return mesh;
        }

        /// <summary>Colores del terreno: praderas esmeralda/lima al oeste, tierra ocre industrial al este.</summary>
        static Color GroundColor(float x, float z, float height)
        {
            float patches = Mathf.PerlinNoise(x * 0.06f + 50f, z * 0.06f + 20f);
            Color grass = Color.Lerp(Palette.GrassDeep, Palette.GrassLight, patches);

            // Manchas de pradera florida (toques magenta muy sutiles).
            float meadow = Mathf.PerlinNoise(x * 0.12f + 90f, z * 0.12f + 5f);
            if (meadow > 0.72f) grass = Color.Lerp(grass, new Color(0.85f, 0.95f, 0.45f), (meadow - 0.72f) * 2.5f);

            Color dirt = Color.Lerp(Palette.DirtOchre, new Color(0.95f, 0.72f, 0.38f), patches);
            float industrial = Mathf.SmoothStep(0f, 1f, Mathf.InverseLerp(14f, 46f, x + (patches - 0.5f) * 14f));
            Color color = Color.Lerp(grass, dirt, industrial * 0.85f);

            // Bordes elevados en tono turquesa/menta para contrastar con el cielo.
            float rim = Mathf.InverseLerp(2f, 9f, height);
            color = Color.Lerp(color, new Color(0.35f, 0.75f, 0.62f), rim * 0.6f);
            return color;
        }

        static void CreateBoundaryWalls(Transform parent)
        {
            var walls = new GameObject("Límites (invisibles)").transform;
            walls.SetParent(parent);
            float s = PlayableHalfSize;
            CreateWall(walls, new Vector3(0f, 10f, s + 1f), new Vector3(s * 2f + 4f, 30f, 2f));
            CreateWall(walls, new Vector3(0f, 10f, -s - 1f), new Vector3(s * 2f + 4f, 30f, 2f));
            CreateWall(walls, new Vector3(s + 1f, 10f, 0f), new Vector3(2f, 30f, s * 2f + 4f));
            CreateWall(walls, new Vector3(-s - 1f, 10f, 0f), new Vector3(2f, 30f, s * 2f + 4f));
        }

        static void CreateWall(Transform parent, Vector3 position, Vector3 size)
        {
            var wall = new GameObject("Wall");
            wall.transform.SetParent(parent);
            wall.transform.position = position;
            wall.AddComponent<BoxCollider>().size = size;
        }

        // ---------------------------- Decorados ----------------------------

        static void ScatterDecorations(Transform parent, MaterialLibrary m)
        {
            var rng = new Random(2024);
            var deco = new GameObject("Decorados").transform;
            deco.SetParent(parent);

            // Flores por toda la pradera (sin colisión).
            for (int i = 0; i < 160; i++)
            {
                float x = Lerp(rng, -PlayableHalfSize, 20f);
                float z = Lerp(rng, -PlayableHalfSize, PlayableHalfSize);
                if (Mathf.Sqrt(x * x + z * z) < 8f) continue;
                Vector3 pos = OnGround(x, z);
                var flower = new GameObject("Flor").transform;
                flower.SetParent(deco);
                flower.position = pos;
                flower.rotation = Quaternion.Euler(0f, Lerp(rng, 0f, 360f), 0f);
                CharacterVisualBuilder.Part(PrimitiveType.Cylinder, "Tallo", flower, new Vector3(0f, 0.2f, 0f), new Vector3(0.05f, 0.2f, 0.05f), m.Sprout);
                CharacterVisualBuilder.Part(PrimitiveType.Sphere, "Petalos", flower, new Vector3(0f, 0.42f, 0f), new Vector3(0.38f, 0.12f, 0.38f), rng.NextDouble() > 0.5 ? m.FlowerMagenta : m.FlowerYellow);
                CharacterVisualBuilder.Part(PrimitiveType.Sphere, "Centro", flower, new Vector3(0f, 0.47f, 0f), Vector3.one * 0.12f, m.FlowerYellow);
            }

            // Arbustos redondos (sin colisión) y setas en el lado del bosque.
            for (int i = 0; i < 40; i++)
            {
                float x = Lerp(rng, -PlayableHalfSize + 2f, 10f);
                float z = Lerp(rng, -PlayableHalfSize + 2f, PlayableHalfSize - 2f);
                if (Mathf.Sqrt(x * x + z * z) < 11f || Mathf.Abs(z - ClashZ) < 4f) continue;
                Vector3 pos = OnGround(x, z);
                bool mushroom = i % 4 == 0;
                var bush = new GameObject(mushroom ? "Seta" : "Arbusto").transform;
                bush.SetParent(deco);
                bush.position = pos;
                if (mushroom)
                {
                    CharacterVisualBuilder.Part(PrimitiveType.Cylinder, "Pie", bush, new Vector3(0f, 0.35f, 0f), new Vector3(0.25f, 0.35f, 0.25f), m.Guardian.skin);
                    CharacterVisualBuilder.Part(PrimitiveType.Sphere, "Sombrero", bush, new Vector3(0f, 0.75f, 0f), new Vector3(0.9f, 0.45f, 0.9f), m.Mushroom);
                }
                else
                {
                    float s = Lerp(rng, 0.9f, 1.6f);
                    CharacterVisualBuilder.Part(PrimitiveType.Sphere, "Bola", bush, new Vector3(0f, 0.4f * s, 0f), new Vector3(1.4f, 1f, 1.4f) * s, rng.NextDouble() > 0.5 ? m.LeavesA : m.LeavesC);
                }
            }

            // Rocas (con colisión: sirven de cobertura).
            for (int i = 0; i < 26; i++)
            {
                float x = Lerp(rng, -PlayableHalfSize + 3f, PlayableHalfSize - 3f);
                float z = Lerp(rng, -PlayableHalfSize + 3f, PlayableHalfSize - 3f);
                if (Mathf.Sqrt(x * x + z * z) < 12f || Mathf.Abs(Mathf.Abs(x) - 48f) < 7f && Mathf.Abs(z) < 10f) continue;
                if (Mathf.Abs(z - ClashZ) < 4f && Mathf.Abs(x) < 32f) continue;
                var rock = CharacterVisualBuilder.Part(PrimitiveType.Sphere, "Roca", deco, OnGround(x, z) + Vector3.up * 0.3f,
                    new Vector3(Lerp(rng, 1.6f, 3.2f), Lerp(rng, 1f, 2f), Lerp(rng, 1.6f, 3f)), m.Rock, new Vector3(0f, Lerp(rng, 0f, 360f), 0f));
                rock.AddComponent<SphereCollider>();
                GameObjectUtility.SetStaticEditorFlags(rock, StaticEditorFlags.BatchingStatic);
            }

            // Lado industrial: contenedores, pilas de troncos y barreras.
            for (int i = 0; i < 12; i++)
            {
                float x = Lerp(rng, 22f, PlayableHalfSize - 4f);
                float z = Lerp(rng, -PlayableHalfSize + 4f, PlayableHalfSize - 4f);
                if (Mathf.Abs(x - 48f) < 8f && Mathf.Abs(z) < 11f) continue;
                if (Mathf.Abs(z - ClashZ) < 4f) continue;
                Vector3 pos = OnGround(x, z);
                if (i % 3 == 0)
                {
                    var logs = new GameObject("Pila de troncos").transform;
                    logs.SetParent(deco);
                    logs.position = pos;
                    logs.rotation = Quaternion.Euler(0f, Lerp(rng, 0f, 180f), 0f);
                    for (int l = 0; l < 3; l++)
                    {
                        var log = CharacterVisualBuilder.Part(PrimitiveType.Cylinder, "Tronco" + l, logs,
                            new Vector3((l - 1) * 0.85f, 0.45f, 0f), new Vector3(0.8f, 1.6f, 0.8f), m.Stump, new Vector3(90f, 0f, 0f));
                        log.AddComponent<CapsuleCollider>();
                    }
                    var top = CharacterVisualBuilder.Part(PrimitiveType.Cylinder, "TroncoArriba", logs, new Vector3(0f, 1.2f, 0f), new Vector3(0.8f, 1.6f, 0.8f), m.Stump, new Vector3(90f, 0f, 0f));
                    top.AddComponent<CapsuleCollider>();
                }
                else
                {
                    var container = CharacterVisualBuilder.Part(PrimitiveType.Cube, "Contenedor", deco, pos + Vector3.up * 1.2f,
                        new Vector3(5f, 2.4f, 2.4f), i % 2 == 0 ? m.Industrial : m.Steel, new Vector3(0f, Lerp(rng, 0f, 180f), 0f));
                    container.AddComponent<BoxCollider>();
                    CharacterVisualBuilder.Part(PrimitiveType.Cube, "Franja", container.transform, new Vector3(0f, 0.3f, 0f), new Vector3(1.01f, 0.08f, 1.01f), m.Hazard);
                }
            }
        }

        // ---------------------------- Árbol Corazón ----------------------------

        static GameObject BuildHeartTree(MaterialLibrary m)
        {
            var root = new GameObject("Árbol Corazón");
            root.transform.position = OnGround(0f, 0f);

            var trunk = CharacterVisualBuilder.Part(PrimitiveType.Cylinder, "Tronco", root.transform, new Vector3(0f, 5f, 0f), new Vector3(2.6f, 5f, 2.6f), m.HeartBark);
            trunk.AddComponent<CapsuleCollider>();
            for (int i = 0; i < 6; i++)
            {
                float a = i * Mathf.PI / 3f;
                CharacterVisualBuilder.Part(PrimitiveType.Capsule, "Raiz" + i, root.transform,
                    new Vector3(Mathf.Cos(a) * 1.8f, 0.4f, Mathf.Sin(a) * 1.8f), new Vector3(0.9f, 1.4f, 0.9f), m.HeartBark,
                    new Vector3(0f, -a * Mathf.Rad2Deg, 65f));
            }
            for (int i = 0; i < 3; i++)
            {
                float a = i * Mathf.PI * 2f / 3f + 0.5f;
                CharacterVisualBuilder.Part(PrimitiveType.Capsule, "Rama" + i, root.transform,
                    new Vector3(Mathf.Cos(a) * 1.8f, 9.5f, Mathf.Sin(a) * 1.8f), new Vector3(0.7f, 2.2f, 0.7f), m.HeartBark,
                    new Vector3(0f, -a * Mathf.Rad2Deg, -45f));
            }

            var canopy = new GameObject("Copa").transform;
            canopy.SetParent(root.transform, false);
            canopy.localPosition = new Vector3(0f, 13f, 0f);
            CharacterVisualBuilder.Part(PrimitiveType.Sphere, "Centro", canopy, Vector3.zero, Vector3.one * 9f, m.HeartCanopy);
            CharacterVisualBuilder.Part(PrimitiveType.Sphere, "Lado1", canopy, new Vector3(4.2f, -1.2f, 1.5f), Vector3.one * 6f, m.LeavesA);
            CharacterVisualBuilder.Part(PrimitiveType.Sphere, "Lado2", canopy, new Vector3(-4f, -1f, -1.6f), Vector3.one * 6.2f, m.LeavesB);
            CharacterVisualBuilder.Part(PrimitiveType.Sphere, "Lado3", canopy, new Vector3(0.8f, -1.5f, -4.2f), Vector3.one * 5.4f, m.LeavesC);
            CharacterVisualBuilder.Part(PrimitiveType.Sphere, "Lado4", canopy, new Vector3(-0.6f, 3.2f, 1f), Vector3.one * 5f, m.HeartCanopy);
            var rng = new Random(77);
            for (int i = 0; i < 14; i++)
            {
                Vector3 dir = new Vector3(Lerp(rng, -1f, 1f), Lerp(rng, -0.3f, 1f), Lerp(rng, -1f, 1f)).normalized;
                CharacterVisualBuilder.Part(PrimitiveType.Sphere, "Flor" + i, canopy, dir * 5f, Vector3.one * Lerp(rng, 0.5f, 0.9f),
                    i % 2 == 0 ? m.FlowerMagenta : m.FlowerYellow);
            }

            // Núcleo brillante (el "corazón") visible entre las ramas.
            var core = CharacterVisualBuilder.Part(PrimitiveType.Sphere, "Nucleo", root.transform, new Vector3(0f, 8.5f, 1.35f), Vector3.one * 1.3f, m.HeartCore);
            var tint = core.AddComponent<ToonColorTint>();
            SetProp(tint, "amount", 0f);

            var lightGo = new GameObject("Luz del Corazón");
            lightGo.transform.SetParent(root.transform, false);
            lightGo.transform.localPosition = new Vector3(0f, 8.5f, 2.5f);
            var light = lightGo.AddComponent<Light>();
            light.type = LightType.Point;
            light.color = Palette.HeartGlow;
            light.range = 16f;
            light.intensity = 3f;
            light.shadows = LightShadows.None;

            var heart = root.AddComponent<HeartTree>();
            SetProp(heart, "canopy", canopy);
            SetProp(heart, "glowTint", tint);
            SetProp(heart, "heartLight", light);
            return root;
        }

        // ---------------------------- Árboles dinámicos ----------------------------

        static void PlaceDynamicTrees(GameObject treePrefab, Transform parent)
        {
            var rng = new Random(1337);
            var placed = new List<Vector2>();
            int attempts = 0;
            while (placed.Count < TreeCount && attempts < 5000)
            {
                attempts++;
                float angle = Lerp(rng, 0f, Mathf.PI * 2f);
                float radius = Lerp(rng, 13f, PlayableHalfSize - 6f);
                var p = new Vector2(Mathf.Cos(angle) * radius, Mathf.Sin(angle) * radius);

                if (Mathf.Abs(p.x) > PlayableHalfSize - 4f || Mathf.Abs(p.y) > PlayableHalfSize - 4f) continue;
                if (Mathf.Abs(Mathf.Abs(p.x) - 48f) < 9f && Mathf.Abs(p.y) < 12f) continue; // Bases libres.
                if (Mathf.Abs(p.y - ClashZ) < 5f && Mathf.Abs(p.x) < 34f) continue;        // Pasillo de la cinemática.

                bool tooClose = false;
                foreach (var other in placed)
                    if ((other - p).sqrMagnitude < 7f * 7f) { tooClose = true; break; }
                if (tooClose) continue;
                placed.Add(p);
            }

            for (int i = 0; i < placed.Count; i++)
            {
                var instance = (GameObject)PrefabUtility.InstantiatePrefab(treePrefab, parent);
                instance.name = "DynamicTree_" + (i + 1).ToString("00");
                instance.transform.position = OnGround(placed[i].x, placed[i].y) + Vector3.down * 0.05f;
                instance.transform.rotation = Quaternion.Euler(0f, Lerp(rng, 0f, 360f), 0f);
                float scale = Lerp(rng, 0.9f, 1.15f);
                instance.transform.localScale = Vector3.one * scale;

                // Variación de color por instancia en la copa (ToonVibrant _InstanceColor).
                var canopy = instance.transform.Find("Trunk/TrunkVisual/Canopy");
                if (canopy != null)
                {
                    var tint = canopy.gameObject.AddComponent<ToonColorTint>();
                    Color variation = Color.HSVToRGB(Lerp(rng, 0.22f, 0.42f), Lerp(rng, 0.75f, 0.95f), Lerp(rng, 0.75f, 0.95f));
                    tint.Set(variation, Lerp(rng, 0.2f, 0.45f));
                }
            }
        }

        // ---------------------------- Bases ----------------------------

        static Transform BuildBase(Team team, MaterialLibrary m, Transform parent)
        {
            bool guardian = team == Team.Guardianes;
            float side = guardian ? -1f : 1f;
            var root = new GameObject(guardian ? "Base Guardianes" : "Base Taladores").transform;
            root.SetParent(parent);
            root.position = OnGround(side * 48f, 0f);

            // Plataforma de aparición.
            CharacterVisualBuilder.Part(PrimitiveType.Cylinder, "Plataforma", root, new Vector3(0f, 0.05f, 0f), new Vector3(9f, 0.08f, 9f), guardian ? m.PadGuardian : m.PadLogger);

            // Bandera / tótem del equipo.
            var pole = CharacterVisualBuilder.Part(PrimitiveType.Cylinder, "Mastil", root, new Vector3(side * 5f, 3f, 5f), new Vector3(0.25f, 3f, 0.25f), guardian ? m.Bark : m.Steel);
            pole.AddComponent<CapsuleCollider>();
            CharacterVisualBuilder.Part(PrimitiveType.Cube, "Bandera", root, new Vector3(side * 5f - side * 1.1f, 5.2f, 5f), new Vector3(2f, 1.2f, 0.08f), guardian ? m.Guardian.glow : m.Logger.accent);

            Vector3 lookDir = new Vector3(-side, 0f, 0f);
            for (int i = 0; i < TeamInfo.MaxPerTeam; i++)
            {
                float z = (i - 1.5f) * 3f;
                var spawn = new GameObject("SpawnPoint_" + TeamInfo.ShortName(team) + "_" + (i + 1));
                spawn.transform.SetParent(root);
                spawn.transform.position = OnGround(side * 48f, z) + Vector3.up * 0.1f;
                spawn.transform.rotation = Quaternion.LookRotation(lookDir);
                var sp = spawn.AddComponent<SpawnPoint>();
                SetProp(sp, "team", team);
            }

            // Decoración temática.
            if (guardian)
            {
                for (int i = 0; i < 5; i++)
                {
                    float a = i * Mathf.PI * 2f / 5f;
                    CharacterVisualBuilder.Part(PrimitiveType.Sphere, "FlorGigante" + i, root,
                        new Vector3(Mathf.Cos(a) * 6.5f, 0.6f, Mathf.Sin(a) * 6.5f), new Vector3(1.4f, 0.4f, 1.4f), i % 2 == 0 ? m.FlowerMagenta : m.FlowerYellow);
                }
            }
            else
            {
                var crane = CharacterVisualBuilder.Part(PrimitiveType.Cube, "Maquina", root, new Vector3(side * 6.5f, 1.5f, -5f), new Vector3(3f, 3f, 4f), m.Industrial);
                crane.AddComponent<BoxCollider>();
                CharacterVisualBuilder.Part(PrimitiveType.Cylinder, "Chimenea", crane.transform, new Vector3(0.2f, 0.9f, 0.2f), new Vector3(0.2f, 0.5f, 0.2f), m.Charcoal);
                CharacterVisualBuilder.Part(PrimitiveType.Cube, "Rayas", crane.transform, new Vector3(0f, -0.3f, 0f), new Vector3(1.01f, 0.12f, 1.01f), m.Hazard);
            }
            return root;
        }

        // =====================================================================
        //  6. GUARDADO, IDs DE RED Y BUILD SETTINGS
        // =====================================================================

        static void SaveAndRefreshNetworkIds(PrefabLibrary prefabs)
        {
            // Prefabs: forzamos la generación del GlobalObjectIdHash.
            var onValidate = typeof(NetworkObject).GetMethod("OnValidate", BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public);
            foreach (var prefab in prefabs.NetworkPrefabs())
            {
                if (prefab == null) continue;
                var networkObject = prefab.GetComponent<NetworkObject>();
                if (networkObject != null && onValidate != null) onValidate.Invoke(networkObject, null);
                EditorUtility.SetDirty(prefab);
            }
            AssetDatabase.SaveAssets();

            // Escena: los NetworkObject colocados en escena sólo obtienen un ID válido una vez
            // guardada la escena. La reabrimos para que Netcode regenere los hashes y guardamos.
            var scene = EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Single);
            foreach (var networkObject in Object.FindObjectsByType<NetworkObject>(FindObjectsInactive.Include, FindObjectsSortMode.None))
            {
                if (onValidate != null) onValidate.Invoke(networkObject, null);
                EditorUtility.SetDirty(networkObject);
            }
            EditorSceneManager.MarkSceneDirty(scene);
            EditorSceneManager.SaveScene(scene);
        }

        static void AddSceneToBuildSettings()
        {
            var scenes = new List<EditorBuildSettingsScene>(EditorBuildSettings.scenes);
            scenes.RemoveAll(s => s.path == ScenePath);
            scenes.Insert(0, new EditorBuildSettingsScene(ScenePath, true));
            EditorBuildSettings.scenes = scenes.ToArray();
        }

        // =====================================================================
        //  UTILIDADES
        // =====================================================================

        /// <summary>Asigna un campo serializado (incluidos los privados [SerializeField]).</summary>
        static void SetProp(Object target, string propertyName, object value)
        {
            var so = new SerializedObject(target);
            var property = so.FindProperty(propertyName);
            if (property == null)
            {
                Debug.LogWarning("[Roots & Rust] No existe la propiedad '" + propertyName + "' en " + target.GetType().Name);
                return;
            }

            switch (value)
            {
                case null:
                    property.objectReferenceValue = null;
                    break;
                case Object obj:
                    property.objectReferenceValue = obj;
                    break;
                case bool b:
                    property.boolValue = b;
                    break;
                case int i:
                    property.intValue = i;
                    break;
                case float f:
                    property.floatValue = f;
                    break;
                case Enum e:
                    property.enumValueIndex = Array.IndexOf(Enum.GetValues(e.GetType()), e);
                    break;
                case Vector3 v:
                    property.vector3Value = v;
                    break;
                case Color c:
                    property.colorValue = c;
                    break;
                default:
                    Debug.LogWarning("[Roots & Rust] Tipo no soportado en SetProp: " + value.GetType());
                    break;
            }
            so.ApplyModifiedPropertiesWithoutUndo();
        }

        static void SetIfExists(SerializedObject so, string propertyName, object value)
        {
            var property = so.FindProperty(propertyName);
            if (property == null) return;
            if (value is bool b && property.propertyType == SerializedPropertyType.Boolean) property.boolValue = b;
            else if (value is int i && (property.propertyType == SerializedPropertyType.Integer || property.propertyType == SerializedPropertyType.Enum))
                property.intValue = i; // Para enums, intValue es el valor subyacente (p. ej. 2048).

        }

        static float Lerp(Random rng, float min, float max) => min + (float)rng.NextDouble() * (max - min);

        static Vector2 RandomInCircle(Random rng, float radius)
        {
            float angle = (float)rng.NextDouble() * Mathf.PI * 2f;
            float r = Mathf.Sqrt((float)rng.NextDouble()) * radius;
            return new Vector2(Mathf.Cos(angle) * r, Mathf.Sin(angle) * r);
        }
    }
}
