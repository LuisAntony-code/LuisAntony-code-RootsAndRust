using RootsAndRust.Core;
using RootsAndRust.Gameplay;
using RootsAndRust.Networking;
using Unity.Netcode;
using UnityEngine;

namespace RootsAndRust.Player
{
    public enum ProjectileKind : byte
    {
        /// <summary>Bio-Espora de los Guardianes.</summary>
        BioSpore,
        /// <summary>Sierra Térmica de los Taladores.</summary>
        ThermalSaw
    }

    /// <summary>
    /// Proyectil simulado en el servidor (SphereCast por frame) y replicado con
    /// NetworkTransform. Reglas:
    ///
    /// BIO-ESPORA (Guardianes)
    ///  - Suelo: crea una zona verde vibrante (los aliados regeneran vida y saltan más alto).
    ///  - Tocón / tronco caído: hace crecer de nuevo el árbol (animación elástica).
    ///  - Enemigo: daño leve.
    ///
    /// SIERRA TÉRMICA (Taladores)
    ///  - Rebota varias veces (Vector3.Reflect).
    ///  - Árbol vivo: le hace daño de tala (al llegar a 0 el tronco cae con físicas).
    ///  - Suelo: deja suelo industrial quemado (los Taladores se deslizan más rápido).
    ///  - Enemigo: daño.
    /// </summary>
    public class NetworkProjectile : NetworkBehaviour
    {
        [SerializeField] ProjectileKind kind = ProjectileKind.BioSpore;

        [Header("Física")]
        [SerializeField] float radius = 0.22f;
        [SerializeField] float gravity = 9f;
        [SerializeField] float lifetime = 4f;
        [SerializeField] int maxBounces = 0;
        [SerializeField] float bounceDamping = 0.85f;

        [Header("Efectos de juego")]
        [SerializeField] float playerDamage = 14f;
        [SerializeField] float treeDamage = 30f;
        [SerializeField] float regrowAmount = 0.5f;
        [Tooltip("Zona que crea al impactar el suelo (Bio-Esporas o Suelo Quemado).")]
        [SerializeField] GameObject impactZonePrefab;

        [Header("Visual")]
        [SerializeField] Transform spinVisual;
        [SerializeField] Vector3 spinAxis = Vector3.up;
        [SerializeField] float spinSpeed = 900f;

        ulong m_OwnerClientId;
        Team m_Team;
        Vector3 m_Velocity;
        int m_Bounces;
        float m_SpawnTime;
        bool m_Finished;
        bool m_ZonePlaced;
        readonly RaycastHit[] m_Hits = new RaycastHit[16];

        public ProjectileKind Kind => kind;

        /// <summary>Configura el proyectil antes de hacer Spawn (sólo servidor).</summary>
        public void ServerInitialize(ulong ownerClientId, Team team, Vector3 velocity)
        {
            m_OwnerClientId = ownerClientId;
            m_Team = team;
            m_Velocity = velocity;
        }

        public override void OnNetworkSpawn()
        {
            m_SpawnTime = Time.time;
        }

        void Update()
        {
            if (spinVisual != null) spinVisual.Rotate(spinAxis, spinSpeed * Time.deltaTime, Space.Self);

            if (!IsServer || !IsSpawned || m_Finished) return;

            float dt = Time.deltaTime;
            if (Time.time - m_SpawnTime > lifetime)
            {
                Finish();
                return;
            }

            m_Velocity += Vector3.down * gravity * dt;
            Vector3 step = m_Velocity * dt;
            float distance = step.magnitude;
            if (distance < 0.0001f) return;
            Vector3 direction = step / distance;
            Vector3 origin = transform.position;

            if (TryFindHit(origin, direction, distance, out RaycastHit hit, out Vector3 centerAtHit))
            {
                HandleHit(hit, centerAtHit);
            }
            else
            {
                transform.position = origin + step;
            }
        }

