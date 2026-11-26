<!-- solo-github -->
# Informe de creación del videojuego «¡Compila!»

**Un roguelike de cartas donde tu mano es un programa: aprende a pensar como programador jugando. Explicado paso a paso y línea por línea.**

> 📄 Este mismo informe está también en **PDF** (`Informe_Compila.pdf`) y en **Word** (`Informe_Compila.docx`) dentro de esta carpeta.
> 🎮 El juego terminado está en la carpeta de arriba: abre `../index.html` en tu navegador para jugar.
<!-- /solo-github -->

# 1. Presentación del proyecto

## 1.1 ¿Qué es ¡Compila!?

**¡Compila!** es un videojuego 2D de cartas para el navegador (ordenador o móvil) del género **roguelike de cartas**, el género que más ha crecido en los últimos años. Su idea es nueva: **cada carta es una instrucción de programación** (`x += 7`, `x *= 3`, `x = x * x`, un bucle `repetir 2 veces`, un condicional `if (x % 2 == 0) x *= 3`) y **tu mano es un programa**. Eliges hasta 5 cartas; **el orden en que las eliges es el orden en que se ejecutan**. Al pulsar *Ejecutar*, el programa corre **línea a línea** en un editor de código, mientras ves cómo cambia el valor de `x` y el número crece y crece.

Con el resultado de tus programas debes superar los exámenes de cada **ciclo** de la carrera (*Práctica calificada 1*, *Práctica calificada 2* y un *Examen parcial* con reglas especiales), comprar **librerías** que rompen las reglas (☕ Café, 🤝 Pair programming, 🔁 Recursión, 🤖 Copiloto IA…) y **graduarte en 10 ciclos**.

{{CAPTURA:final_juego|¡Compila! en plena partida (ciclo 4, con Pair programming, Café y Optimizador): un programa de 5 cartas con un bucle antes del cuadrado se ejecuta línea a línea y x se dispara.}}

## 1.2 La problemática que resuelve

Este proyecto se pensó para estudiantes de **Ingeniería de Sistemas e Informática** y, en concreto, para el contexto de una universidad como la **Universidad Continental**. Uno de los problemas más conocidos en estas carreras es que **los primeros cursos de programación se hacen muy cuesta arriba**: muchos estudiantes no tienen todavía el "modelo mental" de cómo se ejecuta un programa. Las dificultades típicas son:

- **El flujo de ejecución:** entender que las instrucciones se ejecutan **una detrás de otra, en orden**, y que cambiar el orden cambia el resultado.
- **El estado de las variables:** saber cuánto vale una variable en cada línea (lo que en clase se llama **prueba de escritorio**).
- **Bucles y condicionales:** imaginar qué pasa cuando algo se repite o cuando el programa "decide".
- **Crecimiento de los números:** intuir por qué algo que se eleva al cuadrado se dispara (la base de la **complejidad algorítmica**, el famoso O(n²)), o qué es un **desbordamiento** (*overflow*).

Los ejercicios de papel son necesarios, pero se sienten como tarea. **¡Compila! convierte la prueba de escritorio en un juego adictivo:** cada jugada obliga a predecir el valor de `x` según el orden de las instrucciones, y el editor muestra la ejecución real línea a línea con comentarios (`// x = 21`), exactamente como lo haría un depurador. El jugador practica decenas de "pruebas de escritorio" por partida **sin darse cuenta**, porque quiere batir su récord.

{{DIAGRAMA:orden_importa|La idea central del juego: las mismas tres cartas dan 49 o 441 según su orden.}}

**¿Cómo podría usarse en la universidad?**

- Como **práctica libre** para los cursos introductorios de programación (funciona en el móvil, sin instalar nada).
- Como **actividad de inicio de clase**: "¿Quién consigue el programa más grande con esta mano?".
- Como **competencia entre secciones o en la semana de la carrera**, con el récord como marcador.
- Como **proyecto de ejemplo** para enseñar estructuras de datos (mazo como *pila*, mano como *lista*), algoritmos (barajado de Fisher-Yates) y máquinas de estados.

