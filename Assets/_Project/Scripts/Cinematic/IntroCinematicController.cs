using System.Collections.Generic;
using RootsAndRust.Core;
using RootsAndRust.Gameplay;
using RootsAndRust.Player;
using RootsAndRust.UI;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace RootsAndRust.Cinematic
{
    /// <summary>
    /// Cinemática de apertura de 15 segundos con "cámaras virtuales" propias
    /// (interpolación suave, no requiere Cinemachine):
    ///
    ///   0.0 - 5.0 s  PLANO 1: panorámica orbital descendente sobre el Árbol Corazón + título.
    ///   5.0 - 10.5 s PLANO 2: travelling lateral a ras de suelo; Guardianes y Taladores
    ///                cargan desde sus bases y chocan junto al árbol (esporas vs. chispas).
    ///  10.5 - 15.0 s PLANO 3: grúa ascendente que se funde suavemente con la cámara en
    ///                tercera persona del jugador.
    ///
    /// Pulsa ESPACIO para saltarla (transición rápida a la cámara del jugador).
    /// Cada plano es una función pura (tiempo -> pose); entre planos hay mezclas suaves.
    /// </summary>
    public class IntroCinematicController : MonoBehaviour
    {
        public static IntroCinematicController Instance { get; private set; }

        /// <summary>¿Se está reproduciendo ahora mismo?</summary>
        public static bool IsPlayingNow => Instance != null && Instance.m_Playing;

        /// <summary>Se reproduce una sola vez por sesión.</summary>
        public static bool HasPlayed { get; private set; }

        [Header("Escena")]
        [SerializeField] Transform heartTree;
        [SerializeField] Transform guardianBase;
        [SerializeField] Transform loggerBase;

        [Header("Tiempos")]
        [SerializeField] float duration = 15f;
        [SerializeField] float shotBlend = 0.8f;
        [SerializeField] float finalBlend = 2.5f;
        [SerializeField] float skipBlend = 0.7f;

        [Header("Choque")]
        [SerializeField] int actorsPerTeam = 4;
        [SerializeField] float clashOffsetZ = -8f;

        struct Pose
        {
            public Vector3 Position;
            public Quaternion Rotation;
            public float Fov;

            public static Pose Lerp(Pose a, Pose b, float t)
            {
                return new Pose
                {
                    Position = Vector3.Lerp(a.Position, b.Position, t),
                    Rotation = Quaternion.Slerp(a.Rotation, b.Rotation, t),
                    Fov = Mathf.Lerp(a.Fov, b.Fov, t)
                };
            }
        }

        class Actor
        {
            public Transform Transform;
            public Vector3 Start;
            public Vector3 Target;
            public float Delay;
            public Team Team;
            public float NextShot;
        }

        Camera m_Camera;
        ThirdPersonController m_Target;
        bool m_Playing;
        float m_Time;
        bool m_Skipping;
        float m_SkipStart;
        Pose m_SkipFrom;
        readonly List<Actor> m_Actors = new List<Actor>();
        Canvas m_Overlay;
        RectTransform m_TopBar;
        RectTransform m_BottomBar;
        TextMeshProUGUI m_Title;
        TextMeshProUGUI m_Subtitle;
        TextMeshProUGUI m_SkipHint;
        bool m_ClashFxDone;

        Vector3 HeartPosition => heartTree != null ? heartTree.position : Vector3.zero;
        Vector3 Focus => HeartPosition + Vector3.up * 7f;
        Vector3 ClashCenter => GroundAt(HeartPosition + new Vector3(0f, 0f, clashOffsetZ));

        void Awake()
        {
            Instance = this;
        }

        void OnDestroy()
        {
            if (Instance == this) Instance = null;
        }

        /// <summary>Empieza la cinemática y al acabar entrega la cámara a <paramref name="target"/>.</summary>
        public void Play(ThirdPersonController target)
        {
            m_Target = target;
            m_Camera = Camera.main;
            HasPlayed = true;
            if (m_Camera == null)
            {
                Finish();
                return;
            }

            m_Playing = true;
            m_Time = 0f;
            m_Skipping = false;
            m_ClashFxDone = false;
            BuildOverlay();
            SpawnActors();
        }

        void LateUpdate()
        {
            if (!m_Playing) return;
            m_Time += Time.deltaTime;

            if (!m_Skipping && GameInput.SkipPressed && m_Time > 0.2f)
            {
                m_Skipping = true;
                m_SkipStart = m_Time;
                m_SkipFrom = CurrentCameraPose();
            }

            Pose pose;
            if (m_Skipping)
            {
                float t = Smoother((m_Time - m_SkipStart) / skipBlend);
                pose = Pose.Lerp(m_SkipFrom, PlayerPose(), t);
                if (t >= 1f)
                {
                    Apply(pose);
                    Finish();
                    return;
                }
            }
            else
            {
                pose = EvaluateTimeline(m_Time);
                if (m_Time >= duration)
                {
                    Apply(PlayerPose());
                    Finish();
                    return;
                }
            }

            Apply(pose);
            UpdateActors();
            UpdateOverlay();
        }

        // =====================================================================
        //  Línea de tiempo de planos
        // =====================================================================

        Pose EvaluateTimeline(float t)
        {
            const float shot2Start = 5f;
            const float shot3Start = 10.5f;
            float finalStart = duration - finalBlend;

            Pose pose;
            if (t < shot2Start)
                pose = ShotOrbit(t / shot2Start);
            else if (t < shot2Start + shotBlend)
                pose = Pose.Lerp(ShotOrbit(1f), ShotTracking(0f), Smoother((t - shot2Start) / shotBlend));
            else if (t < shot3Start)
                pose = ShotTracking((t - shot2Start) / (shot3Start - shot2Start));
            else if (t < shot3Start + shotBlend)
                pose = Pose.Lerp(ShotTracking(1f), ShotCrane(0f), Smoother((t - shot3Start) / shotBlend));
            else
                pose = ShotCrane((t - shot3Start) / (duration - shot3Start));

            // Fusión final con la cámara del jugador.
            if (t > finalStart)
                pose = Pose.Lerp(pose, PlayerPose(), Smoother((t - finalStart) / finalBlend));
            return pose;
        }

        /// <summary>Plano 1: órbita panorámica descendente alrededor del Árbol Corazón.</summary>
        Pose ShotOrbit(float u)
        {
            float e = Smoother(u);
            float angle = Mathf.Lerp(-150f, -60f, e) * Mathf.Deg2Rad;
            float radius = Mathf.Lerp(46f, 30f, e);
            float height = Mathf.Lerp(30f, 14f, e);
            Vector3 position = HeartPosition + new Vector3(Mathf.Cos(angle) * radius, height, Mathf.Sin(angle) * radius);
            return LookPose(position, Focus, Mathf.Lerp(58f, 50f, e));
        }

        /// <summary>Plano 2: travelling lateral siguiendo la carga y el choque.</summary>
        Pose ShotTracking(float u)
        {
            float e = Smoother(u);
            Vector3 center = ClashCenter;
            Vector3 position = center + new Vector3(Mathf.Lerp(-14f, 10f, e), 2.6f + Mathf.Sin(e * Mathf.PI) * 0.8f, -15f);
            Vector3 look = center + new Vector3(Mathf.Lerp(-6f, 4f, e), 1.6f, 0f);
            // Zoom de impacto en el momento del choque (centro del plano).
            float fov = Mathf.Lerp(50f, 40f, Mathf.Sin(e * Mathf.PI));
            return LookPose(position, look, fov);
        }

        /// <summary>Plano 3: grúa que se eleva mostrando el campo de batalla.</summary>
        Pose ShotCrane(float u)
        {
            float e = Smoother(u);
            Vector3 center = ClashCenter;
            Vector3 position = center + new Vector3(Mathf.Lerp(10f, 2f, e), Mathf.Lerp(2.6f, 16f, e), Mathf.Lerp(-15f, -26f, e));
            Vector3 look = Vector3.Lerp(center + Vector3.up * 1.6f, Focus, e);
            return LookPose(position, look, Mathf.Lerp(50f, 60f, e));
        }

        Pose PlayerPose()
        {
            if (m_Target != null)
            {
                m_Target.GetCameraPose(out Vector3 position, out Quaternion rotation, out float fov);
                return new Pose { Position = position, Rotation = rotation, Fov = fov };
            }
            return CurrentCameraPose();
        }

        Pose CurrentCameraPose()
        {
            return new Pose
            {
                Position = m_Camera.transform.position,
                Rotation = m_Camera.transform.rotation,
                Fov = m_Camera.fieldOfView
            };
        }

        static Pose LookPose(Vector3 position, Vector3 target, float fov)
        {
            Vector3 forward = target - position;
            if (forward.sqrMagnitude < 0.0001f) forward = Vector3.forward;
            return new Pose { Position = position, Rotation = Quaternion.LookRotation(forward), Fov = fov };
        }

        void Apply(Pose pose)
        {
            if (m_Camera == null) return;
            m_Camera.transform.SetPositionAndRotation(pose.Position, pose.Rotation);
            m_Camera.fieldOfView = pose.Fov;
        }

        static float Smoother(float t)
        {
            t = Mathf.Clamp01(t);
            return t * t * t * (t * (t * 6f - 15f) + 10f);
        }

        // =====================================================================
        //  Figurantes del choque
        // =====================================================================

        void SpawnActors()
        {
            ClearActors();
            var assets = GameAssets.Instance;
            Vector3 center = ClashCenter;
            for (int team = 0; team < 2; team++)
            {
                Team t = team == 0 ? Team.Guardianes : Team.Taladores;
                float side = t == Team.Guardianes ? -1f : 1f;
                Transform baseTransform = t == Team.Guardianes ? guardianBase : loggerBase;
                float startX = baseTransform != null ? baseTransform.position.x : side * 30f;

                for (int i = 0; i < actorsPerTeam; i++)
                {
                    float lane = (i - (actorsPerTeam - 1) * 0.5f) * 2.2f;
                    var go = new GameObject("CinematicActor_" + t + "_" + i);
                    var rig = CharacterVisualBuilder.Build(t, assets != null ? assets.GetMaterials(t) : null, go.transform);
                    var squash = go.AddComponent<ProceduralSquash>();
                    squash.Pivot = rig.SquashPivot;

                    var actor = new Actor
                    {
                        Transform = go.transform,
                        Start = GroundAt(new Vector3(startX * 0.75f, 0f, center.z + lane)),
                        Target = GroundAt(new Vector3(center.x + side * (2.2f + Random.Range(0f, 1.2f)), 0f, center.z + lane)),
                        Delay = 4.2f + i * 0.15f + Random.Range(0f, 0.3f),
                        Team = t,
                        NextShot = 0f
                    };
                    go.transform.position = actor.Start;
                    go.transform.rotation = Quaternion.LookRotation(new Vector3(-side, 0f, 0f));
                    m_Actors.Add(actor);
                }
            }
        }

        void UpdateActors()
        {
            const float runDuration = 3.2f;
            foreach (var actor in m_Actors)
            {
                if (actor.Transform == null) continue;
                float u = Mathf.Clamp01((m_Time - actor.Delay) / runDuration);
                // Carrera con aceleración y pequeños saltitos.
                float e = 1f - Mathf.Pow(1f - u, 2f);
                Vector3 position = Vector3.Lerp(actor.Start, actor.Target, e);
                if (u > 0f && u < 1f) position.y += Mathf.Abs(Mathf.Sin(u * Mathf.PI * 6f)) * 0.35f;
                actor.Transform.position = position;

                // Al llegar, intercambio de disparos.
                if (u >= 1f && m_Time >= actor.NextShot && m_Time < duration - 1.5f)
                {
                    actor.NextShot = m_Time + Random.Range(0.35f, 0.8f);
                    Vector3 muzzle = position + Vector3.up * 1.1f + actor.Transform.forward * 0.8f;
                    VfxFactory.Play(actor.Team == Team.Guardianes ? FxKind.MuzzleSpore : FxKind.MuzzleSaw, muzzle);
                    var squash = actor.Transform.GetComponent<ProceduralSquash>();
                    if (squash != null) squash.Punch(-3f);
                }
            }

            // El gran choque: explosión de esporas y chispas en el centro.
            if (!m_ClashFxDone && m_Time >= 7.6f)
            {
                m_ClashFxDone = true;
                Vector3 c = ClashCenter + Vector3.up * 1.2f;
                VfxFactory.Play(FxKind.SporeImpact, c + Vector3.left * 0.6f, 2.2f);
                VfxFactory.Play(FxKind.SawImpact, c + Vector3.right * 0.6f, 2.2f);
                VfxFactory.Play(FxKind.Confetti, c + Vector3.up * 2f, 1f);
            }
        }

        void ClearActors()
        {
            foreach (var actor in m_Actors)
                if (actor.Transform != null) Destroy(actor.Transform.gameObject);
            m_Actors.Clear();
        }

        static Vector3 GroundAt(Vector3 position)
        {
            if (Physics.Raycast(new Vector3(position.x, 80f, position.z), Vector3.down, out RaycastHit hit, 200f, ~0, QueryTriggerInteraction.Ignore))
                return hit.point;
            return new Vector3(position.x, 0f, position.z);
        }

        // =====================================================================
        //  Overlay (bandas de cine + títulos)
        // =====================================================================

        void BuildOverlay()
        {
            if (m_Overlay != null) Destroy(m_Overlay.gameObject);
            m_Overlay = UIFactory.CreateCanvas("CinematicOverlay", 100, transform);

            m_TopBar = UIFactory.CreatePanel("TopBar", m_Overlay.transform, Color.black).rectTransform;
            UIFactory.Place(m_TopBar, new Vector2(0f, 1f), new Vector2(1f, 1f), new Vector2(0.5f, 1f), Vector2.zero, new Vector2(0f, 0f));
            m_BottomBar = UIFactory.CreatePanel("BottomBar", m_Overlay.transform, Color.black).rectTransform;
            UIFactory.Place(m_BottomBar, new Vector2(0f, 0f), new Vector2(1f, 0f), new Vector2(0.5f, 0f), Vector2.zero, new Vector2(0f, 0f));

            m_Title = UIFactory.CreateText("Title", m_Overlay.transform, "ROOTS <color=#FF2EA8>&</color> RUST", 130f, Color.white);
            UIFactory.Place(m_Title.rectTransform, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0f, 120f), new Vector2(1600f, 180f));
            m_Title.outlineWidth = 0.25f;
            m_Title.outlineColor = new Color32(30, 20, 70, 255);

            m_Subtitle = UIFactory.CreateText("Subtitle", m_Overlay.transform, "", 46f, Palette.FlowerYellow);
            UIFactory.Place(m_Subtitle.rectTransform, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0f, 10f), new Vector2(1600f, 80f));
            m_Subtitle.outlineWidth = 0.22f;
            m_Subtitle.outlineColor = new Color32(30, 20, 70, 255);

            m_SkipHint = UIFactory.CreateText("Skip", m_Overlay.transform, "ESPACIO: saltar cinemática", 26f, new Color(1f, 1f, 1f, 0.85f), TextAlignmentOptions.Right, false);
            UIFactory.Place(m_SkipHint.rectTransform, new Vector2(1f, 0f), new Vector2(1f, 0f), new Vector2(1f, 0f), new Vector2(-40f, 30f), new Vector2(600f, 50f));
        }

        void UpdateOverlay()
        {
            if (m_Overlay == null) return;
            float t = m_Time;

            // Bandas de cine: entran al principio y se van durante la fusión final.
            float barsIn = Smoother(t / 0.8f);
            float barsOut = m_Skipping ? 1f - Smoother((t - m_SkipStart) / skipBlend) : 1f - Smoother((t - (duration - finalBlend)) / finalBlend);
            float barHeight = 120f * barsIn * barsOut;
            m_TopBar.sizeDelta = new Vector2(0f, barHeight);
            m_BottomBar.sizeDelta = new Vector2(0f, barHeight);

            // Título con "pop" elástico.
            float titleIn = Mathf.Clamp01((t - 0.6f) / 0.7f);
            float overshoot = titleIn < 1f ? 1f + Mathf.Sin(titleIn * Mathf.PI) * 0.25f : 1f;
            float titleOut = 1f - Mathf.Clamp01((t - 4.2f) / 0.6f);
            float titleAlpha = titleIn * titleOut * (m_Skipping ? 0f : 1f);
            m_Title.alpha = titleAlpha;
            m_Title.rectTransform.localScale = Vector3.one * Mathf.Max(0.01f, titleIn * overshoot);

            string subtitle = "";
            float subAlpha = 0f;
            if (t > 1.6f && t < 4.6f)
            {
                subtitle = "<color=#12C773>Guardianes del Bosque</color>  vs.  <color=#FF7314>Taladores S.A.</color>";
                subAlpha = Mathf.Clamp01((t - 1.6f) / 0.5f) * Mathf.Clamp01((4.6f - t) / 0.4f);
            }
            else if (t > 7.4f && t < 10.2f)
            {
                subtitle = "¡QUE EMPIECE LA BATALLA POR EL BOSQUE!";
                subAlpha = Mathf.Clamp01((t - 7.4f) / 0.3f) * Mathf.Clamp01((10.2f - t) / 0.4f);
            }
            m_Subtitle.text = subtitle;
            m_Subtitle.alpha = m_Skipping ? 0f : subAlpha;
            m_SkipHint.alpha = m_Skipping ? 0f : 0.85f;
        }

        void Finish()
        {
            m_Playing = false;
            ClearActors();
            if (m_Overlay != null) Destroy(m_Overlay.gameObject);
            m_Overlay = null;
            if (m_Target != null) GameInput.LockCursor();
        }
    }
}
