using RootsAndRust.Cinematic;
using RootsAndRust.Core;
using RootsAndRust.Gameplay;
using Unity.Netcode;
using Unity.Netcode.Components;
using UnityEngine;
using UnityEngine.EventSystems;

namespace RootsAndRust.Player
{
    /// <summary>
    /// Controlador en tercera persona con autoridad del dueño (owner-authoritative):
    /// el cliente mueve su CharacterController y el NetworkTransform (modo Owner)
    /// replica la posición al resto.
    ///
    ///  - Movimiento fluido con aceleración, carrera y control aéreo.
    ///  - Salto con "coyote time". Los Guardianes saltan más alto dentro de zonas de Bio-Esporas.
    ///  - Dash (Q) de los Taladores; en suelo quemado se deslizan más rápido y el dash recarga antes.
    ///  - Cámara sobre el hombro con colisión y apuntado con Clic Derecho (zoom + FOV).
    /// </summary>
    [RequireComponent(typeof(CharacterController))]
    public class ThirdPersonController : NetworkBehaviour
    {
        public static ThirdPersonController Local { get; private set; }

        [Header("Movimiento")]
        [SerializeField] float moveSpeed = 6.5f;
        [SerializeField] float sprintSpeed = 9.5f;
        [SerializeField] float aimMoveSpeed = 4.2f;
        [SerializeField] float acceleration = 12f;
        [SerializeField] float airControl = 0.4f;
        [SerializeField] float rotationSharpness = 14f;

        [Header("Salto")]
        [SerializeField] float jumpHeight = 1.7f;
        [SerializeField] float gravity = -24f;
        [SerializeField] float coyoteTime = 0.12f;
        [Tooltip("Multiplicador de altura de salto de los Guardianes dentro de una zona de Bio-Esporas.")]
        [SerializeField] float bioJumpMultiplier = 1.8f;

        [Header("Dash (sólo Taladores)")]
        [SerializeField] bool canDash;
        [SerializeField] float dashSpeed = 19f;
        [SerializeField] float dashDuration = 0.2f;
        [SerializeField] float dashCooldown = 2.2f;
        [SerializeField] float scorchDashCooldown = 0.7f;
        [SerializeField] float scorchDashMultiplier = 1.45f;
        [Tooltip("Multiplicador de velocidad de los Taladores sobre suelo quemado (deslizamiento).")]
        [SerializeField] float scorchSpeedMultiplier = 1.35f;

        [Header("Cámara sobre el hombro")]
        [SerializeField] float pivotHeight = 1.55f;
        [SerializeField] float cameraDistance = 4.6f;
        [SerializeField] float aimDistance = 2.2f;
        [SerializeField] float shoulderOffset = 0.65f;
        [SerializeField] float aimShoulderOffset = 0.8f;
        [SerializeField] float fieldOfView = 62f;
        [SerializeField] float aimFieldOfView = 42f;
        [SerializeField] float minPitch = -35f;
        [SerializeField] float maxPitch = 70f;
        [SerializeField] float cameraCollisionRadius = 0.25f;

        CharacterController m_Controller;
        PlayerIdentity m_Identity;
        Health m_Health;
        ProceduralSquash m_Squash;
        NetworkTransform m_NetTransform;
        Camera m_Camera;

        float m_Yaw;
        float m_Pitch = 12f;
        Vector3 m_PlanarVelocity;
        float m_VerticalVelocity;
        float m_LastGroundedTime = -10f;
        float m_DashTimer;
        float m_DashCooldownTimer;
        float m_DashCooldownTotal = 1f;
        Vector3 m_DashDirection;
        float m_DashMultiplier = 1f;
        float m_AimBlend;
        float m_LastFireTime = -10f;
        float m_FireKick;
        float m_CrosshairSpread;
        readonly RaycastHit[] m_Hits = new RaycastHit[32];

