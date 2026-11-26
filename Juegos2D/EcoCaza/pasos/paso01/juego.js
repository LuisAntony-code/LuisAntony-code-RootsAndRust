// ===================================================
//  EcoCaza - Separa la basura, salva el planeta
//  Juego 2D hecho con HTML5 Canvas y JavaScript puro
// ===================================================

const lienzo = document.getElementById("lienzo");
const ctx = lienzo.getContext("2d");
const ANCHO = lienzo.width;
const ALTO = lienzo.height;

ctx.fillStyle = "#8fd3ff";
ctx.fillRect(0, 0, ANCHO, ALTO);
ctx.fillStyle = "#1b4332";
ctx.font = "bold 40px Arial";
ctx.textAlign = "center";
ctx.fillText("¡Hola, EcoCaza!", ANCHO / 2, ALTO / 2);
