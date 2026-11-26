// ===================================================
//  EcoCaza - Separa la basura, salva el planeta
//  Juego 2D hecho con HTML5 Canvas y JavaScript puro
// ===================================================

const lienzo = document.getElementById("lienzo");
const ctx = lienzo.getContext("2d");
const ANCHO = lienzo.width;
const ALTO = lienzo.height;

// ---------- ESTADO DEL JUEGO (variables que cambian) ----------

let tiempoAnterior = 0;
let tiempoTotal = 0;

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
}

requestAnimationFrame(bucle);
