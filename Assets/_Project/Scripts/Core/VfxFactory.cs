using UnityEngine;

namespace RootsAndRust.Core
{
    /// <summary>Tipos de efecto visual que se pueden disparar (también por red).</summary>
    public enum FxKind : byte
    {
        SporeImpact,
        SawImpact,
        WoodChips,
        Regrow,
        Crush,
        PlayerHit,
        PlayerDeath,
        MuzzleSpore,
        MuzzleSaw,
        Confetti,
        Dash
    }

    /// <summary>
    /// Fábrica de partículas generadas 100% por código (no necesita prefabs de VFX).
    /// Todas usan el material de partículas de GameAssets (URP Particles/Unlit) y la
    /// paleta vibrante del juego. Las partículas opacas + emisión intensa se ven
    /// geniales con el Bloom del Volume global.
    /// </summary>
    public static class VfxFactory
    {
        static Material s_FallbackMaterial;

        static Material ParticleMaterial
        {
            get
            {
                var assets = GameAssets.Instance;
                if (assets != null && assets.particleMaterial != null) return assets.particleMaterial;
                if (s_FallbackMaterial == null)
                {
                    var shader = Shader.Find("Universal Render Pipeline/Particles/Unlit");
                    if (shader == null) shader = Shader.Find("Sprites/Default");
                    s_FallbackMaterial = new Material(shader) { name = "RR_ParticleFallback" };
                }
                return s_FallbackMaterial;
            }
        }

        /// <summary>Reproduce un efecto preconfigurado.</summary>
        public static void Play(FxKind kind, Vector3 position, float scale = 1f)
        {
            switch (kind)
            {
                case FxKind.SporeImpact:
                    Burst(position, Palette.Lime, Palette.FlowerMagenta, 26, 5f * scale, 0.28f * scale, 0.7f, -0.6f);
                    Burst(position, Palette.FlowerYellow, Palette.Emerald, 10, 2.5f * scale, 0.45f * scale, 1.1f, -0.2f);
                    break;
                case FxKind.SawImpact:
                    Burst(position, Palette.SparkAmber, Palette.IndustrialOrange, 30, 9f * scale, 0.16f * scale, 0.45f, 1.6f);
                    break;
                case FxKind.WoodChips:
                    Burst(position, Palette.Bark, Palette.DirtOchre, 22, 6f * scale, 0.3f * scale, 0.9f, 2.2f);
                    Burst(position + Vector3.up * 3f, Palette.Lime, Palette.Emerald, 30, 4f * scale, 0.35f * scale, 1.4f, 0.6f);
                    break;
                case FxKind.Regrow:
                    Burst(position, Palette.Lime, Palette.FlowerMagenta, 40, 6f * scale, 0.32f * scale, 1.2f, -0.4f);
                    Burst(position + Vector3.up * 2f, Palette.FlowerYellow, Palette.Emerald, 25, 3f * scale, 0.5f * scale, 1.6f, -0.3f);
                    break;
                case FxKind.Crush:
                    Burst(position, Palette.DirtOchre, Palette.Bark, 36, 7f * scale, 0.45f * scale, 0.8f, 2.5f);
                    break;
                case FxKind.PlayerHit:
                    Burst(position, Color.white, Palette.FlowerYellow, 12, 4f * scale, 0.22f * scale, 0.35f, 0.5f);
                    break;
                case FxKind.PlayerDeath:
                    Burst(position, Palette.FlowerMagenta, Palette.SparkAmber, 50, 7f * scale, 0.35f * scale, 1.0f, 0.4f);
                    Burst(position, Color.white, Palette.FogTurquoise, 20, 2f * scale, 0.8f * scale, 0.9f, -0.5f);
                    break;
                case FxKind.MuzzleSpore:
                    Burst(position, Palette.Lime, Palette.FlowerMagenta, 8, 2.5f * scale, 0.18f * scale, 0.25f, 0f);
                    break;
                case FxKind.MuzzleSaw:
                    Burst(position, Palette.SparkAmber, Color.white, 10, 4f * scale, 0.12f * scale, 0.2f, 0.5f);
                    break;
                case FxKind.Confetti:
                    Burst(position, Palette.FlowerMagenta, Palette.FlowerYellow, 40, 8f * scale, 0.3f * scale, 2.2f, 0.6f);
                    Burst(position, Palette.Lime, Palette.IndustrialOrange, 40, 8f * scale, 0.3f * scale, 2.2f, 0.6f);
                    break;
                case FxKind.Dash:
                    Burst(position, Palette.SparkAmber, Palette.Charcoal, 18, 3f * scale, 0.3f * scale, 0.4f, 0f);
                    break;
            }
        }

