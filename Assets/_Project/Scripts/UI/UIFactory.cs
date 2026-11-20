using System;
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.Events;
using UnityEngine.UI;
#if ENABLE_INPUT_SYSTEM && !ENABLE_LEGACY_INPUT_MANAGER
using UnityEngine.InputSystem.UI;
#endif

namespace RootsAndRust.UI
{
    /// <summary>
    /// Construye UI (uGUI + TextMeshPro) por código con el estilo del juego:
    /// paneles redondeados de colores vivos, botones grandes y texto con contorno.
    /// Construir la UI por código evita prefabs de UI que se rompen al fusionar en Git.
    /// </summary>
    public static class UIFactory
    {
        static TMP_FontAsset s_Font;

        /// <summary>Fuente por defecto de TMP (o una dinámica de respaldo si faltan los TMP Essentials).</summary>
        public static TMP_FontAsset DefaultFont
        {
            get
            {
                if (s_Font != null) return s_Font;
                try
                {
                    if (TMP_Settings.instance != null) s_Font = TMP_Settings.defaultFontAsset;
                }
                catch (Exception)
                {
                    s_Font = null;
                }

                if (s_Font == null)
                {
                    try
                    {
                        var legacy = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
                        if (legacy != null) s_Font = TMP_FontAsset.CreateFontAsset(legacy);
                    }
                    catch (Exception e)
                    {
                        Debug.LogWarning("No se pudo crear la fuente TMP de respaldo. Importa 'TMP Essential Resources'. " + e.Message);
                    }
                }
                return s_Font;
            }
        }

        /// <summary>Asegura que exista un EventSystem con el módulo de entrada correcto.</summary>
        public static void EnsureEventSystem()
        {
            if (EventSystem.current != null || UnityEngine.Object.FindAnyObjectByType<EventSystem>() != null) return;
            var go = new GameObject("EventSystem", typeof(EventSystem));
#if ENABLE_INPUT_SYSTEM && !ENABLE_LEGACY_INPUT_MANAGER
            go.AddComponent<InputSystemUIInputModule>();
#else
            go.AddComponent<StandaloneInputModule>();
#endif
        }

        public static Canvas CreateCanvas(string name, int sortingOrder, Transform parent = null)
        {
            EnsureEventSystem();
            var go = new GameObject(name, typeof(RectTransform), typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            if (parent != null) go.transform.SetParent(parent, false);
            var canvas = go.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = sortingOrder;
            var scaler = go.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920f, 1080f);
            scaler.matchWidthOrHeight = 0.5f;
            return canvas;
        }

        public static RectTransform CreateRect(string name, Transform parent)
        {
            var go = new GameObject(name, typeof(RectTransform));
            go.transform.SetParent(parent, false);
            return (RectTransform)go.transform;
        }

        /// <summary>Coloca un RectTransform con anclas, pivote, posición y tamaño.</summary>
        public static RectTransform Place(RectTransform rect, Vector2 anchorMin, Vector2 anchorMax, Vector2 pivot,
            Vector2 anchoredPosition, Vector2 size)
        {
            rect.anchorMin = anchorMin;
            rect.anchorMax = anchorMax;
            rect.pivot = pivot;
            rect.anchoredPosition = anchoredPosition;
            rect.sizeDelta = size;
            return rect;
        }

        /// <summary>Estira el rect para llenar al padre con márgenes.</summary>
        public static RectTransform Stretch(RectTransform rect, float margin = 0f)
        {
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.pivot = new Vector2(0.5f, 0.5f);
            rect.offsetMin = new Vector2(margin, margin);
            rect.offsetMax = new Vector2(-margin, -margin);
            return rect;
        }

        public static Image CreatePanel(string name, Transform parent, Color color)
        {
            var rect = CreateRect(name, parent);
            var image = rect.gameObject.AddComponent<Image>();
            image.color = color;
            image.raycastTarget = true;
            return image;
        }

        public static TextMeshProUGUI CreateText(string name, Transform parent, string text, float size, Color color,
            TextAlignmentOptions alignment = TextAlignmentOptions.Center, bool bold = true)
        {
            var rect = CreateRect(name, parent);
            var tmp = rect.gameObject.AddComponent<TextMeshProUGUI>();
            var font = DefaultFont;
            if (font != null) tmp.font = font;
            tmp.text = text;
            tmp.fontSize = size;
            tmp.color = color;
            tmp.alignment = alignment;
            tmp.fontStyle = bold ? FontStyles.Bold : FontStyles.Normal;
            tmp.raycastTarget = false;
            tmp.textWrappingMode = TextWrappingModes.Normal;
            return tmp;
        }

