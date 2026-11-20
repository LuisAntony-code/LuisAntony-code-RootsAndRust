using UnityEngine;

namespace RootsAndRust.Core
{
    /// <summary>
    /// Bandos del juego. Se serializa como byte para que viaje barato por la red.
    /// </summary>
    public enum Team : byte
    {
        None = 0,
        /// <summary>Equipo A: Guardianes del bosque (Activistas).</summary>
        Guardianes = 1,
        /// <summary>Equipo B: Taladores corporativos.</summary>
        Taladores = 2
    }

    /// <summary>
    /// Datos estáticos de cada equipo: nombre, colores y reglas de tamaño.
    /// </summary>
    public static class TeamInfo
    {
        /// <summary>Máximo de jugadores por bando (4v4).</summary>
        public const int MaxPerTeam = 4;

        public static string DisplayName(Team team)
        {
            switch (team)
            {
                case Team.Guardianes: return "Guardianes del Bosque";
                case Team.Taladores: return "Taladores S.A.";
                default: return "Sin equipo";
            }
        }

        public static string ShortName(Team team)
        {
            switch (team)
            {
                case Team.Guardianes: return "Guardianes";
                case Team.Taladores: return "Taladores";
                default: return "-";
            }
        }

        public static Team Opponent(Team team)
        {
            switch (team)
            {
                case Team.Guardianes: return Team.Taladores;
                case Team.Taladores: return Team.Guardianes;
                default: return Team.None;
            }
        }

        /// <summary>Color principal de UI/VFX de cada equipo.</summary>
        public static Color PrimaryColor(Team team)
        {
            switch (team)
            {
                case Team.Guardianes: return Palette.Emerald;
                case Team.Taladores: return Palette.IndustrialOrange;
                default: return Color.white;
            }
        }

        /// <summary>Color secundario/acento de cada equipo.</summary>
        public static Color AccentColor(Team team)
        {
            switch (team)
            {
                case Team.Guardianes: return Palette.FlowerMagenta;
                case Team.Taladores: return Palette.SparkAmber;
                default: return Color.gray;
            }
        }
    }

    /// <summary>
    /// Paleta vibrante del juego (estilo "How to Fish": muy saturada y alegre).
    /// Todos los materiales, UI y partículas salen de aquí para mantener coherencia.
    /// </summary>
    public static class Palette
    {
        // --- Activistas / Bosque ---
        public static readonly Color Emerald = new Color(0.05f, 0.78f, 0.45f);
        public static readonly Color Lime = new Color(0.62f, 0.95f, 0.18f);
        public static readonly Color DeepLeaf = new Color(0.10f, 0.55f, 0.30f);
        public static readonly Color FlowerMagenta = new Color(1.00f, 0.18f, 0.66f);
        public static readonly Color FlowerYellow = new Color(1.00f, 0.86f, 0.12f);
        public static readonly Color Bark = new Color(0.55f, 0.32f, 0.18f);
        public static readonly Color Moss = new Color(0.36f, 0.70f, 0.22f);

        // --- Taladores / Industria ---
        public static readonly Color IndustrialOrange = new Color(1.00f, 0.45f, 0.08f);
        public static readonly Color SteelBlue = new Color(0.30f, 0.48f, 0.68f);
        public static readonly Color SparkAmber = new Color(1.00f, 0.70f, 0.10f);
        public static readonly Color Charcoal = new Color(0.16f, 0.14f, 0.18f);
        public static readonly Color HazardYellow = new Color(1.00f, 0.82f, 0.05f);

        // --- Mundo ---
        public static readonly Color SkinTone = new Color(1.00f, 0.80f, 0.62f);
        public static readonly Color GrassLight = new Color(0.55f, 0.90f, 0.32f);
        public static readonly Color GrassDeep = new Color(0.20f, 0.72f, 0.36f);
        public static readonly Color DirtOchre = new Color(0.86f, 0.58f, 0.30f);
        public static readonly Color ShadowBlue = new Color(0.38f, 0.42f, 0.85f);
        public static readonly Color FogTurquoise = new Color(0.55f, 0.88f, 0.84f);
        public static readonly Color SunGold = new Color(1.00f, 0.90f, 0.70f);
        public static readonly Color Rock = new Color(0.62f, 0.62f, 0.75f);
        public static readonly Color HeartGlow = new Color(1.00f, 0.55f, 0.85f);
    }
}
