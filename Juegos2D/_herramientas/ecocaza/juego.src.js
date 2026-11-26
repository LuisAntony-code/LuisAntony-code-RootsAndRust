// ===================================================
//  EcoCaza - Separa la basura, salva el planeta
//  Juego 2D hecho con HTML5 Canvas y JavaScript puro
// ===================================================

//> **El lienzo y el pincel.** Lo primero es conseguir el lienzo (canvas) que creamos en el HTML y su "pincel" (el contexto 2D): el objeto con el que dibujaremos todo.
//? Busca en la página el elemento con id="lienzo" (nuestro canvas) y lo guarda en una constante llamada lienzo. Una constante (const) es una caja con nombre cuyo contenido no cambiará.
const lienzo = document.getElementById("lienzo");
//? Pide al lienzo su "contexto 2D": un objeto que tiene todas las órdenes de dibujo (rectángulos, círculos, texto...). Por costumbre se llama ctx.
const ctx = lienzo.getContext("2d");
//? Guarda el ancho del lienzo (800 píxeles, lo pusimos en el HTML) para no escribir el número a mano por todo el código.
const ANCHO = lienzo.width;
//? Lo mismo con el alto (600 píxeles). Escribimos estas constantes en MAYÚSCULAS para recordar que son valores fijos.
const ALTO = lienzo.height;

//#[1-1
//> **Prueba de vida.** Antes de construir el juego comprobamos que el HTML y el JavaScript están bien conectados pintando un fondo y un saludo. En el paso 2 borraremos estas líneas.
//? Elige el color de relleno: celeste. Los colores se escriben en hexadecimal: # seguido de rojo, verde y azul (dos cifras cada uno, de 00 a ff).
ctx.fillStyle = "#8fd3ff";
//? Pinta un rectángulo relleno que empieza en la esquina superior izquierda (0, 0) y mide todo el ANCHO y todo el ALTO: es decir, pinta el lienzo entero.
ctx.fillRect(0, 0, ANCHO, ALTO);
//? Cambia el color de relleno a verde oscuro: lo usaremos para el texto.
ctx.fillStyle = "#1b4332";
//? Elige la letra: negrita (bold), 40 píxeles de alto, tipo Arial.
ctx.font = "bold 40px Arial";
//? Indica que el texto se centre horizontalmente respecto al punto que le demos.
ctx.textAlign = "center";
//? Escribe el saludo en el centro del lienzo: la mitad del ancho (ANCHO / 2) y la mitad del alto (ALTO / 2).
ctx.fillText("¡Hola, EcoCaza!", ANCHO / 2, ALTO / 2);
//#]

//#[3
// ---------- DATOS DEL JUEGO ----------

//> **Los cuatro contenedores.** Guardamos en un objeto la información de cada tipo de contenedor: su nombre y sus colores. Si algún día quieres cambiar un color, solo lo cambias aquí.
//? Crea la constante TIPOS. Es un objeto: una caja con apartados, cada uno con su nombre (amarillo, azul, verde, marron) y sus datos entre llaves { }.
const TIPOS = {
  //? Datos del contenedor amarillo: el nombre que verá el jugador, su color principal y un color más oscuro para bordes y tapa.
  amarillo: { nombre: "Plásticos y latas", color: "#f9c80e", oscuro: "#b38b00" },
  //? Datos del contenedor azul (papel y cartón).
  azul: { nombre: "Papel y cartón", color: "#2e86de", oscuro: "#1b5394" },
  //? Datos del contenedor verde (vidrio).
  verde: { nombre: "Vidrio", color: "#27ae60", oscuro: "#17703c" },
  //? Datos del contenedor marrón (orgánico = restos de comida). En el código escribimos marron sin tilde para evitar problemas al teclear.
  marron: { nombre: "Orgánico", color: "#a0522d", oscuro: "#5e2e14" },
};
//? Una lista (array) con los cuatro tipos en orden. Los arrays se escriben entre corchetes [ ] y cada elemento tiene una posición: 0, 1, 2, 3. Así sabremos que la tecla 1 es el amarillo, la 2 el azul, etc.
const ORDEN_TIPOS = ["amarillo", "azul", "verde", "marron"];
//#]
//#[5
//> **Los botones del selector.** Medidas de la barra de botones que dibujaremos sobre el césped (sirve para ver qué contenedor está activo y, en el paso 13, para tocarlo con el dedo).
//? Objeto con la posición y el tamaño de los botones: x e y de la esquina del primer botón, ancho y alto de cada botón, y separación entre botones.
const SELECTOR = { x: 45, y: ALTO - 33, ancho: 170, alto: 28, separacion: 10 };
//#]
//#[6

//> **El catálogo de residuos.** Cada residuo es un objeto con su nombre, el contenedor correcto, qué dibujo usar y un consejo educativo que aparecerá si el jugador se equivoca.
//? Crea la lista RESIDUOS. Cada elemento es un objeto entre llaves con cuatro datos: nombre, tipo (contenedor correcto), dibujo (qué función lo dibuja) y consejo.
const RESIDUOS = [
  //? La botella de plástico va al amarillo.
  { nombre: "Botella de plástico", tipo: "amarillo", dibujo: "botellaPlastico", consejo: "Las botellas de plástico van al contenedor AMARILLO." },
  //? La lata va al amarillo: es un envase metálico.
  { nombre: "Lata de refresco", tipo: "amarillo", dibujo: "lata", consejo: "Las latas son envases: ¡al AMARILLO!" },
  //? El brik es el error más típico: parece cartón pero lleva plástico y aluminio, por eso va al amarillo.
  { nombre: "Brik de leche", tipo: "amarillo", dibujo: "brik", consejo: "Aunque parezca cartón, el brik lleva plástico y aluminio: AMARILLO." },
  //? El periódico va al azul.
  { nombre: "Periódico", tipo: "azul", dibujo: "periodico", consejo: "Periódicos, revistas y folios van al contenedor AZUL." },
  //? La caja de cartón va al azul.
  { nombre: "Caja de cartón", tipo: "azul", dibujo: "caja", consejo: "Las cajas de cartón van al AZUL (¡plégalas para que quepan más!)." },
  //? La botella de vidrio va al verde.
  { nombre: "Botella de vidrio", tipo: "verde", dibujo: "botellaVidrio", consejo: "Las botellas de vidrio van al VERDE, sin el tapón." },
  //? El tarro de vidrio va al verde (pero su tapa metálica iría al amarillo).
  { nombre: "Tarro de vidrio", tipo: "verde", dibujo: "tarro", consejo: "Los tarros van al VERDE. ¡Su tapa metálica va al AMARILLO!" },
  //? La cáscara de plátano es orgánica: marrón.
  { nombre: "Cáscara de plátano", tipo: "marron", dibujo: "platano", consejo: "Los restos de fruta son ORGÁNICOS: contenedor MARRÓN." },
  //? La manzana mordida también es orgánica.
  { nombre: "Manzana mordida", tipo: "marron", dibujo: "manzana", consejo: "La comida sobrante va al MARRÓN y se convierte en abono (compost)." },
];
//#]
//#[12
//? Lista de datos curiosos que mostraremos al terminar la partida. Elegiremos uno al azar.
const DATOS_CURIOSOS = [
  //? Dato 1: el aluminio se recicla sin perder calidad.
  "Una lata de aluminio se puede reciclar una y otra vez sin perder calidad.",
  //? Dato 2: el vidrio también.
  "El vidrio se recicla al 100 % y las veces que haga falta.",
  //? Dato 3: el compost.
  "Con los restos orgánicos se fabrica compost, un abono natural para el campo.",
  //? Dato 4: el papel reciclado.
  "Reciclar papel ahorra agua, energía y árboles.",
  //? Dato 5: separar bien.
  "Un residuo en el contenedor equivocado puede estropear todo un lote de reciclaje.",
];
//#]

//#[2
// ---------- ESTADO DEL JUEGO (variables que cambian) ----------

//> **Variables del tiempo.** Usamos let (en lugar de const) porque su valor irá cambiando mientras jugamos.
//? Momento (en milisegundos) en que se dibujó el fotograma anterior. Sirve para medir cuánto tiempo pasa entre un fotograma y el siguiente.
let tiempoAnterior = 0;
//? Segundos totales que lleva el juego funcionando. Lo usaremos para animar cosas, como las nubes.
let tiempoTotal = 0;
//#]
//#[3

//> **El jugador: un contenedor con ruedas.** Guardamos todos sus datos juntos en un objeto.
//? Crea el objeto contenedor. Aunque es const, sus apartados (x, tipo...) sí pueden cambiar; lo que no cambia es que "contenedor" siempre es este mismo objeto.
const contenedor = {
  //? Posición horizontal del CENTRO del contenedor: empieza en la mitad del lienzo.
  x: ANCHO / 2,
  //? Posición vertical de la BASE del contenedor: 40 píxeles por encima del borde inferior, justo sobre el césped.
  y: ALTO - 40,
  //? Ancho del contenedor en píxeles.
  ancho: 110,
  //? Alto del contenedor en píxeles.
  alto: 80,
  //#[4
  //? Velocidad al moverse: 520 píxeles por segundo.
  velocidad: 520,
  //#]
  //? Tipo de contenedor activo al empezar: el amarillo.
  tipo: "amarillo",
  //#[5
  //? Temporizador del saltito que da el contenedor al cambiar de tipo (0 = no está saltando).
  salto: 0,
  //#]
  //#[13
  //? Punto hacia el que debe ir el contenedor cuando usamos el ratón o el dedo. null significa "ninguno".
  objetivoX: null,
  //#]
};
//#]
//#[4
//? Objeto vacío donde apuntaremos qué teclas están pulsadas ahora mismo. Por ejemplo: teclas["ArrowLeft"] valdrá true mientras la flecha izquierda esté pulsada.
const teclas = {};
//#]
//#[6

//> **Variables de los residuos que caen.**
//? Lista de residuos que están cayendo ahora mismo. Empieza vacía [ ].
let residuos = [];
//? Segundos que faltan para que aparezca el siguiente residuo.
let tiempoParaSiguiente = 1;
//? Cada cuántos segundos aparece un residuo nuevo.
let intervaloAparicion = 1.4;
//? Velocidad base de caída, en píxeles por segundo.
let velocidadCaida = 120;
//#]
//#[8

