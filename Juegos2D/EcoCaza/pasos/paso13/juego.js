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
const DATOS_CURIOSOS = [
  "Una lata de aluminio se puede reciclar una y otra vez sin perder calidad.",
  "El vidrio se recicla al 100 % y las veces que haga falta.",
  "Con los restos orgánicos se fabrica compost, un abono natural para el campo.",
  "Reciclar papel ahorra agua, energía y árboles.",
  "Un residuo en el contenedor equivocado puede estropear todo un lote de reciclaje.",
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
  objetivoX: null,
};
const teclas = {};

let residuos = [];
let tiempoParaSiguiente = 1;
let intervaloAparicion = 1.4;
let velocidadCaida = 120;

let puntos = 0;
let vidas = 3;
let combo = 0;
let textosFlotantes = [];
let consejo = { titulo: "", texto: "", tiempo: 0 };
let contaminacion = 0;
let basuraSuelo = [];
let particulas = [];
let audio = null;

let estado = "menu";
let nivel = 1;
let record = 0;
let nuevoRecord = false;
let aciertos = 0;
let fallos = 0;
let perdidos = 0;
let motivoFin = "";
let datoFinal = "";

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

function mezclarColor(colorA, colorB, t) {
  const canales = [1, 3, 5].map(function (i) {
    const a = parseInt(colorA.slice(i, i + 2), 16);
    const b = parseInt(colorB.slice(i, i + 2), 16);
    return Math.round(a + (b - a) * t);
  });
  return "rgb(" + canales.join(",") + ")";
}

// ---------- ESCENARIO ----------