        public bool IsAiming { get; private set; }
        public bool IsGrounded => m_Controller != null && m_Controller.isGrounded;
        public bool CanDash => canDash;
        public Team Team => m_Identity != null ? m_Identity.Team : Team.None;

        /// <summary>Apertura de la mira dinámica (0 = cerrada, 1 = muy abierta).</summary>
        public float CrosshairSpread => m_CrosshairSpread;

        /// <summary>Progreso de recarga del dash (1 = listo).</summary>
        public float DashReady01 => canDash ? 1f - Mathf.Clamp01(m_DashCooldownTimer / Mathf.Max(0.01f, m_DashCooldownTotal)) : 0f;

        /// <summary>¿Puede el jugador local actuar (moverse, disparar)?</summary>
        public bool CanAct =>
            IsOwner && GameInput.GameplayActive && !IntroCinematicController.IsPlayingNow &&
            (m_Health == null || !m_Health.IsDead.Value);

        public bool InBioZone => EffectZone.IsInside(transform.position, ZoneType.BioSpore);
        public bool InScorchZone => EffectZone.IsInside(transform.position, ZoneType.Scorched);

        void Awake()
        {
            m_Controller = GetComponent<CharacterController>();
            m_Identity = GetComponent<PlayerIdentity>();
            m_Health = GetComponent<Health>();
            m_Squash = GetComponent<ProceduralSquash>();
            m_NetTransform = GetComponent<NetworkTransform>();
        }

        public override void OnNetworkSpawn()
        {
            if (!IsOwner) return;

            Local = this;
            m_Camera = Camera.main;
            m_Yaw = transform.eulerAngles.y;
            m_Pitch = 12f;

            var intro = IntroCinematicController.Instance;
            if (intro != null && !IntroCinematicController.HasPlayed)
                intro.Play(this);
            else
                GameInput.LockCursor();
        }

        public override void OnNetworkDespawn()
        {
            if (Local == this)
            {
                Local = null;
                GameInput.FreeCursor();
            }
        }

