using System.Collections;
using System.Collections.Generic;
using RootsAndRust.Core;
using RootsAndRust.Networking;
using RootsAndRust.Player;
using Unity.Netcode;
using Unity.Netcode.Components;
using UnityEngine;

namespace RootsAndRust.Gameplay
{
    public enum TreeState : byte
    {
        Alive,
        Felled
    }

    /// <summary>
    /// Árbol modular: tocón fijo + tronco/copa superior.
    ///
    ///  - Los Taladores le hacen daño con las sierras. Al llegar a 0, el tronco activa su
    ///    Rigidbody (en el servidor) y cae con físicas reales; un NetworkTransform hijo
    ///    replica la caída a todos. Mientras cae puede APLASTAR a los rivales de quien lo taló.
    ///  - Ya en el suelo queda congelado y sirve de cobertura.
    ///  - Los Guardianes disparan esporas al tocón (o al tronco caído) para regenerarlo:
    ///    cada impacto suma progreso y, al completarlo, el árbol vuelve a crecer con una
    ///    animación elástica.
    /// </summary>
    public class DynamicTree : NetworkBehaviour
    {
        public static readonly List<DynamicTree> All = new List<DynamicTree>();

        [Header("Piezas (las asigna el asistente)")]
        [SerializeField] Transform trunk;
        [SerializeField] Transform trunkVisual;
        [SerializeField] Rigidbody trunkBody;
        [SerializeField] NetworkTransform trunkNetworkTransform;
        [SerializeField] Transform stump;
        [SerializeField] Transform sprout;

        [Header("Reglas")]
        [SerializeField] float maxHealth = 60f;
        [SerializeField] float fallImpulse = 4.5f;
        [SerializeField] float trunkHeight = 6f;
        [SerializeField] float crushRadius = 0.8f;
        [SerializeField] float crushDamage = 65f;
        [SerializeField] float crushWindow = 3f;
        [SerializeField] float settleTime = 5f;

        public NetworkVariable<TreeState> State = new NetworkVariable<TreeState>(TreeState.Alive);
        public NetworkVariable<float> Health = new NetworkVariable<float>(60f);
        public NetworkVariable<float> RegrowProgress = new NetworkVariable<float>(0f);

        public bool IsAlive => State.Value == TreeState.Alive;

        Vector3 m_TrunkLocalPosition;
        Quaternion m_TrunkLocalRotation;
        Vector3 m_TrunkVisualScale = Vector3.one;
        Vector3 m_SproutScale = Vector3.one;
        Team m_LastAttackerTeam = Team.Taladores;
        float m_FellTime;
        readonly HashSet<ulong> m_Crushed = new HashSet<ulong>();
        readonly Collider[] m_Overlap = new Collider[16];
        Coroutine m_VisualRoutine;
        SpringFloat m_Wobble;

        void Awake()
        {
            if (trunk != null)
            {
                m_TrunkLocalPosition = trunk.localPosition;
                m_TrunkLocalRotation = trunk.localRotation;
            }
            if (trunkVisual != null) m_TrunkVisualScale = trunkVisual.localScale;
            if (sprout != null)
            {
                m_SproutScale = sprout.localScale;
                sprout.localScale = Vector3.zero;
            }

            // El tronco no debe chocar con su propio tocón al empezar a caer.
            if (trunk != null && stump != null)
            {
                foreach (var a in trunk.GetComponentsInChildren<Collider>())
                foreach (var b in stump.GetComponentsInChildren<Collider>())
                    Physics.IgnoreCollision(a, b, true);
            }
            if (trunkBody != null) trunkBody.isKinematic = true;
        }

        void OnEnable() => All.Add(this);
        void OnDisable() => All.Remove(this);

        public override void OnNetworkSpawn()
        {
            if (IsServer)
            {
                Health.Value = maxHealth;
            }
            State.OnValueChanged += OnStateChanged;
            RegrowProgress.OnValueChanged += OnRegrowChanged;

            // Estado inicial para jugadores que entran a mitad de partida.
            if (trunkBody != null && !IsServer) trunkBody.isKinematic = true;
            ApplyStaticVisuals();
        }

        public override void OnNetworkDespawn()
        {
            State.OnValueChanged -= OnStateChanged;
            RegrowProgress.OnValueChanged -= OnRegrowChanged;
        }