function dibujarFondo() {
  const suciedad = contaminacion / 100;
  const cielo = ctx.createLinearGradient(0, 0, 0, ALTO);
  cielo.addColorStop(0, mezclarColor("#6ec6ff", "#6b6257", suciedad));
  cielo.addColorStop(1, mezclarColor("#d8f3ff", "#a89a7c", suciedad));
  ctx.fillStyle = cielo;
  ctx.fillRect(0, 0, ANCHO, ALTO);

  // Sol
  ctx.fillStyle = mezclarColor("#ffd84d", "#8f8a7a", suciedad);
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

function dibujarBasuraSuelo() {
  for (const b of basuraSuelo) {
    ctx.save();
    ctx.translate(b.x, ALTO - 44);
    ctx.rotate(b.giro);
    ctx.scale(0.7, 0.7);
    DIBUJOS[b.modelo.dibujo]();
    ctx.restore();
  }
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
  if (direccion !== 0) {
    contenedor.objetivoX = null;
  } else if (contenedor.objetivoX !== null) {
    const distancia = contenedor.objetivoX - contenedor.x;
    const paso = contenedor.velocidad * 1.4 * dt;
    if (Math.abs(distancia) <= paso) contenedor.x = contenedor.objetivoX;
    else contenedor.x += Math.sign(distancia) * paso;
  }
  const mitad = contenedor.ancho / 2 + 6;
  if (contenedor.x < mitad) contenedor.x = mitad;
  if (contenedor.x > ANCHO - mitad) contenedor.x = ANCHO - mitad;
  if (contenedor.salto > 0) contenedor.salto = Math.max(0, contenedor.salto - dt);
}

function cambiarTipo(tipo) {
  if (contenedor.tipo === tipo) return;
  contenedor.tipo = tipo;
  contenedor.salto = 0.2;
  sonido(300 + ORDEN_TIPOS.indexOf(tipo) * 100, 0.08, "sine", 0.12);
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
    if (tocaContenedor(r)) {
      atrapar(r);
      residuos.splice(i, 1);
      continue;
    }
    if (r.y > ALTO - 50) {
      residuoPerdido(r);
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

// ---------- ATRAPAR Y PUNTUAR ----------

function tocaContenedor(r) {
  const boca = contenedor.y - contenedor.alto;
  const dentroX = Math.abs(r.x - contenedor.x) < contenedor.ancho / 2;
  const dentroY = r.y + r.radio > boca && r.y < boca + 30;
  return dentroX && dentroY;
}

function atrapar(r) {
  if (r.modelo.tipo === contenedor.tipo) {
    combo += 1;
    const ganados = 10 * Math.min(combo, 5);
    puntos += ganados;
    crearTextoFlotante("+" + ganados, r.x, r.y - 20, "#b9ff66");
    contaminacion = Math.max(0, contaminacion - 3);
    crearParticulas(r.x, contenedor.y - contenedor.alto, TIPOS[contenedor.tipo].color, 18);
    sonidoAcierto();
    aciertos += 1;
  } else {
    combo = 0;
    vidas -= 1;
    crearTextoFlotante("¡Contenedor equivocado!", r.x, r.y - 20, "#ff7675");
    mostrarConsejo(r.modelo);
    crearParticulas(r.x, contenedor.y - contenedor.alto, "#636e72", 12);
    sonidoError();
    fallos += 1;
  }
}

function residuoPerdido(r) {
  combo = 0;
  contaminacion = Math.min(100, contaminacion + 10);
  basuraSuelo.push({ x: r.x, giro: r.giro, modelo: r.modelo });
  if (basuraSuelo.length > 25) basuraSuelo.shift();
  crearTextoFlotante("¡Al suelo! +10 % contaminación", r.x, ALTO - 80, "#ffeaa7");
  sonidoPerdido();
  perdidos += 1;
}

// ---------- TEXTOS, CONSEJOS Y MARCADOR ----------

function crearTextoFlotante(texto, x, y, color) {
  textosFlotantes.push({ texto: texto, x: Math.min(Math.max(x, 170), ANCHO - 170), y: y, color: color, vida: 1.2 });
}

function actualizarTextos(dt) {
  for (const t of textosFlotantes) {
    t.y -= 45 * dt;
    t.vida -= dt;
  }
  textosFlotantes = textosFlotantes.filter(function (t) { return t.vida > 0; });
  if (consejo.tiempo > 0) consejo.tiempo -= dt;
}

function dibujarTextos() {
  for (const t of textosFlotantes) {
    ctx.globalAlpha = Math.min(1, t.vida);
    escribir(t.texto, t.x, t.y, 20, t.color);
  }
  ctx.globalAlpha = 1;
}

function mostrarConsejo(modelo) {
  consejo.titulo = "¡Ups! " + modelo.nombre + " no va ahí.";
  consejo.texto = modelo.consejo;
  consejo.tiempo = 3.5;
}

function dibujarConsejo() {
  if (consejo.tiempo <= 0) return;
  ctx.globalAlpha = Math.min(1, consejo.tiempo);
  ctx.fillStyle = "rgba(20, 30, 25, 0.88)";
  ctx.beginPath();
  ctx.roundRect(70, 200, ANCHO - 140, 80, 14);
  ctx.fill();
  escribir(consejo.titulo, ANCHO / 2, 225, 20, "#ff7675");
  escribir(consejo.texto, ANCHO / 2, 256, 17, "white");
  ctx.globalAlpha = 1;
}

function dibujarHUD() {
  escribir("Puntos: " + puntos, 20, 30, 24, "white", "left");
  for (let i = 0; i < 3; i++) {
    dibujarCorazon(32 + i * 34, 68, 12, i < vidas);
  }
  if (combo >= 2) escribir("¡Combo x" + Math.min(combo, 5) + "!", ANCHO / 2, 30, 24, "#fdcb6e");
  escribir("Contaminación", ANCHO - 20, 20, 16, "white", "right");
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.fillRect(ANCHO - 220, 34, 200, 16);
  ctx.fillStyle = mezclarColor("#2ecc71", "#8e44ad", contaminacion / 100);
  ctx.fillRect(ANCHO - 220, 34, 2 * contaminacion, 16);
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.strokeRect(ANCHO - 220, 34, 200, 16);
  escribir("Nivel " + nivel + "  ·  Récord " + record, ANCHO - 20, 68, 15, "white", "right");
}

function dibujarCorazon(x, y, tam, lleno) {
  ctx.fillStyle = lleno ? "#e84393" : "rgba(255, 255, 255, 0.3)";
  ctx.beginPath();
  ctx.moveTo(x, y + tam);
  ctx.bezierCurveTo(x - tam * 1.8, y - tam * 0.2, x - tam * 0.7, y - tam * 1.4, x, y - tam * 0.4);
  ctx.bezierCurveTo(x + tam * 0.7, y - tam * 1.4, x + tam * 1.8, y - tam * 0.2, x, y + tam);
  ctx.fill();
}

// ---------- EFECTOS: PARTÍCULAS Y SONIDO ----------

function crearParticulas(x, y, color, cantidad) {
  for (let i = 0; i < cantidad; i++) {
    const angulo = Math.random() * Math.PI * 2;
    const rapidez = 60 + Math.random() * 180;
    particulas.push({
      x: x,
      y: y,
      vx: Math.cos(angulo) * rapidez,
      vy: Math.sin(angulo) * rapidez - 80,
      vida: 0.6 + Math.random() * 0.4,
      color: color,
      tam: 3 + Math.random() * 4,
    });
  }
}

function actualizarParticulas(dt) {
  for (const p of particulas) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 400 * dt;
    p.vida -= dt;
  }
  particulas = particulas.filter(function (p) { return p.vida > 0; });
}

function dibujarParticulas() {
  for (const p of particulas) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.vida * 2));
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.tam / 2, p.y - p.tam / 2, p.tam, p.tam);
  }
  ctx.globalAlpha = 1;
}

