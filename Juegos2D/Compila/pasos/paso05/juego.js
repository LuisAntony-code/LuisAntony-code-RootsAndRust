// ===================================================
//  ¡Compila! - El roguelike de cartas donde tu mano
//  es un programa. HTML5 Canvas + JavaScript puro
// ===================================================

const lienzo = document.getElementById("lienzo");
const ctx = lienzo.getContext("2d");
const ANCHO = lienzo.width;
const ALTO = lienzo.height;

// ---------- DATOS DE LAS CARTAS ----------

const TIPOS_CARTA = {
  suma: { color: "#4cc9f0", nombre: "Suma" },
  mult: { color: "#f8961e", nombre: "Multiplica" },
  cuadrado: { color: "#c77dff", nombre: "Cuadrado" },
  repetir: { color: "#52b788", nombre: "Bucle" },
  siPar: { color: "#f72585", nombre: "Condición" },
};
const CARTA_ANCHO = 86;
const CARTA_ALTO = 116;
const MANO_Y = 410;

// ---------- ESTADO DEL JUEGO (variables que cambian) ----------

let tiempoAnterior = 0;
let tiempoTotal = 0;
let mazo = [];
let mano = [];
let seleccion = [];
let cartaBajoRaton = -1;
let fase = "seleccion";

// ---------- UTILIDADES ----------

function escribir(texto, x, y, tamano, color, alineacion) {
  ctx.font = "bold " + tamano + "px Arial";
  ctx.textAlign = alineacion || "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(2, tamano / 6);
  ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
  ctx.strokeText(texto, x, y);
  ctx.fillStyle = color;
  ctx.fillText(texto, x, y);
}

function codigoCarta(c) {
  if (c.tipo === "suma") return "x += " + c.n + ";";
  if (c.tipo === "mult") return "x *= " + c.n + ";";
  if (c.tipo === "cuadrado") return "x = x * x;";
  if (c.tipo === "repetir") return "repetir 2 veces:";
  return "if (x % 2 == 0) x *= 3;";
}

function textoCarta(c) {
  if (c.tipo === "suma") return "+" + c.n;
  if (c.tipo === "mult") return "×" + c.n;
  if (c.tipo === "cuadrado") return "x²";
  if (c.tipo === "repetir") return "↻2";
  return "par?";
}

function descripcionCarta(c) {
  if (c.tipo === "suma") return "suma " + c.n;
  if (c.tipo === "mult") return "multiplica";
  if (c.tipo === "cuadrado") return "al cuadrado";
  if (c.tipo === "repetir") return "repite la sig.";
  return "si par: ×3";
}