        // =====================================================================
        //  SERVIDOR
        // =====================================================================

        /// <summary>Daño de sierra térmica. Al llegar a 0 el árbol cae.</summary>
        public void ServerApplySawDamage(float amount, Vector3 hitPoint, Vector3 hitDirection, Team attackerTeam)
        {
            if (!IsServer || !IsAlive) return;
            m_LastAttackerTeam = attackerTeam;
            Health.Value = Mathf.Max(0f, Health.Value - amount);
            HitWobbleRpc();
            NetworkFx.Play(FxKind.WoodChips, hitPoint, 0.6f);

            if (Health.Value <= 0f) ServerFell(hitDirection);
        }

        void ServerFell(Vector3 hitDirection)
        {
            State.Value = TreeState.Felled;
            RegrowProgress.Value = 0f;
            m_FellTime = Time.time;
            m_Crushed.Clear();

            if (trunkBody == null) return;
            trunkBody.isKinematic = false;
            trunkBody.WakeUp();

            Vector3 push = new Vector3(hitDirection.x, 0f, hitDirection.z);
            if (push.sqrMagnitude < 0.01f) push = Random.insideUnitSphere;
            push.y = 0f;
            push.Normalize();
            Vector3 top = trunk.position + trunk.up * trunkHeight;
            trunkBody.AddForceAtPosition(push * fallImpulse, top, ForceMode.VelocityChange);

            NetworkFx.Play(FxKind.WoodChips, trunk.position + Vector3.up * 0.5f, 1.2f);
        }

        /// <summary>Progreso de regeneración por esporas. Al llegar a 1, el árbol renace.</summary>
        public void ServerAddRegrowth(float amount)
        {
            if (!IsServer || IsAlive) return;
            RegrowProgress.Value = Mathf.Clamp01(RegrowProgress.Value + amount);
            if (RegrowProgress.Value >= 1f) ServerRegrow();
        }

        void ServerRegrow()
        {
            if (trunkBody != null) trunkBody.isKinematic = true;

            Vector3 worldPosition = transform.TransformPoint(m_TrunkLocalPosition);
            Quaternion worldRotation = transform.rotation * m_TrunkLocalRotation;
            if (trunkNetworkTransform != null && trunkNetworkTransform.IsSpawned)
                trunkNetworkTransform.Teleport(worldPosition, worldRotation, trunk.localScale);
            else
                trunk.SetPositionAndRotation(worldPosition, worldRotation);

            Health.Value = maxHealth;
            RegrowProgress.Value = 0f;
            State.Value = TreeState.Alive;
            NetworkFx.Play(FxKind.Regrow, transform.position + Vector3.up * 1.5f);
        }

        /// <summary>Restaura el árbol al instante (reinicio de partida).</summary>
        public void ServerResetTree()
        {
            if (!IsServer) return;
            if (!IsAlive) ServerRegrow();
            else Health.Value = maxHealth;
        }

        void FixedUpdate()
        {
            if (!IsServer || !IsSpawned || IsAlive || trunkBody == null || trunkBody.isKinematic) return;

            float elapsed = Time.time - m_FellTime;

            // Aplastamiento mientras el tronco cae con fuerza.
            if (elapsed < crushWindow && trunkBody.angularVelocity.magnitude > 0.6f)
            {
                Vector3 a = trunk.position + trunk.up * 1.2f;
                Vector3 b = trunk.position + trunk.up * trunkHeight;
                int count = Physics.OverlapCapsuleNonAlloc(a, b, crushRadius, m_Overlap, ~0, QueryTriggerInteraction.Ignore);
                for (int i = 0; i < count; i++)
                {
                    var player = PlayerIdentity.FromCollider(m_Overlap[i]);
                    if (player == null || player.Team == m_LastAttackerTeam) continue;
                    if (!m_Crushed.Add(player.OwnerClientId)) continue;
                    var health = player.GetComponent<RootsAndRust.Player.Health>();
                    if (health != null) health.ServerApplyDamage(crushDamage, m_LastAttackerTeam);
                    NetworkFx.Play(FxKind.Crush, player.transform.position + Vector3.up);
                }
            }

            // Una vez en reposo, se congela como cobertura.
            if (elapsed > settleTime || (elapsed > 1.5f && trunkBody.IsSleeping()))
                trunkBody.isKinematic = true;
        }