        /// <summary>
        /// Explosión puntual de partículas que se autodestruye.
        /// </summary>
        public static ParticleSystem Burst(Vector3 position, Color colorA, Color colorB, int count, float speed,
            float size, float lifetime, float gravity)
        {
            var ps = CreateSystem("VFX_Burst", position, colorA, colorB, speed, size, lifetime, gravity);
            var emission = ps.emission;
            emission.rateOverTime = 0f;
            emission.SetBursts(new[] { new ParticleSystem.Burst(0f, (short)Mathf.Clamp(count, 1, 500)) });
            var main = ps.main;
            main.loop = false;
            main.stopAction = ParticleSystemStopAction.Destroy;
            ps.gameObject.SetActive(true);
            ps.Play();
            return ps;
        }

        /// <summary>
        /// Emisor continuo (fuente de partículas). Útil para zonas, árbol corazón y frenesí.
        /// El llamador es responsable de destruirlo.
        /// </summary>
        public static ParticleSystem Emitter(Transform parent, Vector3 localPosition, Color colorA, Color colorB,
            float rate, float speed, float size, float lifetime, float gravity, float radius)
        {
            var ps = CreateSystem("VFX_Emitter", Vector3.zero, colorA, colorB, speed, size, lifetime, gravity);
            ps.transform.SetParent(parent, false);
            ps.transform.localPosition = localPosition;
            var main = ps.main;
            main.loop = true;
            main.simulationSpace = ParticleSystemSimulationSpace.World;
            var emission = ps.emission;
            emission.rateOverTime = rate;
            var shape = ps.shape;
            shape.shapeType = ParticleSystemShapeType.Circle;
            shape.radius = radius;
            shape.rotation = new Vector3(-90f, 0f, 0f);
            ps.gameObject.SetActive(true);
            ps.Play();
            return ps;
        }

        static ParticleSystem CreateSystem(string name, Vector3 position, Color colorA, Color colorB, float speed,
            float size, float lifetime, float gravity)
        {
            var go = new GameObject(name);
            go.SetActive(false);
            go.transform.position = position;
            var ps = go.AddComponent<ParticleSystem>();
            ps.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);

            var main = ps.main;
            main.duration = 1f;
            main.playOnAwake = false;
            main.startLifetime = new ParticleSystem.MinMaxCurve(lifetime * 0.6f, lifetime);
            main.startSpeed = new ParticleSystem.MinMaxCurve(speed * 0.4f, speed);
            main.startSize = new ParticleSystem.MinMaxCurve(size * 0.5f, size);
            main.startColor = new ParticleSystem.MinMaxGradient(colorA, colorB);
            main.gravityModifier = gravity;
            main.maxParticles = 600;
            main.startRotation = new ParticleSystem.MinMaxCurve(0f, Mathf.PI * 2f);

            var shape = ps.shape;
            shape.shapeType = ParticleSystemShapeType.Sphere;
            shape.radius = 0.2f;

            // Las partículas "hacen pop" y se encogen (squash & stretch también en VFX).
            var sizeOverLifetime = ps.sizeOverLifetime;
            sizeOverLifetime.enabled = true;
            var curve = new AnimationCurve(
                new Keyframe(0f, 0.2f),
                new Keyframe(0.12f, 1.25f),
                new Keyframe(0.3f, 1f),
                new Keyframe(1f, 0f));
            sizeOverLifetime.size = new ParticleSystem.MinMaxCurve(1f, curve);

            var rotation = ps.rotationOverLifetime;
            rotation.enabled = true;
            rotation.z = new ParticleSystem.MinMaxCurve(-4f, 4f);

            var renderer = go.GetComponent<ParticleSystemRenderer>();
            renderer.sharedMaterial = ParticleMaterial;
            renderer.renderMode = ParticleSystemRenderMode.Billboard;
            renderer.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            renderer.receiveShadows = false;
            return ps;
        }
    }
}
