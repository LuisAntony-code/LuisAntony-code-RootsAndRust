# Herramientas que generan los juegos y los informes

| Archivo | Qué hace |
|---|---|
| `ecocaza/juego.src.js`, `barrendero/juego.src.js` (+ `index.src.html`) | Código maestro de cada juego. Marcas: `//#[N` … `//#]` = líneas que aparecen en el paso N (`//#[N-M` = solo de N a M); `//? texto` = explicación de la línea siguiente; `//> texto` = párrafo introductorio. Las marcas se eliminan del código que se entrega. |
| `*/informe.md` | Texto del informe con marcadores (`{{CAMBIOS:N}}`, `{{CAPTURA:id|pie}}`, `{{DIAGRAMA:id|pie}}`…). |
| `config_*.py` | Escenarios de captura (qué teclas pulsar en cada paso), diagramas y títulos. |
| `pasos.py` | Lee las marcas y calcula qué líneas se añaden/borran en cada paso. |
| `generar.py` | Construye `pasos/`, las imágenes de código, las capturas enmarcadas y los informes (Markdown, Word con pandoc y PDF con Chromium). |
| `render.js` | Abre cada paso del juego en Chromium (Playwright), simula teclado/ratón y hace las capturas. |
| `comun/`, `*/diagramas/` | Diagramas en HTML/SVG y estilo del PDF. |

Regenerar todo (requiere Python 3 con Pygments y Pillow, Node con Playwright y pandoc):

```bash
cd Juegos2D/_herramientas
python3 generar.py ecocaza
python3 generar.py barrendero
```
