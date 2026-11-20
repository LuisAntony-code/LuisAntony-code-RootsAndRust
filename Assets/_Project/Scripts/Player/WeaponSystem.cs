using RootsAndRust.Core;
using RootsAndRust.Gameplay;
using Unity.Netcode;
using UnityEngine;

namespace RootsAndRust.Player
{
    /// <summary>
    /// Arma a distancia sincronizada en red.
    ///  - Guardianes: Lanzador de Bio-Esporas (proyectil con arco, crea zonas verdes / regenera tocones).
    ///  - Taladores: Cañón de Sierras Térmicas (discos que rebotan, talan árboles y queman el suelo).
    ///
    /// Flujo: el dueño calcula el punto de mira -> FireRpc al servidor -> el servidor valida
    /// la cadencia, instancia el NetworkProjectile y lo hace Spawn -> FX en todos los clientes.
    /// En el Frenesí Final la cadencia se duplica.
    /// </summary>
    public class WeaponSystem : NetworkBehaviour
    {
        [Header("Proyectil (lo asigna el asistente)")]
        [SerializeField] GameObject projectilePrefab;
        [SerializeField] Transform muzzle;

        [Header("Disparo")]
        [SerializeField] float fireCooldown = 0.45f;
        [SerializeField] float projectileSpeed = 28f;
        [Tooltip("Dispersión en grados cuando NO se apunta.")]
        [SerializeField] float hipSpreadDegrees = 2.5f;
        [SerializeField] FxKind muzzleFx = FxKind.MuzzleSpore;

        ThirdPersonController m_Controller;
        PlayerIdentity m_Identity;
        ProceduralSquash m_Squash;
        Health m_Health;
        float m_NextFireTime;
        float m_LastServerFireTime = -10f;

        /// <summary>Cadencia efectiva (tiene en cuenta el Frenesí Final).</summary>
        public float EffectiveCooldown => fireCooldown / GameLoopManager.FrenzyMultiplier;

        /// <summary>0 = recién disparado, 1 = listo.</summary>
        public float Ready01 => 1f - Mathf.Clamp01((m_NextFireTime - Time.time) / Mathf.Max(0.01f, EffectiveCooldown));

        void Awake()
        {
            m_Controller = GetComponent<ThirdPersonController>();
            m_Identity = GetComponent<PlayerIdentity>();
            m_Squash = GetComponent<ProceduralSquash>();
            m_Health = GetComponent<Health>();
            if (muzzle == null)
            {
                foreach (var t in GetComponentsInChildren<Transform>(true))
                    if (t.name == "Muzzle") { muzzle = t; break; }
            }
        }

        Vector3 MuzzlePosition => muzzle != null ? muzzle.position : transform.position + Vector3.up * 1.1f + transform.forward * 0.8f;

        void Update()
        {
            if (!IsOwner || !IsSpawned || m_Controller == null) return;
            if (!m_Controller.CanAct) return;
            if (!GameInput.FireHeld || Time.time < m_NextFireTime) return;

            m_NextFireTime = Time.time + EffectiveCooldown;

            Vector3 origin = MuzzlePosition;
            Vector3 aimPoint = m_Controller.GetAimPoint();
            Vector3 direction = (aimPoint - origin).normalized;

            // Si el objetivo queda "detrás" del cañón, disparamos hacia donde mira la cámara.
            var cam = Camera.main;
            if (cam != null && Vector3.Dot(direction, cam.transform.forward) < 0.2f) direction = cam.transform.forward;

            if (!m_Controller.IsAiming && hipSpreadDegrees > 0f)
            {
                Vector2 jitter = Random.insideUnitCircle * hipSpreadDegrees;
                direction = Quaternion.AngleAxis(jitter.x, Vector3.up) * Quaternion.AngleAxis(jitter.y, Vector3.Cross(direction, Vector3.up)) * direction;
            }

            FireRpc(origin, direction);
            PlayLocalFireFx();
            m_Controller.NotifyFired();
        }

        [Rpc(SendTo.Server)]
        void FireRpc(Vector3 origin, Vector3 direction)
        {
            // Validación básica anti-trampas: cadencia y origen razonable.
            float minInterval = EffectiveCooldown * 0.7f;
            if (Time.time - m_LastServerFireTime < minInterval) return;
            if (m_Health != null && m_Health.IsDead.Value) return;
            if (GameLoopManager.Instance != null && !GameLoopManager.Instance.CombatAllowed) return;
            m_LastServerFireTime = Time.time;

            if ((origin - transform.position).sqrMagnitude > 9f) origin = transform.position + Vector3.up * 1.1f;
            if (direction.sqrMagnitude < 0.5f) direction = transform.forward;
            direction.Normalize();

            GameObject prefab = projectilePrefab;
            if (prefab == null && GameAssets.Instance != null)
                prefab = m_Identity != null && m_Identity.Team == Team.Taladores
                    ? GameAssets.Instance.sawProjectilePrefab
                    : GameAssets.Instance.sporeProjectilePrefab;
            if (prefab == null)
            {
                Debug.LogError("[WeaponSystem] Falta el prefab de proyectil.");
                return;
            }

            GameObject instance = Instantiate(prefab, origin, Quaternion.LookRotation(direction));
            var projectile = instance.GetComponent<NetworkProjectile>();
            Team team = m_Identity != null ? m_Identity.Team : Team.None;
            projectile.ServerInitialize(OwnerClientId, team, direction * projectileSpeed);
            instance.GetComponent<NetworkObject>().Spawn(true);

            FireFxRpc();
        }

        [Rpc(SendTo.NotOwner)]
        void FireFxRpc()
        {
            PlayLocalFireFx();
        }

        void PlayLocalFireFx()
        {
            if (m_Squash != null) m_Squash.Punch(-3.5f);
            VfxFactory.Play(muzzleFx, MuzzlePosition, 0.9f);
        }
    }
}