        void Update()
        {
            if (!IsOwner || !IsSpawned) return;
            float dt = Time.deltaTime;

            HandleCursor();
            bool canAct = CanAct;

            // ---------------- Cámara (mirar) ----------------
            if (canAct)
            {
                Vector2 look = GameInput.LookDelta;
                m_Yaw += look.x;
                m_Pitch = Mathf.Clamp(m_Pitch - look.y, minPitch, maxPitch);
            }

            IsAiming = canAct && GameInput.AimHeld;
            m_AimBlend = Mathf.MoveTowards(m_AimBlend, IsAiming ? 1f : 0f, dt * 6f);

            // ---------------- Movimiento horizontal ----------------
            Vector2 input = canAct ? GameInput.Move : Vector2.zero;
            Quaternion yawRotation = Quaternion.Euler(0f, m_Yaw, 0f);
            Vector3 wishDirection = yawRotation * new Vector3(input.x, 0f, input.y);

            bool grounded = m_Controller.isGrounded;
            if (grounded) m_LastGroundedTime = Time.time;

            bool sprint = canAct && GameInput.SprintHeld && !IsAiming && input.y > 0.1f;
            float targetSpeed = IsAiming ? aimMoveSpeed : sprint ? sprintSpeed : moveSpeed;
            bool onScorch = Team == Team.Taladores && InScorchZone;
            if (onScorch) targetSpeed *= scorchSpeedMultiplier;

            float accel = grounded ? acceleration : acceleration * airControl;
            m_PlanarVelocity = Vector3.Lerp(m_PlanarVelocity, wishDirection * targetSpeed, 1f - Mathf.Exp(-accel * dt));

            // ---------------- Salto ----------------
            if (canAct && GameInput.JumpPressed && Time.time - m_LastGroundedTime <= coyoteTime && m_VerticalVelocity <= 0.5f)
            {
                bool bioBoost = Team == Team.Guardianes && InBioZone;
                float height = jumpHeight * (bioBoost ? bioJumpMultiplier : 1f);
                m_VerticalVelocity = Mathf.Sqrt(2f * -gravity * height);
                m_LastGroundedTime = -10f;
                if (m_Squash != null) m_Squash.OnJump();
                if (bioBoost) VfxFactory.Play(FxKind.SporeImpact, transform.position, 0.7f);
            }

            // ---------------- Gravedad ----------------
            if (grounded && m_VerticalVelocity < 0f) m_VerticalVelocity = -2f;
            else m_VerticalVelocity += gravity * dt;

            // ---------------- Dash (Taladores) ----------------
            m_DashCooldownTimer = Mathf.Max(0f, m_DashCooldownTimer - dt);
            if (canDash && canAct && GameInput.DashPressed && m_DashCooldownTimer <= 0f)
            {
                m_DashDirection = wishDirection.sqrMagnitude > 0.01f ? wishDirection.normalized : yawRotation * Vector3.forward;
                m_DashTimer = dashDuration;
                m_DashMultiplier = onScorch ? scorchDashMultiplier : 1f;
                m_DashCooldownTotal = onScorch ? scorchDashCooldown : dashCooldown;
                m_DashCooldownTimer = m_DashCooldownTotal;
                if (m_Squash != null) m_Squash.Punch(-5f);
                VfxFactory.Play(FxKind.Dash, transform.position + Vector3.up * 0.3f);
            }

            Vector3 motion = m_PlanarVelocity;
            if (m_DashTimer > 0f)
            {
                m_DashTimer -= dt;
                motion = m_DashDirection * dashSpeed * m_DashMultiplier;
            }
            motion.y = m_VerticalVelocity;

            if (m_Controller.enabled) m_Controller.Move(motion * dt);

            // ---------------- Rotación del personaje ----------------
            bool faceCamera = IsAiming || Time.time - m_LastFireTime < 0.6f;
            Vector3 planar = new Vector3(m_PlanarVelocity.x, 0f, m_PlanarVelocity.z);
            Quaternion targetRotation = transform.rotation;
            if (faceCamera) targetRotation = yawRotation;
            else if (planar.sqrMagnitude > 0.2f) targetRotation = Quaternion.LookRotation(planar);
            transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, 1f - Mathf.Exp(-rotationSharpness * dt));

            // ---------------- Mira dinámica ----------------
            m_FireKick = Mathf.MoveTowards(m_FireKick, 0f, dt * 2.5f);
            float movement = planar.magnitude / Mathf.Max(1f, sprintSpeed);
            float spread = 0.2f + movement * 0.45f + (grounded ? 0f : 0.35f) + m_FireKick;
            spread *= 1f - m_AimBlend * 0.65f;
            m_CrosshairSpread = Mathf.Lerp(m_CrosshairSpread, Mathf.Clamp01(spread), 1f - Mathf.Exp(-12f * dt));
        }

        void LateUpdate()
        {
            if (!IsOwner || !IsSpawned) return;
            if (IntroCinematicController.IsPlayingNow) return;
            if (m_Camera == null) m_Camera = Camera.main;
            if (m_Camera == null) return;

            GetCameraPose(out Vector3 position, out Quaternion rotation, out float fov);
            m_Camera.transform.SetPositionAndRotation(position, rotation);
            m_Camera.fieldOfView = fov;
        }

        void HandleCursor()
        {
            if (GameInput.GameplayBlocked) return;
            if (GameInput.CursorTogglePressed)
            {
                if (GameInput.CursorFree) GameInput.LockCursor();
                else GameInput.FreeCursor();
                return;
            }
            // Clic en el juego (no en la UI) para recapturar el cursor.
            if (GameInput.CursorFree && GameInput.FirePressed && !IntroCinematicController.IsPlayingNow)
            {
                bool overUI = EventSystem.current != null && EventSystem.current.IsPointerOverGameObject();
                if (!overUI) GameInput.LockCursor();
            }
        }

