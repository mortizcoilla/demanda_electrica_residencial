# Changelog — Dashboard Demanda Eléctrica Residencial Chile

> Historial de versiones del dashboard. Inspirado en Keep a Changelog 1.1.0.
> Formato: [Added] / [Changed] / [Fixed] / [Removed] / [Security].

## v0.2.1 (2 de octubre de 2026) — Auditoría de charts · fixes + interactividad

### Fixed
- **Tooltips invisibles al hacer scroll** — `.tooltip` usaba `position: absolute`
  pero se posicionaba con coordenadas de viewport (`clientX/Y`); ahora es
  `position: fixed`. Afectaba a todos los charts por igual.
- **Línea separadora "observado / proyectado" invisible en el cono CNE** —
  `proyeccion_cne.js` usaba `C.lineStrong`, que no existía en la paleta
  (`utils.js`). Se agregó el token `lineStrong` a la paleta `C`.
- **Anotaciones solapadas en el cono CNE** — "+10,5 TWh electromovilidad" y
  "+6,8 TWh calefacción" colisionaban cerca de 2043. Ahora viven en un bloque
  apilado arriba-izquierda del plot, con valores calculados desde
  `drivers_2043` del JSON.
- **Ejes mal etiquetados en `causal.js`** — la semántica de la metadata del
  dataset dice X = estabilidad, Y = horizonte, pero el chart ponía "CORTO
  PLAZO / LARGO PLAZO" sobre el eje horizontal y "ESTACIONARIO / DINÁMICO"
  también abajo (doble semántica contradictoria). Corregido: X = estabilidad
  (estable → cambiante), Y = horizonte (corto → largo, con etiqueta rotada).
- **Leyenda MAPE desincronizada** — los colores de la leyenda HTML no
  coincidían con `familia_color` del JSON (y usaba `#0d6b54` para dos
  significados distintos). Regenerada con los colores reales del chart.
- **Serie de peaks inconsistente con CEN** — `peak_demanda_sen.json` tenía
  2022 = 11.500 (ene), 2023 = 11.820 y 2025 = 12.400 (est.), en conflicto con
  `peak_shift.json` y con el Reporte anual art. 72-15 del CEN. Serie unificada
  y verificada: 2022 = 11.590 (15-dic), 2023 = 11.549 (26-dic),
  2025 = 12.397 (04-feb, confirmado). Footer del §2 ahora se calcula desde
  los datos (+15,9%).
- **Texto garlado del evento 2023** en `peak_shift.json`
  ("peak 12 12-dic a las 16h") y nota que llamaba "invernal" a un peak de
  diciembre — corregido a "estival temprano".
- **`dashboard-internal.html` no cargaba D3 ni `css/styles.css`** — el head
  del internal nunca fue sincronizado con el del público: ningún chart
  renderizaba (ReferenceError de `d3` en `utils.js`) y la página se veía sin
  estilos. Agregados ambos tags.
- **Donut §1 ausente en el internal** — el internal aún tenía el viejo
  `<svg id="chart-sector">` + leyenda estática con colores desactualizados,
  mientras `sector.js` renderiza en `<div id="sector-host">`. Sincronizado
  con el público.
- **Tooltip del chart drivers** — el año del punto AC se resolvía con
  `AC_PCT.indexOf(d)`, frágil ante valores duplicados; ahora usa el índice
  del datum.

### Added
- **Donut §1 interactivo** — click en segmento o leyenda actualiza el readout
  central (label + % + descripción) y atenúa el resto; click de nuevo resetea.
- **Crosshair con readout en vivo** en drivers (§3) y peak shift (§2.5):
  línea guía vertical con snap al año más cercano y valores de todas las
  series visibles.
- **Toggles de series en el cono CNE (§8)** — mostrar/ocultar Observado,
  Medio, Alto, Alto+H2V y banda de incertidumbre, con etiquetas de fin de
  línea (valor 2043) en desktop.
- **Leyenda clickeable en predictores (§7)** — se deriva de los colores del
  dataset (garantiza coincidencia con las burbujas) y permite aislar una
  familia por click.
- **Toggle de orden (Mayor/Menor MAPE)** en benchmarks (§5).
- **Banda de rango 2026** en peak shift (12.500–13.200 MWh/h con tooltip).
- **Mini-leyenda de estación** en el chart de demanda §2 y colores de
  estación unificados con §2.5 (invierno verde · verano terracota ·
  transición ocre).

### Changed
- Dominios de ejes Y de demanda y peak shift ahora se calculan desde los
  datos (antes hardcodeados; el peak récord se detecta en vez de asumir
  `peaks[6]`).
