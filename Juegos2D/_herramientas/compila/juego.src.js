// ===================================================
//  ¡Compila! - El roguelike de cartas donde tu mano
//  es un programa. HTML5 Canvas + JavaScript puro
// ===================================================

//> **El lienzo y el pincel.** Como en todo juego con canvas: buscamos el lienzo del HTML y pedimos su contexto 2D, el objeto con todas las órdenes de dibujo.
//? Busca en la página el elemento con id="lienzo" y lo guarda en la constante lienzo.
const lienzo = document.getElementById("lienzo");
//? Pide al lienzo su "contexto 2D": el pincel con el que dibujaremos. Por costumbre se llama ctx.
const ctx = lienzo.getContext("2d");
//? Ancho del lienzo (800 píxeles), guardado en una constante para usarlo en todo el código.
const ANCHO = lienzo.width;
//? Alto del lienzo (600 píxeles).
const ALTO = lienzo.height;

//#[1-1
//> **Prueba de vida.** Pintamos el fondo y un saludo para comprobar que el HTML y el JavaScript están conectados. En el paso 2 borraremos estas líneas.
//? Color de relleno: azul noche (formato hexadecimal #RRGGBB).
ctx.fillStyle = "#14112b";
//? Pinta todo el lienzo: un rectángulo desde (0, 0) con todo el ancho y alto.
ctx.fillRect(0, 0, ANCHO, ALTO);
//? Color del texto: morado claro.
ctx.fillStyle = "#c77dff";
//? Letra: negrita, 40 píxeles, Arial.
ctx.font = "bold 40px Arial";
//? Centrar el texto horizontalmente en el punto que le demos.
ctx.textAlign = "center";
//? Escribe el saludo en el centro del lienzo.
ctx.fillText("¡Hola, Compila!", ANCHO / 2, ALTO / 2);
//#]

//#[3
// ---------- DATOS DE LAS CARTAS ----------

//> **Los cinco tipos de carta.** Cada carta es una instrucción de programación. Guardamos el color y el nombre de cada tipo en un objeto, para cambiarlos fácilmente en un solo sitio.
//? Crea el objeto TIPOS_CARTA: un apartado por cada tipo, con su color y su nombre.
const TIPOS_CARTA = {
  //? Suma: x += n (azul claro).
  suma: { color: "#4cc9f0", nombre: "Suma" },
  //? Multiplicación: x *= n (naranja).
  mult: { color: "#f8961e", nombre: "Multiplica" },
  //? Cuadrado: x = x * x (morado). La más poderosa.
  cuadrado: { color: "#c77dff", nombre: "Cuadrado" },
  //? Bucle: repite la siguiente carta (verde).
  repetir: { color: "#52b788", nombre: "Bucle" },
  //? Condicional: si x es par, la multiplica por 3 (rosa).
  siPar: { color: "#f72585", nombre: "Condición" },
};
//? Ancho de una carta en píxeles.
const CARTA_ANCHO = 86;
//? Alto de una carta en píxeles.
const CARTA_ALTO = 116;
//#]
//#[4
//? Altura (y) a la que se dibuja la fila de cartas de la mano.
const MANO_Y = 410;
//#]
//#[6
//? Posición y tamaño del panel del editor de código (donde se ve el programa).
const EDITOR = { x: 246, y: 86, ancho: 542, alto: 294 };
//#]
//#[9
//> **Los exámenes de cada ciclo.** Cada ciclo de la carrera tiene tres exámenes. El tercero es un "jefe" con reglas especiales (paso 10).
//? Nombres de los tres exámenes del ciclo.
const NOMBRES_EXAMEN = ["Práctica calificada 1", "Práctica calificada 2", "Examen parcial"];
//? Puntaje que hay que conseguir en cada examen del ciclo 1. En cada ciclo se multiplica por 1.7.
const BASE_OBJETIVO = [100, 160, 260];
//#]
//#[10
//> **Los jefes: exámenes con reglas especiales.** Como en los juegos de cartas modernos, el último examen de cada ciclo cambia las reglas y obliga a pensar distinto.
//? Lista de jefes posibles. Cada uno tiene un id (para el código), un nombre y su regla (para el jugador).
const JEFES = [
  //? Este anula las cartas de cuadrado.
  { id: "discreta", nombre: "Parcial de Matemática Discreta", regla: "Las cartas x² no hacen nada" },
  //? Este deja menos ejecuciones.
  { id: "sorpresa", nombre: "Examen sorpresa", regla: "Solo tienes 3 ejecuciones" },
  //? Este limita el tamaño del programa.
  { id: "estricto", nombre: "Profesor estricto", regla: "Máximo 4 cartas por programa" },
  //? Este quita los descartes.
  { id: "sinDescartes", nombre: "Examen sin apuntes", regla: "No puedes descartar" },
];
//#]
//#[11
//> **Las librerías: los "comodines" del juego.** Se compran en la tienda con créditos y cambian las reglas a tu favor. Combinarlas bien es la clave para llegar lejos.
//? Lista de todas las librerías: id, icono (un emoji), nombre, qué hace y precio en créditos.
const LIBRERIAS = [
  //? Café: suma 15 al final de cada programa.
  { id: "cafe", icono: "☕", nombre: "Café", texto: "+15 al final de cada programa", precio: 4 },
  //? Pair programming: las sumas valen el doble.
  { id: "pair", icono: "🤝", nombre: "Pair programming", texto: "Las cartas de suma suman el doble", precio: 6 },
  //? Recursión: la última carta se vuelve a ejecutar.
  { id: "recursion", icono: "🔁", nombre: "Recursión", texto: "La última carta se ejecuta otra vez", precio: 6 },
  //? Git: una ejecución más por examen.
  { id: "git", icono: "🌿", nombre: "Git", texto: "+1 ejecución en cada examen", precio: 5 },
  //? Garbage collector: dos descartes más.
  { id: "gc", icono: "🗑️", nombre: "Garbage collector", texto: "+2 descartes en cada examen", precio: 3 },
  //? Copiloto IA: multiplica el resultado final por 1.5.
  { id: "ia", icono: "🤖", nombre: "Copiloto IA", texto: "Multiplica el resultado final ×1.5", precio: 8 },
  //? Apuntes: una carta más en la mano.
  { id: "apuntes", icono: "📚", nombre: "Apuntes", texto: "+1 carta en la mano", precio: 5 },
  //? Optimizador: las multiplicaciones multiplican por uno más.
  { id: "optimizador", icono: "⚡", nombre: "Optimizador", texto: "Las cartas ×n multiplican por n+1", precio: 7 },
];
//#]
//#[13
//? Consejos de programación para la pantalla final. Elegiremos uno al azar.
const CONSEJOS = [
  //? Consejo 1: el orden importa.
  "El orden importa: (5 + 3) × 2 = 16, pero 5 × 2 + 3 = 13. En un programa, igual.",
  //? Consejo 2: crecimiento cuadrático.
  "Elevar al cuadrado crece rapidísimo: por eso un algoritmo O(n²) se vuelve lento con muchos datos.",
  //? Consejo 3: los bucles.
  "Un bucle repite instrucciones: así un programa hace millones de cosas con pocas líneas.",
  //? Consejo 4: los condicionales.
  "Un if hace que el programa decida: el mismo código da resultados distintos según los datos.",
  //? Consejo 5: depurar.
  "Seguir un programa línea a línea anotando las variables se llama 'prueba de escritorio'. ¡Acabas de hacer muchas!",
];
//#]

//#[2
// ---------- ESTADO DEL JUEGO (variables que cambian) ----------

//? Momento (en milisegundos) del fotograma anterior.
let tiempoAnterior = 0;
//? Segundos que lleva el juego funcionando (para animaciones).
let tiempoTotal = 0;
//#]
//#[4
//? El mazo: lista de cartas que quedan por robar.
let mazo = [];
//? La mano: las cartas que tiene el jugador ahora.
let mano = [];
//#]
//#[5
//? Las cartas elegidas para el programa: guardamos su POSICIÓN en la mano, en el orden en que se eligieron.
let seleccion = [];
//? Posición de la carta que está bajo el ratón (-1 = ninguna).
let cartaBajoRaton = -1;
//#]
//#[5-12
//? Fase del juego: "seleccion" (eligiendo cartas). Más adelante habrá otras fases.
let fase = "seleccion";
//#]
//#[13
//? Fase del juego: "menu", "seleccion", "ejecutando", "tienda", "fin" o "graduado". Empezamos en el menú.
let fase = "menu";
//#]
//#[7
//? La ejecución en curso (el programa que se está "corriendo" paso a paso). null = ninguna.
let ejecucion = null;
//#]
//#[8
//? Puntos acumulados en el examen actual.
let puntaje = 0;
//? Puntos que hay que alcanzar para aprobar.
let objetivo = 300;
//? Programas que aún se pueden ejecutar en este examen.
let ejecuciones = 4;
//? Descartes que quedan en este examen.
let descartes = 3;
//#]
//#[9
//? Ciclo de la carrera (empieza en 1; al pasar el 10 te gradúas).
let ciclo = 1;
//? Examen actual del ciclo: 0, 1 o 2.
let examen = 0;
//? Mensaje grande del centro: título, texto, color y segundos que le quedan.
let mensaje = { titulo: "", texto: "", color: "white", tiempo: 0 };
//#]
//#[10
//? El jefe del examen actual (null si es un examen normal).
let jefe = null;
//#]
//#[11
//? Librerías que ha comprado el jugador (máximo 4).
let librerias = [];
//? Créditos (el dinero del juego).
let creditos = 0;
//? Las librerías que se ofrecen en la tienda ahora mismo.
let ofertas = [];
//#]
//#[12
//? Puntaje que se ve en pantalla: va subiendo poco a poco hasta el real (efecto "contador").
let puntajeMostrado = 0;
//? Lista de partículas.
let particulas = [];
//? Lista de textos flotantes.
let textosFlotantes = [];
//? Intensidad del temblor de pantalla.
let temblor = 0;
//? Motor de sonido (se crea con el primer sonido).
let audio = null;
//#]
//#[13
//? Mejor resultado de un solo programa (el récord).
let record = 0;
//? ¿Se batió el récord en esta partida?
let nuevoRecord = false;
//? Mejor resultado de esta partida.
let mejorEjecucion = 0;
//? Exámenes aprobados en esta partida.
let examenesAprobados = 0;
//? ¿Ya se ha graduado (pasado el ciclo 10)?
let graduado = false;
//? Consejo elegido para la pantalla final.
let consejoFinal = "";
//#]
//#[3

// ---------- UTILIDADES ----------

