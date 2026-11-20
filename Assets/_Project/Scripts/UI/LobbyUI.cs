using RootsAndRust.Core;
using RootsAndRust.Gameplay;
using RootsAndRust.Networking;
using RootsAndRust.Player;
using TMPro;
using Unity.Netcode;
using UnityEngine;
using UnityEngine.UI;

namespace RootsAndRust.UI
{
    /// <summary>
    /// Menú principal / sala, construido por código:
    ///  1) Conexión: crear sala online (Relay+Lobby), unirse por código, o Host/Cliente por IP.
    ///  2) Selección de bando: Guardianes vs Taladores (con cupos 4/4) + botón de inicio (Host).
    ///  3) Menú de pausa (Esc): reanudar, cambiar de bando, desconectar.
    /// </summary>
    public class LobbyUI : MonoBehaviour
    {
        enum MenuScreen { Connect, ChooseTeam, InGame, Pause }

        static readonly Color k_Backdrop = new Color(0.08f, 0.16f, 0.22f, 0.55f);
        static readonly Color k_Card = new Color(1f, 0.97f, 0.9f, 0.96f);
        static readonly Color k_Ink = new Color(0.14f, 0.1f, 0.3f);
        static readonly Color k_Turquoise = new Color(0.1f, 0.72f, 0.75f);
        static readonly Color k_Violet = new Color(0.45f, 0.3f, 0.85f);

        Canvas m_Canvas;
        GameObject m_ConnectScreen;
        GameObject m_TeamScreen;
        GameObject m_PauseScreen;
        TextMeshProUGUI m_StatusText;
        TextMeshProUGUI m_TeamStatusText;
        TextMeshProUGUI m_ShareCodeText;
        TextMeshProUGUI m_GuardianButtonLabel;
        TextMeshProUGUI m_LoggerButtonLabel;
        Button m_StartMatchButton;
        TMP_InputField m_NameInput;
        TMP_InputField m_LobbyNameInput;
        TMP_InputField m_JoinCodeInput;
        TMP_InputField m_IpInput;
        TMP_InputField m_PortInput;
        MenuScreen m_Current = (MenuScreen)(-1);
        bool m_ForceTeamScreen;
        bool m_SubscribedTeamMessages;
        float m_MenuOrbitAngle = -120f;

        void Start()
        {
            BuildUI();
            if (ConnectionManager.Instance != null)
            {
                ConnectionManager.Instance.StatusChanged += OnStatusChanged;
                OnStatusChanged(ConnectionManager.Instance.Status);
            }
        }

        void OnDestroy()
        {
            if (ConnectionManager.Instance != null) ConnectionManager.Instance.StatusChanged -= OnStatusChanged;
            if (TeamManager.Instance != null) TeamManager.Instance.LocalMessage -= OnTeamMessage;
        }

        // =====================================================================
        //  Máquina de estados de pantallas
        // =====================================================================

        void Update()
        {
            var nm = NetworkManager.Singleton;
            MenuScreen target;
            if (nm == null || !nm.IsListening)
            {
                target = MenuScreen.Connect;
                m_ForceTeamScreen = false;
            }
            else if (!nm.IsConnectedClient && !nm.IsServer)
            {
                target = MenuScreen.Connect; // Conectando...
            }
            else if (PlayerIdentity.Local == null || m_ForceTeamScreen)
            {
                target = MenuScreen.ChooseTeam;
            }
            else if (GameInput.CursorFree && !GameInput.GameplayBlocked)
            {
                target = MenuScreen.Pause;
            }
            else
            {
                target = MenuScreen.InGame;
            }

            // Durante la cinemática no mostramos menús.
            if (RootsAndRust.Cinematic.IntroCinematicController.IsPlayingNow) target = MenuScreen.InGame;

            if (target != m_Current) SwitchTo(target);
            if (target == MenuScreen.ChooseTeam) RefreshTeamScreen();

            OrbitMenuCamera();

            if (!m_SubscribedTeamMessages && TeamManager.Instance != null)
            {
                TeamManager.Instance.LocalMessage += OnTeamMessage;
                m_SubscribedTeamMessages = true;
            }
        }

        /// <summary>Mientras estamos en el menú, la cámara orbita lentamente alrededor del Árbol Corazón.</summary>
        void OrbitMenuCamera()
        {
            if (PlayerIdentity.Local != null || RootsAndRust.Cinematic.IntroCinematicController.IsPlayingNow) return;
            var cam = Camera.main;
            if (cam == null) return;
            m_MenuOrbitAngle += Time.deltaTime * 4f;
            float a = m_MenuOrbitAngle * Mathf.Deg2Rad;
            cam.transform.position = new Vector3(Mathf.Cos(a) * 46f, 24f, Mathf.Sin(a) * 46f);
            cam.transform.LookAt(new Vector3(0f, 6f, 0f));
            cam.fieldOfView = 55f;
        }

