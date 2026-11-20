using System.Collections.Generic;
using RootsAndRust.Core;
using UnityEngine;

namespace RootsAndRust.Networking
{
    /// <summary>
    /// Punto de aparición de un equipo. El asistente coloca 4 por bando.
    /// </summary>
    public class SpawnPoint : MonoBehaviour
    {
        static readonly List<SpawnPoint> s_All = new List<SpawnPoint>();
        static int s_RoundRobin;

        [SerializeField] Team team = Team.Guardianes;

        public Team Team => team;

        void OnEnable() => s_All.Add(this);
        void OnDisable() => s_All.Remove(this);

        /// <summary>
        /// Devuelve una posición de aparición para el equipo (rotando entre los puntos).
        /// Si no hay puntos, usa un lado del mapa por defecto.
        /// </summary>
        public static void GetSpawn(Team team, out Vector3 position, out Quaternion rotation)
        {
            var candidates = new List<SpawnPoint>();
            foreach (var sp in s_All)
                if (sp != null && sp.team == team) candidates.Add(sp);

            if (candidates.Count == 0)
            {
                float side = team == Team.Taladores ? 1f : -1f;
                position = new Vector3(side * 40f, 3f, Random.Range(-6f, 6f));
                rotation = Quaternion.LookRotation(new Vector3(-side, 0f, 0f));
                return;
            }

            var chosen = candidates[s_RoundRobin++ % candidates.Count];
            // Pequeño desplazamiento aleatorio para no aparecer encima de otro jugador.
            Vector2 jitter = Random.insideUnitCircle * 0.8f;
            position = chosen.transform.position + new Vector3(jitter.x, 0.1f, jitter.y);
            rotation = chosen.transform.rotation;
        }

        void OnDrawGizmos()
        {
            Gizmos.color = TeamInfo.PrimaryColor(team);
            Gizmos.DrawWireSphere(transform.position + Vector3.up * 0.9f, 0.6f);
            Gizmos.DrawLine(transform.position + Vector3.up * 0.9f, transform.position + Vector3.up * 0.9f + transform.forward * 1.5f);
        }
    }
}