        /// <summary>
        /// Pose de cámara deseada (también la usa la cinemática para la transición final).
        /// </summary>
        public void GetCameraPose(out Vector3 position, out Quaternion rotation, out float fov)
        {
            Vector3 pivot = transform.position + Vector3.up * pivotHeight;
            rotation = Quaternion.Euler(m_Pitch, m_Yaw, 0f);
            float distance = Mathf.Lerp(cameraDistance, aimDistance, m_AimBlend);
            float shoulder = Mathf.Lerp(shoulderOffset, aimShoulderOffset, m_AimBlend);
            Vector3 desired = pivot + rotation * new Vector3(shoulder, 0f, -distance);

            // Colisión de cámara: no atravesar árboles, rocas ni el terreno.
            Vector3 toCamera = desired - pivot;
            float length = toCamera.magnitude;
            position = desired;
            if (length > 0.01f)
            {
                Vector3 direction = toCamera / length;
                int count = Physics.SphereCastNonAlloc(pivot, cameraCollisionRadius, direction, m_Hits, length, ~0, QueryTriggerInteraction.Ignore);
                float closest = length;
                for (int i = 0; i < count; i++)
                {
                    var hit = m_Hits[i];
                    if (IsSelf(hit.collider) || hit.distance <= 0f) continue;
                    if (hit.distance < closest) closest = hit.distance;
                }
                position = pivot + direction * Mathf.Max(0.3f, closest - 0.05f);
            }
            fov = Mathf.Lerp(fieldOfView, aimFieldOfView, m_AimBlend);
        }

        /// <summary>Punto del mundo al que apunta el centro de la pantalla.</summary>
        public Vector3 GetAimPoint()
        {
            if (m_Camera == null) m_Camera = Camera.main;
            if (m_Camera == null) return transform.position + transform.forward * 50f;

            Transform cam = m_Camera.transform;
            Vector3 pivot = transform.position + Vector3.up * pivotHeight;
            // Ignoramos lo que hay entre la cámara y el personaje.
            float minDistance = Vector3.Dot(pivot - cam.position, cam.forward);
            var ray = new Ray(cam.position, cam.forward);
            int count = Physics.RaycastNonAlloc(ray, m_Hits, 250f, ~0, QueryTriggerInteraction.Ignore);
            float best = float.MaxValue;
            Vector3 point = cam.position + cam.forward * 250f;
            for (int i = 0; i < count; i++)
            {
                var hit = m_Hits[i];
                if (IsSelf(hit.collider) || hit.distance < minDistance) continue;
                if (hit.distance < best)
                {
                    best = hit.distance;
                    point = hit.point;
                }
            }
            return point;
        }

        /// <summary>Avisado por WeaponSystem al disparar (orienta al personaje y abre la mira).</summary>
        public void NotifyFired()
        {
            m_LastFireTime = Time.time;
            m_FireKick = Mathf.Min(1f, m_FireKick + 0.35f);
        }

        /// <summary>Teletransporte del dueño (reaparición). Usa el Teleport del NetworkTransform para no interpolar.</summary>
        public void Teleport(Vector3 position, Quaternion rotation)
        {
            bool wasEnabled = m_Controller.enabled;
            m_Controller.enabled = false;
            bool done = false;
            if (m_NetTransform != null && IsSpawned)
            {
                try
                {
                    m_NetTransform.Teleport(position, rotation, transform.localScale);
                    done = true;
                }
                catch (System.Exception e)
                {
                    Debug.LogWarning("Teleport de NetworkTransform falló, se usa transform directo: " + e.Message);
                }
            }
            if (!done) transform.SetPositionAndRotation(position, rotation);

            m_Controller.enabled = wasEnabled;
            m_PlanarVelocity = Vector3.zero;
            m_VerticalVelocity = 0f;
            m_DashTimer = 0f;
            m_Yaw = rotation.eulerAngles.y;
        }

        bool IsSelf(Collider collider)
        {
            return collider != null && collider.transform.IsChildOf(transform);
        }
    }
}
