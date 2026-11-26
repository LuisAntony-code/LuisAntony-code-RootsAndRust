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
const EDITOR = { x: 246, y: 86, ancho: 542, alto: 294 };
const NOMBRES_EXAMEN = ["Práctica calificada 1", "Práctica calificada 2", "Examen parcial"];
const BASE_OBJETIVO = [100, 160, 260];
const JEFES = [
  { id: "discreta", nombre: "Parcial de Matemática Discreta", regla: "Las cartas x² no hacen nada" },
  { id: "sorpresa", nombre: "Examen sorpresa", regla: "Solo tienes 3 ejecuciones" },
  { id: "estricto", nombre: "Profesor estricto", regla: "Máximo 4 cartas por programa" },
  { id: "sinDescartes", nombre: "Examen sin apuntes", regla: "No puedes descartar" },
];
const LIBRERIAS = [
  { id: "cafe", icono: "☕", nombre: "Café", texto: "+15 al final de cada programa", precio: 4 },
  { id: "pair", icono: "🤝", nombre: "Pair programming", texto: "Las cartas de suma suman el doble", precio: 6 },
  { id: "recursion", icono: "🔁", nombre: "Recursión", texto: "La última carta se ejecuta otra vez", precio: 6 },
  { id: "git", icono: "🌿", nombre: "Git", texto: "+1 ejecución en cada examen", precio: 5 },
  { id: "gc", icono: "🗑️", nombre: "Garbage collector", texto: "+2 descartes en cada examen", precio: 3 },
  { id: "ia", icono: "🤖", nombre: "Copiloto IA", texto: "Multiplica el resultado final ×1.5", precio: 8 },
  { id: "apuntes", icono: "📚", nombre: "Apuntes", texto: "+1 carta en la mano", precio: 5 },
  { id: "optimizador", icono: "⚡", nombre: "Optimizador", texto: "Las cartas ×n multiplican por n+1", precio: 7 },
];

// ---------- ESTADO DEL JUEGO (variables que cambian) ----------

let tiempoAnterior = 0;
let tiempoTotal = 0;
let mazo = [];
let mano = [];
let seleccion = [];
let cartaBajoRaton = -1;
let fase = "seleccion";
let ejecucion = null;
let puntaje = 0;
let objetivo = 300;
let ejecuciones = 4;
let descartes = 3;
let ciclo = 1;
let examen = 0;
let mensaje = { titulo: "", texto: "", color: "white", tiempo: 0 };
let jefe = null;
let librerias = [];
let creditos = 0;
let ofertas = [];
let puntajeMostrado = 0;
let particulas = [];
let textosFlotantes = [];
let temblor = 0;
let audio = null;

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

function formatear(n) {
  return Math.round(n).toLocaleString("es-PE");
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
  if (tieneLibreria("apuntes")) return 8;
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
  if (jefeActivo("estricto")) return 4;
  return 5;
}

function alternarCarta(i) {
  if (fase !== "seleccion" || i >= mano.length) return;
  const posicion = seleccion.indexOf(i);
  if (posicion !== -1) seleccion.splice(posicion, 1);
  else if (seleccion.length < limiteCartas()) seleccion.push(i);
  sonido(520 + seleccion.length * 60, 0.06, "triangle", 0.12);
}

function cartaEnPunto(p) {
  for (let i = mano.length - 1; i >= 0; i--) {
    if (dentro(p, posicionCarta(i))) return i;
  }
  return -1;
}

// ---------- EL EDITOR DE CÓDIGO ----------

function lineasPrograma() {
  const lineas = ["let x = 0;"];
  for (let k = 0; k < seleccion.length; k++) {
    const c = mano[seleccion[k]];
    const tras = k > 0 && mano[seleccion[k - 1]].tipo === "repetir";
    lineas.push((tras ? "    " : "") + codigoCarta(c));
  }
  return lineas;
}