- Textos §2.5 ajustados: "período estival (diciembre–febrero)" y +15,9%.

## v0.2.0 (21 de julio de 2026) — Atlas level · datos y visibilidad

### Changed
- **Capa de datos migrada a `data/*.json` con provenance completa**.
  Siete archivos JSON con metadata de trazabilidad:
  `composicion_sen`, `distribuidoras`, `peak_demanda_sen`, `vectores_cambio`,
  `benchmarks_mape`, `predictores`, `kpis_hero`. Cada uno incluye
  `fuente_primaria`, `url_fuente`, `fecha_extraccion`, `cobertura_temporal`,
  `cobertura_geografica` y `nota_metodologica`.
- **`js/data.js` reescrito como loader async** (`loadAllData()` con `fetch`).
  Los 6 charts D3 ahora reciben los datos como parámetro en lugar de
  importarlos directamente.
- **`js/main.js` orquestado**: `loadAllData()` se resuelve antes de inicializar
  los charts. Si falla, se muestra una banner sticky con la causa (típicamente
  `file://` en lugar de servidor HTTP, que bloquea `fetch`).

### Added
- **`favicon.svg`** — rayo estilizado en verde profundo con base cálida.
- **JSON-LD `Article` estructurado** en `index.html` y `dashboard-internal.html`
  con headline, author, publisher, citation a CEN/CNE/Minenergía, inLanguage.
- **Open Graph + Twitter Card** completos (title, description, image, locale).
- **Endnotes públicas** con lista curada de fuentes primarias en el footer
  (CEN, CNE, SEC, Minenergía, CR2, ANAC, Energía Abierta, literatura revisada por pares).
- **Callout "Más del autor"** con link discreto a `mortizcoilla.vercel.app/`.
  Mismo patrón visual que el byline (JetBrains Mono uppercase + SVG icon externo).
- **Print stylesheet** — oculta nav, drawer, filtros, back-to-top, tooltip
  y elementos interactivos al imprimir. Tipografía y colores de alta contraste.
- **`docs/auditoria_inicial.md`** — diagnóstico completo del estado pre-Atlas.
- **`docs/metodologia.md`** — protocolo de extracción, validación y actualización.
- **`docs/plan_actualizacion.md`** — cadencia por fuente con tiempos estimados.

### Removed
- **Promesa rota** de "bajar el estudio completo en Markdown" en §10 del internal.
  El repo no incluye un MD separado; el dashboard ES el estudio. La promesa
  se reemplazó por una nota honesta.
- **2 archivos `.bak`** de `data.js` (backup local). `.gitignore` ya los
  cubría, pero estaban en el working tree.

### Fixed
- **Inconsistencia de footer** entre `index.html` y `dashboard-internal.html`:
  el público decía "Estudio técnico..." sin署名, el internal tenía "© 2026
  Miguel Ortiz C.". Ahora ambos tienen el mismo bloque de autor con 3 botones.
- **"Tiempo de lectura: 12 min" en el internal**: era inexacto (el internal
  tiene 3 secciones más). Removido del hero. El público lo mantiene
  (estimación razonable para las 7 secciones).

### Security
- Sin cambios.

---

## v0.1.0 (18 de julio de 2026) — Lanzamiento inicial

### Added
- `index.html` (7 secciones públicas): §1 Mercado, §2 Demanda, §3 Vectores,
  §4 Datos, §5 Modelos, §6 Implementación, §7 Cadena causal.
- `dashboard-internal.html` (10 secciones, en `.gitignore`): incluye
  §8 Recomendación metodológica, §9 Hoja de ruta 12 meses, §10 Cierre
  con 5 ideas.
- 6 charts D3.js: donut (sector), barras horizontales con filtro (distribuidoras),
  barras anuales con estacionalidad (demand), multi-vector con toggles (drivers),
  scatter benchmarks literarios con doble filtro (mape), scatter de predictores (causal).
- CSS refinado (1.567 líneas) con sistema de tokens, 5 niveles de sombra,
  breakpoints responsive.
- `js/data.js` con todos los datasets centralizados.
- `js/utils.js` con paleta C, tooltip compartido, `watchResize`, breakpoints.
- `js/controls.js` con nav, drawer móvil, scroll suave, active section,
  back-to-top.
- `scripts/update_dashboard_data.py` (32 KB) — pipeline de actualización.
- `package.json` con `npx http-server` y `npx live-server`.
- Byline con 3 botones (LinkedIn / Email / WhatsApp) — sin títulos universitarios.

---

*Mantenedor: Miguel Ortiz C. · Estructura del changelog inspirada en Keep a Changelog 1.1.0.*
