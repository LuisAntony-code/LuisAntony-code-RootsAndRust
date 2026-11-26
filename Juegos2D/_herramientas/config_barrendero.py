"""Configuración del informe de Barrendero Orbital."""

QUIETA = "chatarras = [];"


def pieza(x, y, t=3, vx=0, vy=0):
    return f"crearChatarra({x}, {y}, {t}); chatarras[chatarras.length - 1].vx = {vx}; chatarras[chatarras.length - 1].vy = {vy};"


BOT = """comprobarChoqueNave = function () {};
setInterval(function () {
  if ((typeof estado !== 'undefined' && estado !== 'jugando') || !chatarras.length) { teclas.Space = false; return; }
  var obj = chatarras.slice().sort(function (a, b) { return distancia(a.x, a.y, nave.x, nave.y) - distancia(b.x, b.y, nave.x, nave.y); })[0];
  var deseado = Math.atan2(obj.y - nave.y, obj.x - nave.x);
  var dif = Math.atan2(Math.sin(deseado - nave.angulo), Math.cos(deseado - nave.angulo));
  teclas.ArrowLeft = dif < -0.08; teclas.ArrowRight = dif > 0.08; teclas.Space = Math.abs(dif) < 0.3;
  teclas.ArrowUp = distancia(obj.x, obj.y, nave.x, nave.y) > 260;
}, 30);"""

