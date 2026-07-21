# Changelog — Dashboard Demanda Eléctrica Residencial Chile

> Historial de versiones del dashboard. Inspirado en Keep a Changelog 1.1.0.
> Formato: [Added] / [Changed] / [Fixed] / [Removed] / [Security].

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
