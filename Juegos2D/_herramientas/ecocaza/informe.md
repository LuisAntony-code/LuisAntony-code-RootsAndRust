<!-- solo-github -->
# Informe de creación del videojuego «EcoCaza»

**Un juego 2D para aprender a separar la basura, explicado paso a paso y línea por línea.**

> 📄 Este mismo informe está también en **PDF** (`Informe_EcoCaza.pdf`) y en **Word** (`Informe_EcoCaza.docx`) dentro de esta carpeta.
> 🎮 El juego terminado está en la carpeta de arriba: abre `../index.html` en tu navegador para jugar.
<!-- /solo-github -->

# 1. Presentación del proyecto

## 1.1 ¿Qué es EcoCaza?

**EcoCaza** es un videojuego en 2D que se juega en el navegador (Chrome, Edge, Firefox o Safari), en ordenador o en móvil. Del cielo caen residuos —botellas, latas, periódicos, cáscaras de plátano…— y tú controlas un **contenedor con ruedas** que puede transformarse en cuatro contenedores distintos: **amarillo** (plásticos y latas), **azul** (papel y cartón), **verde** (vidrio) y **marrón** (orgánico). Tu misión es atrapar cada residuo **con el contenedor correcto**.

{{CAPTURA:final_juego|EcoCaza terminado, en plena partida (nivel 3). Arriba a la izquierda, los puntos y las vidas; arriba a la derecha, la barra de contaminación; abajo, los cuatro botones de contenedor.}}

## 1.2 La problemática que resuelve

Casi todo el mundo quiere reciclar, pero **mucha gente duda** en el momento de tirar algo: ¿el brik de leche va al azul porque parece cartón? ¿La tapa del tarro de mermelada va con el vidrio? ¿Y la cáscara de plátano? Cuando un residuo va al contenedor equivocado, ocurren dos cosas malas:

1. **Ese residuo no se recicla**, porque la planta de reciclaje que lo recibe no sabe tratarlo.
2. **Puede estropear el resto**: un objeto que no corresponde "contamina" el lote y obliga a separarlo a mano o a desecharlo.

Las campañas informativas (carteles, folletos) se leen una vez y se olvidan. **EcoCaza convierte esa información en un reflejo**: el jugador decide en décimas de segundo a qué contenedor va cada cosa, una y otra vez, y cada error se corrige al instante con un consejo claro (por ejemplo: *"Aunque parezca cartón, el brik lleva plástico y aluminio: AMARILLO"*). Es la misma técnica con la que se aprende a teclear o a conducir: **repetición + respuesta inmediata**.

> 🌍 Los colores que usa el juego son los de España (amarillo, azul, verde y marrón). En otros países cambian: en el **paso 3** verás que los colores y nombres están en un único sitio del código, así que adaptarlo a tu ciudad es cuestión de cambiar 4 líneas.

## 1.3 Cómo se juega

| Acción | Teclado | Ratón / pantalla táctil |
|---|---|---|
| Mover el contenedor | ← → (o A / D) | Mover el ratón o arrastrar el dedo |
| Cambiar a contenedor amarillo (plásticos y latas) | 1 | Tocar el botón amarillo |
| Cambiar a contenedor azul (papel y cartón) | 2 | Tocar el botón azul |
| Cambiar a contenedor verde (vidrio) | 3 | Tocar el botón verde |
| Cambiar a contenedor marrón (orgánico) | 4 | Tocar el botón marrón |
| Empezar / volver a jugar | Espacio | Clic o toque en la pantalla |

**Reglas:**

- ✅ Residuo en el contenedor correcto → **puntos** (10, 20, 30… cuantos más aciertos seguidos, más vale cada uno, hasta ×5) y el planeta se limpia un poquito.
- ❌ Residuo en el contenedor equivocado → **pierdes una vida** (tienes 3) y aparece un **consejo** que explica dónde va.
- 🟫 Residuo que cae al suelo → el planeta se **contamina un 10 %**: el cielo se vuelve gris y la basura se queda tirada en el césped.
- La partida termina si te quedas **sin vidas** o si la contaminación llega al **100 %**.
- Cada 150 puntos subes de **nivel**: los residuos caen más rápido y más a menudo.

{{CAPTURA:final_menu|Pantalla de inicio: el propio juego enseña qué residuos van en cada contenedor antes de empezar.}}

## 1.4 ¿Por qué es divertido y novedoso?

- **El jugador se transforma, no elige un objeto.** En la mayoría de juegos de reciclaje se arrastra la basura hasta un contenedor quieto. En EcoCaza eres un solo contenedor que **cambia de tipo al vuelo**: hay que moverse y decidir a la vez, lo que lo hace rápido y emocionante.
- **Dos formas de perder que obligan a decidir.** Si dudas y dejas caer un residuo, contaminas el planeta; si te precipitas y fallas, pierdes una vida. Esa tensión es la que hace que quieras "una partida más".
- **El escenario reacciona.** El cielo se oscurece y la basura se acumula en el césped según juegas: ves el efecto de tus decisiones.
- **Aprende de sus errores.** Cada fallo muestra un consejo concreto y la pantalla final da tu precisión y un dato curioso.
- **Funciona en cualquier sitio.** No hay que instalar nada: es una página web. Sirve en el móvil con el dedo.