> ℹ️ Es un proyecto académico independiente: no es un producto oficial de ninguna universidad, ni usa sus logotipos o marcas.

## 1.3 Cómo se juega

| Acción | Ratón / dedo | Teclado |
|---|---|---|
| Elegir / soltar una carta (el orden de elección = orden de ejecución) | Clic en la carta | 1 a 8 |
| Ejecutar el programa | Botón **▶ Ejecutar** | ENTER |
| Descartar las cartas elegidas y robar otras | Botón **Descartar** | D |
| Comprar una librería | Clic en ella en la tienda | — |
| Empezar / volver a jugar | Clic | ESPACIO |

**Reglas:**

- Cada programa empieza con `let x = 0;`. El **resultado** del programa (el valor final de `x`) se suma a tu **puntaje**.
- Cada examen tiene un **objetivo**. Tienes **4 ejecuciones** y **3 descartes** para alcanzarlo. Si no llegas: **desaprobado** y vuelves a empezar la carrera.
- Los objetivos crecen un 70 % cada ciclo (crecimiento exponencial): necesitarás programas cada vez mejores… y librerías.
- El tercer examen de cada ciclo es un **jefe** con una regla especial (por ejemplo, *"Las cartas x² no hacen nada"*).
- Al aprobar ganas **créditos** (más si te sobran ejecuciones) para la **tienda**.
- Si un número supera el máximo entero seguro de JavaScript (9 007 199 254 740 991) se produce un **overflow** y se queda en el tope.

| Carta | Código | Qué hace |
|---|---|---|
| Suma | `x += n;` | Suma n (de 1 a 10) |
| Multiplica | `x *= n;` | Multiplica por 2 o por 3 |
| Cuadrado | `x = x * x;` | Eleva al cuadrado: la más poderosa |
| Bucle | `repetir 2 veces:` | La siguiente carta se ejecuta 2 veces (dos bucles seguidos: ¡4 veces!) |
| Condición | `if (x % 2 == 0) x *= 3;` | Si x es par, lo multiplica por 3; si es impar, no hace nada |

{{CAPTURA:final_menu|Pantalla de inicio con un programa de ejemplo: +7, bucle, ×3 y cuadrado dan 3969.}}

## 1.4 ¿Por qué es divertido, adictivo y novedoso?

Los **roguelikes de cartas** (partidas cortas, mazo al azar, mejoras que se combinan y números que crecen de forma exagerada) son uno de los fenómenos más fuertes de los videojuegos recientes, con juegos independientes que han vendido millones de copias. ¡Compila! toma **las mecánicas que hacen que ese género enganche**…

{{DIAGRAMA:ciclo_juego|El bucle de "una partida más" y los ingredientes que lo hacen adictivo.}}

…y les da una vuelta que no es habitual: **las cartas no son naipes ni ataques, son código**, y la puntuación sale de **ejecutar un programa de verdad** que se ve en un editor. Lo novedoso es:

- **El orden de selección es el orden de ejecución.** No basta con tener buenas cartas: hay que **pensar como un programador**.
- **Bucles y condicionales como cartas** que modifican a otras: combos como `+9 → ×3 → repetir → x²` (¡531 441!) se descubren jugando.
- **Un intérprete visible:** el programa se ejecuta línea a línea con comentarios, y la música sube de tono con cada paso.
- **Humor universitario:** prácticas calificadas, parciales, el *Profesor estricto*, el *Examen sorpresa*, librerías como el *Copiloto IA* o el *Café*… y la graduación.
- **Rejugable sin fin:** al graduarte puedes seguir en "maestría" con exámenes cada vez más grandes.

Probamos el equilibrio del juego con un programa que juega solo eligiendo siempre la mejor combinación posible: incluso jugando "perfecto" se gradúa aproximadamente en 1 de cada 3 carreras, normalmente cae en los jefes. Es decir: **fácil de aprender, difícil de dominar**, la fórmula de los juegos que enganchan.

## 1.5 Qué vas a aprender construyéndolo

