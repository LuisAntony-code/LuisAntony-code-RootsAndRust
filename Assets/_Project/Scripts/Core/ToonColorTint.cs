using UnityEngine;

namespace RootsAndRust.Core
{
    /// <summary>
    /// Color por instancia para el shader ToonVibrant usando MaterialPropertyBlock.
    /// Permite variar el tono de cada árbol/flor sin duplicar materiales
    /// (compatible con GPU Instancing a través de _InstanceColor).
    /// </summary>
    [ExecuteAlways]
    [DisallowMultipleComponent]
    public class ToonColorTint : MonoBehaviour
    {
        static readonly int s_InstanceColorId = Shader.PropertyToID("_InstanceColor");
        static readonly int s_EmissionId = Shader.PropertyToID("_EmissionColor");

        [SerializeField] Color color = Color.white;
        [Range(0f, 1f)]
        [SerializeField] float amount = 1f;
        [Tooltip("Aplicar también a los renderers hijos.")]
        [SerializeField] bool includeChildren = true;

        MaterialPropertyBlock m_Block;

        public Color Color
        {
            get => color;
            set { color = value; Apply(); }
        }

        public void Set(Color newColor, float newAmount = 1f)
        {
            color = newColor;
            amount = newAmount;
            Apply();
        }

        /// <summary>Asigna una emisión por instancia (p. ej. latido del Árbol Corazón).</summary>
        public void SetEmission(Color emission)
        {
            if (m_Block == null) m_Block = new MaterialPropertyBlock();
            foreach (var r in GetRenderers())
            {
                r.GetPropertyBlock(m_Block);
                m_Block.SetColor(s_EmissionId, emission);
                r.SetPropertyBlock(m_Block);
            }
        }

        void OnEnable() => Apply();
        void OnValidate() => Apply();

        Renderer[] GetRenderers()
        {
            return includeChildren ? GetComponentsInChildren<Renderer>(true) : GetComponents<Renderer>();
        }

        public void Apply()
        {
            if (m_Block == null) m_Block = new MaterialPropertyBlock();
            var c = color;
            c.a = amount;
            foreach (var r in GetRenderers())
            {
                if (r == null || r is ParticleSystemRenderer || r is TrailRenderer) continue;
                r.GetPropertyBlock(m_Block);
                m_Block.SetColor(s_InstanceColorId, c);
                r.SetPropertyBlock(m_Block);
            }
        }
    }
}