//> **Escribir texto con borde.** Una función de ayuda para escribir textos que se lean bien sobre cualquier fondo.
//? Declara la función escribir: texto, posición, tamaño, color y alineación (opcional).
function escribir(texto, x, y, tamano, color, alineacion) {
  //? Letra en negrita del tamaño indicado.
  ctx.font = "bold " + tamano + "px Arial";
  //? Alineación horizontal (por defecto, centrado).
  ctx.textAlign = alineacion || "center";
  //? La y será el centro vertical del texto.
  ctx.textBaseline = "middle";
  //? Esquinas del borde redondeadas.
  ctx.lineJoin = "round";
  //? Grosor del borde proporcional al tamaño.
  ctx.lineWidth = Math.max(2, tamano / 6);
  //? Borde oscuro semitransparente.
  ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
  //? Dibuja el borde.
  ctx.strokeText(texto, x, y);
  //? Color del relleno.
  ctx.fillStyle = color;
  //? Dibuja el relleno.
  ctx.fillText(texto, x, y);
}

//> **El texto de cada carta.** Tres funciones que, según el tipo de carta, devuelven su código, su símbolo grande y una descripción corta.
//? Declara codigoCarta: devuelve la línea de código JavaScript que representa la carta.
function codigoCarta(c) {
  //? Si es de suma, por ejemplo "x += 7;".
  if (c.tipo === "suma") return "x += " + c.n + ";";
  //? Si es de multiplicar, por ejemplo "x *= 3;".
  if (c.tipo === "mult") return "x *= " + c.n + ";";
  //? Si es de cuadrado.
  if (c.tipo === "cuadrado") return "x = x * x;";
  //? Si es un bucle.
  if (c.tipo === "repetir") return "repetir 2 veces:";
  //? Si no es ninguna de las anteriores, es el condicional. % es el resto de dividir: x % 2 == 0 significa "x es par".
  return "if (x % 2 == 0) x *= 3;";
}

//? Declara textoCarta: el símbolo grande que se ve en el centro de la carta.
function textoCarta(c) {
  //? Suma: "+7".
  if (c.tipo === "suma") return "+" + c.n;
  //? Multiplicación: "×3".
  if (c.tipo === "mult") return "×" + c.n;
  //? Cuadrado: "x²".
  if (c.tipo === "cuadrado") return "x²";
  //? Bucle: una flecha circular y un 2.
  if (c.tipo === "repetir") return "↻2";
  //? Condicional.
  return "par?";
}

//? Declara descripcionCarta: una explicación cortita para la parte de abajo de la carta.
function descripcionCarta(c) {
  //? Suma.
  if (c.tipo === "suma") return "suma " + c.n;
  //? Multiplicación.
  if (c.tipo === "mult") return "multiplica";
  //? Cuadrado.
  if (c.tipo === "cuadrado") return "al cuadrado";
  //? Bucle.
  if (c.tipo === "repetir") return "repite la sig.";
  //? Condicional.
  return "si par: ×3";
}

//> **Dibujar una carta.** Cuerpo oscuro, borde y franja de su color, nombre del tipo, símbolo grande y descripción. Si está elegida, el borde es blanco y lleva un circulito con su número de orden.
//? Declara dibujarCarta: la carta, su posición, si está seleccionada y su número de orden (0 = sin número).
function dibujarCarta(c, x, y, seleccionada, orden) {
  //? Datos del tipo de la carta (color y nombre).
  const t = TIPOS_CARTA[c.tipo];
  //? Sombra: negro semitransparente.
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.beginPath();
  //? La sombra es la misma forma, desplazada 4 a la derecha y 6 hacia abajo.
  ctx.roundRect(x + 4, y + 6, CARTA_ANCHO, CARTA_ALTO, 10);
  ctx.fill();
  //? Cuerpo de la carta: azul muy oscuro.
  ctx.fillStyle = "#1b1f3b";
  ctx.beginPath();
  //? Rectángulo con esquinas redondeadas (radio 10).
  ctx.roundRect(x, y, CARTA_ANCHO, CARTA_ALTO, 10);
  ctx.fill();
  //? Borde blanco si está seleccionada; si no, de su color. (condición ? sí : no)
  ctx.strokeStyle = seleccionada ? "white" : t.color;
  //? Borde más grueso si está seleccionada.
  ctx.lineWidth = seleccionada ? 4 : 2;
  ctx.stroke();
  //? Franja superior del color del tipo.
  ctx.fillStyle = t.color;
  ctx.beginPath();
  //? Rectángulo con solo las esquinas de arriba redondeadas: [10, 10, 0, 0] = arriba-izq, arriba-der, abajo-der, abajo-izq.
  ctx.roundRect(x, y, CARTA_ANCHO, 24, [10, 10, 0, 0]);
  ctx.fill();
  //? Texto oscuro para el nombre del tipo.
  ctx.fillStyle = "#10132a";
  //? Letra pequeña en negrita.
  ctx.font = "bold 12px Arial";
  //? Centrado.
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  //? Escribe el nombre del tipo dentro de la franja.
  ctx.fillText(t.nombre, x + CARTA_ANCHO / 2, y + 12);
  //? Símbolo grande en el centro, del color del tipo.
  escribir(textoCarta(c), x + CARTA_ANCHO / 2, y + 62, 28, t.color);
  //? Descripción pequeña abajo, gris claro.
  ctx.fillStyle = "#c9c9e0";
  ctx.font = "11px Arial";
  //? Escribe la descripción corta debajo del símbolo.
  ctx.fillText(descripcionCarta(c), x + CARTA_ANCHO / 2, y + 100);
  //? Si tiene número de orden (orden mayor que 0)…
  if (orden > 0) {
    //? …circulito blanco en la esquina superior derecha…
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(x + CARTA_ANCHO - 6, y + 6, 13, 0, Math.PI * 2);
    ctx.fill();
    //? …con el número dentro, oscuro.
    ctx.fillStyle = "#10132a";
    ctx.font = "bold 15px Arial";
    ctx.fillText(String(orden), x + CARTA_ANCHO - 6, y + 7);
  }
}
//#]
//#[5

//> **¿Un punto está dentro de un rectángulo?** La usaremos para saber si el ratón está sobre una carta o un botón. Todo rectángulo del juego tendrá x, y, ancho y alto.
//? Declara la función dentro: recibe un punto p y un rectángulo r. Devuelve true o false.
function dentro(p, r) {
  //? Está dentro si su x está entre el borde izquierdo y el derecho Y su y entre el de arriba y el de abajo.
  return p.x >= r.x && p.x <= r.x + r.ancho && p.y >= r.y && p.y <= r.y + r.alto;
}
//#]
//#[12

//> **Formatear números grandes.** En este juego los números crecen muchísimo. toLocaleString los escribe con separadores de miles para que se lean bien (1234567 → 1,234,567).
//? Declara la función formatear.
function formatear(n) {
  //? Redondea y escribe el número al estilo de Perú (es-PE).
  return Math.round(n).toLocaleString("es-PE");
}
//#]
//#[4

// ---------- EL MAZO Y LA MANO ----------

//> **Crear el mazo.** El mazo tiene 30 cartas. Hay muchas sumas (las básicas), algunas multiplicaciones y pocas cartas "especiales". Al terminar, lo barajamos.
//? Declara crearMazo.
function crearMazo() {
  //? Empezamos con el mazo vacío.
  mazo = [];
  //? Sumas del 1 al 9: dos cartas de cada una del 1 al 5 y una del 6 al 9 (14 cartas).
  for (let n = 1; n <= 9; n++) agregarCartas("suma", n, n <= 5 ? 2 : 1);
  //? Una suma de 10.
  agregarCartas("suma", 10, 1);
  //? Cinco cartas de ×2.
  agregarCartas("mult", 2, 5);
  //? Tres cartas de ×3.
  agregarCartas("mult", 3, 3);
  //? Dos cartas de cuadrado (el número n no se usa, ponemos 0).
  agregarCartas("cuadrado", 0, 2);
  //? Tres bucles.
  agregarCartas("repetir", 0, 3);
  //? Dos condicionales.
  agregarCartas("siPar", 0, 2);
  //? Barajamos el mazo.
  barajar(mazo);
}

//? Declara agregarCartas: añade al mazo "cantidad" cartas iguales.
function agregarCartas(tipo, n, cantidad) {
  //? Repite cantidad veces añadiendo una carta nueva (un objeto con su tipo y su número).
  for (let i = 0; i < cantidad; i++) mazo.push({ tipo: tipo, n: n });
}

//> **Barajar: el algoritmo de Fisher-Yates.** Recorremos la lista desde el final y cambiamos cada elemento por otro al azar de los que quedan delante. Es el método correcto para barajar: todas las ordenaciones salen con la misma probabilidad.
//? Declara barajar: recibe una lista y la desordena.
function barajar(lista) {
  //? Desde la última posición hasta la segunda.
  for (let i = lista.length - 1; i > 0; i--) {
    //? Posición al azar entre 0 e i (incluida).
    const j = Math.floor(Math.random() * (i + 1));
    //? Guardamos el elemento i en una variable temporal…
    const temporal = lista[i];
    //? …ponemos el j en la posición i…
    lista[i] = lista[j];
    //? …y el que guardamos, en la posición j. ¡Intercambio hecho!
    lista[j] = temporal;
  }
}

//? Declara tamanoMano: cuántas cartas caben en la mano.
function tamanoMano() {
  //#[11
  //? Con la librería Apuntes, una más.
  if (tieneLibreria("apuntes")) return 8;
  //#]
  //? Normalmente, 7.
  return 7;
}

//? Declara robarCartas: completa la mano con cartas del mazo.
function robarCartas() {
  //? Mientras falten cartas en la mano Y queden en el mazo…
  while (mano.length < tamanoMano() && mazo.length > 0) {
    //? …saca la última carta del mazo (pop) y métela en la mano (push).
    mano.push(mazo.pop());
  }
}

//> **¿Dónde se dibuja cada carta?** Calculamos la posición para que la mano quede centrada. Las cartas elegidas suben 22 píxeles y la que está bajo el ratón, 8.
//? Declara posicionCarta: recibe la posición i en la mano y devuelve un rectángulo (x, y, ancho, alto).
function posicionCarta(i) {
  //? Espacio entre cartas.
  const separacion = 10;
  //? Ancho total que ocupa la mano.
  const total = mano.length * CARTA_ANCHO + (mano.length - 1) * separacion;
  //? x de la primera carta para que todo quede centrado.
  const inicioX = ANCHO / 2 - total / 2;
  //? y normal de la mano.
  let y = MANO_Y;
  //#[5
  //? Si está elegida (su posición aparece en la lista seleccion), sube 22 píxeles.
  if (seleccion.includes(i)) y -= 22;
  //? Si no, pero está bajo el ratón, sube 8.
  else if (i === cartaBajoRaton) y -= 8;
  //#]
  //? Devolvemos el rectángulo de la carta.
  return { x: inicioX + i * (CARTA_ANCHO + separacion), y: y, ancho: CARTA_ANCHO, alto: CARTA_ALTO };
}

