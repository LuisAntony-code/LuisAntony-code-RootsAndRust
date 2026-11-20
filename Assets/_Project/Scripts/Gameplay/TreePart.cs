using UnityEngine;

namespace RootsAndRust.Gameplay
{
    public enum TreePartType
    {
        /// <summary>Tocón fijo (siempre presente).</summary>
        Stump,
        /// <summary>Tronco + copa (cae con físicas al ser talado).</summary>
        Trunk
    }

    /// <summary>
    /// Etiqueta los colliders de un árbol para que los proyectiles sepan qué han golpeado.
    /// </summary>
    public class TreePart : MonoBehaviour
    {
        [SerializeField] DynamicTree tree;
        [SerializeField] TreePartType part;

        public DynamicTree Tree => tree != null ? tree : (tree = GetComponentInParent<DynamicTree>());
        public TreePartType Part => part;

        public void Setup(DynamicTree owner, TreePartType type)
        {
            tree = owner;
            part = type;
        }
    }
}
