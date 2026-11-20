using System.Collections.Generic;
using RootsAndRust.Core;
using RootsAndRust.Player;
using Unity.Netcode;
using UnityEngine;

namespace RootsAndRust.Gameplay
{
    public enum ZoneType : byte
    {
        /// <summary>Zona verde de Bio-Esporas: los Guardianes regeneran vida y saltan más alto.</summary>
        BioSpore,
        /// <summary>Suelo industrial quemado: los Taladores se deslizan más rápido y recargan el dash.</summary>
        Scorched
    }

    /// <summary>
    /// Zona temporal en el suelo creada por los proyectiles. Es un NetworkObject para que
    /// todos la vean; la lógica de curación corre en el servidor y los modificadores de
    /// movimiento los consulta el dueño de cada jugador con EffectZone.IsInside().
    /// </summary>
    public class EffectZone : NetworkBehaviour
    {
        static readonly List<EffectZone> s_Active = new List<EffectZone>();
        const int k_MaxZonesPerType = 12;

        [SerializeField] ZoneType type = ZoneType.BioSpore;
        [SerializeField] float radius = 3.2f;
        [SerializeField] float lifetime = 10f;
        [SerializeField] float healPerSecond = 14f;
        [SerializeField] Transform visual;

        public NetworkVariable<bool> Expiring = new NetworkVariable<bool>(false);

        public ZoneType Type => type;
        public float Radius => radius;

        float m_SpawnTime;
        ElasticPop m_Pop;
        ParticleSystem m_Emitter;

        // ------------------------------------------------------------------
        //  Consultas estáticas
        // ------------------------------------------------------------------

        /// <summary>¿Está el punto dentro de alguna zona activa del tipo indicado?</summary>
        public static bool IsInside(Vector3 position, ZoneType zoneType)
        {
            for (int i = 0; i < s_Active.Count; i++)
            {
                var zone = s_Active[i];
                if (zone == null || zone.type != zoneType || zone.Expiring.Value) continue;
                if (zone.Contains(position)) return true;
            }
            return false;
        }

        public bool Contains(Vector3 position)
        {
            Vector3 delta = position - transform.position;
            if (Mathf.Abs(delta.y) > 2.5f) return false;
            delta.y = 0f;
            return delta.sqrMagnitude <= radius * radius;
        }

        /// <summary>Crea una zona en red (sólo servidor). Limita el número de zonas simultáneas.</summary>
        public static void ServerSpawn(GameObject prefab, Vector3 position)
        {
            var nm = NetworkManager.Singleton;
            if (nm == null || !nm.IsServer || prefab == null) return;

            var template = prefab.GetComponent<EffectZone>();
            if (template != null)
            {
                // Si ya hay una zona igual muy cerca, sólo la refrescamos.
                foreach (var zone in s_Active)
                {
                    if (zone != null && zone.type == template.type && !zone.Expiring.Value &&
                        (zone.transform.position - position).sqrMagnitude < zone.radius * zone.radius * 0.35f)
                    {
                        zone.m_SpawnTime = Time.time;
                        return;
                    }
                }

                // Límite: eliminamos la más antigua.
                EffectZone oldest = null;
                int count = 0;
                foreach (var zone in s_Active)
                {
                    if (zone == null || zone.type != template.type) continue;
                    count++;
                    if (oldest == null || zone.m_SpawnTime < oldest.m_SpawnTime) oldest = zone;
                }
                if (count >= k_MaxZonesPerType && oldest != null) oldest.ServerExpire();
            }

            var instance = Instantiate(prefab, position + Vector3.up * 0.03f, Quaternion.Euler(0f, Random.Range(0f, 360f), 0f));
            instance.GetComponent<NetworkObject>().Spawn(true);
        }

        /// <summary>Elimina todas las zonas (reinicio de partida).</summary>
        public static void ServerClearAll()
        {
            var copy = new List<EffectZone>(s_Active);
            foreach (var zone in copy)
                if (zone != null && zone.IsServer && zone.IsSpawned) zone.NetworkObject.Despawn(true);
        }

        // ------------------------------------------------------------------
        //  Ciclo de vida
        // ------------------------------------------------------------------

        public override void OnNetworkSpawn()
        {
            s_Active.Add(this);
            m_SpawnTime = Time.time;

            if (visual != null)
            {
                m_Pop = visual.GetComponent<ElasticPop>();
                if (m_Pop == null) m_Pop = visual.gameObject.AddComponent<ElasticPop>();
                m_Pop.Pop(0.05f);
            }

            // Partículas ambientales locales.
            if (type == ZoneType.BioSpore)
                m_Emitter = VfxFactory.Emitter(transform, Vector3.up * 0.1f, Palette.Lime, Palette.FlowerMagenta, 14f, 1.2f, 0.25f, 1.6f, -0.25f, radius * 0.85f);
            else
                m_Emitter = VfxFactory.Emitter(transform, Vector3.up * 0.1f, Palette.SparkAmber, Palette.IndustrialOrange, 12f, 1.6f, 0.15f, 1.0f, -0.4f, radius * 0.85f);

            Expiring.OnValueChanged += OnExpiringChanged;
        }

        public override void OnNetworkDespawn()
        {
            s_Active.Remove(this);
            Expiring.OnValueChanged -= OnExpiringChanged;
            if (m_Emitter != null) Destroy(m_Emitter.gameObject);
        }

        void OnExpiringChanged(bool previous, bool current)
        {
            if (!current) return;
            if (m_Pop != null) m_Pop.Shrink();
            if (m_Emitter != null)
            {
                var emission = m_Emitter.emission;
                emission.enabled = false;
            }
        }

        void ServerExpire()
        {
            if (!IsServer || Expiring.Value) return;
            Expiring.Value = true;
            Invoke(nameof(ServerDespawn), 0.6f);
        }

        void ServerDespawn()
        {
            if (IsSpawned) NetworkObject.Despawn(true);
        }

        void Update()
        {
            if (!IsServer || !IsSpawned || Expiring.Value) return;

            if (Time.time - m_SpawnTime > lifetime)
            {
                ServerExpire();
                return;
            }

            // Curación de Guardianes dentro de la zona verde.
            if (type == ZoneType.BioSpore)
            {
                float amount = healPerSecond * Time.deltaTime;
                foreach (var player in PlayerIdentity.All)
                {
                    if (player == null || player.Team != Team.Guardianes) continue;
                    if (!Contains(player.transform.position)) continue;
                    var health = player.GetComponent<Health>();
                    if (health != null) health.ServerHeal(amount);
                }
            }
        }

        void OnDrawGizmos()
        {
            Gizmos.color = type == ZoneType.BioSpore ? Palette.Lime : Palette.IndustrialOrange;
            Gizmos.DrawWireSphere(transform.position, radius);
        }
    }
}
