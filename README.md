# 🌳 Roots & Rust ⚙️

**Shooter táctico 4v4 en tercera persona.** Los **Guardianes del Bosque** (activistas) defienden el bosque con esporas que hacen crecer árboles; los **Taladores S.A.** (corporación) lo arrasan con sierras térmicas rebotantes. Estilo visual vibrante y súper saturado (cel-shading propio para URP), multijugador con **Netcode for GameObjects** y conexión por Internet **sin abrir puertos** (Unity Relay + Lobby).

---

## 📋 Requisitos

| Herramienta | Versión |
|---|---|
| **Unity** | **Unity 6 LTS — `6000.0.47f1`** (cualquier `6000.0.x` sirve; Unity Hub ofrecerá abrirlo con la que tengas) |
| Módulos de Unity | El de tu sistema (Windows/Mac Build Support) |
| Git | 2.30 o superior |
| **Git LFS** | Obligatorio (`git lfs install`) — los binarios pesados van por LFS |

> ⚠️ Usad **todos la misma versión de Unity**. Mezclar versiones reescribe archivos y genera conflictos.

---

## 🚀 Primer arranque

### 1. Clonar

```bash
git lfs install
```

```bash
git clone https://github.com/LuisAntony-code/LuisAntony-code-RootsAndRust.git
```

### 2. Abrir en Unity
1. **Unity Hub → Add → Add project from disk** → selecciona la carpeta `RootsAndRust`.
2. La primera apertura tarda unos minutos (descarga los paquetes de `Packages/manifest.json`).
3. Si Unity pregunta *"Enable the new Input System backends?"* puedes responder **Yes** o **No**: el juego funciona con ambos sistemas de entrada.

### 3. Generar la escena y los prefabs (solo la primera vez)
En la barra de menús de Unity:

**`RootsAndRust > 1. Generar Escena y Prefabs Jugables`**

El asistente crea automáticamente:
- El **URP Asset** (sombras suaves, HDR, MSAA) y lo asigna en *Graphics* y *Quality*.
- Los **materiales `ToonVibrant`** con la paleta del juego.
- Los **prefabs** en `Assets/_Project/Prefabs/`: `Player_Activista`, `Player_Talador`, `Projectile_Espora`, `Projectile_Sierra`, `DynamicTree`, `Zone_BioEsporas`, `Zone_SueloQuemado`.
- La escena **`Assets/_Project/Scenes/MainArena.unity`**: terreno colorido, sol de mediodía, niebla turquesa/dorada, post-proceso vibrante, el **Árbol Corazón**, **20 árboles dinámicos**, 4+4 **Spawn Points**, el **NetworkManager** ya configurado, sistemas de juego, UI y cinemática.
- El registro de prefabs de red y `Resources/GameAssets.asset`.

Después pulsa **▶ Play**, elige **HOST LOCAL**, escoge bando… ¡y a jugar!

> 👑 **Importante para el equipo:** el asistente lo ejecuta **una sola persona** (el/la líder) y hace commit + push de lo generado (`Assets/`, `ProjectSettings/`, `Packages/packages-lock.json`). El resto de compañeros solo hace `git pull` y abre la escena con **`RootsAndRust > 2. Abrir Escena MainArena`**. Si cada uno lo genera por su cuenta, los IDs internos de los assets serán distintos y habrá conflictos.
>
> El asistente se puede volver a ejecutar en cualquier momento (sobrescribe lo generado), pero **coordinadlo** y avisad antes de subirlo.

---

## 🌐 Cómo conectarse entre todos

### Opción A — Online con código de sala (recomendado, sin abrir puertos)

