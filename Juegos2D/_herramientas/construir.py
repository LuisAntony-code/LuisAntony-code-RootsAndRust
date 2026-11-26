"""Genera los archivos de cada paso y la versión final de un juego."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from pasos import leer_fuente, version, texto_de

def construir(fuente_dir, destino, num_pasos):
    archivos = {'index.html': 'index.src.html', 'juego.js': 'juego.src.js'}
    datos = {n: leer_fuente(os.path.join(fuente_dir, s)) for n, s in archivos.items()}
    for p in range(1, num_pasos + 1):
        d = os.path.join(destino, 'pasos', f'paso{p:02d}')
        os.makedirs(d, exist_ok=True)
        for n, lineas in datos.items():
            open(os.path.join(d, n), 'w', encoding='utf-8').write(texto_de(version(lineas, p)))
    for n, lineas in datos.items():
        open(os.path.join(destino, n), 'w', encoding='utf-8').write(texto_de(version(lineas, num_pasos)))
    return datos

if __name__ == '__main__':
    construir(sys.argv[1], sys.argv[2], int(sys.argv[3]))