function dibujarEditor() {
  ctx.fillStyle = "#0d1117";
  ctx.beginPath();
  ctx.roundRect(EDITOR.x, EDITOR.y, EDITOR.ancho, EDITOR.alto, 12);
  ctx.fill();
  ctx.strokeStyle = "#3c2f6b";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#161b22";
  ctx.beginPath();
  ctx.roundRect(EDITOR.x, EDITOR.y, EDITOR.ancho, 30, [12, 12, 0, 0]);
  ctx.fill();
  const colores = ["#ff5f57", "#febc2e", "#28c840"];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = colores[i];
    ctx.beginPath();
    ctx.arc(EDITOR.x + 18 + i * 18, EDITOR.y + 15, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#8b949e";
  ctx.font = "13px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("programa.js", EDITOR.x + 80, EDITOR.y + 15);
  const lineas = fase === "ejecutando" ? ejecucion.lineas : lineasPrograma();
  ctx.font = "bold 17px monospace";
  for (let i = 0; i < lineas.length; i++) {
    const y = EDITOR.y + 52 + i * 28;
    if (fase === "ejecutando" && i === ejecucion.lineaActual) {
      ctx.fillStyle = "rgba(157, 78, 221, 0.35)";
      ctx.fillRect(EDITOR.x + 2, y - 13, EDITOR.ancho - 4, 26);
    }
    ctx.fillStyle = "#6e7681";
    ctx.fillText(String(i + 1), EDITOR.x + 14, y);
    ctx.fillStyle = i === 0 ? "#79c0ff" : "#e6edf3";
    ctx.fillText(lineas[i], EDITOR.x + 46, y);
    if (fase === "ejecutando" && ejecucion.comentarios[i]) {
      const anchoCodigo = ctx.measureText(lineas[i]).width;
      ctx.fillStyle = "#7ee787";
      ctx.font = "bold 14px monospace";
      ctx.fillText("// " + ejecucion.comentarios[i], EDITOR.x + Math.max(250, 66 + anchoCodigo), y);
      ctx.font = "bold 17px monospace";
    }
  }
  if (lineas.length === 1) {
    escribir("Elige cartas de tu mano para escribir tu programa", EDITOR.x + EDITOR.ancho / 2, EDITOR.y + 160, 16, "#8b949e");
    escribir("El ORDEN en que las elijas es el orden en que se ejecutan", EDITOR.x + EDITOR.ancho / 2, EDITOR.y + 186, 14, "#8b949e");
  }
  if (fase === "ejecutando") {
    const tam = 34 * (1 + ejecucion.pop * 0.5);
    escribir("x = " + formatear(ejecucion.x), EDITOR.x + EDITOR.ancho - 20, EDITOR.y + EDITOR.alto - 32, tam, "#ffd166", "right");
  }
}

// ---------- EL INTÉRPRETE: EJECUTAR EL PROGRAMA ----------

function aplicarCarta(c, x) {
  const extraSuma = tieneLibreria("pair") ? 2 : 1;
  const extraMult = tieneLibreria("optimizador") ? 1 : 0;
  if (c.tipo === "suma") return x + c.n * extraSuma;
  if (c.tipo === "mult") return x * (c.n + extraMult);
  if (c.tipo === "cuadrado") return jefeActivo("discreta") ? x : x * x;
  if (c.tipo === "siPar") return x % 2 === 0 ? x * 3 : x;
  return x;
}

function limitar(x) {
  return Math.min(x, Number.MAX_SAFE_INTEGER);
}

function interpretar(cartas) {
  const lineas = ["let x = 0;"];
  const pasos = [{ linea: 0, comentario: "x = 0", x: 0 }];
  let x = 0;
  let veces = 1;
  for (const c of cartas) {
    lineas.push((veces > 1 ? "    " : "") + codigoCarta(c));
    const linea = lineas.length - 1;
    if (c.tipo === "repetir") {
      veces *= 2;
      pasos.push({ linea: linea, comentario: "la siguiente: " + veces + " veces", x: x });
      continue;
    }
    for (let k = 0; k < veces; k++) {
      x = limitar(aplicarCarta(c, x));
      const tope = x === Number.MAX_SAFE_INTEGER ? "  ¡overflow!" : "";
      pasos.push({ linea: linea, comentario: "x = " + x + (veces > 1 ? "  (vuelta " + (k + 1) + ")" : "") + tope, x: x });
    }
    veces = 1;
  }
  const ultima = cartas.filter(function (c) { return c.tipo !== "repetir"; }).pop();
  if (tieneLibreria("recursion") && ultima) {
    lineas.push(codigoCarta(ultima) + "  // 🔁");
    x = limitar(aplicarCarta(ultima, x));
    pasos.push({ linea: lineas.length - 1, comentario: "x = " + x, x: x });
  }
  if (tieneLibreria("cafe")) {
    lineas.push("x += 15;  // ☕");
    x = limitar(x + 15);
    pasos.push({ linea: lineas.length - 1, comentario: "x = " + x, x: x });
  }
  if (tieneLibreria("ia")) {
    lineas.push("x = x * 1.5;  // 🤖");
    x = limitar(Math.round(x * 1.5));
    pasos.push({ linea: lineas.length - 1, comentario: "x = " + x, x: x });
  }
  return { lineas: lineas, pasos: pasos, resultado: x };
}

function ejecutar() {
  if (fase !== "seleccion" || seleccion.length === 0) return;
  if (ejecuciones <= 0) return;
  ejecuciones -= 1;
  const cartas = seleccion.map(function (i) { return mano[i]; });
  ejecucion = interpretar(cartas);
  ejecucion.indice = 0;
  ejecucion.tiempo = 0;
  ejecucion.comentarios = [];
  ejecucion.lineaActual = -1;
  ejecucion.x = 0;
  ejecucion.terminada = false;
  ejecucion.pop = 0;
  fase = "ejecutando";
}

function actualizarEjecucion(dt) {
  if (fase !== "ejecutando") return;
  ejecucion.tiempo -= dt;
  if (ejecucion.tiempo > 0) return;
  if (ejecucion.indice < ejecucion.pasos.length) {
    const p = ejecucion.pasos[ejecucion.indice];
    ejecucion.comentarios[p.linea] = p.comentario;
    ejecucion.lineaActual = p.linea;
    ejecucion.x = p.x;
    ejecucion.indice += 1;
    ejecucion.tiempo = Math.max(0.18, 0.5 - ejecucion.indice * 0.04);
    ejecucion.pop = 1;
    sonido(260 * Math.pow(1.12, ejecucion.indice), 0.12, "square", 0.07);
  } else if (!ejecucion.terminada) {
    ejecucion.terminada = true;
    ejecucion.tiempo = 1;
    celebrarResultado(ejecucion.resultado);
  } else {
    terminarEjecucion();
  }
}

function terminarEjecucion() {
  puntaje += ejecucion.resultado;
  quitarSeleccionadas();
  robarCartas();
  fase = "seleccion";
  comprobarExamen();
}

function quitarSeleccionadas() {
  const ordenadas = seleccion.slice().sort(function (a, b) { return b - a; });
  for (const i of ordenadas) mano.splice(i, 1);
  seleccion = [];
}

// ---------- PANEL, BOTONES Y DESCARTES ----------

function descartar() {
  if (fase !== "seleccion" || seleccion.length === 0 || descartes <= 0) return;
  descartes -= 1;
  quitarSeleccionadas();
  robarCartas();
  sonido(200, 0.15, "triangle", 0.12, 120);
}

const botones = [
  { x: 220, y: 534, ancho: 170, alto: 48, texto: "▶ Ejecutar (Enter)", color: "#2a9d8f", accion: ejecutar, activo: function () { return fase === "seleccion" && seleccion.length > 0 && ejecuciones > 0; } },
  { x: 410, y: 534, ancho: 170, alto: 48, texto: "Descartar (D)", color: "#e76f51", accion: descartar, activo: function () { return fase === "seleccion" && seleccion.length > 0 && descartes > 0; } },
];

function dibujarBotones() {
  for (const b of botones) {
    ctx.globalAlpha = b.activo() ? 1 : 0.35;
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.ancho, b.alto, 12);
    ctx.fill();
    escribir(b.texto, b.x + b.ancho / 2, b.y + b.alto / 2, 17, "white");
  }
  ctx.globalAlpha = 1;
}

