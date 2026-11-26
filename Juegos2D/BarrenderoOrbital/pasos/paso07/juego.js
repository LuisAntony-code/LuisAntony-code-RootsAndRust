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
const TAMANOS = { 3: 46, 2: 26, 1: 14 };
const COLORES_CHATARRA = ["#8d99ae", "#adb5bd", "#9c6644", "#6c757d"];

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
let chatarras = [];
let oleada = 1;

// ---------- UTILIDADES ----------

function envolver(obj) {
  if (obj.x < -obj.radio) obj.x = ANCHO + obj.radio;
  if (obj.x > ANCHO + obj.radio) obj.x = -obj.radio;
  if (obj.y < -obj.radio) obj.y = ALTO + obj.radio;
  if (obj.y > ALTO + obj.radio) obj.y = -obj.radio;
}

function distancia(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
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

// ---------- LA CHATARRA ESPACIAL ----------

function formaAleatoria(radio) {
  const puntosForma = [];
  const lados = 7 + Math.floor(Math.random() * 4);
  for (let i = 0; i < lados; i++) {
    const angulo = (i / lados) * Math.PI * 2;
    const dist = radio * (0.7 + Math.random() * 0.35);
    puntosForma.push({ x: Math.cos(angulo) * dist, y: Math.sin(angulo) * dist });
  }
  return puntosForma;
}

function crearChatarra(x, y, tamano) {
  const radio = TAMANOS[tamano];
  const direccion = Math.random() * Math.PI * 2;
  const rapidez = (20 + Math.random() * 40 + (3 - tamano) * 30) * (1 + (oleada - 1) * 0.12);
  chatarras.push({
    x: x,
    y: y,
    tamano: tamano,
    radio: radio,
    forma: formaAleatoria(radio),
    vx: Math.cos(direccion) * rapidez,
    vy: Math.sin(direccion) * rapidez,
    angulo: 0,
    giro: (Math.random() - 0.5) * 1.5,
    color: COLORES_CHATARRA[Math.floor(Math.random() * COLORES_CHATARRA.length)],
  });
}

function iniciarOleada() {
  const cantidad = 2 + oleada;
  for (let i = 0; i < cantidad; i++) {
    let x, y;
    do {
      x = Math.random() * ANCHO;
      y = Math.random() * ALTO;
    } while (distancia(x, y, nave.x, nave.y) < 200);
    crearChatarra(x, y, 3);
  }
}

function actualizarChatarras(dt) {
  for (const c of chatarras) {
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    c.angulo += c.giro * dt;
    envolver(c);
  }
}

function dibujarChatarra(c) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.angulo);
  ctx.fillStyle = c.color;
  ctx.strokeStyle = "#2b2d42";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(c.forma[0].x, c.forma[0].y);
  for (let i = 1; i < c.forma.length; i++) ctx.lineTo(c.forma[i].x, c.forma[i].y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.fillRect(-c.radio * 0.4, -c.radio * 0.15, c.radio * 0.8, c.radio * 0.3);
  ctx.fillStyle = "#edf2f4";
  ctx.beginPath();
  ctx.arc(c.radio * 0.3, -c.radio * 0.35, Math.max(1.5, c.radio * 0.08), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
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
  actualizarChatarras(dt);
  actualizarNave(dt);
  actualizarDisparos(dt);
}

function dibujar() {
  dibujarFondo();
  for (const c of chatarras) dibujarChatarra(c);
  dibujarDisparos();
  dibujarNave();
}

iniciarOleada();
requestAnimationFrame(bucle);