//? Declara dibujarMano.
function dibujarMano() {
  //? Para cada carta de la mano…
  for (let i = 0; i < mano.length; i++) {
    //? …calculamos su rectángulo…
    const r = posicionCarta(i);
    //#[4-4
    //? …y la dibujamos (de momento, sin selección).
    dibujarCarta(mano[i], r.x, r.y, false, 0);
    //#]
    //#[5
    //? …buscamos su número de orden: su posición en la selección + 1 (si no está elegida, indexOf da -1 y el orden queda 0)…
    const orden = seleccion.indexOf(i) + 1;
    //? …y la dibujamos.
    dibujarCarta(mano[i], r.x, r.y, orden > 0, orden);
    //#]
  }
}
//#]
//#[5

// ---------- ELEGIR CARTAS ----------

//? Declara limiteCartas: el máximo de cartas en un programa.
function limiteCartas() {
  //#[10
  //? El "Profesor estricto" solo deja 4.
  if (jefeActivo("estricto")) return 4;
  //#]
  //? Normalmente, 5.
  return 5;
}

//> **Elegir o soltar una carta.** Si ya estaba elegida, la quitamos del programa; si no, la añadimos AL FINAL. Por eso el orden en que haces clic es el orden en que se ejecutará el programa.
//? Declara alternarCarta: recibe la posición i de la carta en la mano.
function alternarCarta(i) {
  //? Solo se puede elegir en la fase de selección y si la carta existe.
  if (fase !== "seleccion" || i >= mano.length) return;
  //? ¿En qué posición de la selección está? (-1 si no está).
  const posicion = seleccion.indexOf(i);
  //? Si ya estaba elegida, la quitamos (splice borra 1 elemento en esa posición).
  if (posicion !== -1) seleccion.splice(posicion, 1);
  //? Si no estaba y aún caben más, la añadimos al final.
  else if (seleccion.length < limiteCartas()) seleccion.push(i);
  //#[12
  //? Un "clic" suave.
  sonido(520 + seleccion.length * 60, 0.06, "triangle", 0.12);
  //#]
}

//? Declara cartaEnPunto: devuelve la posición de la carta que hay en el punto p, o -1 si no hay ninguna.
function cartaEnPunto(p) {
  //? Miramos de la última a la primera (las de la derecha se dibujan encima).
  for (let i = mano.length - 1; i >= 0; i--) {
    //? Si el punto está dentro de esa carta, devolvemos su posición.
    if (dentro(p, posicionCarta(i))) return i;
  }
  //? No había ninguna.
  return -1;
}
//#]
//#[6

// ---------- EL EDITOR DE CÓDIGO ----------

//> **Las líneas del programa.** Convertimos las cartas elegidas en líneas de código. Si una carta va detrás de un bucle, la sangramos (le ponemos espacios delante), como se hace al programar.
//? Declara lineasPrograma: devuelve la lista de líneas de texto del programa elegido.
function lineasPrograma() {
  //? Todo programa empieza declarando la variable x con valor 0.
  const lineas = ["let x = 0;"];
  //? Para cada posición elegida (k es el orden: 0, 1, 2…)…
  for (let k = 0; k < seleccion.length; k++) {
    //? …la carta correspondiente…
    const c = mano[seleccion[k]];
    //? …¿la carta anterior era un bucle? (solo si k > 0).
    const tras = k > 0 && mano[seleccion[k - 1]].tipo === "repetir";
    //? Añadimos su código, con 4 espacios delante si va dentro del bucle.
    lineas.push((tras ? "    " : "") + codigoCarta(c));
  }
  //? Devolvemos las líneas.
  return lineas;
}

