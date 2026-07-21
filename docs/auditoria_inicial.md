# Auditoría inicial — Dashboard Demanda Eléctrica Residencial Chile

> Generada en Fase 0 del plan de mejora "Atlas level". Estado del repo al 21 de julio de 2026.
>
> Repo: `https://github.com/mortizcoilla/demanda_electrica_residencial`
> Versión actual: 3 commits en `main` (`7370895` quita nombre de autor en footer → `643ce87` fix compat chart.js → `a0412c0` first commit).

## Lo que hay

### Estructura
```
dashboard-app/
├── index.html               (40 KB · 7 secciones)
├── dashboard-internal.html  (51 KB · 10 secciones, en .gitignore)
├── css/styles.css           (1.567 líneas, sistema de diseño refinado)
├── js/
│   ├── main.js              entry point
│   ├── data.js              datasets centralizados
│   ├── utils.js             paleta C, tooltip, fmt, watchResize
│   ├── controls.js          nav scroll suave
│   └── charts/              sector / distribuidoras / demand / drivers / mape / causal
├── scripts/
│   ├── update_dashboard_data.py  (32 KB · pipeline de actualización)
│   └── requirements.txt
├── package.json
└── README.md (6.4 KB)
```

### Sistema visual (CSS)
- **Paleta cálida y sofisticada**: bg `#faf9f6`, primary verde profundo `#0a5847`, accent terracota `#b0663f`, supporting indigo/amber/rose
- **Tipografía**: Outfit (sans) + JetBrains Mono
- **Sombras sutiles** (5 niveles xs/sm/md/lg/xl)
- **Spacing primitives**: wrap 1200px, 8px grid
- **Token system** completo con `--bg`, `--line`, `--ink-1..5`, `--primary-soft`, etc.
- **Modern tech aesthetic** — diferente del "edición impresa" de Atlas_Mercado_Electrico. Apropiado para un dashboard técnico.

### Charts (6 funcionando)
1. `chart-sector` — donut de composición SEN 2024 (4 segmentos)
2. `chart-distribuidoras` — bar chart con filtro por macrozona (4 zonas)
3. `chart-demand` — peak horario SEN 2018–2025 (line chart)
4. `chart-drivers` — multi-line con dual-axis (AC %, Net Billing, BEV)
5. `chart-mape` — scatter de benchmarks literarios con doble filtro (LATAM/todos × familia)
6. `chart-causal` — scatter de predictores posicionados (estabilidad × horizonte)

### Contenido editorial
- **7 secciones públicas** + **3 internas** (recomendación, hoja de ruta 12 meses, cierre 5 ideas)
- **Hero con KPI strip** (4 KPIs grandes): 30% residencial, 7.31M clientes, 12.190 MWh/h peak, 134.5 TWh proyección
- **Tablas de datos** (reguladores, capacidad técnica en Chile, disponibilidad de datos)
- **Cards de métodos** (SARIMAX/Prophet, LightGBM/XGBoost, LSTM/N-HiTS)
- **Byline block** con 3 botones (LinkedIn / Email / WhatsApp) — sin portafolio
- **3 fases roadmap** (Meses 1-4, 5-8, 9-12)
- **5 ideas de cierre** + 1 card de "próximo paso concreto"

### Atributos valiosos
- ✅ **Vista dual pública/interna** (`index.html` vs `dashboard-internal.html`) — patrón inteligente que evita filtrar contenido privado
- ✅ **Filtros interactivos en 3 charts** (distribuidoras, drivers, mape)
- ✅ **Responsive básico** con breakpoints mobile/tablet/desktop
- ✅ **Back-to-top button**
- ✅ **Tooltip compartido** (`utils.js` → `showTip/hideTip`)
- ✅ **`watchResize`** con `ResizeObserver` + debounce 120ms
- ✅ **Pipeline de actualización** en Python (`update_dashboard_data.py`) — tiene versionado
- ✅ **Fuente citada por chart** (en `chart-block .head .source`)
- ✅ **Byline con regla hard aplicada** (sin títulos universitarios)

---

## Lo que falta — para llegar al "Atlas level"

### Crítico (no se puede publicar sin esto)
1. **Datos centralizados en `data/*.json` con provenance** — hoy todo está en `js/data.js` como arrays. Sin metadata de fuente, URL, fecha de extracción, cobertura. Cualquier revisor serio exige trazabilidad.
2. **Endnotes públicas con lista de fuentes primarias** — el footer dice "CEN, CNE, SEC, Minenergía..." pero falta la lista curada con URLs, fechas de acceso, y rol específico de cada fuente en el análisis.
3. **Favicon + OG image + JSON-LD** — sin esto, el link se ve feo en LinkedIn/X y no aparece en Google Scholar.
4. **Print stylesheet** — el informe se imprime mal (queda el nav, los filtros, el tooltip).
5. **`docs/changelog.md`** — no hay historial de versiones. Cualquier fork o mantenedor futuro queda a ciegas.