function dibujarPanel() {
  ctx.fillStyle = "rgba(20, 16, 48, 0.9)";
  ctx.beginPath();
  ctx.roundRect(12, 12, 220, 368, 14);
  ctx.fill();
  ctx.strokeStyle = "#3c2f6b";
  ctx.lineWidth = 2;
  ctx.stroke();
  escribir("Ciclo " + ciclo + " de 10", 122, 34, 15, "#c77dff");
  escribir(nombreExamen(), 122, 58, 15, "white");
  if (jefe) escribir(jefe.regla, 122, 80, 12, "#ff8fab");
  escribir("Objetivo", 122, 110, 14, "#8b949e");
  escribir(formatear(objetivo), 122, 138, 30, "#ffd166");
  escribir("Puntaje", 122, 176, 14, "#8b949e");
  escribir(formatear(puntajeMostrado), 122, 204, 30, "white");
  const progreso = Math.min(1, puntajeMostrado / objetivo);
  ctx.fillStyle = "#2b2550";
  ctx.fillRect(32, 228, 180, 12);
  ctx.fillStyle = progreso >= 1 ? "#52b788" : "#9d4edd";
  ctx.fillRect(32, 228, 180 * progreso, 12);
  escribir("Ejecuciones", 72, 270, 13, "#8b949e");
  escribir(String(ejecuciones), 72, 298, 30, "#4cc9f0");
  escribir("Descartes", 172, 270, 13, "#8b949e");
  escribir(String(descartes), 172, 298, 30, "#ff6b6b");
  escribir("Créditos: $" + creditos, 122, 335, 16, "#ffd166");
  escribir("Mazo: " + mazo.length + " cartas", 122, 362, 13, "#8b949e");
}

