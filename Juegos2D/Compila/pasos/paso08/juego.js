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
  return 5;
}

function alternarCarta(i) {
  if (fase !== "seleccion" || i >= mano.length) return;
  const posicion = seleccion.indexOf(i);
  if (posicion !== -1) seleccion.splice(posicion, 1);
  else if (seleccion.length < limiteCartas()) seleccion.push(i);
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
    escribir("x = " + ejecucion.x, EDITOR.x + EDITOR.ancho - 20, EDITOR.y + EDITOR.alto - 32, 34, "#ffd166", "right");
  }
}

// ---------- EL INTÉRPRETE: EJECUTAR EL PROGRAMA ----------

function aplicarCarta(c, x) {
  if (c.tipo === "suma") return x + c.n;
  if (c.tipo === "mult") return x * c.n;
  if (c.tipo === "cuadrado") return x * x;
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
  } else if (!ejecucion.terminada) {
    ejecucion.terminada = true;
    ejecucion.tiempo = 1;
  } else {
    terminarEjecucion();
  }
}

function terminarEjecucion() {
  puntaje += ejecucion.resultado;
  quitarSeleccionadas();
  robarCartas();
  fase = "seleccion";
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
  escribir("Objetivo", 122, 110, 14, "#8b949e");
  escribir(String(objetivo), 122, 138, 30, "#ffd166");
  escribir("Puntaje", 122, 176, 14, "#8b949e");
  escribir(String(puntaje), 122, 204, 30, "white");
  const progreso = Math.min(1, puntaje / objetivo);
  ctx.fillStyle = "#2b2550";
  ctx.fillRect(32, 228, 180, 12);
  ctx.fillStyle = progreso >= 1 ? "#52b788" : "#9d4edd";
  ctx.fillRect(32, 228, 180 * progreso, 12);
  escribir("Ejecuciones", 72, 270, 13, "#8b949e");
  escribir(String(ejecuciones), 72, 298, 30, "#4cc9f0");
  escribir("Descartes", 172, 270, 13, "#8b949e");
  escribir(String(descartes), 172, 298, 30, "#ff6b6b");
  escribir("Mazo: " + mazo.length + " cartas", 122, 362, 13, "#8b949e");
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
}

function dibujar() {
  dibujarFondo();
  dibujarPanel();
  dibujarEditor();
  dibujarMano();
  dibujarBotones();
}

crearMazo();
robarCartas();
requestAnimationFrame(bucle);
