"""Genera todo el material de un juego: archivos por paso, capturas, imágenes de código e informe.

Uso:  python3 generar.py ecocaza        (o barrendero)
      python3 generar.py ecocaza --sin-capturas   (reutiliza las capturas ya hechas)
"""
import html
import importlib
import json
import os
import re
import shutil
import subprocess
import sys

from pygments import highlight
from pygments.formatters import HtmlFormatter
from pygments.lexers import HtmlLexer, JavascriptLexer

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
from pasos import cambios, leer_fuente, texto_de, version  # noqa: E402

ESTILO = 'one-dark'
MAX_LINEAS_IMAGEN = 42

# ---------------------------------------------------------------------------
# Explicaciones automáticas para líneas muy repetidas
# ---------------------------------------------------------------------------
EXACTAS = {
    '}': 'Cierra la llave `{` que se abrió más arriba: aquí termina ese bloque.',
    '},': 'Cierra este apartado del objeto. La coma indica que detrás viene otro apartado.',
    '});': 'Cierra la llave de la función, el paréntesis de la llamada y termina la instrucción con `;`.',
    '];': 'Cierra el corchete de la lista (array) y termina la instrucción.',
    '};': 'Cierra la llave del objeto y termina la instrucción.',
    '} else {': 'Cierra el bloque anterior y abre el bloque «si no» (`else`): se ejecuta cuando la condición NO se cumple.',
    'ctx.beginPath();': 'Empieza un trazo nuevo, para que esta figura no se mezcle con la anterior.',
    'ctx.closePath();': 'Cierra la figura: une el último punto con el primero.',
    'ctx.fill();': 'Rellena la figura que acabamos de trazar con el color de `fillStyle`.',
    'ctx.stroke();': 'Dibuja el contorno (la línea) de la figura con el color de `strokeStyle`.',
    'ctx.save();': 'Guarda el estado del pincel (posición, giro, colores) para recuperarlo después.',
    'ctx.restore();': 'Recupera el estado del pincel guardado con `save()`.',
    'return;': 'Sale de la función sin hacer nada más.',
    'continue;': 'Salta directamente a la siguiente vuelta del bucle.',
    'try {': 'Abre un bloque `try` («intenta»): si algo de dentro falla, el programa no se detiene.',
}
PATRONES = [
    (r'^//\s*-+\s*(.*?)\s*-+$', 'Comentario que sirve de título de sección: «{0}». El navegador lo ignora; nos ayuda a ordenar el código.'),
    (r'^//\s*=+$', 'Comentario decorativo (una línea de signos =). El navegador lo ignora.'),
    (r'^//\s*(.+)$', 'Comentario: el navegador lo ignora. Sirve para que las personas entendamos el código («{0}»).'),
    (r'^ctx\.fillStyle = (.+);$', 'Elige el color de relleno: `{0}`.'),
    (r'^ctx\.strokeStyle = (.+);$', 'Elige el color de las líneas: `{0}`.'),
    (r'^ctx\.lineWidth = (.+);$', 'Grosor de las líneas: `{0}` píxeles.'),
    (r'^ctx\.fillRect\((.+)\);$', 'Pinta un rectángulo relleno. Los números son x, y (esquina superior izquierda), ancho y alto: `{0}`.'),
    (r'^ctx\.strokeRect\((.+)\);$', 'Dibuja solo el borde de un rectángulo: x, y, ancho y alto → `{0}`.'),
    (r'^ctx\.arc\((.+)\);$', 'Traza un círculo o arco: centro x, centro y, radio, ángulo inicial y ángulo final → `{0}`.'),
    (r'^ctx\.moveTo\((.+)\);$', 'Coloca el lápiz, sin pintar, en el punto `({0})`.'),
    (r'^ctx\.lineTo\((.+)\);$', 'Traza una línea recta hasta el punto `({0})`.'),
    (r'^ctx\.roundRect\((.+)\);$', 'Traza un rectángulo con esquinas redondeadas: x, y, ancho, alto y radio de las esquinas → `{0}`.'),
]
CIERRES = re.compile(r'^[\]\)\}]+[;,]?$')


