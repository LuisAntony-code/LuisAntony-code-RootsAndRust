using System;
using System.Collections.Generic;
using RootsAndRust.Core;
using RootsAndRust.Networking;
using Unity.Netcode;
using UnityEngine;

namespace RootsAndRust.Gameplay
{
    public enum MatchPhase : byte
    {
        /// <summary>Calentamiento: se puede jugar libremente hasta que el Host inicie.</summary>
        Warmup,
        /// <summary>Cuenta atrás de 3 segundos.</summary>
        Countdown,
        /// <summary>Partida de 4 minutos en curso.</summary>
        Playing,
        /// <summary>Resultados.</summary>
        Ended
    }

    /// <summary>
    /// Bucle de partida 4v4 sincronizado en red (autoridad del servidor).
    ///
    ///  - Partidas de 4 minutos. El tiempo se sincroniza enviando la hora de FIN en
    ///    tiempo de servidor, así cada cliente calcula el restante sin tráfico extra.
    ///  - Cuenta el porcentaje de "Bosque Vivo vs. Madera Talada" (árboles vivos / total).
    ///  - Último minuto: FRENESÍ FINAL -> duplica cadencia de disparo, crecimiento y tala,
    ///    y lanza confeti festivo por todo el mapa.
    ///  - Al terminar: gana Guardianes si el bosque vivo es > 50 %, Taladores si es < 50 %.
    /// </summary>
    public class GameLoopManager : NetworkBehaviour
    {
        public static GameLoopManager Instance { get; private set; }

        [Header("Duraciones (segundos)")]
        [SerializeField] float matchDuration = 240f;
        [SerializeField] float frenzyDuration = 60f;
        [SerializeField] float countdownDuration = 3f;
        [SerializeField] float resultsDuration = 10f;

        [Header("Frenesí Final")]
        [SerializeField] float frenzyMultiplier = 2f;
        [SerializeField] float confettiInterval = 0.35f;
        [SerializeField] float confettiRadius = 38f;

        public NetworkVariable<MatchPhase> Phase = new NetworkVariable<MatchPhase>(MatchPhase.Warmup);
        public NetworkVariable<double> PhaseEndTime = new NetworkVariable<double>(0);
        public NetworkVariable<float> ForestPercent = new NetworkVariable<float>(1f);
        public NetworkVariable<bool> Frenzy = new NetworkVariable<bool>(false);
        public NetworkVariable<Team> Winner = new NetworkVariable<Team>(Team.None);

        /// <summary>Multiplicador global (x2 durante el Frenesí Final).</summary>
        public static float FrenzyMultiplier =>
            Instance != null && Instance.IsSpawned && Instance.Frenzy.Value ? Instance.frenzyMultiplier : 1f;

        /// <summary>Eventos locales para la UI.</summary>
        public event Action<MatchPhase> PhaseChanged;
        public event Action<bool> FrenzyChanged;

        public bool CombatAllowed => Phase.Value == MatchPhase.Warmup || Phase.Value == MatchPhase.Playing;
        public float MatchDuration => matchDuration;

        double ServerNow => NetworkManager != null ? NetworkManager.ServerTime.Time : 0d;

        /// <summary>Segundos restantes de la fase actual.</summary>
        public float TimeRemaining
        {
            get
            {
                if (!IsSpawned || Phase.Value == MatchPhase.Warmup) return matchDuration;
                return Mathf.Max(0f, (float)(PhaseEndTime.Value - ServerNow));
            }
        }

        float m_NextForestCheck;
        float m_NextConfetti;
        readonly List<ParticleSystem> m_FrenzyEmitters = new List<ParticleSystem>();

        void Awake()
        {
            Instance = this;
        }

        public override void OnNetworkSpawn()
        {
            Instance = this;
            Phase.OnValueChanged += OnPhaseChanged;
            Frenzy.OnValueChanged += OnFrenzyChanged;
            if (Frenzy.Value) StartFrenzyVisuals();
        }

        public override void OnNetworkDespawn()
        {
            Phase.OnValueChanged -= OnPhaseChanged;
            Frenzy.OnValueChanged -= OnFrenzyChanged;
            StopFrenzyVisuals();
        }

        // =====================================================================
        //  SERVIDOR
        // =====================================================================

        /// <summary>El Host inicia la partida (botón del lobby o tecla Enter).</summary>
        public void RequestStartMatch()
        {
            if (!IsServer || !IsSpawned) return;
            if (Phase.Value != MatchPhase.Warmup && Phase.Value != MatchPhase.Ended) return;
            ServerResetArena();
            Phase.Value = MatchPhase.Countdown;
            PhaseEndTime.Value = ServerNow + countdownDuration;
        }

