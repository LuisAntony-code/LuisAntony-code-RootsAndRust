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
const PUNTOS_POR_TAMANO = { 3: 20, 2: 50, 1: 100 };
const NOMBRES_SATELITE = ["Satélite GPS", "Satélite del clima", "Satélite de internet", "Telescopio espacial", "Satélite de televisión"];
const DATOS_CURIOSOS = [
  "Hay decenas de miles de objetos vigilados en órbita, y la mayoría son basura.",
  "Se calcula que hay más de un millón de fragmentos de entre 1 y 10 cm dando vueltas a la Tierra.",
  "En órbita, un simple tornillo viaja a unos 28.000 km/h: más rápido que una bala.",
  "Síndrome de Kessler: cada choque crea más fragmentos, que provocan más choques.",
  "Ya se prueban misiones reales para retirar basura espacial con redes, imanes y brazos robóticos.",
];

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
  invulnerable: 0,
};
const teclas = {};
let disparos = [];
let enfriamiento = 0;
let chatarras = [];
let oleada = 1;
let puntos = 0;
let fragmentos = [];
let kilosRecogidos = 0;
let textosFlotantes = [];
let vidas = 3;
let satelites = [];
let tiempoSatelite = 5;
let satelitesSalvados = 0;
let satelitesPerdidos = 0;
let esperaOleada = 0;
let mensaje = { titulo: "", texto: "", tiempo: 0 };
let particulas = [];
let audio = null;
let temblor = 0;
let estado = "menu";
let record = 0;
let nuevoRecord = false;
let datoFinal = "";

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

function chocan(a, b) {
  return distancia(a.x, a.y, b.x, b.y) < a.radio + b.radio;
}

function escribir(texto, x, y, tamano, color, alineacion) {
  ctx.font = "bold " + tamano + "px Arial";
  ctx.textAlign = alineacion || "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(2, tamano / 6);
  ctx.strokeStyle = "rgba(0, 0, 0, 0.7)";
  ctx.strokeText(texto, x, y);
  ctx.fillStyle = color;
  ctx.fillText(texto, x, y);
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
  if (nave.invulnerable > 0 && Math.floor(nave.invulnerable * 10) % 2 === 0) return;
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
    crearParticula(nave.x - Math.cos(nave.angulo) * 14, nave.y - Math.sin(nave.angulo) * 14, -Math.cos(nave.angulo) * 120 + (Math.random() - 0.5) * 60, -Math.sin(nave.angulo) * 120 + (Math.random() - 0.5) * 60, Math.random() < 0.5 ? "#ffb703" : "#fb8500", 0.35, 3);
  }
  nave.vx -= nave.vx * FRICCION * dt;
  nave.vy -= nave.vy * FRICCION * dt;
  nave.x += nave.vx * dt;
  nave.y += nave.vy * dt;
  envolver(nave);
  enfriamiento -= dt;
  if (teclas["Space"] && enfriamiento <= 0) disparar();
  if (nave.invulnerable > 0) nave.invulnerable -= dt;
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
  sonido(900, 0.12, "square", 0.05, 300);
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

// ---------- DISPAROS CONTRA LA CHATARRA ----------

function comprobarDisparos() {
  for (let i = disparos.length - 1; i >= 0; i--) {
    const d = disparos[i];
    let impacto = false;
    for (let j = chatarras.length - 1; j >= 0 && !impacto; j--) {
      if (chocan(d, chatarras[j])) {
        romperChatarra(j);
        impacto = true;
      }
    }
    for (let j = satelites.length - 1; j >= 0 && !impacto; j--) {
      if (chocan(d, satelites[j])) {
        satelitePorDisparo(j);
        impacto = true;
      }
    }
    if (impacto) disparos.splice(i, 1);
  }
}

function romperChatarra(indice) {
  const c = chatarras[indice];
  chatarras.splice(indice, 1);
  puntos += PUNTOS_POR_TAMANO[c.tamano];
  if (c.tamano > 1) {
    crearChatarra(c.x, c.y, c.tamano - 1);
    crearChatarra(c.x, c.y, c.tamano - 1);
  }
  if (c.tamano === 1) crearFragmento(c.x, c.y);
  explosion(c.x, c.y, c.color, 8 + c.tamano * 8);
  sonido(160 - c.tamano * 30, 0.25 + c.tamano * 0.1, "sawtooth", 0.15, 40);
  temblor = Math.max(temblor, c.tamano * 2);
}

