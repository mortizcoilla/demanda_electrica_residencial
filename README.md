# Predicción de demanda eléctrica residencial en Chile — Dashboard

Visualización analítica en D3.js del estudio integrado sobre predicción de demanda eléctrica residencial en Chile (julio 2026). 7 secciones, 6 charts interactivos, 7 datasets públicos con provenance completa.

> **Estado**: v0.2.0 — Atlas level. Ver [docs/changelog.md](docs/changelog.md) para el historial.

## Estructura del proyecto

```
dashboard-app/
├── index.html               PÚBLICO — 7 secciones + endnotes. Se despliega a internet.
├── dashboard-internal.html  LOCAL ONLY — 10 secciones (incluye §8/§9/§10). En .gitignore.
├── favicon.svg              Rayo verde sobre crema (256 B)
├── og-preview.png           Open Graph 1200×630 (regenerable con src/build_og_preview.py)
├── css/
│   └── styles.css           Sistema de diseño completo (~1.700 líneas)
├── js/
│   ├── main.js              Entry point: loadAllData() → initXxxChart(DATA) × 6
│   ├── data.js              Loader async: fetch data/*.json, devuelve Promise<DATA>
│   ├── utils.js             Paleta C, tooltip, fmt, watchResize, breakpoints
│   ├── controls.js          Nav scroll suave, drawer móvil, active section, back-to-top
│   └── charts/
│       ├── sector.js        §1 — Composición SEN (donut)
│       ├── distribuidoras.js §1 — Clientes por distribuidora (bar + filtro macrozona)
│       ├── demand.js        §2 — Peak horario SEN 2018–2025 (bar)
│       ├── drivers.js       §3 — AC / Net Billing / EV (multi-line + area + dual-axis)
│       ├── mape.js          §5 — MAPE benchmarks (bar + doble filtro)
│       └── causal.js        §7 — Mapa de predictores (scatter)
├── data/                    Datasets en JSON con provenance completa
│   ├── composicion_sen.json
│   ├── distribuidoras.json
│   ├── peak_demanda_sen.json
│   ├── vectores_cambio.json
│   ├── benchmarks_mape.json
│   ├── predictores.json
│   └── kpis_hero.json
├── docs/                    Documentación interna (no se linkea desde el público)
│   ├── changelog.md         Historial de versiones
│   ├── auditoria_inicial.md Diagnóstico pre-Atlas level
│   ├── metodologia.md       Procedimiento de extracción, validación y actualización
│   └── plan_actualizacion.md Cadencia por fuente + calendario 2026-2027
├── src/
│   └── build_og_preview.py  Generador de og-preview.png
├── scripts/
│   ├── update_dashboard_data.py  Pipeline de actualización de datos (32 KB)
│   ├── apply_ola2.py             Script one-shot de Ola 2 (idempotente)
│   └── apply_internal_head.py    Script one-shot del head del internal
├── package.json            npx http-server / live-server
├── .gitignore
└── README.md
```

## La vista dual: pública vs interna

Hay dos archivos HTML que comparten el mismo CSS/JS/data:

| Archivo | Contenido | Uso | Deploy |
|---|---|---|---|
| `index.html` | §1-§7 + endnotes | Cliente externo (LinkedIn, X, GitHub Pages) | ✅ Sí |
| `dashboard-internal.html` | §1-§10 (incluye §8 Recomendación, §9 Roadmap, §10 Cierre) | Tu uso personal | ❌ **Nunca** deployar |

El archivo `dashboard-internal.html` está listado en `.gitignore` para que no se commitee al repo público. Tú lo mantienes en tu máquina local y lo abres cuando quieras ver la versión completa.

## Datos con provenance

Todos los datasets viven en `data/*.json` con metadata trazable:

```json
{
  "metadata": {
    "titulo": "Composición de la demanda SEN 2024",
    "fuente_primaria": "CEN — Coordinador Eléctrico Nacional",
    "documento_fuente": "Reporte anual art. 72-15, año 2024",
    "url_fuente": "https://www.coordinador.cl/reporte-anual/",
    "fecha_extraccion": "2026-07-15",
    "cobertura_temporal": "2024",
    "cobertura_geografica": "SEN (Chile continental)",
    "nota_metodologica": "..."
  },
  "datos": [ ... ]
}
```

Ver `docs/metodologia.md` para el procedimiento de actualización, y `docs/plan_actualizacion.md` para la cadencia por fuente.

## Quick start

### Opción 1 — Python (recomendada)

```bash
cd dashboard-app
python -m http.server 8000
```

