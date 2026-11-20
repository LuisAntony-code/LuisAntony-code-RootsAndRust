using RootsAndRust.Core;
using UnityEngine;

namespace RootsAndRust.Gameplay
{
    /// <summary>
    /// El Árbol Corazón del centro del mapa: late con un brillo rosado, respira
    /// (escala elástica suave) y se acelera durante el Frenesí Final.
    /// Es decorativo/indestructible y sirve de referencia para la cinemática.
    /// </summary>
    public class HeartTree : MonoBehaviour
    {
        public static HeartTree Instance { get; private set; }

        [SerializeField] Transform canopy;
        [SerializeField] ToonColorTint glowTint;
        [SerializeField] Light heartLight;
        [SerializeField] float beatsPerMinute = 50f;
        [SerializeField] float breathAmount = 0.035f;
        [SerializeField] Color glowColor = new Color(1f, 0.35f, 0.75f);

        Vector3 m_CanopyScale = Vector3.one;
        float m_Phase;
        float m_BaseLightIntensity;
        ParticleSystem m_Petals;

        /// <summary>Punto al que mira la cinemática.</summary>
        public Vector3 FocusPoint => transform.position + Vector3.up * 7f;

        void Awake()
        {
            Instance = this;
            if (canopy != null) m_CanopyScale = canopy.localScale;
            if (heartLight != null) m_BaseLightIntensity = heartLight.intensity;
        }

        void Start()
        {
            // Pétalos y esporas flotando alrededor del árbol.
            m_Petals = VfxFactory.Emitter(transform, Vector3.up * 9f, Palette.FlowerMagenta, Palette.FlowerYellow,
                8f, 0.6f, 0.3f, 4f, 0.05f, 5f);
        }

        void OnDestroy()
        {
            if (Instance == this) Instance = null;
        }

        void Update()
        {
            float speed = GameLoopManager.FrenzyMultiplier;
            m_Phase += Time.deltaTime * beatsPerMinute / 60f * speed;

            // Latido doble ("lub-dub") con una curva suave.
            float t = m_Phase % 1f;
            float beat = Mathf.Exp(-Mathf.Pow((t - 0.1f) * 14f, 2f)) + 0.6f * Mathf.Exp(-Mathf.Pow((t - 0.3f) * 14f, 2f));

            if (canopy != null)
            {
                float s = 1f + beat * breathAmount;
                canopy.localScale = new Vector3(m_CanopyScale.x * s, m_CanopyScale.y * (1f + beat * breathAmount * 0.5f), m_CanopyScale.z * s);
            }

            if (glowTint != null) glowTint.SetEmission(glowColor * (0.25f + beat * 1.6f * speed));
            if (heartLight != null) heartLight.intensity = m_BaseLightIntensity * (0.7f + beat * 0.8f);
        }
    }
}