function sonido(frecuencia, duracion, tipoOnda, volumen) {
  if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
  if (audio.state === "suspended") audio.resume();
  const oscilador = audio.createOscillator();
  const volumenNodo = audio.createGain();
  oscilador.type = tipoOnda;
  oscilador.frequency.value = frecuencia;
  volumenNodo.gain.setValueAtTime(volumen, audio.currentTime);
  volumenNodo.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duracion);
  oscilador.connect(volumenNodo);
  volumenNodo.connect(audio.destination);
  oscilador.start();
  oscilador.stop(audio.currentTime + duracion);
}

function sonidoAcierto() {
  sonido(660, 0.12, "square", 0.12);
  setTimeout(function () { sonido(880, 0.15, "square", 0.12); }, 80);
}

function sonidoError() {
  sonido(140, 0.35, "sawtooth", 0.18);
}

function sonidoPerdido() {
  sonido(220, 0.25, "triangle", 0.2);
}

// ---------- ESTADOS: MENÚ, PARTIDA Y FIN ----------

function empezarPartida() {
  estado = "jugando";
  puntos = 0;
  vidas = 3;
  combo = 0;
  nivel = 1;
  contaminacion = 0;
  residuos = [];
  basuraSuelo = [];
  textosFlotantes = [];
  particulas = [];
  aciertos = 0;
  fallos = 0;
  perdidos = 0;
  velocidadCaida = 120;
  intervaloAparicion = 1.4;
  tiempoParaSiguiente = 0.5;
  consejo.tiempo = 0;
  contenedor.x = ANCHO / 2;
  nuevoRecord = false;
}

function actualizarDificultad() {
  const nivelNuevo = 1 + Math.floor(puntos / 150);
  if (nivelNuevo > nivel) {
    nivel = nivelNuevo;
    velocidadCaida = 120 + (nivel - 1) * 25;
    intervaloAparicion = Math.max(0.45, 1.4 - (nivel - 1) * 0.12);
    crearTextoFlotante("¡Nivel " + nivel + "!", ANCHO / 2, 160, "#74b9ff");
    sonido(520, 0.3, "triangle", 0.15);
  }
}

function comprobarFin() {
  if (vidas <= 0) terminarPartida("¡Te quedaste sin vidas!");
  else if (contaminacion >= 100) terminarPartida("¡El planeta se llenó de basura!");
}

function terminarPartida(motivo) {
  estado = "fin";
  motivoFin = motivo;
  datoFinal = DATOS_CURIOSOS[Math.floor(Math.random() * DATOS_CURIOSOS.length)];
  if (puntos > record) {
    record = puntos;
    nuevoRecord = true;
    guardarRecord(record);
  }
  sonido(180, 0.6, "sawtooth", 0.18);
}

function leerRecord() {
  try {
    return Number(localStorage.getItem("ecocaza_record")) || 0;
  } catch (error) {
    return 0;
  }
}

function guardarRecord(valor) {
  try {
    localStorage.setItem("ecocaza_record", String(valor));
  } catch (error) {}
}

function dibujarPantallaMenu() {
  ctx.fillStyle = "rgba(10, 40, 25, 0.8)";
  ctx.fillRect(0, 0, ANCHO, ALTO);
  escribir("EcoCaza", ANCHO / 2, 95, 72, "#b9ff66");
  escribir("Separa la basura, salva el planeta", ANCHO / 2, 155, 24, "white");
  for (let i = 0; i < ORDEN_TIPOS.length; i++) {
    const t = TIPOS[ORDEN_TIPOS[i]];
    const x = SELECTOR.x + i * (SELECTOR.ancho + SELECTOR.separacion);
    ctx.fillStyle = t.color;
    ctx.beginPath();
    ctx.roundRect(x, 200, SELECTOR.ancho, 170, 12);
    ctx.fill();
    escribir(String(i + 1), x + SELECTOR.ancho / 2, 228, 30, "white");
    escribir(t.nombre, x + SELECTOR.ancho / 2, 262, 16, "white");
    const ejemplos = RESIDUOS.filter(function (r) { return r.tipo === ORDEN_TIPOS[i]; });
    for (let j = 0; j < ejemplos.length; j++) {
      escribir(ejemplos[j].nombre, x + SELECTOR.ancho / 2, 295 + j * 22, 13, "white");
    }
  }
  escribir("Muévete con ← → (o el ratón)  ·  Cambia de contenedor con 1 2 3 4", ANCHO / 2, 410, 17, "white");
  escribir("Error = pierdes una vida  ·  Al suelo = el planeta se contamina", ANCHO / 2, 440, 17, "#ffeaa7");
  if (Math.sin(tiempoTotal * 5) > 0) {
    escribir("Pulsa ESPACIO o haz clic para empezar", ANCHO / 2, 490, 26, "#b9ff66");
  }
  if (record > 0) escribir("Récord: " + record, ANCHO / 2, 525, 18, "white");
}