def explicar(texto):
    t = texto.strip()
    if t in EXACTAS:
        return EXACTAS[t]
    for patron, plantilla in PATRONES:
        m = re.match(patron, t)
        if m:
            return plantilla.format(*m.groups())
    if CIERRES.match(t):
        return 'Cierra lo que se abrió antes: `}` cierra llaves, `)` paréntesis y `]` corchetes.'
    return None


# ---------------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------------
def esc(s):
    return html.escape(s, quote=False)


def resaltar(lineas, lenguaje):
    lexer = JavascriptLexer() if lenguaje == 'js' else HtmlLexer()
    codigo = '\n'.join(l['texto'] for l in lineas) + '\n'
    salida = highlight(codigo, lexer, HtmlFormatter(nowrap=True, style=ESTILO))
    partes = salida.split('\n')
    return partes[:len(lineas)]


CSS_CODIGO = HtmlFormatter(style=ESTILO).get_style_defs('.cod')

PLANTILLA_VENTANA = """<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{margin:0;padding:24px;background:#ffffff;font-family:'DejaVu Sans',Arial,sans-serif}
#captura{width:1000px;border-radius:10px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,.35);background:#282c34}
.barra{background:#21252b;height:36px;display:flex;align-items:center;padding:0 14px;gap:8px;border-bottom:1px solid #181a1f}
.pto{width:12px;height:12px;border-radius:50%;display:inline-block}
.pr{background:#ff5f57}.pa{background:#febc2e}.pv{background:#28c840}
.titulo{color:#abb2bf;font-size:14px;margin-left:12px}
.titulo b{color:#e5c07b;font-weight:normal}
.leyenda{margin-left:auto;font-size:12px;color:#7f848e}
.leyenda i{font-style:normal;padding:1px 7px;border-radius:4px;margin-left:6px}
.ln{background:rgba(80,200,120,.28);color:#c8f7d4}.lb{background:rgba(255,90,90,.28);color:#ffd0d0}
table{border-collapse:collapse;width:100%;font-family:'DejaVu Sans Mono',monospace;font-size:14.5px;line-height:21px}
td{padding:0;vertical-align:top}
td.num{width:46px;text-align:right;padding-right:10px;color:#636d83;user-select:none}
td.mar{width:18px;text-align:center;color:#636d83}
td.lin{white-space:pre-wrap;color:#abb2bf;padding-right:14px;word-break:break-all;padding-left:4px}
tr.nuevo td{background:rgba(80,200,120,.16)}
tr.nuevo td.num{color:#98c379;background:rgba(80,200,120,.30)}
tr.nuevo td.mar{color:#98c379}
tr.borrado td{background:rgba(255,90,90,.16)}
tr.borrado td.lin span{text-decoration:line-through;text-decoration-color:rgba(255,120,120,.7)}
tr.borrado td.num{color:#e06c75;background:rgba(255,90,90,.30)}
tr.borrado td.mar{color:#e06c75}
tr.ctx td.lin{opacity:.55}
tr.sep td{height:10px;background:#21252b}
tr.primera td{padding-top:8px}
%CSS%
</style></head><body><div id="captura">
<div class="barra"><span class="pto pr"></span><span class="pto pa"></span><span class="pto pv"></span>
<span class="titulo">%TITULO%</span><span class="leyenda">%LEYENDA%</span></div>
<table class="cod">%FILAS%</table></div></body></html>"""


def html_ventana(titulo, filas, leyenda=''):
    cuerpo = []
    for i, (num, clase, contenido) in enumerate(filas):
        if clase == 'sep':
            cuerpo.append('<tr class="sep"><td colspan="3"></td></tr>')
            continue
        marca = {'nuevo': '+', 'borrado': '−'}.get(clase, '')
        extra = ' primera' if i == 0 else ''
        cuerpo.append(f'<tr class="{clase}{extra}"><td class="num">{num}</td><td class="mar">{marca}</td>'
                      f'<td class="lin"><span>{contenido or " "}</span></td></tr>')
    return (PLANTILLA_VENTANA.replace('%CSS%', CSS_CODIGO).replace('%TITULO%', titulo)
            .replace('%LEYENDA%', leyenda).replace('%FILAS%', '\n'.join(cuerpo)))


