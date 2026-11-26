// ===================================================
//  Barrendero Orbital - Limpia la chatarra espacial
//  Juego 2D de naves y asteroides con HTML5 Canvas
// ===================================================

const lienzo = document.getElementById("lienzo");
const ctx = lienzo.getContext("2d");
const ANCHO = lienzo.width;
const ALTO = lienzo.height;

// ---------- CONSTANTES DEL JUEGO ----------

const ROTACION = 4.2;
const EMPUJE = 260;
const FRICCION = 0.6;
const VELOCIDAD_DISPARO = 520;

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

const nave = {
  x: ANCHO / 2,
  y: ALTO / 2,
  angulo: -Math.PI / 2,
  radio: 12,
  vx: 0,
  vy: 0,
  propulsando: false,
};
const teclas = {};
let disparos = [];
let enfriamiento = 0;

// ---------- UTILIDADES ----------

function envolver(obj) {
  if (obj.x < -obj.radio) obj.x = ANCHO + obj.radio;
  if (obj.x > ANCHO + obj.radio) obj.x = -obj.radio;
  if (obj.y < -obj.radio) obj.y = ALTO + obj.radio;
  if (obj.y > ALTO + obj.radio) obj.y = -obj.radio;
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

// ---------- LA NAVE ----------

function dibujarNave() {
  ctx.save();
  ctx.translate(nave.x, nave.y);
  ctx.rotate(nave.angulo);
  if (nave.propulsando) {
    ctx.fillStyle = Math.random() < 0.5 ? "#ffb703" : "#fb8500";
    ctx.beginPath();
    ctx.moveTo(-10, -6);
    ctx.lineTo(-20 - Math.random() * 12, 0);
    ctx.lineTo(-10, 6);
    ctx.closePath();
    ctx.fill();
  }
  // Casco: una punta de flecha
  ctx.fillStyle = "#e0fbfc";
  ctx.strokeStyle = "#3dccc7";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(-12, -12);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-12, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Cabina
  ctx.fillStyle = "#0077b6";
  ctx.beginPath();
  ctx.arc(2, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  // Pinzas recolectoras
  ctx.strokeStyle = "#90e0ef";
  ctx.beginPath();
  ctx.moveTo(4, -7);
  ctx.lineTo(14, -13);
  ctx.lineTo(22, -9);
  ctx.moveTo(4, 7);
  ctx.lineTo(14, 13);
  ctx.lineTo(22, 9);
  ctx.stroke();
  ctx.restore();
}

function actualizarNave(dt) {
  if (teclas["ArrowLeft"] || teclas["KeyA"]) nave.angulo -= ROTACION * dt;
  if (teclas["ArrowRight"] || teclas["KeyD"]) nave.angulo += ROTACION * dt;
  nave.propulsando = !!(teclas["ArrowUp"] || teclas["KeyW"]);
  if (nave.propulsando) {
    nave.vx += Math.cos(nave.angulo) * EMPUJE * dt;
    nave.vy += Math.sin(nave.angulo) * EMPUJE * dt;
  }
  nave.vx -= nave.vx * FRICCION * dt;
  nave.vy -= nave.vy * FRICCION * dt;
  nave.x += nave.vx * dt;
  nave.y += nave.vy * dt;
  envolver(nave);
  enfriamiento -= dt;
  if (teclas["Space"] && enfriamiento <= 0) disparar();
}

// ---------- EL LÁSER ----------

function disparar() {
  disparos.push({
    x: nave.x + Math.cos(nave.angulo) * 18,
    y: nave.y + Math.sin(nave.angulo) * 18,
    vx: Math.cos(nave.angulo) * VELOCIDAD_DISPARO + nave.vx,
    vy: Math.sin(nave.angulo) * VELOCIDAD_DISPARO + nave.vy,
    radio: 2,
    vida: 0.9,
  });
  enfriamiento = 0.22;
}

function actualizarDisparos(dt) {
  for (const d of disparos) {
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.vida -= dt;
    envolver(d);
  }
  disparos = disparos.filter(function (d) { return d.vida > 0; });
}

function dibujarDisparos() {
  ctx.strokeStyle = "#80ffdb";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  for (const d of disparos) {
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x - d.vx * 0.02, d.y - d.vy * 0.02);
    ctx.stroke();
  }
  ctx.lineCap = "butt";
}

// ---------- CONTROLES ----------

document.addEventListener("keydown", function (evento) {
  teclas[evento.code] = true;
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
  actualizarNave(dt);
  actualizarDisparos(dt);
}

function dibujar() {
  dibujarFondo();
  dibujarDisparos();
  dibujarNave();
}

requestAnimationFrame(bucle);