Además de HTML, CSS y Canvas: **estructuras de datos** (listas como mazo y mano, objetos, funciones guardadas en objetos), el **algoritmo de barajado de Fisher-Yates**, cómo funciona un **intérprete**, **máquinas de estados**, interfaces con **botones y detección de clics**, ajuste del texto en líneas con `measureText`, **desbordamiento numérico**, efectos visuales y sonoros, y guardado del **récord**.

# 2. Antes de empezar

## 2.1 Lo que necesitas

| Qué | Para qué | Dónde conseguirlo | Precio |
|---|---|---|---|
| Un ordenador (Windows, Mac o Linux) | Escribir el código | — | — |
| Un navegador moderno: **Chrome**, **Edge** o **Firefox** | Ejecutar el juego | Ya lo tienes | Gratis |
| **Visual Studio Code** | Escribir los archivos | <https://code.visualstudio.com> | Gratis |

> 💡 Sin motores, sin librerías, sin instalar nada más: dos archivos de texto.

## 2.2 Instalar Visual Studio Code (5 minutos)

1. Entra en **<https://code.visualstudio.com>** y pulsa el botón de descarga.
2. Instálalo con las opciones por defecto (en Windows, marca **"Agregar acción 'Abrir con Code'"**).
3. Para ponerlo en español: `Ctrl + Shift + P` → **Configure Display Language** → **Español** → reinicia.

## 2.3 De dónde sale cada parte del juego

**No se ha descargado ni copiado ningún recurso:** todo se genera con el código de este informe.