        void SwitchTo(MenuScreen screen)
        {
            m_Current = screen;
            m_ConnectScreen.SetActive(screen == MenuScreen.Connect);
            m_TeamScreen.SetActive(screen == MenuScreen.ChooseTeam);
            m_PauseScreen.SetActive(screen == MenuScreen.Pause);

            bool menuOpen = screen == MenuScreen.Connect || screen == MenuScreen.ChooseTeam;
            GameInput.GameplayBlocked = menuOpen;
            if (menuOpen) GameInput.FreeCursor();
        }

        void RefreshTeamScreen()
        {
            var tm = TeamManager.Instance;
            int guardians = tm != null && tm.IsSpawned ? tm.GuardianCount.Value : 0;
            int loggers = tm != null && tm.IsSpawned ? tm.LoggerCount.Value : 0;
            m_GuardianButtonLabel.text = "GUARDIANES DEL BOSQUE\n<size=70%>Lanzador de Bio-Esporas  ·  " + guardians + "/" + TeamInfo.MaxPerTeam + "</size>";
            m_LoggerButtonLabel.text = "TALADORES S.A.\n<size=70%>Cañón de Sierras Térmicas  ·  " + loggers + "/" + TeamInfo.MaxPerTeam + "</size>";

            var cm = ConnectionManager.Instance;
            string code = cm != null ? cm.ShareCode : string.Empty;
            m_ShareCodeText.text = string.IsNullOrEmpty(code) ? string.Empty :
                (cm.Mode == ConnectionMode.OnlineRelay ? "CÓDIGO DE SALA: <color=#FF2EA8>" + code + "</color>" : "IP DEL HOST: <color=#FF2EA8>" + code + "</color>");

            bool isHost = NetworkManager.Singleton != null && NetworkManager.Singleton.IsServer;
            var loop = GameLoopManager.Instance;
            bool canStart = isHost && loop != null && loop.IsSpawned &&
                            (loop.Phase.Value == MatchPhase.Warmup || loop.Phase.Value == MatchPhase.Ended);
            m_StartMatchButton.gameObject.SetActive(canStart);
        }

        // =====================================================================
        //  Construcción de la UI
        // =====================================================================

        void BuildUI()
        {
            m_Canvas = UIFactory.CreateCanvas("LobbyCanvas", 50, transform);
            BuildConnectScreen();
            BuildTeamScreen();
            BuildPauseScreen();
            SwitchTo(MenuScreen.Connect);
        }

        void BuildConnectScreen()
        {
            m_ConnectScreen = UIFactory.CreatePanel("ConnectScreen", m_Canvas.transform, k_Backdrop).gameObject;
            UIFactory.Stretch((RectTransform)m_ConnectScreen.transform);

            var title = UIFactory.CreateText("Title", m_ConnectScreen.transform, "ROOTS <color=#FF2EA8>&</color> RUST", 110f, Color.white);
            UIFactory.Place(title.rectTransform, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0f, -40f), new Vector2(1400f, 140f));
            title.outlineWidth = 0.22f;
            title.outlineColor = new Color32(30, 20, 70, 255);

            var subtitle = UIFactory.CreateText("Subtitle", m_ConnectScreen.transform,
                "Guardianes del Bosque  vs.  Taladores S.A.  ·  4v4", 34f, Palette.FlowerYellow);
            UIFactory.Place(subtitle.rectTransform, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0f, -175f), new Vector2(1400f, 50f));

            // ----- Tarjeta ONLINE -----
            var online = Card("OnlineCard", m_ConnectScreen.transform, new Vector2(-330f, -40f), "JUGAR ONLINE (Relay)");
            m_NameInput = UIFactory.CreateInputField("NameInput", online, "Tu nombre", "Jugador" + Random.Range(10, 99));
            UIFactory.SetHeight(m_NameInput, 62f);
            m_LobbyNameInput = UIFactory.CreateInputField("LobbyNameInput", online, "Nombre de la sala", "Bosque de " + m_NameInput.text);
            UIFactory.SetHeight(m_LobbyNameInput, 62f);
            var create = UIFactory.CreateButton("CreateButton", online, "CREAR SALA ONLINE", Palette.Emerald, OnCreateOnline);
            UIFactory.SetHeight(create, 78f);
            m_JoinCodeInput = UIFactory.CreateInputField("JoinCodeInput", online, "Código de sala (ej. ABC123)", string.Empty, 32f);
            UIFactory.SetHeight(m_JoinCodeInput, 62f);
            var join = UIFactory.CreateButton("JoinButton", online, "UNIRSE CON CÓDIGO", k_Violet, OnJoinOnline);
            UIFactory.SetHeight(join, 78f);

