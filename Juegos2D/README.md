# 🎮 Juegos 2D educativos (HTML5 Canvas + JavaScript)

Tres videojuegos 2D completos que se juegan en el navegador **sin instalar nada**, cada uno con un **informe paso a paso y línea por línea** pensado para que alguien que nunca ha programado un juego pueda construirlo desde cero.

| Juego | Problemática que aborda | Jugar | Informe |
|---|---|---|---|
| ♻️ **EcoCaza** — atrapa la basura con el contenedor correcto | La gente duda al separar residuos y los errores estropean el reciclaje | [`EcoCaza/index.html`](EcoCaza/index.html) | [Markdown](EcoCaza/informe/Informe_EcoCaza.md) · [PDF](EcoCaza/informe/Informe_EcoCaza.pdf) · [Word](EcoCaza/informe/Informe_EcoCaza.docx) |
| 🧠 **¡Compila!** — roguelike de cartas donde tu mano es un programa | En los primeros cursos de programación (Ingeniería de Sistemas e Informática) cuesta entender el flujo de ejecución y el valor de las variables | [`Compila/index.html`](Compila/index.html) | [Markdown](Compila/informe/Informe_Compila.md) · [PDF](Compila/informe/Informe_Compila.pdf) · [Word](Compila/informe/Informe_Compila.docx) |
| 🛰️ **Barrendero Orbital** — estilo "asteroides": limpia la chatarra espacial | La basura espacial amenaza los satélites (GPS, clima, internet): síndrome de Kessler | [`BarrenderoOrbital/index.html`](BarrenderoOrbital/index.html) | [Markdown](BarrenderoOrbital/informe/Informe_BarrenderoOrbital.md) · [PDF](BarrenderoOrbital/informe/Informe_BarrenderoOrbital.pdf) · [Word](BarrenderoOrbital/informe/Informe_BarrenderoOrbital.docx) |

## Cómo jugar

Descarga el repositorio (botón **Code → Download ZIP**), descomprímelo y haz **doble clic** en el `index.html` del juego que quieras.

## Qué hay en cada carpeta de juego

```
EcoCaza/                      (igual en BarrenderoOrbital/)
├── index.html                ← la página del juego (ábrela para jugar)
├── juego.js                  ← todo el código del juego
├── pasos/paso01 … paso13/    ← el juego tal como queda al final de CADA paso del informe
└── informe/
    ├── Informe_EcoCaza.md    ← informe (se lee directamente en GitHub)
    ├── Informe_EcoCaza.pdf   ← el mismo informe en PDF
    ├── Informe_EcoCaza.docx  ← el mismo informe en Word
    └── img/                  ← todas las capturas, imágenes de código y diagramas
```

Cada carpeta de juego es **independiente**: si quieres que cada juego tenga su propio repositorio, basta con copiar su carpeta a un repositorio nuevo (y, si quieres, activar GitHub Pages en él para jugar online).

## Cómo se hicieron los informes

La carpeta [`_herramientas/`](_herramientas/) contiene el código fuente "maestro" de cada juego (con marcas que indican en qué paso aparece cada línea y su explicación) y el generador que construye automáticamente los archivos de cada paso, las capturas reales del juego en cada paso, las imágenes del código y los informes en Markdown, PDF y Word. Ver [`_herramientas/README.md`](_herramientas/README.md).