//> **Variables de la puntuación.**
//? Puntos del jugador.
let puntos = 0;
//? Vidas que quedan (cada error al separar quita una).
let vidas = 3;
//? Aciertos seguidos. Cuantos más seguidos, más puntos vale cada acierto.
let combo = 0;
//#]
//#[9
//? Lista de textos flotantes ("+20", "¡Contenedor equivocado!") que suben y se desvanecen.
let textosFlotantes = [];
//? El cartel de consejo que aparece al equivocarse: título, texto y cuántos segundos le quedan en pantalla.
let consejo = { titulo: "", texto: "", tiempo: 0 };
//#]
//#[10
//? Nivel de contaminación del planeta, de 0 (limpio) a 100 (contaminado del todo).
let contaminacion = 0;
//? Lista de residuos que se cayeron al suelo (los dibujaremos tirados en el césped).
let basuraSuelo = [];
//#]
//#[11
//? Lista de partículas (los cuadraditos de colores que saltan al acertar).
let particulas = [];
//? Aquí guardaremos el "motor de sonido" del navegador. Empieza vacío (null) y lo crearemos la primera vez que suene algo.
let audio = null;
//#]
//#[12

//> **Variables de los estados del juego.** El juego puede estar en el menú, jugando o en la pantalla final.
//? Estado actual: "menu", "jugando" o "fin". Empezamos en el menú.
let estado = "menu";
//? Nivel de dificultad actual.
let nivel = 1;
//? Mejor puntuación conseguida (récord). La leeremos de la memoria del navegador al arrancar.
let record = 0;
//? ¿Se batió el récord en esta partida? true (sí) o false (no).
let nuevoRecord = false;
//? Contador de residuos bien separados.
let aciertos = 0;
//? Contador de residuos echados en el contenedor equivocado.
let fallos = 0;
//? Contador de residuos que cayeron al suelo.
let perdidos = 0;
//? Texto que explica por qué terminó la partida.
let motivoFin = "";
//? Dato curioso elegido para la pantalla final.
let datoFinal = "";
//#]
//#[3

// ---------- UTILIDADES ----------

//> **Una función para escribir texto bonito.** Una función es un conjunto de órdenes con nombre que podemos usar muchas veces. Esta escribe un texto con borde oscuro para que se lea sobre cualquier fondo.
//? Declara la función escribir. Entre paréntesis van sus "parámetros": los datos que le pasamos cada vez (el texto, la posición x e y, el tamaño, el color y la alineación).
function escribir(texto, x, y, tamano, color, alineacion) {
  //? Elige la letra: negrita, del tamaño indicado, Arial. Unimos textos con +: "bold " + 20 + "px Arial" da "bold 20px Arial".
  ctx.font = "bold " + tamano + "px Arial";
  //? Alineación horizontal. Si no nos pasan ninguna (alineacion vale undefined), el operador || elige "center".
  ctx.textAlign = alineacion || "center";
  //? Alineación vertical: el punto y será el centro del texto.
  ctx.textBaseline = "middle";
  //? Las esquinas del borde serán redondeadas (así no salen picos en letras como la M).
  ctx.lineJoin = "round";
  //? Grosor del borde: una sexta parte del tamaño de la letra, pero nunca menos de 2 píxeles (Math.max elige el mayor).
  ctx.lineWidth = Math.max(2, tamano / 6);
  //? Color del borde: negro semitransparente. rgba = rojo, verde, azul y opacidad (0 = invisible, 1 = opaco).
  ctx.strokeStyle = "rgba(0, 0, 0, 0.55)";
  //? Dibuja solo el borde (contorno) del texto.
  ctx.strokeText(texto, x, y);
  //? Elige el color del relleno del texto.
  ctx.fillStyle = color;
  //? Dibuja el relleno del texto encima del borde.
  ctx.fillText(texto, x, y);
}
//#]
//#[10

//> **Mezclar dos colores.** Para ensuciar el cielo poco a poco necesitamos un color intermedio entre "limpio" y "contaminado". t = 0 devuelve el primer color, t = 1 el segundo y t = 0.5 la mitad exacta.
//? Declara la función mezclarColor con tres parámetros: dos colores en formato "#rrggbb" y la proporción t (de 0 a 1).
function mezclarColor(colorA, colorB, t) {
  //? Recorre las posiciones 1, 3 y 5 del texto del color (donde empiezan el rojo, el verde y el azul). map crea una lista nueva con el resultado de cada vuelta.
  const canales = [1, 3, 5].map(function (i) {
    //? Toma dos caracteres del primer color (por ejemplo "6e") y los convierte de hexadecimal a número (110). parseInt(texto, 16) significa "lee este texto en base 16".
    const a = parseInt(colorA.slice(i, i + 2), 16);
    //? Hace lo mismo con el segundo color.
    const b = parseInt(colorB.slice(i, i + 2), 16);
    //? Calcula el valor intermedio: empieza en a y avanza la proporción t hacia b. Math.round lo redondea a número entero.
    return Math.round(a + (b - a) * t);
  });
  //? Une los tres números con comas y devuelve un color como "rgb(110,150,200)".
  return "rgb(" + canales.join(",") + ")";
}
//#]
//#[2

// ---------- ESCENARIO ----------

//> **El fondo del escenario.** Esta función dibuja el cielo, el sol, las nubes y el césped. La llamaremos en cada fotograma, así "borra" lo anterior y vuelve a pintar todo.
//? Declara la función dibujarFondo (no tiene parámetros, por eso los paréntesis están vacíos).
function dibujarFondo() {
  //#[10
  //? Convierte la contaminación (de 0 a 100) en una proporción de 0 a 1 para mezclar colores.
  const suciedad = contaminacion / 100;
  //#]
  //? Crea un degradado lineal vertical: desde y = 0 (arriba) hasta y = ALTO (abajo). Los cuatro números son: x inicial, y inicial, x final, y final.
  const cielo = ctx.createLinearGradient(0, 0, 0, ALTO);
  //#[2-9
  //? Color del degradado arriba del todo (posición 0): azul cielo.
  cielo.addColorStop(0, "#6ec6ff");
  //? Color abajo del todo (posición 1): celeste muy claro.
  cielo.addColorStop(1, "#d8f3ff");
  //#]
  //#[10
  //? Color de arriba: mezcla entre azul limpio y gris contaminado, según la suciedad.
  cielo.addColorStop(0, mezclarColor("#6ec6ff", "#6b6257", suciedad));
  //? Color de abajo: mezcla entre celeste claro y marrón de humo.
  cielo.addColorStop(1, mezclarColor("#d8f3ff", "#a89a7c", suciedad));
  //#]
  //? Usa el degradado como "color" de relleno.
  ctx.fillStyle = cielo;
  //? Pinta todo el lienzo con el degradado. Esto también borra lo que hubiera del fotograma anterior.
  ctx.fillRect(0, 0, ANCHO, ALTO);

  // Sol
  //#[2-9
  //? Color amarillo para el sol.
  ctx.fillStyle = "#ffd84d";
  //#]
  //#[10
  //? El sol se apaga (se vuelve gris) cuanto más contaminado está el planeta.
  ctx.fillStyle = mezclarColor("#ffd84d", "#8f8a7a", suciedad);
  //#]
  //? Empieza un trazo nuevo. Siempre hay que llamarlo antes de dibujar una figura, para que no se mezcle con la anterior.
  ctx.beginPath();
  //? Traza un círculo: centro en (720, 140), radio 38. Los ángulos van de 0 a Math.PI * 2 (una vuelta completa en radianes).
  ctx.arc(720, 140, 38, 0, Math.PI * 2);
  ctx.fill();

  // Nubes que se desplazan
  //? Dibuja una nube. Su x avanza 20 píxeles por segundo. El operador % (resto de la división) hace que, al llegar al final, vuelva a empezar por la izquierda.
  dibujarNube((tiempoTotal * 20) % (ANCHO + 200) - 100, 110);
  //? Otra nube más lenta (12 px/s) que empieza 400 píxeles más adelante y a otra altura.
  dibujarNube((tiempoTotal * 12 + 400) % (ANCHO + 200) - 100, 180);

  // Césped
  //? Verde para el césped.
  ctx.fillStyle = "#6ab04c";
  //? Rectángulo de 40 píxeles de alto pegado al borde inferior.
  ctx.fillRect(0, ALTO - 40, ANCHO, 40);
  //? Verde más oscuro para el borde del césped.
  ctx.fillStyle = "#4a8a32";
  //? Una franja fina de 6 píxeles en la parte de arriba del césped (da sensación de profundidad).
  ctx.fillRect(0, ALTO - 40, ANCHO, 6);
}

//> **Una nube hecha con tres círculos.**
//? Declara la función dibujarNube: recibe la posición x e y donde se dibujará.
function dibujarNube(x, y) {
  //? Blanco casi opaco (90 %).
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.beginPath();
  //? Primer círculo de la nube, de radio 25.
  ctx.arc(x, y, 25, 0, Math.PI * 2);
  //? Segundo círculo, 30 píxeles a la derecha y 12 más arriba, un poco más grande (la "joroba" de la nube).
  ctx.arc(x + 30, y - 12, 30, 0, Math.PI * 2);
  //? Tercer círculo, a la derecha del todo.
  ctx.arc(x + 62, y, 24, 0, Math.PI * 2);
  //? Rellena los tres círculos a la vez.
  ctx.fill();
}
//#]
//#[10

