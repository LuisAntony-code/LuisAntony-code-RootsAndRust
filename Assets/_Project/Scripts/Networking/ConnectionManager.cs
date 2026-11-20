using System;
using System.Collections;
using System.Collections.Generic;
using System.Net;
using System.Net.Sockets;
using System.Threading.Tasks;
using Unity.Netcode;
using Unity.Netcode.Transports.UTP;
using Unity.Services.Authentication;
using Unity.Services.Core;
using Unity.Services.Lobbies;
using Unity.Services.Lobbies.Models;
using Unity.Services.Relay;
using Unity.Services.Relay.Models;
using UnityEngine;

namespace RootsAndRust.Networking
{
    /// <summary>Cómo está conectada esta instancia.</summary>
    public enum ConnectionMode
    {
        Offline,
        OnlineRelay,
        LocalNetwork
    }

    /// <summary>
    /// Punto único de conexión del juego.
    ///
    /// ONLINE (sin abrir puertos):
    ///   Unity Authentication (anónimo) -> Relay (reserva de servidor de retransmisión)
    ///   -> Lobby (sala con código corto de 6 letras que guarda el código de Relay).
    ///   Tus compañeros sólo necesitan el código de sala.
    ///
    /// LOCAL (pruebas rápidas):
    ///   Host / Cliente por IP directa usando UnityTransport (puerto 7777 por defecto).
    ///
    /// Vive en el mismo GameObject que el NetworkManager.
    /// </summary>
    [RequireComponent(typeof(NetworkManager))]
    [RequireComponent(typeof(UnityTransport))]
    public class ConnectionManager : MonoBehaviour
    {
        /// <summary>4 Guardianes + 4 Taladores.</summary>
        public const int MaxPlayers = RootsAndRust.Core.TeamInfo.MaxPerTeam * 2;
        const string k_RelayCodeKey = "RelayJoinCode";
        const string k_ConnectionType = "dtls";

        public static ConnectionManager Instance { get; private set; }

        [Header("Red local")]
        [SerializeField] ushort defaultPort = 7777;

        [Header("Lobby")]
        [SerializeField] float lobbyHeartbeatSeconds = 15f;

        /// <summary>Se dispara cada vez que cambia el texto de estado (para la UI).</summary>
        public event Action<string> StatusChanged;

        public string Status { get; private set; } = "Desconectado";
        public ConnectionMode Mode { get; private set; } = ConnectionMode.Offline;
        public bool IsBusy { get; private set; }

        /// <summary>Código para compartir: código de Lobby (online) o IP:puerto (local).</summary>
        public string ShareCode { get; private set; } = string.Empty;

        public ushort DefaultPort => defaultPort;

        NetworkManager m_NetworkManager;
        UnityTransport m_Transport;
        Lobby m_Lobby;
        Coroutine m_HeartbeatRoutine;

        void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            m_NetworkManager = GetComponent<NetworkManager>();
            m_Transport = GetComponent<UnityTransport>();
        }

        void Start()
        {
            m_NetworkManager.NetworkConfig.ConnectionApproval = true;
            m_NetworkManager.NetworkConfig.NetworkTransport = m_Transport;
            m_NetworkManager.ConnectionApprovalCallback = ApprovalCheck;
            m_NetworkManager.OnClientDisconnectCallback += OnClientDisconnected;
        }

        void OnDestroy()
        {
            if (m_NetworkManager != null)
            {
                m_NetworkManager.OnClientDisconnectCallback -= OnClientDisconnected;
                m_NetworkManager.ConnectionApprovalCallback = null;
            }
            if (Instance == this) Instance = null;
        }

        void OnApplicationQuit()
        {
            // Mejor esfuerzo: borrar/abandonar la sala para no dejar lobbies fantasma.
            _ = LeaveLobbyAsync();
        }

        // =====================================================================
        //  Aprobación de conexiones (máx. 8 jugadores)
        // =====================================================================
        void ApprovalCheck(NetworkManager.ConnectionApprovalRequest request, NetworkManager.ConnectionApprovalResponse response)
        {
            int connected = m_NetworkManager.ConnectedClientsIds.Count;
            bool hasRoom = connected < MaxPlayers;
            response.Approved = hasRoom;
            response.CreatePlayerObject = false; // El jugador se crea al elegir bando (TeamManager).
            response.Pending = false;
            if (!hasRoom) response.Reason = "La sala está llena (4v4).";
        }

        void OnClientDisconnected(ulong clientId)
        {
            // Sólo nos interesa cuando NOSOTROS (cliente) perdemos la conexión.
            if (m_NetworkManager.IsServer || clientId != m_NetworkManager.LocalClientId) return;
            string reason = m_NetworkManager.DisconnectReason;
            SetStatus(string.IsNullOrEmpty(reason) ? "Desconectado del Host." : "Desconectado: " + reason);
            Mode = ConnectionMode.Offline;
            ShareCode = string.Empty;
            _ = LeaveLobbyAsync();
        }