### Importante (visibilidad / profesionalización)
6. **`docs/metodologia.md`** — la metodología de forecast está dispersa en el README. Debería estar en un doc dedicado y enlazable.
7. **`docs/plan_actualizacion.md`** — el pipeline Python existe pero no hay cadencia documentada por fuente.
8. **Portafolio link visible** — `mortizcoilla.vercel.app/` no aparece en el dashboard. Por la regla hard del usuario debe haber un link discreto pero presente.
9. **Byline: agregar botón Portafolio** — el byline tiene solo 3 botones. Atlas_Mercado_Electrico consolidó la referencia al portafolio en un callout discreto. Aquí habría que decidir el patrón (callout o 4to botón).
10. **Eliminada referencia a "el estudio en MD"** que aparece en §10 del internal — el callout final dice "bajar el estudio completo en Markdown" lo que sugiere que existe, pero el repo no lo incluye. Hay que sacar la promesa o cumplirla.

### Mejora continua (refinamiento)
11. **Verificación NaN automatizada** — script que itere los SVG y reporte atributos numéricos `NaN`. SVG no avisa; solo se cae silencioso.
12. **Axis titles en todos los charts** — algunos los tienen, otros no.
13. **Leyenda unificada** — el chart-mape tiene 6 items en la leyenda (origen + familia), separados por dominio. Atlas_Mercado_Electrico consolidó la leyenda en chips unificados.
14. **Roman numerals para secciones** — actualmente usa arábigos (`01`, `02`...). Atlas_Mercado_Electrico adoptó romanos. Pero este dashboard es más técnico-modern — vale discutir si la consistencia es más importante que la identidad propia.
15. **OG preview generado** — imagen 1200×630 coherente con el diseño, con `src/build_og_preview.py`.

---

## Lo que sobra / se puede comprimir

- **`js/data.js.bak-*`** (2 archivos): backups locales. `.gitignore` ya los cubre, pero están en el working tree. **Limpieza hecha**.
- **`package.json` con `npx http-server` y `npx live-server`**: no hay `node_modules` ni lock. Útil para arrancar sin Python, pero no es crítico. Mantener.
- **Tabla de "Disponibilidad de datos clave"** en §4: muy densa, podría comprimirse en una matriz visual (heatmap de estado × fuente).
- **Card "Próximo paso concreto" en §10** (internal): se duplica con el callout final. Consolidar.

---

## Lo que está mal (bugs / inconsistencias)

| # | Severidad | Problema | Acción |
|---|-----------|----------|--------|
| 1 | media | `dashboard-internal.html` no tiene `og:` ni favicon, pero se abre en local — al hacer screenshots con DevTools se ve sin identidad. | Agregar meta og al internal también (sin publicar) |
| 2 | baja | El footer del public dice "Estudio técnico sobre demanda eléctrica residencial en Chile" sin署名. El del internal tiene "© 2026 Miguel Ortiz C." Hay inconsistencia. | Unificar: ambos con "Miguel Ortiz C." + byline con 3 botones |
| 3 | baja | El hero dice "Tiempo de lectura: 12 min" pero el internal tiene 3 secciones más — ¿también 12 min? Probablemente no. | Sacar tiempo de lectura o calcularlo por sección |
| 4 | baja | La sección §10 (internal) promete "bajar el estudio completo en Markdown (12 secciones, 4 apéndices, ~230 KB) y el notebook de baseline" — el repo no incluye ninguno. | Sacar la promesa o cumplirla |
| 5 | baja | CSS tiene 1.567 líneas sin print stylesheet — al imprimir queda todo el nav, los filtros, etc. | Agregar `@media print` block (~80 líneas) |
| 6 | baja | El `console.info` en `main.js:25` está bien, pero un par de `chart-*.js` podrían tener `console.log` de debug olvidados. | Auditar |
| 7 | muy baja | El byline del hero dice "Miguel Ortiz C." pero el footer del internal dice "© 2026 Miguel Ortiz C." — formato inconsistente. | Unificar |

---

## Datos que habría que conseguir (no están en el repo)

Para llegar a "Atlas level" con provenance completa, idealmente habría que:

