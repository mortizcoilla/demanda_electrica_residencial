# Predicción de demanda eléctrica residencial en Chile — Dashboard

Visualización interactiva en D3.js del estudio integrado sobre predicción de demanda eléctrica residencial en Chile (julio 2026).

## Estructura del proyecto

```
dashboard-app/
├── index.html              # PÚBLICO — Secciones §1-§7, sin toggle, se despliega a internet
├── dashboard-internal.html # LOCAL ONLY — Secciones §1-§10 + secciones internas
│                           #              Está en .gitignore, no se commitea, no se deploya
├── css/
│   └── styles.css          # Sistema de diseño completo (16 KB)
├── js/
│   ├── main.js             # Entry point: initDOMContentLoaded → init*() en orden
│   ├── data.js             # Todos los datasets editables en un solo archivo
│   ├── utils.js            # Paleta C, helpers de tooltip, fmt, showTip
│   ├── controls.js         # Scroll suave de la navegación
│   └── charts/
│       ├── sector.js       # §1 — Composición SEN (donut chart)
│       ├── distribuidoras.js # §1 — Clientes por distribuidora (bar chart con filtro macrozona)
│       ├── demand.js       # §2 — Peak horario SEN 2018–2025 (line chart)
│       ├── drivers.js      # §3 — AC / Net Billing / EV (multi-line, dual-axis)
│       ├── mape.js         # §5 — MAPE benchmarks (scatter por familia + filtro)
│       └── causal.js       # §7 — Mapa de predictores (scatter + ejes)
├── README.md
├── package.json            # Opcional: para npx serve / live-server
└── .gitignore
```

## La vista dual: pública vs interna

Hay **dos archivos HTML** que comparten el mismo CSS/JS/data:

| Archivo | Contenido | Uso | Deploy |
|---|---|---|---|
| `index.html` | §1-§7 (sin secciones internas) | Cliente externo | ✅ GitHub Pages / Vercel |
| `dashboard-internal.html` | §1-§10 (incluye §8 Recomendación, §9 Roadmap, §10 Cierre) | Tu uso personal | ❌ **Nunca** deployar |

El archivo `dashboard-internal.html` está listado en `.gitignore` para que no se commitee al repo público. Tú lo mantienes en tu máquina local y lo abres cuando quieras ver la versión completa.

### Configuración inicial (una sola vez)

1. Descomprime el zip
2. Abre `index.html` → este es el que vas a commitear y deployar
3. Abre `dashboard-internal.html` → este es tu vista privada, no lo subas a git
4. Si quieres confirmar que el ignore funciona: `git status` no debe mencionar el internal

### Si clonas el repo desde GitHub

El `dashboard-internal.html` no estará ahí (es lo correcto). Para volver a tenerlo en tu local, cópialo desde el zip original o créalo de nuevo desde este chat.

## Quick start

### Opción 1 — Python (recomendada, sin instalar nada)

```bash
cd dashboard-app
python3 -m http.server 8000
```

Abrir <http://localhost:8000> para la versión pública, o <http://localhost:8000/dashboard-internal.html> para la interna.

### Opción 2 — Node.js

```bash
cd dashboard-app
npx http-server -p 8000
# o
npx live-server --port=8000
```

### Opción 3 — Abrir directamente

**No funciona** en navegadores modernos (los ES modules requieren servidor por CORS). Usa siempre un servidor local.

## Stack

- **D3.js v7** — cargado desde CDN (`jsdelivr.net`) como script global
- **ES modules nativos** — los archivos en `js/` usan `import`/`export` sin transpilar
- **Sin build step** — abrir y usar
- **Tipografía** — Outfit (sans) + JetBrains Mono desde Google Fonts

## Cómo modificar los datos

Todos los datos están centralizados en [`js/data.js`](js/data.js). Edita los arrays existentes o reemplaza con tus propios datos; el formato esperado está documentado en comentarios dentro de cada constante.

```js
// Ejemplo: editar el donut de composición SEN
export const SECTOR_DATA = [
  { label: 'Residencial regulado', value: 30, color: '#14a37f' },
  { label: 'Comercial / pequeño industrial', value: 24, color: '#475569' },
  // ...
];
```

**Importante:** los cambios en `js/data.js` se reflejan automáticamente en **ambos** archivos HTML porque ambos importan el mismo módulo.

Después de editar, refresca el navegador — no hay caché que limpiar.

## Cómo agregar un nuevo gráfico

1. Crea `js/charts/miChart.js` con un export `initMiChart()`:

   ```js
   import { C, showTip, hideTip } from '../utils.js';
   
   export function initMiChart() {
     const svg = d3.select('#chart-minegro');
     // ... tu render D3 aquí
   }
   ```

2. Importa y llama desde [`js/main.js`](js/main.js):

   ```js
   import { initMiChart } from './charts/miChart.js';
   // ...
   initMiChart();
   ```

3. Agrega el `<svg id="chart-minegro">` en **ambos** HTML (público e interno), dentro de la sección que corresponda.

## Sistema de colores

Los tokens principales están definidos como CSS custom properties en `css/styles.css`:

| Token              | Color     | Uso                                  |
| ------------------ | --------- | ------------------------------------ |
| `--primary`        | `#0d6b54` | Verde, identidad                     |
| `--accent`         | `#c97b3f` | Naranja, AC / clásicos               |
| `--indigo`         | `#4f5dde` | Azul, ML / vehículos eléctricos      |
| `--amber`          | `#d49a1c` | Amarillo, ensembles                  |
| `--ink-1` / `--ink-2` | Negro / gris | Texto                          |
| `--bg-soft`        | `#f7f4ee` | Beige, fondo de página               |

Los gráficos D3 importan la paleta `C` desde [`js/utils.js`](js/utils.js), que espeja los mismos tokens en un objeto JS para usarlos en SVG (los atributos SVG no leen CSS vars).

## Compatibilidad

- Chrome / Edge / Firefox / Safari — últimas dos versiones
- Mobile: layout responsivo para pantallas ≥ 360 px

## Fuentes de datos (referenciadas en el estudio)

- **CEN** — coordinador.cl — operación real del SEN
- **CNE / Energía Abierta** — energiaabierta.cl — facturación, tarifas, ERNC
- **SEC** — sec.cl — calidad de servicio
- **Minenergía** — energia.gob.cl — políticas, programas
- **CR2** — cr2.cl — clima grillado (CR2MET v2.5)
- **DMC** — Dirección Meteorológica de Chile
- **ANAC** — anac.cl — vehículos eléctricos
- **INE** — censos, demografía

## Licencia

Uso libre para fines académicos y de investigación. Citar estudio original al reutilizar.