        bool TryFindHit(Vector3 origin, Vector3 direction, float distance, out RaycastHit best, out Vector3 centerAtHit)
        {
            best = default;
            centerAtHit = origin;
            int count = Physics.SphereCastNonAlloc(origin, radius, direction, m_Hits, distance, ~0, QueryTriggerInteraction.Ignore);
            float bestDistance = float.MaxValue;
            bool found = false;

            for (int i = 0; i < count; i++)
            {
                RaycastHit hit = m_Hits[i];
                if (!IsValidTarget(hit.collider)) continue;

                // Solapamiento inicial: Unity devuelve distance 0 y point cero.
                if (hit.distance <= 0f)
                {
                    hit.point = origin;
                    hit.normal = -direction;
                }

                if (hit.distance < bestDistance)
                {
                    bestDistance = hit.distance;
                    best = hit;
                    found = true;
                }
            }

            if (found) centerAtHit = origin + direction * bestDistance;
            return found;
        }

        bool IsValidTarget(Collider collider)
        {
            if (collider == null) return false;
            var player = PlayerIdentity.FromCollider(collider);
            if (player == null) return true;

            // Nunca nos golpeamos a nosotros mismos ni a aliados (sin fuego amigo).
            if (player.OwnerClientId == m_OwnerClientId) return false;
            if (player.Team == m_Team) return false;
            var health = player.GetComponent<Health>();
            return health == null || !health.IsDead.Value;
        }

        void HandleHit(RaycastHit hit, Vector3 centerAtHit)
        {
            var player = PlayerIdentity.FromCollider(hit.collider);
            var treePart = hit.collider.GetComponentInParent<TreePart>();
            DynamicTree tree = treePart != null ? treePart.Tree : null;
            float frenzy = GameLoopManager.FrenzyMultiplier;
            bool isGround = player == null && tree == null && hit.normal.y > 0.55f;

            // ------------------- Jugador enemigo -------------------
            if (player != null)
            {
                var health = player.GetComponent<Health>();
                if (health != null) health.ServerApplyDamage(playerDamage, m_Team);
                NetworkFx.Play(kind == ProjectileKind.BioSpore ? FxKind.SporeImpact : FxKind.SawImpact, hit.point);
                Finish();
                return;
            }

            if (kind == ProjectileKind.BioSpore)
            {
                // ------------------- Bio-Espora -------------------
                if (tree != null && !tree.IsAlive)
                {
                    tree.ServerAddRegrowth(regrowAmount * frenzy);
                    NetworkFx.Play(FxKind.Regrow, hit.point, 0.6f);
                }
                else
                {
                    if (isGround) SpawnZone(hit.point);
                    NetworkFx.Play(FxKind.SporeImpact, hit.point);
                }
                Finish();
                return;
            }

            // ------------------- Sierra Térmica -------------------
            if (tree != null && tree.IsAlive)
            {
                tree.ServerApplySawDamage(treeDamage * frenzy, hit.point, m_Velocity, m_Team);
            }
            else if (isGround && !m_ZonePlaced)
            {
                SpawnZone(hit.point);
                m_ZonePlaced = true;
            }
            NetworkFx.Play(FxKind.SawImpact, hit.point, 0.7f);

            m_Bounces++;
            if (m_Bounces > maxBounces)
            {
                Finish();
                return;
            }

            // Rebote: reflejamos la velocidad y nos separamos un poco de la superficie.
            m_Velocity = Vector3.Reflect(m_Velocity, hit.normal) * bounceDamping;
            if (isGround) m_Velocity.y = Mathf.Max(m_Velocity.y, 4f);
            transform.position = centerAtHit + hit.normal * 0.05f;
        }

        void SpawnZone(Vector3 point)
        {
            GameObject prefab = impactZonePrefab;
            if (prefab == null && GameAssets.Instance != null)
                prefab = kind == ProjectileKind.BioSpore ? GameAssets.Instance.bioZonePrefab : GameAssets.Instance.scorchZonePrefab;
            if (prefab != null) EffectZone.ServerSpawn(prefab, point);
        }

        void Finish()
        {
            if (m_Finished) return;
            m_Finished = true;
            if (IsSpawned) NetworkObject.Despawn(true);
        }
    }
}
