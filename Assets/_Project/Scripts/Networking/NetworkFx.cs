using RootsAndRust.Core;
using Unity.Netcode;
using UnityEngine;

namespace RootsAndRust.Networking
{
    /// <summary>
    /// Difusor de efectos visuales por red. El servidor llama a NetworkFx.Play(...)
    /// y todos los clientes reproducen las partículas localmente.
    /// Vive en el objeto "GameSystems" de la escena (siempre presente), así los
    /// efectos de impacto llegan aunque el proyectil ya se haya destruido.
    /// </summary>
    public class NetworkFx : NetworkBehaviour
    {
        public static NetworkFx Instance { get; private set; }

        public override void OnNetworkSpawn()
        {
            Instance = this;
        }

        public override void OnNetworkDespawn()
        {
            if (Instance == this) Instance = null;
        }

        /// <summary>Reproduce un efecto en todos los clientes. Llamar sólo en el servidor.</summary>
        public static void Play(FxKind kind, Vector3 position, float scale = 1f)
        {
            if (Instance != null && Instance.IsSpawned && Instance.IsServer)
                Instance.PlayFxRpc(kind, position, scale);
            else
                VfxFactory.Play(kind, position, scale); // Fallback local (offline / editor).
        }

        [Rpc(SendTo.ClientsAndHost)]
        void PlayFxRpc(FxKind kind, Vector3 position, float scale)
        {
            VfxFactory.Play(kind, position, scale);
        }
    }
}
