using System;
using System.Collections.Generic;
using RootsAndRust.Core;
using RootsAndRust.Player;
using Unity.Netcode;
using UnityEngine;

namespace RootsAndRust.Networking
{
    /// <summary>
    /// Asignación de equipos 4v4 (autoridad del servidor).
    ///  - Equipo A: Guardianes / Activistas (máx. 4)
    ///  - Equipo B: Taladores / Corporación (máx. 4)
    /// Cuando un cliente elige bando, el servidor valida el cupo, instancia el
    /// prefab correcto en un punto de aparición y lo registra como PlayerObject.
    /// </summary>
    public class TeamManager : NetworkBehaviour
    {
        public static TeamManager Instance { get; private set; }

        [Header("Prefabs de jugador (los asigna el asistente)")]
        [SerializeField] GameObject guardianPlayerPrefab;
        [SerializeField] GameObject loggerPlayerPrefab;

        /// <summary>Jugadores por equipo (sincronizado para la UI).</summary>
        public NetworkVariable<int> GuardianCount = new NetworkVariable<int>();
        public NetworkVariable<int> LoggerCount = new NetworkVariable<int>();

        /// <summary>Mensajes para el jugador local (equipo lleno, etc.).</summary>
        public event Action<string> LocalMessage;

        readonly Dictionary<ulong, Team> m_Teams = new Dictionary<ulong, Team>();

        void Awake()
        {
            Instance = this;
        }

        public override void OnNetworkSpawn()
        {
            Instance = this;
            if (IsServer)
                NetworkManager.OnClientDisconnectCallback += HandleClientDisconnected;
        }

        public override void OnNetworkDespawn()
        {
            if (IsServer && NetworkManager != null)
                NetworkManager.OnClientDisconnectCallback -= HandleClientDisconnected;
            m_Teams.Clear();
        }

        public int CountFor(Team team) => team == Team.Taladores ? LoggerCount.Value : GuardianCount.Value;

        /// <summary>Equipo de un cliente (sólo válido en servidor).</summary>
        public Team GetTeam(ulong clientId) => m_Teams.TryGetValue(clientId, out var t) ? t : Team.None;

        /// <summary>Llamado desde la UI del cliente local. Team.None = equilibrar automáticamente.</summary>
        public void RequestJoinTeam(Team team)
        {
            if (!IsSpawned) return;
            RequestTeamRpc(team);
        }

        [Rpc(SendTo.Server)]
        void RequestTeamRpc(Team requested, RpcParams rpcParams = default)
        {
            ulong clientId = rpcParams.Receive.SenderClientId;

            if (m_Teams.TryGetValue(clientId, out Team current))
            {
                if (current == requested || requested == Team.None) return;
                // Cambio de equipo: liberamos su jugador actual.
                if (NetworkManager.ConnectedClients.TryGetValue(clientId, out var client) && client.PlayerObject != null)
                    client.PlayerObject.Despawn(true);
                m_Teams.Remove(clientId);
                RefreshCounts();
            }

            Team assigned = requested;
            if (assigned == Team.None)
                assigned = CountServer(Team.Guardianes) <= CountServer(Team.Taladores) ? Team.Guardianes : Team.Taladores;

            if (CountServer(assigned) >= TeamInfo.MaxPerTeam)
            {
                Team other = TeamInfo.Opponent(assigned);
                if (CountServer(other) >= TeamInfo.MaxPerTeam)
                {
                    NotifyRpc("Ambos equipos están llenos.", RpcTarget.Single(clientId, RpcTargetUse.Temp));
                    return;
                }
                NotifyRpc(TeamInfo.ShortName(assigned) + " está lleno: te unes a " + TeamInfo.ShortName(other) + ".",
                    RpcTarget.Single(clientId, RpcTargetUse.Temp));
                assigned = other;
            }

            m_Teams[clientId] = assigned;
            RefreshCounts();
            SpawnPlayerFor(clientId, assigned);
        }

        [Rpc(SendTo.SpecifiedInParams)]
        void NotifyRpc(string message, RpcParams rpcParams = default)
        {
            LocalMessage?.Invoke(message);
        }

        void SpawnPlayerFor(ulong clientId, Team team)
        {
            GameObject prefab = team == Team.Taladores ? loggerPlayerPrefab : guardianPlayerPrefab;
            if (prefab == null && GameAssets.Instance != null) prefab = GameAssets.Instance.GetPlayerPrefab(team);
            if (prefab == null)
            {
                Debug.LogError("[TeamManager] Falta el prefab de jugador para " + team + ". Ejecuta RootsAndRust > 1. Generar Escena y Prefabs Jugables.");
                return;
            }

            SpawnPoint.GetSpawn(team, out Vector3 position, out Quaternion rotation);
            GameObject instance = Instantiate(prefab, position, rotation);
            instance.GetComponent<NetworkObject>().SpawnAsPlayerObject(clientId, true);
        }

        int CountServer(Team team)
        {
            int count = 0;
            foreach (var pair in m_Teams)
                if (pair.Value == team) count++;
            return count;
        }

        void RefreshCounts()
        {
            GuardianCount.Value = CountServer(Team.Guardianes);
            LoggerCount.Value = CountServer(Team.Taladores);
        }

        void HandleClientDisconnected(ulong clientId)
        {
            if (m_Teams.Remove(clientId)) RefreshCounts();
        }

        /// <summary>Reaparece a todos los jugadores en su base (inicio de partida).</summary>
        public void ServerRespawnEveryone()
        {
            if (!IsServer) return;
            foreach (var identity in PlayerIdentity.All)
            {
                var health = identity.GetComponent<Health>();
                if (health != null) health.ServerRespawn();
            }
        }
    }
}
