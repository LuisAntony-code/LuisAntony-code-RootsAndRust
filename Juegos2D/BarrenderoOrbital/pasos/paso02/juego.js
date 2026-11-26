// ===================================================
//  Barrendero Orbital - Limpia la chatarra espacial
//  Juego 2D de naves y asteroides con HTML5 Canvas
// ===================================================

const lienzo = document.getElementById("lienzo");
const ctx = lienzo.getContext("2d");
const ANCHO = lienzo.width;
const ALTO = lienzo.height;

// ---------- ESTADO DEL JUEGO (variables que cambian) ----------

let tiempoAnterior = 0;
let tiempoTotal = 0;

const estrellas = [];
for (let i = 0; i < 140; i++) {
  estrellas.push({
    x: Math.random() * ANCHO,
    y: Math.random() * ALTO,
    tam: 0.3 + Math.random() * 1.8,
    fase: Math.random() * Math.PI * 2,
  });
}

// ---------- FONDO: ESTRELLAS Y TIERRA ----------

function dibujarFondo() {
  ctx.fillStyle = "#05060f";
  ctx.fillRect(0, 0, ANCHO, ALTO);
  ctx.fillStyle = "white";
  for (const e of estrellas) {
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(tiempoTotal * 2 + e.fase);
    ctx.fillRect(e.x, e.y, e.tam, e.tam);
  }
  ctx.globalAlpha = 1;
  dibujarTierra();
}

function dibujarTierra() {
  const cx = ANCHO - 140;
  const cy = ALTO + 320;
  const r = 420;
  const halo = ctx.createRadialGradient(cx, cy, r - 10, cx, cy, r + 40);
  halo.addColorStop(0, "rgba(80, 170, 255, 0.55)");
  halo.addColorStop(1, "rgba(80, 170, 255, 0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1d5fa8";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "#3c9d5d";
  ctx.beginPath();
  ctx.ellipse(cx - 190, cy - 390, 120, 50, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 110, cy - 410, 90, 40, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
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
