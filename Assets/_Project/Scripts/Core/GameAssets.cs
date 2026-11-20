using System;
using UnityEngine;

namespace RootsAndRust.Core
{
    /// <summary>
    /// Juego de materiales para construir un personaje con primitivas.
    /// </summary>
    [Serializable]
    public class CharacterMaterialSet
    {
        public Material body;
        public Material accent;
        public Material detail;
        public Material skin;
        public Material weapon;
        public Material glow;
    }

    /// <summary>
    /// Registro central de assets del proyecto (prefabs, materiales).
    /// Vive en Assets/_Project/Resources/GameAssets.asset y lo genera el
    /// asistente "RootsAndRust > 1. Generar Escena y Prefabs Jugables".
    /// Sirve de red de seguridad: si algún campo serializado de un script quedó
    /// vacío, el script lo busca aquí y así nunca hay referencias nulas.
    /// </summary>
    [CreateAssetMenu(fileName = "GameAssets", menuName = "RootsAndRust/Game Assets")]
    public class GameAssets : ScriptableObject
    {
        public const string ResourcePath = "GameAssets";

        static GameAssets s_Instance;

        /// <summary>Instancia cargada desde Resources (puede ser null si no se ejecutó el asistente).</summary>
        public static GameAssets Instance
        {
            get
            {
                if (s_Instance == null) s_Instance = Resources.Load<GameAssets>(ResourcePath);
                return s_Instance;
            }
        }

        [Header("Jugadores")]
        public GameObject guardianPlayerPrefab;
        public GameObject loggerPlayerPrefab;

        [Header("Proyectiles")]
        public GameObject sporeProjectilePrefab;
        public GameObject sawProjectilePrefab;

        [Header("Zonas de efecto")]
        public GameObject bioZonePrefab;
        public GameObject scorchZonePrefab;

        [Header("Materiales de personaje")]
        public CharacterMaterialSet guardianMaterials = new CharacterMaterialSet();
        public CharacterMaterialSet loggerMaterials = new CharacterMaterialSet();

        [Header("VFX")]
        [Tooltip("Material URP Particles/Unlit usado por todas las partículas generadas por código.")]
        public Material particleMaterial;

        public GameObject GetPlayerPrefab(Team team)
        {
            return team == Team.Taladores ? loggerPlayerPrefab : guardianPlayerPrefab;
        }

        public CharacterMaterialSet GetMaterials(Team team)
        {
            return team == Team.Taladores ? loggerMaterials : guardianMaterials;
        }
    }
}