//> **Dibujar el editor.** Imita un editor de código real: barra de título con tres puntos, números de línea y código en letra monoespaciada.
//? Declara dibujarEditor.
function dibujarEditor() {
  //? Fondo del editor (casi negro, como GitHub en modo oscuro).
  ctx.fillStyle = "#0d1117";
  ctx.beginPath();
  //? Rectángulo redondeado del tamaño de EDITOR.
  ctx.roundRect(EDITOR.x, EDITOR.y, EDITOR.ancho, EDITOR.alto, 12);
  ctx.fill();
  //? Borde morado oscuro.
  ctx.strokeStyle = "#3c2f6b";
  ctx.lineWidth = 2;
  ctx.stroke();
  //? Barra de título.
  ctx.fillStyle = "#161b22";
  ctx.beginPath();
  ctx.roundRect(EDITOR.x, EDITOR.y, EDITOR.ancho, 30, [12, 12, 0, 0]);
  ctx.fill();
  //? Los tres puntos de colores de la ventana (rojo, amarillo, verde).
  const colores = ["#ff5f57", "#febc2e", "#28c840"];
  //? Un círculo por color, separados 18 píxeles.
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = colores[i];
    ctx.beginPath();
    ctx.arc(EDITOR.x + 18 + i * 18, EDITOR.y + 15, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  //? Nombre del archivo en la barra.
  ctx.fillStyle = "#8b949e";
  ctx.font = "13px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("programa.js", EDITOR.x + 80, EDITOR.y + 15);
  //#[6-6
  //? Las líneas a mostrar: las del programa elegido.
  const lineas = lineasPrograma();
  //#]
  //#[7
  //? Si se está ejecutando, mostramos las líneas de la ejecución; si no, las del programa elegido.
  const lineas = fase === "ejecutando" ? ejecucion.lineas : lineasPrograma();
  //#]
  //? Letra monoespaciada (todas las letras miden lo mismo), como en los editores de código.
  ctx.font = "bold 17px monospace";
  //? Para cada línea…
  for (let i = 0; i < lineas.length; i++) {
    //? …su altura: 28 píxeles por línea, empezando debajo de la barra.
    const y = EDITOR.y + 52 + i * 28;
    //#[7
    //? Si es la línea que se está ejecutando, la resaltamos con una franja morada.
    if (fase === "ejecutando" && i === ejecucion.lineaActual) {
      ctx.fillStyle = "rgba(157, 78, 221, 0.35)";
      ctx.fillRect(EDITOR.x + 2, y - 13, EDITOR.ancho - 4, 26);
    }
    //#]
    //? Número de línea en gris (empiezan en 1).
    ctx.fillStyle = "#6e7681";
    //? Escribe el número de línea a la izquierda.
    ctx.fillText(String(i + 1), EDITOR.x + 14, y);
    //? El código: la primera línea en azul (es la declaración); el resto en blanco.
    ctx.fillStyle = i === 0 ? "#79c0ff" : "#e6edf3";
    //? Escribe el código de la línea.
    ctx.fillText(lineas[i], EDITOR.x + 46, y);
    //#[7
    //? Si la ejecución ya tiene un comentario para esta línea, lo escribimos a la derecha en verde, como un comentario de código.
    if (fase === "ejecutando" && ejecucion.comentarios[i]) {
      //? Medimos cuánto ocupa el código de la línea (measureText) para poner el comentario detrás, sin pisarlo.
      const anchoCodigo = ctx.measureText(lineas[i]).width;
      //? Verde, como los comentarios en los editores.
      ctx.fillStyle = "#7ee787";
      //? Letra un poco más pequeña para que los comentarios largos quepan.
      ctx.font = "bold 14px monospace";
      //? Lo escribimos a 20 píxeles del final del código (o en la columna 250 si el código es corto).
      ctx.fillText("// " + ejecucion.comentarios[i], EDITOR.x + Math.max(250, 66 + anchoCodigo), y);
      //? Volvemos a la letra del código para la siguiente línea.
      ctx.font = "bold 17px monospace";
    }
    //#]
  }
  //? Si no hay ninguna carta elegida, una ayuda.
  if (lineas.length === 1) {
    //? Primera línea de ayuda, en gris.
    escribir("Elige cartas de tu mano para escribir tu programa", EDITOR.x + EDITOR.ancho / 2, EDITOR.y + 160, 16, "#8b949e");
    //? Segunda línea de ayuda.
    escribir("El ORDEN en que las elijas es el orden en que se ejecutan", EDITOR.x + EDITOR.ancho / 2, EDITOR.y + 186, 14, "#8b949e");
  }
  //#[7
  //? Si se está ejecutando, mostramos el valor de x en grande abajo a la derecha.
  if (fase === "ejecutando") {
    //#[7-11
    //? El valor actual de x.
    escribir("x = " + ejecucion.x, EDITOR.x + EDITOR.ancho - 20, EDITOR.y + EDITOR.alto - 32, 34, "#ffd166", "right");
    //#]
    //#[12
    //? Tamaño que "late": crece de golpe con cada paso (pop) y vuelve a su tamaño.
    const tam = 34 * (1 + ejecucion.pop * 0.5);
    //? El valor actual de x, con separadores de miles.
    escribir("x = " + formatear(ejecucion.x), EDITOR.x + EDITOR.ancho - 20, EDITOR.y + EDITOR.alto - 32, tam, "#ffd166", "right");
    //#]
  }
  //#]
}
//#]
//#[7

// ---------- EL INTÉRPRETE: EJECUTAR EL PROGRAMA ----------

//> **Aplicar una carta.** Recibe una carta y el valor de x, y devuelve el nuevo valor de x. ¡Esto es exactamente lo que hace un ordenador con cada instrucción!
//? Declara aplicarCarta.
function aplicarCarta(c, x) {
  //#[11
  //? Con Pair programming, las sumas valen el doble (multiplicador 2); si no, 1.
  const extraSuma = tieneLibreria("pair") ? 2 : 1;
  //? Con Optimizador, las multiplicaciones multiplican por 1 más.
  const extraMult = tieneLibreria("optimizador") ? 1 : 0;
  //#]
  //#[7-10
  //? Suma: x + n.
  if (c.tipo === "suma") return x + c.n;
  //? Multiplicación: x × n.
  if (c.tipo === "mult") return x * c.n;
  //#]
  //#[11
  //? Suma: x + n (o el doble con Pair programming).
  if (c.tipo === "suma") return x + c.n * extraSuma;
  //? Multiplicación: x × n (o × (n + 1) con Optimizador).
  if (c.tipo === "mult") return x * (c.n + extraMult);
  //#]
  //#[7-9
  //? Cuadrado: x × x.
  if (c.tipo === "cuadrado") return x * x;
  //#]
  //#[10
  //? Cuadrado: x × x… salvo en el Parcial de Matemática Discreta, donde no hace nada.
  if (c.tipo === "cuadrado") return jefeActivo("discreta") ? x : x * x;
  //#]
  //? Condicional: si x es par (resto de dividir entre 2 igual a 0), x × 3; si no, x se queda igual.
  if (c.tipo === "siPar") return x % 2 === 0 ? x * 3 : x;
  //? Cualquier otra (el bucle) no cambia x.
  return x;
}

//> **El desbordamiento (overflow).** Los números de un ordenador tienen un límite. En JavaScript, el mayor entero que se guarda sin errores es Number.MAX_SAFE_INTEGER (9.007.199.254.740.991). Si un programa se pasa, lo dejamos en ese tope: ¡igual que les pasa a los programas de verdad!
//? Declara limitar: devuelve x, pero nunca más que el tope.
function limitar(x) {
  //? Math.min elige el menor de los dos.
  return Math.min(x, Number.MAX_SAFE_INTEGER);
}

//> **El intérprete.** Esta función "ejecuta" el programa entero de una vez y apunta cada paso (qué línea, qué comentario y cuánto vale x) en una lista. Luego la animación mostrará esos pasos uno a uno. Los programas reales que ejecutan código (intérpretes) funcionan con la misma idea.
//? Declara interpretar: recibe la lista de cartas en orden.
function interpretar(cartas) {
  //? Las líneas que se verán en el editor.
  const lineas = ["let x = 0;"];
  //? Los pasos de la ejecución. El primero: la línea 0 deja x = 0.
  const pasos = [{ linea: 0, comentario: "x = 0", x: 0 }];
  //? La variable del programa.
  let x = 0;
  //? Cuántas veces hay que ejecutar la siguiente carta (los bucles lo multiplican).
  let veces = 1;
  //? Para cada carta, en orden…
  for (const c of cartas) {
    //? …añadimos su línea (sangrada si va dentro de un bucle)…
    lineas.push((veces > 1 ? "    " : "") + codigoCarta(c));
    //? …y guardamos el número de esa línea.
    const linea = lineas.length - 1;
    //? Si es un bucle…
    if (c.tipo === "repetir") {
      //? …la siguiente carta se ejecutará el doble de veces (dos bucles seguidos: ¡4 veces!)…
      veces *= 2;
      //? …apuntamos el paso…
      pasos.push({ linea: linea, comentario: "la siguiente: " + veces + " veces", x: x });
      //? …y pasamos a la siguiente carta sin hacer nada más.
      continue;
    }
    //? Ejecutamos la carta tantas veces como diga "veces".
    for (let k = 0; k < veces; k++) {
      //? Calculamos el nuevo valor de x (sin pasarnos del tope).
      x = limitar(aplicarCarta(c, x));
      //? ¿Llegó al tope? Lo avisaremos en el comentario.
      const tope = x === Number.MAX_SAFE_INTEGER ? "  ¡overflow!" : "";
      //? Apuntamos el paso. Si se repite, añadimos el número de vuelta.
      pasos.push({ linea: linea, comentario: "x = " + x + (veces > 1 ? "  (vuelta " + (k + 1) + ")" : "") + tope, x: x });
    }
    //? Después de una carta normal, se acaba el efecto de los bucles.
    veces = 1;
  }
  //#[11
  //? Con Recursión: buscamos la última carta que no sea un bucle…
  const ultima = cartas.filter(function (c) { return c.tipo !== "repetir"; }).pop();
  //? …y si existe, la ejecutamos otra vez.
  if (tieneLibreria("recursion") && ultima) {
    //? Nueva línea en el editor.
    lineas.push(codigoCarta(ultima) + "  // 🔁");
    //? La ejecutamos otra vez (sin pasar del tope).
    x = limitar(aplicarCarta(ultima, x));
    //? Apuntamos el paso.
    pasos.push({ linea: lineas.length - 1, comentario: "x = " + x, x: x });
  }
  //? Con Café: +15 al final.
  if (tieneLibreria("cafe")) {
    //? Añadimos la línea del café al editor.
    lineas.push("x += 15;  // ☕");
    //? Sumamos 15 (sin pasar del tope).
    x = limitar(x + 15);
    //? Apuntamos el paso.
    pasos.push({ linea: lineas.length - 1, comentario: "x = " + x, x: x });
  }
  //? Con Copiloto IA: ×1.5 al final (redondeado).
  if (tieneLibreria("ia")) {
    //? Añadimos la línea del copiloto.
    lineas.push("x = x * 1.5;  // 🤖");
    //? Multiplicamos por 1.5 y redondeamos (sin pasar del tope).
    x = limitar(Math.round(x * 1.5));
    //? Apuntamos el paso.
    pasos.push({ linea: lineas.length - 1, comentario: "x = " + x, x: x });
  }
  //#]
  //? Devolvemos un objeto con las líneas, los pasos y el resultado final.
  return { lineas: lineas, pasos: pasos, resultado: x };
}

//> **Ejecutar.** Al pulsar ENTER (o el botón), interpretamos el programa elegido y pasamos a la fase "ejecutando", donde la animación irá mostrando los pasos.
//? Declara ejecutar.
function ejecutar() {
  //? Solo si estamos eligiendo y hay al menos una carta elegida.
  if (fase !== "seleccion" || seleccion.length === 0) return;
  //#[8
  //? Y si quedan ejecuciones…
  if (ejecuciones <= 0) return;
  //? …gastamos una.
  ejecuciones -= 1;
  //#]
  //? Convertimos las posiciones elegidas en cartas: map crea una lista nueva aplicando la función a cada elemento.
  const cartas = seleccion.map(function (i) { return mano[i]; });
  //? Interpretamos el programa.
  ejecucion = interpretar(cartas);
  //? Siguiente paso a mostrar: el 0.
  ejecucion.indice = 0;
  //? Tiempo hasta el siguiente paso (0 = enseguida).
  ejecucion.tiempo = 0;
  //? Comentarios visibles de cada línea (al principio, ninguno).
  ejecucion.comentarios = [];
  //? Línea resaltada (-1 = ninguna).
  ejecucion.lineaActual = -1;
  //? Valor de x que se muestra.
  ejecucion.x = 0;
  //? ¿Ya se mostraron todos los pasos?
  ejecucion.terminada = false;
  //#[12
  //? Efecto "pop" del número (0 = tamaño normal).
  ejecucion.pop = 0;
  //#]
  //? Cambiamos de fase.
  fase = "ejecutando";
}

//> **La animación de la ejecución.** Cada cierto tiempo mostramos el siguiente paso. Cuantos más pasos lleva, más rápido va (¡da emoción!). Al acabar, esperamos un segundo para que se vea el resultado.
//? Declara actualizarEjecucion.
function actualizarEjecucion(dt) {
  //? Solo funciona en la fase "ejecutando".
  if (fase !== "ejecutando") return;
  //? Descontamos el tiempo.
  ejecucion.tiempo -= dt;
  //? Si aún no toca el siguiente paso, salimos.
  if (ejecucion.tiempo > 0) return;
  //? Si quedan pasos por mostrar…
  if (ejecucion.indice < ejecucion.pasos.length) {
    //? …tomamos el siguiente…
    const p = ejecucion.pasos[ejecucion.indice];
    //? …ponemos su comentario en su línea…
    ejecucion.comentarios[p.linea] = p.comentario;
    //? …resaltamos esa línea…
    ejecucion.lineaActual = p.linea;
    //? …mostramos el nuevo valor de x…
    ejecucion.x = p.x;
    //? …avanzamos al siguiente…
    ejecucion.indice += 1;
    //? …y esperamos un poco: 0.5 s al principio, cada vez menos, pero nunca menos de 0.18 s.
    ejecucion.tiempo = Math.max(0.18, 0.5 - ejecucion.indice * 0.04);
    //#[12
    //? Efecto pop del número.
    ejecucion.pop = 1;
    //? Una nota que sube con cada paso: multiplicar la frecuencia por 1.12 sube aproximadamente un tono.
    sonido(260 * Math.pow(1.12, ejecucion.indice), 0.12, "square", 0.07);
    //#]
    //? Si ya se mostraron todos los pasos (y aún no lo habíamos marcado)…
  } else if (!ejecucion.terminada) {
    //? …lo marcamos…
    ejecucion.terminada = true;
    //? …y dejamos el resultado 1 segundo en pantalla.
    ejecucion.tiempo = 1;
    //#[12
    //? ¡Efectos según lo grande que sea el resultado!
    celebrarResultado(ejecucion.resultado);
    //#]
    //? Si ya pasó también ese segundo…
  } else {
    //? …terminamos la ejecución.
    terminarEjecucion();
  }
}

//? Declara terminarEjecucion.
function terminarEjecucion() {
  //#[8
  //? Sumamos el resultado al puntaje del examen.
  puntaje += ejecucion.resultado;
  //#]
  //#[13
  //? Si es el mejor programa de la partida, lo guardamos.
  mejorEjecucion = Math.max(mejorEjecucion, ejecucion.resultado);
  //#]
  //? Quitamos de la mano las cartas usadas…
  quitarSeleccionadas();
  //? …y robamos nuevas.
  robarCartas();
  //? Volvemos a la fase de elegir.
  fase = "seleccion";
  //#[9
  //? ¿Aprobó o suspendió?
  comprobarExamen();
  //#]
}

//> **Quitar las cartas elegidas de la mano.** Las borramos de MAYOR a menor posición: si borráramos primero la 0, todas las demás se moverían un puesto y borraríamos las cartas equivocadas.
//? Declara quitarSeleccionadas.
function quitarSeleccionadas() {
  //? Copia de la selección (slice) ordenada de mayor a menor (sort con b - a).
  const ordenadas = seleccion.slice().sort(function (a, b) { return b - a; });
  //? Borramos cada una de la mano.
  for (const i of ordenadas) mano.splice(i, 1);
  //? Ya no hay nada elegido.
  seleccion = [];
}
//#]
//#[8

// ---------- PANEL, BOTONES Y DESCARTES ----------

//> **Descartar.** Si no te gustan tus cartas, puedes tirar las elegidas y robar otras. Hay pocos descartes: ¡úsalos con cabeza!
//? Declara descartar.
function descartar() {
  //? Solo eligiendo, con cartas elegidas y si quedan descartes.
  if (fase !== "seleccion" || seleccion.length === 0 || descartes <= 0) return;
  //? Gastamos un descarte.
  descartes -= 1;
  //? Quitamos las elegidas…
  quitarSeleccionadas();
  //? …y robamos nuevas.
  robarCartas();
  //#[12
  //? Sonido de "barajar".
  sonido(200, 0.15, "triangle", 0.12, 120);
  //#]
}

//> **Los botones.** Cada botón es un objeto con su rectángulo, texto, color, qué hace al pulsarlo (accion) y cuándo está activo. ¡Guardamos funciones dentro de objetos!
//? Lista de botones.
const botones = [
  //? Botón Ejecutar: está activo si estamos eligiendo, hay cartas elegidas y quedan ejecuciones.
  { x: 220, y: 534, ancho: 170, alto: 48, texto: "▶ Ejecutar (Enter)", color: "#2a9d8f", accion: ejecutar, activo: function () { return fase === "seleccion" && seleccion.length > 0 && ejecuciones > 0; } },
  //? Botón Descartar: activo si estamos eligiendo, hay cartas elegidas y quedan descartes.
  { x: 410, y: 534, ancho: 170, alto: 48, texto: "Descartar (D)", color: "#e76f51", accion: descartar, activo: function () { return fase === "seleccion" && seleccion.length > 0 && descartes > 0; } },
];

//? Declara dibujarBotones.
function dibujarBotones() {
  //? Para cada botón b…
  for (const b of botones) {
    //? …si no está activo, se ve semitransparente…
    ctx.globalAlpha = b.activo() ? 1 : 0.35;
    //? …con su color…
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.ancho, b.alto, 12);
    ctx.fill();
    //? …y su texto en el centro.
    escribir(b.texto, b.x + b.ancho / 2, b.y + b.alto / 2, 17, "white");
  }
  //? Opacidad normal.
  ctx.globalAlpha = 1;
}

