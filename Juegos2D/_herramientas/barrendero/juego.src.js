// ===================================================
//  Barrendero Orbital - Limpia la chatarra espacial
//  Juego 2D de naves y asteroides con HTML5 Canvas
// ===================================================

//> **El lienzo y el pincel.** Igual que en cualquier juego con canvas: buscamos el lienzo del HTML y pedimos su contexto 2D, el objeto con todas las órdenes de dibujo.
//? Busca en la página el elemento con id="lienzo" y lo guarda en la constante lienzo. Una constante (const) es una caja con nombre cuyo contenido no se cambia.
const lienzo = document.getElementById("lienzo");
//? Pide al lienzo su "contexto 2D": el pincel con el que dibujaremos. Por costumbre se llama ctx.
const ctx = lienzo.getContext("2d");
//? Guarda el ancho del lienzo (800 píxeles) en una constante para usarla en todo el código.
const ANCHO = lienzo.width;
//? Guarda el alto del lienzo (600 píxeles).
const ALTO = lienzo.height;

//#[1-1
//> **Prueba de vida.** Pintamos el espacio de negro y un saludo para comprobar que el HTML y el JavaScript están conectados. En el paso 2 borraremos estas líneas.
//? Elige el color de relleno: un azul casi negro (formato hexadecimal #RRGGBB).
ctx.fillStyle = "#05060f";
//? Pinta un rectángulo desde la esquina (0, 0) que ocupa todo el ancho y todo el alto: el lienzo entero.
ctx.fillRect(0, 0, ANCHO, ALTO);
//? Cambia el color de relleno a un verde agua brillante para el texto.
ctx.fillStyle = "#80ffdb";
//? Elige la letra: negrita, 36 píxeles, Arial.
ctx.font = "bold 36px Arial";
//? El texto se centrará horizontalmente en el punto que le demos.
ctx.textAlign = "center";
//? Escribe el saludo en el centro del lienzo.
ctx.fillText("¡Hola, Barrendero Orbital!", ANCHO / 2, ALTO / 2);
//#]

//#[4
// ---------- CONSTANTES DEL JUEGO ----------

//> **Las reglas de la física de la nave.** Las ponemos arriba, con nombre, para poder ajustarlas fácilmente.
//? Velocidad de giro de la nave: 4.2 radianes por segundo (algo más de dos tercios de vuelta por segundo).
const ROTACION = 4.2;
//? Fuerza del motor: cada segundo con el motor encendido, la velocidad aumenta 260 píxeles por segundo.
const EMPUJE = 260;
//? Rozamiento: la nave pierde un 60 % de su velocidad cada segundo si no acelera. (En el espacio real no hay rozamiento, pero así es más fácil de controlar.)
const FRICCION = 0.6;
//#]
//#[6
//? Velocidad de los disparos láser: 520 píxeles por segundo.
const VELOCIDAD_DISPARO = 520;
//#]
//#[7
//> **Los tamaños de la chatarra.** Hay tres tamaños: 3 (grande), 2 (mediana) y 1 (pequeña). Este objeto dice el radio en píxeles de cada uno.
//? Un objeto cuyos apartados se llaman 3, 2 y 1. TAMANOS[3] vale 46, TAMANOS[1] vale 14. (Escribimos TAMANOS sin ñ para evitar problemas.)
const TAMANOS = { 3: 46, 2: 26, 1: 14 };
//? Lista de colores para la chatarra: grises metálicos y un marrón óxido. Cada pieza elegirá uno al azar.
const COLORES_CHATARRA = ["#8d99ae", "#adb5bd", "#9c6644", "#6c757d"];
//#]
//#[8
//? Puntos por romper cada tamaño. Los pequeños valen más porque son más difíciles de acertar.
const PUNTOS_POR_TAMANO = { 3: 20, 2: 50, 1: 100 };
//#]
//#[11
//? Nombres de los satélites activos que cruzarán la pantalla. Cada uno hace algo útil para las personas.
const NOMBRES_SATELITE = ["Satélite GPS", "Satélite del clima", "Satélite de internet", "Telescopio espacial", "Satélite de televisión"];
//#]
//#[14
//? Datos reales sobre la basura espacial para la pantalla final (fuente: Agencia Espacial Europea, ESA).
const DATOS_CURIOSOS = [
  //? Dato 1.
  "Hay decenas de miles de objetos vigilados en órbita, y la mayoría son basura.",
  //? Dato 2.
  "Se calcula que hay más de un millón de fragmentos de entre 1 y 10 cm dando vueltas a la Tierra.",
  //? Dato 3.
  "En órbita, un simple tornillo viaja a unos 28.000 km/h: más rápido que una bala.",
  //? Dato 4.
  "Síndrome de Kessler: cada choque crea más fragmentos, que provocan más choques.",
  //? Dato 5.
  "Ya se prueban misiones reales para retirar basura espacial con redes, imanes y brazos robóticos.",
];
//#]

//#[2
// ---------- ESTADO DEL JUEGO (variables que cambian) ----------

//> **Variables del tiempo.** Usamos let porque su valor cambiará en cada fotograma.
//? Momento (en milisegundos) del fotograma anterior, para medir cuánto tiempo pasa entre fotogramas.
let tiempoAnterior = 0;
//? Segundos que lleva el juego funcionando. Sirve para animar (por ejemplo, el parpadeo de las estrellas).
let tiempoTotal = 0;

//> **Las estrellas.** Creamos 140 estrellas en posiciones al azar UNA sola vez, al cargar. Si las creáramos en cada fotograma, saltarían de sitio sin parar.
//? Una lista vacía donde guardaremos las estrellas.
const estrellas = [];
//? Repite 140 veces (i = 0, 1, 2… 139).
for (let i = 0; i < 140; i++) {
  //? Añade (push) una estrella a la lista: un objeto con su posición, tamaño y un desfase para que no titilen todas a la vez.
  estrellas.push({
    //? x al azar entre 0 y el ancho. Math.random() da un número entre 0 y 0.999…
    x: Math.random() * ANCHO,
    //? y al azar entre 0 y el alto.
    y: Math.random() * ALTO,
    //? Tamaño entre 0.3 y 2.1 píxeles.
    tam: 0.3 + Math.random() * 1.8,
    //? Desfase del parpadeo: un ángulo al azar.
    fase: Math.random() * Math.PI * 2,
  });
}
//#]
//#[3

//> **La nave del jugador.** Guardamos todos sus datos juntos en un objeto.
//? Crea el objeto nave.
const nave = {
  //? Posición x del centro: la mitad del lienzo.
  x: ANCHO / 2,
  //? Posición y del centro: la mitad del lienzo.
  y: ALTO / 2,
  //? Hacia dónde apunta, en radianes. -Math.PI / 2 es "hacia arriba" (recuerda: en el canvas la y crece hacia abajo).
  angulo: -Math.PI / 2,
  //? Radio para calcular choques. Es algo menor que el dibujo para que el juego sea "justo".
  radio: 12,
  //#[4
  //? Velocidad horizontal actual (píxeles por segundo). Empieza quieta.
  vx: 0,
  //? Velocidad vertical actual.
  vy: 0,
  //? ¿Está el motor encendido? Sirve para dibujar la llama.
  propulsando: false,
  //#]
  //#[10
  //? Segundos que le quedan de invulnerabilidad (tras perder una vida). 0 = normal.
  invulnerable: 0,
  //#]
};
//#]
//#[4
//? Objeto donde apuntamos qué teclas están pulsadas: teclas["ArrowUp"] valdrá true mientras se pulse la flecha arriba.
const teclas = {};
//#]
//#[6
//? Lista de disparos láser que están volando.
let disparos = [];
//? Segundos que faltan para poder volver a disparar (evita disparar 60 veces por segundo).
let enfriamiento = 0;
//#]
//#[7
//? Lista de piezas de chatarra espacial.
let chatarras = [];
//? Número de oleada actual. Cuanto más alta, más chatarra y más rápida.
let oleada = 1;
//#]
//#[8
//? Puntos del jugador.
let puntos = 0;
//#]
//#[9
//? Lista de fragmentos reciclables (las bolitas verdes) que hay que recoger.
let fragmentos = [];
//? Kilos de chatarra recogidos para reciclar.
let kilosRecogidos = 0;
//? Lista de textos flotantes ("+15 kg").
let textosFlotantes = [];
//#]
//#[10
//? Vidas que quedan.
let vidas = 3;
//#]
//#[11
//? Lista de satélites activos en pantalla.
let satelites = [];
//? Segundos hasta que aparezca el siguiente satélite.
let tiempoSatelite = 5;
//? Cuántos satélites han cruzado sanos y salvos.
let satelitesSalvados = 0;
//? Cuántos satélites se han destruido.
let satelitesPerdidos = 0;
//#]
//#[12
//? Temporizador de la pausa entre oleadas (0 = no estamos en pausa).
let esperaOleada = 0;
//? Mensaje grande del centro de la pantalla: título, texto y segundos que le quedan.
let mensaje = { titulo: "", texto: "", tiempo: 0 };
//#]
//#[13
//? Lista de partículas (chispas de explosiones y fuego del motor).
let particulas = [];
//? Motor de sonido del navegador. Lo crearemos la primera vez que suene algo.
let audio = null;
//? Intensidad del temblor de pantalla, en píxeles (0 = quieta).
let temblor = 0;
//#]
//#[14
//? Estado actual del juego: "menu", "jugando" o "fin".
let estado = "menu";
//? Mejor puntuación guardada.
let record = 0;
//? ¿Se ha batido el récord en esta partida?
let nuevoRecord = false;
//? Dato curioso elegido para la pantalla final.
let datoFinal = "";
//#]
//#[5