**Configuración (solo una vez, la hace el/la líder):**
1. `Edit > Project Settings > Services` → inicia sesión → **Link** a un proyecto de Unity Cloud (crea uno nuevo si hace falta).
2. En el [Unity Cloud Dashboard](https://cloud.unity.com) de ese proyecto activa **Relay** y **Lobby** (tienen un plan gratuito generoso).
3. Haz commit de `ProjectSettings/` para que todos compartan el mismo *Cloud Project ID*.

**Para jugar:**
1. El anfitrión pulsa **CREAR SALA ONLINE** → aparece un **código de sala de 6 letras** (p. ej. `K7PQ2X`).
2. Lo comparte por Discord/WhatsApp.
3. Los demás lo escriben en **"Código de sala"** y pulsan **UNIRSE CON CÓDIGO**.
4. Cada uno elige bando: **Guardianes** o **Taladores** (máx. 4 por equipo).
5. El anfitrión pulsa **INICIAR PARTIDA** (o **Enter** dentro del juego).

> Internamente: Unity Authentication (anónimo) → Relay reserva un servidor de retransmisión → el código de Relay se guarda en una sala de Lobby. Por eso nadie tiene que tocar el router.

### Opción B — Red local / pruebas rápidas por IP
1. Uno pulsa **HOST LOCAL** (puerto `7777`). Su IP local aparece en pantalla.
2. Los demás escriben esa IP en **"IP del Host"** y pulsan **CLIENTE (por IP)**.
3. Si no conecta: permite Unity / el juego en el **firewall** de Windows/Mac.

### Probar tú solo en un mismo PC
- Haz una Build (`File > Build Profiles > Build`), ábrela y pulsa **HOST LOCAL**.
- En el Editor pulsa Play → **CLIENTE (por IP)** con `127.0.0.1`.
- (Alternativa: el paquete *Multiplayer Play Mode* de Unity para varios jugadores virtuales dentro del Editor).

---

## 🎮 Controles

| Acción | Tecla |
|---|---|
| Moverse | **WASD** / flechas |
| Cámara | Ratón |
| Disparar | **Clic izquierdo** |
| Apuntar (zoom sobre el hombro) | **Clic derecho** |
| Saltar | **Espacio** |
| Correr | **Shift izquierdo** |
| Dash (solo Taladores) | **Q** |
| Saltar la cinemática | **Espacio** |
| Iniciar partida (solo Host) | **Enter** |
| Menú de pausa / liberar ratón | **Esc** |

---

## 🌱 Reglas de juego

- **Partidas de 4 minutos.** La barra superior muestra el **% de Bosque Vivo vs. Madera Talada**.
- **Guardianes — Lanzador de Bio-Esporas:**
  - Al impactar el suelo crea una **zona verde**: los aliados **regeneran vida** y **saltan más alto**.
  - Al impactar un **tocón** (o un tronco caído) lo hace **crecer de nuevo** con una animación elástica (2 esporas; 1 durante el Frenesí).
- **Taladores — Cañón de Sierras Térmicas:**
  - Discos que **rebotan** hasta 3 veces. Talan árboles (2 impactos; 1 durante el Frenesí).
  - Dejan **suelo industrial quemado**: los Taladores se **deslizan más rápido** y su **dash** recarga mucho antes.
- **Árboles dinámicos:** al ser talado, el tronco cae con **físicas reales**, puede **aplastar** a los rivales y queda como **cobertura**.
- **Frenesí Final (último minuto):** se duplica la cadencia de disparo, el crecimiento y la tala, con confeti y chispas por todo el mapa.
- **Victoria:** más del 50 % de bosque vivo → ganan los Guardianes. Menos del 50 % → ganan los Taladores.

---

## 🗂️ Estructura del proyecto

```
Assets/_Project/
├── Editor/
│   └── ProjectSetupWizard.cs       # Menú RootsAndRust > 1. Generar Escena y Prefabs Jugables
├── Shaders/
│   └── ToonVibrant.shader          # Cel-shading URP: bandas suaves, sombras azuladas, rim-light, color por instancia
├── Scripts/
│   ├── Core/                       # Paleta/equipos, entrada, GameAssets, VFX por código, muelles elásticos
│   ├── Networking/                 # ConnectionManager (Auth+Relay+Lobby+IP), TeamManager, SpawnPoint, NetworkFx
│   ├── Cinematic/                  # IntroCinematicController (15 s, cámaras virtuales propias, saltar con Espacio)
│   ├── Player/                     # ThirdPersonController, WeaponSystem, NetworkProjectile, Health, ProceduralSquash
│   ├── Gameplay/                   # DynamicTree, EffectZone, GameLoopManager, HeartTree
│   └── UI/                         # LobbyUI, HUDManager, UIFactory (UI construida por código)
├── Prefabs/  Materials/  Scenes/  Settings/  Meshes/  Resources/   # ← generados por el asistente
```

**Arquitectura de red (resumen):**
- **Movimiento:** autoridad del dueño (`NetworkTransform` en modo *Owner*) → respuesta instantánea.
- **Disparos, daño, árboles, zonas y tiempo de partida:** autoridad del **servidor** (RPCs + `NetworkVariable`).
- El temporizador se sincroniza enviando la **hora de fin** en tiempo de servidor (cero tráfico por segundo).
- La UI se construye por código para evitar conflictos de Git en prefabs de UI.

---

## 🤝 Flujo de trabajo con Git

1. **Nunca trabajéis directamente en `main`.** Una rama por tarea:

   ```bash
   git checkout -b feature/nombre-de-la-tarea
   ```

2. Commits pequeños y frecuentes; `git pull` antes de empezar a trabajar.
3. **Evitad editar la misma escena a la vez.** Para trabajar en paralelo, cread prefabs o escenas propias y avisad en el chat del equipo.
4. Abrid un *Pull Request* para fusionar en `main`.

### UnityYAMLMerge (fusión inteligente de escenas y prefabs)
El `.gitattributes` ya marca `*.unity`, `*.prefab`, `*.asset`, `*.mat`… con `merge=unityyamlmerge`. Cada miembro debe añadir esto **una vez** a su `~/.gitconfig` (cambia la ruta por la de tu versión de Unity):

**Windows**
```ini
[merge]
    tool = unityyamlmerge
[merge "unityyamlmerge"]
    name = Unity SmartMerge
    driver = '"C:/Program Files/Unity/Hub/Editor/6000.0.47f1/Editor/Data/Tools/UnityYAMLMerge.exe"' merge -h -p --force %O %B %A %A
    recursive = binary
[mergetool "unityyamlmerge"]
    trustExitCode = false
    cmd = '"C:/Program Files/Unity/Hub/Editor/6000.0.47f1/Editor/Data/Tools/UnityYAMLMerge.exe"' merge -p "$BASE" "$REMOTE" "$LOCAL" "$MERGED"
```

**macOS**
```ini
[merge]
    tool = unityyamlmerge
[merge "unityyamlmerge"]
    name = Unity SmartMerge
    driver = '/Applications/Unity/Hub/Editor/6000.0.47f1/Unity.app/Contents/Tools/UnityYAMLMerge' merge -h -p --force %O %B %A %A
    recursive = binary
[mergetool "unityyamlmerge"]
    trustExitCode = false
    cmd = '/Applications/Unity/Hub/Editor/6000.0.47f1/Unity.app/Contents/Tools/UnityYAMLMerge' merge -p "$BASE" "$REMOTE" "$LOCAL" "$MERGED"
```

### Git LFS
`.gitattributes` envía por LFS: `*.fbx *.obj *.blend *.png *.jpg *.psd *.tga *.exr *.hdr *.wav *.mp3 *.ogg *.mp4 *.ttf *.otf *.zip…`
Comprueba que está activo con:

```bash
git lfs ls-files
```

---

## 🛠️ Solución de problemas

| Problema | Solución |
|---|---|
| Error al resolver un paquete (versión no encontrada) | `Window > Package Manager`, busca el paquete y pulsa **Update** a la versión recomendada para tu Unity 6. |
| Todo se ve **rosa/magenta** | Ejecuta de nuevo `RootsAndRust > 1. Generar…` (asigna el URP Asset), o asigna `Assets/_Project/Settings/RootsAndRust_URP.asset` en *Project Settings > Graphics*. |
| Textos invisibles o aviso de TMP | `Window > TextMeshPro > Import TMP Essential Resources`. |
| "No se pudo conectar a Unity Services" | Vincula el proyecto en *Project Settings > Services* y activa Relay + Lobby en el Dashboard. |
| Un cliente no conecta por IP | Misma red, IP correcta, puerto 7777 libre y permitido en el firewall. |
| "Missing script" en la escena | Asegúrate de haber hecho `git pull` con los `.meta`; nunca borréis archivos `.meta`. |

### Notas técnicas sobre los paquetes
- **TextMeshPro:** en Unity 6, TextMeshPro viene **dentro de `com.unity.ugui` (2.0)**. Por eso el manifiesto incluye `com.unity.ugui` en lugar del antiguo `com.unity.textmeshpro` (añadir ambos en Unity 6 duplica tipos y da errores de compilación). El código usa `TMPro` con normalidad.
- **Lobby + Relay:** el proyecto usa los paquetes clásicos `com.unity.services.lobby` y `com.unity.services.relay` junto con `com.unity.services.authentication`. Unity también ofrece el paquete unificado *Multiplayer Services* (`com.unity.services.multiplayer`); **no instaléis ambos a la vez**.
- **Netcode for GameObjects 2.x**, **URP 17** e **Input System** (opcional: el juego también funciona con el Input Manager clásico).

---

¡Que gane el bosque! 🌿 …o la madera. 🪚

---

## 🎮 Extra: juegos 2D educativos

La carpeta [`Juegos2D/`](Juegos2D/) contiene tres juegos 2D para navegador (**EcoCaza**, **Barrendero Orbital** y **¡Compila!**) con sus informes paso a paso en Markdown, PDF y Word. Es independiente del proyecto de Unity.