//> **El panel de información.** A la izquierda: objetivo, puntaje con barra de progreso, ejecuciones y descartes que quedan.
//? Declara dibujarPanel.
function dibujarPanel() {
  //? Fondo del panel.
  ctx.fillStyle = "rgba(20, 16, 48, 0.9)";
  ctx.beginPath();
  ctx.roundRect(12, 12, 220, 368, 14);
  ctx.fill();
  //? Borde morado.
  ctx.strokeStyle = "#3c2f6b";
  ctx.lineWidth = 2;
  ctx.stroke();
  //#[9
  //? Ciclo de la carrera.
  escribir("Ciclo " + ciclo + " de 10", 122, 34, 15, "#c77dff");
  //? Nombre del examen.
  escribir(nombreExamen(), 122, 58, 15, "white");
  //#]
  //#[10
  //? Si hay jefe, su regla en rosa.
  if (jefe) escribir(jefe.regla, 122, 80, 12, "#ff8fab");
  //#]
  //? Título del objetivo.
  escribir("Objetivo", 122, 110, 14, "#8b949e");
  //#[8-11
  //? El objetivo, grande.
  escribir(String(objetivo), 122, 138, 30, "#ffd166");
  //#]
  //#[12
  //? El objetivo, grande y con separadores de miles.
  escribir(formatear(objetivo), 122, 138, 30, "#ffd166");
  //#]
  //? Título del puntaje.
  escribir("Puntaje", 122, 176, 14, "#8b949e");
  //#[8-11
  //? El puntaje actual.
  escribir(String(puntaje), 122, 204, 30, "white");
  //? Proporción conseguida (de 0 a 1, nunca más de 1).
  const progreso = Math.min(1, puntaje / objetivo);
  //#]
  //#[12
  //? El puntaje que se ve (con efecto contador).
  escribir(formatear(puntajeMostrado), 122, 204, 30, "white");
  //? Proporción conseguida (de 0 a 1, nunca más de 1).
  const progreso = Math.min(1, puntajeMostrado / objetivo);
  //#]
  //? Fondo de la barra.
  ctx.fillStyle = "#2b2550";
  ctx.fillRect(32, 228, 180, 12);
  //? Relleno de la barra: verde si ya se aprobó, morado si no.
  ctx.fillStyle = progreso >= 1 ? "#52b788" : "#9d4edd";
  ctx.fillRect(32, 228, 180 * progreso, 12);
  //? Ejecuciones restantes (azul) a la izquierda…
  escribir("Ejecuciones", 72, 270, 13, "#8b949e");
  //? Número de ejecuciones en grande.
  escribir(String(ejecuciones), 72, 298, 30, "#4cc9f0");
  //? …y descartes restantes (rojo) a la derecha.
  escribir("Descartes", 172, 270, 13, "#8b949e");
  //? Número de descartes en grande.
  escribir(String(descartes), 172, 298, 30, "#ff6b6b");
  //#[11
  //? Créditos.
  escribir("Créditos: $" + creditos, 122, 335, 16, "#ffd166");
  //#]
  //? Cartas que quedan en el mazo.
  escribir("Mazo: " + mazo.length + " cartas", 122, 362, 13, "#8b949e");
}
//#]
//#[9

// ---------- EXÁMENES Y CICLOS ----------

//? Declara nombreExamen: el nombre del examen actual.
function nombreExamen() {
  //#[10
  //? Si hay jefe, su nombre.
  if (jefe) return jefe.nombre;
  //#]
  //? Si no, el nombre de la lista.
  return NOMBRES_EXAMEN[examen];
}

//> **Empezar un examen.** Calculamos el objetivo (crece un 70 % cada ciclo: ¡crecimiento exponencial!), reiniciamos puntaje, ejecuciones y descartes, barajamos un mazo nuevo y robamos la mano.
//? Declara iniciarExamen.
function iniciarExamen() {
  //#[10
  //? En el examen 2 (el tercero) hay un jefe al azar; en los demás, ninguno.
  jefe = examen === 2 ? JEFES[Math.floor(Math.random() * JEFES.length)] : null;
  //#]
  //? Objetivo = base del examen × 1.7 elevado a (ciclo - 1). Math.pow(a, b) es "a elevado a b".
  objetivo = Math.round(BASE_OBJETIVO[examen] * Math.pow(1.7, ciclo - 1));
  //? Puntaje a 0.
  puntaje = 0;
  //#[12
  //? El contador visible también a 0.
  puntajeMostrado = 0;
  //#]
  //? 4 ejecuciones y 3 descartes.
  ejecuciones = 4;
  //? 3 descartes.
  descartes = 3;
  //#[10
  //? El examen sorpresa deja solo 3 ejecuciones.
  if (jefeActivo("sorpresa")) ejecuciones = 3;
  //? El examen sin apuntes no deja descartar.
  if (jefeActivo("sinDescartes")) descartes = 0;
  //#]
  //#[11
  //? Git da una ejecución más.
  if (tieneLibreria("git")) ejecuciones += 1;
  //? Garbage collector da dos descartes más (salvo en el examen sin apuntes).
  if (tieneLibreria("gc") && !jefeActivo("sinDescartes")) descartes += 2;
  //#]
  //? Mano y selección vacías.
  mano = [];
  //? Selección vacía.
  seleccion = [];
  //? Mazo nuevo y barajado.
  crearMazo();
  //? Robamos la mano.
  robarCartas();
  //? Anunciamos el examen.
  mostrarMensaje(nombreExamen(), "Consigue " + objetivo + " puntos", "#c77dff");
}

//? Declara comprobarExamen: ¿aprobado, suspendido o seguimos?
function comprobarExamen() {
  //? Si llegamos al objetivo: aprobado.
  if (puntaje >= objetivo) aprobarExamen();
  //? Si no, y no quedan ejecuciones (o no quedan cartas): desaprobado.
  else if (ejecuciones <= 0 || mano.length === 0) desaprobar();
}

//? Declara aprobarExamen.
function aprobarExamen() {
  //#[11
  //? Créditos ganados: 3 + las ejecuciones que sobraron (¡premio por ser eficiente!) + 3 si era un jefe.
  const ganados = 3 + ejecuciones + (jefe ? 3 : 0);
  //? Los sumamos.
  creditos += ganados;
  //#]
  //#[13
  //? Un examen aprobado más.
  examenesAprobados += 1;
  //#]
  //#[12
  //? Fanfarria de tres notas.
  sonido(523, 0.15, "square", 0.1);
  //? Segunda nota, 120 ms después (setTimeout espera antes de ejecutar).
  setTimeout(function () { sonido(659, 0.15, "square", 0.1); }, 120);
  //? Tercera nota, más larga, a los 240 ms.
  setTimeout(function () { sonido(784, 0.3, "square", 0.1); }, 240);
  //#]
  //? Pasamos al siguiente examen.
  examen += 1;
  //? Si ya hicimos los tres, empieza el siguiente ciclo.
  if (examen > 2) {
    //? Volvemos al primer examen…
    examen = 0;
    //? …del ciclo siguiente.
    ciclo += 1;
  }
  //#[13
  //? Al terminar el ciclo 10 (empezar el 11) por primera vez: ¡graduación!
  if (ciclo === 11 && examen === 0 && !graduado) {
    //? Apuntamos que ya se graduó (para no repetirlo).
    graduado = true;
    //? Pasamos a la pantalla de graduación.
    fase = "graduado";
    return;
  }
  //#]
  //#[9-10
  //? Empezamos el siguiente examen.
  iniciarExamen();
  //? Mensaje de aprobado (después de iniciarExamen para que no lo tape).
  mostrarMensaje("¡Aprobado!", "Siguiente: " + nombreExamen(), "#52b788");
  //#]
  //#[11
  //? Vamos a la tienda (con un mensaje de cuántos créditos ganamos).
  abrirTienda();
  //? Mensaje con los créditos ganados.
  mostrarMensaje("¡Aprobado!", "+$" + ganados + " créditos", "#52b788");
  //#]
}

//? Declara desaprobar.
function desaprobar() {
  //#[9-12
  //? Aviso.
  mostrarMensaje("Desaprobado", "Vuelves a empezar la carrera", "#ff6b6b");
  //? Volvemos al ciclo 1, examen 0.
  ciclo = 1;
  //? Y al primer examen.
  examen = 0;
  //? Y empezamos otra vez.
  iniciarExamen();
  //#]
  //#[13
  //? Se acabó la partida.
  terminarPartida();
  //#]
}

//? Declara mostrarMensaje: un mensaje grande en el centro durante 2 segundos.
function mostrarMensaje(titulo, texto, color) {
  //? Guarda el título.
  mensaje.titulo = titulo;
  //? Guarda el texto.
  mensaje.texto = texto;
  //? Guarda el color.
  mensaje.color = color;
  //? Se verá 2 segundos.
  mensaje.tiempo = 2;
}