// ---------- EXÁMENES Y CICLOS ----------

function nombreExamen() {
  if (jefe) return jefe.nombre;
  return NOMBRES_EXAMEN[examen];
}

function iniciarExamen() {
  jefe = examen === 2 ? JEFES[Math.floor(Math.random() * JEFES.length)] : null;
  objetivo = Math.round(BASE_OBJETIVO[examen] * Math.pow(1.7, ciclo - 1));
  puntaje = 0;
  puntajeMostrado = 0;
  ejecuciones = 4;
  descartes = 3;
  if (jefeActivo("sorpresa")) ejecuciones = 3;
  if (jefeActivo("sinDescartes")) descartes = 0;
  if (tieneLibreria("git")) ejecuciones += 1;
  if (tieneLibreria("gc") && !jefeActivo("sinDescartes")) descartes += 2;
  mano = [];
  seleccion = [];
  crearMazo();
  robarCartas();
  mostrarMensaje(nombreExamen(), "Consigue " + objetivo + " puntos", "#c77dff");
}

function comprobarExamen() {
  if (puntaje >= objetivo) aprobarExamen();
  else if (ejecuciones <= 0 || mano.length === 0) desaprobar();
}

function aprobarExamen() {
  const ganados = 3 + ejecuciones + (jefe ? 3 : 0);
  creditos += ganados;
  sonido(523, 0.15, "square", 0.1);
  setTimeout(function () { sonido(659, 0.15, "square", 0.1); }, 120);
  setTimeout(function () { sonido(784, 0.3, "square", 0.1); }, 240);
  examen += 1;
  if (examen > 2) {
    examen = 0;
    ciclo += 1;
  }
  abrirTienda();
  mostrarMensaje("¡Aprobado!", "+$" + ganados + " créditos", "#52b788");
}

function desaprobar() {
  mostrarMensaje("Desaprobado", "Vuelves a empezar la carrera", "#ff6b6b");
  ciclo = 1;
  examen = 0;
  iniciarExamen();
}

function mostrarMensaje(titulo, texto, color) {
  mensaje.titulo = titulo;
  mensaje.texto = texto;
  mensaje.color = color;
  mensaje.tiempo = 2;
}

function dibujarMensaje() {
  if (mensaje.tiempo <= 0) return;
  ctx.globalAlpha = Math.min(1, mensaje.tiempo * 2);
  ctx.fillStyle = "rgba(10, 8, 30, 0.92)";
  ctx.beginPath();
  ctx.roundRect(ANCHO / 2 - 250, 190, 500, 110, 16);
  ctx.fill();
  ctx.strokeStyle = mensaje.color;
  ctx.lineWidth = 3;
  ctx.stroke();
  escribir(mensaje.titulo, ANCHO / 2, 228, 34, mensaje.color);
  escribir(mensaje.texto, ANCHO / 2, 268, 18, "white");
  ctx.globalAlpha = 1;
}

