<!-- solo-github -->
# Informe de creación del videojuego «Barrendero Orbital»

**Un juego 2D de naves al estilo de los clásicos de asteroides para entender y combatir la basura espacial, explicado paso a paso y línea por línea.**

> 📄 Este mismo informe está también en **PDF** (`Informe_BarrenderoOrbital.pdf`) y en **Word** (`Informe_BarrenderoOrbital.docx`) dentro de esta carpeta.
> 🎮 El juego terminado está en la carpeta de arriba: abre `../index.html` en tu navegador para jugar.
<!-- /solo-github -->

# 1. Presentación del proyecto

## 1.1 ¿Qué es Barrendero Orbital?

**Barrendero Orbital** es un juego 2D de naves en el espacio, del mismo género que los clásicos "de asteroides" de las máquinas recreativas: una nave que gira y avanza con inercia, dispara a las rocas, y las rocas se parten en trozos cada vez más pequeños. Pero aquí **no hay rocas**: hay **chatarra espacial** (restos de cohetes y satélites viejos) que pone en peligro la órbita de la Tierra. Eres un **barrendero espacial**: rompes la chatarra, **recoges los fragmentos para reciclarlos** y **proteges los satélites activos** que cruzan la pantalla.

{{CAPTURA:final_juego|Barrendero Orbital terminado: la nave (centro) dispara a la chatarra mientras un satélite activo cruza la pantalla. Abajo, la Tierra.}}

## 1.2 La problemática que resuelve

Alrededor de la Tierra giran **muchísimos objetos que ya no sirven**: satélites apagados, partes de cohetes, tornillos, trozos de pintura… Las agencias espaciales siguen la pista de **decenas de miles** de objetos, y la Agencia Espacial Europea (ESA) estima que hay **más de un millón de fragmentos de entre 1 y 10 cm**, demasiado pequeños para vigilarlos y lo bastante grandes para romper un satélite, porque en órbita viajan a unos **28.000 km/h**.

Esto nos afecta a todos: dependemos de los satélites para el **GPS** del móvil, la **predicción del tiempo**, **internet**, la **televisión** o la vigilancia de **incendios y del cambio climático**. Y el problema puede crecer solo: cada choque crea más fragmentos, que provocan más choques. Es el **síndrome de Kessler**.

{{DIAGRAMA:kessler|El síndrome de Kessler: una reacción en cadena de choques que el juego simula con los satélites activos.}}

La mayoría de la gente **no sabe que este problema existe**. Barrendero Orbital lo hace visible y comprensible jugando:

- La chatarra **no desaparece** al dispararle: se rompe en trozos más pequeños (¡como en la realidad, romperla crea más piezas!). La solución es **recogerla y reciclarla**, no solo destruirla.
- Los **satélites activos** muestran su nombre (GPS, clima, internet…) para que veas qué perderíamos.
- Si la chatarra golpea un satélite, este **se convierte en más chatarra**: el síndrome de Kessler en directo.
- La pantalla final enseña un **dato real** sobre la basura espacial.

## 1.3 Cómo se juega

| Acción | Tecla |
|---|---|
| Girar a la izquierda / derecha | ← → (o A / D) |
| Encender el motor (avanzar) | ↑ (o W) |
| Disparar el láser | Espacio |
| Empezar / volver a jugar | Enter o Espacio |

**Reglas:**

- 💥 **Chatarra grande** → al dispararle se parte en 2 medianas; cada mediana en 2 pequeñas; cada pequeña deja un **fragmento verde**. Más puntos cuanto más pequeña (20, 50 y 100).
- ♻️ **Fragmento verde** → pasa cerca con la nave para recogerlo: +30 puntos y entre 5 y 10 **kg reciclados**. ¡Desaparece a los 8 segundos!
- 🛰️ **Satélite activo** → cruza la pantalla. Si llega al otro lado: **+150**. Si le disparas: **−100** y se rompe. Si lo golpea la chatarra: se rompe y crea **más chatarra**.
- ❤️ Tienes **3 vidas**. Si la chatarra toca la nave, pierdes una y reapareces en el centro con 3 segundos de protección (la nave parpadea).
- 🌊 Al limpiar toda la chatarra: **bonus** y llega la siguiente **oleada**, con más piezas y más rápidas.

