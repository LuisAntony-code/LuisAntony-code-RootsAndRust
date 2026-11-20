using RootsAndRust.Core;
using UnityEngine;

namespace RootsAndRust.Player
{
    /// <summary>
    /// Animación procedural elástica (squash & stretch) sin Animator:
    ///  - Se estira al saltar / caer rápido y se aplasta al aterrizar.
    ///  - "Golpe" elástico al disparar o recibir daño (Punch).
    ///  - Rebote al caminar e inclinación hacia la dirección de movimiento.
    /// Calcula la velocidad a partir del movimiento del transform, así que funciona
    /// igual para el jugador local, los jugadores remotos y los figurantes de la cinemática.
    /// </summary>
    public class ProceduralSquash : MonoBehaviour
    {
        [SerializeField] Transform pivot;

        [Header("Muelle")]
        [SerializeField] float stiffness = 260f;
        [SerializeField] float damping = 13f;

        [Header("Estiramiento")]
        [SerializeField] float verticalStretch = 0.03f;
        [SerializeField] float maxStretch = 0.28f;
        [SerializeField] float landingSquash = 0.4f;

        [Header("Caminar")]
        [SerializeField] float bobHeight = 0.09f;
        [SerializeField] float bobFrequency = 1.7f;
        [SerializeField] float leanAngle = 2.2f;

        SpringFloat m_Squash = new SpringFloat(1f);
        SpringFloat m_Visibility = new SpringFloat(1f);
        float m_VisibleTarget = 1f;
        Vector3 m_LastPosition;
        float m_PreviousVerticalSpeed;
        float m_BobPhase;
        Quaternion m_Lean = Quaternion.identity;
        Vector3 m_BaseLocalPosition;
        bool m_HasPivot;

        public Transform Pivot
        {
            get => pivot;
            set { pivot = value; CachePivot(); }
        }

        void Awake()
        {
            if (pivot == null)
            {
                var found = transform.Find("Visual/SquashPivot");
                if (found != null) pivot = found;
            }
            CachePivot();
            m_LastPosition = transform.position;
        }

        void CachePivot()
        {
            m_HasPivot = pivot != null;
            if (m_HasPivot) m_BaseLocalPosition = pivot.localPosition;
        }

        /// <summary>Impulso elástico: positivo estira, negativo aplasta.</summary>
        public void Punch(float impulse)
        {
            m_Squash.Velocity += impulse;
        }

        /// <summary>Estirón de salto.</summary>
        public void OnJump()
        {
            m_Squash.Velocity += 7f;
        }

        /// <summary>Muestra u oculta el personaje con un "pop" elástico.</summary>
        public void SetVisible(bool visible, bool instant)
        {
            m_VisibleTarget = visible ? 1f : 0f;
            if (instant)
            {
                m_Visibility.Value = m_VisibleTarget;
                m_Visibility.Velocity = 0f;
            }
            else if (visible)
            {
                m_Visibility.Value = 0.05f;
            }
        }

        void LateUpdate()
        {
            if (!m_HasPivot) return;
            float dt = Mathf.Max(Time.deltaTime, 0.0001f);

            Vector3 velocity = (transform.position - m_LastPosition) / dt;
            m_LastPosition = transform.position;
            // Evita picos por teletransporte.
            if (velocity.sqrMagnitude > 900f) velocity = Vector3.zero;

            float vy = velocity.y;
            // Aterrizaje: veníamos cayendo rápido y de golpe paramos.
            if (m_PreviousVerticalSpeed < -4f && vy > -1f)
                m_Squash.Velocity -= Mathf.Min(-m_PreviousVerticalSpeed * landingSquash, 9f);
            m_PreviousVerticalSpeed = vy;

            float stretchTarget = 1f + Mathf.Clamp(Mathf.Abs(vy) * verticalStretch, 0f, maxStretch);
            float s = m_Squash.Step(stretchTarget, stiffness, damping, dt);
            s = Mathf.Clamp(s, 0.45f, 1.7f);

            float visibility = Mathf.Max(0f, m_Visibility.Step(m_VisibleTarget, 220f, 14f, dt));

            // Conservación de volumen: si se estira en Y, se adelgaza en XZ.
            float xz = 1f / Mathf.Sqrt(s);
            pivot.localScale = new Vector3(xz, s, xz) * visibility;

            // Rebote al caminar.
            Vector3 planar = new Vector3(velocity.x, 0f, velocity.z);
            float speed = planar.magnitude;
            bool walking = speed > 0.6f && Mathf.Abs(vy) < 1.5f;
            if (walking) m_BobPhase += dt * speed * bobFrequency;
            float bob = walking ? Mathf.Abs(Mathf.Sin(m_BobPhase)) * bobHeight * Mathf.Clamp01(speed / 6f) : 0f;
            pivot.localPosition = Vector3.Lerp(pivot.localPosition, m_BaseLocalPosition + Vector3.up * bob, 1f - Mathf.Exp(-20f * dt));

            // Inclinación hacia donde se mueve.
            Vector3 local = transform.InverseTransformDirection(planar);
            Quaternion targetLean = Quaternion.Euler(local.z * leanAngle, 0f, -local.x * leanAngle);
            m_Lean = Quaternion.Slerp(m_Lean, targetLean, 1f - Mathf.Exp(-8f * dt));
            pivot.localRotation = m_Lean;
        }
    }
}
