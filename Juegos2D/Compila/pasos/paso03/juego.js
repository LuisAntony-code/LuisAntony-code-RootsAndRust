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

// ---------- ESTADO DEL JUEGO (variables que cambian) ----------

let tiempoAnterior = 0;
let tiempoTotal = 0;

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
  dibujarCarta({ tipo: "suma", n: 7 }, 130, 240, false, 0);
  dibujarCarta({ tipo: "mult", n: 3 }, 240, 240, false, 0);
  dibujarCarta({ tipo: "cuadrado", n: 0 }, 350, 240, true, 1);
  dibujarCarta({ tipo: "repetir", n: 0 }, 460, 240, false, 0);
  dibujarCarta({ tipo: "siPar", n: 0 }, 570, 240, false, 0);
}

requestAnimationFrame(bucle);
