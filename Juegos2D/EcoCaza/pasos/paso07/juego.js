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

const RESIDUOS = [
  { nombre: "Botella de plástico", tipo: "amarillo", dibujo: "botellaPlastico", consejo: "Las botellas de plástico van al contenedor AMARILLO." },
  { nombre: "Lata de refresco", tipo: "amarillo", dibujo: "lata", consejo: "Las latas son envases: ¡al AMARILLO!" },
  { nombre: "Brik de leche", tipo: "amarillo", dibujo: "brik", consejo: "Aunque parezca cartón, el brik lleva plástico y aluminio: AMARILLO." },
  { nombre: "Periódico", tipo: "azul", dibujo: "periodico", consejo: "Periódicos, revistas y folios van al contenedor AZUL." },
  { nombre: "Caja de cartón", tipo: "azul", dibujo: "caja", consejo: "Las cajas de cartón van al AZUL (¡plégalas para que quepan más!)." },
  { nombre: "Botella de vidrio", tipo: "verde", dibujo: "botellaVidrio", consejo: "Las botellas de vidrio van al VERDE, sin el tapón." },
  { nombre: "Tarro de vidrio", tipo: "verde", dibujo: "tarro", consejo: "Los tarros van al VERDE. ¡Su tapa metálica va al AMARILLO!" },
  { nombre: "Cáscara de plátano", tipo: "marron", dibujo: "platano", consejo: "Los restos de fruta son ORGÁNICOS: contenedor MARRÓN." },
  { nombre: "Manzana mordida", tipo: "marron", dibujo: "manzana", consejo: "La comida sobrante va al MARRÓN y se convierte en abono (compost)." },
];

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

let residuos = [];
let tiempoParaSiguiente = 1;
let intervaloAparicion = 1.4;
let velocidadCaida = 120;

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

// ---------- LOS RESIDUOS ----------

function crearResiduo() {
  const modelo = RESIDUOS[Math.floor(Math.random() * RESIDUOS.length)];
  residuos.push({
    modelo: modelo,
    x: 50 + Math.random() * (ANCHO - 100),
    y: -30,
    radio: 22,
    velocidad: velocidadCaida * (0.8 + Math.random() * 0.4),
    giro: 0,
    velocidadGiro: (Math.random() - 0.5) * 2,
  });
}

function actualizarResiduos(dt) {
  tiempoParaSiguiente -= dt;
  if (tiempoParaSiguiente <= 0) {
    crearResiduo();
    tiempoParaSiguiente = intervaloAparicion;
  }
  for (let i = residuos.length - 1; i >= 0; i--) {
    const r = residuos[i];
    r.y += r.velocidad * dt;
    r.giro += r.velocidadGiro * dt;
    if (r.y > ALTO - 50) {
      residuos.splice(i, 1);
    }
  }
}

function dibujarResiduo(r) {
  ctx.save();
  ctx.translate(r.x, r.y);
  ctx.rotate(r.giro);
  DIBUJOS[r.modelo.dibujo]();
  ctx.restore();
  escribir(r.modelo.nombre, r.x, r.y + 34, 12, "white");
}

const DIBUJOS = {
  botellaPlastico: function () {
    ctx.fillStyle = "rgba(120, 200, 255, 0.9)";
    ctx.beginPath();
    ctx.roundRect(-10, -14, 20, 34, 6);
    ctx.fill();
    ctx.fillRect(-5, -22, 10, 9);
    ctx.fillStyle = "#e74c3c";
    ctx.fillRect(-6, -27, 12, 6);
    ctx.fillStyle = "white";
    ctx.fillRect(-10, -2, 20, 9);
  },
  lata: function () {
    ctx.fillStyle = "#e74c3c";
    ctx.beginPath();
    ctx.roundRect(-12, -18, 24, 36, 4);
    ctx.fill();
    ctx.fillStyle = "#bdc3c7";
    ctx.fillRect(-11, -20, 22, 4);
    ctx.fillRect(-11, 16, 22, 4);
    ctx.fillStyle = "white";
    ctx.fillRect(-12, -4, 24, 6);
  },
  brik: function () {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-13, -14, 26, 32);
    ctx.fillStyle = "#dfe6e9";
    ctx.beginPath();
    ctx.moveTo(-13, -14);
    ctx.lineTo(0, -24);
    ctx.lineTo(13, -14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#3498db";
    ctx.fillRect(-13, -2, 26, 10);
    ctx.strokeStyle = "#95a5a6";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-13, -14, 26, 32);
  },
  periodico: function () {
    ctx.fillStyle = "#f5f5f0";
    ctx.fillRect(-18, -14, 36, 28);
    ctx.strokeStyle = "#999999";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-18, -14, 36, 28);
    ctx.fillStyle = "#555555";
    ctx.fillRect(-14, -10, 28, 5);
    ctx.fillStyle = "#aaaaaa";
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(-14, -1 + i * 6, 28, 2);
    }
  },
  caja: function () {
    ctx.fillStyle = "#c8925a";
    ctx.fillRect(-18, -14, 36, 28);
    ctx.fillStyle = "#a8743f";
    ctx.fillRect(-18, -14, 36, 6);
    ctx.fillStyle = "#e8c48c";
    ctx.fillRect(-3, -14, 6, 28);
  },
  botellaVidrio: function () {
    ctx.fillStyle = "#2e8b57";
    ctx.beginPath();
    ctx.roundRect(-10, -8, 20, 28, 5);
    ctx.fill();
    ctx.fillRect(-4, -24, 8, 17);
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.fillRect(-6, -4, 3, 18);
  },
  tarro: function () {
    ctx.fillStyle = "rgba(170, 220, 200, 0.85)";
    ctx.beginPath();
    ctx.roundRect(-14, -12, 28, 30, 6);
    ctx.fill();
    ctx.fillStyle = "#c0392b";
    ctx.beginPath();
    ctx.roundRect(-11, 0, 22, 15, 4);
    ctx.fill();
    ctx.fillStyle = "#95a5a6";
    ctx.fillRect(-15, -18, 30, 7);
  },
  platano: function () {
    ctx.strokeStyle = "#f4d03f";
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, -12, 22, 0.5, 2.6);
    ctx.stroke();
    ctx.lineCap = "butt";
    ctx.fillStyle = "#6e4b1f";
    ctx.beginPath();
    ctx.arc(Math.cos(0.5) * 22, -12 + Math.sin(0.5) * 22, 4, 0, Math.PI * 2);
    ctx.fill();
  },
  manzana: function () {
    ctx.fillStyle = "#e74c3c";
    ctx.beginPath();
    ctx.arc(0, 2, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fdf2e0";
    ctx.beginPath();
    ctx.arc(15, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6e4b1f";
    ctx.fillRect(-2, -20, 4, 9);
    ctx.fillStyle = "#27ae60";
    ctx.beginPath();
    ctx.ellipse(6, -17, 7, 3.5, -0.5, 0, Math.PI * 2);
    ctx.fill();
  },
};

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
  actualizarResiduos(dt);
}

function dibujar() {
  dibujarFondo();
  for (const r of residuos) dibujarResiduo(r);
  dibujarContenedor();
  dibujarSelector();
}

requestAnimationFrame(bucle);