1. **Demanda SEN horaria 2010–2025** — desde CEN API SIP o desde reportes anuales descargados.
2. **Distribución de clientes por comuna y distribuidora** — desde CNE Energía Abierta.
3. **Penetración AC por GSE / nivel socioeconómico** — desde Ministerio de Energía o estudios ad-hoc.
4. **Datos Net Billing con detalle mensual y por región** — desde CNE Reporte ERNC.
5. **BEV parque acumulado por región** — desde ANAC.
6. **Datos meteorológicos grillados CR2MET v2.5** — para features de modelos (no para el dashboard).
7. **Referencias bibliográficas de los 11 estudios del MAPE_DATA** — validar que cada `ref` apunta a un paper real con DOI o arXiv ID.

Los datos de `data.js` actual son **suficientes para el dashboard actual**, pero falta la trazabilidad. **El esfuerzo de "Atlas level" es 80% metadata y 20% contenido nuevo.**

---

## Plan propuesto — en 3 olas

### Ola 1 · Cimientos (3-4 h, alta densidad)
> Trazabilidad y polish editorial básico. Sin cambios visuales fuertes.

- Crear `data/*.json` con provenance (fuente, URL, fecha de extracción, cobertura) — 6-7 archivos
- Eliminar `data.js` o reducirlo a un módulo que solo importa los JSON
- `docs/changelog.md` v0.1.0 con la historia
- `docs/metodologia.md` v0.1.0
- `docs/plan_actualizacion.md` v0.1.0
- Unificar footer (public + internal) con "Miguel Ortiz C." + 3 botones
- Sacar promesa rota de "bajar el estudio en MD" del internal
- Limpiar `console.log` de debug en charts (auditar)

### Ola 2 · Visibilidad pública (2-3 h)
> Que se pueda compartir en LinkedIn/X y se imprima bien.

- `favicon.svg` con icono temático (rayo, medidor, o número del peak)
- `og-preview.png` (1200×630) + `src/build_og_preview.py`
- JSON-LD `Article` estructurado
- Twitter Card
- Endnotes públicas con lista curada de fuentes
- Print stylesheet
- Consolidar la referencia al portafolio (`mortizcoilla.vercel.app/`) — callout o botón, decidir

### Ola 3 · Refinamiento (2-3 h, opcional)
> Pulir lo que ya está.

- Verificación NaN automatizada (`src/verify_charts.py` con Playwright)
- Axis titles faltantes en charts
- Leyenda unificada en chart-mape
- Quitar tiempo de lectura del hero o calcularlo
- Captura responsive (1440/1100/960/768/480) + verificación visual
- Tag `v0.2.0` en git
- Release notes

### Lo que NO recomiendo hacer
- **Rediseño visual completo** (cambiar Outfit → Fraunces, agregar folio rotado, romano). El diseño actual es coherente y sofisticado. Cambiarlo a "edición impresa" lo haría competir visualmente con Atlas_Mercado_Electrico, cuando este dashboard tiene su propia identidad (técnica-modern). El sistema de tokens ya está refinado.
- **Tabla de disponibilidad de datos → heatmap**. La tabla actual es clara. Un heatmap sería más visual pero menos informativo (no muestra granularidad ni cobertura en una sola vista).
- **Migrar a `data/*.json` fetch desde el HTML** (estilo Atlas_Mercado_Electrico). Este proyecto usa ES modules con `import` — es más rápido y limpio. Solo falta agregar provenance.

---

## Riesgos y dependencias

- **Sin conexión a internet** el script `src/build_og_preview.py` no puede descargar fuentes. Asumimos que el usuario tiene internet.
- **La vista dual `index.html` + `dashboard-internal.html`** requiere duplicar cambios estructurales. Cualquier edit a `<head>`, CSS imports, o `<script>` tags debe hacerse en ambos. La refactorización a un solo `index.html` con secciones colapsables se puede hacer pero NO es prioritaria.
- **`scripts/update_dashboard_data.py`** no está en el README ni documentado. Es una pieza valiosa (32 KB) que debería estar en `docs/`. Asumimos que es funcional.

---

## Conclusión

El dashboard está en un nivel **muy bueno** (8/10 en términos de producto y contenido). Las brechas hacia "Atlas level" (10/10) son:
- **Trazabilidad de datos** (la más crítica — sin esto no es publicable como paper)
- **Documentación interna** (changelog, metodología, plan)
- **Metadata social** (OG, favicon, JSON-LD)
- **Print stylesheet** (detalle de calidad editorial)

No hace falta rediseño visual. La identidad actual (warm cream + verde profundo + Outfit sans) es coherente y profesional.

**Recomendación**: ejecutar Ola 1 + Ola 2 en este turno. Ola 3 la dejamos para después del primer deploy público.

---

*Mantenedor: Miguel Ortiz C. · Estructura de auditoría inspirada en la Fase 0 del prompt `PROMPT_para_informes_de_mercado.md`.*
