using UnityEngine;

namespace RootsAndRust.Core
{
    /// <summary>
    /// Referencias a las piezas importantes de un personaje construido con primitivas.
    /// </summary>
    public class CharacterRig
    {
        public Transform Root;
        /// <summary>Pivote a la altura de los pies: se escala para hacer squash & stretch.</summary>
        public Transform SquashPivot;
        public Transform Head;
        public Transform Weapon;
        /// <summary>Punto de salida de los proyectiles.</summary>
        public Transform Muzzle;
    }

    /// <summary>
    /// Construye personajes "chibi" estilizados con primitivas de Unity
    /// (cápsulas, esferas, cilindros). Lo usan:
    ///  - El asistente de editor para crear los prefabs de jugador.
    ///  - La cinemática de apertura para crear figurantes.
    /// Sustituye estos modelos por FBX reales cuando el equipo de arte los tenga:
    /// sólo hay que mantener los nombres "SquashPivot" y "Muzzle".
    /// </summary>
    public static class CharacterVisualBuilder
    {
        public static CharacterRig Build(Team team, CharacterMaterialSet mats, Transform parent)
        {
            if (mats == null) mats = new CharacterMaterialSet();
            var rig = new CharacterRig();

            var root = new GameObject("Visual").transform;
            root.SetParent(parent, false);
            rig.Root = root;

            var pivot = new GameObject("SquashPivot").transform;
            pivot.SetParent(root, false);
            rig.SquashPivot = pivot;

            // ---------------- Cuerpo común ----------------
            Part(PrimitiveType.Capsule, "Torso", pivot, new Vector3(0f, 0.92f, 0f), new Vector3(0.82f, 0.58f, 0.74f), mats.body);
            Part(PrimitiveType.Capsule, "LegL", pivot, new Vector3(-0.2f, 0.28f, 0f), new Vector3(0.26f, 0.28f, 0.26f), mats.detail);
            Part(PrimitiveType.Capsule, "LegR", pivot, new Vector3(0.2f, 0.28f, 0f), new Vector3(0.26f, 0.28f, 0.26f), mats.detail);
            Part(PrimitiveType.Capsule, "ArmL", pivot, new Vector3(-0.48f, 1.0f, 0.05f), new Vector3(0.2f, 0.32f, 0.2f), mats.body, new Vector3(0f, 0f, -18f));
            Part(PrimitiveType.Capsule, "ArmR", pivot, new Vector3(0.48f, 1.0f, 0.12f), new Vector3(0.2f, 0.32f, 0.2f), mats.body, new Vector3(-60f, 0f, 10f));

            var head = Part(PrimitiveType.Sphere, "Head", pivot, new Vector3(0f, 1.62f, 0f), new Vector3(0.62f, 0.58f, 0.58f), mats.skin).transform;
            rig.Head = head;
            // Ojos grandes y simpáticos.
            Part(PrimitiveType.Sphere, "EyeL", head, new Vector3(-0.17f, 0.05f, 0.44f), new Vector3(0.14f, 0.2f, 0.08f), mats.detail);
            Part(PrimitiveType.Sphere, "EyeR", head, new Vector3(0.17f, 0.05f, 0.44f), new Vector3(0.14f, 0.2f, 0.08f), mats.detail);

            // ---------------- Arma (montada en el brazo derecho) ----------------
            var weapon = new GameObject("Weapon").transform;
            weapon.SetParent(pivot, false);
            weapon.localPosition = new Vector3(0.52f, 1.05f, 0.45f);
            rig.Weapon = weapon;

            if (team == Team.Guardianes) BuildGuardian(pivot, head, weapon, mats);
            else BuildLogger(pivot, head, weapon, mats);

            var muzzle = new GameObject("Muzzle").transform;
            muzzle.SetParent(weapon, false);
            muzzle.localPosition = new Vector3(0f, 0f, 0.85f);
            rig.Muzzle = muzzle;

            return rig;
        }

