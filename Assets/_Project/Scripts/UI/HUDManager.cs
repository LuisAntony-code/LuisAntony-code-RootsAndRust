using RootsAndRust.Cinematic;
using RootsAndRust.Core;
using RootsAndRust.Gameplay;
using RootsAndRust.Player;
using TMPro;
using Unity.Netcode;
using UnityEngine;
using UnityEngine.UI;

namespace RootsAndRust.UI
{
    /// <summary>
    /// HUD de partida (construido por código):
    ///  - Temporizador y fase (Calentamiento / Cuenta atrás / Partida / Resultados).
    ///  - Barra de dominio del bosque: verde = bosque vivo, naranja = madera talada.
    ///  - Vida, bando, estado del dash y de la zona en la que estás.
    ///  - Mira dinámica que se abre al moverse/disparar y se cierra al apuntar.
    ///  - Banner del Frenesí Final, cuenta atrás, ganador y viñeta de daño.
    /// </summary>
    public class HUDManager : MonoBehaviour
    {
        Canvas m_Canvas;
        GameObject m_Root;

        TextMeshProUGUI m_Timer;
        TextMeshProUGUI m_Phase;
        Image m_ForestFill;
        TextMeshProUGUI m_ForestLabel;
        TextMeshProUGUI m_WoodLabel;

        Image m_HealthFill;
        TextMeshProUGUI m_HealthText;
        TextMeshProUGUI m_TeamText;
        TextMeshProUGUI m_AbilityText;
        TextMeshProUGUI m_ZoneText;

        RectTransform[] m_CrosshairArms = new RectTransform[4];
        Image m_CrosshairDot;
        TextMeshProUGUI m_CenterMessage;
        TextMeshProUGUI m_FrenzyBanner;
        Image m_DamageVignette;
        TextMeshProUGUI m_Hint;

        float m_DamageFlash;

        void Start()
        {
            Build();
            Health.LocalPlayerDamaged += OnLocalDamaged;
        }

        void OnDestroy()
        {
            Health.LocalPlayerDamaged -= OnLocalDamaged;
        }

        void OnLocalDamaged(float amount)
        {
            m_DamageFlash = Mathf.Clamp01(m_DamageFlash + amount / 40f);
        }

        // =====================================================================
        //  Construcción
        // =====================================================================

        void Build()
        {
            m_Canvas = UIFactory.CreateCanvas("HUDCanvas", 10, transform);
            m_Root = UIFactory.CreateRect("HUD", m_Canvas.transform).gameObject;
            UIFactory.Stretch((RectTransform)m_Root.transform);
            var root = m_Root.transform;

            // Viñeta de daño (debajo de todo).
            m_DamageVignette = UIFactory.CreatePanel("DamageVignette", root, new Color(1f, 0.1f, 0.25f, 0f));
            UIFactory.Stretch(m_DamageVignette.rectTransform);
            m_DamageVignette.raycastTarget = false;

            // ---------- Temporizador + fase ----------
            m_Timer = Outlined(UIFactory.CreateText("Timer", root, "4:00", 72f, Color.white));
            UIFactory.Place(m_Timer.rectTransform, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0f, -14f), new Vector2(400f, 90f));

            m_Phase = Outlined(UIFactory.CreateText("Phase", root, "", 26f, Palette.FlowerYellow));
            UIFactory.Place(m_Phase.rectTransform, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0f, -96f), new Vector2(1200f, 40f));