function dibujarCarta(c, x, y, seleccionada, orden) {
  const t = TIPOS_CARTA[c.tipo];
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.beginPath();
  ctx.roundRect(x + 4, y + 6, CARTA_ANCHO, CARTA_ALTO, 10);
  ctx.fill();
  ctx.fillStyle = "#1b1f3b";
  ctx.beginPath();
  ctx.roundRect(x, y, CARTA_ANCHO, CARTA_ALTO, 10);
  ctx.fill();
  ctx.strokeStyle = seleccionada ? "white" : t.color;
  ctx.lineWidth = seleccionada ? 4 : 2;
  ctx.stroke();
  ctx.fillStyle = t.color;
  ctx.beginPath();
  ctx.roundRect(x, y, CARTA_ANCHO, 24, [10, 10, 0, 0]);
  ctx.fill();
  ctx.fillStyle = "#10132a";
  ctx.font = "bold 12px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(t.nombre, x + CARTA_ANCHO / 2, y + 12);
  escribir(textoCarta(c), x + CARTA_ANCHO / 2, y + 62, 28, t.color);
  ctx.fillStyle = "#c9c9e0";
  ctx.font = "11px Arial";
  ctx.fillText(descripcionCarta(c), x + CARTA_ANCHO / 2, y + 100);
  if (orden > 0) {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(x + CARTA_ANCHO - 6, y + 6, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#10132a";
    ctx.font = "bold 15px Arial";
    ctx.fillText(String(orden), x + CARTA_ANCHO - 6, y + 7);
  }
}

function dentro(p, r) {
  return p.x >= r.x && p.x <= r.x + r.ancho && p.y >= r.y && p.y <= r.y + r.alto;
}

// ---------- EL MAZO Y LA MANO ----------

function crearMazo() {
  mazo = [];
  for (let n = 1; n <= 9; n++) agregarCartas("suma", n, n <= 5 ? 2 : 1);
  agregarCartas("suma", 10, 1);
  agregarCartas("mult", 2, 5);
  agregarCartas("mult", 3, 3);
  agregarCartas("cuadrado", 0, 2);
  agregarCartas("repetir", 0, 3);
  agregarCartas("siPar", 0, 2);
  barajar(mazo);
}

function agregarCartas(tipo, n, cantidad) {
  for (let i = 0; i < cantidad; i++) mazo.push({ tipo: tipo, n: n });
}

function barajar(lista) {
  for (let i = lista.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temporal = lista[i];
    lista[i] = lista[j];
    lista[j] = temporal;
  }
}

function tamanoMano() {
  return 7;
}

function robarCartas() {
  while (mano.length < tamanoMano() && mazo.length > 0) {
    mano.push(mazo.pop());
  }
}

function posicionCarta(i) {
  const separacion = 10;
  const total = mano.length * CARTA_ANCHO + (mano.length - 1) * separacion;
  const inicioX = ANCHO / 2 - total / 2;
  let y = MANO_Y;
  if (seleccion.includes(i)) y -= 22;
  else if (i === cartaBajoRaton) y -= 8;
  return { x: inicioX + i * (CARTA_ANCHO + separacion), y: y, ancho: CARTA_ANCHO, alto: CARTA_ALTO };
}

function dibujarMano() {
  for (let i = 0; i < mano.length; i++) {
    const r = posicionCarta(i);
    const orden = seleccion.indexOf(i) + 1;
    dibujarCarta(mano[i], r.x, r.y, orden > 0, orden);
  }
}

// ---------- ELEGIR CARTAS ----------

function limiteCartas() {
  return 5;
}

function alternarCarta(i) {
  if (fase !== "seleccion" || i >= mano.length) return;
  const posicion = seleccion.indexOf(i);
  if (posicion !== -1) seleccion.splice(posicion, 1);
  else if (seleccion.length < limiteCartas()) seleccion.push(i);
}

function cartaEnPunto(p) {
  for (let i = mano.length - 1; i >= 0; i--) {
    if (dentro(p, posicionCarta(i))) return i;
  }
  return -1;
}

// ---------- CONTROLES: RATÓN, DEDO Y TECLADO ----------

function posicionEnLienzo(evento) {
  const rect = lienzo.getBoundingClientRect();
  return {
    x: (evento.clientX - rect.left) * (ANCHO / rect.width),
    y: (evento.clientY - rect.top) * (ALTO / rect.height),
  };
}

function manejarClic(p) {
  const i = cartaEnPunto(p);
  if (i !== -1) alternarCarta(i);
}

lienzo.addEventListener("pointerdown", function (evento) {
  manejarClic(posicionEnLienzo(evento));
});

lienzo.addEventListener("pointermove", function (evento) {
  cartaBajoRaton = cartaEnPunto(posicionEnLienzo(evento));
});

document.addEventListener("keydown", function (evento) {
  const numero = ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8"].indexOf(evento.code.replace("Numpad", "Digit"));
  if (numero !== -1) alternarCarta(numero);
});

// ---------- FONDO ----------

function dibujarFondo() {
  const fondo = ctx.createLinearGradient(0, 0, 0, ALTO);
  fondo.addColorStop(0, "#14112b");
  fondo.addColorStop(1, "#2a1747");
  ctx.fillStyle = fondo;
  ctx.fillRect(0, 0, ANCHO, ALTO);
  ctx.strokeStyle = "rgba(157, 78, 221, 0.10)";
  ctx.lineWidth = 1;
  const desplazamiento = (tiempoTotal * 10) % 40;
  ctx.beginPath();
  for (let x = 0; x <= ANCHO; x += 40) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ALTO);
  }
  for (let y = -40; y <= ALTO; y += 40) {
    ctx.moveTo(0, y + desplazamiento);
    ctx.lineTo(ANCHO, y + desplazamiento);
  }
  ctx.stroke();
}

// ---------- EL BUCLE DEL JUEGO ----------

function bucle(tiempoActual) {
  const dt = Math.min((tiempoActual - tiempoAnterior) / 1000, 0.05);
  tiempoAnterior = tiempoActual;
  actualizar(dt);
  dibujar();
  requestAnimationFrame(bucle);
}

function actualizar(dt) {
  tiempoTotal += dt;
}

function dibujar() {
  dibujarFondo();
  dibujarMano();
}

crearMazo();
robarCartas();
requestAnimationFrame(bucle);