        // =====================================================================
        //  ONLINE: Unity Services (Auth + Relay + Lobby)
        // =====================================================================

        /// <summary>Inicializa Unity Services e inicia sesión anónima.</summary>
        async Task<bool> EnsureSignedInAsync()
        {
            try
            {
                if (UnityServices.State == ServicesInitializationState.Uninitialized)
                {
                    var options = new InitializationOptions();
                    // Perfil aleatorio: permite abrir varias instancias en el mismo PC
                    // (Editor + Build) sin que compartan el mismo jugador anónimo.
                    options.SetProfile("rr" + UnityEngine.Random.Range(0, 999999));
                    await UnityServices.InitializeAsync(options);
                }

                while (UnityServices.State == ServicesInitializationState.Initializing)
                    await Task.Yield();

                if (!AuthenticationService.Instance.IsSignedIn)
                    await AuthenticationService.Instance.SignInAnonymouslyAsync();

                return true;
            }
            catch (Exception e)
            {
                Debug.LogException(e);
                SetStatus("No se pudo conectar a Unity Services. ¿El proyecto está vinculado a Unity Cloud " +
                          "(Edit > Project Settings > Services)? Detalle: " + e.Message);
                return false;
            }
        }

        /// <summary>Crea una partida online: Relay + Lobby y arranca como Host.</summary>
        public async void CreateOnlineGame(string lobbyName)
        {
            if (IsBusy || m_NetworkManager.IsListening) return;
            IsBusy = true;
            try
            {
                SetStatus("Conectando con Unity Services...");
                if (!await EnsureSignedInAsync()) return;

                SetStatus("Reservando servidor Relay...");
                Allocation allocation = await RelayService.Instance.CreateAllocationAsync(MaxPlayers - 1);
                string relayCode = await RelayService.Instance.GetJoinCodeAsync(allocation.AllocationId);

                RelayServerEndpoint endpoint = PickEndpoint(allocation.ServerEndpoints);
                m_Transport.SetRelayServerData(endpoint.Host, (ushort)endpoint.Port,
                    allocation.AllocationIdBytes, allocation.Key, allocation.ConnectionData, null, endpoint.Secure);

                SetStatus("Creando sala...");
                var options = new CreateLobbyOptions
                {
                    IsPrivate = false,
                    Data = new Dictionary<string, DataObject>
                    {
                        { k_RelayCodeKey, new DataObject(DataObject.VisibilityOptions.Member, relayCode) }
                    }
                };
                string name = string.IsNullOrWhiteSpace(lobbyName) ? "Roots & Rust" : lobbyName.Trim();
                m_Lobby = await LobbyService.Instance.CreateLobbyAsync(name, MaxPlayers, options);
                m_HeartbeatRoutine = StartCoroutine(HeartbeatLobby());

                if (!m_NetworkManager.StartHost())
                    throw new Exception("NetworkManager.StartHost() devolvió false.");

                Mode = ConnectionMode.OnlineRelay;
                ShareCode = m_Lobby.LobbyCode;
                SetStatus("¡Sala creada! Comparte el código: " + ShareCode);
            }
            catch (Exception e)
            {
                Debug.LogException(e);
                SetStatus("Error al crear la sala: " + e.Message);
                await LeaveLobbyAsync();
            }
            finally
            {
                IsBusy = false;
            }
        }

        /// <summary>
        /// Se une a una partida online. Acepta código de Lobby (recomendado)
        /// o, como alternativa, el código de Relay directamente.
        /// </summary>
        public async void JoinOnlineGame(string code)
        {
            if (IsBusy || m_NetworkManager.IsListening) return;
            if (string.IsNullOrWhiteSpace(code))
            {
                SetStatus("Escribe el código de sala.");
                return;
            }

            IsBusy = true;
            code = code.Trim().ToUpperInvariant();
            try
            {
                SetStatus("Conectando con Unity Services...");
                if (!await EnsureSignedInAsync()) return;

                string relayCode = code;
                try
                {
                    SetStatus("Buscando sala " + code + "...");
                    m_Lobby = await LobbyService.Instance.JoinLobbyByCodeAsync(code);
                    if (m_Lobby.Data != null && m_Lobby.Data.TryGetValue(k_RelayCodeKey, out DataObject data))
                        relayCode = data.Value;
                }
                catch (LobbyServiceException lobbyError)
                {
                    // Puede que nos hayan pasado directamente un código de Relay.
                    Debug.LogWarning("No es un código de Lobby válido, se intentará como código Relay. " + lobbyError.Message);
                    m_Lobby = null;
                }

                SetStatus("Uniéndose al servidor Relay...");
                JoinAllocation join = await RelayService.Instance.JoinAllocationAsync(relayCode);
                RelayServerEndpoint endpoint = PickEndpoint(join.ServerEndpoints);
                m_Transport.SetRelayServerData(endpoint.Host, (ushort)endpoint.Port,
                    join.AllocationIdBytes, join.Key, join.ConnectionData, join.HostConnectionData, endpoint.Secure);

                if (!m_NetworkManager.StartClient())
                    throw new Exception("NetworkManager.StartClient() devolvió false.");

                Mode = ConnectionMode.OnlineRelay;
                ShareCode = code;
                SetStatus("Conectado a la sala " + code);
            }
            catch (Exception e)
            {
                Debug.LogException(e);
                SetStatus("No se pudo unir: " + e.Message);
                await LeaveLobbyAsync();
            }
            finally
            {
                IsBusy = false;
            }
        }

