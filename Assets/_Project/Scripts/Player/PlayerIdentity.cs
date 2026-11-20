using System.Collections.Generic;
using RootsAndRust.Core;
using RootsAndRust.UI;
using TMPro;
using Unity.Collections;
using Unity.Netcode;
using UnityEngine;

namespace RootsAndRust.Player
{
    /// <summary>
    /// Identidad del jugador en red: equipo (fijo por prefab) y nombre (lo escribe el dueño).
    /// Mantiene un registro estático de todos los jugadores para consultas rápidas.
    /// </summary>
    public class PlayerIdentity : NetworkBehaviour
    {
        public static readonly List<PlayerIdentity> All = new List<PlayerIdentity>();
        public static PlayerIdentity Local { get; private set; }

        /// <summary>Nombre elegido en el menú (se envía al aparecer).</summary>
        public static string LocalPlayerName = "Jugador";

        [SerializeField] Team team = Team.Guardianes;
        [SerializeField] float nameplateHeight = 2.45f;

        public NetworkVariable<FixedString32Bytes> PlayerName = new NetworkVariable<FixedString32Bytes>(
            default, NetworkVariableReadPermission.Everyone, NetworkVariableWritePermission.Owner);

        public Team Team => team;
        public string DisplayName => PlayerName.Value.ToString();

        TextMeshPro m_Nameplate;

        public override void OnNetworkSpawn()
        {
            All.Add(this);
            if (IsOwner)
            {
                Local = this;
                string safeName = string.IsNullOrWhiteSpace(LocalPlayerName) ? "Jugador" : LocalPlayerName.Trim();
                if (safeName.Length > 24) safeName = safeName.Substring(0, 24);
                PlayerName.Value = new FixedString32Bytes(safeName);
            }
            else
            {
                CreateNameplate();
                PlayerName.OnValueChanged += OnNameChanged;
            }
        }

        public override void OnNetworkDespawn()
        {
            All.Remove(this);
            if (Local == this) Local = null;
            PlayerName.OnValueChanged -= OnNameChanged;
        }

        void OnNameChanged(FixedString32Bytes previous, FixedString32Bytes current)
        {
            if (m_Nameplate != null) m_Nameplate.text = current.ToString();
        }

        void CreateNameplate()
        {
            var go = new GameObject("Nameplate");
            go.transform.SetParent(transform, false);
            go.transform.localPosition = Vector3.up * nameplateHeight;
            m_Nameplate = go.AddComponent<TextMeshPro>();
            var font = UIFactory.DefaultFont;
            if (font != null) m_Nameplate.font = font;
            m_Nameplate.text = DisplayName;
            m_Nameplate.fontSize = 3.2f;
            m_Nameplate.alignment = TextAlignmentOptions.Center;
            m_Nameplate.color = TeamInfo.PrimaryColor(team);
            m_Nameplate.outlineWidth = 0.25f;
            m_Nameplate.outlineColor = new Color32(20, 20, 40, 255);
            m_Nameplate.rectTransform.sizeDelta = new Vector2(6f, 1.2f);
        }

        void LateUpdate()
        {
            // Billboard del nombre hacia la cámara.
            if (m_Nameplate == null) return;
            var cam = Camera.main;
            if (cam == null) return;
            m_Nameplate.transform.rotation = Quaternion.LookRotation(m_Nameplate.transform.position - cam.transform.position);
        }

        /// <summary>Busca la identidad de un collider (o null si no es un jugador).</summary>
        public static PlayerIdentity FromCollider(Collider collider)
        {
            return collider != null ? collider.GetComponentInParent<PlayerIdentity>() : null;
        }
    }
}