ESCENARIOS = [
    dict(id='p01', paso=1),
    dict(id='p02', paso=2, acciones=[{'esperar': 800}]),
    dict(id='p03', paso=3, acciones=[{'esperar': 300}]),
    dict(id='p04_giro', paso=4, acciones=[{'mantener': ['ArrowRight', 300]}, {'esperar': 100}]),
    dict(id='p04_motor', paso=4, acciones=[{'mantener': ['ArrowRight', 200]}, {'bajar': 'ArrowUp'}, {'esperar': 700}]),
    dict(id='p05_antes', paso=5, acciones=[{'codigo': 'nave.x = 760; nave.angulo = 0; nave.vx = 140;'}, {'esperar': 120}]),
    dict(id='p05_despues', paso=5, acciones=[{'codigo': 'nave.x = 760; nave.angulo = 0; nave.vx = 140;'}, {'esperar': 700}]),
    dict(id='p06', paso=6, acciones=[{'bajar': 'Space'}, {'mantener': ['ArrowLeft', 900]}]),
    dict(id='p07', paso=7, acciones=[{'esperar': 1200}], semilla=3),
    dict(id='p08_antes', paso=8, acciones=[{'codigo': QUIETA + pieza(400, 170)}, {'pulsar': 'Space'}, {'esperar': 90}]),
    dict(id='p08_dividido', paso=8, acciones=[{'codigo': QUIETA + pieza(400, 170)}, {'pulsar': 'Space'}, {'esperar': 450}]),
    dict(id='p08_pequenas', paso=8, acciones=[{'codigo': QUIETA + pieza(400, 170)}, {'bajar': 'Space'}, {'esperar': 1300}], semilla=4),
    dict(id='p09_fragmentos', paso=9, acciones=[{'codigo': QUIETA + "crearFragmento(220, 150); crearFragmento(600, 420); crearFragmento(640, 160);" + pieza(400, 160, 1)}, {'pulsar': 'Space'}, {'esperar': 400}]),
    dict(id='p09_recoger', paso=9, acciones=[{'codigo': QUIETA + "crearFragmento(400, 215);"}, {'esperar': 380}]),
    dict(id='p10_antes', paso=10, acciones=[{'codigo': QUIETA + "nave.x = 250; nave.y = 300;" + pieza(250, 150, 3, 0, 160)}, {'esperar': 500}]),
    dict(id='p10_choque', paso=10, acciones=[{'codigo': QUIETA + "nave.x = 250; nave.y = 300;" + pieza(250, 150, 3, 0, 160)}, {'esperar': 950}]),
    dict(id='p11_satelite', paso=11, acciones=[{'codigo': QUIETA + "crearSatelite(); satelites[0].x = 220; satelites[0].y = 180; tiempoSatelite = 1e9;"}, {'esperar': 300}]),
    dict(id='p11_kessler', paso=11, acciones=[{'codigo': QUIETA + "tiempoSatelite = 1e9; crearSatelite(); satelites[0].x = 560; satelites[0].y = 200; satelites[0].vx = 0; satelites[0].vy = 0;" + pieza(560, 60, 3, 0, 150)}, {'esperar': 900}]),
    dict(id='p11_disparo', paso=11, acciones=[{'codigo': QUIETA + "tiempoSatelite = 1e9; crearSatelite(); satelites[0].x = 400; satelites[0].y = 150; satelites[0].vx = 0; satelites[0].vy = 0;"}, {'pulsar': 'Space'}, {'esperar': 400}]),
    dict(id='p11_salvado', paso=11, acciones=[{'codigo': QUIETA + "tiempoSatelite = 1e9; crearSatelite(); satelites[0].x = 790; satelites[0].y = 200; satelites[0].vx = 120; satelites[0].vy = 0;" + pieza(150, 450, 3)}, {'esperar': 700}]),
    dict(id='p12_hud', paso=12, acciones=[{'codigo': BOT}, {'esperar': 2500}], semilla=8),
    dict(id='p12_oleada', paso=12, acciones=[{'codigo': 'puntos = 870; kilosRecogidos = 42;' + QUIETA}, {'esperar': 300}]),
    dict(id='p13_explosion', paso=13, acciones=[{'codigo': QUIETA + pieza(400, 190)}, {'pulsar': 'Space'}, {'esperar': 170}]),
    dict(id='p13_motor', paso=13, acciones=[{'codigo': QUIETA + pieza(120, 480, 3)}, {'bajar': 'ArrowUp'}, {'mantener': ['ArrowLeft', 900]}]),
    dict(id='p13_nave', paso=13, acciones=[{'codigo': QUIETA + "nave.x = 300;" + pieza(300, 150, 3, 0, 220)}, {'esperar': 640}]),
    dict(id='p14_menu', paso=14, acciones=[{'esperar': 600}, {'codigo': 'tiempoTotal = 0.1;'}, {'esperar': 30}]),
    dict(id='p14_inicio', paso=14, acciones=[{'pulsar': 'Enter'}, {'esperar': 600}]),
    dict(id='p14_fin', paso=14, acciones=[{'pulsar': 'Enter'}, {'esperar': 300}, {'codigo': "puntos = 2340; kilosRecogidos = 87; oleada = 4; satelitesSalvados = 3; satelitesPerdidos = 1; vidas = 1; naveDestruida(); tiempoTotal = 0.1;"}, {'esperar': 30}]),
    dict(id='final_menu', acciones=[{'esperar': 700}, {'codigo': 'tiempoTotal = 0.1;'}, {'esperar': 30}]),
    dict(id='final_juego', acciones=[{'pulsar': 'Enter'}, {'codigo': 'oleada = 3; chatarras = []; iniciarOleada(); puntos = 1460; kilosRecogidos = 38; satelitesSalvados = 2; tiempoSatelite = 2;' + BOT}, {'esperar': 4200}], semilla=12),
    dict(id='final_juego2', acciones=[{'pulsar': 'Enter'}, {'codigo': 'oleada = 2; chatarras = []; iniciarOleada(); puntos = 640; tiempoSatelite = 0.5;' + BOT}, {'esperar': 3500}], semilla=21),
    dict(id='error_sin_fondo', variante=[('  dibujarFondo();\n  dibujarFragmentos();', '  // dibujarFondo();\n  dibujarFragmentos();')],
         acciones=[{'pulsar': 'Enter'}, {'codigo': BOT}, {'esperar': 2500}]),
    dict(id='error_typo', variante=[('ctx.fillRect(0, 0, ANCHO, ALTO);', 'cxt.fillRect(0, 0, ANCHO, ALTO);')], consola=True, acciones=[{'esperar': 600}]),
    dict(id='error_restore', variante=[('c.radio * 0.08), 0, Math.PI * 2);\n  ctx.fill();\n  ctx.restore();', 'c.radio * 0.08), 0, Math.PI * 2);\n  ctx.fill();')],
         acciones=[{'codigo': 'estado = "x";'}, {'esperar': 120}]),
    dict(id='error_seno', variante=[('nave.vy += Math.sin(nave.angulo) * EMPUJE * dt;', 'nave.vy += Math.cos(nave.angulo) * EMPUJE * dt;')],
         acciones=[{'pulsar': 'Enter'}, {'codigo': 'chatarras = [];' + pieza(700, 120, 3) + 'nave.x = 250; nave.y = 300; nave.angulo = -Math.PI / 4; nave.invulnerable = 0; mensaje.tiempo = 0;'}, {'bajar': 'ArrowUp'}, {'esperar': 800}]),
]

CONFIG = dict(
    fuente='barrendero',
    carpeta='BarrenderoOrbital',
    carpeta_usuario='BarrenderoOrbital',
    pasos=14,
    titulo_pestana='Barrendero Orbital - Limpia la chatarra espacial',
    archivo_informe='Informe_BarrenderoOrbital',
    titulo_informe='Informe de creación del videojuego «Barrendero Orbital»',
    subtitulo_informe='Un juego 2D de naves al estilo de los clásicos de asteroides para entender y combatir la basura espacial, explicado paso a paso y línea por línea',
    diagramas=['coordenadas', 'bucle', 'radianes', 'consola_abrir', 'estructura_barrendero', 'editor_barrendero', 'abrir_navegador_barrendero',
               'vectores', 'envolver', 'division', 'colision_circulos', 'kessler', 'arquitectura_barrendero', 'hoja_de_ruta_barrendero'],
    escenarios=ESCENARIOS,
    errores_esperados=['error_typo'],
)
