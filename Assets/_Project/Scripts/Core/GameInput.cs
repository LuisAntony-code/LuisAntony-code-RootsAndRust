using UnityEngine;
#if ENABLE_INPUT_SYSTEM && !ENABLE_LEGACY_INPUT_MANAGER
using UnityEngine.InputSystem;
#endif

namespace RootsAndRust.Core
{
    /// <summary>
    /// Capa de entrada única para todo el juego.
    /// Funciona tanto con el Input Manager clásico como con el nuevo Input System:
    /// si en Player Settings está "Both" o "Input Manager (Old)" usa el clásico;
    /// si está "Input System Package (New)" usa el nuevo automáticamente.
    ///
    /// Controles:
    ///   WASD / Flechas  - moverse         Ratón       - cámara
    ///   Espacio         - saltar          Clic Izq.   - disparar
    ///   Clic Der.       - apuntar         Shift Izq.  - correr
    ///   Q               - dash (Taladores)
    ///   Enter           - iniciar partida (sólo Host)
    ///   Esc             - liberar / capturar cursor (menú de pausa)
    /// </summary>
    public static class GameInput
    {
        /// <summary>Si es true (menús abiertos, cinemática...), el juego ignora la entrada de gameplay.</summary>
        public static bool GameplayBlocked;

        /// <summary>Sensibilidad global del ratón.</summary>
        public static float MouseSensitivity = 2.2f;

#if ENABLE_INPUT_SYSTEM && !ENABLE_LEGACY_INPUT_MANAGER
        // ---------------------------- NUEVO INPUT SYSTEM ----------------------------
        static Keyboard Kb => Keyboard.current;
        static Mouse Ms => Mouse.current;

        public static Vector2 Move
        {
            get
            {
                if (Kb == null) return Vector2.zero;
                float x = (Kb.dKey.isPressed || Kb.rightArrowKey.isPressed ? 1f : 0f) - (Kb.aKey.isPressed || Kb.leftArrowKey.isPressed ? 1f : 0f);
                float y = (Kb.wKey.isPressed || Kb.upArrowKey.isPressed ? 1f : 0f) - (Kb.sKey.isPressed || Kb.downArrowKey.isPressed ? 1f : 0f);
                return Vector2.ClampMagnitude(new Vector2(x, y), 1f);
            }
        }

        public static Vector2 LookDelta => Ms != null ? Ms.delta.ReadValue() * 0.05f * MouseSensitivity : Vector2.zero;
        public static bool JumpPressed => Kb != null && Kb.spaceKey.wasPressedThisFrame;
        public static bool FireHeld => Ms != null && Ms.leftButton.isPressed;
        public static bool FirePressed => Ms != null && Ms.leftButton.wasPressedThisFrame;
        public static bool AimHeld => Ms != null && Ms.rightButton.isPressed;
        public static bool SprintHeld => Kb != null && Kb.leftShiftKey.isPressed;
        public static bool DashPressed => Kb != null && Kb.qKey.wasPressedThisFrame;
        public static bool SkipPressed => Kb != null && Kb.spaceKey.wasPressedThisFrame;
        public static bool StartMatchPressed => Kb != null && (Kb.enterKey.wasPressedThisFrame || Kb.numpadEnterKey.wasPressedThisFrame);
        public static bool CursorTogglePressed => Kb != null && Kb.escapeKey.wasPressedThisFrame;
#else
        // ---------------------------- INPUT MANAGER CLÁSICO ----------------------------
        public static Vector2 Move
        {
            get
            {
                float x = (Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow) ? 1f : 0f) - (Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow) ? 1f : 0f);
                float y = (Input.GetKey(KeyCode.W) || Input.GetKey(KeyCode.UpArrow) ? 1f : 0f) - (Input.GetKey(KeyCode.S) || Input.GetKey(KeyCode.DownArrow) ? 1f : 0f);
                return Vector2.ClampMagnitude(new Vector2(x, y), 1f);
            }
        }

        public static Vector2 LookDelta => new Vector2(Input.GetAxisRaw("Mouse X"), Input.GetAxisRaw("Mouse Y")) * MouseSensitivity;
        public static bool JumpPressed => Input.GetKeyDown(KeyCode.Space);
        public static bool FireHeld => Input.GetMouseButton(0);
        public static bool FirePressed => Input.GetMouseButtonDown(0);
        public static bool AimHeld => Input.GetMouseButton(1);
        public static bool SprintHeld => Input.GetKey(KeyCode.LeftShift);
        public static bool DashPressed => Input.GetKeyDown(KeyCode.Q);
        public static bool SkipPressed => Input.GetKeyDown(KeyCode.Space);
        public static bool StartMatchPressed => Input.GetKeyDown(KeyCode.Return) || Input.GetKeyDown(KeyCode.KeypadEnter);
        public static bool CursorTogglePressed => Input.GetKeyDown(KeyCode.Escape);
#endif

        /// <summary>True cuando el cursor está libre (menú de pausa / UI).</summary>
        public static bool CursorFree { get; private set; } = true;

        public static void LockCursor()
        {
            CursorFree = false;
            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
        }

        public static void FreeCursor()
        {
            CursorFree = true;
            Cursor.lockState = CursorLockMode.None;
            Cursor.visible = true;
        }

        /// <summary>¿Se puede leer entrada de gameplay ahora mismo?</summary>
        public static bool GameplayActive => !GameplayBlocked && !CursorFree;
    }
}
