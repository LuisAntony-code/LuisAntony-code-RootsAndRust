// ===================================================
//  EcoCaza - Separa la basura, salva el planeta
//  Juego 2D hecho con HTML5 Canvas y JavaScript puro
// ===================================================

const lienzo = document.getElementById("lienzo");
const ctx = lienzo.getContext("2d");
const ANCHO = lienzo.width;
const ALTO = lienzo.height;

// ---------- DATOS DEL JUEGO ----------

const TIPOS = {
  amarillo: { nombre: "Plásticos y latas", color: "#f9c80e", oscuro: "#b38b00" },
  azul: { nombre: "Papel y cartón", color: "#2e86de", oscuro: "#1b5394" },
  verde: { nombre: "Vidrio", color: "#27ae60", oscuro: "#17703c" },
  marron: { nombre: "Orgánico", color: "#a0522d", oscuro: "#5e2e14" },
};
const ORDEN_TIPOS = ["amarillo", "azul", "verde", "marron"];
const SELECTOR = { x: 45, y: ALTO - 33, ancho: 170, alto: 28, separacion: 10 };

// ---------- ESTADO DEL JUEGO (variables que cambian) ----------

let tiempoAnterior = 0;
let tiempoTotal = 0;

const contenedor = {
  x: ANCHO / 2,
  y: ALTO - 40,
  ancho: 110,
  alto: 80,
  velocidad: 520,
  tipo: "amarillo",
  salto: 0,
};
const teclas = {};

// ---------- UTILIDADES ----------

function escribir(texto, x, y, tamano, color, alineacion) {
  ctx.font = "bold " + tamano + "px Arial";
  ctx.textAlign = alineacion || "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(2, tamano / 6);
  ctx.strokeStyle = "rgba(0, 0, 0, 0.55)";
  ctx.strokeText(texto, x, y);
  ctx.fillStyle = color;
  ctx.fillText(texto, x, y);
}

// ---------- ESCENARIO ----------

function dibujarFondo() {
  const cielo = ctx.createLinearGradient(0, 0, 0, ALTO);
  cielo.addColorStop(0, "#6ec6ff");
  cielo.addColorStop(1, "#d8f3ff");
  ctx.fillStyle = cielo;
  ctx.fillRect(0, 0, ANCHO, ALTO);

  // Sol
  ctx.fillStyle = "#ffd84d";
  ctx.beginPath();
  ctx.arc(720, 140, 38, 0, Math.PI * 2);
  ctx.fill();

  // Nubes que se desplazan
  dibujarNube((tiempoTotal * 20) % (ANCHO + 200) - 100, 110);
  dibujarNube((tiempoTotal * 12 + 400) % (ANCHO + 200) - 100, 180);

  // Césped
  ctx.fillStyle = "#6ab04c";
  ctx.fillRect(0, ALTO - 40, ANCHO, 40);
  ctx.fillStyle = "#4a8a32";
  ctx.fillRect(0, ALTO - 40, ANCHO, 6);
}

function dibujarNube(x, y) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.beginPath();
  ctx.arc(x, y, 25, 0, Math.PI * 2);
  ctx.arc(x + 30, y - 12, 30, 0, Math.PI * 2);
  ctx.arc(x + 62, y, 24, 0, Math.PI * 2);
  ctx.fill();
}

// ---------- EL CONTENEDOR (JUGADOR) ----------