function jefeActivo(id) {
  return jefe !== null && jefe.id === id;
}

// ---------- TIENDA Y LIBRERÍAS ----------

function tieneLibreria(id) {
  return librerias.some(function (l) { return l.id === id; });
}

function abrirTienda() {
  const disponibles = LIBRERIAS.filter(function (l) { return !tieneLibreria(l.id); });
  barajar(disponibles);
  ofertas = disponibles.slice(0, 3);
  fase = "tienda";
}

function rectanguloOferta(i) {
  return { x: 130 + i * 190, y: 150, ancho: 160, alto: 250 };
}

const BOTON_CONTINUAR = { x: 270, y: 440, ancho: 260, alto: 52 };

function clicTienda(p) {
  for (let i = 0; i < ofertas.length; i++) {
    if (dentro(p, rectanguloOferta(i))) comprar(ofertas[i]);
  }
  if (dentro(p, BOTON_CONTINUAR)) salirTienda();
}

function comprar(oferta) {
  if (creditos < oferta.precio || librerias.length >= 4) {
    sonido(150, 0.2, "sawtooth", 0.1);
    return;
  }
  creditos -= oferta.precio;
  librerias.push(oferta);
  ofertas = ofertas.filter(function (o) { return o !== oferta; });
  sonido(600, 0.2, "triangle", 0.15, 1200);
}

function salirTienda() {
  fase = "seleccion";
  iniciarExamen();
}

function escribirParrafo(texto, x, y, anchoMax, tamano, color) {
  ctx.font = "bold " + tamano + "px Arial";
  const palabras = texto.split(" ");
  let linea = "";
  for (const palabra of palabras) {
    const prueba = linea ? linea + " " + palabra : palabra;
    if (ctx.measureText(prueba).width > anchoMax && linea) {
      escribir(linea, x, y, tamano, color);
      y += tamano + 4;
      linea = palabra;
    } else {
      linea = prueba;
    }
  }
  escribir(linea, x, y, tamano, color);
}

function dibujarTienda() {
  ctx.fillStyle = "rgba(8, 6, 24, 0.9)";
  ctx.fillRect(0, 0, ANCHO, ALTO);
  escribir("Tienda de librerías", ANCHO / 2, 60, 38, "#c77dff");
  escribir("Créditos: $" + creditos + "   ·   Librerías: " + librerias.length + " / 4", ANCHO / 2, 105, 18, "#ffd166");
  for (let i = 0; i < ofertas.length; i++) {
    const r = rectanguloOferta(i);
    const o = ofertas[i];
    const puede = creditos >= o.precio && librerias.length < 4;
    ctx.fillStyle = "#1b1f3b";
    ctx.beginPath();
    ctx.roundRect(r.x, r.y, r.ancho, r.alto, 14);
    ctx.fill();
    ctx.strokeStyle = puede ? "#ffd166" : "#555";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText(o.icono, r.x + r.ancho / 2, r.y + 50);
    escribir(o.nombre, r.x + r.ancho / 2, r.y + 100, 16, "white");
    escribirParrafo(o.texto, r.x + r.ancho / 2, r.y + 135, r.ancho - 20, 13, "#c9c9e0");
    escribir("Comprar $" + o.precio, r.x + r.ancho / 2, r.y + r.alto - 28, 18, puede ? "#ffd166" : "#777");
  }
  ctx.fillStyle = "#2a9d8f";
  ctx.beginPath();
  ctx.roundRect(BOTON_CONTINUAR.x, BOTON_CONTINUAR.y, BOTON_CONTINUAR.ancho, BOTON_CONTINUAR.alto, 12);
  ctx.fill();
  escribir("Siguiente examen ▶", ANCHO / 2, BOTON_CONTINUAR.y + 26, 20, "white");
  escribir("Haz clic en una librería para comprarla (máximo 4)", ANCHO / 2, 525, 14, "#8b949e");
}