// ---------- FRAGMENTOS RECICLABLES ----------

function crearFragmento(x, y) {
  fragmentos.push({ x: x, y: y, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30, radio: 8, vida: 8 });
}

function actualizarFragmentos(dt) {
  for (let i = fragmentos.length - 1; i >= 0; i--) {
    const f = fragmentos[i];
    const d = distancia(f.x, f.y, nave.x, nave.y);
    if (d < 110 && d > 0) {
      f.vx += ((nave.x - f.x) / d) * 400 * dt;
      f.vy += ((nave.y - f.y) / d) * 400 * dt;
    }
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    f.vida -= dt;
    envolver(f);
    if (chocan(f, nave)) {
      fragmentos.splice(i, 1);
      recoger(f);
    } else if (f.vida <= 0) {
      fragmentos.splice(i, 1);
    }
  }
}

function recoger(f) {
  const kilos = 5 + Math.floor(Math.random() * 6);
  kilosRecogidos += kilos;
  puntos += 30;
  crearTextoFlotante("+" + kilos + " kg reciclados", f.x, f.y - 18, "#57ff9a");
  sonido(500, 0.15, "sine", 0.18, 1200);
}

function dibujarFragmento(f) {
  const pulso = 1 + Math.sin(tiempoTotal * 6 + f.x) * 0.15;
  ctx.fillStyle = "rgba(87, 255, 154, 0.25)";
  ctx.beginPath();
  ctx.arc(f.x, f.y, f.radio * 1.8 * pulso, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#57ff9a";
  ctx.beginPath();
  ctx.arc(f.x, f.y, f.radio * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0b3d2e";
  ctx.fillRect(f.x - 1.5, f.y - 4, 3, 8);
  ctx.fillRect(f.x - 4, f.y - 1.5, 8, 3);
}

function dibujarFragmentos() {
  for (const f of fragmentos) {
    if (f.vida < 2 && Math.floor(f.vida * 8) % 2 === 0) continue;
    dibujarFragmento(f);
  }
}

// ---------- TEXTOS FLOTANTES ----------

function crearTextoFlotante(texto, x, y, color) {
  textosFlotantes.push({ texto: texto, x: Math.min(Math.max(x, 230), ANCHO - 230), y: y, color: color, vida: 1.3 });
}

function actualizarTextos(dt) {
  for (const t of textosFlotantes) {
    t.y -= 40 * dt;
    t.vida -= dt;
  }
  textosFlotantes = textosFlotantes.filter(function (t) { return t.vida > 0; });
}

function dibujarTextos() {
  for (const t of textosFlotantes) {
    ctx.globalAlpha = Math.min(1, t.vida);
    escribir(t.texto, t.x, t.y, 18, t.color);
  }
  ctx.globalAlpha = 1;
}

// ---------- CHOQUES DE LA NAVE ----------

function comprobarChoqueNave() {
  if (nave.invulnerable > 0) return;
  for (const c of chatarras) {
    if (chocan(nave, c)) {
      naveDestruida();
      return;
    }
  }
}

function naveDestruida() {
  explosion(nave.x, nave.y, "#3dccc7", 40);
  sonido(220, 0.8, "sawtooth", 0.25, 30);
  temblor = 12;
  vidas -= 1;
  nave.x = ANCHO / 2;
  nave.y = ALTO / 2;
  nave.vx = 0;
  nave.vy = 0;
  nave.angulo = -Math.PI / 2;
  nave.invulnerable = 3;
  if (vidas <= 0) terminarPartida();
}

// ---------- SATÉLITES ACTIVOS ----------

function crearSatelite() {
  const desdeIzquierda = Math.random() < 0.5;
  satelites.push({
    x: desdeIzquierda ? -40 : ANCHO + 40,
    y: 80 + Math.random() * (ALTO - 200),
    vx: (desdeIzquierda ? 1 : -1) * (45 + Math.random() * 25),
    vy: (Math.random() - 0.5) * 20,
    radio: 20,
    angulo: 0,
    nombre: NOMBRES_SATELITE[Math.floor(Math.random() * NOMBRES_SATELITE.length)],
  });
}

function actualizarSatelites(dt) {
  tiempoSatelite -= dt;
  if (tiempoSatelite <= 0) {
    crearSatelite();
    tiempoSatelite = 9 + Math.random() * 6;
  }
  for (let i = satelites.length - 1; i >= 0; i--) {
    const s = satelites[i];
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.angulo += 0.4 * dt;
    if (s.y < 50 || s.y > ALTO - 90) s.vy = -s.vy;
    const golpeado = chatarras.some(function (c) { return chocan(s, c); });
    if (golpeado) {
      satelites.splice(i, 1);
      convertirEnChatarra(s, "¡Choque! La chatarra destruyó el " + s.nombre);
      continue;
    }
    if (s.x < -60 || s.x > ANCHO + 60) {
      satelites.splice(i, 1);
      sateliteASalvo(s);
    }
  }
}

function satelitePorDisparo(j) {
  const s = satelites[j];
  satelites.splice(j, 1);
  puntos = Math.max(0, puntos - 100);
  convertirEnChatarra(s, "¡No dispares! El " + s.nombre + " funcionaba. -100");
}

function convertirEnChatarra(s, texto) {
  crearChatarra(s.x, s.y, 2);
  crearChatarra(s.x, s.y, 2);
  satelitesPerdidos += 1;
  crearTextoFlotante(texto, s.x, s.y - 30, "#ff6b6b");
  explosion(s.x, s.y, "#ffd166", 30);
  sonido(300, 0.7, "sawtooth", 0.2, 50);
  temblor = 8;
}

function sateliteASalvo(s) {
  satelitesSalvados += 1;
  puntos += 150;
  crearTextoFlotante("¡" + s.nombre + " a salvo! +150", s.x < 0 ? 230 : ANCHO - 230, s.y, "#a8dadc");
  sonido(700, 0.12, "triangle", 0.15);
  setTimeout(function () { sonido(1050, 0.2, "triangle", 0.15); }, 120);
}

function dibujarSatelite(s) {
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(Math.sin(s.angulo) * 0.3);
  ctx.fillStyle = "#1d3557";
  ctx.strokeStyle = "#a8dadc";
  ctx.lineWidth = 1.5;
  ctx.fillRect(-36, -8, 22, 16);
  ctx.strokeRect(-36, -8, 22, 16);
  ctx.fillRect(14, -8, 22, 16);
  ctx.strokeRect(14, -8, 22, 16);
  ctx.beginPath();
  ctx.moveTo(-25, -8);
  ctx.lineTo(-25, 8);
  ctx.moveTo(25, -8);
  ctx.lineTo(25, 8);
  ctx.stroke();
  ctx.fillStyle = "#adb5bd";
  ctx.fillRect(-14, -2, 28, 4);
  ctx.fillStyle = "#ffd166";
  ctx.fillRect(-9, -10, 18, 20);
  ctx.fillStyle = Math.sin(tiempoTotal * 8) > 0 ? "#06d6a0" : "#073b4c";
  ctx.beginPath();
  ctx.arc(0, -14, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  escribir(s.nombre, s.x, s.y + 28, 11, "#a8dadc");
}

// ---------- OLEADAS, MARCADOR Y MENSAJES ----------

function comprobarOleada(dt) {
  if (chatarras.length > 0) return;
  if (esperaOleada === 0) {
    esperaOleada = 2.5;
    puntos += 100 * oleada;
    mostrarMensaje("¡Órbita limpia!", "Bonus +" + 100 * oleada + "  ·  Llega la oleada " + (oleada + 1));
  }
  esperaOleada -= dt;
  if (esperaOleada <= 0) {
    esperaOleada = 0;
    oleada += 1;
    iniciarOleada();
  }
}

function mostrarMensaje(titulo, texto) {
  mensaje.titulo = titulo;
  mensaje.texto = texto;
  mensaje.tiempo = 2.5;
}

function dibujarMensaje() {
  if (mensaje.tiempo <= 0) return;
  ctx.globalAlpha = Math.min(1, mensaje.tiempo);
  escribir(mensaje.titulo, ANCHO / 2, ALTO / 2 - 40, 46, "#80ffdb");
  escribir(mensaje.texto, ANCHO / 2, ALTO / 2 + 10, 20, "white");
  ctx.globalAlpha = 1;
}

function dibujarHUD() {
  escribir("Puntos: " + puntos, 20, 28, 22, "white", "left");
  for (let i = 0; i < vidas; i++) dibujarNaveMini(32 + i * 28, 62);
  escribir("Oleada " + oleada, ANCHO / 2, 28, 22, "#80ffdb");
  escribir("Reciclado: " + kilosRecogidos + " kg", ANCHO - 20, 28, 20, "#57ff9a", "right");
  escribir("Satélites salvados: " + satelitesSalvados, ANCHO - 20, 56, 15, "#a8dadc", "right");
  escribir("Récord: " + record, ANCHO - 20, 80, 14, "white", "right");
}

function dibujarNaveMini(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.scale(0.7, 0.7);
  ctx.fillStyle = "#e0fbfc";
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(-12, -12);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-12, 12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ---------- EFECTOS: PARTÍCULAS, SONIDO Y TEMBLOR ----------

function crearParticula(x, y, vx, vy, color, vida, tam) {
  particulas.push({ x: x, y: y, vx: vx, vy: vy, color: color, vida: vida, vidaInicial: vida, tam: tam });
}

function explosion(x, y, color, cantidad) {
  for (let i = 0; i < cantidad; i++) {
    const angulo = Math.random() * Math.PI * 2;
    const rapidez = 40 + Math.random() * 200;
    const c = Math.random() < 0.25 ? "white" : color;
    crearParticula(x, y, Math.cos(angulo) * rapidez, Math.sin(angulo) * rapidez, c, 0.4 + Math.random() * 0.5, 2 + Math.random() * 3);
  }
}

function actualizarParticulas(dt) {
  for (const p of particulas) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx -= p.vx * 1.5 * dt;
    p.vy -= p.vy * 1.5 * dt;
    p.vida -= dt;
  }
  particulas = particulas.filter(function (p) { return p.vida > 0; });
}

function dibujarParticulas() {
  for (const p of particulas) {
    ctx.globalAlpha = p.vida / p.vidaInicial;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.tam / 2, p.y - p.tam / 2, p.tam, p.tam);
  }
  ctx.globalAlpha = 1;
}

function sonido(frecuencia, duracion, tipoOnda, volumen, frecuenciaFinal) {
  if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
  if (audio.state === "suspended") audio.resume();
  const oscilador = audio.createOscillator();
  const volumenNodo = audio.createGain();
  oscilador.type = tipoOnda;
  oscilador.frequency.setValueAtTime(frecuencia, audio.currentTime);
  if (frecuenciaFinal) oscilador.frequency.exponentialRampToValueAtTime(frecuenciaFinal, audio.currentTime + duracion);
  volumenNodo.gain.setValueAtTime(volumen, audio.currentTime);
  volumenNodo.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duracion);
  oscilador.connect(volumenNodo);
  volumenNodo.connect(audio.destination);
  oscilador.start();
  oscilador.stop(audio.currentTime + duracion);
}

// ---------- ESTADOS: MENÚ, PARTIDA Y FIN ----------

function empezarPartida() {
  estado = "jugando";
  puntos = 0;
  vidas = 3;
  oleada = 1;
  kilosRecogidos = 0;
  satelitesSalvados = 0;
  satelitesPerdidos = 0;
  chatarras = [];
  disparos = [];
  fragmentos = [];
  satelites = [];
  particulas = [];
  textosFlotantes = [];
  nave.x = ANCHO / 2;
  nave.y = ALTO / 2;
  nave.vx = 0;
  nave.vy = 0;
  nave.angulo = -Math.PI / 2;
  nave.invulnerable = 2;
  tiempoSatelite = 5;
  esperaOleada = 0;
  nuevoRecord = false;
  iniciarOleada();
  mostrarMensaje("Oleada 1", "¡Limpia la órbita y protege los satélites!");
}

function terminarPartida() {
  estado = "fin";
  datoFinal = DATOS_CURIOSOS[Math.floor(Math.random() * DATOS_CURIOSOS.length)];
  if (puntos > record) {
    record = puntos;
    nuevoRecord = true;
    guardarRecord(record);
  }
}

function leerRecord() {
  try {
    return Number(localStorage.getItem("barrendero_record")) || 0;
  } catch (error) {
    return 0;
  }
}

function guardarRecord(valor) {
  try {
    localStorage.setItem("barrendero_record", String(valor));
  } catch (error) {}
}

function dibujarPantallaMenu() {
  ctx.fillStyle = "rgba(5, 6, 20, 0.78)";
  ctx.fillRect(0, 0, ANCHO, ALTO);
  escribir("Barrendero Orbital", ANCHO / 2, 85, 58, "#80ffdb");
  escribir("Limpia la chatarra espacial y protege los satélites", ANCHO / 2, 140, 21, "white");
  dibujarChatarra({ x: 170, y: 245, angulo: tiempoTotal * 0.6, radio: 30, forma: EJEMPLO_CHATARRA, color: "#adb5bd" });
  escribir("Chatarra: ¡dispárale!", 170, 305, 16, "white");
  escribir("Se rompe en trozos más pequeños", 170, 328, 13, "#cfd8dc");
  dibujarFragmento({ x: 400, y: 245, radio: 10 });
  escribir("Fragmento: recógelo", 400, 305, 16, "#57ff9a");
  escribir("Se recicla (+kg). Desaparece en 8 s", 400, 328, 13, "#cfd8dc");
  dibujarSatelite({ x: 630, y: 240, angulo: tiempoTotal, nombre: "Satélite GPS" });
  escribir("Satélite activo: ¡protégelo!", 630, 305, 16, "#a8dadc");
  escribir("No le dispares ni dejes que lo golpeen", 630, 328, 13, "#cfd8dc");
  escribir("← → girar  ·  ↑ propulsar  ·  ESPACIO disparar", ANCHO / 2, 395, 19, "white");
  if (Math.sin(tiempoTotal * 5) > 0) escribir("Pulsa ENTER o ESPACIO para despegar", ANCHO / 2, 455, 26, "#80ffdb");
  if (record > 0) escribir("Récord: " + record, ANCHO / 2, 500, 18, "white");
}

function dibujarPantallaFin() {
  ctx.fillStyle = "rgba(5, 6, 20, 0.82)";
  ctx.fillRect(0, 0, ANCHO, ALTO);
  escribir("Misión terminada", ANCHO / 2, 85, 50, "#80ffdb");
  escribir("Puntos: " + puntos, ANCHO / 2, 150, 40, "white");
  escribir(nuevoRecord ? "¡NUEVO RÉCORD!" : "Récord: " + record, ANCHO / 2, 195, 22, nuevoRecord ? "#ffd166" : "white");
  escribir("Chatarra reciclada: " + kilosRecogidos + " kg", ANCHO / 2, 250, 22, "#57ff9a");
  escribir("Oleada alcanzada: " + oleada, ANCHO / 2, 285, 20, "white");
  escribir("Satélites salvados: " + satelitesSalvados + "   ·   Satélites perdidos: " + satelitesPerdidos, ANCHO / 2, 320, 18, "#a8dadc");
  escribir("¿Sabías que...?", ANCHO / 2, 380, 18, "#ffd166");
  escribir(datoFinal, ANCHO / 2, 408, 15, "#dfe6e9");
  if (Math.sin(tiempoTotal * 5) > 0) escribir("Pulsa ENTER o ESPACIO para otra misión", ANCHO / 2, 480, 24, "#80ffdb");
}

const EJEMPLO_CHATARRA = formaAleatoria(30);

// ---------- CONTROLES ----------

document.addEventListener("keydown", function (evento) {
  teclas[evento.code] = true;
  if ((evento.code === "Enter" || evento.code === "Space") && estado !== "jugando") empezarPartida();
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
  actualizarParticulas(dt);
  temblor = Math.max(0, temblor - 30 * dt);
  actualizarTextos(dt);
  if (mensaje.tiempo > 0) mensaje.tiempo -= dt;
  actualizarChatarras(dt);
  if (estado !== "jugando") return;
  actualizarNave(dt);
  actualizarDisparos(dt);
  actualizarFragmentos(dt);
  actualizarSatelites(dt);
  comprobarDisparos();
  comprobarChoqueNave();
  comprobarOleada(dt);
}

function dibujar() {
  ctx.save();
  if (temblor > 0) ctx.translate((Math.random() - 0.5) * temblor, (Math.random() - 0.5) * temblor);
  dibujarFondo();
  dibujarFragmentos();
  for (const s of satelites) dibujarSatelite(s);
  for (const c of chatarras) dibujarChatarra(c);
  dibujarDisparos();
  if (estado === "jugando") dibujarNave();
  dibujarParticulas();
  dibujarTextos();
  ctx.restore();
  dibujarHUD();
  dibujarMensaje();
  if (estado === "menu") dibujarPantallaMenu();
  if (estado === "fin") dibujarPantallaFin();
}

iniciarOleada();
record = leerRecord();
requestAnimationFrame(bucle);
