using System;
using System.Collections;
using RootsAndRust.Core;
using RootsAndRust.Networking;
using Unity.Netcode;
using UnityEngine;

namespace RootsAndRust.Player
{
    /// <summary>
    /// Vida del jugador con autoridad del servidor.
    /// - El servidor aplica daño/curación y gestiona la muerte y reaparición.
    /// - Los clientes reaccionan a los cambios (squash de golpe, partículas, ocultar al morir).
    /// </summary>
    public class Health : NetworkBehaviour
    {
        [SerializeField] float maxHealth = 100f;
        [SerializeField] float respawnDelay = 3.5f;

        public NetworkVariable<float> Current = new NetworkVariable<float>(100f);
        public NetworkVariable<bool> IsDead = new NetworkVariable<bool>(false);

        public float Max => maxHealth;
        public float Normalized => maxHealth > 0f ? Mathf.Clamp01(Current.Value / maxHealth) : 0f;

        /// <summary>Evento local: el jugador local recibió daño (para viñeta roja del HUD).</summary>
        public static event Action<float> LocalPlayerDamaged;

        PlayerIdentity m_Identity;
        ProceduralSquash m_Squash;
        ThirdPersonController m_Controller;
        Coroutine m_RespawnRoutine;

        void Awake()
        {
            m_Identity = GetComponent<PlayerIdentity>();
            m_Squash = GetComponent<ProceduralSquash>();
            m_Controller = GetComponent<ThirdPersonController>();
        }

        public override void OnNetworkSpawn()
        {
            if (IsServer)
            {
                Current.Value = maxHealth;
                IsDead.Value = false;
            }
            Current.OnValueChanged += OnHealthChanged;
            IsDead.OnValueChanged += OnDeadChanged;
            if (m_Squash != null) m_Squash.SetVisible(!IsDead.Value, true);
        }

        public override void OnNetworkDespawn()
        {
            Current.OnValueChanged -= OnHealthChanged;
            IsDead.OnValueChanged -= OnDeadChanged;
        }

        // ----------------------------- SERVIDOR -----------------------------

        /// <summary>Aplica daño (ignora fuego amigo). Sólo servidor.</summary>
        public void ServerApplyDamage(float amount, Team attackerTeam)
        {
            if (!IsServer || IsDead.Value || amount <= 0f) return;
            if (m_Identity != null && attackerTeam == m_Identity.Team) return;

            Current.Value = Mathf.Max(0f, Current.Value - amount);
            NetworkFx.Play(FxKind.PlayerHit, transform.position + Vector3.up * 1.2f);

            if (Current.Value <= 0f) ServerDie();
        }

        /// <summary>Cura (zonas de Bio-Esporas). Sólo servidor.</summary>
        public void ServerHeal(float amount)
        {
            if (!IsServer || IsDead.Value || amount <= 0f) return;
            Current.Value = Mathf.Min(maxHealth, Current.Value + amount);
        }

        void ServerDie()
        {
            IsDead.Value = true;
            NetworkFx.Play(FxKind.PlayerDeath, transform.position + Vector3.up);
            if (m_RespawnRoutine != null) StopCoroutine(m_RespawnRoutine);
            m_RespawnRoutine = StartCoroutine(RespawnAfterDelay());
        }

        IEnumerator RespawnAfterDelay()
        {
            yield return new WaitForSeconds(respawnDelay);
            ServerRespawn();
        }

        /// <summary>Restaura vida y teletransporta al jugador a su base. Sólo servidor.</summary>
        public void ServerRespawn()
        {
            if (!IsServer) return;
            if (m_RespawnRoutine != null)
            {
                StopCoroutine(m_RespawnRoutine);
                m_RespawnRoutine = null;
            }
            Team team = m_Identity != null ? m_Identity.Team : Team.Guardianes;
            SpawnPoint.GetSpawn(team, out Vector3 position, out Quaternion rotation);
            Current.Value = maxHealth;
            IsDead.Value = false;
            TeleportOwnerRpc(position, rotation);
        }

        /// <summary>El dueño tiene autoridad sobre su transform: le pedimos que se mueva él.</summary>
        [Rpc(SendTo.Owner)]
        void TeleportOwnerRpc(Vector3 position, Quaternion rotation)
        {
            if (m_Controller != null) m_Controller.Teleport(position, rotation);
            else transform.SetPositionAndRotation(position, rotation);
        }

        // ----------------------------- CLIENTES -----------------------------

        void OnHealthChanged(float previous, float current)
        {
            if (current < previous)
            {
                if (m_Squash != null) m_Squash.Punch(-6f);
                if (IsOwner) LocalPlayerDamaged?.Invoke(previous - current);
            }
        }

        void OnDeadChanged(bool previous, bool current)
        {
            if (m_Squash != null) m_Squash.SetVisible(!current, false);
        }
    }
}