def indent(t):
    return len(t) - len(t.lstrip(' '))


def trocear(lineas, a, b):
    """Divide el rango [a, b] en trozos de como mucho MAX_LINEAS_IMAGEN, cortando en sitios naturales."""
    if b - a + 1 <= MAX_LINEAS_IMAGEN:
        return [(a, b)]
    base = min(indent(lineas[k]['texto']) for k in range(a, b + 1) if lineas[k]['texto'].strip())
    cortes = []
    for k in range(a + 1, b + 1):
        prev = lineas[k - 1]['texto'].strip()
        t = lineas[k]['texto']
        if lineas[k]['intro'] or prev == '' or (t.strip() and indent(t) <= base + 2 and CIERRES.match(prev)):
            cortes.append(k)
    trozos, inicio = [], a
    while b - inicio + 1 > MAX_LINEAS_IMAGEN:
        candidatos = [k for k in cortes if inicio + 8 <= k <= inicio + MAX_LINEAS_IMAGEN]
        corte = max(candidatos) if candidatos else inicio + MAX_LINEAS_IMAGEN - 4
        trozos.append((inicio, corte - 1))
        inicio = corte
    trozos.append((inicio, b))
    # quitar líneas en blanco de los bordes
    limpios = []
    for (x, y) in trozos:
        while x <= y and not lineas[x]['texto'].strip():
            x += 1
        while y >= x and not lineas[y]['texto'].strip():
            y -= 1
        if x <= y:
            limpios.append((x, y))
    return limpios


def codigo_md(lineas, lenguaje):
    cuerpo = '\n'.join(l['texto'] for l in lineas)
    return f"```{'javascript' if lenguaje == 'js' else 'html'}\n{cuerpo}\n```"