        static RelayServerEndpoint PickEndpoint(List<RelayServerEndpoint> endpoints)
        {
            foreach (var ep in endpoints)
                if (ep.ConnectionType == k_ConnectionType) return ep;
            foreach (var ep in endpoints)
                if (ep.ConnectionType == "udp") return ep;
            if (endpoints.Count > 0) return endpoints[0];
            throw new Exception("Relay no devolvió endpoints.");
        }

        IEnumerator HeartbeatLobby()
        {
            var wait = new WaitForSecondsRealtime(lobbyHeartbeatSeconds);
            while (m_Lobby != null)
            {
                yield return wait;
                if (m_Lobby == null) yield break;
                var task = LobbyService.Instance.SendHeartbeatPingAsync(m_Lobby.Id);
                while (!task.IsCompleted) yield return null;
                if (task.IsFaulted) Debug.LogWarning("Heartbeat de Lobby falló: " + task.Exception?.GetBaseException().Message);
            }
        }

        async Task LeaveLobbyAsync()
        {
            if (m_HeartbeatRoutine != null)
            {
                StopCoroutine(m_HeartbeatRoutine);
                m_HeartbeatRoutine = null;
            }

            var lobby = m_Lobby;
            m_Lobby = null;
            if (lobby == null) return;

            try
            {
                string playerId = AuthenticationService.Instance.PlayerId;
                if (lobby.HostId == playerId)
                    await LobbyService.Instance.DeleteLobbyAsync(lobby.Id);
                else
                    await LobbyService.Instance.RemovePlayerAsync(lobby.Id, playerId);
            }
            catch (Exception e)
            {
                Debug.LogWarning("Al salir de la sala: " + e.Message);
            }
        }

        // =====================================================================
        //  LOCAL: Host / Cliente por IP
        // =====================================================================

        /// <summary>Arranca como Host en red local escuchando en todas las interfaces.</summary>
        public void StartLocalHost(ushort port)
        {
            if (m_NetworkManager.IsListening) return;
            if (port == 0) port = defaultPort;
            m_Transport.SetConnectionData("127.0.0.1", port, "0.0.0.0");
            if (m_NetworkManager.StartHost())
            {
                Mode = ConnectionMode.LocalNetwork;
                ShareCode = GetLocalIPv4() + ":" + port;
                SetStatus("Host local listo. Tus compañeros se conectan a " + ShareCode);
            }
            else
            {
                SetStatus("No se pudo iniciar el Host (¿puerto " + port + " ocupado?).");
            }
        }

        /// <summary>Se conecta como cliente a una IP de la red local.</summary>
        public void StartLocalClient(string ip, ushort port)
        {
            if (m_NetworkManager.IsListening) return;
            if (string.IsNullOrWhiteSpace(ip)) ip = "127.0.0.1";
            if (port == 0) port = defaultPort;
            m_Transport.SetConnectionData(ip.Trim(), port);
            if (m_NetworkManager.StartClient())
            {
                Mode = ConnectionMode.LocalNetwork;
                ShareCode = ip.Trim() + ":" + port;
                SetStatus("Conectando a " + ShareCode + "...");
            }
            else
            {
                SetStatus("No se pudo iniciar el cliente.");
            }
        }

        // =====================================================================
        //  Común
        // =====================================================================

        /// <summary>Cierra la conexión (host o cliente) y abandona la sala.</summary>
        public async void Disconnect()
        {
            if (m_NetworkManager.IsListening) m_NetworkManager.Shutdown();
            Mode = ConnectionMode.Offline;
            ShareCode = string.Empty;
            SetStatus("Desconectado");
            await LeaveLobbyAsync();
        }

        void SetStatus(string message)
        {
            Status = message;
            Debug.Log("[Conexión] " + message);
            StatusChanged?.Invoke(message);
        }

        /// <summary>IP local (LAN) de esta máquina, para mostrarla al Host.</summary>
        public static string GetLocalIPv4()
        {
            try
            {
                foreach (var address in Dns.GetHostEntry(Dns.GetHostName()).AddressList)
                {
                    if (address.AddressFamily == AddressFamily.InterNetwork && !IPAddress.IsLoopback(address))
                        return address.ToString();
                }
            }
            catch (Exception)
            {
                // Sin red: devolvemos loopback.
            }
            return "127.0.0.1";
        }
    }
}
