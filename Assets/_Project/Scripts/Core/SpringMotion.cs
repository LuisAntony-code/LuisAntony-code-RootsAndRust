using UnityEngine;

namespace RootsAndRust.Core
{
    /// <summary>
    /// Muelle amortiguado (escalar). Base de todas las animaciones "elásticas"
    /// del juego: squash & stretch, crecimiento de árboles, aparición de zonas...
    /// Rigidez alta + amortiguación baja = rebote cartoon.
    /// </summary>
    public struct SpringFloat
    {
        public float Value;
        public float Velocity;

        public SpringFloat(float initial)
        {
            Value = initial;
            Velocity = 0f;
        }

        public float Step(float target, float stiffness, float damping, float deltaTime)
        {
            // Sub-pasos para mantener estabilidad con framerates bajos.
            int steps = Mathf.Clamp(Mathf.CeilToInt(deltaTime / 0.008f), 1, 8);
            float dt = deltaTime / steps;
            for (int i = 0; i < steps; i++)
            {
                float force = (target - Value) * stiffness - Velocity * damping;
                Velocity += force * dt;
                Value += Velocity * dt;
            }
            return Value;
        }
    }

    /// <summary>
    /// Componente reutilizable: hace "pop" elástico de la escala de un transform.
    /// Llama a Pop() para que la escala arranque desde un factor y rebote hasta su valor base.
    /// </summary>
    public class ElasticPop : MonoBehaviour
    {
        [SerializeField] float stiffness = 180f;
        [SerializeField] float damping = 11f;
        [SerializeField] bool popOnEnable = true;
        [SerializeField] float startFactor = 0.05f;

        Vector3 m_BaseScale;
        SpringFloat m_Spring = new SpringFloat(1f);
        float m_Target = 1f;
        bool m_Initialized;

        /// <summary>Multiplicador de velocidad (p. ej. Frenesí Final).</summary>
        public float SpeedMultiplier { get; set; } = 1f;

        void Awake()
        {
            Init();
        }

        void Init()
        {
            if (m_Initialized) return;
            m_BaseScale = transform.localScale;
            m_Initialized = true;
        }

        void OnEnable()
        {
            Init();
            if (popOnEnable) Pop(startFactor);
        }

        /// <summary>Reinicia la animación desde <paramref name="fromFactor"/> (0 = invisible) hacia 1.</summary>
        public void Pop(float fromFactor)
        {
            Init();
            m_Spring.Value = fromFactor;
            m_Spring.Velocity = 0f;
            m_Target = 1f;
            Apply();
        }

        /// <summary>Encoge el objeto hasta desaparecer (sin destruirlo).</summary>
        public void Shrink()
        {
            m_Target = 0f;
        }

        /// <summary>Golpe elástico sin reiniciar (impulso positivo = estira, negativo = aplasta).</summary>
        public void Punch(float impulse)
        {
            m_Spring.Velocity += impulse;
        }

        void Update()
        {
            float speed = Mathf.Max(0.1f, SpeedMultiplier);
            m_Spring.Step(m_Target, stiffness * speed * speed, damping * speed, Time.deltaTime);
            Apply();
        }

        void Apply()
        {
            transform.localScale = m_BaseScale * Mathf.Max(0f, m_Spring.Value);
        }
    }
}