        static void BuildGuardian(Transform pivot, Transform head, Transform weapon, CharacterMaterialSet mats)
        {
            // Capucha de hoja + flor magenta en la cabeza.
            Part(PrimitiveType.Sphere, "LeafHood", head, new Vector3(0f, 0.28f, -0.05f), new Vector3(1.08f, 0.62f, 1.08f), mats.accent);
            var flower = new GameObject("Flower").transform;
            flower.SetParent(head, false);
            flower.localPosition = new Vector3(0.22f, 0.62f, 0.05f);
            for (int i = 0; i < 5; i++)
            {
                float a = i * Mathf.PI * 2f / 5f;
                Part(PrimitiveType.Sphere, "Petal" + i, flower, new Vector3(Mathf.Cos(a) * 0.14f, 0f, Mathf.Sin(a) * 0.14f), new Vector3(0.16f, 0.06f, 0.16f), mats.glow);
            }
            Part(PrimitiveType.Sphere, "FlowerCore", flower, Vector3.up * 0.02f, Vector3.one * 0.12f, mats.weapon);

            // Mochila de musgo con un brote.
            Part(PrimitiveType.Cube, "Backpack", pivot, new Vector3(0f, 1.0f, -0.42f), new Vector3(0.55f, 0.6f, 0.3f), mats.accent);
            Part(PrimitiveType.Capsule, "Sprout", pivot, new Vector3(0.12f, 1.45f, -0.45f), new Vector3(0.08f, 0.22f, 0.08f), mats.body);
            Part(PrimitiveType.Sphere, "SproutLeaf", pivot, new Vector3(0.12f, 1.7f, -0.45f), new Vector3(0.24f, 0.1f, 0.18f), mats.accent);

            // Lanzador de Bio-Esporas: tubo lima + bulbo magenta brillante.
            Part(PrimitiveType.Cylinder, "Barrel", weapon, new Vector3(0f, 0f, 0.35f), new Vector3(0.18f, 0.4f, 0.18f), mats.accent, new Vector3(90f, 0f, 0f));
            Part(PrimitiveType.Sphere, "SporeBulb", weapon, new Vector3(0f, 0.16f, 0.05f), Vector3.one * 0.3f, mats.glow);
            Part(PrimitiveType.Sphere, "Nozzle", weapon, new Vector3(0f, 0f, 0.78f), new Vector3(0.24f, 0.24f, 0.12f), mats.weapon);
        }

        static void BuildLogger(Transform pivot, Transform head, Transform weapon, CharacterMaterialSet mats)
        {
            // Casco de obra naranja con visera.
            Part(PrimitiveType.Sphere, "HardHat", head, new Vector3(0f, 0.25f, 0f), new Vector3(1.05f, 0.6f, 1.05f), mats.accent);
            Part(PrimitiveType.Cylinder, "HatBrim", head, new Vector3(0f, 0.18f, 0.08f), new Vector3(1.2f, 0.02f, 1.25f), mats.accent);
            Part(PrimitiveType.Cube, "Visor", head, new Vector3(0f, 0.04f, 0.42f), new Vector3(0.62f, 0.14f, 0.1f), mats.glow);

            // Chaleco reflectante de acero con franjas.
            Part(PrimitiveType.Cube, "Vest", pivot, new Vector3(0f, 0.98f, 0.12f), new Vector3(0.7f, 0.5f, 0.55f), mats.detail);
            Part(PrimitiveType.Cube, "Stripe", pivot, new Vector3(0f, 1.02f, 0.4f), new Vector3(0.72f, 0.08f, 0.04f), mats.glow);
            Part(PrimitiveType.Cube, "FuelTank", pivot, new Vector3(0f, 1.0f, -0.42f), new Vector3(0.45f, 0.7f, 0.28f), mats.accent);

            // Cañón de Sierras Térmicas: cuerpo de acero + disco con brillo ámbar.
            Part(PrimitiveType.Cube, "CannonBody", weapon, new Vector3(0f, 0f, 0.3f), new Vector3(0.26f, 0.26f, 0.7f), mats.weapon);
            Part(PrimitiveType.Cylinder, "SawDisc", weapon, new Vector3(0f, 0.18f, 0.35f), new Vector3(0.5f, 0.02f, 0.5f), mats.glow);
            Part(PrimitiveType.Cylinder, "Exhaust", weapon, new Vector3(0.12f, 0.12f, -0.05f), new Vector3(0.08f, 0.15f, 0.08f), mats.detail);
        }

        /// <summary>Crea una primitiva sin collider con el material dado.</summary>
        public static GameObject Part(PrimitiveType type, string name, Transform parent, Vector3 localPos, Vector3 localScale,
            Material material, Vector3 localEuler = default)
        {
            var go = GameObject.CreatePrimitive(type);
            go.name = name;
            var col = go.GetComponent<Collider>();
            if (col != null) Object.DestroyImmediate(col);
            go.transform.SetParent(parent, false);
            go.transform.localPosition = localPos;
            go.transform.localRotation = Quaternion.Euler(localEuler);
            go.transform.localScale = localScale;
            var renderer = go.GetComponent<MeshRenderer>();
            if (material != null) renderer.sharedMaterial = material;
            return go;
        }
    }
}