# ---------------------------------------------------------------------------
# Generador
# ---------------------------------------------------------------------------
class Generador:
    def __init__(self, clave):
        self.cfg = importlib.import_module(f'config_{clave}').CONFIG
        c = self.cfg
        self.fuente = os.path.join(AQUI, c['fuente'])
        self.destino = os.path.normpath(os.path.join(AQUI, '..', c['carpeta']))
        self.informe = os.path.join(self.destino, 'informe')
        self.img = os.path.join(self.informe, 'img')
        self.obra = os.path.join(AQUI, '_obra', clave)
        os.makedirs(self.img, exist_ok=True)
        os.makedirs(self.obra, exist_ok=True)
        self.trabajos = []
        self.avisos = []
        self.archivos = [('index.html', 'index.src.html', 'html'), ('juego.js', 'juego.src.js', 'js')]
        self.datos = {n: leer_fuente(os.path.join(self.fuente, s)) for n, s, _ in self.archivos}
        self.figura = 0

    # ---------- archivos de cada paso ----------
    def construir(self):
        n = self.cfg['pasos']
        for p in range(1, n + 1):
            d = os.path.join(self.destino, 'pasos', f'paso{p:02d}')
            os.makedirs(d, exist_ok=True)
            for nombre, _, _ in self.archivos:
                with open(os.path.join(d, nombre), 'w', encoding='utf-8') as f:
                    f.write(texto_de(version(self.datos[nombre], p)))
        for nombre, _, _ in self.archivos:
            with open(os.path.join(self.destino, nombre), 'w', encoding='utf-8') as f:
                f.write(texto_de(version(self.datos[nombre], n)))

    # ---------- imágenes de código ----------
    def imagen_codigo(self, nombre_img, titulo, filas, leyenda=''):
        ruta_html = os.path.join(self.obra, nombre_img.replace('.png', '.html'))
        with open(ruta_html, 'w', encoding='utf-8') as f:
            f.write(html_ventana(titulo, filas, leyenda))
        self.trabajos.append(dict(tipo='html', pagina=ruta_html, salida=os.path.join(self.img, nombre_img), escala=1.5))
        return nombre_img

    def filas(self, lista, resaltado, a, b, clase_marcada, ctx_antes=0, ctx_despues=0):
        filas = []
        ini, fin = max(0, a - ctx_antes), min(len(lista) - 1, b + ctx_despues)
        for k in range(ini, fin + 1):
            clase = clase_marcada if a <= k <= b else 'ctx'
            filas.append((k + 1, clase, resaltado[k]))
        return filas

    def seccion_cambios(self, paso):
        """Devuelve el Markdown con todos los cambios de un paso."""
        bloques = []
        todos = []
        for nombre, _, leng in self.archivos:
            antes, ahora, lista = cambios(self.datos[nombre], paso)
            for c in lista:
                todos.append((nombre, leng, antes, ahora, c))
        total = len(todos)
        for n, (nombre, leng, antes, ahora, c) in enumerate(todos, 1):
            bloques.append(self.md_cambio(paso, n, total, nombre, leng, antes, ahora, c))
        return '\n\n'.join(bloques)

    def ancla_texto(self, lista, idx):
        k = idx - 1
        while k >= 0 and not lista[k]['texto'].strip():
            k -= 1
        if k < 0:
            return None, None
        texto = lista[k]['texto'].strip()
        if CIERRES.match(texto):
            # buscar la línea que abre ese bloque para que la referencia no sea ambigua
            nivel = 0
            for j in range(k, -1, -1):
                t = lista[j]['texto']
                nivel += t.count('}') + t.count(']') - t.count('{') - t.count('[')
                if nivel <= 0 and j != k:
                    apertura = t.strip()
                    if len(apertura) > 70:
                        apertura = apertura[:67] + '...'
                    return k + 1, f"{texto}` que cierra el bloque `{apertura}"
        return k + 1, texto

    def md_cambio(self, paso, n, total, nombre, leng, antes, ahora, c):
        partes = []
        res_ahora = resaltar(ahora, leng) if ahora else []
        res_antes = resaltar(antes, leng) if antes else []
        verbo = {'suma': 'Añadir código', 'resta': 'Borrar código', 'reemplazo': 'Cambiar (reemplazar) código'}[c['tipo']]
        if nombre == 'index.html' and paso == 1:
            verbo = 'Escribir el archivo completo'
        elif nombre == 'juego.js' and paso == 1:
            verbo = 'Escribir el archivo completo'
        partes.append(f'#### Cambio {n} de {total} · {verbo} en `{nombre}`')

        if c['resta']:
            ra, rb = c['resta']
            num_ancla, txt_ancla = self.ancla_texto(antes, ra)
            img = self.imagen_codigo(
                f'codigo_p{paso:02d}_c{n}_borrar.png',
                f'{nombre} <b>· antes del paso {paso}</b>',
                self.filas(antes, res_antes, ra, rb, 'borrado', 2, 2),
                '<i class="lb">− líneas que hay que borrar</i>')
            if ra == rb:
                desc = f'la línea {ra + 1}'
            else:
                desc = f'las líneas {ra + 1} a {rb + 1}'
            donde = f' (están justo debajo de `{txt_ancla}`)' if txt_ancla else ''
            accion = 'Borra' if c['tipo'] == 'resta' else 'Primero, borra'
            partes.append(f'🗑️ **{accion} {desc} de tu archivo `{nombre}`**{donde}. En la imagen aparecen en rojo y tachadas:')
            partes.append(self.md_imagen(img, f'Paso {paso}: líneas que se borran de {nombre}', ancho='92%'))
            partes.append('Estas son las líneas que desaparecen:')
            partes.append(codigo_md(antes[ra:rb + 1], leng))

        if c['suma']:
            a, b = c['suma']
            num_ancla, txt_ancla = self.ancla_texto(ahora, a)
            if c['tipo'] == 'reemplazo':
                partes.append(f'✏️ **Después, en ese mismo sitio, escribe las líneas nuevas** (quedan en las líneas {a + 1} a {b + 1} del archivo terminado).')
            elif verbo.startswith('Escribir'):
                partes.append(f'📄 Abre `{nombre}` (vacío) y escribe **todo** este código. Tiene {b - a + 1} líneas.')
            elif txt_ancla:
                partes.append(f'📍 **Dónde:** justo **debajo** de la línea `{txt_ancla}` (en el archivo terminado de este paso es la línea {num_ancla}). '
                              f'Las líneas nuevas son de la {a + 1} a la {b + 1}.')
            else:
                partes.append('📍 **Dónde:** al principio del archivo.')
            trozos = trocear(ahora, a, b)
            for t_i, (x, y) in enumerate(trozos, 1):
                sufijo = f' (parte {t_i} de {len(trozos)})' if len(trozos) > 1 else ''
                img = self.imagen_codigo(
                    f'codigo_p{paso:02d}_c{n}_{t_i}.png',
                    f'{nombre} <b>· paso {paso}{sufijo}</b>',
                    self.filas(ahora, res_ahora, x, y, 'nuevo',
                               2 if t_i == 1 else 0, 2 if t_i == len(trozos) else 0),
                    '<i class="ln">+ líneas nuevas</i>')
                if len(trozos) > 1:
                    partes.append(f'##### Parte {t_i} de {len(trozos)} (líneas {x + 1} a {y + 1})')
                partes.append(self.md_imagen(img, f'Paso {paso}: código nuevo en {nombre}{sufijo}. Lo verde es lo que escribes; lo gris ya lo tenías.', ancho='92%'))
                partes.append('**Explicación línea por línea:**')
                partes.append(self.md_explicacion(ahora[x:y + 1], x))
                partes.append('**Código para copiar** (o mejor, ¡escríbelo tú para aprender!):')
                partes.append(codigo_md(ahora[x:y + 1], leng))
        return '\n\n'.join(partes)

    def md_explicacion(self, lineas, desplazamiento):
        salida = []
        for i, l in enumerate(lineas):
            for intro in l['intro']:
                salida.append(f'\n> {intro}\n')
            t = l['texto'].strip()
            if not t:
                continue
            texto = l['expl'] or explicar(t)
            if not texto:
                self.avisos.append(f"Sin explicación ({self.cfg['fuente']} línea {l['origen']}): {t}")
                texto = '(sin explicación)'
            codigo = t if len(t) <= 90 else t[:87] + '...'
            salida.append(f'- **Línea {desplazamiento + i + 1}** · `{codigo}`  \n  → {texto}')
        return '\n'.join(salida)

    # ---------- figuras ----------
    def md_imagen(self, archivo, pie, ancho='85%'):
        self.figura += 1
        return f'§FIG§{archivo}§{ancho}§Figura {self.figura}. {pie}§FIN§'

    def capturas(self):
        for e in self.cfg['escenarios']:
            paso = e.get('paso')
            pagina = os.path.join(self.destino, 'pasos', f'paso{paso:02d}', 'index.html') if paso else os.path.join(self.destino, 'index.html')
            if 'variante' in e:
                pagina = self.crear_variante(e['id'], e['variante'])
            crudo = os.path.join(self.obra, f"crudo_{e['id']}.png")
            acciones = list(e.get('acciones', []))
            self.trabajos_juego.append(dict(tipo='juego', id=e['id'], pagina=pagina, acciones=acciones,
                                            salida=crudo, semilla=e.get('semilla', 7),
                                            esperaInicial=e.get('esperaInicial', 400)))
            ruta = f"pasos/paso{paso:02d}/index.html" if paso else e.get('url', 'index.html')
            marco = os.path.join(self.obra, f"marco_{e['id']}.html")
            with open(marco, 'w', encoding='utf-8') as f:
                f.write(PLANTILLA_MARCO.replace('%IMG%', 'file://' + crudo)
                        .replace('%URL%', f"file:///C:/Users/tu-usuario/Documentos/Juegos/{self.cfg['carpeta_usuario']}/{ruta}")
                        .replace('%TITULO%', self.cfg['titulo_pestana']))
            self.trabajos.append(dict(tipo='html', pagina=marco, salida=os.path.join(self.img, f"captura_{e['id']}.png"), escala=1, ancho=1000))

    def crear_variante(self, ident, cambios_codigo):
        carpeta = os.path.join(self.obra, 'var_' + ident)
        os.makedirs(carpeta, exist_ok=True)
        shutil.copy(os.path.join(self.destino, 'index.html'), carpeta)
        with open(os.path.join(self.destino, 'juego.js'), encoding='utf-8') as f:
            codigo = f.read()
        for viejo, nuevo in cambios_codigo:
            if codigo.count(viejo) < 1:
                raise SystemExit(f'Variante {ident}: no encuentro {viejo!r}')
            codigo = codigo.replace(viejo, nuevo, 1)
        with open(os.path.join(carpeta, 'juego.js'), 'w', encoding='utf-8') as f:
            f.write(codigo)
        return os.path.join(carpeta, 'index.html')

    def consolas(self, errores):
        for e in self.cfg['escenarios']:
            if not e.get('consola'):
                continue
            mensajes = errores.get(e['id'], ['(sin errores)'])
            filas = ''.join(f'<div class="err"><span class="x">&#10006;</span><span class="msg">Uncaught {esc(m)}</span>'
                            f'<span class="src">juego.js</span></div>' for m in mensajes[:1])
            ruta = os.path.join(self.obra, f"consola_{e['id']}.html")
            with open(ruta, 'w', encoding='utf-8') as f:
                f.write(PLANTILLA_CONSOLA.replace('%FILAS%', filas))
            self.trabajos.append(dict(tipo='html', pagina=ruta, salida=os.path.join(self.img, f"consola_{e['id']}.png"), escala=1.5, ancho=1000))

    def diagramas(self):
        carpeta = os.path.join(AQUI, 'comun', 'diagramas')
        for nombre in self.cfg['diagramas']:
            ruta = os.path.join(carpeta, nombre + '.html')
            if not os.path.exists(ruta):
                ruta = os.path.join(self.fuente, 'diagramas', nombre + '.html')
            self.trabajos.append(dict(tipo='html', pagina=ruta, salida=os.path.join(self.img, f'diagrama_{nombre}.png'), escala=1.5, ancho=1100, alto=900))

    def codigo_completo(self):
        md = []
        for nombre, _, leng in self.archivos:
            lineas = version(self.datos[nombre], self.cfg['pasos'])
            res = resaltar(lineas, leng)
            md.append(f'### Archivo `{nombre}` completo ({len(lineas)} líneas)')
            for i in range(0, len(lineas), 50):
                j = min(len(lineas), i + 50) - 1
                img = self.imagen_codigo(f"completo_{nombre.replace('.', '_')}_{i // 50 + 1:02d}.png",
                                         f'{nombre} <b>· versión final · líneas {i + 1}–{j + 1}</b>',
                                         [(k + 1, 'ctx0', res[k]) for k in range(i, j + 1)])
                md.append(self.md_imagen(img, f'{nombre} final, líneas {i + 1} a {j + 1}', ancho='92%'))
        return '\n\n'.join(md)

    # ---------- informe ----------
    def expandir(self, plantilla):
        def rep(m):
            clave, _, resto = m.group(1).partition(':')
            if clave == 'CAMBIOS':
                return self.seccion_cambios(int(resto))
            if clave in ('CAPTURA', 'DIAGRAMA', 'IMG', 'CONSOLA'):
                ident, _, pie = resto.partition('|')
                archivo = {'CAPTURA': f'captura_{ident}.png', 'DIAGRAMA': f'diagrama_{ident}.png', 'IMG': ident,
                           'CONSOLA': f'consola_{ident}.png'}[clave]
                if not os.path.exists(os.path.join(self.img, archivo)) and clave == 'IMG':
                    self.avisos.append(f'Falta la imagen {archivo}')
                ancho = '80%' if clave == 'CAPTURA' else '90%'
                return self.md_imagen(archivo, pie, ancho)
            if clave == 'CODIGO_COMPLETO':
                return self.codigo_completo()
            raise SystemExit('Marcador desconocido: ' + clave)
        return re.sub(r'\{\{(.+?)\}\}', rep, plantilla)

    def figuras_para(self, md, modo):
        def rep(m):
            archivo, ancho, pie = m.group(1), m.group(2), m.group(3)
            if modo == 'github':
                return f'<p align="center"><img src="img/{archivo}" alt="{esc(pie)}" width="{ancho}"></p>\n\n<p align="center"><em>{esc(pie)}</em></p>'
            return f'![{pie}](img/{archivo}){{width={ancho}}}'
        return re.sub(r'§FIG§(.+?)§(.+?)§(.+?)§FIN§', rep, md)

    def comprimir_imagenes(self):
        from PIL import Image
        for nombre in os.listdir(self.img):
            ruta = os.path.join(self.img, nombre)
            im = Image.open(ruta)
            if im.mode == 'P':
                continue
            im = im.convert('RGB').quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG)
            im.save(ruta, optimize=True)

    def ejecutar_render(self, trabajos, nombre):
        ruta = os.path.join(self.obra, nombre)
        with open(ruta, 'w') as f:
            json.dump(trabajos, f)
        subprocess.run(['node', os.path.join(AQUI, 'render.js'), ruta], check=True)
        with open(ruta.replace('.json', '.resultado.json')) as f:
            return json.load(f)

    def todo(self, con_capturas=True):
        self.construir()
        self.trabajos_juego = []
        self.capturas()
        self.diagramas()
        with open(os.path.join(self.fuente, 'informe.md'), encoding='utf-8') as f:
            plantilla = f.read()
        md = self.expandir(plantilla)
        if con_capturas:
            errores = self.ejecutar_render(self.trabajos_juego, 'trabajos_juego.json')
            esperados = set(self.cfg.get('errores_esperados', []))
            for k, v in errores.items():
                if k not in esperados:
                    self.avisos.append(f'Errores en captura {k}: {v}')
            with open(os.path.join(self.obra, 'errores_capturas.json'), 'w') as f:
                json.dump(errores, f, ensure_ascii=False, indent=2)
        else:
            with open(os.path.join(self.obra, 'errores_capturas.json')) as f:
                errores = json.load(f)
        self.consolas(errores)
        self.ejecutar_render(self.trabajos, 'trabajos_imagenes.json')
        self.comprimir_imagenes()
        # Markdown para GitHub
        md_github = self.figuras_para(md, 'github')
        with open(os.path.join(self.informe, self.cfg['archivo_informe'] + '.md'), 'w', encoding='utf-8') as f:
            f.write(md_github)
        # Markdown para pandoc (Word y PDF)
        md_pandoc = self.figuras_para(md, 'pandoc')
        md_pandoc = re.sub(r'<!-- solo-github -->.*?<!-- /solo-github -->', '', md_pandoc, flags=re.S)
        ruta_pandoc = os.path.join(self.informe, '_pandoc.md')
        with open(ruta_pandoc, 'w', encoding='utf-8') as f:
            f.write(md_pandoc)
        base = self.cfg['archivo_informe']
        meta = ['--metadata', f"title={self.cfg['titulo_informe']}", '--metadata', f"subtitle={self.cfg['subtitulo_informe']}",
                '--metadata', 'lang=es-ES', '--metadata', 'toc-title=Índice']
        subprocess.run(['pandoc', '_pandoc.md', '-o', base + '.docx', '--toc', '--toc-depth=2',
                        '--highlight-style=tango', '--resource-path=.', *meta], cwd=self.informe, check=True)
        css = os.path.join(AQUI, 'comun', 'informe.css')
        subprocess.run(['pandoc', '_pandoc.md', '-o', os.path.join(self.obra, 'informe.html'), '--standalone', '--toc', '--toc-depth=2',
                        '--embed-resources', '--css', css, '--highlight-style=tango', '--resource-path=.', *meta],
                       cwd=self.informe, check=True)
        self.ejecutar_render([dict(tipo='pdf', pagina=os.path.join(self.obra, 'informe.html'),
                                   salida=os.path.join(self.informe, base + '.pdf'), pie=self.cfg['titulo_informe'])], 'trabajos_pdf.json')
        os.remove(ruta_pandoc)
        print(f'Figuras: {self.figura}')
        if self.avisos:
            print('AVISOS:')
            for a in self.avisos:
                print('  ' + a)


