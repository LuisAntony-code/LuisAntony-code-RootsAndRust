// ===================================================
//  ¡Compila! - El roguelike de cartas donde tu mano
//  es un programa. HTML5 Canvas + JavaScript puro
// ===================================================

const lienzo = document.getElementById("lienzo");
const ctx = lienzo.getContext("2d");
const ANCHO = lienzo.width;
const ALTO = lienzo.height;

ctx.fillStyle = "#14112b";
ctx.fillRect(0, 0, ANCHO, ALTO);
ctx.fillStyle = "#c77dff";
ctx.font = "bold 40px Arial";
ctx.textAlign = "center";
ctx.fillText("¡Hola, Compila!", ANCHO / 2, ALTO / 2);