        [Rpc(SendTo.ClientsAndHost)]
        void HitWobbleRpc()
        {
            m_Wobble.Velocity += 14f;
        }

        // =====================================================================
        //  VISUALES (todos los clientes)
        // =====================================================================

        void Update()
        {
            // Temblor elástico al recibir sierrazos.
            if (trunkVisual == null) return;
            float w = m_Wobble.Step(0f, 220f, 9f, Time.deltaTime);
            if (Mathf.Abs(w) > 0.0005f || Mathf.Abs(m_Wobble.Velocity) > 0.0005f)
                trunkVisual.localRotation = Quaternion.Euler(w * 3f, 0f, w * 2f);
        }

        void ApplyStaticVisuals()
        {
            if (trunkVisual != null) trunkVisual.localScale = m_TrunkVisualScale;
            if (sprout != null) sprout.localScale = IsAlive ? Vector3.zero : m_SproutScale * Mathf.Lerp(0.35f, 1f, RegrowProgress.Value);
        }

        void OnStateChanged(TreeState previous, TreeState current)
        {
            if (m_VisualRoutine != null) StopCoroutine(m_VisualRoutine);
            if (current == TreeState.Alive)
                m_VisualRoutine = StartCoroutine(GrowRoutine());
            else
                m_VisualRoutine = StartCoroutine(SproutRoutine(0.35f));
        }

        void OnRegrowChanged(float previous, float current)
        {
            if (IsAlive || sprout == null) return;
            if (m_VisualRoutine != null) StopCoroutine(m_VisualRoutine);
            m_VisualRoutine = StartCoroutine(SproutRoutine(Mathf.Lerp(0.35f, 1f, current)));
        }

        /// <summary>Crecimiento elástico del árbol completo (overshoot + rebote).</summary>
        IEnumerator GrowRoutine()
        {
            if (sprout != null) sprout.localScale = Vector3.zero;
            if (trunkVisual == null) yield break;

            var spring = new SpringFloat(0.02f);
            float speed = GameLoopManager.FrenzyMultiplier;
            float t = 0f;
            while (t < 2.5f)
            {
                float dt = Time.deltaTime * speed;
                t += dt;
                float s = Mathf.Max(0f, spring.Step(1f, 90f, 7f, dt));
                // Crece más rápido a lo alto que a lo ancho: se ve "brotar".
                trunkVisual.localScale = Vector3.Scale(m_TrunkVisualScale, new Vector3(Mathf.Sqrt(s), s, Mathf.Sqrt(s)));
                yield return null;
            }
            trunkVisual.localScale = m_TrunkVisualScale;
            m_VisualRoutine = null;
        }

        /// <summary>Brote en el tocón que crece con cada espora.</summary>
        IEnumerator SproutRoutine(float targetFactor)
        {
            if (sprout == null) yield break;
            var spring = new SpringFloat(sprout.localScale.x / Mathf.Max(0.0001f, m_SproutScale.x) * 0.6f);
            float t = 0f;
            while (t < 1.2f)
            {
                t += Time.deltaTime;
                float s = Mathf.Max(0f, spring.Step(targetFactor, 160f, 9f, Time.deltaTime));
                sprout.localScale = m_SproutScale * s;
                yield return null;
            }
            sprout.localScale = m_SproutScale * targetFactor;
            m_VisualRoutine = null;
        }

        void OnDrawGizmosSelected()
        {
            Gizmos.color = Color.green;
            var t = trunk != null ? trunk : transform;
            Gizmos.DrawLine(t.position, t.position + t.up * trunkHeight);
        }

        // ---------------------------------------------------------------------
        //  Utilidades para el asistente de editor
        // ---------------------------------------------------------------------
#if UNITY_EDITOR
        public void EditorSetup(Transform trunkTransform, Transform trunkVisualTransform, Rigidbody body,
            NetworkTransform netTransform, Transform stumpTransform, Transform sproutTransform, float height)
        {
            trunk = trunkTransform;
            trunkVisual = trunkVisualTransform;
            trunkBody = body;
            trunkNetworkTransform = netTransform;
            stump = stumpTransform;
            sprout = sproutTransform;
            trunkHeight = height;
        }
#endif
    }
}