Abrir <http://localhost:8000> para la versión pública, o <http://localhost:8000/dashboard-internal.html> para la interna.

> **Importante**: el dashboard usa `fetch()` para cargar los JSON. Si abres `index.html` directamente con `file://`, el navegador bloquea `fetch` por CORS. **Usa siempre un servidor local.**

### Opción 2 — Node.js

```bash
cd dashboard-app
npx http-server -p 8000
# o
npx live-server --port=8000
```

## Stack

- **D3.js v7** — cargado desde CDN (`jsdelivr.net`) como script global
- **ES modules nativos** — los archivos en `js/` usan `import`/`export` sin transpilar
- **Sin build step** — abrir y usar (excepto `python -m http.server` para fetch)
- **Tipografía** — Outfit (sans) + JetBrains Mono desde Google Fonts

## Cómo modificar los datos

Edita directamente el archivo `data/<dataset>.json` correspondiente. Los 6 charts leen desde `js/data.js` que hace `fetch()` de los 7 JSONs en paralelo.

```bash
# Para regenerar el OG image (requiere Pillow):
pip install Pillow
python src/build_og_preview.py
```

## Cómo agregar un nuevo chart

1. Crea `js/charts/miChart.js` con un export `initMiChart(DATA)`:

   ```js
   import { C, showTip, hideTip, watchResize, chartWidth, isCompact } from '../utils.js';

   export function initMiChart(DATA) {
     const data = DATA.miDataset.datos;  // ← desde DATA, no import
     // ... tu render D3 aquí
   }
   ```

2. Importa y llama desde [`js/main.js`](js/main.js):

   ```js
   import { initMiChart } from './charts/miChart.js';
   // ...
   loadAllData().then(DATA => {
     initMiChart(DATA);
     // ...
   });
   ```

3. Crea `data/mi_dataset.json` con la estructura `metadata + datos`.
4. Agrega el path a `DATA_FILES` en [`js/data.js`](js/data.js).
5. Agrega el `<svg id="chart-miChart">` en **ambos** HTML (público e interno), dentro de la sección que corresponda.

## Sistema de colores

Tokens principales como CSS custom properties en `css/styles.css`:

| Token              | Color     | Uso                                  |
| ------------------ | --------- | ------------------------------------ |
| `--primary`        | `#0a5847` | Verde profundo, identidad            |
| `--accent`         | `#b0663f` | Terracota, AC / clásicos             |
| `--indigo`         | `#4048b8` | ML / vehículos eléctricos            |
| `--amber`          | `#b88a1c` | Amarillo, ensembles                  |
| `--ink-1` / `--ink-2` | Negro / gris | Texto                          |
| `--bg`             | `#faf9f6` | Beige cálido, fondo de página        |

Los gráficos D3 importan la paleta `C` desde [`js/utils.js`](js/utils.js), que espeja los tokens en un objeto JS para usar en atributos SVG.

## Compatibilidad

- Chrome / Edge / Firefox / Safari — últimas dos versiones
- Mobile: layout responsivo para pantallas ≥ 360 px
- Print: oculta nav/filtros/back-to-top/tooltip, alto contraste

## Fuentes de datos (referenciadas en el dashboard)

- **CEN** — coordinador.cl — operación real del SEN
- **CNE / Energía Abierta** — energiaabierta.cl — facturación, tarifas, ERNC
- **SEC** — sec.cl — calidad de servicio
- **Minenergía** — energia.gob.cl — políticas, programas
- **CR2** — cr2.cl — clima grillado (CR2MET v2.5)
- **DMC** — Dirección Meteorológica de Chile
- **ANAC** — anac.cl — vehículos eléctricos
- **INE** — censos, demografía
- **Empresas Eléctricas A.G.** — anuario de distribución
- **Literatura revisada por pares** — IEEE, Elsevier, MDPI, Scielo, arXiv

Ver la lista curada completa con URLs en la sección "END · Fuentes y datos" del dashboard (al final, antes del footer).

## Documentación interna

- [`docs/changelog.md`](docs/changelog.md) — historial de versiones
- [`docs/auditoria_inicial.md`](docs/auditoria_inicial.md) — diagnóstico pre-Atlas level
- [`docs/metodologia.md`](docs/metodologia.md) — protocolo de datos y charts
- [`docs/plan_actualizacion.md`](docs/plan_actualizacion.md) — cadencia de actualización

Estos archivos **no se linkean desde el dashboard público**. Son para el mantenedor.

## Licencia

Uso libre para fines académicos y de investigación. Citar estudio original al reutilizar.