        void ServerResetArena()
        {
            foreach (var tree in DynamicTree.All)
                if (tree != null) tree.ServerResetTree();
            EffectZone.ServerClearAll();
            if (TeamManager.Instance != null) TeamManager.Instance.ServerRespawnEveryone();
            Frenzy.Value = false;
            Winner.Value = Team.None;
            ForestPercent.Value = 1f;
        }

        void Update()
        {
            if (!IsSpawned) return;
            if (IsServer) ServerTick();
            if (Frenzy.Value) LocalFrenzyTick();
        }

        void ServerTick()
        {
            if (Time.time >= m_NextForestCheck)
            {
                m_NextForestCheck = Time.time + 0.5f;
                ForestPercent.Value = ComputeForestPercent();
            }

            double now = ServerNow;
            switch (Phase.Value)
            {
                case MatchPhase.Countdown:
                    if (now >= PhaseEndTime.Value)
                    {
                        Phase.Value = MatchPhase.Playing;
                        PhaseEndTime.Value = now + matchDuration;
                    }
                    break;

                case MatchPhase.Playing:
                    double remaining = PhaseEndTime.Value - now;
                    if (!Frenzy.Value && remaining <= frenzyDuration) Frenzy.Value = true;
                    if (remaining <= 0d)
                    {
                        Frenzy.Value = false;
                        float forest = ComputeForestPercent();
                        ForestPercent.Value = forest;
                        Winner.Value = forest > 0.5f ? Team.Guardianes : forest < 0.5f ? Team.Taladores : Team.None;
                        Phase.Value = MatchPhase.Ended;
                        PhaseEndTime.Value = now + resultsDuration;
                    }
                    break;

                case MatchPhase.Ended:
                    if (now >= PhaseEndTime.Value)
                    {
                        ServerResetArena();
                        Phase.Value = MatchPhase.Warmup;
                    }
                    break;
            }
        }

        /// <summary>Porcentaje de bosque vivo (0..1).</summary>
        public static float ComputeForestPercent()
        {
            int total = 0, alive = 0;
            foreach (var tree in DynamicTree.All)
            {
                if (tree == null || !tree.IsSpawned) continue;
                total++;
                if (tree.IsAlive) alive++;
            }
            return total == 0 ? 1f : (float)alive / total;
        }

        // =====================================================================
        //  CLIENTES (visuales)
        // =====================================================================

        void OnPhaseChanged(MatchPhase previous, MatchPhase current)
        {
            PhaseChanged?.Invoke(current);
            if (current == MatchPhase.Ended)
            {
                // Lluvia de confeti para celebrar el final.
                for (int i = 0; i < 8; i++)
                    VfxFactory.Play(FxKind.Confetti, RandomArenaPoint(18f) + Vector3.up * 6f, 1.3f);
            }
        }

        void OnFrenzyChanged(bool previous, bool current)
        {
            FrenzyChanged?.Invoke(current);
            if (current) StartFrenzyVisuals();
            else StopFrenzyVisuals();
        }

        void StartFrenzyVisuals()
        {
            StopFrenzyVisuals();
            // Columnas de chispas festivas alrededor del mapa.
            for (int i = 0; i < 10; i++)
            {
                float angle = i * Mathf.PI * 2f / 10f;
                var anchor = new GameObject("FrenzyEmitter_" + i).transform;
                anchor.position = new Vector3(Mathf.Cos(angle), 0f, Mathf.Sin(angle)) * (confettiRadius * 0.7f) + Vector3.up * 0.5f;
                bool even = i % 2 == 0;
                var emitter = VfxFactory.Emitter(anchor, Vector3.zero,
                    even ? Palette.FlowerMagenta : Palette.SparkAmber,
                    even ? Palette.Lime : Palette.FlowerYellow,
                    30f, 9f, 0.35f, 2.2f, 0.5f, 1.5f);
                m_FrenzyEmitters.Add(emitter);
            }
        }

        void StopFrenzyVisuals()
        {
            foreach (var emitter in m_FrenzyEmitters)
                if (emitter != null) Destroy(emitter.transform.parent != null ? emitter.transform.parent.gameObject : emitter.gameObject);
            m_FrenzyEmitters.Clear();
        }

        void LocalFrenzyTick()
        {
            if (Time.time < m_NextConfetti) return;
            m_NextConfetti = Time.time + confettiInterval;
            VfxFactory.Play(FxKind.Confetti, RandomArenaPoint(confettiRadius) + Vector3.up * UnityEngine.Random.Range(6f, 12f), 0.9f);
        }

        Vector3 RandomArenaPoint(float radius)
        {
            Vector2 p = UnityEngine.Random.insideUnitCircle * radius;
            return new Vector3(p.x, 2f, p.y);
        }
    }
}
