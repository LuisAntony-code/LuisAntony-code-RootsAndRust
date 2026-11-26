"""Configuración del informe de ¡Compila!."""


def c(t, n=0):
    return f'{{tipo: "{t}", n: {n}}}'


def mano(*cartas):
    return 'mano = [' + ', '.join(cartas) + ']; seleccion = [];'


# Una mano fija para que las capturas sean claras
MANO_A = mano(c('suma', 7), c('repetir'), c('mult', 3), c('cuadrado'), c('suma', 2), c('siPar'), c('mult', 2))
SIN_MSJ = 'mensaje.tiempo = 0;'
EMPEZAR = [{'pulsar': 'Space'}, {'esperar': 100}]


def teclas(*nums):
    return [{'pulsar': f'Digit{n}'} for n in nums]


ESCENARIOS = [
    dict(id='p01', paso=1),
    dict(id='p02', paso=2, acciones=[{'esperar': 600}]),
    dict(id='p03', paso=3, acciones=[{'esperar': 300}]),
    dict(id='p04', paso=4, acciones=[{'esperar': 300}], semilla=3),
    dict(id='p05_seleccion', paso=5, acciones=[{'codigo': MANO_A}, *teclas(1, 3, 4), {'raton': [495, 470]}, {'esperar': 200}]),
    dict(id='p06_editor', paso=6, acciones=[{'codigo': MANO_A}, *teclas(1, 3, 2, 7), {'esperar': 200}]),
    dict(id='p06_vacio', paso=6, acciones=[{'codigo': MANO_A}, {'esperar': 200}]),
    dict(id='p07_mitad', paso=7, acciones=[{'codigo': MANO_A}, *teclas(1, 3, 2, 7), {'pulsar': 'Enter'}, {'esperar': 1000}]),
    dict(id='p07_final', paso=7, acciones=[{'codigo': MANO_A}, *teclas(1, 3, 2, 7), {'pulsar': 'Enter'}, {'esperar': 2300}]),
    dict(id='p07_orden_a', paso=7, acciones=[{'codigo': MANO_A}, *teclas(1, 3), {'pulsar': 'Enter'}, {'esperar': 1300}]),
    dict(id='p07_orden_b', paso=7, acciones=[{'codigo': MANO_A}, *teclas(3, 1), {'pulsar': 'Enter'}, {'esperar': 1300}]),
    dict(id='p08_panel', paso=8, acciones=[{'codigo': MANO_A}, *teclas(1, 3, 2, 7), {'pulsar': 'Enter'}, {'esperar': 3600}, *teclas(2, 5)]),
    dict(id='p09_examen', paso=9, acciones=[{'esperar': 400}], semilla=5),
    dict(id='p09_aprobado', paso=9, acciones=[{'codigo': SIN_MSJ + MANO_A + 'puntaje = 95;'}, *teclas(1), {'pulsar': 'Enter'}, {'esperar': 2300}]),
    dict(id='p10_jefe', paso=10, acciones=[{'codigo': 'ciclo = 2; examen = 2; iniciarExamen(); jefe = JEFES[0]; ' + SIN_MSJ + MANO_A}, *teclas(5, 4), {'esperar': 200}]),
    dict(id='p10_discreta', paso=10, acciones=[{'codigo': 'ciclo = 2; examen = 2; iniciarExamen(); jefe = JEFES[0]; ' + SIN_MSJ + MANO_A}, *teclas(1, 4), {'pulsar': 'Enter'}, {'esperar': 1500}]),
    dict(id='p11_tienda', paso=11, acciones=[{'codigo': 'creditos = 12; abrirTienda(); ' + SIN_MSJ}, {'esperar': 200}], semilla=2),
    dict(id='p11_librerias', paso=11, acciones=[{'codigo': 'librerias = [LIBRERIAS[0], LIBRERIAS[2], LIBRERIAS[5]]; creditos = 6; ' + SIN_MSJ + MANO_A}, *teclas(1, 3), {'pulsar': 'Enter'}, {'esperar': 2600}]),
    dict(id='p12_explosion', paso=12, acciones=[{'codigo': SIN_MSJ + mano(c('suma', 9), c('mult', 3), c('repetir'), c('cuadrado'), c('suma', 1), c('mult', 2), c('suma', 4))}, *teclas(1, 2, 3, 4), {'pulsar': 'Enter'}, {'esperar': 2150}]),
    dict(id='p12_contador', paso=12, acciones=[{'codigo': SIN_MSJ + mano(c('suma', 9), c('mult', 3), c('repetir'), c('cuadrado'), c('suma', 1), c('mult', 2), c('suma', 4))}, *teclas(1, 2, 3, 4), {'pulsar': 'Enter'}, {'esperar': 3500}]),
    dict(id='p13_menu', paso=13, acciones=[{'esperar': 400}, {'codigo': 'tiempoTotal = 0.1;'}, {'esperar': 30}]),
    dict(id='p13_inicio', paso=13, acciones=[*EMPEZAR, {'esperar': 300}], semilla=9),
    dict(id='p13_fin', paso=13, acciones=[*EMPEZAR, {'codigo': 'ciclo = 4; examen = 2; jefe = JEFES[1]; examenesAprobados = 11; mejorEjecucion = 48210; librerias = [LIBRERIAS[0], LIBRERIAS[1], LIBRERIAS[5]]; terminarPartida(); tiempoTotal = 0.1;'}, {'esperar': 30}]),
    dict(id='p13_graduado', paso=13, acciones=[*EMPEZAR, {'codigo': 'ciclo = 10; examen = 2; mejorEjecucion = 9875432; aprobarExamen(); tiempoTotal = 0.1;'}, {'esperar': 600}]),
    dict(id='final_menu', acciones=[{'esperar': 500}, {'codigo': 'tiempoTotal = 0.1;'}, {'esperar': 30}]),
    dict(id='final_juego', acciones=[*EMPEZAR, {'codigo': 'ciclo = 4; examen = 1; iniciarExamen(); librerias = [LIBRERIAS[1], LIBRERIAS[0], LIBRERIAS[7]]; creditos = 9; puntaje = 1210; puntajeMostrado = 1210; ejecuciones = 2; ' + SIN_MSJ + mano(c('suma', 8), c('mult', 3), c('repetir'), c('suma', 5), c('cuadrado'), c('siPar'), c('mult', 2))}, *teclas(1, 4, 2, 3, 5), {'pulsar': 'Enter'}, {'esperar': 2300}]),
    dict(id='final_juego2', acciones=[*EMPEZAR, {'codigo': 'ciclo = 2; examen = 0; iniciarExamen(); librerias = [LIBRERIAS[3]]; creditos = 4; ' + SIN_MSJ + MANO_A}, *teclas(5, 6, 4, 3), {'raton': [370, 460]}, {'esperar': 200}]),
    dict(id='error_typo', variante=[('(tiempoTotal * 10) % 40', '(tiempototal * 10) % 40')], consola=True, acciones=[{'esperar': 500}]),
    dict(id='error_bucle', variante=[('    veces = 1;\n', '')],
         acciones=[*EMPEZAR, {'codigo': SIN_MSJ + MANO_A}, *teclas(5, 2, 7, 1), {'pulsar': 'Enter'}, {'esperar': 2300}]),
    dict(id='bien_bucle', acciones=[*EMPEZAR, {'codigo': SIN_MSJ + MANO_A}, *teclas(5, 2, 7, 1), {'pulsar': 'Enter'}, {'esperar': 2300}]),
]

CONFIG = dict(
    fuente='compila',
    carpeta='Compila',
    carpeta_usuario='Compila',
    pasos=13,
    titulo_pestana='¡Compila! - El roguelike de cartas donde tu mano es un programa',
    archivo_informe='Informe_Compila',
    titulo_informe='Informe de creación del videojuego «¡Compila!»',
    subtitulo_informe='Un roguelike de cartas donde tu mano es un programa: aprende a pensar como programador jugando. Explicado paso a paso y línea por línea',
    diagramas=['coordenadas', 'bucle', 'consola_abrir', 'estructura_compila', 'editor_compila', 'abrir_navegador_compila',
               'hoja_de_ruta_compila', 'orden_importa', 'interprete', 'fisher_yates', 'estados', 'arquitectura_compila', 'ciclo_juego'],
    escenarios=ESCENARIOS,
    errores_esperados=['error_typo'],
)