| Parte | Cómo se hizo | De dónde sale / documentación |
|---|---|---|
| Página y lienzo | HTML5 `<canvas>` | [MDN – Canvas API](https://developer.mozilla.org/es/docs/Web/API/Canvas_API) |
| Lógica | JavaScript sin librerías | [MDN – JavaScript](https://developer.mozilla.org/es/docs/Web/JavaScript) |
| Cartas, editor, botones, tienda | Dibujados con rectángulos redondeados (`roundRect`), texto y círculos | Diseño propio |
| Iconos de las librerías y el birrete | Emojis estándar Unicode (los dibuja la fuente del sistema) | [Unicode Emoji](https://unicode.org/emoji/) |
| Paleta de colores | Elegida a mano (tonos "modo oscuro" de editor de código) | Inspirada en los temas oscuros de los editores |
| Barajado | Algoritmo de Fisher-Yates (Durstenfeld) | Algoritmo clásico de dominio público |
| Intérprete de cartas | Diseño propio para este juego | — |
| Límite de enteros | `Number.MAX_SAFE_INTEGER` | [MDN – MAX_SAFE_INTEGER](https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER) |
| Sonidos | Sintetizados con la **Web Audio API** | [MDN – Web Audio API](https://developer.mozilla.org/es/docs/Web/API/Web_Audio_API) |
| Mecánicas del género (mano, descartes, jefes, tienda, comodines) | Ideas comunes del género roguelike de cartas (las mecánicas no tienen dueño; el código, las reglas concretas y el arte son propios) | — |
| Récord | `localStorage` | [MDN – localStorage](https://developer.mozilla.org/es/docs/Web/API/Window/localStorage) |
| Capturas de este informe | Tomadas automáticamente ejecutando cada paso del juego en Chromium | [Playwright](https://playwright.dev) |

## 2.4 Conceptos de programación que usaremos

Si ya has llevado un curso de programación, te sonarán. Si no, este resumen basta para seguir el informe.

**Variables, textos, números y booleanos:**

```javascript
let puntaje = 0;            // número que cambiará
const ANCHO = 800;          // valor fijo
let nombre = "Práctica 1";  // texto
let elegida = true;         // booleano (true / false)
```

**Objetos (cajas con apartados) y listas (arrays):**

```javascript
const carta = { tipo: "suma", n: 7 };    // un objeto
let mano = [carta, { tipo: "mult", n: 3 }]; // una lista de objetos
mano.push({ tipo: "cuadrado", n: 0 });   // añadir al final
mano.pop();                              // sacar el último
mano.splice(0, 1);                       // borrar 1 elemento en la posición 0
mano.indexOf(carta);                     // posición (o -1 si no está)
```

**Funciones, también guardadas dentro de objetos:**

```javascript
function duplicar(n) { return n * 2; }
const boton = { texto: "Ejecutar", accion: duplicar };
boton.accion(5);   // → 10
```

**Métodos de listas que usaremos mucho:**

```javascript
[1, 2, 3].map(function (n) { return n * 10; });   // → [10, 20, 30]
[1, 2, 3].filter(function (n) { return n > 1; }); // → [2, 3]
[1, 2, 3].some(function (n) { return n > 2; });   // → true
[3, 1, 2].sort(function (a, b) { return b - a; }); // → [3, 2, 1]
```

| Símbolo | Significa | Ejemplo |
|---|---|---|
| `===` / `!==` | ¿igual? / ¿distinto? | `fase === "tienda"` |
| `&&` / <code>&#124;&#124;</code> / `!` | y / o / no | `a && !b` |
| `%` | resto de la división | `7 % 2` → 1 (impar) |
| `cond ? a : b` | si cond, a; si no, b | `elegida ? "blanco" : "gris"` |
| `+=`, `-=`, `*=` | operar sobre lo que había | `x *= 3` |

## 2.5 Las coordenadas del lienzo

{{DIAGRAMA:coordenadas|El lienzo de 800 × 600: (0, 0) arriba a la izquierda y la y crece hacia abajo.}}

## 2.6 El bucle del juego

{{DIAGRAMA:bucle|El bucle del juego: medir el tiempo, actualizar y dibujar unas 60 veces por segundo.}}

## 2.7 La máquina de estados

El juego pasa por varias **fases**: menú, elegir cartas, ejecutando, tienda, fin y graduación. Guardar la fase en una variable y comprobarla en cada función es una técnica básica en el desarrollo de software (no solo de juegos).

{{DIAGRAMA:estados|Las fases del juego y qué hace pasar de una a otra.}}

## 2.8 Hoja de ruta: los 13 pasos

{{DIAGRAMA:hoja_de_ruta_compila|Cómo se ve el juego al terminar cada uno de los 13 pasos.}}

## 2.9 Cómo leer los pasos de este informe

1. **Objetivo** del paso.
2. **Cambios en el código:** dónde escribir, imagen del editor con las líneas nuevas en **verde** (las que se borran en **rojo tachado**), **explicación de cada línea** y **código para copiar**.
3. **Resultado:** capturas reales del juego en ese paso.
4. **Pruébalo tú:** experimentos.

> 🛟 **Red de seguridad:** la carpeta `pasos/` tiene el código completo al final de cada paso (`pasos/paso01` … `pasos/paso13`).

# 3. Paso 0 · Preparar la carpeta y los archivos

1. Crea la carpeta **`Juegos/Compila`** (en Documentos, por ejemplo).
2. En **Visual Studio Code**: **Archivo → Abrir carpeta…** → **Compila**.
3. Crea dos archivos: **`index.html`** y **`juego.js`** (en minúsculas, sin espacios).

{{DIAGRAMA:estructura_compila|Los dos archivos del proyecto y cómo se conectan.}}

{{DIAGRAMA:editor_compila|La carpeta abierta en Visual Studio Code (ilustración).}}

{{DIAGRAMA:abrir_navegador_compila|Abrir index.html con el navegador (ilustración).}}

{{DIAGRAMA:consola_abrir|Cómo abrir la consola de errores.}}

> 🔁 **Ciclo de trabajo:** escribir → guardar (`Ctrl + S`) → recargar el navegador (`F5`) → mirar.

# 4. Paso 1 · El lienzo y un saludo

**Objetivo:** crear la página web con un lienzo de 800 × 600 y comprobar que JavaScript dibuja en él.

{{CAMBIOS:1}}

### Resultado del paso 1

{{CAPTURA:p01|El lienzo azul noche con el saludo.}}

# 5. Paso 2 · El fondo y el bucle del juego

**Objetivo:** un fondo con degradado y una cuadrícula que se desplaza despacio (ambiente de "programar de madrugada"), y el bucle del juego.

**Qué aprenderás:** degradados, dibujar muchas líneas en un solo trazo, el operador `%` para animaciones que se repiten y `requestAnimationFrame`.

{{CAMBIOS:2}}

### Resultado del paso 2

{{CAPTURA:p02|El fondo: degradado de azul noche a morado con una cuadrícula que baja lentamente.}}

### Pruébalo tú

- Cambia `+= 40` por `+= 20` en los dos bucles: cuadrícula más fina.
- Cambia `tiempoTotal * 10` por `tiempoTotal * 100`: ¡efecto "viaje a toda velocidad"!

# 6. Paso 3 · Dibujar una carta

**Objetivo:** definir los cinco tipos de carta y una función que dibuje cualquier carta, con su color, su símbolo y su descripción.

**Qué aprenderás:** objetos de configuración, funciones que devuelven textos según el tipo, `roundRect` con esquinas diferentes y a dibujar en capas (sombra, cuerpo, franja, textos).

{{CAMBIOS:3}}

### Resultado del paso 3

{{CAPTURA:p03|Una carta de cada tipo. La del centro se dibuja "elegida": borde blanco y número de orden 1.}}

### Pruébalo tú

- Cambia el color de `cuadrado` en `TIPOS_CARTA` por `"#ffd166"`.
- Cambia `CARTA_ANCHO = 86` por `120`: todas las cartas se adaptan.

# 7. Paso 4 · El mazo, el barajado y la mano

**Objetivo:** crear un mazo de 30 cartas, barajarlo correctamente y robar 7 cartas que se dibujan centradas.

**Qué aprenderás:** construir listas con bucles, el **algoritmo de Fisher-Yates**, `push`/`pop` (el mazo funciona como una **pila**) y calcular posiciones centradas.

{{DIAGRAMA:fisher_yates|El algoritmo de Fisher-Yates paso a paso con 5 cartas.}}

{{CAMBIOS:4}}

### Resultado del paso 4

{{CAPTURA:p04|Una mano de 7 cartas robadas del mazo barajado. Cada vez que recargues la página, saldrá otra.}}

### Pruébalo tú

- Cambia `return 7;` por `return 5;` en `tamanoMano`.
- Añade más cuadrados al mazo: `agregarCartas("cuadrado", 0, 6);`. ¿Se vuelve el juego demasiado fácil?

# 8. Paso 5 · Elegir cartas (ratón, dedo y teclado)

**Objetivo:** elegir y soltar cartas con clic, toque o teclas 1-8. Las elegidas suben y muestran su **número de orden**; la que está bajo el ratón se levanta un poco.

**Qué aprenderás:** detectar si un punto está dentro de un rectángulo, *pointer events*, convertir coordenadas de pantalla a coordenadas del juego, y por qué guardar las **posiciones** de las cartas en el orden de selección.

{{CAMBIOS:5}}

### Resultado del paso 5

{{CAPTURA:p05_seleccion|Tres cartas elegidas (1: +7, 2: ×3, 3: x²) y el ratón sobre la quinta carta, que se levanta un poco.}}

# 9. Paso 6 · El editor de código

**Objetivo:** convertir las cartas elegidas en un **programa** que se ve en un panel con aspecto de editor de código, con números de línea y sangría dentro de los bucles.

{{CAMBIOS:6}}

### Resultado del paso 6

{{CAPTURA:p06_vacio|Sin cartas elegidas, el editor solo tiene la línea let x = 0; y una ayuda.}}

{{CAPTURA:p06_editor|Con +7, ×3, bucle y ×2 elegidos, el editor muestra el programa. La línea después del bucle aparece sangrada.}}

# 10. Paso 7 · El intérprete: ¡ejecutar el programa!

**Objetivo:** el corazón del juego. Al pulsar ENTER, un **intérprete** calcula el programa y una animación lo muestra **línea a línea**, con el valor de x en comentarios verdes y en grande.

**Qué aprenderás:** cómo funciona un intérprete, cómo se ejecuta un bucle por dentro, el **desbordamiento** (overflow), separar el **cálculo** de la **animación**, y borrar elementos de una lista sin estropear las posiciones.

{{DIAGRAMA:interprete|Del programa elegido a la animación: cómo trabajan interpretar() y actualizarEjecucion().}}

{{CAMBIOS:7}}

### Resultado del paso 7

{{CAPTURA:p07_mitad|A mitad de la ejecución: la línea actual está resaltada y los comentarios muestran x en cada línea.}}

{{CAPTURA:p07_final|Ejecución terminada: el bucle hizo que x *= 2 se ejecutara dos veces (vuelta 1 y vuelta 2). Resultado: x = 84.}}

Y aquí está la idea del juego en dos capturas: **las mismas dos cartas en distinto orden**:

{{CAPTURA:p07_orden_a|Primero +7 y luego ×3: x = 21.}}

{{CAPTURA:p07_orden_b|Primero ×3 y luego +7: x = 7. ¡Multiplicar 0 por 3 da 0!}}

### Pruébalo tú

- Cambia `0.5 - ejecucion.indice * 0.04` por `1.5`: ejecución a cámara lenta, ideal para explicar en clase.
- Elige dos bucles seguidos antes de una carta: ¿cuántas veces se ejecuta?

# 11. Paso 8 · Panel, botones y descartes

**Objetivo:** el panel de la izquierda (objetivo, puntaje con barra, ejecuciones y descartes), los botones **Ejecutar** y **Descartar**, y la acción de descartar.

**Qué aprenderás:** botones como **objetos con funciones dentro** (`accion` y `activo`), barras de progreso y límites de recursos.

{{CAMBIOS:8}}

### Resultado del paso 8

{{CAPTURA:p08_panel|Tras una ejecución: el puntaje sube a 84 y quedan 3 ejecuciones. Con cartas elegidas, los botones se activan.}}

# 12. Paso 9 · Exámenes y ciclos

**Objetivo:** convertir la partida en una **carrera**: tres exámenes por ciclo, objetivos que crecen un 70 % por ciclo, aprobar o desaprobar, y mensajes grandes en el centro.

**Qué aprenderás:** **crecimiento exponencial** con `Math.pow`, encadenar funciones (`comprobarExamen → aprobarExamen → iniciarExamen`) y mostrar avisos temporales.

{{CAMBIOS:9}}

### Resultado del paso 9

{{CAPTURA:p09_examen|Al empezar: "Práctica calificada 1 · Consigue 100 puntos". El panel muestra el ciclo y el examen.}}

{{CAPTURA:p09_aprobado|Al llegar al objetivo: ¡Aprobado! y pasamos a la Práctica calificada 2.}}

### Pruébalo tú

- Cambia `1.7` por `1.3` en `iniciarExamen` para una carrera más relajada, o por `2.5` para modo "pesadilla".

# 13. Paso 10 · Jefes: exámenes con reglas especiales

**Objetivo:** el tercer examen de cada ciclo es un jefe al azar que cambia una regla: anula los cuadrados, quita ejecuciones o descartes, o limita el programa a 4 cartas.

{{CAMBIOS:10}}

### Resultado del paso 10

{{CAPTURA:p10_jefe|El Parcial de Matemática Discreta: su regla aparece en rosa en el panel.}}

{{CAPTURA:p10_discreta|En ese parcial, la carta x = x * x no cambia el valor: x se queda en 7.}}

# 14. Paso 11 · La tienda y las librerías

**Objetivo:** al aprobar se ganan créditos; en la tienda se compran **librerías** que modifican el intérprete: sumas dobles, recursión, café, copiloto IA, más ejecuciones, más cartas…

**Qué aprenderás:** `filter`, `some` y `slice`, cortar texto en varias líneas con `measureText`, y cómo un mismo intérprete cambia su comportamiento según "configuraciones" activas (como los *plugins* de los programas reales).

{{CAMBIOS:11}}

### Resultado del paso 11

{{CAPTURA:p11_tienda|La tienda: tres librerías al azar. Las que se pueden pagar tienen borde dorado.}}

{{CAPTURA:p11_librerias|Con Café, Recursión y Copiloto IA, el programa +7, ×3 tiene tres líneas extra: 21 → 63 → 78 → 117.}}

### Pruébalo tú

- Inventa tu propia librería: añádela a `LIBRERIAS` y su efecto en `interpretar` o `aplicarCarta`. Por ejemplo, *"Stack Overflow: +100 si el programa tiene 5 cartas"*.

# 15. Paso 12 · Efectos: partículas, contador, temblor y sonido

**Objetivo:** el "jugo" que hace adictivo al juego: el número late con cada paso, la música sube de tono, el resultado explota en partículas, la pantalla tiembla y el puntaje del panel sube como un contador (en la captura se ve "+531,441" subiendo sobre el panel).

**Qué aprenderás:** usar el **logaritmo** para escalar efectos, la interpolación (`puntajeMostrado` se acerca poco a poco al puntaje real) y la Web Audio API.

{{CAMBIOS:12}}

### Resultado del paso 12

{{CAPTURA:p12_explosion|Combo +9, ×3, bucle, cuadrado: 9 → 27 → 729 → 531 441. Explosión de partículas y temblor.}}

{{CAPTURA:p12_contador|Un instante después: 531 441 supera de sobra el objetivo de 100, el examen queda aprobado y se abre la tienda con los créditos ganados.}}

> 🔊 Los sonidos no salen en las capturas: pruébalo con los altavoces encendidos. Cada paso de la ejecución suena un tono más agudo que el anterior.

# 16. Paso 13 · Menú, fin, graduación y récord

**Objetivo:** las pantallas de menú, fin (con un consejo de programación) y graduación, el récord guardado y el inicio de partida.

{{CAMBIOS:13}}

### Resultado del paso 13

{{CAPTURA:p13_menu|Menú de inicio.}}

{{CAPTURA:p13_inicio|Al matricularse empieza la Práctica calificada 1 del ciclo 1.}}

{{CAPTURA:p13_fin|Pantalla de fin: hasta dónde llegaste, el mejor programa, las librerías y un consejo de programador.}}

{{CAPTURA:p13_graduado|¡Graduación! Al aprobar el parcial del ciclo 10, con confeti.}}

¡El juego está terminado! Otra captura de una partida:

{{CAPTURA:final_juego2|Ciclo 2 con la librería Git: eligiendo un programa con condicional y cuadrado.}}

# 17. Errores comunes y cómo solucionarlos

## 17.1 Mayúsculas y minúsculas

JavaScript distingue mayúsculas: `tiempoTotal` y `tiempototal` son nombres distintos. Con esa sola letra mal escrita, el juego no dibuja nada:

{{CAPTURA:error_typo|El lienzo vacío por un error de escritura en dibujarFondo.}}

{{CONSOLA:error_typo|El mensaje real de la consola: "tiempototal is not defined".}}

## 17.2 Errores de lógica: el programa funciona… pero mal

Los errores más difíciles **no muestran ningún mensaje**. Si en `interpretar` olvidas la línea `veces = 1;`, el efecto del bucle no se acaba nunca y **todas** las cartas siguientes se repiten:

{{CAPTURA:error_bucle|Con el error: después del bucle, x *= 2 y también x += 7 se ejecutan dos veces (fíjate en las "vueltas"). Resultado incorrecto: 22.}}

{{CAPTURA:bien_bucle|El mismo programa con el código correcto: solo x *= 2 se repite y el resultado es 15.}}

**Cómo encontrar estos errores:** haz tú mismo la "prueba de escritorio" en papel y compara con lo que muestra el juego (o usa `console.log(x)` para ver valores en la consola). ¡Es exactamente lo que el juego te enseña a hacer!

## 17.3 Otros fallos frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| *"Unexpected token"* o *"missing )"* | Falta o sobra un paréntesis, llave o coma | Revisa la línea de la consola y la anterior |
| *"... is not a function"* | Nombre mal escrito o paso incompleto | Compara con `pasos/pasoNN` |
| Al hacer clic se eligen cartas equivocadas | El lienzo se ve escalado y no usas `posicionEnLienzo` | Revisa el paso 5 |
| Se borran cartas que no elegiste | Borrar de menor a mayor posición en `quitarSeleccionadas` | Ordenar de mayor a menor (paso 7) |
| Los emojis se ven como cuadrados | El sistema no tiene fuente de emojis | Es solo estético; el juego funciona igual |
| Tildes con símbolos raros | Archivo no guardado en UTF-8 | VS Code → *Guardar con codificación → UTF-8* |

# 18. Cómo compartirlo y llevarlo a la universidad

**Publicarlo gratis con GitHub Pages:** crea un repositorio público, sube `index.html` y `juego.js`, y en **Settings → Pages** elige la rama **main** y la carpeta **/(root)**. En unos minutos tendrás un enlace `https://TU-USUARIO.github.io/compila/` que funciona en cualquier móvil: perfecto para compartir en el grupo de clase.

**Ideas para usarlo con compañeros:**

- **Torneo de récords:** todos juegan durante una semana; gana el mejor programa (la pantalla final lo muestra).
- **Reto del día:** fija una semilla de mano (todos con las mismas cartas) y compara quién llega más alto.
- **Ejercicio de clase:** dada una captura del editor, predecir el resultado antes de ejecutar.

# 19. Ideas para mejorar el juego

- **Modo semilla diaria:** la misma secuencia de cartas para todo el mundo cada día (ideal para competir).
- **Nuevas cartas:** `x -= n`, `x = x % 10`, `while (x < 100) x *= 2`, funciones que guardan un valor…
- **Más jefes:** "Examen en papel" (no se ven los comentarios mientras se ejecuta), "Laboratorio" (solo sumas y bucles)…
- **Tabla de récords online** para toda la carrera.
- **Mostrar la predicción** como modo fácil para principiantes.

# Anexo A · Mapa del código

{{DIAGRAMA:arquitectura_compila|Todas las funciones del juego agrupadas por su tarea.}}

# Anexo B · Código completo final

Los dos archivos completos tal como quedan al final del paso 13.

{{CODIGO_COMPLETO}}

# Anexo C · Fuentes y referencias

- MDN Web Docs. *Canvas API*, *requestAnimationFrame*, *Pointer events*, *Web Audio API*, *localStorage*, *Number.MAX_SAFE_INTEGER*, *Array.prototype (map, filter, some, sort, splice)*. <https://developer.mozilla.org/es/>
- Durstenfeld, R. (1964). *Algorithm 235: Random permutation*. Communications of the ACM, 7(7), 420. (Versión para ordenadores del barajado de Fisher-Yates.)
- Knuth, D. E. *The Art of Computer Programming, Vol. 2: Seminumerical Algorithms* (barajado aleatorio).
- Visual Studio Code. <https://code.visualstudio.com>
- Playwright (capturas automáticas de este informe). <https://playwright.dev>

# Anexo D · Glosario

| Palabra | Significado |
|---|---|
| **Bucle** | Instrucción que repite otras. |
| **Condicional (if)** | Instrucción que solo se ejecuta si se cumple una condición. |
| **Desbordamiento (overflow)** | Cuando un número supera el máximo que el ordenador puede guardar con exactitud. |
| **Fisher-Yates** | Algoritmo para barajar una lista de forma justa. |
| **Intérprete** | Programa que lee y ejecuta instrucciones una a una. |
| **Máquina de estados** | Diseño en el que el programa está siempre en una "fase" y cambia de una a otra según eventos. |
| **Pila (stack)** | Estructura de datos donde se saca lo último que se metió (como el mazo con `pop`). |
| **Prueba de escritorio** | Seguir un programa a mano anotando el valor de las variables en cada línea. |
| **Roguelike** | Género de partidas cortas, generadas al azar, en las que al perder se empieza de nuevo. |
| **Sangría** | Espacios al principio de una línea para mostrar que está dentro de un bloque. |