            // ---------- Barra de dominio del bosque ----------
            m_ForestFill = UIFactory.CreateBar("ForestBar", root, Palette.IndustrialOrange, Palette.Emerald, out Image barBackground);
            UIFactory.Place(barBackground.rectTransform, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0f, -140f), new Vector2(760f, 34f));
            barBackground.raycastTarget = false;
            var outline = barBackground.gameObject.AddComponent<Outline>();
            outline.effectColor = new Color(0.12f, 0.08f, 0.3f, 0.9f);
            outline.effectDistance = new Vector2(3f, -3f);
            // Marca del 50 %.
            var midMark = UIFactory.CreatePanel("Mid", barBackground.transform, Color.white);
            UIFactory.Place(midMark.rectTransform, new Vector2(0.5f, 0f), new Vector2(0.5f, 1f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(4f, 8f));
            midMark.raycastTarget = false;

            m_ForestLabel = Outlined(UIFactory.CreateText("ForestLabel", root, "BOSQUE VIVO 100%", 22f, Palette.Lime, TextAlignmentOptions.Left));
            UIFactory.Place(m_ForestLabel.rectTransform, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0f, 1f), new Vector2(-380f, -176f), new Vector2(380f, 30f));
            m_WoodLabel = Outlined(UIFactory.CreateText("WoodLabel", root, "MADERA TALADA 0%", 22f, Palette.SparkAmber, TextAlignmentOptions.Right));
            UIFactory.Place(m_WoodLabel.rectTransform, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(1f, 1f), new Vector2(380f, -176f), new Vector2(380f, 30f));

            // ---------- Vida + bando ----------
            m_TeamText = Outlined(UIFactory.CreateText("Team", root, "", 30f, Color.white, TextAlignmentOptions.Left));
            UIFactory.Place(m_TeamText.rectTransform, Vector2.zero, Vector2.zero, Vector2.zero, new Vector2(40f, 92f), new Vector2(600f, 40f));
            m_HealthFill = UIFactory.CreateBar("HealthBar", root, new Color(0.15f, 0.1f, 0.3f, 0.85f), Palette.Lime, out Image healthBackground);
            UIFactory.Place(healthBackground.rectTransform, Vector2.zero, Vector2.zero, Vector2.zero, new Vector2(40f, 40f), new Vector2(460f, 42f));
            healthBackground.raycastTarget = false;
            m_HealthText = Outlined(UIFactory.CreateText("HealthText", healthBackground.transform, "100", 26f, Color.white));
            UIFactory.Stretch(m_HealthText.rectTransform);

            // ---------- Habilidad / zona ----------
            m_AbilityText = Outlined(UIFactory.CreateText("Ability", root, "", 26f, Color.white, TextAlignmentOptions.Right));
            UIFactory.Place(m_AbilityText.rectTransform, new Vector2(1f, 0f), new Vector2(1f, 0f), new Vector2(1f, 0f), new Vector2(-40f, 90f), new Vector2(700f, 40f));
            m_ZoneText = Outlined(UIFactory.CreateText("Zone", root, "", 26f, Palette.Lime, TextAlignmentOptions.Right));
            UIFactory.Place(m_ZoneText.rectTransform, new Vector2(1f, 0f), new Vector2(1f, 0f), new Vector2(1f, 0f), new Vector2(-40f, 40f), new Vector2(700f, 40f));

            // ---------- Mira dinámica ----------
            var crosshair = UIFactory.CreateRect("Crosshair", root);
            UIFactory.Place(crosshair, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(10f, 10f));
            m_CrosshairDot = UIFactory.CreatePanel("Dot", crosshair, Color.white);
            UIFactory.Place(m_CrosshairDot.rectTransform, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(6f, 6f));
            m_CrosshairDot.raycastTarget = false;
            for (int i = 0; i < 4; i++)
            {
                var arm = UIFactory.CreatePanel("Arm" + i, crosshair, Color.white);
                bool vertical = i % 2 == 0;
                UIFactory.Place(arm.rectTransform, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero,
                    vertical ? new Vector2(4f, 16f) : new Vector2(16f, 4f));
                arm.raycastTarget = false;
                var shadow = arm.gameObject.AddComponent<Shadow>();
                shadow.effectColor = new Color(0.1f, 0.05f, 0.3f, 0.8f);
                shadow.effectDistance = new Vector2(2f, -2f);
                m_CrosshairArms[i] = arm.rectTransform;
            }

            // ---------- Mensajes ----------
            m_CenterMessage = Outlined(UIFactory.CreateText("CenterMessage", root, "", 84f, Color.white));
            UIFactory.Place(m_CenterMessage.rectTransform, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0f, 170f), new Vector2(1600f, 220f));

            m_FrenzyBanner = Outlined(UIFactory.CreateText("Frenzy", root, "¡FRENESÍ FINAL!  x2", 48f, Palette.FlowerMagenta));
            UIFactory.Place(m_FrenzyBanner.rectTransform, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0f, -210f), new Vector2(1000f, 70f));

            m_Hint = Outlined(UIFactory.CreateText("Hint", root,
                "WASD mover · Ratón cámara · Clic Izq. disparar · Clic Der. apuntar · Espacio saltar · Shift correr · Esc menú",
                18f, new Color(1f, 1f, 1f, 0.8f), TextAlignmentOptions.Right, false));
            UIFactory.Place(m_Hint.rectTransform, new Vector2(1f, 1f), new Vector2(1f, 1f), new Vector2(1f, 1f), new Vector2(-24f, -18f), new Vector2(560f, 60f));

            m_Root.SetActive(false);
        }

        static TextMeshProUGUI Outlined(TextMeshProUGUI text)
        {
            text.outlineWidth = 0.22f;
            text.outlineColor = new Color32(25, 15, 60, 255);
            return text;
        }

        // =====================================================================
        //  Actualización
        // =====================================================================

        void Update()
        {
            var local = PlayerIdentity.Local;
            bool visible = local != null && !IntroCinematicController.IsPlayingNow;
            if (m_Root.activeSelf != visible) m_Root.SetActive(visible);
            if (!visible) return;

            UpdateMatch();
            UpdatePlayer(local);
            UpdateCrosshair();

            m_DamageFlash = Mathf.MoveTowards(m_DamageFlash, 0f, Time.deltaTime * 1.8f);
            m_DamageVignette.color = new Color(1f, 0.1f, 0.25f, m_DamageFlash * 0.35f);

            // Atajo del Host para iniciar la partida.
            var loop = GameLoopManager.Instance;
            if (NetworkManager.Singleton != null && NetworkManager.Singleton.IsServer && loop != null &&
                GameInput.GameplayActive && GameInput.StartMatchPressed)
                loop.RequestStartMatch();
        }

        void UpdateMatch()
        {
            var loop = GameLoopManager.Instance;
            if (loop == null || !loop.IsSpawned)
            {
                m_Timer.text = "--:--";
                m_Phase.text = "";
                m_FrenzyBanner.gameObject.SetActive(false);
                m_CenterMessage.text = "";
                return;
            }

            bool isHost = NetworkManager.Singleton != null && NetworkManager.Singleton.IsServer;
            float remaining = loop.TimeRemaining;
            int minutes = Mathf.FloorToInt(remaining / 60f);
            int seconds = Mathf.FloorToInt(remaining % 60f);
            m_Timer.text = minutes + ":" + seconds.ToString("00");
            m_Timer.color = loop.Frenzy.Value ? Color.Lerp(Palette.FlowerMagenta, Palette.FlowerYellow, Mathf.PingPong(Time.time * 3f, 1f)) : Color.white;

            string center = "";
            switch (loop.Phase.Value)
            {
                case MatchPhase.Warmup:
                    m_Phase.text = isHost ? "CALENTAMIENTO · Pulsa ENTER para iniciar la partida (4 min)" : "CALENTAMIENTO · Esperando a que el Host inicie";
                    break;
                case MatchPhase.Countdown:
                    m_Phase.text = "¡PREPARADOS!";
                    center = Mathf.CeilToInt(remaining).ToString();
                    break;
                case MatchPhase.Playing:
                    m_Phase.text = loop.Frenzy.Value ? "¡Último minuto!" : "¡Defiende tu causa!";
                    if (loop.MatchDuration - remaining < 1.5f) center = "¡YA!";
                    break;
                case MatchPhase.Ended:
                    m_Phase.text = "RESULTADOS";
                    Team winner = loop.Winner.Value;
                    center = winner == Team.None ? "¡EMPATE!" :
                        "<color=#" + ColorUtility.ToHtmlStringRGB(TeamInfo.PrimaryColor(winner)) + ">¡GANAN LOS " + TeamInfo.ShortName(winner).ToUpper() + "!</color>";
                    break;
            }

            var localHealth = PlayerIdentity.Local != null ? PlayerIdentity.Local.GetComponent<Health>() : null;
            if (string.IsNullOrEmpty(center) && localHealth != null && localHealth.IsDead.Value)
                center = "<size=60%>¡Te han derribado! Reapareciendo...</size>";
            m_CenterMessage.text = center;

            float forest = loop.ForestPercent.Value;
            m_ForestFill.fillAmount = Mathf.Lerp(m_ForestFill.fillAmount, forest, 1f - Mathf.Exp(-6f * Time.deltaTime));
            int forestPct = Mathf.RoundToInt(forest * 100f);
            m_ForestLabel.text = "BOSQUE VIVO " + forestPct + "%";
            m_WoodLabel.text = "MADERA TALADA " + (100 - forestPct) + "%";

            bool frenzy = loop.Frenzy.Value;
            m_FrenzyBanner.gameObject.SetActive(frenzy);
            if (frenzy)
            {
                float pulse = 1f + Mathf.Sin(Time.time * 10f) * 0.06f;
                m_FrenzyBanner.rectTransform.localScale = new Vector3(pulse, pulse, 1f);
            }
        }

        void UpdatePlayer(PlayerIdentity local)
        {
            var health = local.GetComponent<Health>();
            if (health != null)
            {
                float n = health.Normalized;
                m_HealthFill.fillAmount = Mathf.Lerp(m_HealthFill.fillAmount, n, 1f - Mathf.Exp(-10f * Time.deltaTime));
                m_HealthFill.color = n > 0.35f ? Palette.Lime : Color.Lerp(Palette.FlowerMagenta, Palette.SparkAmber, Mathf.PingPong(Time.time * 4f, 1f));
                m_HealthText.text = Mathf.CeilToInt(health.Current.Value).ToString();
            }

            m_TeamText.text = "<color=#" + ColorUtility.ToHtmlStringRGB(TeamInfo.PrimaryColor(local.Team)) + ">" +
                              TeamInfo.DisplayName(local.Team).ToUpper() + "</color>  " + local.DisplayName;

            var controller = ThirdPersonController.Local;
            if (controller == null) return;

            if (local.Team == Team.Taladores)
            {
                float dash = controller.DashReady01;
                m_AbilityText.text = dash >= 1f ? "DASH [Q] <color=#FFB21A>LISTO</color>" : "DASH [Q] " + Mathf.RoundToInt(dash * 100f) + "%";
                m_ZoneText.text = controller.InScorchZone ? "<color=#FF7314>SUELO QUEMADO: ¡deslizamiento y dash rápido!</color>" : "";
            }
            else
            {
                m_AbilityText.text = "BIO-ESPORAS: dispara a tocones para regenerar árboles";
                m_ZoneText.text = controller.InBioZone ? "<color=#9EF22E>ZONA BIO: +vida y súper salto</color>" : "";
            }
        }

        void UpdateCrosshair()
        {
            var controller = ThirdPersonController.Local;
            float spread = controller != null ? controller.CrosshairSpread : 0.3f;
            float offset = Mathf.Lerp(8f, 46f, spread);
            m_CrosshairArms[0].anchoredPosition = new Vector2(0f, offset);
            m_CrosshairArms[1].anchoredPosition = new Vector2(offset, 0f);
            m_CrosshairArms[2].anchoredPosition = new Vector2(0f, -offset);
            m_CrosshairArms[3].anchoredPosition = new Vector2(-offset, 0f);

            Color color = controller != null && controller.IsAiming ? Palette.FlowerYellow : Color.white;
            m_CrosshairDot.color = color;
            foreach (var arm in m_CrosshairArms)
            {
                var image = arm.GetComponent<Image>();
                if (image != null) image.color = color;
            }
        }
    }
}