//> **La basura tirada en el césped.** Cada residuo que se cae queda en el suelo, pequeñito, recordándonos que el planeta se ensucia.
//? Declara la función dibujarBasuraSuelo.
function dibujarBasuraSuelo() {
  //? Recorre cada elemento b de la lista basuraSuelo. for...of significa "para cada elemento de...".
  for (const b of basuraSuelo) {
    //? Guarda el estado actual del pincel (posición, giro, escala) para poder recuperarlo después.
    ctx.save();
    //? Mueve el origen de coordenadas (el punto 0,0) a donde está el residuo, sobre el césped.
    ctx.translate(b.x, ALTO - 44);
    //? Gira el pincel el mismo ángulo que tenía el residuo al caer.
    ctx.rotate(b.giro);
    //? Encoge todo lo que se dibuje al 70 %.
    ctx.scale(0.7, 0.7);
    //? Dibuja el residuo usando su función de dibujo (la buscamos por su nombre dentro de DIBUJOS).
    DIBUJOS[b.modelo.dibujo]();
    //? Recupera el estado del pincel que guardamos con save().
    ctx.restore();
  }
}
//#]
//#[3

// ---------- EL CONTENEDOR (JUGADOR) ----------

//> **Dibujar el contenedor.** Lo construimos con figuras simples: un trapecio para el cuerpo, un rectángulo para la tapa, el símbolo de reciclaje, su nombre y dos ruedas.
//? Declara la función dibujarContenedor.
function dibujarContenedor() {
  //? Atajo: c es otro nombre para contenedor, así escribimos menos.
  const c = contenedor;
  //? Busca en TIPOS los datos (nombre y colores) del tipo activo. Ej.: si c.tipo es "azul", t será TIPOS.azul.
  const t = TIPOS[c.tipo];
  //? Calcula el borde izquierdo: el centro menos la mitad del ancho.
  const izq = c.x - c.ancho / 2;
  //? Calcula el borde de arriba: la base menos el alto (en el canvas, la y crece hacia ABAJO).
  const arriba = c.y - c.alto;
  //#[5
  //? Guarda el estado del pincel antes de mover el dibujo por el saltito.
  ctx.save();
  //? Sube el dibujo según el salto: Math.sin dibuja una curva que sube y baja suavemente, hasta 10 píxeles.
  ctx.translate(0, -Math.sin((c.salto / 0.2) * Math.PI) * 10);
  //#]

  // Cuerpo: un trapecio (más estrecho abajo)
  //? El cuerpo se pinta del color del tipo activo.
  ctx.fillStyle = t.color;
  ctx.beginPath();
  //? Coloca el lápiz (sin pintar) en la esquina superior izquierda.
  ctx.moveTo(izq, arriba);
  //? Traza una línea hasta la esquina superior derecha.
  ctx.lineTo(izq + c.ancho, arriba);
  //? Baja hasta la esquina inferior derecha, 10 píxeles hacia dentro (por eso es un trapecio).
  ctx.lineTo(izq + c.ancho - 10, c.y);
  //? Va hasta la esquina inferior izquierda, también 10 píxeles hacia dentro.
  ctx.lineTo(izq + 10, c.y);
  //? Cierra la figura volviendo al punto de inicio.
  ctx.closePath();
  ctx.fill();
  //? Elige el color oscuro del tipo para el borde.
  ctx.strokeStyle = t.oscuro;
  //? El borde tendrá 3 píxeles de grosor.
  ctx.lineWidth = 3;
  //? Dibuja el borde del trapecio.
  ctx.stroke();

  // Tapa (la boca del contenedor)
  //? La tapa usa el color oscuro.
  ctx.fillStyle = t.oscuro;
  //? Rectángulo un poco más ancho que el cuerpo (6 píxeles por cada lado) y de 12 de alto, justo encima.
  ctx.fillRect(izq - 6, arriba - 10, c.ancho + 12, 12);

  //? Dibuja el símbolo de reciclaje en el centro, 30 píxeles por debajo de la boca, con radio 15.
  dibujarSimboloReciclaje(c.x, arriba + 30, 15);
  //? Escribe el nombre del tipo (por ejemplo "Vidrio") en la parte baja del contenedor.
  escribir(t.nombre, c.x, arriba + 60, 10, "white");

  // Ruedas
  //? Gris casi negro para las ruedas.
  ctx.fillStyle = "#2d3436";
  ctx.beginPath();
  //? Rueda izquierda: círculo de radio 7 a 20 píxeles del borde izquierdo.
  ctx.arc(izq + 20, c.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  //? Rueda derecha.
  ctx.arc(izq + c.ancho - 20, c.y, 7, 0, Math.PI * 2);
  ctx.fill();
  //#[5
  //? Recupera el estado del pincel (deshace el movimiento del salto).
  ctx.restore();
  //#]
}

//> **El símbolo de reciclaje.** Tres flechas que se persiguen en círculo. Cada flecha es un arco más un triángulo en la punta.
//? Declara la función: recibe el centro (x, y) y el radio r del símbolo.
function dibujarSimboloReciclaje(x, y, r) {
  //? Color blanco para las líneas.
  ctx.strokeStyle = "white";
  //? Color blanco para las puntas de flecha.
  ctx.fillStyle = "white";
  //? Líneas de 4 píxeles de grosor.
  ctx.lineWidth = 4;
  //? Bucle for: repite el bloque 3 veces, con i = 0, luego 1, luego 2 (una vez por flecha).
  for (let i = 0; i < 3; i++) {
    //? Ángulo donde empieza esta flecha: un tercio de vuelta por cada flecha (Math.PI * 2 / 3 = 120 grados).
    const inicio = i * (Math.PI * 2 / 3);
    //? Ángulo donde termina el arco: 1.8 radianes (unos 100 grados) más allá.
    const fin = inicio + 1.8;
    ctx.beginPath();
    //? Traza el arco de la flecha (empieza 0.25 radianes más tarde para dejar un hueco entre flechas).
    ctx.arc(x, y, r, inicio + 0.25, fin);
    ctx.stroke();
    //? Calcula la x del final del arco. Con coseno y seno pasamos de "ángulo y radio" a coordenadas x, y.
    const px = x + Math.cos(fin) * r;
    //? Calcula la y del final del arco.
    const py = y + Math.sin(fin) * r;
    ctx.beginPath();
    //? Primer vértice del triángulo: 6 píxeles hacia fuera del círculo.
    ctx.moveTo(px + Math.cos(fin) * 6, py + Math.sin(fin) * 6);
    //? Segundo vértice: 6 píxeles hacia dentro del círculo.
    ctx.lineTo(px - Math.cos(fin) * 6, py - Math.sin(fin) * 6);
    //? Tercer vértice (la punta): 7 píxeles en la dirección en la que avanza el arco (90 grados más, Math.PI / 2).
    ctx.lineTo(px + Math.cos(fin + Math.PI / 2) * 7, py + Math.sin(fin + Math.PI / 2) * 7);
    ctx.closePath();
    ctx.fill();
  }
}
//#]
//#[4

//> **Mover el contenedor con el teclado.** Cada fotograma miramos qué flechas están pulsadas y movemos el contenedor. Multiplicar por dt (los segundos que pasaron) hace que la velocidad sea la misma en ordenadores rápidos y lentos.
//? Declara la función actualizarContenedor. dt es el tiempo (en segundos) desde el fotograma anterior, por ejemplo 0.016.
function actualizarContenedor(dt) {
  //? Dirección del movimiento: -1 = izquierda, 0 = quieto, 1 = derecha. Empieza en 0.
  let direccion = 0;
  //? Si está pulsada la flecha izquierda O (||) la tecla A, resta 1 a la dirección.
  if (teclas["ArrowLeft"] || teclas["KeyA"]) direccion -= 1;
  //? Si está pulsada la flecha derecha o la tecla D, suma 1. (Si pulsas las dos, se anulan y queda 0).
  if (teclas["ArrowRight"] || teclas["KeyD"]) direccion += 1;
  //? Mueve el contenedor: distancia = dirección × velocidad × tiempo. Ej.: 1 × 520 × 0.016 = 8.3 píxeles a la derecha.
  contenedor.x += direccion * contenedor.velocidad * dt;
  //#[13
  //? Si el jugador usa el teclado, olvidamos el objetivo del ratón.
  if (direccion !== 0) {
    //? Borra el objetivo: el contenedor obedece solo al teclado.
    contenedor.objetivoX = null;
    //? Si no se usa el teclado pero hay un objetivo del ratón o del dedo...
  } else if (contenedor.objetivoX !== null) {
    //? Calcula cuánto falta para llegar al objetivo (positivo = está a la derecha).
    const distancia = contenedor.objetivoX - contenedor.x;
    //? Cuánto puede avanzar en este fotograma (un 40 % más rápido que con el teclado).
    const paso = contenedor.velocidad * 1.4 * dt;
    //? Si el objetivo está más cerca que un paso, llega directamente (así no "tiembla" alrededor del objetivo).
    if (Math.abs(distancia) <= paso) contenedor.x = contenedor.objetivoX;
    //? Si no, avanza un paso hacia él. Math.sign devuelve 1 si la distancia es positiva y -1 si es negativa.
    else contenedor.x += Math.sign(distancia) * paso;
  }
  //#]
  //? Media anchura del contenedor más la tapa: la distancia mínima al borde para que no se salga.
  const mitad = contenedor.ancho / 2 + 6;
  //? Si se sale por la izquierda, lo devolvemos al límite.
  if (contenedor.x < mitad) contenedor.x = mitad;
  //? Si se sale por la derecha, también.
  if (contenedor.x > ANCHO - mitad) contenedor.x = ANCHO - mitad;
  //#[5
  //? Si está saltando, descuenta el tiempo del salto sin bajar de 0.
  if (contenedor.salto > 0) contenedor.salto = Math.max(0, contenedor.salto - dt);
  //#]
}
//#]
//#[5

//> **Cambiar el tipo de contenedor.** Al pulsar 1, 2, 3 o 4 el contenedor cambia de color y da un saltito para que se note.
//? Declara la función cambiarTipo, que recibe el nombre del tipo nuevo ("azul", "verde"...).
function cambiarTipo(tipo) {
  //? Si ya era ese tipo, no hacemos nada: return sale de la función inmediatamente. (=== significa "es exactamente igual a").
  if (contenedor.tipo === tipo) return;
  //? Guarda el tipo nuevo.
  contenedor.tipo = tipo;
  //? Empieza el saltito: durará 0.2 segundos.
  contenedor.salto = 0.2;
  //#[11
  //? Suena un pitido corto; cada tipo tiene un tono distinto (300, 400, 500 o 600 hercios).
  sonido(300 + ORDEN_TIPOS.indexOf(tipo) * 100, 0.08, "sine", 0.12);
  //#]
}

//> **Dibujar la barra de botones.** Cuatro botones sobre el césped; el activo se ve más intenso y con borde blanco.
//? Declara la función dibujarSelector.
function dibujarSelector() {
  //? Repite una vez por cada tipo (i = 0, 1, 2, 3). ORDEN_TIPOS.length es el número de elementos de la lista: 4.
  for (let i = 0; i < ORDEN_TIPOS.length; i++) {
    //? El nombre del tipo de esta vuelta, por ejemplo "azul".
    const tipo = ORDEN_TIPOS[i];
    //? Sus datos (nombre y colores).
    const t = TIPOS[tipo];
    //? Posición x de este botón: el inicio más i veces (ancho + separación).
    const x = SELECTOR.x + i * (SELECTOR.ancho + SELECTOR.separacion);
    //? ¿Es este el tipo activo? Guarda true o false.
    const activo = contenedor.tipo === tipo;
    //? Opacidad general: 1 (opaco) si está activo, 0.55 si no. La forma "condición ? A : B" elige A si se cumple y B si no.
    ctx.globalAlpha = activo ? 1 : 0.55;
    //? Color del botón.
    ctx.fillStyle = t.color;
    ctx.beginPath();
    //? Traza un rectángulo con las esquinas redondeadas (radio 8).
    ctx.roundRect(x, SELECTOR.y, SELECTOR.ancho, SELECTOR.alto, 8);
    ctx.fill();
    //? Si es el activo...
    if (activo) {
      //? ...le ponemos un borde blanco de 3 píxeles.
      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    //? Volvemos a opacidad normal para lo siguiente que se dibuje.
    ctx.globalAlpha = 1;
    //? Escribe en el centro del botón su número y su nombre, por ejemplo "2 · Papel y cartón".
    escribir((i + 1) + " · " + t.nombre, x + SELECTOR.ancho / 2, SELECTOR.y + SELECTOR.alto / 2, 13, "white");
  }
}
//#]
//#[6

// ---------- LOS RESIDUOS ----------

//> **Crear un residuo nuevo.** Elegimos uno del catálogo al azar y lo colocamos arriba, en una x aleatoria.
//? Declara la función crearResiduo.
function crearResiduo() {
  //? Math.random() da un número al azar entre 0 y 0.999... Al multiplicarlo por 9 (los residuos del catálogo) y redondear hacia abajo (Math.floor) obtenemos una posición entre 0 y 8.
  const modelo = RESIDUOS[Math.floor(Math.random() * RESIDUOS.length)];
  //? Añade (push) a la lista residuos un objeto nuevo con estos datos:
  residuos.push({
    //? Qué residuo del catálogo es (nombre, tipo, dibujo, consejo).
    modelo: modelo,
    //? Posición x al azar, dejando 50 píxeles de margen a cada lado.
    x: 50 + Math.random() * (ANCHO - 100),
    //? Empieza un poco por encima del lienzo (y negativa), así aparece entrando desde arriba.
    y: -30,
    //? Tamaño aproximado (radio) para calcular los choques.
    radio: 22,
    //? Velocidad de caída: la base multiplicada por un número entre 0.8 y 1.2 (así no todos caen igual).
    velocidad: velocidadCaida * (0.8 + Math.random() * 0.4),
    //? Ángulo de giro actual (empieza recto).
    giro: 0,
    //? Velocidad de giro al azar, entre -1 y 1 radianes por segundo (positivo = horario).
    velocidadGiro: (Math.random() - 0.5) * 2,
  });
}

//> **Mover los residuos.** Cada fotograma: si toca, creamos uno nuevo; después bajamos todos y quitamos los que llegan al suelo.
//? Declara la función actualizarResiduos.
function actualizarResiduos(dt) {
  //? Descuenta el tiempo que ha pasado.
  tiempoParaSiguiente -= dt;
  //? Si ya llegó a 0 (o menos)...
  if (tiempoParaSiguiente <= 0) {
    //? ...creamos un residuo...
    crearResiduo();
    //? ...y volvemos a poner en marcha la cuenta atrás.
    tiempoParaSiguiente = intervaloAparicion;
  }
  //? Recorremos la lista AL REVÉS (desde el último hasta el primero). Así, si quitamos uno con splice, no nos saltamos el siguiente.
  for (let i = residuos.length - 1; i >= 0; i--) {
    //? El residuo de esta vuelta.
    const r = residuos[i];
    //? Baja según su velocidad y el tiempo transcurrido.
    r.y += r.velocidad * dt;
    //? Gira un poquito.
    r.giro += r.velocidadGiro * dt;
    //#[8
    //? Si toca la boca del contenedor...
    if (tocaContenedor(r)) {
      //? ...comprobamos si acertó o falló...
      atrapar(r);
      //? ...lo quitamos de la lista (splice(i, 1) borra 1 elemento en la posición i)...
      residuos.splice(i, 1);
      //? ...y pasamos directamente al siguiente residuo.
      continue;
    }
    //#]
    //? Si su centro llega a la altura del césped, ha caído al suelo.
    if (r.y > ALTO - 50) {
      //#[10
      //? Aplicamos el castigo por dejarlo caer (contaminación).
      residuoPerdido(r);
      //#]
      //? Lo quitamos de la lista.
      residuos.splice(i, 1);
    }
  }
}

//> **Dibujar un residuo.** Movemos y giramos el "pincel" hasta la posición del residuo, dibujamos y lo dejamos como estaba.
//? Declara la función dibujarResiduo: recibe el residuo r que hay que dibujar.
function dibujarResiduo(r) {
  //? Guarda el estado del pincel.
  ctx.save();
  //? Lleva el punto (0, 0) al centro del residuo.
  ctx.translate(r.x, r.y);
  //? Gira el pincel el ángulo del residuo.
  ctx.rotate(r.giro);
  //#[6-6
  //? DIBUJO PROVISIONAL: un cuadrado gris. En el paso 7 lo cambiaremos por dibujos de verdad.
  ctx.fillStyle = "#7f8c8d";
  //? Cuadrado centrado en (0, 0): empieza en (-radio, -radio) y mide 2 × radio de lado.
  ctx.fillRect(-r.radio, -r.radio, r.radio * 2, r.radio * 2);
  //#]
  //#[7
  //? Llama a la función de dibujo de este residuo. Ej.: si r.modelo.dibujo es "lata", ejecuta DIBUJOS["lata"]().
  DIBUJOS[r.modelo.dibujo]();
  //#]
  //? Deja el pincel como estaba.
  ctx.restore();
  //? Escribe el nombre debajo del residuo (34 píxeles más abajo) para que el jugador aprenda cómo se llama.
  escribir(r.modelo.nombre, r.x, r.y + 34, 12, "white");
}
//#]
//#[7

//> **Los dibujos de cada residuo.** DIBUJOS es un objeto cuyos apartados son funciones. Todas dibujan alrededor del punto (0, 0), porque antes hemos movido el pincel con translate. Usamos solo rectángulos, círculos y líneas.
//? Crea el objeto DIBUJOS. Cada apartado tiene el nombre del dibujo y como valor una función.
const DIBUJOS = {
  //? Dibujo de la botella de plástico.
  botellaPlastico: function () {
    //? Celeste semitransparente: parece plástico.
    ctx.fillStyle = "rgba(120, 200, 255, 0.9)";
    ctx.beginPath();
    //? Cuerpo de la botella: rectángulo redondeado de 20 × 34.
    ctx.roundRect(-10, -14, 20, 34, 6);
    ctx.fill();
    //? Cuello de la botella (rectángulo estrecho arriba).
    ctx.fillRect(-5, -22, 10, 9);
    //? Rojo para el tapón.
    ctx.fillStyle = "#e74c3c";
    //? El tapón.
    ctx.fillRect(-6, -27, 12, 6);
    //? Blanco para la etiqueta.
    ctx.fillStyle = "white";
    //? La etiqueta, una franja en el centro.
    ctx.fillRect(-10, -2, 20, 9);
  },
  //? Dibujo de la lata.
  lata: function () {
    //? Rojo para el cuerpo de la lata.
    ctx.fillStyle = "#e74c3c";
    ctx.beginPath();
    //? Cuerpo de la lata con esquinas poco redondeadas.
    ctx.roundRect(-12, -18, 24, 36, 4);
    ctx.fill();
    //? Gris metálico para la tapa.
    ctx.fillStyle = "#bdc3c7";
    //? Tapa superior.
    ctx.fillRect(-11, -20, 22, 4);
    //? Base inferior.
    ctx.fillRect(-11, 16, 22, 4);
    //? Blanco para la franja decorativa.
    ctx.fillStyle = "white";
    //? Franja horizontal en el centro.
    ctx.fillRect(-12, -4, 24, 6);
  },
  //? Dibujo del brik de leche.
  brik: function () {
    //? Blanco para el cuerpo.
    ctx.fillStyle = "#ffffff";
    //? Cuerpo rectangular.
    ctx.fillRect(-13, -14, 26, 32);
    //? Gris claro para el "tejado" del brik.
    ctx.fillStyle = "#dfe6e9";
    ctx.beginPath();
    //? Esquina izquierda del tejado.
    ctx.moveTo(-13, -14);
    //? Punta del tejado.
    ctx.lineTo(0, -24);
    //? Esquina derecha del tejado.
    ctx.lineTo(13, -14);
    ctx.closePath();
    ctx.fill();
    //? Azul para la franja con el dibujo.
    ctx.fillStyle = "#3498db";
    //? Franja azul.
    ctx.fillRect(-13, -2, 26, 10);
    //? Gris para el contorno.
    ctx.strokeStyle = "#95a5a6";
    //? Grosor del contorno: 1.5 píxeles.
    ctx.lineWidth = 1.5;
    //? Dibuja solo el contorno del rectángulo del cuerpo.
    ctx.strokeRect(-13, -14, 26, 32);
  },
  //? Dibujo del periódico.
  periodico: function () {
    //? Blanco roto (color papel).
    ctx.fillStyle = "#f5f5f0";
    //? La hoja.
    ctx.fillRect(-18, -14, 36, 28);
    //? Gris para el borde.
    ctx.strokeStyle = "#999999";
    ctx.lineWidth = 1.5;
    //? Borde de la hoja.
    ctx.strokeRect(-18, -14, 36, 28);
    //? Gris oscuro para el titular.
    ctx.fillStyle = "#555555";
    //? El titular (una barra gruesa arriba).
    ctx.fillRect(-14, -10, 28, 5);
    //? Gris claro para las líneas de texto.
    ctx.fillStyle = "#aaaaaa";
    //? Repite 3 veces para dibujar 3 líneas de texto.
    for (let i = 0; i < 3; i++) {
      //? Cada línea, 6 píxeles más abajo que la anterior.
      ctx.fillRect(-14, -1 + i * 6, 28, 2);
    }
  },
  //? Dibujo de la caja de cartón.
  caja: function () {
    //? Marrón claro (color cartón).
    ctx.fillStyle = "#c8925a";
    //? La caja.
    ctx.fillRect(-18, -14, 36, 28);
    //? Marrón más oscuro para las solapas.
    ctx.fillStyle = "#a8743f";
    //? Solapas de arriba.
    ctx.fillRect(-18, -14, 36, 6);
    //? Color de la cinta adhesiva.
    ctx.fillStyle = "#e8c48c";
    //? Tira de cinta en el centro.
    ctx.fillRect(-3, -14, 6, 28);
  },
  //? Dibujo de la botella de vidrio.
  botellaVidrio: function () {
    //? Verde botella.
    ctx.fillStyle = "#2e8b57";
    ctx.beginPath();
    //? Cuerpo de la botella.
    ctx.roundRect(-10, -8, 20, 28, 5);
    ctx.fill();
    //? Cuello largo (las botellas de vidrio suelen tenerlo).
    ctx.fillRect(-4, -24, 8, 17);
    //? Blanco semitransparente para el brillo.
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    //? Reflejo de luz en el lateral: da sensación de cristal.
    ctx.fillRect(-6, -4, 3, 18);
  },
  //? Dibujo del tarro de vidrio con mermelada.
  tarro: function () {
    //? Vidrio verdoso transparente.
    ctx.fillStyle = "rgba(170, 220, 200, 0.85)";
    ctx.beginPath();
    //? El tarro.
    ctx.roundRect(-14, -12, 28, 30, 6);
    ctx.fill();
    //? Rojo para la mermelada.
    ctx.fillStyle = "#c0392b";
    ctx.beginPath();
    //? La mermelada, en la parte de abajo del tarro.
    ctx.roundRect(-11, 0, 22, 15, 4);
    ctx.fill();
    //? Gris para la tapa metálica.
    ctx.fillStyle = "#95a5a6";
    //? La tapa.
    ctx.fillRect(-15, -18, 30, 7);
  },
  //? Dibujo de la cáscara de plátano.
  platano: function () {
    //? Amarillo plátano para la línea.
    ctx.strokeStyle = "#f4d03f";
    //? Línea muy gruesa (9 píxeles): así un arco parece un plátano.
    ctx.lineWidth = 9;
    //? Los extremos de la línea serán redondeados.
    ctx.lineCap = "round";
    ctx.beginPath();
    //? Un arco (trozo de círculo) de radio 22 desde 0.5 hasta 2.6 radianes: la curva del plátano.
    ctx.arc(0, -12, 22, 0.5, 2.6);
    ctx.stroke();
    //? Volvemos a los extremos normales (rectos) para no afectar a otros dibujos.
    ctx.lineCap = "butt";
    //? Marrón para las puntas.
    ctx.fillStyle = "#6e4b1f";
    ctx.beginPath();
    //? Punta derecha del plátano (un círculo pequeño en el inicio del arco).
    ctx.arc(Math.cos(0.5) * 22, -12 + Math.sin(0.5) * 22, 4, 0, Math.PI * 2);
    ctx.fill();
  },
  //? Dibujo de la manzana mordida.
  manzana: function () {
    //? Rojo manzana.
    ctx.fillStyle = "#e74c3c";
    ctx.beginPath();
    //? La manzana: un círculo de radio 16.
    ctx.arc(0, 2, 16, 0, Math.PI * 2);
    ctx.fill();
    //? Color crema: el interior de la manzana.
    ctx.fillStyle = "#fdf2e0";
    ctx.beginPath();
    //? El mordisco: un círculo color crema en el borde derecho.
    ctx.arc(15, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    //? Marrón para el rabito.
    ctx.fillStyle = "#6e4b1f";
    //? El rabito.
    ctx.fillRect(-2, -20, 4, 9);
    //? Verde para la hoja.
    ctx.fillStyle = "#27ae60";
    ctx.beginPath();
    //? La hoja: una elipse (círculo estirado) de 7 × 3.5, girada -0.5 radianes.
    ctx.ellipse(6, -17, 7, 3.5, -0.5, 0, Math.PI * 2);
    ctx.fill();
  },
};
//#]
//#[8

// ---------- ATRAPAR Y PUNTUAR ----------

//> **¿El residuo tocó la boca del contenedor?** Comprobamos dos cosas: que esté encima horizontalmente y que su parte de abajo haya llegado a la boca.
//? Declara la función tocaContenedor. Devolverá true (sí lo toca) o false (no).
function tocaContenedor(r) {
  //? Altura de la boca del contenedor.
  const boca = contenedor.y - contenedor.alto;
  //? ¿Está encima en horizontal? Math.abs da la distancia sin signo entre los dos centros; debe ser menor que medio contenedor.
  const dentroX = Math.abs(r.x - contenedor.x) < contenedor.ancho / 2;
  //? ¿Está a la altura de la boca? Su borde inferior (y + radio) pasó la boca, pero su centro aún no bajó más de 30 píxeles. && significa "y además".
  const dentroY = r.y + r.radio > boca && r.y < boca + 30;
  //? Solo lo toca si se cumplen las dos condiciones.
  return dentroX && dentroY;
}

//> **Acierto o error.** Si el tipo del residuo coincide con el del contenedor, sumamos puntos; si no, perdemos una vida.
//? Declara la función atrapar: recibe el residuo que acaba de entrar.
function atrapar(r) {
  //? ¿El contenedor correcto del residuo es el que tenemos activo?
  if (r.modelo.tipo === contenedor.tipo) {
    //? Un acierto más seguido.
    combo += 1;
    //? Puntos ganados: 10 por el combo, como máximo x5 (Math.min elige el menor). Con 3 seguidos: 10 × 3 = 30.
    const ganados = 10 * Math.min(combo, 5);
    //? Los sumamos al marcador.
    puntos += ganados;
    //#[9
    //? Muestra "+30" (por ejemplo) flotando en verde.
    crearTextoFlotante("+" + ganados, r.x, r.y - 20, "#b9ff66");
    //#]
    //#[10
    //? Separar bien limpia un poquito el planeta (3 %), sin bajar de 0.
    contaminacion = Math.max(0, contaminacion - 3);
    //#]
    //#[11
    //? Lanza 18 partículas del color del contenedor desde la boca.
    crearParticulas(r.x, contenedor.y - contenedor.alto, TIPOS[contenedor.tipo].color, 18);
    //? Suena la melodía de acierto.
    sonidoAcierto();
    //#]
    //#[12
    //? Suma un acierto a las estadísticas.
    aciertos += 1;
    //#]
    //? Si NO coincide (else = "si no")...
  } else {
    //? ...se rompe la racha...
    combo = 0;
    //? ...y perdemos una vida.
    vidas -= 1;
    //#[9
    //? Texto flotante rojo de error.
    crearTextoFlotante("¡Contenedor equivocado!", r.x, r.y - 20, "#ff7675");
    //? Muestra el cartel con el consejo de este residuo.
    mostrarConsejo(r.modelo);
    //#]
    //#[11
    //? Partículas grises (de "humo").
    crearParticulas(r.x, contenedor.y - contenedor.alto, "#636e72", 12);
    //? Sonido grave de error.
    sonidoError();
    //#]
    //#[12
    //? Suma un fallo a las estadísticas.
    fallos += 1;
    //#]
  }
}
//#]
//#[10

//> **Un residuo cayó al suelo.** No quita vidas, pero contamina el planeta un 10 %. Si la contaminación llega al 100 %, se acaba la partida.
//? Declara la función residuoPerdido.
function residuoPerdido(r) {
  //? Dejarlo caer también rompe la racha.
  combo = 0;
  //? Sube la contaminación 10 puntos, sin pasar de 100 (Math.min elige el menor).
  contaminacion = Math.min(100, contaminacion + 10);
  //? Guarda el residuo en la lista de basura del suelo, con su posición y su giro.
  basuraSuelo.push({ x: r.x, giro: r.giro, modelo: r.modelo });
  //? Si hay más de 25 en el suelo, quita el más antiguo (shift borra el primero de la lista). Así no se acumulan sin fin.
  if (basuraSuelo.length > 25) basuraSuelo.shift();
  //? Avisa con un texto flotante.
  crearTextoFlotante("¡Al suelo! +10 % contaminación", r.x, ALTO - 80, "#ffeaa7");
  //#[11
  //? Sonido de "caída".
  sonidoPerdido();
  //#]
  //#[12
  //? Suma un perdido a las estadísticas.
  perdidos += 1;
  //#]
}
//#]
//#[9

// ---------- TEXTOS, CONSEJOS Y MARCADOR ----------

//> **Textos flotantes.** Son mensajes cortos que suben y se desvanecen en poco más de un segundo.
//? Declara la función crearTextoFlotante: recibe el texto, la posición y el color.
function crearTextoFlotante(texto, x, y, color) {
  //? Añade un texto a la lista. Limitamos la x entre 170 y ANCHO - 170 para que los textos largos no se corten en los bordes. vida = 1.2 segundos.
  textosFlotantes.push({ texto: texto, x: Math.min(Math.max(x, 170), ANCHO - 170), y: y, color: color, vida: 1.2 });
}

//? Declara la función actualizarTextos: mueve los textos y descuenta el tiempo del consejo.
function actualizarTextos(dt) {
  //? Para cada texto flotante t...
  for (const t of textosFlotantes) {
    //? ...lo sube 45 píxeles por segundo...
    t.y -= 45 * dt;
    //? ...y le resta vida.
    t.vida -= dt;
  }
  //? filter crea una lista nueva solo con los textos que aún tienen vida (los demás desaparecen).
  textosFlotantes = textosFlotantes.filter(function (t) { return t.vida > 0; });
  //? Si el consejo está visible, le descontamos tiempo.
  if (consejo.tiempo > 0) consejo.tiempo -= dt;
}

//? Declara la función dibujarTextos.
function dibujarTextos() {
  //? Para cada texto flotante...
  for (const t of textosFlotantes) {
    //? ...su opacidad es su vida (cuando le queda menos de 1 segundo se va haciendo transparente).
    ctx.globalAlpha = Math.min(1, t.vida);
    //? ...y lo escribimos a 20 píxeles.
    escribir(t.texto, t.x, t.y, 20, t.color);
  }
  //? Volvemos a la opacidad normal.
  ctx.globalAlpha = 1;
}

//> **El cartel de consejo.** Al equivocarse, el juego explica dónde va ese residuo. ¡Aquí está la parte educativa!
//? Declara la función mostrarConsejo: recibe el modelo del residuo en el que nos equivocamos.
function mostrarConsejo(modelo) {
  //? El título dice qué residuo era.
  consejo.titulo = "¡Ups! " + modelo.nombre + " no va ahí.";
  //? El texto es el consejo del catálogo.
  consejo.texto = modelo.consejo;
  //? El cartel se verá 3.5 segundos.
  consejo.tiempo = 3.5;
}

//? Declara la función dibujarConsejo.
function dibujarConsejo() {
  //? Si no le queda tiempo, no dibujamos nada.
  if (consejo.tiempo <= 0) return;
  //? En el último segundo se desvanece poco a poco.
  ctx.globalAlpha = Math.min(1, consejo.tiempo);
  //? Fondo del cartel: verde muy oscuro casi opaco.
  ctx.fillStyle = "rgba(20, 30, 25, 0.88)";
  ctx.beginPath();
  //? Rectángulo redondeado de lado a lado (con 70 píxeles de margen).
  ctx.roundRect(70, 200, ANCHO - 140, 80, 14);
  ctx.fill();
  //? Título en rosa-rojo.
  escribir(consejo.titulo, ANCHO / 2, 225, 20, "#ff7675");
  //? Consejo en blanco.
  escribir(consejo.texto, ANCHO / 2, 256, 17, "white");
  //? Opacidad normal.
  ctx.globalAlpha = 1;
}

//> **El marcador (HUD).** HUD significa "Head-Up Display": la información que se ve encima del juego (puntos, vidas, combo...).
//? Declara la función dibujarHUD.
function dibujarHUD() {
  //? Puntos arriba a la izquierda, alineados a la izquierda ("left").
  escribir("Puntos: " + puntos, 20, 30, 24, "white", "left");
  //? Dibujamos 3 corazones...
  for (let i = 0; i < 3; i++) {
    //? ...separados 34 píxeles. Están "llenos" solo si i es menor que las vidas (con 2 vidas: el 0 y el 1 llenos, el 2 vacío).
    dibujarCorazon(32 + i * 34, 68, 12, i < vidas);
  }
  //? Si llevamos 2 o más aciertos seguidos, lo celebramos en el centro.
  if (combo >= 2) escribir("¡Combo x" + Math.min(combo, 5) + "!", ANCHO / 2, 30, 24, "#fdcb6e");
  //#[10
  //? Título de la barra de contaminación, alineado a la derecha.
  escribir("Contaminación", ANCHO - 20, 20, 16, "white", "right");
  //? Fondo oscuro de la barra.
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  //? La barra mide 200 píxeles de ancho y 16 de alto.
  ctx.fillRect(ANCHO - 220, 34, 200, 16);
  //? El relleno pasa de verde a morado según la contaminación.
  ctx.fillStyle = mezclarColor("#2ecc71", "#8e44ad", contaminacion / 100);
  //? El ancho del relleno es 2 × contaminación: con 50 % mide 100 píxeles (la mitad).
  ctx.fillRect(ANCHO - 220, 34, 2 * contaminacion, 16);
  //? Borde blanco.
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  //? Dibuja el contorno de la barra.
  ctx.strokeRect(ANCHO - 220, 34, 200, 16);
  //#]
  //#[12
  //? Nivel y récord debajo de la barra.
  escribir("Nivel " + nivel + "  ·  Récord " + record, ANCHO - 20, 68, 15, "white", "right");
  //#]
}

//> **Un corazón con curvas.** Las curvas de Bézier se doblan hacia unos "puntos de control", como si tiraran de la línea.
//? Declara la función dibujarCorazon: posición, tamaño y si está lleno (true) o vacío (false).
function dibujarCorazon(x, y, tam, lleno) {
  //? Rosa si está lleno; blanco muy transparente si está vacío.
  ctx.fillStyle = lleno ? "#e84393" : "rgba(255, 255, 255, 0.3)";
  ctx.beginPath();
  //? Empezamos en la punta de abajo del corazón.
  ctx.moveTo(x, y + tam);
  //? Curva por la izquierda hasta el hueco de arriba. Los 4 primeros números son dos puntos de control; los 2 últimos, el punto final.
  ctx.bezierCurveTo(x - tam * 1.8, y - tam * 0.2, x - tam * 0.7, y - tam * 1.4, x, y - tam * 0.4);
  //? Curva simétrica por la derecha, de vuelta a la punta.
  ctx.bezierCurveTo(x + tam * 0.7, y - tam * 1.4, x + tam * 1.8, y - tam * 0.2, x, y + tam);
  ctx.fill();
}
//#]
//#[11

// ---------- EFECTOS: PARTÍCULAS Y SONIDO ----------

//> **Partículas.** Muchos cuadraditos que salen disparados en todas direcciones y caen por la gravedad. Es un truco sencillo que hace que el juego "se sienta" mucho mejor.
//? Declara la función crearParticulas: posición de salida, color y cuántas crear.
function crearParticulas(x, y, color, cantidad) {
  //? Repite tantas veces como partículas queremos.
  for (let i = 0; i < cantidad; i++) {
    //? Dirección al azar: cualquier ángulo de la vuelta completa.
    const angulo = Math.random() * Math.PI * 2;
    //? Rapidez al azar entre 60 y 240 píxeles por segundo.
    const rapidez = 60 + Math.random() * 180;
    //? Añade la partícula a la lista.
    particulas.push({
      //? Posición inicial.
      x: x,
      //? Posición vertical inicial.
      y: y,
      //? Velocidad horizontal: el coseno del ángulo por la rapidez.
      vx: Math.cos(angulo) * rapidez,
      //? Velocidad vertical: el seno por la rapidez, con un empujón extra de 80 hacia arriba (y negativa = arriba).
      vy: Math.sin(angulo) * rapidez - 80,
      //? Vivirá entre 0.6 y 1 segundo.
      vida: 0.6 + Math.random() * 0.4,
      //? Su color.
      color: color,
      //? Tamaño entre 3 y 7 píxeles.
      tam: 3 + Math.random() * 4,
    });
  }
}

//? Declara la función actualizarParticulas.
function actualizarParticulas(dt) {
  //? Para cada partícula p...
  for (const p of particulas) {
    //? ...avanza en horizontal...
    p.x += p.vx * dt;
    //? ...avanza en vertical...
    p.y += p.vy * dt;
    //? ...la gravedad aumenta su velocidad hacia abajo 400 píxeles por segundo cada segundo...
    p.vy += 400 * dt;
    //? ...y pierde vida.
    p.vida -= dt;
  }
  //? Nos quedamos solo con las que siguen vivas.
  particulas = particulas.filter(function (p) { return p.vida > 0; });
}

//? Declara la función dibujarParticulas.
function dibujarParticulas() {
  //? Para cada partícula...
  for (const p of particulas) {
    //? ...se desvanece en su último medio segundo (vida × 2, limitado entre 0 y 1)...
    ctx.globalAlpha = Math.max(0, Math.min(1, p.vida * 2));
    //? ...con su color...
    ctx.fillStyle = p.color;
    //? ...dibujamos un cuadradito centrado en su posición.
    ctx.fillRect(p.x - p.tam / 2, p.y - p.tam / 2, p.tam, p.tam);
  }
  //? Opacidad normal.
  ctx.globalAlpha = 1;
}

//> **Sonidos sin archivos.** El navegador trae un sintetizador: la Web Audio API. Un "oscilador" genera un tono y un "control de volumen" (gain) lo apaga poco a poco. Así no necesitamos descargar ningún sonido.
//? Declara la función sonido: frecuencia (en hercios: más alto = más agudo), duración en segundos, forma de la onda y volumen.
function sonido(frecuencia, duracion, tipoOnda, volumen) {
  //? Si todavía no existe el motor de sonido, lo creamos (window.webkitAudioContext es para Safari antiguos).
  if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
  //? Los navegadores dejan el sonido en pausa hasta que el usuario toca algo; aquí lo reanudamos.
  if (audio.state === "suspended") audio.resume();
  //? Crea un oscilador: el "instrumento" que produce el tono.
  const oscilador = audio.createOscillator();
  //? Crea un control de volumen.
  const volumenNodo = audio.createGain();
  //? Forma de la onda: "sine" (suave), "square" (de videojuego antiguo), "sawtooth" (áspera) o "triangle".
  oscilador.type = tipoOnda;
  //? La nota que suena.
  oscilador.frequency.value = frecuencia;
  //? El volumen empieza en el valor indicado justo ahora (audio.currentTime es el reloj del sonido).
  volumenNodo.gain.setValueAtTime(volumen, audio.currentTime);
  //? Y baja casi a 0 de forma natural cuando termina la duración (como una cuerda que deja de vibrar).
  volumenNodo.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duracion);
  //? Conecta el oscilador al control de volumen.
  oscilador.connect(volumenNodo);
  //? Conecta el control de volumen a los altavoces (destination).
  volumenNodo.connect(audio.destination);
  //? Empieza a sonar.
  oscilador.start();
  //? Programa que deje de sonar al acabar la duración.
  oscilador.stop(audio.currentTime + duracion);
}

//? Sonido de acierto: dos notas que suben (660 y luego 880 hercios).
function sonidoAcierto() {
  //? Primera nota.
  sonido(660, 0.12, "square", 0.12);
  //? setTimeout ejecuta la función 80 milisegundos más tarde: la segunda nota.
  setTimeout(function () { sonido(880, 0.15, "square", 0.12); }, 80);
}

//? Sonido de error: una nota grave y áspera.
function sonidoError() {
  //? Nota grave (140 hercios), áspera (onda "sawtooth"), de 0.35 segundos.
  sonido(140, 0.35, "sawtooth", 0.18);
}

//? Sonido de residuo perdido: una nota que suena "hueca".
function sonidoPerdido() {
  //? Nota media (220 hercios), suave (onda "triangle"), de 0.25 segundos.
  sonido(220, 0.25, "triangle", 0.2);
}
//#]
//#[12

// ---------- ESTADOS: MENÚ, PARTIDA Y FIN ----------

//> **Empezar (o reiniciar) una partida.** Ponemos todas las variables como al principio.
//? Declara la función empezarPartida.
function empezarPartida() {
  //? Pasamos al estado "jugando".
  estado = "jugando";
  //? Reiniciamos los puntos...
  puntos = 0;
  //? ...las vidas...
  vidas = 3;
  //? ...el combo...
  combo = 0;
  //? ...el nivel...
  nivel = 1;
  //? ...y la contaminación.
  contaminacion = 0;
  //? Vaciamos todas las listas.
  residuos = [];
  //? Vaciamos la basura del suelo.
  basuraSuelo = [];
  //? Vaciamos los textos flotantes.
  textosFlotantes = [];
  //? Vaciamos las partículas.
  particulas = [];
  //? Ponemos a cero las estadísticas.
  aciertos = 0;
  //? Fallos a cero.
  fallos = 0;
  //? Perdidos a cero.
  perdidos = 0;
  //? Volvemos a la dificultad inicial.
  velocidadCaida = 120;
  //? Intervalo de aparición inicial.
  intervaloAparicion = 1.4;
  //? El primer residuo aparecerá en medio segundo.
  tiempoParaSiguiente = 0.5;
  //? Ocultamos el cartel de consejo.
  consejo.tiempo = 0;
  //? El contenedor vuelve al centro.
  contenedor.x = ANCHO / 2;
  //? Todavía no hay récord nuevo.
  nuevoRecord = false;
}

//> **Subir de nivel.** Cada 150 puntos el juego se vuelve más rápido: los residuos caen antes y más deprisa.
//? Declara la función actualizarDificultad.
function actualizarDificultad() {
  //? Calcula qué nivel corresponde a los puntos: 0-149 → 1, 150-299 → 2, etc.
  const nivelNuevo = 1 + Math.floor(puntos / 150);
  //? Si hemos subido...
  if (nivelNuevo > nivel) {
    //? ...guardamos el nivel nuevo...
    nivel = nivelNuevo;
    //? ...caen 25 píxeles por segundo más rápido por cada nivel...
    velocidadCaida = 120 + (nivel - 1) * 25;
    //? ...y aparecen más a menudo (pero nunca más de uno cada 0.45 segundos).
    intervaloAparicion = Math.max(0.45, 1.4 - (nivel - 1) * 0.12);
    //? Lo anunciamos.
    crearTextoFlotante("¡Nivel " + nivel + "!", ANCHO / 2, 160, "#74b9ff");
    //? Con un sonido.
    sonido(520, 0.3, "triangle", 0.15);
  }
}

//? Declara la función comprobarFin: mira si se ha perdido la partida.
function comprobarFin() {
  //? Sin vidas: se acabó.
  if (vidas <= 0) terminarPartida("¡Te quedaste sin vidas!");
  //? O planeta contaminado del todo: también se acabó.
  else if (contaminacion >= 100) terminarPartida("¡El planeta se llenó de basura!");
}

//? Declara la función terminarPartida: recibe el motivo del final.
function terminarPartida(motivo) {
  //? Pasamos al estado "fin".
  estado = "fin";
  //? Guardamos el motivo para mostrarlo.
  motivoFin = motivo;
  //? Elegimos un dato curioso al azar.
  datoFinal = DATOS_CURIOSOS[Math.floor(Math.random() * DATOS_CURIOSOS.length)];
  //? Si hemos superado el récord...
  if (puntos > record) {
    //? ...lo actualizamos...
    record = puntos;
    //? ...marcamos que es nuevo...
    nuevoRecord = true;
    //? ...y lo guardamos en la memoria del navegador.
    guardarRecord(record);
  }
  //? Sonido grave de final.
  sonido(180, 0.6, "sawtooth", 0.18);
}

//> **Guardar el récord.** localStorage es una pequeña memoria del navegador que se conserva aunque cierres la página. Usamos try/catch ("intenta / si falla") porque algunos navegadores la bloquean, y así el juego no se rompe.
//? Declara la función leerRecord.
function leerRecord() {
  //? Intentamos...
  try {
    //? ...leer el valor guardado con el nombre "ecocaza_record" y convertirlo a número. Si no hay nada, Number da 0 (o NaN) y || 0 lo deja en 0.
    return Number(localStorage.getItem("ecocaza_record")) || 0;
    //? Si da error...
  } catch (error) {
    //? ...devolvemos 0.
    return 0;
  }
}

//? Declara la función guardarRecord.
function guardarRecord(valor) {
  //? Intentamos...
  try {
    //? ...guardar el valor como texto (String) con el nombre "ecocaza_record".
    localStorage.setItem("ecocaza_record", String(valor));
    //? Si falla, no hacemos nada (las llaves vacías).
  } catch (error) {}
}

//> **Pantalla de menú.** Una capa oscura encima del juego con el título, la leyenda de los contenedores y cómo empezar.
//? Declara la función dibujarPantallaMenu.
function dibujarPantallaMenu() {
  //? Verde muy oscuro con un 80 % de opacidad: se intuye el juego detrás.
  ctx.fillStyle = "rgba(10, 40, 25, 0.8)";
  //? Cubre todo el lienzo.
  ctx.fillRect(0, 0, ANCHO, ALTO);
  //? El título grande.
  escribir("EcoCaza", ANCHO / 2, 95, 72, "#b9ff66");
  //? El lema.
  escribir("Separa la basura, salva el planeta", ANCHO / 2, 155, 24, "white");
  //? Una columna por cada tipo de contenedor.
  for (let i = 0; i < ORDEN_TIPOS.length; i++) {
    //? Datos del tipo de esta vuelta.
    const t = TIPOS[ORDEN_TIPOS[i]];
    //? Posición x de la columna (igual que los botones del selector).
    const x = SELECTOR.x + i * (SELECTOR.ancho + SELECTOR.separacion);
    //? Color del tipo.
    ctx.fillStyle = t.color;
    ctx.beginPath();
    //? Tarjeta con esquinas redondeadas.
    ctx.roundRect(x, 200, SELECTOR.ancho, 170, 12);
    ctx.fill();
    //? Número de la tecla, grande.
    escribir(String(i + 1), x + SELECTOR.ancho / 2, 228, 30, "white");
    //? Nombre del tipo.
    escribir(t.nombre, x + SELECTOR.ancho / 2, 262, 16, "white");
    //? filter se queda solo con los residuos de este tipo (por ejemplo, los del amarillo).
    const ejemplos = RESIDUOS.filter(function (r) { return r.tipo === ORDEN_TIPOS[i]; });
    //? Escribimos cada ejemplo en una línea (j es la posición en la lista de ejemplos).
    for (let j = 0; j < ejemplos.length; j++) {
      //? Cada línea, 22 píxeles más abajo.
      escribir(ejemplos[j].nombre, x + SELECTOR.ancho / 2, 295 + j * 22, 13, "white");
    }
  }
  //? Instrucciones de control.
  escribir("Muévete con ← → (o el ratón)  ·  Cambia de contenedor con 1 2 3 4", ANCHO / 2, 410, 17, "white");
  //? Explicación de las reglas.
  escribir("Error = pierdes una vida  ·  Al suelo = el planeta se contamina", ANCHO / 2, 440, 17, "#ffeaa7");
  //? El texto parpadea: Math.sin cambia de positivo a negativo; solo lo dibujamos cuando es positivo.
  if (Math.sin(tiempoTotal * 5) > 0) {
    //? Llamada a empezar.
    escribir("Pulsa ESPACIO o haz clic para empezar", ANCHO / 2, 490, 26, "#b9ff66");
  }
  //? Si ya hay récord, lo mostramos.
  if (record > 0) escribir("Récord: " + record, ANCHO / 2, 525, 18, "white");
}

//> **Pantalla final.** Resultados de la partida y un dato curioso sobre reciclaje.
//? Declara la función dibujarPantallaFin.
function dibujarPantallaFin() {
  //? Capa oscura encima del juego.
  ctx.fillStyle = "rgba(10, 40, 25, 0.85)";
  ctx.fillRect(0, 0, ANCHO, ALTO);
  //? Título.
  escribir("Fin de la partida", ANCHO / 2, 90, 52, "#b9ff66");
  //? Motivo (sin vidas o planeta contaminado).
  escribir(motivoFin, ANCHO / 2, 145, 24, "#ffeaa7");
  //? Puntos conseguidos, bien grandes.
  escribir("Puntos: " + puntos, ANCHO / 2, 205, 40, "white");
  //? Si hay récord nuevo lo celebramos; si no, mostramos el récord actual. (Operador ? : otra vez.)
  escribir(nuevoRecord ? "¡NUEVO RÉCORD!" : "Récord: " + record, ANCHO / 2, 250, 22, nuevoRecord ? "#fdcb6e" : "white");
  //? Total de residuos que llegaron abajo (bien, mal o al suelo).
  const total = aciertos + fallos + perdidos;
  //? Porcentaje de acierto. Si total es 0 evitamos dividir entre 0 y ponemos 0.
  const precision = total > 0 ? Math.round((aciertos / total) * 100) : 0;
  //? Estadísticas.
  escribir("Bien separados: " + aciertos + "   ·   Equivocados: " + fallos + "   ·   Al suelo: " + perdidos, ANCHO / 2, 300, 18, "white");
  //? Precisión.
  escribir("Precisión: " + precision + " %", ANCHO / 2, 332, 20, "white");
  //? Mensaje según lo bien que lo hiciste.
  let mensaje = "Sigue practicando: cada residuo bien separado cuenta.";
  //? Con 50 % o más...
  if (precision >= 50) mensaje = "¡Vas bien! Repasa los consejos y lo harás aún mejor.";
  //? Con 80 % o más...
  if (precision >= 80) mensaje = "¡Eres un experto del reciclaje!";
  //? Escribimos el mensaje elegido.
  escribir(mensaje, ANCHO / 2, 372, 20, "#b9ff66");
  //? El dato curioso.
  escribir("¿Sabías que...? " + datoFinal, ANCHO / 2, 425, 15, "#dfe6e9");
  //? Llamada a volver a jugar, parpadeando.
  if (Math.sin(tiempoTotal * 5) > 0) {
    //? Texto para volver a jugar.
    escribir("Pulsa ESPACIO o haz clic para jugar otra vez", ANCHO / 2, 490, 24, "#b9ff66");
  }
}
//#]
//#[4

// ---------- CONTROLES ----------

//> **Escuchar el teclado.** addEventListener le dice al navegador: "cuando pase esto, ejecuta esta función". Apuntamos cada tecla al pulsarla (keydown) y la borramos al soltarla (keyup).
//? Cuando se pulse una tecla en la página, ejecuta esta función. evento trae la información de la tecla pulsada.
document.addEventListener("keydown", function (evento) {
  //? Apunta que esta tecla está pulsada. evento.code es el nombre de la tecla, como "ArrowLeft" o "KeyA".
  teclas[evento.code] = true;
  //#[5
  //? Busca la tecla en la lista de números. "Numpad1" (teclado numérico) se convierte en "Digit1" con replace. indexOf da la posición (0 a 3) o -1 si no está.
  const indice = ["Digit1", "Digit2", "Digit3", "Digit4"].indexOf(evento.code.replace("Numpad", "Digit"));
  //? Si era un número del 1 al 4 (es decir, el índice no es -1), cambiamos al tipo correspondiente.
  if (indice !== -1) cambiarTipo(ORDEN_TIPOS[indice]);
  //#]
  //#[12
  //? Con ESPACIO, si no estamos jugando (menú o fin), empieza una partida.
  if (evento.code === "Space" && estado !== "jugando") empezarPartida();
  //#]
  //? Evita que las flechas y el espacio hagan scroll en la página mientras jugamos.
  if (evento.code.startsWith("Arrow") || evento.code === "Space") evento.preventDefault();
});

//? Cuando se suelte una tecla...
document.addEventListener("keyup", function (evento) {
  //? ...apuntamos que ya no está pulsada.
  teclas[evento.code] = false;
});
//#]
//#[13

//> **Ratón y pantalla táctil.** Los "pointer events" funcionan igual con ratón, dedo o lápiz. Como el lienzo puede verse más pequeño (en un móvil), convertimos la posición de la pantalla a coordenadas del juego.
//? Declara la función posicionEnLienzo: traduce la posición del evento a coordenadas del lienzo (de 0 a 800 y de 0 a 600).
function posicionEnLienzo(evento) {
  //? getBoundingClientRect nos dice dónde está el lienzo en la pantalla y cuánto mide ahora.
  const rect = lienzo.getBoundingClientRect();
  //? Devolvemos un objeto con x e y.
  return {
    //? Restamos el borde izquierdo y escalamos: si el lienzo se ve a 400 píxeles de ancho, cada píxel de pantalla vale 2 del juego.
    x: (evento.clientX - rect.left) * (ANCHO / rect.width),
    //? Lo mismo en vertical.
    y: (evento.clientY - rect.top) * (ALTO / rect.height),
  };
}

//? Cuando se haga clic o se toque el lienzo...
lienzo.addEventListener("pointerdown", function (evento) {
  //? ...si estamos en el menú o en el fin, empieza la partida y salimos.
  if (estado !== "jugando") {
    //? Empieza una partida nueva.
    empezarPartida();
    return;
  }
  //? Calculamos dónde se tocó.
  const p = posicionEnLienzo(evento);
  //? Si se tocó en la zona de los botones (abajo)...
  if (p.y >= SELECTOR.y - 6) {
    //? ...calculamos qué botón es dividiendo la distancia entre el ancho de cada botón (con su separación).
    const indice = Math.floor((p.x - SELECTOR.x) / (SELECTOR.ancho + SELECTOR.separacion));
    //? Si es un botón válido (0 a 3), cambiamos de tipo.
    if (indice >= 0 && indice < ORDEN_TIPOS.length) cambiarTipo(ORDEN_TIPOS[indice]);
    //? Y salimos (tocar un botón no mueve el contenedor).
    return;
  }
  //? Si se tocó en otro sitio, el contenedor irá hacia allí.
  contenedor.objetivoX = p.x;
});

//? Cuando el ratón o el dedo se muevan sobre el lienzo...
lienzo.addEventListener("pointermove", function (evento) {
  //? ...si es un ratón, o si hay un botón o dedo apretado...
  if (evento.pointerType === "mouse" || evento.buttons > 0) {
    //? ...calculamos la posición...
    const p = posicionEnLienzo(evento);
    //? ...y si no está sobre los botones, esa x es el nuevo objetivo.
    if (p.y < SELECTOR.y - 6) contenedor.objetivoX = p.x;
  }
});
//#]
//#[2

// ---------- EL BUCLE DEL JUEGO ----------

//> **El corazón del juego: el bucle.** Un videojuego es como una película: muchas imágenes por segundo. En cada imagen (fotograma) hacemos dos cosas: actualizar (mover y calcular) y dibujar. requestAnimationFrame le pide al navegador que vuelva a llamar a bucle en el siguiente fotograma (unas 60 veces por segundo).
//? Declara la función bucle. El navegador le pasa tiempoActual: los milisegundos desde que se abrió la página.
function bucle(tiempoActual) {
  //? dt = segundos desde el fotograma anterior (dividimos entre 1000 porque 1 segundo = 1000 ms). Si la pestaña estuvo en segundo plano, limitamos dt a 0.05 para que nada dé un salto enorme.
  const dt = Math.min((tiempoActual - tiempoAnterior) / 1000, 0.05);
  //? Guardamos el tiempo de este fotograma para la próxima vez.
  tiempoAnterior = tiempoActual;
  //? Paso 1: actualizar el mundo.
  actualizar(dt);
  //? Paso 2: dibujarlo.
  dibujar();
  //? Pide al navegador que llame otra vez a bucle en el siguiente fotograma. ¡Así el bucle nunca termina!
  requestAnimationFrame(bucle);
}

//> **Actualizar.** Aquí se llama, en orden, a todas las funciones que mueven o calculan cosas.
//? Declara la función actualizar.
function actualizar(dt) {
  //? Suma el tiempo transcurrido al total.
  tiempoTotal += dt;
  //#[11
  //? Mueve las partículas.
  actualizarParticulas(dt);
  //#]
  //#[9
  //? Mueve los textos flotantes y el temporizador del consejo.
  actualizarTextos(dt);
  //#]
  //#[12
  //? Si no estamos jugando (menú o fin), no movemos nada más: return sale de la función.
  if (estado !== "jugando") return;
  //#]
  //#[4
  //? Mueve el contenedor.
  actualizarContenedor(dt);
  //#]
  //#[6
  //? Crea y mueve los residuos.
  actualizarResiduos(dt);
  //#]
  //#[12
  //? Sube de nivel si toca.
  actualizarDificultad();
  //? Comprueba si se ha perdido.
  comprobarFin();
  //#]
}

//> **Dibujar.** El orden importa: lo que se dibuja después queda encima. Primero el fondo, al final los menús.
//? Declara la función dibujar.
function dibujar() {
  //? 1) El fondo (también borra el fotograma anterior).
  dibujarFondo();
  //#[10
  //? 2) La basura tirada en el césped.
  dibujarBasuraSuelo();
  //#]
  //#[6
  //? 3) Cada residuo que está cayendo.
  for (const r of residuos) dibujarResiduo(r);
  //#]
  //#[3
  //? 4) El contenedor (encima de los residuos).
  dibujarContenedor();
  //#]
  //#[11
  //? 5) Las partículas.
  dibujarParticulas();
  //#]
  //#[9
  //? 6) Los textos flotantes.
  dibujarTextos();
  //#]
  //#[8-8
  //? Marcador PROVISIONAL (en el paso 9 lo cambiamos por uno más bonito).
  escribir("Puntos: " + puntos + "    Vidas: " + vidas, 20, 30, 22, "white", "left");
  //#]
  //#[9
  //? 7) El marcador.
  dibujarHUD();
  //#]
  //#[5
  //? 8) Los botones del selector.
  dibujarSelector();
  //#]
  //#[9
  //? 9) El cartel de consejo (encima de casi todo).
  dibujarConsejo();
  //#]
  //#[12
  //? 10) Si estamos en el menú, su pantalla.
  if (estado === "menu") dibujarPantallaMenu();
  //? 11) Si estamos en el fin, su pantalla.
  if (estado === "fin") dibujarPantallaFin();
  //#]
}

//#[12
//? Antes de arrancar, leemos el récord guardado.
record = leerRecord();
//#]
//? ¡Arranca el juego! Pedimos el primer fotograma; a partir de aquí el bucle se repite solo.
requestAnimationFrame(bucle);
//#]
