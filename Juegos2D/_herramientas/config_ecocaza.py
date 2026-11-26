"""Configuración del informe de EcoCaza: escenarios de captura, diagramas y textos."""


def caer(indice, y=400, x='contenedor.x'):
    """Código JS que deja caer un residuo concreto del catálogo justo encima del contenedor."""
    return (f"residuos.push({{modelo: RESIDUOS[{indice}], x: {x}, y: {y}, radio: 22, velocidad: 120, giro: 0.2, velocidadGiro: 0}});")


PREPARAR = "tiempoParaSiguiente = 1e9; residuos = [];"
BOT = """setInterval(function () {
  if (estado !== 'jugando') return;
  var candidatos = residuos.filter(function (r) { return r.y < 470; }).sort(function (a, b) { return b.y - a.y; });
  if (candidatos.length) { contenedor.objetivoX = candidatos[0].x; cambiarTipo(candidatos[0].modelo.tipo); }
}, 40);"""

ESCENARIOS = [
    dict(id='p01', paso=1),
    dict(id='p02', paso=2, acciones=[{'esperar': 1500}]),
    dict(id='p02_nubes', paso=2, acciones=[{'codigo': 'tiempoTotal = 14;'}, {'esperar': 300}]),
    dict(id='p03', paso=3, acciones=[{'esperar': 300}]),
    dict(id='p04_izq', paso=4, acciones=[{'mantener': ['ArrowLeft', 450]}, {'esperar': 100}]),
    dict(id='p04_borde', paso=4, acciones=[{'mantener': ['ArrowRight', 1500]}, {'esperar': 100}]),
    dict(id='p05_azul', paso=5, acciones=[{'pulsar': 'Digit2'}, {'esperar': 400}]),
    dict(id='p05_salto', paso=5, acciones=[{'pulsar': 'Digit3'}, {'codigo': 'contenedor.salto = 0.1;'}, {'esperar': 10}]),
    dict(id='p05_marron', paso=5, acciones=[{'mantener': ['ArrowLeft', 300]}, {'pulsar': 'Digit4'}, {'esperar': 400}]),
    dict(id='p06', paso=6, acciones=[{'esperar': 5200}]),
    dict(id='p07', paso=7, acciones=[{'esperar': 5200}]),
    dict(id='p07_catalogo', paso=7, acciones=[
        {'codigo': PREPARAR + "residuos = RESIDUOS.map(function (m, i) { return {modelo: m, x: 110 + (i % 5) * 145, y: 150 + Math.floor(i / 5) * 170, radio: 22, velocidad: 0, giro: 0, velocidadGiro: 0}; });"},
        {'esperar': 200}]),
    dict(id='p08_antes', paso=8, acciones=[{'codigo': PREPARAR + caer(0, 380)}, {'esperar': 300}]),
    dict(id='p08_acierto', paso=8, acciones=[{'codigo': PREPARAR + caer(0, 400)}, {'esperar': 900}]),
    dict(id='p08_error', paso=8, acciones=[{'codigo': PREPARAR + caer(3, 400)}, {'esperar': 900}]),
    dict(id='p09_combo', paso=9, acciones=[{'codigo': PREPARAR + 'combo = 2; puntos = 30;' + caer(1, 440)}, {'esperar': 550}]),
    dict(id='p09_consejo', paso=9, acciones=[{'codigo': PREPARAR + 'puntos = 60; contenedor.tipo = "azul";' + caer(2, 440)}, {'esperar': 700}]),
    dict(id='p10_medio', paso=10, acciones=[{'codigo': PREPARAR + "contaminacion = 50; basuraSuelo = [0,3,5,7,1].map(function (k, i) { return {x: 60 + i * 160, giro: i, modelo: RESIDUOS[k]}; });"}, {'esperar': 300}]),
    dict(id='p10_alto', paso=10, acciones=[{'codigo': PREPARAR + "contaminacion = 90; basuraSuelo = [0,3,5,7,1,2,4,6,8,0,3,5].map(function (k, i) { return {x: 30 + i * 65, giro: i * 1.3, modelo: RESIDUOS[k]}; });"}, {'esperar': 300}]),
    dict(id='p10_cae', paso=10, acciones=[{'codigo': PREPARAR + caer(4, 470, 650)}, {'esperar': 450}]),
    dict(id='p11_particulas', paso=11, acciones=[{'codigo': PREPARAR + 'combo = 1;' + caer(0, 455)}, {'esperar': 260}]),
    dict(id='p11_error', paso=11, acciones=[{'codigo': PREPARAR + caer(7, 455)}, {'esperar': 260}]),
    dict(id='p12_menu', paso=12, acciones=[{'esperar': 600}, {'codigo': 'tiempoTotal = 0.1;'}, {'esperar': 30}]),
    dict(id='p12_jugando', paso=12, acciones=[{'pulsar': 'Space'}, {'codigo': BOT}, {'esperar': 6000}]),
    dict(id='p12_nivel', paso=12, acciones=[{'pulsar': 'Space'}, {'codigo': 'puntos = 150;'}, {'esperar': 350}]),
    dict(id='p12_fin', paso=12, acciones=[{'pulsar': 'Space'}, {'esperar': 300}, {'codigo': "puntos = 230; aciertos = 21; fallos = 3; perdidos = 2; vidas = 0;"}, {'esperar': 300}, {'codigo': 'tiempoTotal = 0.1;'}, {'esperar': 30}]),
    dict(id='p12_fin_contaminado', paso=12, acciones=[{'pulsar': 'Space'}, {'esperar': 300}, {'codigo': "record = 400; puntos = 120; aciertos = 9; fallos = 1; perdidos = 10; contaminacion = 100;"}, {'esperar': 300}, {'codigo': 'tiempoTotal = 0.1;'}, {'esperar': 30}]),
    dict(id='p13_raton', paso=13, acciones=[{'pulsar': 'Space'}, {'codigo': 'tiempoParaSiguiente = 1e9;'}, {'raton': [180, 330]}, {'esperar': 900}]),
    dict(id='p13_boton', paso=13, acciones=[{'pulsar': 'Space'}, {'codigo': 'tiempoParaSiguiente = 1e9;'}, {'clic': [460, 581]}, {'esperar': 500}]),
    dict(id='final_menu', acciones=[{'esperar': 600}, {'codigo': 'tiempoTotal = 0.1;'}, {'esperar': 30}]),
    dict(id='final_juego', acciones=[{'pulsar': 'Space'}, {'codigo': 'puntos = 290; ' + BOT}, {'esperar': 9000}], semilla=11),
    dict(id='final_juego2', acciones=[{'pulsar': 'Space'}, {'codigo': 'puntos = 450; contaminacion = 30; ' + BOT}, {'esperar': 7000}, {'codigo': PREPARAR + caer(6, 455)}, {'esperar': 250}], semilla=5),
    # Errores comunes (versiones del juego con un fallo a propósito)
    dict(id='error_sin_fondo', variante=[('  dibujarFondo();\n  dibujarBasuraSuelo();', '  // dibujarFondo();\n  dibujarBasuraSuelo();')],
         acciones=[{'pulsar': 'Space'}, {'codigo': BOT}, {'esperar': 3000}]),
    dict(id='error_typo', variante=[('ctx.fillRect(0, 0, ANCHO, ALTO);', 'cxt.fillRect(0, 0, ANCHO, ALTO);')], consola=True,
         acciones=[{'esperar': 600}]),
    dict(id='error_id', variante=[('getElementById("lienzo")', 'getElementById("lienso")')], consola=True,
         acciones=[{'esperar': 600}]),
    dict(id='error_beginpath', variante=[('ctx.beginPath();\n  ctx.arc(x, y, 25,', 'ctx.arc(x, y, 25,')],
         acciones=[{'esperar': 300}, {'codigo': 'tiempoTotal = 0.1; estado = "x";'}, {'esperar': 60}]),
]

CONFIG = dict(
    fuente='ecocaza',
    carpeta='EcoCaza',
    carpeta_usuario='EcoCaza',
    pasos=13,
    titulo_pestana='EcoCaza - Separa la basura, salva el planeta',
    archivo_informe='Informe_EcoCaza',
    titulo_informe='Informe de creación del videojuego «EcoCaza»',
    subtitulo_informe='Un juego 2D para aprender a separar la basura, explicado paso a paso y línea por línea',
    diagramas=['coordenadas', 'bucle', 'estructura_ecocaza', 'editor_ecocaza', 'abrir_navegador', 'colision_ecocaza',
               'arquitectura_ecocaza', 'hoja_de_ruta_ecocaza', 'radianes', 'consola_abrir'],
    escenarios=ESCENARIOS,
    errores_esperados=['error_typo', 'error_id'],
)