PLANTILLA_CONSOLA = """<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{margin:0;padding:20px;background:#fff;font-family:'DejaVu Sans',Arial,sans-serif}
#captura{width:900px;border-radius:8px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,.35);background:#fff;border:1px solid #ccc}
.tabs{display:flex;gap:18px;background:#f1f3f4;padding:7px 14px;font-size:12.5px;color:#555;border-bottom:1px solid #ddd}
.tabs b{color:#1a73e8;border-bottom:2px solid #1a73e8;padding-bottom:5px;font-weight:normal}
.filtro{padding:6px 14px;font-size:12px;color:#888;border-bottom:1px solid #eee}
.err{display:flex;gap:10px;align-items:flex-start;background:#fdf0f0;border-top:1px solid #f9d6d6;border-bottom:1px solid #f9d6d6;color:#c5221f;font-family:'DejaVu Sans Mono',monospace;font-size:13px;padding:8px 14px}
.x{font-size:12px}.msg{flex:1}.src{color:#555;text-decoration:underline}
.prompt{padding:8px 14px;color:#1a73e8;font-family:'DejaVu Sans Mono',monospace;font-size:13px}
</style></head><body><div id="captura">
<div class="tabs"><span>Elements</span><b>Console</b><span>Sources</span><span>Network</span></div>
<div class="filtro">Filter &nbsp;&nbsp;|&nbsp;&nbsp; Default levels ▾</div>
%FILAS%
<div class="prompt">&gt;</div>
</div></body></html>"""