{{CAPTURA:final_menu|Pantalla de inicio: explica los tres tipos de objetos con sus dibujos reales y los controles.}}

## 1.4 Parecido a los clásicos… pero diferente

Como pediste un juego **parecido a los de asteroides**, Barrendero Orbital mantiene las mecánicas que hacen divertido ese género, pero **todo su contenido es original** (gráficos, sonidos, reglas nuevas y código propio):

| Mecánica clásica del género | Qué añade Barrendero Orbital |
|---|---|
| Nave que gira y avanza con inercia | Igual (es lo divertido de controlar) y además pinzas recolectoras con efecto imán |
| Las rocas se parten en trozos más pequeños | La chatarra pequeña deja **fragmentos reciclables** que hay que recoger a tiempo |
| La pantalla "da la vuelta" por los bordes | Igual, con la Tierra de fondo para situarnos en órbita |
| Enemigos que disparan | En su lugar, **satélites que hay que proteger**: un objetivo que NO se debe destruir |
| Oleadas cada vez más difíciles | Igual, con un mensaje de "¡Órbita limpia!" y bonus |
| — | Contador de **kilos reciclados**, satélites salvados y datos reales al final |

## 1.5 Qué vas a aprender construyéndolo

Crear una página con un lienzo (**HTML** y **CSS**), programar en **JavaScript**, dibujar y **girar** figuras con el **Canvas API**, mover objetos con **velocidad e inercia** usando **seno y coseno**, hacer que la pantalla "dé la vuelta", **disparar**, generar **formas aleatorias**, detectar **choques entre círculos**, dividir objetos, crear **partículas**, **sonidos** sintetizados, **temblor de pantalla**, una **máquina de estados** (menú, partida y fin) y guardar el **récord**.

# 2. Antes de empezar

## 2.1 Lo que necesitas

| Qué | Para qué | Dónde conseguirlo | Precio |
|---|---|---|---|
| Un ordenador (Windows, Mac o Linux) con teclado | Escribir el código y jugar | — | — |
| Un navegador moderno: **Google Chrome**, **Microsoft Edge** o **Firefox** | Ejecutar el juego | Ya lo tienes instalado casi seguro | Gratis |
| Un editor de código: **Visual Studio Code** (recomendado) | Escribir los archivos | <https://code.visualstudio.com> | Gratis |

> 💡 **No hay que instalar nada más.** Ni motores de juegos, ni librerías: el juego son dos archivos de texto que el navegador entiende directamente.

## 2.2 Instalar Visual Studio Code (5 minutos)

1. Entra en **<https://code.visualstudio.com>**.
2. Pulsa el botón grande de descarga.
3. Abre el archivo descargado y acepta las opciones por defecto (en Windows, marca **"Agregar acción 'Abrir con Code' al menú contextual"**).
4. Para ponerlo en español: `Ctrl + Shift + P` (Mac: `⌘ + Shift + P`) → escribe **Configure Display Language** → **Español** → reinicia.

## 2.3 De dónde sale cada parte del juego

**No se ha descargado ni copiado ningún recurso** (ni imágenes, ni sonidos, ni código de otros juegos): todo se crea con el código de este informe.