// ---------- UTILIDADES ----------

//> **Salir por un lado y entrar por el otro.** Esta es la regla más famosa de los juegos de asteroides: el espacio "da la vuelta". Si algo sale por la derecha, aparece por la izquierda, y si sale por arriba, aparece por abajo. Sirve para la nave, los disparos, la chatarra y los fragmentos.
//? Declara la función envolver. Recibe cualquier objeto que tenga x, y y radio.
function envolver(obj) {
  //? Si ha salido del todo por la izquierda (su x es menor que -radio)…
  if (obj.x < -obj.radio) obj.x = ANCHO + obj.radio;
  //? …si ha salido por la derecha, lo pasamos a la izquierda.
  if (obj.x > ANCHO + obj.radio) obj.x = -obj.radio;
  //? Si ha salido por arriba, lo pasamos abajo.
  if (obj.y < -obj.radio) obj.y = ALTO + obj.radio;
  //? Si ha salido por abajo, lo pasamos arriba.
  if (obj.y > ALTO + obj.radio) obj.y = -obj.radio;
}
//#]
//#[7

//> **Distancia entre dos puntos.** Usa el teorema de Pitágoras: la distancia es la hipotenusa de un triángulo cuyos lados son la diferencia en x y la diferencia en y. Math.hypot hace la cuenta por nosotros.
//? Declara la función distancia: recibe las coordenadas de dos puntos.
function distancia(x1, y1, x2, y2) {
  //? Devuelve la raíz cuadrada de (x2 - x1)² + (y2 - y1)².
  return Math.hypot(x2 - x1, y2 - y1);
}
//#]
//#[8

//> **¿Chocan dos círculos?** Dos círculos se tocan si la distancia entre sus centros es menor que la suma de sus radios. ¡Así de fácil! Es la forma más usada en los videojuegos para detectar choques.
//? Declara la función chocan: recibe dos objetos con x, y y radio. Devuelve true o false.
function chocan(a, b) {
  //? Compara la distancia entre centros con la suma de los radios.
  return distancia(a.x, a.y, b.x, b.y) < a.radio + b.radio;
}

//> **Escribir texto con borde.** Una función de ayuda para que los textos se lean bien sobre el espacio.
//? Declara la función escribir: texto, posición, tamaño, color y alineación (opcional).
function escribir(texto, x, y, tamano, color, alineacion) {
  //? Letra en negrita del tamaño indicado.
  ctx.font = "bold " + tamano + "px Arial";
  //? Alineación horizontal: la que nos pasen o, si no pasan ninguna, "center".
  ctx.textAlign = alineacion || "center";
  //? La y será el centro vertical del texto.
  ctx.textBaseline = "middle";
  //? Esquinas del borde redondeadas.
  ctx.lineJoin = "round";
  //? Grosor del borde proporcional al tamaño (mínimo 2).
  ctx.lineWidth = Math.max(2, tamano / 6);
  //? Borde negro semitransparente.
  ctx.strokeStyle = "rgba(0, 0, 0, 0.7)";
  //? Dibuja el borde del texto.
  ctx.strokeText(texto, x, y);
  //? Color del relleno.
  ctx.fillStyle = color;
  //? Dibuja el relleno encima.
  ctx.fillText(texto, x, y);
}
//#]
//#[2

// ---------- FONDO: ESTRELLAS Y TIERRA ----------

//> **El fondo.** Pintamos el espacio, las estrellas titilando y la Tierra asomando abajo. Al pintar el fondo completo en cada fotograma, también "borramos" el fotograma anterior.
//? Declara la función dibujarFondo.
function dibujarFondo() {
  //? Azul casi negro para el espacio.
  ctx.fillStyle = "#05060f";
  //? Pinta todo el lienzo (y así borra lo anterior).
  ctx.fillRect(0, 0, ANCHO, ALTO);
  //? Las estrellas son blancas.
  ctx.fillStyle = "white";
  //? Para cada estrella e de la lista…
  for (const e of estrellas) {
    //? …su opacidad sube y baja con el seno (entre 0.2 y 1): así titila. Cada una tiene su propia fase.
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(tiempoTotal * 2 + e.fase);
    //? …y la dibujamos como un cuadradito diminuto.
    ctx.fillRect(e.x, e.y, e.tam, e.tam);
  }
  //? Volvemos a la opacidad normal (1 = opaco).
  ctx.globalAlpha = 1;
  //? Dibujamos la Tierra.
  dibujarTierra();
}