//? Declara dibujarMensaje.
function dibujarMensaje() {
  //? Si se le acabó el tiempo, no se dibuja.
  if (mensaje.tiempo <= 0) return;
  //? Se desvanece en el último medio segundo.
  ctx.globalAlpha = Math.min(1, mensaje.tiempo * 2);
  //? Caja oscura.
  ctx.fillStyle = "rgba(10, 8, 30, 0.92)";
  ctx.beginPath();
  ctx.roundRect(ANCHO / 2 - 250, 190, 500, 110, 16);
  ctx.fill();
  //? Borde del color del mensaje.
  ctx.strokeStyle = mensaje.color;
  ctx.lineWidth = 3;
  ctx.stroke();
  //? Título grande del color del mensaje.
  escribir(mensaje.titulo, ANCHO / 2, 228, 34, mensaje.color);
  //? Texto debajo.
  escribir(mensaje.texto, ANCHO / 2, 268, 18, "white");
  //? Opacidad normal.
  ctx.globalAlpha = 1;
}
//#]
//#[10

//? Declara jefeActivo: ¿el jefe actual es el del id indicado?
function jefeActivo(id) {
  //? Hay jefe Y su id coincide.
  return jefe !== null && jefe.id === id;
}
//#]
//#[11

// ---------- TIENDA Y LIBRERÍAS ----------

//? Declara tieneLibreria: ¿el jugador tiene la librería con este id? some devuelve true si ALGUNA cumple la condición.
function tieneLibreria(id) {
  //? Devuelve true si alguna librería tiene ese id.
  return librerias.some(function (l) { return l.id === id; });
}

//> **Abrir la tienda.** Ofrecemos 3 librerías al azar de las que el jugador aún no tiene.
//? Declara abrirTienda.
function abrirTienda() {
  //? Las que no tiene: filter se queda con las que cumplen la condición.
  const disponibles = LIBRERIAS.filter(function (l) { return !tieneLibreria(l.id); });
  //? Las barajamos (¡reutilizamos Fisher-Yates!).
  barajar(disponibles);
  //? Nos quedamos con las 3 primeras (slice).
  ofertas = disponibles.slice(0, 3);
  //? Fase tienda.
  fase = "tienda";
}

//? Declara rectanguloOferta: dónde se dibuja la oferta número i.
function rectanguloOferta(i) {
  //? Las tres ofertas, separadas 190 píxeles en horizontal.
  return { x: 130 + i * 190, y: 150, ancho: 160, alto: 250 };
}

//? Botón para salir de la tienda.
const BOTON_CONTINUAR = { x: 270, y: 440, ancho: 260, alto: 52 };

//? Declara clicTienda: qué pasa al hacer clic en la tienda.
function clicTienda(p) {
  //? ¿Se hizo clic en alguna oferta?
  for (let i = 0; i < ofertas.length; i++) {
    //? Si el clic está dentro de la oferta i, intentamos comprarla.
    if (dentro(p, rectanguloOferta(i))) comprar(ofertas[i]);
  }
  //? Si se hizo clic en Continuar, salimos de la tienda.
  if (dentro(p, BOTON_CONTINUAR)) salirTienda();
}

//? Declara comprar.
function comprar(oferta) {
  //? Si no hay dinero suficiente o ya tiene 4 librerías, no se puede.
  if (creditos < oferta.precio || librerias.length >= 4) {
    //#[12
    //? Sonido de "no".
    sonido(150, 0.2, "sawtooth", 0.1);
    //#]
    return;
  }
  //? Pagamos…
  creditos -= oferta.precio;
  //? …la añadimos a nuestras librerías…
  librerias.push(oferta);
  //? …y la quitamos de las ofertas.
  ofertas = ofertas.filter(function (o) { return o !== oferta; });
  //#[12
  //? Sonido de compra (sube).
  sonido(600, 0.2, "triangle", 0.15, 1200);
  //#]
}

//? Declara salirTienda: empieza el siguiente examen.
function salirTienda() {
  //? Volvemos a la fase de elegir cartas…
  fase = "seleccion";
  //? …y empieza el siguiente examen.
  iniciarExamen();
}

//> **Escribir un párrafo que no se salga.** El canvas no corta el texto en líneas solo: lo hacemos nosotros palabra a palabra, midiendo con measureText.
//? Declara escribirParrafo: texto, posición del centro, ancho máximo, tamaño y color.
function escribirParrafo(texto, x, y, anchoMax, tamano, color) {
  //? Letra para poder medir.
  ctx.font = "bold " + tamano + "px Arial";
  //? Separamos el texto en palabras (split por espacios).
  const palabras = texto.split(" ");
  //? Línea que estamos formando.
  let linea = "";
  //? Para cada palabra…
  for (const palabra of palabras) {
    //? …probamos a añadirla a la línea…
    const prueba = linea ? linea + " " + palabra : palabra;
    //? …si ya no cabe (y la línea no está vacía), escribimos la línea y bajamos.
    if (ctx.measureText(prueba).width > anchoMax && linea) {
      //? Escribimos la línea completa.
      escribir(linea, x, y, tamano, color);
      //? Bajamos una línea (el tamaño de la letra más 4 píxeles).
      y += tamano + 4;
      //? La nueva línea empieza con la palabra que no cabía.
      linea = palabra;
    } else {
      //? Si cabe, la línea crece.
      linea = prueba;
    }
  }
  //? Escribimos la última línea.
  escribir(linea, x, y, tamano, color);
}

//> **Dibujar la tienda.** Una capa oscura con las tres ofertas y el botón de continuar.
//? Declara dibujarTienda.
function dibujarTienda() {
  //? Capa oscura.
  ctx.fillStyle = "rgba(8, 6, 24, 0.9)";
  ctx.fillRect(0, 0, ANCHO, ALTO);
  //? Título.
  escribir("Tienda de librerías", ANCHO / 2, 60, 38, "#c77dff");
  //? Créditos y librerías.
  escribir("Créditos: $" + creditos + "   ·   Librerías: " + librerias.length + " / 4", ANCHO / 2, 105, 18, "#ffd166");
  //? Para cada oferta…
  for (let i = 0; i < ofertas.length; i++) {
    //? …su rectángulo y sus datos…
    const r = rectanguloOferta(i);
    //? Datos de la oferta.
    const o = ofertas[i];
    //? …¿se puede pagar?
    const puede = creditos >= o.precio && librerias.length < 4;
    //? Tarjeta.
    ctx.fillStyle = "#1b1f3b";
    ctx.beginPath();
    ctx.roundRect(r.x, r.y, r.ancho, r.alto, 14);
    ctx.fill();
    //? Borde dorado si se puede comprar; gris si no.
    ctx.strokeStyle = puede ? "#ffd166" : "#555";
    ctx.lineWidth = 3;
    ctx.stroke();
    //? Icono (emoji) grande.
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    //? Dibuja el emoji de la librería.
    ctx.fillText(o.icono, r.x + r.ancho / 2, r.y + 50);
    //? Nombre.
    escribir(o.nombre, r.x + r.ancho / 2, r.y + 100, 16, "white");
    //? Descripción en varias líneas.
    escribirParrafo(o.texto, r.x + r.ancho / 2, r.y + 135, r.ancho - 20, 13, "#c9c9e0");
    //? Precio abajo.
    escribir("Comprar $" + o.precio, r.x + r.ancho / 2, r.y + r.alto - 28, 18, puede ? "#ffd166" : "#777");
  }
  //? Botón continuar.
  ctx.fillStyle = "#2a9d8f";
  ctx.beginPath();
  ctx.roundRect(BOTON_CONTINUAR.x, BOTON_CONTINUAR.y, BOTON_CONTINUAR.ancho, BOTON_CONTINUAR.alto, 12);
  ctx.fill();
  //? Su texto.
  escribir("Siguiente examen ▶", ANCHO / 2, BOTON_CONTINUAR.y + 26, 20, "white");
  //? Ayuda.
  escribir("Haz clic en una librería para comprarla (máximo 4)", ANCHO / 2, 525, 14, "#8b949e");
}

//? Declara dibujarLibrerias: los 4 huecos de librerías arriba a la derecha.
function dibujarLibrerias() {
  //? Para cada hueco (0 a 3)…
  for (let i = 0; i < 4; i++) {
    //? …su x…
    const x = 246 + i * 137;
    //? …su librería (o undefined si está vacío).
    const l = librerias[i];
    //? Fondo del hueco: más claro si está ocupado.
    ctx.fillStyle = l ? "#241d4f" : "rgba(36, 29, 79, 0.4)";
    ctx.beginPath();
    ctx.roundRect(x, 12, 129, 62, 10);
    ctx.fill();
    //? Si está vacío, un texto gris y pasamos al siguiente.
    if (!l) {
      //? Texto del hueco vacío.
      escribir("librería vacía", x + 64, 43, 12, "#5c5488");
      continue;
    }
    //? Icono a la izquierda.
    ctx.font = "26px Arial";
    ctx.textAlign = "center";
    //? Dibuja el emoji.
    ctx.fillText(l.icono, x + 24, 44);
    //? Nombre a la derecha (alineado a la izquierda).
    escribir(l.nombre, x + 44, 43, 12, "white", "left");
  }
}
//#]
//#[12

// ---------- EFECTOS: PARTÍCULAS, TEXTOS, SONIDO Y TEMBLOR ----------

//> **Celebrar el resultado.** Cuanto más grande el número, más partículas, más temblor y más alto el texto. Usamos el logaritmo (Math.log10 = "cuántas cifras tiene") para que no se vuelva exagerado con números enormes.
//? Declara celebrarResultado.
function celebrarResultado(valor) {
  //? Cifras aproximadas del número (al menos 1).
  const cifras = Math.max(1, Math.log10(valor + 1));
  //? Partículas: más cuantas más cifras (máximo 80).
  explosion(EDITOR.x + EDITOR.ancho - 90, EDITOR.y + EDITOR.alto - 32, Math.min(80, Math.round(cifras * 14)));
  //? Temblor proporcional (máximo 14 píxeles).
  temblor = Math.min(14, cifras * 3);
  //? Texto flotante con el resultado.
  crearTextoFlotante("+" + formatear(valor), 122, 190, "#ffd166");
  //? Sonido grave: más largo cuanto más grande.
  sonido(110, 0.2 + cifras * 0.1, "sawtooth", 0.12, 55);
}

//? Declara explosion: muchas partículas de colores desde un punto.
function explosion(x, y, cantidad) {
  //? Colores de las partículas (los de las cartas).
  const colores = ["#4cc9f0", "#f8961e", "#c77dff", "#52b788", "#f72585", "#ffd166"];
  //? Una vuelta por partícula.
  for (let i = 0; i < cantidad; i++) {
    //? Dirección al azar.
    const angulo = Math.random() * Math.PI * 2;
    //? Rapidez al azar.
    const rapidez = 80 + Math.random() * 260;
    //? Añadimos la partícula (velocidad con coseno y seno, algo hacia arriba).
    particulas.push({
      //? Posición inicial x.
      x: x,
      //? Posición inicial y.
      y: y,
      //? Velocidad horizontal: coseno del ángulo por la rapidez.
      vx: Math.cos(angulo) * rapidez,
      //? Velocidad vertical, con un empujón de 120 hacia arriba.
      vy: Math.sin(angulo) * rapidez - 120,
      //? Vida entre 0.6 y 1.2 segundos.
      vida: 0.6 + Math.random() * 0.6,
      //? Un color al azar.
      color: colores[Math.floor(Math.random() * colores.length)],
      //? Tamaño entre 3 y 8 píxeles.
      tam: 3 + Math.random() * 5,
    });
  }
}