function dibujarLibrerias() {
  for (let i = 0; i < 4; i++) {
    const x = 246 + i * 137;
    const l = librerias[i];
    ctx.fillStyle = l ? "#241d4f" : "rgba(36, 29, 79, 0.4)";
    ctx.beginPath();
    ctx.roundRect(x, 12, 129, 62, 10);
    ctx.fill();
    if (!l) {
      escribir("librería vacía", x + 64, 43, 12, "#5c5488");
      continue;
    }
    ctx.font = "26px Arial";
    ctx.textAlign = "center";
    ctx.fillText(l.icono, x + 24, 44);
    escribir(l.nombre, x + 44, 43, 12, "white", "left");
  }
}

// ---------- EFECTOS: PARTÍCULAS, TEXTOS, SONIDO Y TEMBLOR ----------

function celebrarResultado(valor) {
  const cifras = Math.max(1, Math.log10(valor + 1));
  explosion(EDITOR.x + EDITOR.ancho - 90, EDITOR.y + EDITOR.alto - 32, Math.min(80, Math.round(cifras * 14)));
  temblor = Math.min(14, cifras * 3);
  crearTextoFlotante("+" + formatear(valor), 122, 190, "#ffd166");
  sonido(110, 0.2 + cifras * 0.1, "sawtooth", 0.12, 55);
}

function explosion(x, y, cantidad) {
  const colores = ["#4cc9f0", "#f8961e", "#c77dff", "#52b788", "#f72585", "#ffd166"];
  for (let i = 0; i < cantidad; i++) {
    const angulo = Math.random() * Math.PI * 2;
    const rapidez = 80 + Math.random() * 260;
    particulas.push({
      x: x,
      y: y,
      vx: Math.cos(angulo) * rapidez,
      vy: Math.sin(angulo) * rapidez - 120,
      vida: 0.6 + Math.random() * 0.6,
      color: colores[Math.floor(Math.random() * colores.length)],
      tam: 3 + Math.random() * 5,
    });
  }
}

function actualizarParticulas(dt) {
  for (const p of particulas) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 500 * dt;
    p.vida -= dt;
  }
  particulas = particulas.filter(function (p) { return p.vida > 0; });
}

function dibujarParticulas() {
  for (const p of particulas) {
    ctx.globalAlpha = Math.min(1, p.vida * 2);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.tam / 2, p.y - p.tam / 2, p.tam, p.tam);
  }
  ctx.globalAlpha = 1;
}

function crearTextoFlotante(texto, x, y, color) {
  textosFlotantes.push({ texto: texto, x: x, y: y, color: color, vida: 1.4 });
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
    escribir(t.texto, t.x, t.y, 26, t.color);
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

// ---------- CONTROLES: RATÓN, DEDO Y TECLADO ----------

function posicionEnLienzo(evento) {
  const rect = lienzo.getBoundingClientRect();
  return {
    x: (evento.clientX - rect.left) * (ANCHO / rect.width),
    y: (evento.clientY - rect.top) * (ALTO / rect.height),
  };
}

function manejarClic(p) {
  if (fase === "tienda") {
    clicTienda(p);
    return;
  }
  for (const b of botones) {
    if (dentro(p, b) && b.activo()) {
      b.accion();
      return;
    }
  }
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
  if (evento.code === "Enter" || evento.code === "NumpadEnter") ejecutar();
  if (evento.code === "KeyD") descartar();
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
  actualizarEjecucion(dt);
  if (mensaje.tiempo > 0) mensaje.tiempo -= dt;
  actualizarParticulas(dt);
  actualizarTextos(dt);
  temblor = Math.max(0, temblor - 30 * dt);
  if (ejecucion) ejecucion.pop = Math.max(0, ejecucion.pop - dt * 5);
  puntajeMostrado += (puntaje - puntajeMostrado) * Math.min(1, dt * 6);
  if (Math.abs(puntaje - puntajeMostrado) < 1) puntajeMostrado = puntaje;
}

function dibujar() {
  ctx.save();
  if (temblor > 0) ctx.translate((Math.random() - 0.5) * temblor, (Math.random() - 0.5) * temblor);
  dibujarFondo();
  dibujarLibrerias();
  dibujarPanel();
  dibujarEditor();
  dibujarMano();
  dibujarBotones();
  dibujarParticulas();
  dibujarTextos();
  ctx.restore();
  dibujarMensaje();
  if (fase === "tienda") dibujarTienda();
}

crearMazo();
robarCartas();
iniciarExamen();
requestAnimationFrame(bucle);
