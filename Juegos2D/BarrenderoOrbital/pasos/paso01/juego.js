// ===================================================
//  Barrendero Orbital - Limpia la chatarra espacial
//  Juego 2D de naves y asteroides con HTML5 Canvas
// ===================================================

const lienzo = document.getElementById("lienzo");
const ctx = lienzo.getContext("2d");
const ANCHO = lienzo.width;
const ALTO = lienzo.height;

ctx.fillStyle = "#05060f";
ctx.fillRect(0, 0, ANCHO, ALTO);
ctx.fillStyle = "#80ffdb";
ctx.font = "bold 36px Arial";
ctx.textAlign = "center";
ctx.fillText("¡Hola, Barrendero Orbital!", ANCHO / 2, ALTO / 2);