//? Declara actualizarParticulas.
function actualizarParticulas(dt) {
  //? Para cada partícula…
  for (const p of particulas) {
    //? …avanza…
    p.x += p.vx * dt;
    //? Avanza en vertical.
    p.y += p.vy * dt;
    //? …cae por la gravedad…
    p.vy += 500 * dt;
    //? …y pierde vida.
    p.vida -= dt;
  }
  //? Quitamos las que ya no tienen vida.
  particulas = particulas.filter(function (p) { return p.vida > 0; });
}

//? Declara dibujarParticulas.
function dibujarParticulas() {
  //? Para cada partícula…
  for (const p of particulas) {
    //? …se desvanece al final de su vida…
    ctx.globalAlpha = Math.min(1, p.vida * 2);
    ctx.fillStyle = p.color;
    //? …cuadradito centrado.
    ctx.fillRect(p.x - p.tam / 2, p.y - p.tam / 2, p.tam, p.tam);
  }
  //? Opacidad normal.
  ctx.globalAlpha = 1;
}

//? Declara crearTextoFlotante.
function crearTextoFlotante(texto, x, y, color) {
  //? Añade un texto con 1.4 segundos de vida.
  textosFlotantes.push({ texto: texto, x: x, y: y, color: color, vida: 1.4 });
}

//? Declara actualizarTextos.
function actualizarTextos(dt) {
  //? Cada texto sube y pierde vida.
  for (const t of textosFlotantes) {
    //? Sube 40 píxeles por segundo.
    t.y -= 40 * dt;
    //? Pierde vida.
    t.vida -= dt;
  }
  //? Quitamos los que ya no tienen vida.
  textosFlotantes = textosFlotantes.filter(function (t) { return t.vida > 0; });
}

//? Declara dibujarTextos.
function dibujarTextos() {
  //? Cada texto, desvaneciéndose al final.
  for (const t of textosFlotantes) {
    //? Opacidad según su vida.
    ctx.globalAlpha = Math.min(1, t.vida);
    //? Lo escribimos grande.
    escribir(t.texto, t.x, t.y, 26, t.color);
  }
  //? Opacidad normal.
  ctx.globalAlpha = 1;
}

//> **Sonidos sintetizados.** El navegador fabrica las notas con un oscilador (Web Audio API). La frecuencia final opcional hace que la nota suba o baje.
//? Declara sonido: frecuencia, duración, forma de onda, volumen y frecuencia final (opcional).
function sonido(frecuencia, duracion, tipoOnda, volumen, frecuenciaFinal) {
  //? Creamos el motor de sonido la primera vez.
  if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
  //? Lo reanudamos si el navegador lo había pausado.
  if (audio.state === "suspended") audio.resume();
  //? El oscilador (el "instrumento").
  const oscilador = audio.createOscillator();
  //? El control de volumen.
  const volumenNodo = audio.createGain();
  //? Forma de la onda.
  oscilador.type = tipoOnda;
  //? Nota inicial.
  oscilador.frequency.setValueAtTime(frecuencia, audio.currentTime);
  //? Si hay frecuencia final, la nota se desliza hasta ella.
  if (frecuenciaFinal) oscilador.frequency.exponentialRampToValueAtTime(frecuenciaFinal, audio.currentTime + duracion);
  //? Volumen inicial…
  volumenNodo.gain.setValueAtTime(volumen, audio.currentTime);
  //? …que se apaga suavemente.
  volumenNodo.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duracion);
  //? Conexiones: oscilador → volumen → altavoces.
  oscilador.connect(volumenNodo);
  //? Conecta el volumen a los altavoces.
  volumenNodo.connect(audio.destination);
  //? Empieza y termina.
  oscilador.start();
  //? Programa que se calle al acabar la duración.
  oscilador.stop(audio.currentTime + duracion);
}
//#]
//#[13

// ---------- ESTADOS: MENÚ, FIN Y GRADUACIÓN ----------

//> **Empezar una partida (una "carrera").** Todo como al principio: ciclo 1, sin librerías ni créditos.
//? Declara empezarPartida.
function empezarPartida() {
  //? Ciclo 1.
  ciclo = 1;
  //? Primer examen.
  examen = 0;
  //? Sin librerías.
  librerias = [];
  //? Sin créditos.
  creditos = 0;
  //? Mejor programa a 0.
  mejorEjecucion = 0;
  //? Exámenes aprobados a 0.
  examenesAprobados = 0;
  //? Sin récord nuevo todavía.
  nuevoRecord = false;
  //? Aún no graduado.
  graduado = false;
  //? Fase de selección y primer examen.
  fase = "seleccion";
  //? Primer examen.
  iniciarExamen();
}

//? Declara terminarPartida.
function terminarPartida() {
  //? Fase de fin.
  fase = "fin";
  //? Consejo al azar.
  consejoFinal = CONSEJOS[Math.floor(Math.random() * CONSEJOS.length)];
  //? ¿Récord nuevo?
  if (mejorEjecucion > record) {
    //? Guardamos el récord nuevo…
    record = mejorEjecucion;
    //? …marcamos que es nuevo…
    nuevoRecord = true;
    //? …y lo guardamos en el navegador.
    guardarRecord(record);
  }
  //? Sonido triste: nota que baja.
  sonido(300, 0.8, "sawtooth", 0.12, 80);
}

//> **El récord en la memoria del navegador.** Igual que en los otros juegos: localStorage con try/catch por seguridad.
//? Declara leerRecord.
function leerRecord() {
  try {
    //? Lee "compila_record" y lo convierte a número (0 si no hay).
    return Number(localStorage.getItem("compila_record")) || 0;
  } catch (error) {
    //? Si falla la lectura, devolvemos 0.
    return 0;
  }
}

//? Declara guardarRecord.
function guardarRecord(valor) {
  try {
    //? Guarda el valor como texto.
    localStorage.setItem("compila_record", String(valor));
  } catch (error) {}
}

//? Declara dibujarMenu.
function dibujarMenu() {
  //? Capa oscura.
  ctx.fillStyle = "rgba(8, 6, 24, 0.88)";
  ctx.fillRect(0, 0, ANCHO, ALTO);
  //? Título que "flota" (sube y baja con el seno del tiempo).
  escribir("¡Compila!", ANCHO / 2, 85 + Math.sin(tiempoTotal * 2) * 5, 76, "#c77dff");
  //? Lema.
  escribir("El roguelike de cartas donde tu mano es un programa", ANCHO / 2, 145, 20, "white");
  //? Tres cartas de ejemplo que se mecen.
  const ejemplo = [{ tipo: "suma", n: 7 }, { tipo: "repetir", n: 0 }, { tipo: "mult", n: 3 }, { tipo: "cuadrado", n: 0 }];
  //? Una vuelta por cada carta de ejemplo.
  for (let i = 0; i < ejemplo.length; i++) {
    //? Cada una se mueve un poco arriba y abajo, desfasada.
    dibujarCarta(ejemplo[i], 214 + i * 96, 185 + Math.sin(tiempoTotal * 2 + i) * 6, false, i + 1);
  }
  //? Lo que hace ese programa de ejemplo.
  escribir("x = 0 → +7 → ×3 → ×3 → x² = 3969", ANCHO / 2, 330, 18, "#ffd166");
  //? Reglas en tres líneas.
  escribir("Elige hasta 5 cartas: el ORDEN en que las eliges es el orden en que se ejecutan.", ANCHO / 2, 372, 15, "white");
  //? Segunda línea de reglas.
  escribir("Llega al objetivo de cada examen, compra librerías y gradúate en 10 ciclos.", ANCHO / 2, 398, 15, "white");
  //? Controles.
  escribir("Clic / teclas 1-8: elegir  ·  ENTER: ejecutar  ·  D: descartar", ANCHO / 2, 424, 15, "#8b949e");
  //? Llamada a empezar, parpadeando.
  if (Math.sin(tiempoTotal * 5) > 0) escribir("Haz clic o pulsa ESPACIO para matricularte", ANCHO / 2, 480, 24, "#52b788");
  //? Récord si existe.
  if (record > 0) escribir("Récord (mejor programa): " + formatear(record), ANCHO / 2, 525, 17, "#ffd166");
}

//? Declara dibujarFin.
function dibujarFin() {
  //? Capa oscura.
  ctx.fillStyle = "rgba(8, 6, 24, 0.9)";
  ctx.fillRect(0, 0, ANCHO, ALTO);
  //? Título.
  escribir("Desaprobado", ANCHO / 2, 80, 56, "#ff6b6b");
  //? Hasta dónde llegó.
  escribir("Llegaste al ciclo " + ciclo + " · " + nombreExamen(), ANCHO / 2, 140, 22, "white");
  //? Estadísticas.
  escribir("Exámenes aprobados: " + examenesAprobados, ANCHO / 2, 190, 20, "white");
  //? El mejor programa, destacado en dorado.
  escribir("Mejor programa: " + formatear(mejorEjecucion), ANCHO / 2, 225, 26, "#ffd166");
  //? Récord nuevo o récord actual.
  escribir(nuevoRecord ? "¡NUEVO RÉCORD!" : "Récord: " + formatear(record), ANCHO / 2, 262, 20, nuevoRecord ? "#52b788" : "#8b949e");
  //? Librerías usadas (map saca los iconos y join los une con espacios).
  escribir("Librerías: " + (librerias.length ? librerias.map(function (l) { return l.icono; }).join(" ") : "ninguna"), ANCHO / 2, 305, 20, "white");
  //? Consejo de programación.
  escribir("Consejo de programador:", ANCHO / 2, 360, 17, "#c77dff");
  //? El consejo, en varias líneas si hace falta.
  escribirParrafo(consejoFinal, ANCHO / 2, 390, 620, 15, "#dcd6ff");
  //? Volver a jugar.
  if (Math.sin(tiempoTotal * 5) > 0) escribir("Clic o ESPACIO para volver a matricularte", ANCHO / 2, 490, 22, "#52b788");
}