| Parte del juego | Cómo se hizo | De dónde sale / documentación |
|---|---|---|
| Página y lienzo | HTML5 `<canvas>` | [MDN – Canvas API](https://developer.mozilla.org/es/docs/Web/API/Canvas_API) |
| Estilo de la página | CSS | [MDN – CSS](https://developer.mozilla.org/es/docs/Web/CSS) |
| Lógica del juego | JavaScript sin librerías | [MDN – JavaScript](https://developer.mozilla.org/es/docs/Web/JavaScript) |
| Nave, chatarra, satélites, Tierra, estrellas | Dibujados con figuras del Canvas (líneas, polígonos, círculos, elipses, degradados) | Diseño propio. [MDN – CanvasRenderingContext2D](https://developer.mozilla.org/es/docs/Web/API/CanvasRenderingContext2D) |
| Formas irregulares de la chatarra | Generadas al azar con seno y coseno (cada pieza es única) | Técnica clásica de "polígonos aleatorios" |
| Giros (`rotate`) y traslados (`translate`) | Transformaciones del Canvas | [MDN – Transformaciones](https://developer.mozilla.org/es/docs/Web/API/Canvas_API/Tutorial/Transformations) |
| Física (inercia, empuje, rozamiento) | Fórmulas sencillas con vectores | Física básica (ver diagrama del paso 4) |
| Sonidos (láser, explosiones, recoger) | Sintetizados con la **Web Audio API** | [MDN – Web Audio API](https://developer.mozilla.org/es/docs/Web/API/Web_Audio_API) |
| Mecánicas de género (girar, inercia, dividir rocas, bordes que "dan la vuelta") | Ideas del género clásico de "asteroides" (las mecánicas no tienen dueño; el código y el arte son propios) | — |
| Fragmentos reciclables, satélites a proteger, síndrome de Kessler | Diseño original de este juego | — |
| Datos sobre basura espacial | Agencia Espacial Europea (ESA) | [ESA – Space debris](https://www.esa.int/Space_Safety/Space_Debris) |
| Récord guardado | `localStorage` | [MDN – localStorage](https://developer.mozilla.org/es/docs/Web/API/Window/localStorage) |
| Capturas de este informe | Tomadas automáticamente ejecutando cada paso en el navegador Chromium | [Playwright](https://playwright.dev) |

## 2.4 Conceptos básicos de programación en 5 minutos

**1. Variable:** una caja con nombre que guarda un dato. `let` si va a cambiar, `const` si no.

```javascript
let puntos = 0;
puntos = puntos + 20;   // ahora vale 20
const ANCHO = 800;      // no cambiará nunca
```

**2. Objeto:** una caja con apartados.

```javascript
const nave = { x: 400, y: 300, angulo: 0 };
nave.x = nave.x + 5;   // mover la nave 5 píxeles a la derecha
```

**3. Array (lista):** varios datos en orden; posiciones desde **0**.

```javascript
let chatarras = [];          // lista vacía
chatarras.push(pieza);       // añadir al final
chatarras.length;            // cuántas hay
chatarras.splice(2, 1);      // borrar 1 elemento en la posición 2
```

**4. Función:** órdenes con nombre que se ejecutan al llamarlas.

```javascript
function distancia(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}
distancia(0, 0, 3, 4);   // → 5
```

**5. Condición (`if / else`)** y **6. Bucles (`for`, `for...of`)**:

```javascript
if (vidas <= 0) {
  terminarPartida();
}
for (let i = 0; i < 3; i++) { /* se repite con i = 0, 1, 2 */ }
for (const c of chatarras) { /* se repite una vez por cada pieza c */ }
```

**7. Seno y coseno:** convierten un **ángulo** en cuánto hay que moverse en **x** (coseno) y en **y** (seno). Los usaremos muchísimo (ver 2.6).

| Símbolo | Significa | Ejemplo |
|---|---|---|
| `=` | guardar un valor | `vidas = 3` |
| `===` / `!==` | ¿es igual? / ¿es distinto? | `estado === "menu"` |
| `&&` | y además | `a && b` |
| <code>&#124;&#124;</code> | o | `teclas["ArrowUp"]` <code>&#124;&#124;</code> `teclas["KeyW"]` |
| `!` | no | `!impacto` |
| `+=` / `-=` | sumar / restar a lo que había | `nave.x += 5` |
| `? :` | si… entonces… si no… | `vivo ? "sí" : "no"` |
| `//` | comentario (el ordenador lo ignora) | `// nota` |

## 2.5 Las coordenadas del lienzo

{{DIAGRAMA:coordenadas|Sistema de coordenadas del canvas: la y crece hacia abajo. Nuestro lienzo mide 800 × 600.}}

## 2.6 Ángulos, seno y coseno

En este juego todo gira: la nave, la chatarra, los satélites. Es la parte con más matemáticas, pero solo necesitas recordar las dos "fórmulas mágicas" de la derecha.

{{DIAGRAMA:radianes|Radianes y las fórmulas para pasar de un ángulo a una posición (x, y).}}

## 2.7 El bucle del juego

{{DIAGRAMA:bucle|El bucle del juego: medir el tiempo, actualizar y dibujar, unas 60 veces por segundo.}}

## 2.8 Hoja de ruta: los 14 pasos

{{DIAGRAMA:hoja_de_ruta_barrendero|Cómo se ve el juego al terminar cada uno de los 14 pasos.}}

## 2.9 Cómo leer los pasos de este informe

1. **Objetivo** del paso.
2. **Cambios en el código:** dónde escribir, **imagen del editor** con las líneas nuevas en **verde** (las que hay que borrar, en **rojo tachado**), la **explicación de cada línea** y el **código para copiar**.
3. **Resultado:** capturas reales del juego en ese paso.
4. **Pruébalo tú:** experimentos para entenderlo mejor.

> 🛟 **Red de seguridad:** la carpeta `pasos/` tiene el código completo tal y como queda al final de cada paso (`pasos/paso01`, `pasos/paso02`…). Si algo no funciona, compara tu archivo con ese.

> ⌨️ Escribe el código a mano siempre que puedas: así se aprende de verdad. Los comentarios (`// ...`) puedes saltártelos.

# 3. Paso 0 · Preparar la carpeta y los archivos

**Objetivo:** tener la carpeta del proyecto con dos archivos vacíos, abierta en el editor.

1. En **Documentos** (o donde prefieras) crea una carpeta **`Juegos`** y dentro otra llamada **`BarrenderoOrbital`** (todo junto, sin espacios).
2. En **Visual Studio Code**: **Archivo → Abrir carpeta…** → elige **BarrenderoOrbital** → **Seleccionar carpeta** (si pregunta si confías en los autores, di que sí).
3. En el **Explorador** (panel izquierdo) pulsa el icono **Nuevo archivo** y crea **`index.html`**.
4. Crea otro archivo llamado **`juego.js`**.

> ⚠️ Nombres en minúsculas, sin espacios y con su extensión. En Windows, cuidado con que no se llamen `index.html.txt`.

{{DIAGRAMA:estructura_barrendero|La carpeta del proyecto: dos archivos y cómo se relacionan.}}

{{DIAGRAMA:editor_barrendero|La carpeta abierta en Visual Studio Code (ilustración).}}

{{DIAGRAMA:abrir_navegador_barrendero|Abrir index.html con el navegador (ilustración).}}

{{DIAGRAMA:consola_abrir|La consola del navegador: donde aparecen los errores.}}

> 🔁 **Ciclo de trabajo:** escribir → guardar (`Ctrl + S`) → recargar el navegador (`F5`) → mirar.

# 4. Paso 1 · El lienzo y un saludo

**Objetivo:** crear la página web con un lienzo de 800 × 600 y comprobar que JavaScript puede dibujar en él.

**Qué aprenderás:** la estructura de un HTML, el `<canvas>`, cómo se conecta un `.js` y las primeras órdenes de dibujo.

El archivo `index.html` se escribe **una sola vez**; todo lo demás irá en `juego.js`.

{{CAMBIOS:1}}

### Resultado del paso 1

{{CAPTURA:p01|Resultado del paso 1: el espacio negro con el saludo en el centro.}}

### Pruébalo tú

- Cambia `"#80ffdb"` por `"yellow"` y recarga.
- Cambia `bold 36px` por `bold 60px`.
- Si no ves nada, abre la consola (F12): lo más común es un error al escribir `lienzo`.

# 5. Paso 2 · Estrellas, la Tierra y el bucle del juego

**Objetivo:** pintar un cielo con 140 estrellas que titilan, la Tierra asomando por abajo con su atmósfera, y crear el **bucle del juego**.

**Qué aprenderás:** crear objetos en un bucle, opacidad (`globalAlpha`), degradados circulares, elipses, **recortes** con `clip()` y `requestAnimationFrame`.

{{CAMBIOS:2}}

### Resultado del paso 2

{{CAPTURA:p02|Resultado del paso 2: el espacio con estrellas y la Tierra con su halo azul de atmósfera.}}

### Pruébalo tú

- Cambia `i < 140` por `i < 600`: ¡un cielo lleno de estrellas!
- Cambia `"#1d5fa8"` por `"#c1440e"` y `"#3c9d5d"` por `"#8a2c0d"`: ahora estás en órbita de Marte.

# 6. Paso 3 · La nave

**Objetivo:** dibujar la nave barrendera en el centro: casco en forma de flecha, cabina y pinzas recolectoras.

**Qué aprenderás:** el truco de `translate` + `rotate` para dibujar una figura en cualquier posición y ángulo.

{{CAMBIOS:3}}

### Resultado del paso 3

{{CAPTURA:p03|Resultado del paso 3: la nave en el centro, apuntando hacia arriba.}}

### Pruébalo tú

- Cambia `angulo: -Math.PI / 2` por `angulo: 0` (mira a la derecha) o `Math.PI / 4` (diagonal hacia abajo a la derecha).
- Cambia los colores del casco para personalizar tu nave.

# 7. Paso 4 · Girar y propulsar con inercia

**Objetivo:** girar con ← →, acelerar con ↑ (con una llama en el motor) y que la nave se deslice y frene poco a poco.

**Qué aprenderás:** eventos de teclado y la **física de la inercia** con seno y coseno.

{{DIAGRAMA:vectores|El empuje del motor se reparte entre x e y con coseno y seno.}}

{{CAMBIOS:4}}

### Resultado del paso 4

{{CAPTURA:p04_giro|Tras pulsar la flecha derecha un momento, la nave ha girado.}}

{{CAPTURA:p04_motor|Con la flecha arriba pulsada: la llama del motor se enciende y la nave avanza en la dirección en la que apunta.}}

### Pruébalo tú

- Pon `FRICCION = 0`: así es el espacio de verdad… ¡e imposible de frenar!
- Sube `EMPUJE` a `600` para una nave de carreras.

# 8. Paso 5 · La pantalla "da la vuelta"

**Objetivo:** que la nave, al salir por un borde, aparezca por el contrario.

**Qué aprenderás:** a escribir una función **reutilizable** que sirve para cualquier objeto (la usaremos con disparos, chatarra y fragmentos).

{{DIAGRAMA:envolver|Cómo funciona envolver(): lo que sale por un lado entra por el otro.}}

{{CAMBIOS:5}}

### Resultado del paso 5

{{CAPTURA:p05_antes|La nave avanza hacia el borde derecho…}}

{{CAPTURA:p05_despues|…y un instante después aparece por el borde izquierdo.}}

# 9. Paso 6 · Disparar el láser

**Objetivo:** disparar con ESPACIO rayos láser que salen de la punta de la nave, con un pequeño tiempo de "enfriamiento" entre disparos.

**Qué aprenderás:** crear objetos sobre la marcha, listas que se vacían solas con `filter`, y un temporizador de enfriamiento.

{{CAMBIOS:6}}

### Resultado del paso 6

{{CAPTURA:p06|Disparando mientras la nave gira: los rayos salen en abanico.}}

### Pruébalo tú

- Cambia `enfriamiento = 0.22` por `0.05`: ¡ametralladora láser!
- Cambia `vida: 0.9` por `vida: 0.3`: disparos de corto alcance.

# 10. Paso 7 · La chatarra espacial

**Objetivo:** crear piezas de chatarra con formas irregulares únicas, que flotan, giran y dan la vuelta a la pantalla.

**Qué aprenderás:** generar **formas aleatorias** con trigonometría, `do...while`, y dibujar polígonos a partir de una lista de puntos.

{{CAMBIOS:7}}

### Resultado del paso 7

{{CAPTURA:p07|Resultado del paso 7: tres piezas grandes de chatarra, cada una con forma y color distintos.}}

### Pruébalo tú

- En `formaAleatoria`, cambia `0.7 + Math.random() * 0.35` por `0.3 + Math.random() * 0.9`: ¡chatarra con pinchos!
- Cambia `const cantidad = 2 + oleada;` por `10 + oleada`.

# 11. Paso 8 · Romper la chatarra

**Objetivo:** detectar cuándo un disparo toca una pieza y partirla en dos más pequeñas, sumando puntos.

**Qué aprenderás:** **colisiones entre círculos**, bucles anidados recorridos al revés y la lógica de "dividir".

{{DIAGRAMA:colision_circulos|La regla de oro de las colisiones circulares.}}

{{DIAGRAMA:division|De una pieza grande a cuatro fragmentos.}}

{{CAMBIOS:8}}

### Resultado del paso 8

{{CAPTURA:p08_antes|El láser va hacia una pieza grande…}}

{{CAPTURA:p08_dividido|…¡impacto! Se ha partido en dos piezas medianas que salen en direcciones distintas.}}

{{CAPTURA:p08_pequenas|Disparando sin parar: las medianas se rompen en pequeñas. El marcador provisional suma los puntos.}}

# 12. Paso 9 · Fragmentos reciclables

**Objetivo:** que la chatarra más pequeña deje un fragmento verde que se recoge pasando cerca con la nave (las pinzas lo atraen como un imán), sumando kilos reciclados. También añadimos los textos flotantes.

**Qué aprenderás:** la "atracción" con vectores de dirección, objetos con tiempo de vida y parpadeo.

{{CAMBIOS:9}}

### Resultado del paso 9

{{CAPTURA:p09_fragmentos|Fragmentos verdes flotando: hay que recogerlos antes de 8 segundos (en los 2 últimos parpadean).}}

{{CAPTURA:p09_recoger|La nave atrae un fragmento cercano y lo recoge: "+N kg reciclados".}}

### Pruébalo tú

- Cambia `d < 110` por `d < 300`: ¡imán superpotente!
- Cambia `vida: 8` por `vida: 3` para hacerlo más difícil.

# 13. Paso 10 · Choques y vidas

**Objetivo:** que la chatarra pueda golpear la nave: se pierde una vida y la nave reaparece en el centro, parpadeando e invulnerable durante 3 segundos.

**Qué aprenderás:** temporizadores de invulnerabilidad y parpadeo con `Math.floor` y `%`.

{{CAMBIOS:10}}

### Resultado del paso 10

{{CAPTURA:p10_antes|Una pieza grande se acerca a la nave…}}

{{CAPTURA:p10_choque|…¡choque! La nave reaparece en el centro (parpadeando, invulnerable) y las vidas bajan a 2.}}

# 14. Paso 11 · Satélites activos (el síndrome de Kessler)

**Objetivo:** añadir satélites que cruzan la pantalla y que hay que proteger: premio si llegan al otro lado, castigo si les disparas, y si la chatarra los golpea se convierten en más chatarra.

**Qué aprenderás:** objetos con dos finales posibles, el método `some` de los arrays y a dibujar un objeto compuesto (paneles, brazo, cuerpo y luz).

{{CAMBIOS:11}}

### Resultado del paso 11

{{CAPTURA:p11_satelite|Un satélite activo cruzando la pantalla, con su nombre debajo y la luz verde parpadeando.}}

{{CAPTURA:p11_kessler|La chatarra golpea al satélite: se rompe y aparecen dos piezas de chatarra nuevas. ¡El síndrome de Kessler!}}

{{CAPTURA:p11_disparo|Si el jugador dispara a un satélite: aviso en rojo y 100 puntos menos.}}

{{CAPTURA:p11_salvado|Satélite que llega sano y salvo al otro lado: +150 puntos.}}

# 15. Paso 12 · Oleadas y marcador

**Objetivo:** cuando no queda chatarra, mostrar "¡Órbita limpia!", dar un bonus y lanzar una oleada más difícil. Y cambiar el marcador provisional por uno completo.

{{CAMBIOS:12}}

### Resultado del paso 12

{{CAPTURA:p12_hud|El marcador completo: puntos, vidas (naves pequeñas), oleada, kilos reciclados y satélites salvados.}}

{{CAPTURA:p12_oleada|Al limpiar toda la chatarra: "¡Órbita limpia!" y el bonus antes de la siguiente oleada.}}

# 16. Paso 13 · Partículas, sonido y temblor

**Objetivo:** dar "jugo" al juego: explosiones de chispas, estela de fuego del motor, sonidos sintetizados y la pantalla que tiembla con los impactos.

**Qué aprenderás:** sistemas de partículas sin gravedad, sonidos que cambian de tono (`exponentialRampToValueAtTime`) y el temblor de cámara.

{{CAMBIOS:13}}

### Resultado del paso 13

{{CAPTURA:p13_explosion|Explosión de partículas al romper una pieza grande (con sonido y temblor).}}

{{CAPTURA:p13_motor|La estela de fuego del motor al girar acelerando.}}

{{CAPTURA:p13_nave|Explosión de la nave al chocar: partículas turquesa y temblor fuerte.}}

> 🔊 Los sonidos no salen en las capturas: ¡pruébalo con los altavoces encendidos!

# 17. Paso 14 · Menú, final y récord

**Objetivo:** pantalla de inicio, pantalla final con estadísticas y dato real sobre la basura espacial, y récord guardado.

**Qué aprenderás:** **máquina de estados**, reiniciar una partida y `localStorage`.

{{CAMBIOS:14}}

### Resultado del paso 14

{{CAPTURA:p14_menu|Menú de inicio con la explicación de los objetos del juego.}}

{{CAPTURA:p14_inicio|Al pulsar ENTER: "Oleada 1" y la nave parpadeando (protegida) al empezar.}}

{{CAPTURA:p14_fin|Pantalla final: puntos, récord, kilos reciclados, oleada alcanzada, satélites y un dato real.}}

¡Enhorabuena! **El juego está terminado.** Una partida en la oleada 2:

{{CAPTURA:final_juego2|Barrendero Orbital terminado en plena acción.}}

# 18. Errores comunes y cómo solucionarlos

## 18.1 Pantalla vacía por una palabra mal escrita

Con `cxt` en vez de `ctx` en `dibujarFondo`, JavaScript se detiene al primer fotograma:

{{CAPTURA:error_typo|Con una sola letra cambiada, el lienzo se queda vacío.}}

{{CONSOLA:error_typo|El mensaje real de la consola: "cxt is not defined".}}

**Solución:** busca la palabra con `Ctrl + F` y corrígela. Mayúsculas y minúsculas importan.

## 18.2 Olvidar `ctx.restore()`

Cada `save()` necesita su `restore()`. Si se te olvida en `dibujarChatarra`, los giros y traslados de cada pieza **se acumulan** y la siguiente se dibuja desplazada y girada respecto a la anterior:

{{CAPTURA:error_restore|Sin restore() las piezas aparecen en sitios absurdos: cada una hereda el movimiento de la anterior.}}

## 18.3 Confundir seno y coseno

Si en la línea del empuje vertical escribes `Math.cos` en lugar de `Math.sin`, la nave no va hacia donde apunta:

{{CAPTURA:error_seno|La nave apunta en diagonal hacia arriba a la derecha, pero al acelerar NO sube: se desvía hacia la derecha y un poco hacia abajo (mira la estela de fuego): la fórmula del empuje está mal.}}

**Recuerda:** coseno → x, seno → y.

## 18.4 Rastros por no dibujar el fondo

{{CAPTURA:error_sin_fondo|Sin dibujarFondo() cada fotograma se pinta sobre el anterior y todo deja estela.}}

## 18.5 Otros fallos frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| *"Unexpected token"* o *"missing )"* | Falta o sobra un paréntesis, llave o coma | Revisa la línea que dice la consola y la anterior |
| *"... is not a function"* | Nombre de función mal escrito o paso incompleto | Compara con `pasos/pasoNN` |
| La nave no responde | El foco no está en la página | Haz clic una vez en el juego |
| Al disparar no pasa nada a la chatarra | La función `comprobarDisparos()` no se llama en `actualizar` | Revisa el paso 8 |
| No hay sonido | El navegador espera a que pulses una tecla, o el volumen está a 0 | Pulsa una tecla; sube el volumen |
| Tildes con símbolos raros | Archivo no guardado en UTF-8 | VS Code → abajo a la derecha → *Guardar con codificación → UTF-8* |

# 19. Cómo compartir tu juego

**GitHub Pages (gratis):** crea un repositorio público en <https://github.com>, sube `index.html` y `juego.js` (**Add file → Upload files**), y en **Settings → Pages** elige la rama **main** y la carpeta **/(root)**. En un par de minutos estará en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.

**itch.io:** crea un proyecto de tipo *HTML*, sube la carpeta comprimida en `.zip` y marca *"This file will be played in the browser"*.

# 20. Ideas para mejorar el juego

- **Red de captura:** una tecla que lance una red que atrape varios fragmentos a la vez.
- **Mejoras de la nave** comprando con los kilos reciclados (más imán, disparo doble, escudo).
- **Controles táctiles:** botones en pantalla para jugar en el móvil (como en EcoCaza, con *pointer events*).
- **Satélites que piden ayuda:** una flecha indica cuál está en peligro.
- **Modo historia** con datos reales de misiones de limpieza espacial.

# Anexo A · Mapa del código

{{DIAGRAMA:arquitectura_barrendero|Todas las funciones del juego y quién llama a quién.}}

# Anexo B · Código completo final

Los dos archivos completos tal como quedan al final del paso 14 (también están en la carpeta del proyecto).

{{CODIGO_COMPLETO}}

# Anexo C · Fuentes y referencias

- Agencia Espacial Europea (ESA). *Space debris* y *ESA's Space Environment Report*. <https://www.esa.int/Space_Safety/Space_Debris>
- Kessler, D. J. y Cour-Palais, B. G. (1978). *Collision frequency of artificial satellites: The creation of a debris belt*. Journal of Geophysical Research.
- MDN Web Docs. *Canvas API*, *Transformaciones*, *requestAnimationFrame*, *Web Audio API*, *localStorage*. <https://developer.mozilla.org/es/>
- Visual Studio Code. <https://code.visualstudio.com>
- Playwright (capturas automáticas de este informe). <https://playwright.dev>

# Anexo D · Glosario

| Palabra | Significado |
|---|---|
| **Bucle del juego** | Función que se repite cada fotograma: actualizar y dibujar. |
| **Canvas (lienzo)** | Elemento HTML donde se dibuja con JavaScript. |
| **Colisión** | Cuando dos objetos se tocan; aquí, círculos cuya distancia es menor que la suma de radios. |
| **Coseno / seno** | Funciones que convierten un ángulo en desplazamiento horizontal / vertical. |
| **dt** | Segundos desde el fotograma anterior. |
| **Envolver (wrap)** | Hacer que lo que sale por un borde entre por el contrario. |
| **Fricción** | Fuerza que frena poco a poco. |
| **Inercia** | Tendencia a seguir moviéndose aunque se apague el motor. |
| **Oleada** | Grupo de enemigos (aquí, chatarra) que aparece a la vez. |
| **Partícula** | Pequeño elemento visual de vida corta para efectos. |
| **Radián** | Unidad de ángulo: una vuelta = 2π ≈ 6.28. |
| **rotate / translate** | Órdenes del canvas para girar / mover el "pincel". |
| **Síndrome de Kessler** | Reacción en cadena de choques entre objetos en órbita. |
| **Vector** | Flecha con dirección y tamaño; aquí, la velocidad (vx, vy). |