## 1.5 Qué vas a aprender construyéndolo

Al terminar este informe sabrás: crear una página web con un lienzo de dibujo (**HTML**), darle estilo (**CSS**), y programar en **JavaScript** variables, funciones, objetos, listas, condiciones y bucles; dibujar con el **Canvas API**; hacer un **bucle de juego**; leer el **teclado, el ratón y la pantalla táctil**; detectar **colisiones**; crear **partículas** y **sonidos** sin archivos; y guardar el **récord** en el navegador.

# 2. Antes de empezar

## 2.1 Lo que necesitas

| Qué | Para qué | Dónde conseguirlo | Precio |
|---|---|---|---|
| Un ordenador (Windows, Mac o Linux) | Escribir el código | — | — |
| Un navegador moderno: **Google Chrome**, **Microsoft Edge** o **Firefox** | Ejecutar (jugar) el juego | Ya lo tienes instalado casi seguro | Gratis |
| Un editor de código: **Visual Studio Code** (recomendado) | Escribir los archivos con colores y ayudas | <https://code.visualstudio.com> | Gratis |
| Este informe | Seguir los pasos | — | — |

> 💡 **No hace falta instalar Node, Python, ni motores de videojuegos.** Todo el juego son dos archivos de texto que el navegador entiende directamente. Si no puedes instalar VS Code, sirve incluso el Bloc de notas, aunque es más incómodo.

## 2.2 Instalar Visual Studio Code (5 minutos)

1. Entra en **<https://code.visualstudio.com>**.
2. Pulsa el botón grande de descarga (detecta solo si tienes Windows, Mac o Linux).
3. Abre el archivo descargado y acepta las opciones por defecto. En Windows, marca la casilla **"Agregar acción 'Abrir con Code' al menú contextual"**: te vendrá muy bien.
4. Ábrelo. Si quieres el programa en español: pulsa `Ctrl + Shift + P` (en Mac `⌘ + Shift + P`), escribe **Configure Display Language**, elige **Español** y reinicia.

## 2.3 De dónde sale cada parte del juego

Una pregunta muy importante en cualquier proyecto es **de dónde sale cada cosa** (para respetar derechos de autor y para poder modificarla). En EcoCaza **no se ha descargado ni copiado ningún recurso**: todo se crea con código escrito en este informe.