PLANTILLA_MARCO = """<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{margin:0;padding:20px;background:#fff;font-family:'DejaVu Sans',Arial,sans-serif}
#captura{display:inline-block;border-radius:10px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,.35);background:#dee1e6}
.pest{height:34px;display:flex;align-items:flex-end;padding-left:12px;gap:8px}
.p{width:12px;height:12px;border-radius:50%;display:inline-block;margin-bottom:11px}
.r{background:#ff5f57}.a{background:#febc2e}.v{background:#28c840}
.tab{background:#fff;border-radius:8px 8px 0 0;padding:8px 16px;font-size:12.5px;color:#333;margin-left:12px;max-width:380px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dir{background:#fff;padding:6px 12px 8px;display:flex;gap:10px;align-items:center;border-bottom:1px solid #ddd}
.btn{color:#888;font-size:15px}
.url{flex:1;background:#f1f3f4;border-radius:14px;padding:5px 14px;font-size:12.5px;color:#444;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cont{background:#12372a;padding:0;line-height:0}
img{display:block}
</style></head><body><div id="captura">
<div class="pest"><span class="p r"></span><span class="p a"></span><span class="p v"></span><span class="tab">%TITULO%</span></div>
<div class="dir"><span class="btn">&#8592;</span><span class="btn">&#8594;</span><span class="btn">&#8635;</span><span class="url">%URL%</span></div>
<div class="cont"><img src="%IMG%" width="800" height="600"></div>
</div></body></html>"""


if __name__ == '__main__':
    g = Generador(sys.argv[1])
    g.todo(con_capturas='--sin-capturas' not in sys.argv)