function dibujarContenedor() {
  const c = contenedor;
  const t = TIPOS[c.tipo];
  const izq = c.x - c.ancho / 2;
  const arriba = c.y - c.alto;
  ctx.save();
  ctx.translate(0, -Math.sin((c.salto / 0.2) * Math.PI) * 10);

  // Cuerpo: un trapecio (más estrecho abajo)
  ctx.fillStyle = t.color;
  ctx.beginPath();
  ctx.moveTo(izq, arriba);
  ctx.lineTo(izq + c.ancho, arriba);
  ctx.lineTo(izq + c.ancho - 10, c.y);
  ctx.lineTo(izq + 10, c.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = t.oscuro;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Tapa (la boca del contenedor)
  ctx.fillStyle = t.oscuro;
  ctx.fillRect(izq - 6, arriba - 10, c.ancho + 12, 12);

  dibujarSimboloReciclaje(c.x, arriba + 30, 15);
  escribir(t.nombre, c.x, arriba + 60, 10, "white");

  // Ruedas
  ctx.fillStyle = "#2d3436";
  ctx.beginPath();
  ctx.arc(izq + 20, c.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(izq + c.ancho - 20, c.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function dibujarSimboloReciclaje(x, y, r) {
  ctx.strokeStyle = "white";
  ctx.fillStyle = "white";
  ctx.lineWidth = 4;
  for (let i = 0; i < 3; i++) {
    const inicio = i * (Math.PI * 2 / 3);
    const fin = inicio + 1.8;
    ctx.beginPath();
    ctx.arc(x, y, r, inicio + 0.25, fin);
    ctx.stroke();
    const px = x + Math.cos(fin) * r;
    const py = y + Math.sin(fin) * r;
    ctx.beginPath();
    ctx.moveTo(px + Math.cos(fin) * 6, py + Math.sin(fin) * 6);
    ctx.lineTo(px - Math.cos(fin) * 6, py - Math.sin(fin) * 6);
    ctx.lineTo(px + Math.cos(fin + Math.PI / 2) * 7, py + Math.sin(fin + Math.PI / 2) * 7);
    ctx.closePath();
    ctx.fill();
  }
}

function actualizarContenedor(dt) {
  let direccion = 0;
  if (teclas["ArrowLeft"] || teclas["KeyA"]) direccion -= 1;
  if (teclas["ArrowRight"] || teclas["KeyD"]) direccion += 1;
  contenedor.x += direccion * contenedor.velocidad * dt;
  const mitad = contenedor.ancho / 2 + 6;
  if (contenedor.x < mitad) contenedor.x = mitad;
  if (contenedor.x > ANCHO - mitad) contenedor.x = ANCHO - mitad;
  if (contenedor.salto > 0) contenedor.salto = Math.max(0, contenedor.salto - dt);
}

function cambiarTipo(tipo) {
  if (contenedor.tipo === tipo) return;
  contenedor.tipo = tipo;
  contenedor.salto = 0.2;
}

function dibujarSelector() {
  for (let i = 0; i < ORDEN_TIPOS.length; i++) {
    const tipo = ORDEN_TIPOS[i];
    const t = TIPOS[tipo];
    const x = SELECTOR.x + i * (SELECTOR.ancho + SELECTOR.separacion);
    const activo = contenedor.tipo === tipo;
    ctx.globalAlpha = activo ? 1 : 0.55;
    ctx.fillStyle = t.color;
    ctx.beginPath();
    ctx.roundRect(x, SELECTOR.y, SELECTOR.ancho, SELECTOR.alto, 8);
    ctx.fill();
    if (activo) {
      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    escribir((i + 1) + " · " + t.nombre, x + SELECTOR.ancho / 2, SELECTOR.y + SELECTOR.alto / 2, 13, "white");
  }
}

// ---------- CONTROLES ----------

document.addEventListener("keydown", function (evento) {
  teclas[evento.code] = true;
  const indice = ["Digit1", "Digit2", "Digit3", "Digit4"].indexOf(evento.code.replace("Numpad", "Digit"));
  if (indice !== -1) cambiarTipo(ORDEN_TIPOS[indice]);
  if (evento.code.startsWith("Arrow") || evento.code === "Space") evento.preventDefault();
});

document.addEventListener("keyup", function (evento) {
  teclas[evento.code] = false;
});

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
  actualizarContenedor(dt);
}

function dibujar() {
  dibujarFondo();
  dibujarContenedor();
  dibujarSelector();
}

requestAnimationFrame(bucle);
