"""Lee un archivo fuente con marcas de paso y genera cada versión intermedia.

Marcas (se eliminan del código que se entrega):
  //#[N   o  //#[N-M     abre un bloque visible desde el paso N (hasta el M)
  //#]                    cierra el bloque
  //? texto               explicación de la línea de código siguiente
  //> texto               párrafo introductorio que se muestra antes de esa línea
En HTML se usan igual pero dentro de <!-- -->.
"""
import re

MARCA = re.compile(r'^\s*(?://|<!--)\s*(#\[|#\]|\?|>)\s?(.*?)\s*(?:-->)?\s*$')
INFINITO = 999


def leer_fuente(ruta):
    lineas, pila, expl, intro = [], [(1, INFINITO)], [], []
    with open(ruta, encoding='utf-8') as f:
        texto = f.read().rstrip('\n')
    for num, crudo in enumerate(texto.split('\n'), 1):
        m = MARCA.match(crudo)
        if m:
            tipo, resto = m.group(1), m.group(2)
            if tipo == '#[':
                rango = resto.split()[0]
                a, _, b = rango.partition('-')
                a, b = int(a), (int(b) if b else INFINITO)
                pila.append((max(pila[-1][0], a), min(pila[-1][1], b)))
            elif tipo == '#]':
                pila.pop()
                if not pila:
                    raise SystemExit(f'{ruta}:{num}: //#] sin abrir')
            elif tipo == '?':
                expl.append(resto)
            else:
                intro.append(resto)
            continue
        primero, ultimo = pila[-1]
        lineas.append(dict(id=len(lineas), texto=crudo.rstrip(), primero=primero, ultimo=ultimo,
                           expl=' '.join(expl), intro=list(intro), origen=num))
        expl, intro = [], []
    if len(pila) != 1:
        raise SystemExit(f'{ruta}: bloques sin cerrar')
    return lineas


def version(lineas, paso):
    """Líneas visibles en un paso (sin líneas en blanco repetidas)."""
    salida = []
    for l in lineas:
        if l['primero'] <= paso <= l['ultimo']:
            if l['texto'].strip() == '' and (not salida or salida[-1]['texto'].strip() == ''):
                continue
            salida.append(l)
    while salida and salida[-1]['texto'].strip() == '':
        salida.pop()
    return salida


def texto_de(lineas):
    return '\n'.join(l['texto'] for l in lineas) + '\n'


def _rachas(lista, marcados):
    """Devuelve [(inicio, fin)] (índices inclusive) de rachas de elementos marcados."""
    rachas, i = [], 0
    while i < len(lista):
        if lista[i]['id'] in marcados:
            j = i
            while j + 1 < len(lista) and lista[j + 1]['id'] in marcados:
                j += 1
            # recortar líneas en blanco de los extremos
            a, b = i, j
            while a <= b and lista[a]['texto'].strip() == '':
                a += 1
            while b >= a and lista[b]['texto'].strip() == '':
                b -= 1
            if a <= b:
                rachas.append((a, b))
            i = j + 1
        else:
            i += 1
    return rachas


def cambios(lineas, paso):
    """Lista de cambios del paso: añadidos, borrados y reemplazos (en orden de archivo)."""
    antes = version(lineas, paso - 1) if paso > 1 else []
    ahora = version(lineas, paso)
    ids_antes = {l['id'] for l in antes}
    ids_ahora = {l['id'] for l in ahora}
    nuevos = ids_ahora - ids_antes
    quitados = ids_antes - ids_ahora
    sumas = _rachas(ahora, nuevos)
    restas = _rachas(antes, quitados)

    def anterior_comun(lista, idx, validos):
        k = idx - 1
        while k >= 0 and lista[k]['id'] not in validos:
            k -= 1
        return lista[k]['id'] if k >= 0 else None

    comunes = ids_antes & ids_ahora
    lista = []
    usados = set()
    for (a, b) in sumas:
        ancla = anterior_comun(ahora, a, comunes)
        borrado = None
        for n, (ra, rb) in enumerate(restas):
            if n not in usados and anterior_comun(antes, ra, comunes) == ancla:
                borrado = (ra, rb)
                usados.add(n)
                break
        lista.append(dict(tipo='reemplazo' if borrado else 'suma', suma=(a, b), resta=borrado))
    for n, (ra, rb) in enumerate(restas):
        if n not in usados:
            lista.append(dict(tipo='resta', suma=None, resta=(ra, rb)))

    def clave(c):
        if c['suma']:
            return c['suma'][0]
        # posición aproximada del borrado en el archivo nuevo
        ancla = anterior_comun(antes, c['resta'][0], comunes)
        pos = next((i for i, l in enumerate(ahora) if l['id'] == ancla), -1)
        return pos + 0.5
    lista.sort(key=clave)
    return antes, ahora, lista