| Parte del juego | Cómo se hizo | De dónde sale / documentación |
|---|---|---|
| Página y lienzo | HTML5 `<canvas>` | Estándar web. Guía: [MDN – Canvas API](https://developer.mozilla.org/es/docs/Web/API/Canvas_API) |
| Estilo de la página | CSS (flexbox, sombras) | [MDN – CSS](https://developer.mozilla.org/es/docs/Web/CSS) |
| Lógica del juego | JavaScript sin librerías | [MDN – JavaScript](https://developer.mozilla.org/es/docs/Web/JavaScript) |
| Gráficos (contenedor, residuos, nubes, sol, corazones) | Dibujados con figuras simples del Canvas: rectángulos, círculos, líneas y curvas | Diseño propio para este juego. Órdenes: [MDN – CanvasRenderingContext2D](https://developer.mozilla.org/es/docs/Web/API/CanvasRenderingContext2D) |
| Animación | `requestAnimationFrame` | [MDN – requestAnimationFrame](https://developer.mozilla.org/es/docs/Web/API/Window/requestAnimationFrame) |
| Sonidos | Generados en directo con la **Web Audio API** (osciladores) | [MDN – Web Audio API](https://developer.mozilla.org/es/docs/Web/API/Web_Audio_API) |
| Tipografía | Arial, que ya viene en el ordenador | — |
| Colores | Elegidos a mano (estilo "flat"). Puedes buscar otros en <https://coolors.co> | — |
| Récord guardado | `localStorage` del navegador | [MDN – localStorage](https://developer.mozilla.org/es/docs/Web/API/Window/localStorage) |
| Qué residuo va en cada contenedor | Normas de separación en España | [Ecoembes](https://www.ecoembes.com) (envases y papel), [Ecovidrio](https://www.ecovidrio.es) (vidrio) y las guías de tu ayuntamiento |
| Idea y reglas del juego | Diseño original | — |
| Capturas de este informe | Hechas automáticamente ejecutando cada paso del juego en el navegador Chromium | Herramienta [Playwright](https://playwright.dev) |

## 2.4 Conceptos básicos de programación en 5 minutos

No necesitas saber programar para seguir el informe, pero conviene conocer estas siete palabras. Todas aparecen en el juego.

**1. Variable:** una caja con nombre donde guardamos un dato.

```javascript
let puntos = 0;        // let: el valor puede cambiar
puntos = puntos + 10;  // ahora puntos vale 10
const ANCHO = 800;     // const: el valor NO cambiará nunca
```

**2. Texto, número y booleano:** los tres tipos de datos más usados. Los textos van entre comillas.

```javascript
let nombre = "Botella";   // texto (string)
let vidas = 3;             // número
let jugando = true;        // booleano: true (sí) o false (no)
```

**3. Objeto:** una caja con apartados, cada uno con su nombre.

```javascript
const contenedor = { x: 400, tipo: "amarillo" };
contenedor.x = 450;              // cambiar un apartado
console.log(contenedor.tipo);    // leer un apartado → "amarillo"
```

**4. Array (lista):** varios datos en orden. Las posiciones empiezan en **0**.

```javascript
const colores = ["amarillo", "azul", "verde"];
colores[0];            // "amarillo"
colores.length;        // 3 (cuántos hay)
colores.push("marron"); // añade uno al final
```

**5. Función:** un conjunto de órdenes con nombre que podemos ejecutar cuando queramos.

```javascript
function saludar(nombre) {
  return "¡Hola, " + nombre + "!";
}
saludar("Ana");  // → "¡Hola, Ana!"
```

**6. Condición (`if`):** hacer algo solo si se cumple algo.

```javascript
if (vidas <= 0) {
  terminarPartida();
} else {
  seguirJugando();
}
```

**7. Bucle (`for`):** repetir algo varias veces.

```javascript
for (let i = 0; i < 3; i++) {   // i vale 0, luego 1, luego 2
  dibujarCorazon(i);
}
```

| Símbolo | Significa | Ejemplo |
|---|---|---|
| `=` | guardar un valor | `vidas = 3` |
| `===` | ¿es igual? | `tipo === "azul"` |
| `!==` | ¿es distinto? | `estado !== "jugando"` |
| `&&` | y además | `a && b` (las dos) |
| <code>&#124;&#124;</code> | o | `a` <code>&#124;&#124;</code> `b` (al menos una) |
| `!` | no | `!audio` (no existe audio) |
| `+=` / `-=` | sumar / restar a lo que había | `puntos += 10` |
| `//` | comentario (el ordenador lo ignora) | `// esto es una nota` |

## 2.5 Las coordenadas del lienzo

Para dibujar en el lienzo hay que decir **dónde**: con dos números, **x** (horizontal) e **y** (vertical). ¡Ojo! La **y crece hacia abajo**.

{{DIAGRAMA:coordenadas|Sistema de coordenadas del canvas de 800 × 600 píxeles que usa EcoCaza.}}

## 2.6 Los ángulos en radianes

Para girar cosas y dibujar círculos usaremos ángulos. JavaScript no usa grados, sino **radianes**.

{{DIAGRAMA:radianes|Equivalencia entre grados y radianes y las fórmulas de seno y coseno que usaremos.}}

## 2.7 El bucle del juego

Todo videojuego es un bucle que se repite unas 60 veces por segundo. Entender esta imagen es entender cómo funcionan los videojuegos:

{{DIAGRAMA:bucle|El bucle del juego: calcular el tiempo, actualizar y dibujar, una y otra vez.}}

## 2.8 Hoja de ruta: los 13 pasos

Construiremos el juego en **13 pasos pequeños**. Después de cada uno el juego funciona y puedes verlo en el navegador. Así, si algo falla, sabes que el error está en lo último que escribiste.

{{DIAGRAMA:hoja_de_ruta_ecocaza|Cómo se ve el juego al terminar cada uno de los 13 pasos.}}

## 2.9 Cómo leer los pasos de este informe

Cada paso tiene siempre las mismas partes:

1. **Objetivo:** qué vamos a conseguir.
2. **Cambios en el código:** dónde escribir, una **imagen del editor** con las líneas nuevas en **verde** (y las que hay que borrar en **rojo tachado**), la **explicación de cada línea** y el **código para copiar**.
3. **Resultado:** capturas reales de cómo debe verse tu juego.
4. **Pruébalo tú:** pequeños experimentos para entender mejor.

> 🛟 **Red de seguridad:** en la carpeta `pasos/` del proyecto tienes el código completo **tal y como queda al final de cada paso** (`pasos/paso01`, `pasos/paso02`…). Si te pierdes, compara tu archivo con el de esa carpeta o cópialo y sigue desde ahí.

> ⌨️ **Consejo:** escribe el código a mano en lugar de copiarlo. Tardarás un poco más, pero lo entenderás y lo recordarás mucho mejor. Los comentarios (`// ...`) puedes saltártelos.

# 3. Paso 0 · Preparar la carpeta y los archivos

**Objetivo:** tener la carpeta del proyecto con dos archivos vacíos, abierta en el editor.

1. En tu ordenador, ve a **Documentos** (o donde quieras guardar tus proyectos) y crea una carpeta llamada **`Juegos`**. Dentro de ella crea otra llamada **`EcoCaza`**.
2. Abre **Visual Studio Code** → menú **Archivo → Abrir carpeta…** → elige la carpeta **EcoCaza** → **Seleccionar carpeta**. (Si pregunta *"¿Confía en los autores?"*, responde que sí: la carpeta es tuya.)
3. En el panel izquierdo (el **Explorador**), pasa el ratón sobre el nombre **ECOCAZA** y pulsa el icono de **Nuevo archivo** (una hoja con un +). Escribe **`index.html`** y pulsa Enter.
4. Repite para crear un segundo archivo llamado **`juego.js`**.

> ⚠️ **Los nombres importan:** todo en minúsculas, sin espacios y con su extensión (`.html` y `.js`). En Windows, si creas los archivos desde el Explorador de archivos en vez de VS Code, asegúrate de que no se llamen `index.html.txt` (activa *Vista → Extensiones de nombre de archivo*).

{{DIAGRAMA:estructura_ecocaza|La carpeta del proyecto: solo dos archivos y cómo se relacionan.}}

{{DIAGRAMA:editor_ecocaza|Así se ve la carpeta abierta en Visual Studio Code (ilustración).}}

Cuando tengas código, para **ver el juego** abre `index.html` en el navegador:

{{DIAGRAMA:abrir_navegador|Abrir index.html con el navegador desde el explorador de archivos (ilustración).}}

Y si alguna vez la pantalla se queda en blanco, la **consola** del navegador te dirá qué pasa:

{{DIAGRAMA:consola_abrir|Atajos de teclado para abrir la consola de errores del navegador.}}

> 🔁 **El ciclo de trabajo será siempre:** escribir código → guardar (`Ctrl + S`) → ir al navegador → recargar (`F5`) → mirar el resultado.

# 4. Paso 1 · El lienzo y un saludo

**Objetivo:** crear la página web con un lienzo de 800 × 600 píxeles y comprobar que nuestro JavaScript puede dibujar en él.

**Qué aprenderás:** la estructura de una página HTML, qué es el `<canvas>`, cómo se conecta un archivo `.js` y tus primeras órdenes de dibujo (`fillStyle`, `fillRect`, `fillText`).

El archivo `index.html` lo escribimos **una sola vez** y ya no lo tocaremos más: todo el juego vivirá en `juego.js`.

{{CAMBIOS:1}}

### Resultado del paso 1

Guarda los dos archivos y abre `index.html` en el navegador. Deberías ver esto:

{{CAPTURA:p01|Resultado del paso 1: el lienzo pintado de celeste con el saludo en el centro.}}

### Pruébalo tú

- Cambia `"#8fd3ff"` por `"orange"` o `"#ff69b4"` y recarga. ¡El fondo cambia de color!
- Cambia `ANCHO / 2, ALTO / 2` por `200, 100`. ¿Dónde aparece ahora el texto? (Recuerda el diagrama de coordenadas.)
- Si ves la página pero **no** el lienzo celeste, abre la consola (F12) y lee el error. Lo más típico es haber escrito mal `lienzo` en alguno de los dos archivos.

# 5. Paso 2 · El escenario y el bucle del juego

**Objetivo:** dibujar un cielo con degradado, un sol, nubes que se mueven y césped; y crear el **bucle del juego** que redibuja todo unas 60 veces por segundo.

**Qué aprenderás:** funciones, degradados (`createLinearGradient`), círculos (`arc`), el operador resto `%` para animaciones que se repiten, y `requestAnimationFrame`.

Primero **borramos** el saludo del paso 1 (ya cumplió su misión) y después añadimos el escenario y el bucle.

{{CAMBIOS:2}}

### Resultado del paso 2

{{CAPTURA:p02|Resultado del paso 2: cielo con degradado, sol, dos nubes y césped.}}

Las nubes se mueven despacio hacia la derecha. Esta segunda captura está tomada unos segundos más tarde:

{{CAPTURA:p02_nubes|Unos segundos después: las nubes han avanzado. Cuando salen por la derecha, vuelven a entrar por la izquierda.}}

### Pruébalo tú

- Cambia `tiempoTotal * 20` por `tiempoTotal * 200`: ¡nubes a toda velocidad!
- Cambia los colores del degradado para hacer un **atardecer** (`"#ff7e5f"` arriba y `"#feb47b"` abajo).
- Añade una tercera nube copiando una de las líneas `dibujarNube(...)` y cambiando sus números.

# 6. Paso 3 · El contenedor (el jugador)

**Objetivo:** guardar los datos de los cuatro tipos de contenedor y dibujar al protagonista: un contenedor con ruedas y el símbolo de reciclaje.

**Qué aprenderás:** objetos y arrays, `moveTo`/`lineTo` para hacer figuras con lados, bucles `for`, y a crear tu propia función reutilizable (`escribir`).

{{CAMBIOS:3}}

### Resultado del paso 3

{{CAPTURA:p03|Resultado del paso 3: el contenedor amarillo aparece en el centro, sobre el césped.}}

### Pruébalo tú

- Cambia `tipo: "amarillo"` por `tipo: "verde"` en el objeto `contenedor`. Recarga.
- Cambia `ancho: 110` por `ancho: 200`. El dibujo se adapta solo porque todo se calcula a partir de `c.ancho`.
- **Adáptalo a tu país:** si en tu ciudad el papel va en un contenedor gris, cambia el color del apartado `azul` en `TIPOS`.

# 7. Paso 4 · Mover el contenedor con el teclado

**Objetivo:** que el contenedor se mueva a izquierda y derecha con las flechas (o A y D) sin salirse de la pantalla.

**Qué aprenderás:** eventos de teclado (`keydown` y `keyup`), por qué guardamos las teclas en un objeto, y a mover cosas con **velocidad × dt**.

{{CAMBIOS:4}}

### Resultado del paso 4

{{CAPTURA:p04_izq|Tras mantener pulsada la flecha izquierda medio segundo, el contenedor se ha desplazado.}}

{{CAPTURA:p04_borde|Si mantienes la flecha derecha, el contenedor se detiene en el borde: no se sale del lienzo.}}

### Pruébalo tú

- Cambia `velocidad: 520` por `velocidad: 150` (¡qué lento!) o `1500` (¡qué rápido!).
- Comenta (pon `//` delante) las dos líneas de los límites y comprueba que el contenedor se escapa de la pantalla.

# 8. Paso 5 · Cambiar el tipo de contenedor

**Objetivo:** que las teclas 1, 2, 3 y 4 transformen el contenedor, con un pequeño salto, y mostrar una barra de botones con el tipo activo.

**Qué aprenderás:** `indexOf`, el operador `? :`, transparencia (`globalAlpha`), rectángulos redondeados y `save`/`translate`/`restore` para mover un dibujo entero.

{{CAMBIOS:5}}

### Resultado del paso 5

{{CAPTURA:p05_azul|Tras pulsar 2: contenedor azul de papel y cartón. Abajo, su botón se ve brillante y con borde blanco.}}

{{CAPTURA:p05_salto|Justo al cambiar (aquí al verde, tecla 3) el contenedor da un saltito para que el cambio se note.}}

{{CAPTURA:p05_marron|Contenedor marrón (tecla 4), después de moverlo un poco a la izquierda.}}

### Pruébalo tú

- Cambia el `10` de `* 10` en la línea del `translate` por `40`: ¡salto de canguro!
- Cambia `0.55` por `0.2` en `globalAlpha` para que los botones inactivos se vean más apagados.

# 9. Paso 6 · Los residuos empiezan a caer

**Objetivo:** crear el catálogo de residuos y hacer que caigan desde arriba, en posiciones al azar, cada cierto tiempo.

**Qué aprenderás:** números aleatorios (`Math.random`), añadir y quitar elementos de una lista (`push` y `splice`), recorrer una lista al revés, y un **temporizador** con cuenta atrás.

Por ahora los dibujaremos como **cuadrados grises provisionales**. En programación es muy habitual hacer primero que algo *funcione* y después que *se vea bonito*.

{{CAMBIOS:6}}

### Resultado del paso 6

{{CAPTURA:p06|Resultado del paso 6: los residuos (aún cuadrados grises) caen girando, cada uno con su nombre debajo.}}

### Pruébalo tú

- Cambia `intervaloAparicion = 1.4` por `0.3`: ¡lluvia de basura!
- Cambia `velocidadCaida = 120` por `40` para verlos caer a cámara lenta.

# 10. Paso 7 · Los dibujos de cada residuo

**Objetivo:** sustituir los cuadrados grises por dibujos reconocibles de cada residuo.

**Qué aprenderás:** a guardar **funciones dentro de un objeto** y llamarlas por su nombre, y a "pintar" objetos combinando figuras sencillas (como con piezas de construcción).

{{CAMBIOS:7}}

### Resultado del paso 7

Para ver todos los dibujos juntos, hemos colocado (solo para esta captura) los nueve residuos del catálogo quietos en la pantalla:

{{CAPTURA:p07_catalogo|Los nueve residuos dibujados solo con rectángulos, círculos, líneas y una elipse.}}

{{CAPTURA:p07|Así se ve el juego normal en el paso 7: los residuos ya son reconocibles.}}

### Pruébalo tú

- **Añade un residuo nuevo.** Por ejemplo, un *yogur* (va al amarillo): añade una línea en `RESIDUOS` con `dibujo: "yogur"` y una función `yogur: function () { ... }` en `DIBUJOS` (puedes copiar la de la lata y cambiarle colores y medidas).

# 11. Paso 8 · Atrapar los residuos y puntuar

**Objetivo:** detectar cuándo un residuo entra por la boca del contenedor y decidir si es un acierto (puntos) o un error (pierdes una vida).

**Qué aprenderás:** **detección de colisiones** con rectángulos, `Math.abs`, condiciones compuestas con `&&` y la sentencia `continue`.

{{DIAGRAMA:colision_ecocaza|Las dos condiciones que usa tocaContenedor() para saber si un residuo ha entrado.}}

{{CAMBIOS:8}}

### Resultado del paso 8

{{CAPTURA:p08_antes|Una botella de plástico cae justo encima del contenedor amarillo…}}

{{CAPTURA:p08_acierto|…¡acierto! Desaparece y el marcador provisional suma 10 puntos.}}

{{CAPTURA:p08_error|Si cae un periódico en el contenedor amarillo, es un error: las vidas bajan de 3 a 2.}}

### Pruébalo tú

- Cambia `Math.min(combo, 5)` por `Math.min(combo, 10)` para permitir combos de hasta ×10.
- Cambia `contenedor.ancho / 2` por `contenedor.ancho` en `tocaContenedor`: el contenedor "atrapará" desde más lejos (más fácil).

# 12. Paso 9 · Marcador, textos flotantes y consejos

**Objetivo:** cambiar el marcador provisional por uno con corazones, mostrar mensajes flotantes ("+20", "¡Contenedor equivocado!") y el **cartel de consejo** al fallar, que es la parte educativa del juego.

**Qué aprenderás:** listas de objetos que "viven" un tiempo, `filter` para limpiar listas, opacidad para desvanecer, y **curvas de Bézier** para dibujar un corazón.

{{CAMBIOS:9}}

### Resultado del paso 9

{{CAPTURA:p09_combo|Tercer acierto seguido: "+30" flotando y "¡Combo x3!" en el centro.}}

{{CAPTURA:p09_consejo|El error más típico: un brik en el contenedor azul. Se pierde una vida (un corazón vacío) y aparece el consejo que explica que el brik va al AMARILLO.}}

### Pruébalo tú

- Cambia `consejo.tiempo = 3.5` por `6` para que el consejo dure más.
- Cambia el color `"#e84393"` de los corazones por `"#e74c3c"` (rojo clásico).

# 13. Paso 10 · La contaminación del planeta

**Objetivo:** que dejar caer residuos tenga consecuencias: sube la contaminación, el cielo y el sol se vuelven grises y la basura se queda tirada en el césped.

**Qué aprenderás:** a **mezclar colores** con matemáticas (interpolación), `slice` y `parseInt` en base 16, `shift`, y a dibujar con `scale`.

{{CAMBIOS:10}}

### Resultado del paso 10

{{CAPTURA:p10_cae|Una caja de cartón está a punto de caer al suelo lejos del contenedor…}}

{{CAPTURA:p10_medio|Con un 50 % de contaminación el cielo se ve apagado y hay basura en el césped.}}

{{CAPTURA:p10_alto|Con un 90 % el cielo es casi marrón y la barra está casi llena: ¡a punto de perder!}}

### Pruébalo tú

- Cambia `contaminacion + 10` por `contaminacion + 25` para que cada residuo perdido sea más grave.
- Cambia `"#6b6257"` por `"#4b0082"` para que la contaminación tiña el cielo de morado.

# 14. Paso 11 · Partículas y sonido

**Objetivo:** dar "jugo" al juego: una explosión de partículas de colores al acertar y sonidos para cada acción, generados por el propio navegador.

**Qué aprenderás:** sistemas de partículas sencillos (velocidad, gravedad y vida), y la **Web Audio API**: osciladores, volumen y envolventes.

{{CAMBIOS:11}}

### Resultado del paso 11

{{CAPTURA:p11_particulas|Al acertar, saltan partículas del color del contenedor (y suena una melodía de dos notas).}}

{{CAPTURA:p11_error|Al fallar, partículas grises de "humo", sonido grave y el consejo: la cáscara de plátano va al marrón.}}

> 🔊 Los sonidos no se pueden ver en una captura: ¡pruébalo con los altavoces encendidos! Los navegadores no dejan sonar nada hasta que el usuario pulsa una tecla o hace clic, por eso el primer sonido llega cuando cambias de contenedor.

### Pruébalo tú

- Cambia `"square"` por `"sine"` en `sonidoAcierto` y escucha la diferencia.
- Cambia `400 * dt` (la gravedad de las partículas) por `-200 * dt`: ¡las partículas flotan hacia arriba!

# 15. Paso 12 · Menú, niveles, final y récord

**Objetivo:** convertir la demo en un juego completo: pantalla de inicio, subida de nivel cada 150 puntos, pantalla final con estadísticas y récord guardado aunque cierres el navegador.

**Qué aprenderás:** **máquina de estados** (`"menu"`, `"jugando"`, `"fin"`), reiniciar variables, `localStorage` y `try/catch`.

{{CAMBIOS:12}}

### Resultado del paso 12

{{CAPTURA:p12_menu|Al abrir el juego aparece el menú con la leyenda de los contenedores.}}

{{CAPTURA:p12_jugando|Tras pulsar ESPACIO empieza la partida (aquí, unos segundos después).}}

{{CAPTURA:p12_nivel|Al llegar a 150 puntos: "¡Nivel 2!". A partir de ahora caen más rápido.}}

{{CAPTURA:p12_fin|Pantalla final al quedarse sin vidas, con estadísticas, precisión, récord y un dato curioso.}}

{{CAPTURA:p12_fin_contaminado|Pantalla final cuando la contaminación llega al 100 %.}}

### Pruébalo tú

- Cambia `puntos / 150` por `puntos / 50` para subir de nivel mucho antes.
- Añade tu propio dato curioso a la lista `DATOS_CURIOSOS`.

# 16. Paso 13 · Ratón y pantalla táctil

**Objetivo:** poder jugar con el ratón y en el móvil: el contenedor sigue al puntero y los botones de abajo cambian el tipo de contenedor.

**Qué aprenderás:** **pointer events** (sirven a la vez para ratón, dedo y lápiz), `getBoundingClientRect` y a convertir coordenadas de pantalla a coordenadas del juego.

{{CAMBIOS:13}}

### Resultado del paso 13

{{CAPTURA:p13_raton|Al mover el ratón hacia la izquierda del lienzo, el contenedor lo sigue.}}

{{CAPTURA:p13_boton|Al hacer clic (o tocar con el dedo) en el botón "3 · Vidrio", el contenedor se vuelve verde.}}

¡Enhorabuena! **El juego está terminado.** Así se ve una partida avanzada:

{{CAPTURA:final_juego2|EcoCaza terminado: nivel avanzado con combo, partículas y algo de contaminación.}}

# 17. Errores comunes y cómo solucionarlos

Equivocarse es **normal**: los programadores profesionales se equivocan todo el día. Lo importante es saber encontrar el error. Estos son los más típicos, con capturas reales de lo que pasa.

## 17.1 La pantalla se queda en blanco: una palabra mal escrita

Si escribes `cxt` en vez de `ctx`, JavaScript no sabe qué es `cxt` y **se detiene**. El lienzo se queda vacío:

{{CAPTURA:error_typo|Con un solo error de escritura (cxt en lugar de ctx) no se dibuja nada.}}

La consola (F12) te dice exactamente qué pasa: *"cxt is not defined"* = "cxt no está definido". A la derecha aparece el archivo; al hacer clic te lleva a la línea del error.

{{CONSOLA:error_typo|Mensaje real del navegador en la consola: ReferenceError: cxt is not defined.}}

**Solución:** busca esa palabra en tu código (`Ctrl + F`) y corrígela. JavaScript distingue mayúsculas y minúsculas: `Ctx` y `ctx` son cosas distintas.

## 17.2 El id del lienzo no coincide

Si en `juego.js` escribes `getElementById("lienso")` pero en el HTML pusiste `id="lienzo"`, el código no encuentra el lienzo:

{{CONSOLA:error_id|Error real: "Cannot read properties of null (reading 'getContext')". Significa que lienzo es null (vacío) porque no encontró ningún elemento con ese id.}}

**Solución:** el id del HTML y el texto de `getElementById` deben ser **idénticos**.

## 17.3 Todo deja un rastro: se te olvidó dibujar el fondo

Si borras (o comentas) la llamada `dibujarFondo();`, nadie "limpia" el lienzo entre fotogramas y cada dibujo se queda pintado encima del anterior:

{{CAPTURA:error_sin_fondo|Sin dibujarFondo() el contenedor y los residuos dejan una estela: cada fotograma se pinta sobre el anterior.}}

**Solución:** lo primero que hace `dibujar()` siempre debe ser pintar el fondo completo.

## 17.4 Colores que "se contagian": olvidar beginPath()

Si quitas `ctx.beginPath();` de `dibujarNube`, el círculo de la nube se añade al trazo del sol, y al rellenarlo de blanco… ¡el sol también se vuelve blanco!

{{CAPTURA:error_beginpath|Sin beginPath() el sol se pinta de blanco junto con las nubes (compárese con el sol amarillo del paso 2).}}

**Solución:** pon `ctx.beginPath();` antes de cada figura nueva.

## 17.5 Otros fallos frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| Error *"Unexpected token"* o *"missing ) after argument list"* | Falta o sobra un paréntesis `)`, llave `}` o coma | Revisa la línea que dice la consola y la anterior. VS Code colorea las parejas de llaves |
| Error *"... is not a function"* | Nombre de función mal escrito o la función no existe todavía | Comprueba mayúsculas y que hayas escrito ese paso completo |
| El contenedor no se mueve | Hiciste clic fuera de la página y el teclado no le llega | Haz clic una vez sobre el juego |
| No se oye nada | El navegador bloquea el sonido hasta el primer clic/tecla, o el volumen del sistema está a 0 | Pulsa una tecla; revisa el volumen |
| Los cambios no aparecen | No guardaste el archivo o no recargaste | `Ctrl + S` en el editor y `F5` en el navegador |
| Se ven símbolos raros en vez de tildes | El archivo no está en UTF-8 | En VS Code, abajo a la derecha, haz clic en la codificación y elige *Guardar con codificación → UTF-8* |

# 18. Cómo compartir tu juego con el mundo

Como el juego es solo una página web, puedes publicarlo **gratis** de varias formas:

**Opción A · GitHub Pages** (lo que usan los programadores):

1. Crea una cuenta en <https://github.com> y un repositorio nuevo **público** (por ejemplo `ecocaza`).
2. Pulsa **Add file → Upload files** y arrastra `index.html` y `juego.js`. Pulsa **Commit changes**.
3. Ve a **Settings → Pages**. En *Branch* elige **main** y la carpeta **/(root)**. Pulsa **Save**.
4. En uno o dos minutos tu juego estará en `https://TU-USUARIO.github.io/ecocaza/`. ¡Envía ese enlace a quien quieras!

**Opción B · itch.io** (la web de juegos independientes): crea un proyecto de tipo *HTML*, comprime la carpeta en un `.zip` y súbela marcando *"This file will be played in the browser"*.

# 19. Ideas para mejorar el juego

- **Más residuos:** pilas (punto limpio), ropa (contenedor de textil), aceite usado… cada uno con su consejo.
- **Contenedor gris (resto):** añade un quinto tipo a `TIPOS` y `ORDEN_TIPOS` y la tecla 5.
- **Modo "aprende":** sin vidas, más lento, mostrando el consejo también en los aciertos.
- **Versión para tu ciudad:** cambia colores y normas según tu ayuntamiento.
- **Objetos especiales:** una "hoja verde" que limpie toda la contaminación, o una "lupa" que ralentice el tiempo.
- **Tabla de récords** con nombres de jugadores.

# Anexo A · Mapa del código

{{DIAGRAMA:arquitectura_ecocaza|Todas las funciones del juego organizadas: qué se ejecuta al actualizar, al dibujar y al pulsar teclas.}}

# Anexo B · Código completo final

Aquí tienes los dos archivos completos, tal como quedan al final del paso 13. También están en la carpeta del proyecto (`index.html` y `juego.js`).

{{CODIGO_COMPLETO}}

# Anexo C · Fuentes y referencias

- MDN Web Docs (Mozilla). *Canvas API*, *CanvasRenderingContext2D*, *requestAnimationFrame*, *Web Audio API*, *Pointer events*, *localStorage*. <https://developer.mozilla.org/es/>
- Ecoembes. Información sobre la separación de envases (contenedor amarillo) y papel/cartón (contenedor azul). <https://www.ecoembes.com>
- Ecovidrio. Información sobre el reciclaje de vidrio (contenedor verde). <https://www.ecovidrio.es>
- Visual Studio Code. <https://code.visualstudio.com>
- Playwright (herramienta usada para tomar automáticamente las capturas de cada paso). <https://playwright.dev>

# Anexo D · Glosario

| Palabra | Significado |
|---|---|
| **Array (lista)** | Conjunto ordenado de datos: `[1, 2, 3]`. |
| **Bucle del juego** | Función que se repite cada fotograma: actualizar y dibujar. |
| **Canvas (lienzo)** | Elemento HTML donde se puede dibujar con JavaScript. |
| **Colisión** | Cuando dos objetos del juego se tocan. |
| **Consola** | Panel del navegador (F12) donde aparecen los errores. |
| **CSS** | Lenguaje para dar estilo (colores, tamaños, posición) a una página. |
| **dt (delta time)** | Segundos transcurridos desde el fotograma anterior. |
| **Evento** | Algo que ocurre (pulsar una tecla, hacer clic) y a lo que el código puede reaccionar. |
| **Fotograma (frame)** | Cada una de las imágenes que forman la animación. |
| **Función** | Bloque de código con nombre que se puede ejecutar muchas veces. |
| **HTML** | Lenguaje que describe el contenido de una página web. |
| **HUD** | Información en pantalla: puntos, vidas, barras. |
| **JavaScript** | Lenguaje de programación que entienden los navegadores. |
| **Objeto** | Conjunto de datos con nombre: `{ x: 10, y: 20 }`. |
| **Partícula** | Pequeño elemento visual de vida corta para efectos. |
| **Radián** | Unidad de ángulos: una vuelta = 2π ≈ 6.28 radianes. |
| **Variable** | Caja con nombre que guarda un valor. |