            // ----- Tarjeta LOCAL -----
            var local = Card("LocalCard", m_ConnectScreen.transform, new Vector2(330f, -40f), "RED LOCAL / PRUEBAS");
            m_IpInput = UIFactory.CreateInputField("IpInput", local, "IP del Host", "127.0.0.1");
            UIFactory.SetHeight(m_IpInput, 62f);
            m_PortInput = UIFactory.CreateInputField("PortInput", local, "Puerto", "7777");
            UIFactory.SetHeight(m_PortInput, 62f);
            var host = UIFactory.CreateButton("HostButton", local, "HOST LOCAL", Palette.IndustrialOrange, OnLocalHost);
            UIFactory.SetHeight(host, 78f);
            var client = UIFactory.CreateButton("ClientButton", local, "CLIENTE (por IP)", k_Turquoise, OnLocalClient);
            UIFactory.SetHeight(client, 78f);
            var hint = UIFactory.CreateText("Hint", local, "Para probar solo: abre una Build como Host y el Editor como Cliente en 127.0.0.1.", 20f, k_Ink, TextAlignmentOptions.Center, false);
            UIFactory.SetHeight(hint, 60f);

            m_StatusText = UIFactory.CreateText("Status", m_ConnectScreen.transform, "", 26f, Color.white);
            UIFactory.Place(m_StatusText.rectTransform, new Vector2(0.5f, 0f), new Vector2(0.5f, 0f), new Vector2(0.5f, 0f), new Vector2(0f, 40f), new Vector2(1600f, 90f));
            m_StatusText.outlineWidth = 0.2f;
            m_StatusText.outlineColor = new Color32(20, 20, 50, 255);
        }

        Transform Card(string name, Transform parent, Vector2 position, string heading)
        {
            var card = UIFactory.CreatePanel(name, parent, k_Card);
            UIFactory.Place(card.rectTransform, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), position, new Vector2(600f, 600f));
            var shadow = card.gameObject.AddComponent<Shadow>();
            shadow.effectColor = new Color(0.1f, 0.05f, 0.3f, 0.45f);
            shadow.effectDistance = new Vector2(0f, -12f);
            UIFactory.AddVerticalLayout(card.gameObject, 14f, 28);
            var title = UIFactory.CreateText("Heading", card.transform, heading, 36f, k_Ink);
            UIFactory.SetHeight(title, 54f);
            return card.transform;
        }

        void BuildTeamScreen()
        {
            m_TeamScreen = UIFactory.CreatePanel("TeamScreen", m_Canvas.transform, k_Backdrop).gameObject;
            UIFactory.Stretch((RectTransform)m_TeamScreen.transform);

            var title = UIFactory.CreateText("Title", m_TeamScreen.transform, "ELIGE TU BANDO", 90f, Color.white);
            UIFactory.Place(title.rectTransform, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0f, -50f), new Vector2(1400f, 120f));
            title.outlineWidth = 0.22f;
            title.outlineColor = new Color32(30, 20, 70, 255);

            m_ShareCodeText = UIFactory.CreateText("ShareCode", m_TeamScreen.transform, "", 40f, Color.white);
            UIFactory.Place(m_ShareCodeText.rectTransform, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0f, -170f), new Vector2(1400f, 60f));
            m_ShareCodeText.outlineWidth = 0.2f;
            m_ShareCodeText.outlineColor = new Color32(20, 20, 50, 255);

            var guardian = UIFactory.CreateButton("GuardianButton", m_TeamScreen.transform, "", Palette.Emerald, () => ChooseTeam(Team.Guardianes), 42f);
            UIFactory.Place((RectTransform)guardian.transform, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(-340f, 0f), new Vector2(620f, 300f));
            m_GuardianButtonLabel = guardian.GetComponentInChildren<TextMeshProUGUI>();

            var logger = UIFactory.CreateButton("LoggerButton", m_TeamScreen.transform, "", Palette.IndustrialOrange, () => ChooseTeam(Team.Taladores), 42f);
            UIFactory.Place((RectTransform)logger.transform, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(340f, 0f), new Vector2(620f, 300f));
            m_LoggerButtonLabel = logger.GetComponentInChildren<TextMeshProUGUI>();

            var auto = UIFactory.CreateButton("AutoButton", m_TeamScreen.transform, "EQUILIBRAR AUTOMÁTICAMENTE", k_Turquoise, () => ChooseTeam(Team.None), 28f);
            UIFactory.Place((RectTransform)auto.transform, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0f, -220f), new Vector2(560f, 80f));

            m_StartMatchButton = UIFactory.CreateButton("StartMatchButton", m_TeamScreen.transform, "INICIAR PARTIDA (HOST)", Palette.FlowerMagenta, OnStartMatch, 30f);
            UIFactory.Place((RectTransform)m_StartMatchButton.transform, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0f, -320f), new Vector2(560f, 80f));

            var disconnect = UIFactory.CreateButton("DisconnectButton", m_TeamScreen.transform, "SALIR", new Color(0.4f, 0.4f, 0.55f), OnDisconnect, 26f);
            UIFactory.Place((RectTransform)disconnect.transform, new Vector2(0f, 0f), new Vector2(0f, 0f), new Vector2(0f, 0f), new Vector2(30f, 30f), new Vector2(200f, 64f));

            m_TeamStatusText = UIFactory.CreateText("TeamStatus", m_TeamScreen.transform, "", 28f, Palette.FlowerYellow);
            UIFactory.Place(m_TeamStatusText.rectTransform, new Vector2(0.5f, 0f), new Vector2(0.5f, 0f), new Vector2(0.5f, 0f), new Vector2(0f, 40f), new Vector2(1400f, 60f));
        }

        void BuildPauseScreen()
        {
            m_PauseScreen = UIFactory.CreatePanel("PauseScreen", m_Canvas.transform, new Color(0.05f, 0.08f, 0.15f, 0.45f)).gameObject;
            UIFactory.Stretch((RectTransform)m_PauseScreen.transform);

            var card = UIFactory.CreatePanel("PauseCard", m_PauseScreen.transform, k_Card);
            UIFactory.Place(card.rectTransform, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(520f, 470f));
            UIFactory.AddVerticalLayout(card.gameObject, 16f, 30);
            var title = UIFactory.CreateText("Title", card.transform, "PAUSA", 50f, k_Ink);
            UIFactory.SetHeight(title, 70f);
            UIFactory.SetHeight(UIFactory.CreateButton("Resume", card.transform, "REANUDAR", Palette.Emerald, GameInput.LockCursor), 80f);
            UIFactory.SetHeight(UIFactory.CreateButton("SwitchTeam", card.transform, "CAMBIAR DE BANDO", k_Violet, () => m_ForceTeamScreen = true), 80f);
            UIFactory.SetHeight(UIFactory.CreateButton("Disconnect", card.transform, "DESCONECTAR", new Color(0.45f, 0.42f, 0.6f), OnDisconnect), 80f);
            var hint = UIFactory.CreateText("Hint", card.transform, "Esc o clic en el juego para volver", 20f, k_Ink, TextAlignmentOptions.Center, false);
            UIFactory.SetHeight(hint, 40f);
        }

        // =====================================================================
        //  Acciones
        // =====================================================================

        void SaveName()
        {
            if (m_NameInput != null && !string.IsNullOrWhiteSpace(m_NameInput.text))
                PlayerIdentity.LocalPlayerName = m_NameInput.text.Trim();
        }

        void OnCreateOnline()
        {
            SaveName();
            ConnectionManager.Instance?.CreateOnlineGame(m_LobbyNameInput.text);
        }

        void OnJoinOnline()
        {
            SaveName();
            ConnectionManager.Instance?.JoinOnlineGame(m_JoinCodeInput.text);
        }

        void OnLocalHost()
        {
            SaveName();
            ConnectionManager.Instance?.StartLocalHost(ParsePort());
        }

        void OnLocalClient()
        {
            SaveName();
            ConnectionManager.Instance?.StartLocalClient(m_IpInput.text, ParsePort());
        }

        ushort ParsePort()
        {
            ushort fallback = ConnectionManager.Instance != null ? ConnectionManager.Instance.DefaultPort : (ushort)7777;
            return ushort.TryParse(m_PortInput.text, out ushort port) && port > 0 ? port : fallback;
        }

        void ChooseTeam(Team team)
        {
            m_ForceTeamScreen = false;
            if (TeamManager.Instance == null || !TeamManager.Instance.IsSpawned)
            {
                m_TeamStatusText.text = "Esperando al servidor...";
                return;
            }
            if (PlayerIdentity.Local != null && PlayerIdentity.Local.Team == team)
            {
                GameInput.LockCursor();
                return;
            }
            m_TeamStatusText.text = "Uniéndose a " + (team == Team.None ? "un equipo" : TeamInfo.ShortName(team)) + "...";
            TeamManager.Instance.RequestJoinTeam(team);
        }

        void OnStartMatch()
        {
            GameLoopManager.Instance?.RequestStartMatch();
        }

        void OnDisconnect()
        {
            m_ForceTeamScreen = false;
            ConnectionManager.Instance?.Disconnect();
        }

        void OnStatusChanged(string status)
        {
            if (m_StatusText != null) m_StatusText.text = status;
            if (m_TeamStatusText != null && m_Current == MenuScreen.ChooseTeam) m_TeamStatusText.text = status;
        }

        void OnTeamMessage(string message)
        {
            if (m_TeamStatusText != null) m_TeamStatusText.text = message;
        }
    }
}