//? Declara dibujarGraduacion.
function dibujarGraduacion() {
  //? Capa oscura.
  ctx.fillStyle = "rgba(8, 6, 24, 0.9)";
  ctx.fillRect(0, 0, ANCHO, ALTO);
  //? Birrete (emoji) grande.
  ctx.font = "80px Arial";
  ctx.textAlign = "center";
  //? Dibuja el birrete.
  ctx.fillText("🎓", ANCHO / 2, 120);
  //? Titulares.
  escribir("¡Te graduaste!", ANCHO / 2, 210, 56, "#ffd166");
  //? La carrera.
  escribir("Ingeniería de Sistemas e Informática", ANCHO / 2, 262, 22, "white");
  //? El mejor programa.
  escribir("Mejor programa: " + formatear(mejorEjecucion), ANCHO / 2, 320, 24, "#c77dff");
  //? Invitación a seguir (modo infinito).
  escribir("¿Te atreves con la maestría? Los exámenes siguen creciendo…", ANCHO / 2, 380, 17, "#dcd6ff");
  //? Invitación a continuar, parpadeando.
  if (Math.sin(tiempoTotal * 5) > 0) escribir("Clic o ESPACIO para continuar", ANCHO / 2, 450, 22, "#52b788");
  //? ¡Confeti continuo!
  if (Math.random() < 0.3) explosion(Math.random() * ANCHO, -10, 3);
}
//#]
//#[5

// ---------- CONTROLES: RATÓN, DEDO Y TECLADO ----------

//? Declara posicionEnLienzo: convierte la posición del ratón en pantalla a coordenadas del juego (0-800, 0-600), aunque el lienzo se vea más pequeño.
function posicionEnLienzo(evento) {
  //? Dónde está el lienzo en la pantalla y cuánto mide.
  const rect = lienzo.getBoundingClientRect();
  //? Restamos su esquina y escalamos.
  return {
    //? x: restamos el borde izquierdo y escalamos al ancho del juego.
    x: (evento.clientX - rect.left) * (ANCHO / rect.width),
    //? y: igual en vertical.
    y: (evento.clientY - rect.top) * (ALTO / rect.height),
  };
}

//> **Gestionar un clic.** Según la fase, un clic hace cosas distintas: empezar, comprar, pulsar un botón o elegir una carta.
//? Declara manejarClic.
function manejarClic(p) {
  //#[13
  //? En el menú o tras perder: empezar una partida.
  if (fase === "menu" || fase === "fin") {
    //? Empieza la partida…
    empezarPartida();
    return;
  }
  //? Tras graduarse: a la tienda para seguir jugando.
  if (fase === "graduado") {
    //? Abre la tienda…
    abrirTienda();
    return;
  }
  //#]
  //#[11
  //? En la tienda, la tienda decide.
  if (fase === "tienda") {
    //? Le pasa el clic a la tienda…
    clicTienda(p);
    return;
  }
  //#]
  //#[8
  //? ¿Se pulsó algún botón activo?
  for (const b of botones) {
    //? Si el clic está dentro del botón y el botón está activo…
    if (dentro(p, b) && b.activo()) {
      //? Ejecutamos su acción y salimos.
      b.accion();
      return;
    }
  }
  //#]
  //? Si no, ¿se pulsó una carta?
  const i = cartaEnPunto(p);
  //? Si había carta, la elegimos o soltamos.
  if (i !== -1) alternarCarta(i);
}

//? Al hacer clic o tocar el lienzo…
lienzo.addEventListener("pointerdown", function (evento) {
  //? …gestionamos el clic en esa posición.
  manejarClic(posicionEnLienzo(evento));
});

//? Al mover el ratón sobre el lienzo…
lienzo.addEventListener("pointermove", function (evento) {
  //? …apuntamos qué carta hay debajo (para levantarla un poco).
  cartaBajoRaton = cartaEnPunto(posicionEnLienzo(evento));
});

//? Al pulsar una tecla…
document.addEventListener("keydown", function (evento) {
  //? Las teclas 1 a 8 (del teclado normal o numérico) eligen la carta 1 a 8. replace convierte "Numpad3" en "Digit3".
  const numero = ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8"].indexOf(evento.code.replace("Numpad", "Digit"));
  //? Si era un número, elegimos esa carta.
  if (numero !== -1) alternarCarta(numero);
  //#[7
  //? ENTER ejecuta el programa.
  if (evento.code === "Enter" || evento.code === "NumpadEnter") ejecutar();
  //#]
  //#[8
  //? D descarta.
  if (evento.code === "KeyD") descartar();
  //#]
  //#[13
  //? ESPACIO hace lo mismo que un clic en las pantallas de menú, fin y graduación.
  if (evento.code === "Space" && (fase === "menu" || fase === "fin" || fase === "graduado")) manejarClic({ x: 0, y: 0 });
  //? Que el espacio no haga scroll en la página.
  if (evento.code === "Space") evento.preventDefault();
  //#]
});
//#]
//#[2

// ---------- FONDO ----------

//> **El fondo.** Un degradado de azul noche a morado con una cuadrícula suave que se desplaza despacio: ambiente de "programar de madrugada".
//? Declara dibujarFondo.
function dibujarFondo() {
  //? Degradado vertical.
  const fondo = ctx.createLinearGradient(0, 0, 0, ALTO);
  //? Arriba, azul noche.
  fondo.addColorStop(0, "#14112b");
  //? Abajo, morado oscuro.
  fondo.addColorStop(1, "#2a1747");
  ctx.fillStyle = fondo;
  //? Pintamos todo (y borramos el fotograma anterior).
  ctx.fillRect(0, 0, ANCHO, ALTO);
  //? Líneas de la cuadrícula: morado casi transparente.
  ctx.strokeStyle = "rgba(157, 78, 221, 0.10)";
  ctx.lineWidth = 1;
  //? Desplazamiento: avanza 10 píxeles por segundo y vuelve a empezar cada 40 (con %).
  const desplazamiento = (tiempoTotal * 10) % 40;
  ctx.beginPath();
  //? Líneas verticales cada 40 píxeles.
  for (let x = 0; x <= ANCHO; x += 40) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ALTO);
  }
  //? Líneas horizontales cada 40 píxeles, desplazadas (empezamos en -40 para cubrir el hueco de arriba).
  for (let y = -40; y <= ALTO; y += 40) {
    ctx.moveTo(0, y + desplazamiento);
    ctx.lineTo(ANCHO, y + desplazamiento);
  }
  //? Dibujamos todas las líneas de una vez.
  ctx.stroke();
}

// ---------- EL BUCLE DEL JUEGO ----------

//? Declara bucle: el corazón del juego, unas 60 veces por segundo.
function bucle(tiempoActual) {
  //? Segundos desde el fotograma anterior (máximo 0.05).
  const dt = Math.min((tiempoActual - tiempoAnterior) / 1000, 0.05);
  //? Guardamos el tiempo actual.
  tiempoAnterior = tiempoActual;
  //? Actualizar y dibujar.
  actualizar(dt);
  //? Dibujar el mundo.
  dibujar();
  //? Siguiente fotograma.
  requestAnimationFrame(bucle);
}

//? Declara actualizar.
function actualizar(dt) {
  //? Tiempo total.
  tiempoTotal += dt;
  //#[7
  //? Avanza la animación de la ejecución.
  actualizarEjecucion(dt);
  //#]
  //#[9
  //? Descuenta el tiempo del mensaje.
  if (mensaje.tiempo > 0) mensaje.tiempo -= dt;
  //#]
  //#[12
  //? Partículas y textos flotantes.
  actualizarParticulas(dt);
  //? Mueve los textos flotantes.
  actualizarTextos(dt);
  //? El temblor se calma.
  temblor = Math.max(0, temblor - 30 * dt);
  //? El pop del número vuelve a 0.
  if (ejecucion) ejecucion.pop = Math.max(0, ejecucion.pop - dt * 5);
  //? El puntaje visible se acerca al real un poco cada fotograma (efecto contador suave).
  puntajeMostrado += (puntaje - puntajeMostrado) * Math.min(1, dt * 6);
  //? Si ya está muy cerca, lo igualamos.
  if (Math.abs(puntaje - puntajeMostrado) < 1) puntajeMostrado = puntaje;
  //#]
}

//? Declara dibujar: de atrás hacia delante.
function dibujar() {
  //#[12
  //? Guardamos el pincel y aplicamos el temblor.
  ctx.save();
  //? Si hay temblor, movemos todo el dibujo un poco al azar.
  if (temblor > 0) ctx.translate((Math.random() - 0.5) * temblor, (Math.random() - 0.5) * temblor);
  //#]
  //? El fondo.
  dibujarFondo();
  //#[3-3
  //? CARTAS DE PRUEBA (las borraremos en el paso 4): una de cada tipo.
  dibujarCarta({ tipo: "suma", n: 7 }, 130, 240, false, 0);
  //? Una de multiplicación.
  dibujarCarta({ tipo: "mult", n: 3 }, 240, 240, false, 0);
  //? Una de cuadrado, dibujada como elegida (borde blanco y número 1).
  dibujarCarta({ tipo: "cuadrado", n: 0 }, 350, 240, true, 1);
  //? Un bucle.
  dibujarCarta({ tipo: "repetir", n: 0 }, 460, 240, false, 0);
  //? Un condicional.
  dibujarCarta({ tipo: "siPar", n: 0 }, 570, 240, false, 0);
  //#]
  //#[11
  //? Los huecos de librerías.
  dibujarLibrerias();
  //#]
  //#[8
  //? El panel de información.
  dibujarPanel();
  //#]
  //#[6
  //? El editor.
  dibujarEditor();
  //#]
  //#[4
  //? La mano.
  dibujarMano();
  //#]
  //#[8
  //? Los botones.
  dibujarBotones();
  //#]
  //#[12
  //? Partículas y textos flotantes.
  dibujarParticulas();
  //? Los textos flotantes.
  dibujarTextos();
  //? Quitamos el temblor.
  ctx.restore();
  //#]
  //#[9
  //? El mensaje grande.
  dibujarMensaje();
  //#]
  //#[11
  //? La tienda (encima de todo).
  if (fase === "tienda") dibujarTienda();
  //#]
  //#[13
  //? Menú, fin o graduación.
  if (fase === "menu") dibujarMenu();
  //? Pantalla de fin.
  if (fase === "fin") dibujarFin();
  //? Pantalla de graduación.
  if (fase === "graduado") dibujarGraduacion();
  //? En la graduación hay confeti: dibujamos las partículas encima.
  if (fase === "graduado") dibujarParticulas();
  //#]
}

//#[4
//? Preparamos el mazo y la mano para poder ver las cartas.
crearMazo();
//? Robamos la primera mano.
robarCartas();
//#]
//#[9-12
//? Empezamos el primer examen.
iniciarExamen();
//#]
//#[13
//? Leemos el récord guardado.
record = leerRecord();
//#]
//? ¡Arranca el juego!
requestAnimationFrame(bucle);
//#]