//> **La Tierra.** Un círculo enorme cuyo centro está por debajo del lienzo: solo vemos su parte de arriba, como desde una nave en órbita.
//? Declara la función dibujarTierra.
function dibujarTierra() {
  //? Centro x de la Tierra.
  const cx = ANCHO - 140;
  //? Centro y: 320 píxeles POR DEBAJO del borde inferior del lienzo.
  const cy = ALTO + 320;
  //? Radio de la Tierra: 420 píxeles. Así asoma unos 100 píxeles.
  const r = 420;
  //? Degradado circular para la atmósfera: desde el borde de la Tierra hasta 40 píxeles más afuera.
  const halo = ctx.createRadialGradient(cx, cy, r - 10, cx, cy, r + 40);
  //? Por dentro, azul claro semitransparente.
  halo.addColorStop(0, "rgba(80, 170, 255, 0.55)");
  //? Por fuera, totalmente transparente: se difumina.
  halo.addColorStop(1, "rgba(80, 170, 255, 0)");
  //? Usamos el degradado como relleno.
  ctx.fillStyle = halo;
  ctx.beginPath();
  //? Círculo de la atmósfera, un poco más grande que la Tierra.
  ctx.arc(cx, cy, r + 40, 0, Math.PI * 2);
  ctx.fill();
  //? Azul océano.
  ctx.fillStyle = "#1d5fa8";
  ctx.beginPath();
  //? El círculo de la Tierra.
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  //? Guardamos el estado del pincel antes de recortar.
  ctx.save();
  ctx.beginPath();
  //? Trazamos otra vez el círculo de la Tierra…
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  //? …y lo usamos como "máscara" (clip): a partir de aquí solo se pinta DENTRO del círculo.
  ctx.clip();
  //? Verde para los continentes.
  ctx.fillStyle = "#3c9d5d";
  ctx.beginPath();
  //? Un continente: una elipse (centro, radio horizontal, radio vertical, giro, ángulos).
  ctx.ellipse(cx - 190, cy - 390, 120, 50, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  //? Otro continente.
  ctx.ellipse(cx + 110, cy - 410, 90, 40, -0.2, 0, Math.PI * 2);
  ctx.fill();
  //? Quitamos la máscara recuperando el estado guardado.
  ctx.restore();
}
//#]
//#[3

// ---------- LA NAVE ----------

//> **Dibujar la nave.** El truco: movemos (translate) y giramos (rotate) el pincel hasta la nave, y dibujamos siempre la misma forma apuntando hacia la derecha (ángulo 0). El canvas se encarga de girarla.
//? Declara la función dibujarNave.
function dibujarNave() {
  //#[10
  //? Si es invulnerable, parpadea: en la mitad de las décimas de segundo no la dibujamos (return sale de la función).
  if (nave.invulnerable > 0 && Math.floor(nave.invulnerable * 10) % 2 === 0) return;
  //#]
  //? Guarda el estado del pincel.
  ctx.save();
  //? Lleva el punto (0, 0) al centro de la nave.
  ctx.translate(nave.x, nave.y);
  //? Gira el pincel el ángulo de la nave.
  ctx.rotate(nave.angulo);
  //#[4
  //? Si el motor está encendido, dibujamos la llama detrás (en la x negativa).
  if (nave.propulsando) {
    //? Color al azar entre amarillo y naranja en cada fotograma: así la llama parece que "baila".
    ctx.fillStyle = Math.random() < 0.5 ? "#ffb703" : "#fb8500";
    ctx.beginPath();
    //? Esquina superior de la base de la llama.
    ctx.moveTo(-10, -6);
    //? Punta de la llama: con una longitud al azar entre 10 y 22 píxeles.
    ctx.lineTo(-20 - Math.random() * 12, 0);
    //? Esquina inferior de la base.
    ctx.lineTo(-10, 6);
    ctx.closePath();
    ctx.fill();
  }
  //#]
  // Casco: una punta de flecha
  //? Casco blanco azulado.
  ctx.fillStyle = "#e0fbfc";
  //? Borde turquesa.
  ctx.strokeStyle = "#3dccc7";
  ctx.lineWidth = 2;
  ctx.beginPath();
  //? La punta de la nave, 18 píxeles hacia delante.
  ctx.moveTo(18, 0);
  //? Ala izquierda, atrás.
  ctx.lineTo(-12, -12);
  //? Hueco trasero (le da forma de flecha).
  ctx.lineTo(-6, 0);
  //? Ala derecha, atrás.
  ctx.lineTo(-12, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Cabina
  //? Azul para la cabina.
  ctx.fillStyle = "#0077b6";
  ctx.beginPath();
  //? Cabina: círculo de radio 4 en el centro.
  ctx.arc(2, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  // Pinzas recolectoras
  //? Color de las pinzas.
  ctx.strokeStyle = "#90e0ef";
  ctx.beginPath();
  //? Pinza de arriba: empieza en el casco…
  ctx.moveTo(4, -7);
  //? …sale hacia fuera…
  ctx.lineTo(14, -13);
  //? …y se cierra hacia delante.
  ctx.lineTo(22, -9);
  //? Pinza de abajo (simétrica): moveTo para no unirla con la anterior.
  ctx.moveTo(4, 7);
  ctx.lineTo(14, 13);
  ctx.lineTo(22, 9);
  ctx.stroke();
  //? Recupera el estado del pincel (sin traslado ni giro).
  ctx.restore();
}
//#]
//#[4

//> **Mover la nave con inercia.** La nave no se mueve "a saltos": tiene velocidad (vx, vy). El motor empuja en la dirección en la que apunta, usando coseno y seno para repartir el empuje entre x e y. Al soltar, sigue deslizándose y frena poco a poco.
//? Declara la función actualizarNave. dt son los segundos desde el fotograma anterior.
function actualizarNave(dt) {
  //? Flecha izquierda o A: gira hacia la izquierda (ángulo negativo).
  if (teclas["ArrowLeft"] || teclas["KeyA"]) nave.angulo -= ROTACION * dt;
  //? Flecha derecha o D: gira hacia la derecha.
  if (teclas["ArrowRight"] || teclas["KeyD"]) nave.angulo += ROTACION * dt;
  //? El motor está encendido si se pulsa la flecha arriba o W. El !! convierte el resultado en true o false.
  nave.propulsando = !!(teclas["ArrowUp"] || teclas["KeyW"]);
  //? Si el motor está encendido…
  if (nave.propulsando) {
    //? …la velocidad x aumenta según el coseno del ángulo (cuánto apunta hacia la derecha o la izquierda)…
    nave.vx += Math.cos(nave.angulo) * EMPUJE * dt;
    //? …y la velocidad y según el seno (cuánto apunta hacia abajo o arriba).
    nave.vy += Math.sin(nave.angulo) * EMPUJE * dt;
    //#[13
    //? Echa partículas de fuego por detrás (la x negativa del dibujo), en dirección contraria a la nave.
    crearParticula(nave.x - Math.cos(nave.angulo) * 14, nave.y - Math.sin(nave.angulo) * 14, -Math.cos(nave.angulo) * 120 + (Math.random() - 0.5) * 60, -Math.sin(nave.angulo) * 120 + (Math.random() - 0.5) * 60, Math.random() < 0.5 ? "#ffb703" : "#fb8500", 0.35, 3);
    //#]
  }
  //? Rozamiento: quita a la velocidad x una parte proporcional a ella misma.
  nave.vx -= nave.vx * FRICCION * dt;
  //? Lo mismo con la velocidad y.
  nave.vy -= nave.vy * FRICCION * dt;
  //? Mueve la nave según su velocidad.
  nave.x += nave.vx * dt;
  //? Y lo mismo en vertical: la y avanza según la velocidad vy.
  nave.y += nave.vy * dt;
  //#[5
  //? Si sale por un borde, aparece por el contrario.
  envolver(nave);
  //#]
  //#[6
  //? Descuenta el tiempo de enfriamiento del láser.
  enfriamiento -= dt;
  //? Si se pulsa ESPACIO y el láser ya se ha enfriado, disparamos.
  if (teclas["Space"] && enfriamiento <= 0) disparar();
  //#]
  //#[10
  //? Descuenta el tiempo de invulnerabilidad.
  if (nave.invulnerable > 0) nave.invulnerable -= dt;
  //#]
}
//#]
//#[6

// ---------- EL LÁSER ----------

//> **Disparar.** Cada disparo sale de la punta de la nave, en la dirección en la que apunta. Le sumamos la velocidad de la nave para que, si vas rápido, el disparo no se quede atrás.
//? Declara la función disparar.
function disparar() {
  //? Añade un disparo nuevo a la lista.
  disparos.push({
    //? Sale desde la punta de la nave: 18 píxeles hacia delante desde su centro.
    x: nave.x + Math.cos(nave.angulo) * 18,
    //? La y de salida: 18 píxeles hacia delante usando el seno.
    y: nave.y + Math.sin(nave.angulo) * 18,
    //? Velocidad x: la del láser en la dirección de la nave, más la de la nave.
    vx: Math.cos(nave.angulo) * VELOCIDAD_DISPARO + nave.vx,
    //? Velocidad y: igual.
    vy: Math.sin(nave.angulo) * VELOCIDAD_DISPARO + nave.vy,
    //? Radio pequeñito para los choques.
    radio: 2,
    //? Vivirá 0.9 segundos (luego se apaga).
    vida: 0.9,
  });
  //? Hasta dentro de 0.22 segundos no se puede volver a disparar (unos 4 disparos por segundo).
  enfriamiento = 0.22;
  //#[13
  //? Sonido de láser: una nota aguda que baja rápido ("piu").
  sonido(900, 0.12, "square", 0.05, 300);
  //#]
}

//? Declara la función actualizarDisparos: mueve los disparos y quita los que se han apagado.
function actualizarDisparos(dt) {
  //? Para cada disparo d…
  for (const d of disparos) {
    //? …avanza en x…
    d.x += d.vx * dt;
    //? …y en y…
    d.y += d.vy * dt;
    //? …pierde vida…
    d.vida -= dt;
    //? …y si sale por un borde entra por el otro.
    envolver(d);
  }
  //? Nos quedamos solo con los disparos que siguen vivos.
  disparos = disparos.filter(function (d) { return d.vida > 0; });
}

//? Declara la función dibujarDisparos.
function dibujarDisparos() {
  //? Color verde agua brillante.
  ctx.strokeStyle = "#80ffdb";
  //? Línea de 3 píxeles.
  ctx.lineWidth = 3;
  //? Extremos redondeados.
  ctx.lineCap = "round";
  //? Para cada disparo…
  for (const d of disparos) {
    ctx.beginPath();
    //? …empezamos en su posición…
    ctx.moveTo(d.x, d.y);
    //? …y trazamos una rayita hacia atrás (la distancia que recorre en 0.02 segundos): parece un rayo en movimiento.
    ctx.lineTo(d.x - d.vx * 0.02, d.y - d.vy * 0.02);
    ctx.stroke();
  }
  //? Volvemos a los extremos rectos normales.
  ctx.lineCap = "butt";
}
//#]
//#[7

// ---------- LA CHATARRA ESPACIAL ----------

//> **Una forma irregular.** La chatarra no es redonda: repartimos puntos alrededor de un círculo, cada uno a una distancia algo distinta del centro. Al unirlos sale una roca o pieza retorcida, ¡y cada una es diferente!
//? Declara la función formaAleatoria: recibe un radio y devuelve una lista de puntos.
function formaAleatoria(radio) {
  //? Lista vacía de puntos.
  const puntosForma = [];
  //? Número de vértices: entre 7 y 10. Math.floor quita los decimales.
  const lados = 7 + Math.floor(Math.random() * 4);
  //? Una vuelta por vértice.
  for (let i = 0; i < lados; i++) {
    //? Ángulo de este vértice: repartimos la vuelta completa en partes iguales.
    const angulo = (i / lados) * Math.PI * 2;
    //? Distancia al centro: entre el 70 % y el 105 % del radio (esto la hace irregular).
    const dist = radio * (0.7 + Math.random() * 0.35);
    //? Con coseno y seno convertimos (ángulo, distancia) en un punto (x, y) y lo guardamos.
    puntosForma.push({ x: Math.cos(angulo) * dist, y: Math.sin(angulo) * dist });
  }
  //? Devuelve la lista de puntos.
  return puntosForma;
}

//> **Crear una pieza de chatarra.** Recibe dónde aparece y su tamaño (3, 2 o 1), y le da una dirección y velocidad al azar.
//? Declara la función crearChatarra.
function crearChatarra(x, y, tamano) {
  //? Busca el radio que corresponde a ese tamaño.
  const radio = TAMANOS[tamano];
  //? Dirección al azar (cualquier ángulo).
  const direccion = Math.random() * Math.PI * 2;
  //? Rapidez: más rápida cuanto más pequeña, y un 12 % más rápida en cada oleada.
  const rapidez = (20 + Math.random() * 40 + (3 - tamano) * 30) * (1 + (oleada - 1) * 0.12);
  //? Añade la pieza a la lista.
  chatarras.push({
    //? Posición.
    x: x,
    //? Posición vertical.
    y: y,
    //? Tamaño (3, 2 o 1) y radio en píxeles.
    tamano: tamano,
    //? Radio en píxeles (el que buscamos en TAMANOS).
    radio: radio,
    //? Su forma irregular.
    forma: formaAleatoria(radio),
    //? Velocidad en x e y, calculada con coseno y seno de la dirección.
    vx: Math.cos(direccion) * rapidez,
    //? Velocidad vertical: el seno de la dirección por la rapidez.
    vy: Math.sin(direccion) * rapidez,
    //? Ángulo de giro actual y velocidad de giro al azar (entre -0.75 y 0.75 radianes por segundo).
    angulo: 0,
    //? Velocidad de giro al azar (positiva = horario, negativa = antihorario).
    giro: (Math.random() - 0.5) * 1.5,
    //? Un color al azar de la lista COLORES_CHATARRA.
    color: COLORES_CHATARRA[Math.floor(Math.random() * COLORES_CHATARRA.length)],
  });
}

//> **Empezar una oleada.** Crea varias piezas grandes, siempre lejos de la nave para no aparecer encima de ella.
//? Declara la función iniciarOleada.
function iniciarOleada() {
  //? En la oleada 1 hay 3 piezas grandes, en la 2 hay 4, etc.
  const cantidad = 2 + oleada;
  //? Una vuelta por pieza.
  for (let i = 0; i < cantidad; i++) {
    //? Declaramos x e y sin valor todavía.
    let x, y;
    //? do...while: "haz esto, y repítelo mientras se cumpla la condición". Elegimos una posición al azar…
    do {
      //? x al azar dentro del lienzo.
      x = Math.random() * ANCHO;
      //? y al azar dentro del lienzo.
      y = Math.random() * ALTO;
      //? …y si está a menos de 200 píxeles de la nave, volvemos a elegir.
    } while (distancia(x, y, nave.x, nave.y) < 200);
    //? Crea una pieza grande (tamaño 3) en esa posición.
    crearChatarra(x, y, 3);
  }
}

//? Declara la función actualizarChatarras: mueve, gira y envuelve cada pieza.
function actualizarChatarras(dt) {
  //? Para cada pieza c…
  for (const c of chatarras) {
    //? …avanza en x…
    c.x += c.vx * dt;
    //? …avanza en y…
    c.y += c.vy * dt;
    //? …gira…
    c.angulo += c.giro * dt;
    //? …y da la vuelta por los bordes.
    envolver(c);
  }
}

//> **Dibujar una pieza de chatarra.** Unimos sus puntos con líneas y añadimos una placa oscura y un tornillo para que parezca un trozo de satélite viejo.
//? Declara la función dibujarChatarra.
function dibujarChatarra(c) {
  //? Guarda el estado del pincel.
  ctx.save();
  //? Lleva el origen al centro de la pieza.
  ctx.translate(c.x, c.y);
  //? Gira el pincel.
  ctx.rotate(c.angulo);
  //? Color de la pieza.
  ctx.fillStyle = c.color;
  //? Borde casi negro.
  ctx.strokeStyle = "#2b2d42";
  ctx.lineWidth = 2;
  ctx.beginPath();
  //? Empieza en el primer punto de la forma (posición 0 de la lista).
  ctx.moveTo(c.forma[0].x, c.forma[0].y);
  //? Traza una línea a cada uno de los demás puntos (desde la posición 1 hasta el final).
  for (let i = 1; i < c.forma.length; i++) ctx.lineTo(c.forma[i].x, c.forma[i].y);
  //? Cierra la figura volviendo al primer punto.
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  //? Negro semitransparente para la placa.
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  //? Una placa rectangular proporcional al tamaño de la pieza.
  ctx.fillRect(-c.radio * 0.4, -c.radio * 0.15, c.radio * 0.8, c.radio * 0.3);
  //? Blanco grisáceo para el tornillo.
  ctx.fillStyle = "#edf2f4";
  ctx.beginPath();
  //? El tornillo: un circulito (como mínimo de 1.5 píxeles de radio).
  ctx.arc(c.radio * 0.3, -c.radio * 0.35, Math.max(1.5, c.radio * 0.08), 0, Math.PI * 2);
  ctx.fill();
  //? Recupera el estado del pincel.
  ctx.restore();
}
//#]
//#[8

// ---------- DISPAROS CONTRA LA CHATARRA ----------

//> **Comprobar los impactos.** Para cada disparo, miramos si toca alguna pieza de chatarra. Recorremos las listas AL REVÉS porque vamos a borrar elementos mientras las recorremos.
//? Declara la función comprobarDisparos.
function comprobarDisparos() {
  //? Bucle por los disparos, del último al primero.
  for (let i = disparos.length - 1; i >= 0; i--) {
    //? El disparo de esta vuelta.
    const d = disparos[i];
    //? ¿Ha chocado ya con algo? Empezamos suponiendo que no.
    let impacto = false;
    //? Bucle por la chatarra, del último al primero, mientras no haya habido impacto (!impacto = "no impacto").
    for (let j = chatarras.length - 1; j >= 0 && !impacto; j--) {
      //? Si el disparo y la pieza chocan…
      if (chocan(d, chatarras[j])) {
        //? …rompemos la pieza…
        romperChatarra(j);
        //? …y apuntamos que hubo impacto.
        impacto = true;
      }
    }
    //#[11
    //? Lo mismo con los satélites: si el láser toca uno, ¡lo hemos dañado!
    for (let j = satelites.length - 1; j >= 0 && !impacto; j--) {
      //? Si chocan…
      if (chocan(d, satelites[j])) {
        //? …llamamos a la función del castigo…
        satelitePorDisparo(j);
        //? …y hubo impacto.
        impacto = true;
      }
    }
    //#]
    //? Si el disparo chocó con algo, desaparece (splice borra 1 elemento en la posición i).
    if (impacto) disparos.splice(i, 1);
  }
}

//> **Romper una pieza.** Como en los juegos clásicos de asteroides: una grande se parte en dos medianas, una mediana en dos pequeñas y una pequeña se convierte en un fragmento reciclable.
//? Declara la función romperChatarra: recibe la posición de la pieza en la lista.
function romperChatarra(indice) {
  //? Guardamos la pieza para usar sus datos.
  const c = chatarras[indice];
  //? La quitamos de la lista.
  chatarras.splice(indice, 1);
  //? Sumamos los puntos que vale su tamaño.
  puntos += PUNTOS_POR_TAMANO[c.tamano];
  //? Si no era de las pequeñas (tamaño mayor que 1)…
  if (c.tamano > 1) {
    //? …creamos dos piezas del tamaño inferior en el mismo sitio (saldrán en direcciones al azar).
    crearChatarra(c.x, c.y, c.tamano - 1);
    //? Segunda pieza del tamaño inferior.
    crearChatarra(c.x, c.y, c.tamano - 1);
  }
  //#[9
  //? Si era pequeña, deja un fragmento reciclable.
  if (c.tamano === 1) crearFragmento(c.x, c.y);
  //#]
  //#[13
  //? Explosión de partículas: más grande cuanto más grande es la pieza.
  explosion(c.x, c.y, c.color, 8 + c.tamano * 8);
  //? Sonido de explosión: más grave cuanto más grande.
  sonido(160 - c.tamano * 30, 0.25 + c.tamano * 0.1, "sawtooth", 0.15, 40);
  //? La pantalla tiembla un poco (más con las piezas grandes).
  temblor = Math.max(temblor, c.tamano * 2);
  //#]
}
//#]
//#[9

// ---------- FRAGMENTOS RECICLABLES ----------

//> **Fragmentos reciclables.** Al romper la chatarra más pequeña queda un fragmento verde. Hay que recogerlo con la nave antes de 8 segundos. Las pinzas de la nave lo atraen cuando pasas cerca, como un imán.
//? Declara la función crearFragmento: recibe la posición.
function crearFragmento(x, y) {
  //? Añade un fragmento a la lista con velocidad lenta al azar (entre -15 y 15), radio 8 y 8 segundos de vida.
  fragmentos.push({ x: x, y: y, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30, radio: 8, vida: 8 });
}

//? Declara la función actualizarFragmentos.
function actualizarFragmentos(dt) {
  //? Recorremos al revés porque podemos borrar fragmentos.
  for (let i = fragmentos.length - 1; i >= 0; i--) {
    //? El fragmento de esta vuelta.
    const f = fragmentos[i];
    //? Distancia del fragmento a la nave.
    const d = distancia(f.x, f.y, nave.x, nave.y);
    //? Si está a menos de 110 píxeles (y no justo encima)…
    if (d < 110 && d > 0) {
      //? …lo empujamos hacia la nave: (nave.x - f.x) / d es la dirección hacia la nave en x, de tamaño 1.
      f.vx += ((nave.x - f.x) / d) * 400 * dt;
      //? …lo mismo en y.
      f.vy += ((nave.y - f.y) / d) * 400 * dt;
    }
    //? Mueve el fragmento.
    f.x += f.vx * dt;
    //? Lo mismo en vertical.
    f.y += f.vy * dt;
    //? Le resta vida.
    f.vida -= dt;
    //? Da la vuelta por los bordes.
    envolver(f);
    //? Si toca la nave…
    if (chocan(f, nave)) {
      //? …lo quitamos de la lista…
      fragmentos.splice(i, 1);
      //? …y lo recogemos.
      recoger(f);
      //? Si no, pero se le acabó la vida…
    } else if (f.vida <= 0) {
      //? …desaparece (perdimos la oportunidad de reciclarlo).
      fragmentos.splice(i, 1);
    }
  }
}

//? Declara la función recoger: suma kilos y puntos.
function recoger(f) {
  //? Cada fragmento pesa entre 5 y 10 kilos (al azar).
  const kilos = 5 + Math.floor(Math.random() * 6);
  //? Sumamos los kilos al total reciclado.
  kilosRecogidos += kilos;
  //? Y 30 puntos.
  puntos += 30;
  //? Texto flotante verde con los kilos.
  crearTextoFlotante("+" + kilos + " kg reciclados", f.x, f.y - 18, "#57ff9a");
  //#[13
  //? Sonido de recogida: una nota que sube ("bling").
  sonido(500, 0.15, "sine", 0.18, 1200);
  //#]
}

//> **Dibujar un fragmento.** Un círculo verde con un halo que late (con el seno del tiempo) y una cruz oscura en el centro.
//? Declara la función dibujarFragmento (uno solo).
function dibujarFragmento(f) {
  //? Tamaño del halo: late entre el 85 % y el 115 %. Usamos f.x en el seno para que no latan todos a la vez.
  const pulso = 1 + Math.sin(tiempoTotal * 6 + f.x) * 0.15;
  //? Verde transparente para el halo.
  ctx.fillStyle = "rgba(87, 255, 154, 0.25)";
  ctx.beginPath();
  //? El halo.
  ctx.arc(f.x, f.y, f.radio * 1.8 * pulso, 0, Math.PI * 2);
  ctx.fill();
  //? Verde intenso para el núcleo.
  ctx.fillStyle = "#57ff9a";
  ctx.beginPath();
  //? El núcleo.
  ctx.arc(f.x, f.y, f.radio * 0.7, 0, Math.PI * 2);
  ctx.fill();
  //? Verde muy oscuro para la cruz.
  ctx.fillStyle = "#0b3d2e";
  //? Barra vertical de la cruz.
  ctx.fillRect(f.x - 1.5, f.y - 4, 3, 8);
  //? Barra horizontal de la cruz.
  ctx.fillRect(f.x - 4, f.y - 1.5, 8, 3);
}

//? Declara la función dibujarFragmentos (todos).
function dibujarFragmentos() {
  //? Para cada fragmento…
  for (const f of fragmentos) {
    //? …si le quedan menos de 2 segundos, parpadea: en la mitad de los octavos de segundo nos lo saltamos (continue).
    if (f.vida < 2 && Math.floor(f.vida * 8) % 2 === 0) continue;
    //? …lo dibujamos.
    dibujarFragmento(f);
  }
}

// ---------- TEXTOS FLOTANTES ----------

//? Declara la función crearTextoFlotante. Limitamos la x para que los textos largos no se corten en los bordes.
function crearTextoFlotante(texto, x, y, color) {
  //? Añade el texto con 1.3 segundos de vida.
  textosFlotantes.push({ texto: texto, x: Math.min(Math.max(x, 230), ANCHO - 230), y: y, color: color, vida: 1.3 });
}

//? Declara la función actualizarTextos.
function actualizarTextos(dt) {
  //? Para cada texto…
  for (const t of textosFlotantes) {
    //? …sube 40 píxeles por segundo…
    t.y -= 40 * dt;
    //? …y pierde vida.
    t.vida -= dt;
  }
  //? Quitamos los que ya no tienen vida.
  textosFlotantes = textosFlotantes.filter(function (t) { return t.vida > 0; });
}

//? Declara la función dibujarTextos.
function dibujarTextos() {
  //? Para cada texto…
  for (const t of textosFlotantes) {
    //? …se desvanece en su último segundo…
    ctx.globalAlpha = Math.min(1, t.vida);
    //? …y lo escribimos.
    escribir(t.texto, t.x, t.y, 18, t.color);
  }
  //? Opacidad normal.
  ctx.globalAlpha = 1;
}
//#]
//#[10

// ---------- CHOQUES DE LA NAVE ----------

//> **¿La chatarra golpea la nave?** Si la nave no es invulnerable y toca cualquier pieza, pierde una vida.
//? Declara la función comprobarChoqueNave.
function comprobarChoqueNave() {
  //? Si es invulnerable, no puede chocar: salimos.
  if (nave.invulnerable > 0) return;
  //? Para cada pieza de chatarra…
  for (const c of chatarras) {
    //? …si choca con la nave…
    if (chocan(nave, c)) {
      //? …destruimos la nave…
      naveDestruida();
      //? …y salimos (no hace falta mirar más piezas).
      return;
    }
  }
}

//> **Perder una vida.** La nave explota y reaparece en el centro, quieta y con 3 segundos de invulnerabilidad para que no la golpeen nada más volver.
//? Declara la función naveDestruida.
function naveDestruida() {
  //#[13
  //? Gran explosión turquesa donde estaba la nave.
  explosion(nave.x, nave.y, "#3dccc7", 40);
  //? Sonido largo y grave.
  sonido(220, 0.8, "sawtooth", 0.25, 30);
  //? Temblor fuerte.
  temblor = 12;
  //#]
  //? Una vida menos.
  vidas -= 1;
  //? Vuelve al centro.
  nave.x = ANCHO / 2;
  //? Centro vertical.
  nave.y = ALTO / 2;
  //? Quieta.
  nave.vx = 0;
  //? Velocidad vertical a cero.
  nave.vy = 0;
  //? Mirando hacia arriba.
  nave.angulo = -Math.PI / 2;
  //? 3 segundos de invulnerabilidad.
  nave.invulnerable = 3;
  //#[14
  //? Si no quedan vidas, se acaba la partida.
  if (vidas <= 0) terminarPartida();
  //#]
}
//#]
//#[11

// ---------- SATÉLITES ACTIVOS ----------

//> **Los satélites activos.** No todo lo que hay en órbita es basura: los satélites nos dan GPS, el tiempo, internet… Cruzan la pantalla de lado a lado y hay que protegerlos. Si la chatarra los golpea, se rompen y se convierten en más chatarra (¡el síndrome de Kessler!). Y si les disparas tú, también.
//? Declara la función crearSatelite.
function crearSatelite() {
  //? ¿Entra por la izquierda? Lanzamos una "moneda": true la mitad de las veces.
  const desdeIzquierda = Math.random() < 0.5;
  //? Añade el satélite.
  satelites.push({
    //? Empieza fuera de la pantalla, a la izquierda o a la derecha. (Operador ? : condición ? si se cumple : si no.)
    x: desdeIzquierda ? -40 : ANCHO + 40,
    //? Altura al azar entre 80 y 480 (lejos de los bordes).
    y: 80 + Math.random() * (ALTO - 200),
    //? Velocidad horizontal: positiva (hacia la derecha) si entra por la izquierda; negativa si no.
    vx: (desdeIzquierda ? 1 : -1) * (45 + Math.random() * 25),
    //? Pequeña velocidad vertical al azar.
    vy: (Math.random() - 0.5) * 20,
    //? Radio para los choques.
    radio: 20,
    //? Ángulo para que gire despacio.
    angulo: 0,
    //? Un nombre al azar de la lista.
    nombre: NOMBRES_SATELITE[Math.floor(Math.random() * NOMBRES_SATELITE.length)],
  });
}

//? Declara la función actualizarSatelites.
function actualizarSatelites(dt) {
  //? Cuenta atrás para el siguiente satélite.
  tiempoSatelite -= dt;
  //? Si llegó a 0…
  if (tiempoSatelite <= 0) {
    //? …creamos uno…
    crearSatelite();
    //? …y el siguiente llegará en 9 a 15 segundos.
    tiempoSatelite = 9 + Math.random() * 6;
  }
  //? Recorremos al revés porque podemos borrar satélites.
  for (let i = satelites.length - 1; i >= 0; i--) {
    //? El satélite de esta vuelta.
    const s = satelites[i];
    //? Avanza.
    s.x += s.vx * dt;
    //? Avanza también en vertical (muy poco).
    s.y += s.vy * dt;
    //? Gira despacio.
    s.angulo += 0.4 * dt;
    //? Si se acerca al borde de arriba o de abajo, invertimos su velocidad vertical (rebota suavemente).
    if (s.y < 50 || s.y > ALTO - 90) s.vy = -s.vy;
    //? ¿Le golpea alguna pieza de chatarra? some devuelve true si ALGUNA pieza cumple la condición.
    const golpeado = chatarras.some(function (c) { return chocan(s, c); });
    //? Si le golpearon…
    if (golpeado) {
      //? …lo quitamos de la lista…
      satelites.splice(i, 1);
      //? …se convierte en chatarra…
      convertirEnChatarra(s, "¡Choque! La chatarra destruyó el " + s.nombre);
      //? …y pasamos al siguiente.
      continue;
    }
    //? Si ya cruzó toda la pantalla, llegó a salvo.
    if (s.x < -60 || s.x > ANCHO + 60) {
      //? Lo quitamos de la lista…
      satelites.splice(i, 1);
      //? …y lo celebramos.
      sateliteASalvo(s);
    }
  }
}

//? Declara la función satelitePorDisparo: el jugador ha disparado a un satélite (j es su posición en la lista).
function satelitePorDisparo(j) {
  //? Lo guardamos.
  const s = satelites[j];
  //? Lo quitamos de la lista.
  satelites.splice(j, 1);
  //? Castigo: 100 puntos menos (sin bajar de 0).
  puntos = Math.max(0, puntos - 100);
  //? Se convierte en chatarra con un mensaje de aviso.
  convertirEnChatarra(s, "¡No dispares! El " + s.nombre + " funcionaba. -100");
}

//? Declara la función convertirEnChatarra: un satélite roto genera dos piezas medianas de chatarra.
function convertirEnChatarra(s, texto) {
  //? Primera pieza mediana.
  crearChatarra(s.x, s.y, 2);
  //? Segunda pieza mediana.
  crearChatarra(s.x, s.y, 2);
  //? Contamos un satélite perdido.
  satelitesPerdidos += 1;
  //? Aviso en rojo.
  crearTextoFlotante(texto, s.x, s.y - 30, "#ff6b6b");
  //#[13
  //? Explosión dorada.
  explosion(s.x, s.y, "#ffd166", 30);
  //? Sonido de destrucción.
  sonido(300, 0.7, "sawtooth", 0.2, 50);
  //? Temblor.
  temblor = 8;
  //#]
}

//? Declara la función sateliteASalvo.
function sateliteASalvo(s) {
  //? Contamos un satélite salvado.
  satelitesSalvados += 1;
  //? Premio: 150 puntos.
  puntos += 150;
  //? Aviso: la x la ponemos dentro de la pantalla (el satélite ya ha salido).
  crearTextoFlotante("¡" + s.nombre + " a salvo! +150", s.x < 0 ? 230 : ANCHO - 230, s.y, "#a8dadc");
  //#[13
  //? Dos notas alegres.
  sonido(700, 0.12, "triangle", 0.15);
  //? La segunda, 120 milisegundos después.
  setTimeout(function () { sonido(1050, 0.2, "triangle", 0.15); }, 120);
  //#]
}

//> **Dibujar un satélite.** Cuerpo dorado (como el aislante real de muchos satélites), dos paneles solares azules y una luz que parpadea.
//? Declara la función dibujarSatelite.
function dibujarSatelite(s) {
  //? Guarda el estado del pincel.
  ctx.save();
  //? Lleva el origen al satélite.
  ctx.translate(s.x, s.y);
  //? Lo gira un poco (solo el 30 % de su ángulo, para que se balancee despacio).
  ctx.rotate(Math.sin(s.angulo) * 0.3);
  //? Azul oscuro para los paneles.
  ctx.fillStyle = "#1d3557";
  //? Celeste para sus bordes.
  ctx.strokeStyle = "#a8dadc";
  ctx.lineWidth = 1.5;
  //? Panel izquierdo (relleno y borde).
  ctx.fillRect(-36, -8, 22, 16);
  ctx.strokeRect(-36, -8, 22, 16);
  //? Panel derecho.
  ctx.fillRect(14, -8, 22, 16);
  ctx.strokeRect(14, -8, 22, 16);
  //? Línea central de cada panel (las "celdas" solares).
  ctx.beginPath();
  ctx.moveTo(-25, -8);
  ctx.lineTo(-25, 8);
  ctx.moveTo(25, -8);
  ctx.lineTo(25, 8);
  ctx.stroke();
  //? Gris para el brazo que une los paneles.
  ctx.fillStyle = "#adb5bd";
  //? El brazo.
  ctx.fillRect(-14, -2, 28, 4);
  //? Dorado para el cuerpo.
  ctx.fillStyle = "#ffd166";
  //? El cuerpo.
  ctx.fillRect(-9, -10, 18, 20);
  //? Luz: verde o apagada según el seno del tiempo (parpadea 8 veces cada π segundos).
  ctx.fillStyle = Math.sin(tiempoTotal * 8) > 0 ? "#06d6a0" : "#073b4c";
  ctx.beginPath();
  //? La luz, encima del cuerpo.
  ctx.arc(0, -14, 3, 0, Math.PI * 2);
  ctx.fill();
  //? Recupera el estado del pincel.
  ctx.restore();
  //? Nombre del satélite debajo, para saber qué protegemos.
  escribir(s.nombre, s.x, s.y + 28, 11, "#a8dadc");
}
//#]
//#[12

// ---------- OLEADAS, MARCADOR Y MENSAJES ----------

//> **Pasar de oleada.** Cuando no queda chatarra, damos un premio, mostramos un mensaje y, tras 2.5 segundos de pausa, empieza la siguiente oleada (con más piezas y más rápidas).
//? Declara la función comprobarOleada.
function comprobarOleada(dt) {
  //? Si aún queda chatarra, no hacemos nada.
  if (chatarras.length > 0) return;
  //? Si es el primer fotograma sin chatarra (la espera está a 0)…
  if (esperaOleada === 0) {
    //? …empieza la pausa de 2.5 segundos…
    esperaOleada = 2.5;
    //? …premio: 100 puntos por el número de oleada…
    puntos += 100 * oleada;
    //? …y mensaje en grande.
    mostrarMensaje("¡Órbita limpia!", "Bonus +" + 100 * oleada + "  ·  Llega la oleada " + (oleada + 1));
  }
  //? Descuenta el tiempo de pausa.
  esperaOleada -= dt;
  //? Si se acabó la pausa…
  if (esperaOleada <= 0) {
    //? …reiniciamos el temporizador…
    esperaOleada = 0;
    //? …subimos de oleada…
    oleada += 1;
    //? …y creamos la chatarra nueva.
    iniciarOleada();
  }
}

//? Declara la función mostrarMensaje: título y texto que aparecen en el centro durante 2.5 segundos.
function mostrarMensaje(titulo, texto) {
  //? Guarda el título del mensaje.
  mensaje.titulo = titulo;
  //? Guarda el texto.
  mensaje.texto = texto;
  //? Estará 2.5 segundos en pantalla.
  mensaje.tiempo = 2.5;
}

//? Declara la función dibujarMensaje.
function dibujarMensaje() {
  //? Si no le queda tiempo, no se dibuja.
  if (mensaje.tiempo <= 0) return;
  //? Se desvanece en el último segundo.
  ctx.globalAlpha = Math.min(1, mensaje.tiempo);
  //? Título grande.
  escribir(mensaje.titulo, ANCHO / 2, ALTO / 2 - 40, 46, "#80ffdb");
  //? Texto debajo.
  escribir(mensaje.texto, ANCHO / 2, ALTO / 2 + 10, 20, "white");
  //? Opacidad normal.
  ctx.globalAlpha = 1;
}

//> **El marcador (HUD).** Puntos, vidas (naves pequeñas), oleada, kilos reciclados y satélites salvados.
//? Declara la función dibujarHUD.
function dibujarHUD() {
  //? Puntos arriba a la izquierda.
  escribir("Puntos: " + puntos, 20, 28, 22, "white", "left");
  //? Una nave pequeña por cada vida.
  for (let i = 0; i < vidas; i++) dibujarNaveMini(32 + i * 28, 62);
  //? Oleada en el centro.
  escribir("Oleada " + oleada, ANCHO / 2, 28, 22, "#80ffdb");
  //? Kilos reciclados a la derecha.
  escribir("Reciclado: " + kilosRecogidos + " kg", ANCHO - 20, 28, 20, "#57ff9a", "right");
  //? Satélites salvados debajo.
  escribir("Satélites salvados: " + satelitesSalvados, ANCHO - 20, 56, 15, "#a8dadc", "right");
  //#[14
  //? Récord debajo.
  escribir("Récord: " + record, ANCHO - 20, 80, 14, "white", "right");
  //#]
}

//? Declara la función dibujarNaveMini: un icono de nave apuntando hacia arriba.
function dibujarNaveMini(x, y) {
  //? Guarda el pincel.
  ctx.save();
  //? Lleva el origen al icono.
  ctx.translate(x, y);
  //? Gira -90 grados para que apunte hacia arriba.
  ctx.rotate(-Math.PI / 2);
  //? Lo encoge al 70 %.
  ctx.scale(0.7, 0.7);
  //? Mismo color que la nave.
  ctx.fillStyle = "#e0fbfc";
  ctx.beginPath();
  //? Misma forma de flecha que la nave (punta, ala, hueco, ala).
  ctx.moveTo(18, 0);
  ctx.lineTo(-12, -12);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-12, 12);
  ctx.closePath();
  ctx.fill();
  //? Recupera el pincel.
  ctx.restore();
}
//#]
//#[13

// ---------- EFECTOS: PARTÍCULAS, SONIDO Y TEMBLOR ----------

//> **Partículas.** En el espacio no hay gravedad, así que las chispas salen en línea recta y se frenan un poco. Cada una vive menos de un segundo.
//? Declara la función crearParticula: posición, velocidad, color, vida y tamaño.
function crearParticula(x, y, vx, vy, color, vida, tam) {
  //? Añade la partícula a la lista.
  particulas.push({ x: x, y: y, vx: vx, vy: vy, color: color, vida: vida, vidaInicial: vida, tam: tam });
}

//? Declara la función explosion: muchas partículas en todas direcciones.
function explosion(x, y, color, cantidad) {
  //? Una vuelta por partícula.
  for (let i = 0; i < cantidad; i++) {
    //? Dirección al azar.
    const angulo = Math.random() * Math.PI * 2;
    //? Rapidez al azar entre 40 y 240.
    const rapidez = 40 + Math.random() * 200;
    //? Una de cada cuatro es blanca (chispa); las demás, del color del objeto.
    const c = Math.random() < 0.25 ? "white" : color;
    //? Crea la partícula con vida entre 0.4 y 0.9 segundos y tamaño entre 2 y 5.
    crearParticula(x, y, Math.cos(angulo) * rapidez, Math.sin(angulo) * rapidez, c, 0.4 + Math.random() * 0.5, 2 + Math.random() * 3);
  }
}

//? Declara la función actualizarParticulas.
function actualizarParticulas(dt) {
  //? Para cada partícula…
  for (const p of particulas) {
    //? …avanza…
    p.x += p.vx * dt;
    //? Avanza en vertical.
    p.y += p.vy * dt;
    //? …se frena un poco (pierde el 150 % de su velocidad por segundo, repartido en cada fotograma)…
    p.vx -= p.vx * 1.5 * dt;
    //? Frena también en vertical.
    p.vy -= p.vy * 1.5 * dt;
    //? …y pierde vida.
    p.vida -= dt;
  }
  //? Quitamos las que ya no tienen vida.
  particulas = particulas.filter(function (p) { return p.vida > 0; });
}

//? Declara la función dibujarParticulas.
function dibujarParticulas() {
  //? Para cada partícula…
  for (const p of particulas) {
    //? …su opacidad es la proporción de vida que le queda (de 1 a 0)…
    ctx.globalAlpha = p.vida / p.vidaInicial;
    //? …con su color…
    ctx.fillStyle = p.color;
    //? …un cuadradito centrado en su posición.
    ctx.fillRect(p.x - p.tam / 2, p.y - p.tam / 2, p.tam, p.tam);
  }
  //? Opacidad normal.
  ctx.globalAlpha = 1;
}

//> **Sonidos sintetizados.** Igual que en EcoCaza, el navegador fabrica los sonidos con un oscilador. Añadimos un parámetro: la frecuencia final. Si la nota baja rápido suena "piu" (láser) o "buum" (explosión); si sube, "bling" (recoger).
//? Declara la función sonido: frecuencia inicial, duración, forma de onda, volumen y frecuencia final (opcional).
function sonido(frecuencia, duracion, tipoOnda, volumen, frecuenciaFinal) {
  //? Crea el motor de sonido la primera vez.
  if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
  //? Si estaba en pausa (el navegador lo pausa hasta que el usuario pulsa algo), lo reanudamos.
  if (audio.state === "suspended") audio.resume();
  //? El "instrumento" que genera la nota.
  const oscilador = audio.createOscillator();
  //? El control de volumen.
  const volumenNodo = audio.createGain();
  //? Forma de la onda ("square", "sawtooth", "sine" o "triangle").
  oscilador.type = tipoOnda;
  //? Nota inicial, ahora mismo.
  oscilador.frequency.setValueAtTime(frecuencia, audio.currentTime);
  //? Si nos dan frecuencia final, la nota se desliza hasta ella durante la duración.
  if (frecuenciaFinal) oscilador.frequency.exponentialRampToValueAtTime(frecuenciaFinal, audio.currentTime + duracion);
  //? Volumen inicial.
  volumenNodo.gain.setValueAtTime(volumen, audio.currentTime);
  //? El volumen se apaga de forma natural hasta casi 0.
  volumenNodo.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duracion);
  //? Conectamos: oscilador → volumen → altavoces.
  oscilador.connect(volumenNodo);
  //? Conecta el volumen a los altavoces (destination).
  volumenNodo.connect(audio.destination);
  //? Empieza a sonar…
  oscilador.start();
  //? …y se detiene al acabar la duración.
  oscilador.stop(audio.currentTime + duracion);
}
//#]
//#[14

// ---------- ESTADOS: MENÚ, PARTIDA Y FIN ----------

//> **Empezar o reiniciar una partida.** Ponemos todo como al principio y lanzamos la primera oleada.
//? Declara la función empezarPartida.
function empezarPartida() {
  //? Ahora estamos jugando.
  estado = "jugando";
  //? Reiniciamos marcadores.
  puntos = 0;
  //? Tres vidas.
  vidas = 3;
  //? Oleada 1.
  oleada = 1;
  //? Kilos reciclados a cero.
  kilosRecogidos = 0;
  //? Satélites salvados a cero.
  satelitesSalvados = 0;
  //? Satélites perdidos a cero.
  satelitesPerdidos = 0;
  //? Vaciamos todas las listas.
  chatarras = [];
  //? Sin disparos.
  disparos = [];
  //? Sin fragmentos.
  fragmentos = [];
  //? Sin satélites.
  satelites = [];
  //? Sin partículas.
  particulas = [];
  //? Sin textos flotantes.
  textosFlotantes = [];
  //? La nave vuelve al centro, quieta, mirando arriba y con 2 segundos de protección.
  nave.x = ANCHO / 2;
  //? Centro vertical.
  nave.y = ALTO / 2;
  //? Velocidad horizontal a cero.
  nave.vx = 0;
  //? Velocidad vertical a cero.
  nave.vy = 0;
  //? Mirando hacia arriba.
  nave.angulo = -Math.PI / 2;
  //? Protegida durante 2 segundos.
  nave.invulnerable = 2;
  //? El primer satélite llegará a los 5 segundos.
  tiempoSatelite = 5;
  //? Sin pausa entre oleadas.
  esperaOleada = 0;
  //? Aún no hay récord nuevo.
  nuevoRecord = false;
  //? Creamos la primera oleada.
  iniciarOleada();
  //? Y la anunciamos.
  mostrarMensaje("Oleada 1", "¡Limpia la órbita y protege los satélites!");
}

//? Declara la función terminarPartida.
function terminarPartida() {
  //? Pasamos al estado de fin.
  estado = "fin";
  //? Elegimos un dato curioso al azar.
  datoFinal = DATOS_CURIOSOS[Math.floor(Math.random() * DATOS_CURIOSOS.length)];
  //? Si hemos batido el récord…
  if (puntos > record) {
    //? …lo guardamos en la variable…
    record = puntos;
    //? …marcamos que es nuevo…
    nuevoRecord = true;
    //? …y lo guardamos en la memoria del navegador.
    guardarRecord(record);
  }
}

//> **El récord en la memoria del navegador.** localStorage guarda datos aunque cierres la página. Usamos try/catch por si el navegador no deja usarlo: así el juego nunca se rompe por esto.
//? Declara la función leerRecord.
function leerRecord() {
  //? Intentamos…
  try {
    //? …leer el valor guardado como "barrendero_record" y convertirlo a número (o 0 si no hay).
    return Number(localStorage.getItem("barrendero_record")) || 0;
    //? Si da error…
  } catch (error) {
    //? …devolvemos 0.
    return 0;
  }
}

//? Declara la función guardarRecord.
function guardarRecord(valor) {
  //? Intentamos…
  try {
    //? …guardar el valor como texto.
    localStorage.setItem("barrendero_record", String(valor));
    //? Si falla, no hacemos nada.
  } catch (error) {}
}

//> **Pantalla de menú.** Título, explicación de los tres objetos del juego (con sus dibujos de verdad) y los controles.
//? Declara la función dibujarPantallaMenu.
function dibujarPantallaMenu() {
  //? Capa oscura semitransparente encima de todo.
  ctx.fillStyle = "rgba(5, 6, 20, 0.78)";
  ctx.fillRect(0, 0, ANCHO, ALTO);
  //? Título.
  escribir("Barrendero Orbital", ANCHO / 2, 85, 58, "#80ffdb");
  //? Lema.
  escribir("Limpia la chatarra espacial y protege los satélites", ANCHO / 2, 140, 21, "white");
  //? Ejemplo de chatarra: un objeto hecho a mano con la forma guardada en EJEMPLO_CHATARRA, girando.
  dibujarChatarra({ x: 170, y: 245, angulo: tiempoTotal * 0.6, radio: 30, forma: EJEMPLO_CHATARRA, color: "#adb5bd" });
  //? Su explicación.
  escribir("Chatarra: ¡dispárale!", 170, 305, 16, "white");
  //? Segunda línea de explicación, más pequeña.
  escribir("Se rompe en trozos más pequeños", 170, 328, 13, "#cfd8dc");
  //? Ejemplo de fragmento.
  dibujarFragmento({ x: 400, y: 245, radio: 10 });
  //? Su explicación.
  escribir("Fragmento: recógelo", 400, 305, 16, "#57ff9a");
  //? Segunda línea de explicación.
  escribir("Se recicla (+kg). Desaparece en 8 s", 400, 328, 13, "#cfd8dc");
  //? Ejemplo de satélite.
  dibujarSatelite({ x: 630, y: 240, angulo: tiempoTotal, nombre: "Satélite GPS" });
  //? Su explicación.
  escribir("Satélite activo: ¡protégelo!", 630, 305, 16, "#a8dadc");
  //? Segunda línea de explicación.
  escribir("No le dispares ni dejes que lo golpeen", 630, 328, 13, "#cfd8dc");
  //? Controles.
  escribir("← → girar  ·  ↑ propulsar  ·  ESPACIO disparar", ANCHO / 2, 395, 19, "white");
  //? Llamada a empezar, parpadeando.
  if (Math.sin(tiempoTotal * 5) > 0) escribir("Pulsa ENTER o ESPACIO para despegar", ANCHO / 2, 455, 26, "#80ffdb");
  //? Récord, si existe.
  if (record > 0) escribir("Récord: " + record, ANCHO / 2, 500, 18, "white");
}

//> **Pantalla final.** Resultados, récord y un dato real sobre la basura espacial.
//? Declara la función dibujarPantallaFin.
function dibujarPantallaFin() {
  //? Capa oscura.
  ctx.fillStyle = "rgba(5, 6, 20, 0.82)";
  ctx.fillRect(0, 0, ANCHO, ALTO);
  //? Título.
  escribir("Misión terminada", ANCHO / 2, 85, 50, "#80ffdb");
  //? Puntos en grande.
  escribir("Puntos: " + puntos, ANCHO / 2, 150, 40, "white");
  //? Récord nuevo o récord actual.
  escribir(nuevoRecord ? "¡NUEVO RÉCORD!" : "Récord: " + record, ANCHO / 2, 195, 22, nuevoRecord ? "#ffd166" : "white");
  //? Kilos reciclados.
  escribir("Chatarra reciclada: " + kilosRecogidos + " kg", ANCHO / 2, 250, 22, "#57ff9a");
  //? Oleada alcanzada.
  escribir("Oleada alcanzada: " + oleada, ANCHO / 2, 285, 20, "white");
  //? Satélites.
  escribir("Satélites salvados: " + satelitesSalvados + "   ·   Satélites perdidos: " + satelitesPerdidos, ANCHO / 2, 320, 18, "#a8dadc");
  //? Dato curioso.
  escribir("¿Sabías que...?", ANCHO / 2, 380, 18, "#ffd166");
  //? El dato curioso elegido al azar.
  escribir(datoFinal, ANCHO / 2, 408, 15, "#dfe6e9");
  //? Volver a jugar, parpadeando.
  if (Math.sin(tiempoTotal * 5) > 0) escribir("Pulsa ENTER o ESPACIO para otra misión", ANCHO / 2, 480, 24, "#80ffdb");
}

//? Forma fija para la chatarra de ejemplo del menú (se crea una sola vez para que no cambie en cada fotograma).
const EJEMPLO_CHATARRA = formaAleatoria(30);
//#]
//#[4

// ---------- CONTROLES ----------

//> **El teclado.** Al pulsar una tecla la apuntamos como pulsada (true) y al soltarla como no pulsada (false). Las funciones de actualizar consultan este objeto en cada fotograma.
//? Cuando se pulse una tecla…
document.addEventListener("keydown", function (evento) {
  //? …la apuntamos como pulsada.
  teclas[evento.code] = true;
  //#[14
  //? Si estamos en el menú o en el fin, ENTER o ESPACIO empiezan una partida.
  if ((evento.code === "Enter" || evento.code === "Space") && estado !== "jugando") empezarPartida();
  //#]
  //? Las flechas y el espacio no deben mover (hacer scroll) la página.
  if (evento.code.startsWith("Arrow") || evento.code === "Space") evento.preventDefault();
});

//? Cuando se suelte una tecla…
document.addEventListener("keyup", function (evento) {
  //? …la apuntamos como no pulsada.
  teclas[evento.code] = false;
});
//#]
//#[2

// ---------- EL BUCLE DEL JUEGO ----------

//> **El bucle.** Unas 60 veces por segundo: medimos el tiempo, actualizamos el mundo y lo dibujamos. requestAnimationFrame vuelve a llamar a bucle en el siguiente fotograma.
//? Declara la función bucle. El navegador le pasa el tiempo actual en milisegundos.
function bucle(tiempoActual) {
  //? Segundos desde el fotograma anterior, como máximo 0.05 (por si la pestaña estuvo en segundo plano).
  const dt = Math.min((tiempoActual - tiempoAnterior) / 1000, 0.05);
  //? Guardamos el tiempo para el próximo fotograma.
  tiempoAnterior = tiempoActual;
  //? Actualizamos…
  actualizar(dt);
  //? …dibujamos…
  dibujar();
  //? …y pedimos el siguiente fotograma.
  requestAnimationFrame(bucle);
}

//> **Actualizar.** Llama en orden a todo lo que se mueve o se calcula.
//? Declara la función actualizar.
function actualizar(dt) {
  //? Suma el tiempo transcurrido.
  tiempoTotal += dt;
  //#[13
  //? Mueve las partículas.
  actualizarParticulas(dt);
  //? El temblor se calma 30 píxeles por segundo, sin bajar de 0.
  temblor = Math.max(0, temblor - 30 * dt);
  //#]
  //#[9
  //? Mueve los textos flotantes.
  actualizarTextos(dt);
  //#]
  //#[12
  //? Descuenta el tiempo del mensaje grande.
  if (mensaje.tiempo > 0) mensaje.tiempo -= dt;
  //#]
  //#[7
  //? Mueve la chatarra (también en el menú, como decorado).
  actualizarChatarras(dt);
  //#]
  //#[14
  //? Si no estamos jugando, no actualizamos nada más.
  if (estado !== "jugando") return;
  //#]
  //#[4
  //? Mueve la nave.
  actualizarNave(dt);
  //#]
  //#[6
  //? Mueve los disparos.
  actualizarDisparos(dt);
  //#]
  //#[9
  //? Mueve y recoge fragmentos.
  actualizarFragmentos(dt);
  //#]
  //#[11
  //? Mueve los satélites.
  actualizarSatelites(dt);
  //#]
  //#[8
  //? ¿Algún disparo dio en el blanco?
  comprobarDisparos();
  //#]
  //#[10
  //? ¿La chatarra golpeó la nave?
  comprobarChoqueNave();
  //#]
  //#[12
  //? ¿Se terminó la oleada?
  comprobarOleada(dt);
  //#]
}

//> **Dibujar.** De atrás hacia delante: fondo, objetos, nave, efectos y, al final, el marcador y los menús.
//? Declara la función dibujar.
function dibujar() {
  //#[13
  //? Guardamos el pincel antes de aplicar el temblor.
  ctx.save();
  //? Si hay temblor, movemos todo el dibujo un poquito al azar (entre -temblor/2 y +temblor/2 píxeles).
  if (temblor > 0) ctx.translate((Math.random() - 0.5) * temblor, (Math.random() - 0.5) * temblor);
  //#]
  //? El fondo (y borrar lo anterior).
  dibujarFondo();
  //#[9
  //? Los fragmentos reciclables.
  dibujarFragmentos();
  //#]
  //#[11
  //? Los satélites.
  for (const s of satelites) dibujarSatelite(s);
  //#]
  //#[7
  //? La chatarra.
  for (const c of chatarras) dibujarChatarra(c);
  //#]
  //#[6
  //? Los disparos.
  dibujarDisparos();
  //#]
  //#[3-13
  //? La nave.
  dibujarNave();
  //#]
  //#[14
  //? La nave solo se dibuja mientras jugamos (en el menú y en el fin no aparece).
  if (estado === "jugando") dibujarNave();
  //#]
  //#[13
  //? Las partículas.
  dibujarParticulas();
  //#]
  //#[9
  //? Los textos flotantes.
  dibujarTextos();
  //#]
  //#[13
  //? Quitamos el temblor: el marcador queda quieto.
  ctx.restore();
  //#]
  //#[8-11
  //? Marcador PROVISIONAL (en el paso 12 lo cambiaremos por uno completo).
  escribir("Puntos: " + puntos, 20, 28, 22, "white", "left");
  //#]
  //#[9-11
  //? Provisional: kilos reciclados.
  escribir("Reciclado: " + kilosRecogidos + " kg", 20, 56, 16, "#57ff9a", "left");
  //#]
  //#[10-11
  //? Provisional: vidas.
  escribir("Vidas: " + vidas, 20, 80, 16, "white", "left");
  //#]
  //#[12
  //? El marcador.
  dibujarHUD();
  //? El mensaje grande del centro.
  dibujarMensaje();
  //#]
  //#[14
  //? La pantalla de menú, si toca.
  if (estado === "menu") dibujarPantallaMenu();
  //? La pantalla final, si toca.
  if (estado === "fin") dibujarPantallaFin();
  //#]
}

//#[7
//? Creamos la primera oleada de chatarra.
iniciarOleada();
//#]
//#[14
//? Leemos el récord guardado.
record = leerRecord();
//#]
//? ¡Despegamos! Pedimos el primer fotograma y el bucle ya no para.
requestAnimationFrame(bucle);
//#]
