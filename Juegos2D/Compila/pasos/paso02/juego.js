// ===================================================
//  ¡Compila! - El roguelike de cartas donde tu mano
//  es un programa. HTML5 Canvas + JavaScript puro
// ===================================================

const lienzo = document.getElementById("lienzo");
const ctx = lienzo.getContext("2d");
const ANCHO = lienzo.width;
const ALTO = lienzo.height;

// ---------- ESTADO DEL JUEGO (variables que cambian) ----------

let tiempoAnterior = 0;
let tiempoTotal = 0;

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
}

requestAnimationFrame(bucle);