        public static Button CreateButton(string name, Transform parent, string label, Color color, UnityAction onClick,
            float fontSize = 30f)
        {
            var image = CreatePanel(name, parent, color);
            var button = image.gameObject.AddComponent<Button>();
            var colors = button.colors;
            colors.normalColor = Color.white;
            colors.highlightedColor = new Color(1.12f, 1.12f, 1.12f, 1f);
            colors.pressedColor = new Color(0.82f, 0.82f, 0.82f, 1f);
            colors.disabledColor = new Color(0.6f, 0.6f, 0.6f, 0.6f);
            colors.fadeDuration = 0.08f;
            button.colors = colors;
            if (onClick != null) button.onClick.AddListener(onClick);

            // Sombra "cartoon" desplazada.
            var shadow = image.gameObject.AddComponent<Shadow>();
            shadow.effectColor = new Color(0.1f, 0.08f, 0.25f, 0.55f);
            shadow.effectDistance = new Vector2(0f, -6f);

            var text = CreateText("Label", image.transform, label, fontSize, Color.white);
            Stretch(text.rectTransform, 6f);
            text.outlineWidth = 0.18f;
            text.outlineColor = new Color32(30, 20, 60, 255);
            return button;
        }

        public static TMP_InputField CreateInputField(string name, Transform parent, string placeholder, string initial,
            float fontSize = 28f)
        {
            var root = CreateRect(name, parent);
            root.gameObject.SetActive(false); // Configurar antes de que se ejecute OnEnable.
            var background = root.gameObject.AddComponent<Image>();
            background.color = new Color(1f, 1f, 1f, 0.95f);

            var viewport = CreateRect("Text Area", root);
            Stretch(viewport, 10f);
            viewport.gameObject.AddComponent<RectMask2D>();

            var placeholderText = CreateText("Placeholder", viewport, placeholder, fontSize, new Color(0.35f, 0.35f, 0.5f, 0.75f),
                TextAlignmentOptions.MidlineLeft, false);
            Stretch(placeholderText.rectTransform);
            placeholderText.fontStyle = FontStyles.Italic;
            placeholderText.textWrappingMode = TextWrappingModes.NoWrap;

            var text = CreateText("Text", viewport, string.Empty, fontSize, new Color(0.12f, 0.1f, 0.25f),
                TextAlignmentOptions.MidlineLeft, true);
            Stretch(text.rectTransform);
            text.textWrappingMode = TextWrappingModes.NoWrap;

            var input = root.gameObject.AddComponent<TMP_InputField>();
            input.textViewport = viewport;
            input.textComponent = text;
            input.placeholder = placeholderText;
            input.targetGraphic = background;
            var font = DefaultFont;
            if (font != null) input.fontAsset = font;
            input.pointSize = fontSize;
            input.text = initial ?? string.Empty;

            root.gameObject.SetActive(true);
            return input;
        }

        /// <summary>Barra horizontal (fondo + relleno). Devuelve la imagen de relleno (fillAmount).</summary>
        public static Image CreateBar(string name, Transform parent, Color background, Color fill, out Image backgroundImage)
        {
            backgroundImage = CreatePanel(name, parent, background);
            var fillImage = CreatePanel("Fill", backgroundImage.transform, fill);
            Stretch(fillImage.rectTransform, 4f);
            fillImage.type = Image.Type.Filled;
            fillImage.fillMethod = Image.FillMethod.Horizontal;
            fillImage.fillOrigin = (int)Image.OriginHorizontal.Left;
            fillImage.fillAmount = 1f;
            fillImage.raycastTarget = false;
            // Image.Filled necesita un sprite para recortar correctamente.
            fillImage.sprite = WhiteSprite;
            return fillImage;
        }

        static Sprite s_WhiteSprite;

        /// <summary>Sprite blanco 4x4 generado en memoria (para barras de tipo Filled).</summary>
        public static Sprite WhiteSprite
        {
            get
            {
                if (s_WhiteSprite != null) return s_WhiteSprite;
                var texture = new Texture2D(4, 4, TextureFormat.RGBA32, false);
                var pixels = new Color32[16];
                for (int i = 0; i < pixels.Length; i++) pixels[i] = new Color32(255, 255, 255, 255);
                texture.SetPixels32(pixels);
                texture.Apply();
                s_WhiteSprite = Sprite.Create(texture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f), 100f);
                return s_WhiteSprite;
            }
        }

        /// <summary>Layout vertical automático para formularios.</summary>
        public static VerticalLayoutGroup AddVerticalLayout(GameObject go, float spacing, int padding)
        {
            var layout = go.AddComponent<VerticalLayoutGroup>();
            layout.spacing = spacing;
            layout.padding = new RectOffset(padding, padding, padding, padding);
            layout.childAlignment = TextAnchor.UpperCenter;
            layout.childControlWidth = true;
            layout.childControlHeight = true;
            layout.childForceExpandWidth = true;
            layout.childForceExpandHeight = false;
            return layout;
        }

        public static LayoutElement SetHeight(Component component, float height)
        {
            var element = component.gameObject.GetComponent<LayoutElement>();
            if (element == null) element = component.gameObject.AddComponent<LayoutElement>();
            element.preferredHeight = height;
            element.minHeight = height;
            return element;
        }
    }
}
