// Ejecuta una lista de trabajos de captura con Playwright (Chromium).
// Uso: node render.js trabajos.json
//  - tipo "juego": abre un index.html, ejecuta acciones (teclas, ratón, código) y captura el lienzo.
//  - tipo "html":  abre una página y captura el elemento #captura.
//  - tipo "pdf":   convierte una página HTML en PDF.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Generador de números aleatorios con semilla: así las capturas salen siempre iguales.
const SEMILLA = `
(() => {
  let s = __SEMILLA__ >>> 0;
  Math.random = function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
})();`;

async function trabajoJuego(navegador, t) {
  const contexto = await navegador.newContext({ viewport: { width: 860, height: 720 }, deviceScaleFactor: 1 });
  await contexto.addInitScript(SEMILLA.replace('__SEMILLA__', String(t.semilla || 7)));
  const pagina = await contexto.newPage();
  const errores = [];
  pagina.on('pageerror', (e) => errores.push((e.name ? e.name + ': ' : '') + String(e.message || e)));
  pagina.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  await pagina.goto('file://' + path.resolve(t.pagina));
  await pagina.waitForTimeout(t.esperaInicial ?? 400);
  const lienzo = pagina.locator('canvas');
  const caja = await lienzo.boundingBox();
  const aPantalla = (x, y) => [caja.x + x * caja.width / 800, caja.y + y * caja.height / 600];
  for (const a of t.acciones || []) {
    if (a.esperar) await pagina.waitForTimeout(a.esperar);
    if (a.pulsar) await pagina.keyboard.press(a.pulsar);
    if (a.bajar) await pagina.keyboard.down(a.bajar);
    if (a.subir) await pagina.keyboard.up(a.subir);
    if (a.mantener) { await pagina.keyboard.down(a.mantener[0]); await pagina.waitForTimeout(a.mantener[1]); await pagina.keyboard.up(a.mantener[0]); }
    if (a.codigo) await pagina.evaluate(a.codigo);
    if (a.raton) { const [x, y] = aPantalla(a.raton[0], a.raton[1]); await pagina.mouse.move(x, y, { steps: 5 }); }
    if (a.clic) { const [x, y] = aPantalla(a.clic[0], a.clic[1]); await pagina.mouse.click(x, y); }
    if (a.captura) {
      await lienzo.screenshot({ path: a.captura });
    }
  }
  if (t.salida) {
    if (t.paginaCompleta) await pagina.screenshot({ path: t.salida });
    else await lienzo.screenshot({ path: t.salida });
  }
  await contexto.close();
  return errores;
}

async function trabajoHtml(navegador, t) {
  const contexto = await navegador.newContext({ viewport: { width: t.ancho || 1200, height: t.alto || 800 }, deviceScaleFactor: t.escala || 1.5 });
  const pagina = await contexto.newPage();
  await pagina.goto('file://' + path.resolve(t.pagina));
  await pagina.waitForTimeout(t.espera ?? 50);
  await pagina.locator(t.selector || '#captura').screenshot({ path: t.salida });
  await contexto.close();
  return [];
}

async function trabajoPdf(navegador, t) {
  const contexto = await navegador.newContext();
  const pagina = await contexto.newPage();
  await pagina.goto('file://' + path.resolve(t.pagina), { waitUntil: 'load' });
  await pagina.waitForTimeout(300);
  await pagina.pdf({
    path: t.salida, format: 'A4', printBackground: true,
    margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `<div style="font-size:8px;width:100%;text-align:center;color:#777;font-family:Arial">${t.pie || ''} · Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>`,
  });
  await contexto.close();
  return [];
}

(async () => {
  const trabajos = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const navegador = await chromium.launch();
  const informe = {};
  const tipos = { juego: trabajoJuego, html: trabajoHtml, pdf: trabajoPdf };
  // Varios trabajos a la vez para ir más rápido
  const cola = [...trabajos];
  async function obrero() {
    while (cola.length) {
      const t = cola.shift();
      try {
        const errores = await tipos[t.tipo](navegador, t);
        if (errores.length) informe[t.id || t.salida] = errores;
      } catch (e) {
        informe[t.id || t.salida] = ['FALLO DEL CAPTURADOR: ' + e.message];
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, obrero));
  await navegador.close();
  fs.writeFileSync(process.argv[2].replace(/\.json$/, '.resultado.json'), JSON.stringify(informe, null, 2));
  const n = Object.keys(informe).length;
  console.log(`Trabajos: ${trabajos.length}. Con errores: ${n}`);
  if (n) console.log(JSON.stringify(informe, null, 2));
})();