function dibujarPantallaFin() {
  ctx.fillStyle = "rgba(10, 40, 25, 0.85)";
  ctx.fillRect(0, 0, ANCHO, ALTO);
  escribir("Fin de la partida", ANCHO / 2, 90, 52, "#b9ff66");
  escribir(motivoFin, ANCHO / 2, 145, 24, "#ffeaa7");
  escribir("Puntos: " + puntos, ANCHO / 2, 205, 40, "white");
  escribir(nuevoRecord ? "¡NUEVO RÉCORD!" : "Récord: " + record, ANCHO / 2, 250, 22, nuevoRecord ? "#fdcb6e" : "white");
  const total = aciertos + fallos + perdidos;
  const precision = total > 0 ? Math.round((aciertos / total) * 100) : 0;
  escribir("Bien separados: " + aciertos + "   ·   Equivocados: " + fallos + "   ·   Al suelo: " + perdidos, ANCHO / 2, 300, 18, "white");
  escribir("Precisión: " + precision + " %", ANCHO / 2, 332, 20, "white");
  let mensaje = "Sigue practicando: cada residuo bien separado cuenta.";
  if (precision >= 50) mensaje = "¡Vas bien! Repasa los consejos y lo harás aún mejor.";
  if (precision >= 80) mensaje = "¡Eres un experto del reciclaje!";
  escribir(mensaje, ANCHO / 2, 372, 20, "#b9ff66");
  escribir("¿Sabías que...? " + datoFinal, ANCHO / 2, 425, 15, "#dfe6e9");
  if (Math.sin(tiempoTotal * 5) > 0) {
    escribir("Pulsa ESPACIO o haz clic para jugar otra vez", ANCHO / 2, 490, 24, "#b9ff66");
  }
}

// ---------- CONTROLES ----------

document.addEventListener("keydown", function (evento) {
  teclas[evento.code] = true;
  const indice = ["Digit1", "Digit2", "Digit3", "Digit4"].indexOf(evento.code.replace("Numpad", "Digit"));
  if (indice !== -1) cambiarTipo(ORDEN_TIPOS[indice]);
  if (evento.code === "Space" && estado !== "jugando") empezarPartida();
  if (evento.code.startsWith("Arrow") || evento.code === "Space") evento.preventDefault();
});

document.addEventListener("keyup", function (evento) {
  teclas[evento.code] = false;
});

function posicionEnLienzo(evento) {
  const rect = lienzo.getBoundingClientRect();
  return {
    x: (evento.clientX - rect.left) * (ANCHO / rect.width),
    y: (evento.clientY - rect.top) * (ALTO / rect.height),
  };
}

lienzo.addEventListener("pointerdown", function (evento) {
  if (estado !== "jugando") {
    empezarPartida();
    return;
  }
  const p = posicionEnLienzo(evento);
  if (p.y >= SELECTOR.y - 6) {
    const indice = Math.floor((p.x - SELECTOR.x) / (SELECTOR.ancho + SELECTOR.separacion));
    if (indice >= 0 && indice < ORDEN_TIPOS.length) cambiarTipo(ORDEN_TIPOS[indice]);
    return;
  }
  contenedor.objetivoX = p.x;
});

lienzo.addEventListener("pointermove", function (evento) {
  if (evento.pointerType === "mouse" || evento.buttons > 0) {
    const p = posicionEnLienzo(evento);
    if (p.y < SELECTOR.y - 6) contenedor.objetivoX = p.x;
  }
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
  actualizarParticulas(dt);
  actualizarTextos(dt);
  if (estado !== "jugando") return;
  actualizarContenedor(dt);
  actualizarResiduos(dt);
  actualizarDificultad();
  comprobarFin();
}

function dibujar() {
  dibujarFondo();
  dibujarBasuraSuelo();
  for (const r of residuos) dibujarResiduo(r);
  dibujarContenedor();
  dibujarParticulas();
  dibujarTextos();
  dibujarHUD();
  dibujarSelector();
  dibujarConsejo();
  if (estado === "menu") dibujarPantallaMenu();
  if (estado === "fin") dibujarPantallaFin();
}

record = leerRecord();
requestAnimationFrame(bucle);
