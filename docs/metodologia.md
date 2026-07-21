# Metodología — Dashboard Demanda Eléctrica Residencial Chile

> Cómo se construyó cada dataset, qué decisiones de scope se tomaron y qué se excluyó. Documento de referencia para mantenedores y revisores.

## 1. Alcance y límites

**Qué es el dashboard**: una visualización analítica del estudio integrado sobre predicción de demanda eléctrica residencial en Chile (julio 2026). Es un producto editorial, no un sistema de inferencia. Los datos que muestra son los insumos del modelo, no la salida del modelo.

**Qué NO es**: no es un sistema de forecasting en tiempo real, no consume APIs del CEN, no permite hacer predicciones, no es una réplica de la operación real del SEN.

## 2. Estructura del dashboard

- **Vista pública** (`index.html`): 7 secciones. Se despliega en GitHub Pages / Vercel / Netlify.
- **Vista interna** (`dashboard-internal.html`): 7 secciones + §8 Recomendación, §9 Hoja de ruta 12 meses, §10 Cierre. **NO se despliega** (está en `.gitignore`). Mantiene en local las recomendaciones metodológicas y la hoja de ruta.
- Las dos vistas comparten el mismo CSS/JS/data. Cualquier edit a `css/`, `js/`, o `data/` se refleja en ambas automáticamente.

## 3. Capa de datos — `data/*.json`

Cada dataset es un archivo JSON con dos bloques:

```json
{
  "metadata": {
    "titulo": "...",
    "descripcion": "...",
    "unidad": "...",
    "fuente_primaria": "...",
    "documento_fuente": "...",
    "url_fuente": "...",
    "fecha_extraccion": "2026-07-15",
    "cobertura_temporal": "...",
    "cobertura_geografica": "...",
    "nota_metodologica": "..."
  },
  "datos": [ ... ]
}
```

### 7 datasets

| Archivo | Sección | Unidad | Última extracción |
|---|---|---|---|
| `composicion_sen.json`      | §1  | % retiros         | 2026-07-15 |
| `distribuidoras.json`       | §1  | clientes          | 2026-07-10 |
| `peak_demanda_sen.json`     | §2  | MWh/h             | 2026-07-12 |
| `vectores_cambio.json`      | §3  | mixta             | 2026-06-25 |
| `benchmarks_mape.json`      | §5  | MAPE (%)          | 2026-07-08 |
| `predictores.json`          | §7  | posición (0–1)    | 2026-07-20 |
| `kpis_hero.json`            | hero| mixta             | 2026-07-15 |

### Procedimiento de actualización

1. Identificar el dataset a actualizar (ej. `peak_demanda_sen.json` cuando el CEN publica un nuevo peak).
2. Descargar la fuente primaria desde la `url_fuente` del metadata.
3. Extraer el valor nuevo con `pdfplumber`, `tabula`, o el portal de datos abiertos correspondiente.
4. Actualizar el campo `datos` del JSON.
5. Actualizar `fecha_extraccion` en el metadata.
6. Si cambia la fuente primaria o el documento, actualizar `fuente_primaria`, `documento_fuente` y `url_fuente`.
7. Commit con mensaje `data(<dataset>): <descripción del cambio>`.
8. Verificar visualmente el chart correspondiente.
9. Actualizar `docs/plan_actualizacion.md` si cambia la cadencia.

## 4. Charts D3.js — `js/charts/*.js`

Cada chart es un módulo ES que:
- Importa utilities de `../utils.js` (paleta C, tooltip, fmt, watchResize, breakpoints).
- Recibe `DATA` como parámetro (no importa de `data.js` directamente).
- Se inicializa con `initXxxChart(DATA)` desde `main.js`.
- Se re-renderiza automáticamente al cambiar el ancho del contenedor (`watchResize` con debounce 120ms).
- Tiene tooltip en hover con datos relevantes + fuente.
- **No tiene NaN**: cada `attr` numérico se valida con `chartWidth()` antes de aplicar.

### Patrón de chart

```js
import { C, showTip, hideTip, watchResize, chartWidth, isCompact, isTablet } from '../utils.js';

export function initXxxChart(DATA) {
  const svg = d3.select('#chart-xxx');
  const container = svg.node().parentElement;
  const data = DATA.xxx.datos;   // ← siempre desde DATA, no import

  function render() {
    const W = chartWidth(container, fallback);
    // ... usar W, no window.innerWidth
  }

  render();
  const cleanup = watchResize(container, render);
  window.addEventListener('beforeunload', () => cleanup && cleanup(), { once: true });
}
```

### Decisiones de diseño

- **viewBox responsive, no width fijo**: cada chart usa `viewBox="0 0 W H"` con `preserveAspectRatio="xMidYMid meet"`. Esto permite que el chart se escale sin perder proporción.
- **Breakpoints mobile/tablet/desktop**: compacto (< 768px) ajusta márgenes, oculta axis labels, mueve leyenda.
- **Filtros**: solo en 3 charts (distribuidoras, drivers, mape). No en todos.
- **Animaciones**: transiciones de 500–700ms en carga inicial; 120ms en hover. Sin `transition: all`.
- **Tooltip sobrio**: fondo tinta `#14171e`, texto crema, sin blur, sin border-radius exagerado.

## 5. Sistema de diseño — `css/styles.css`

- **1567 líneas** con sistema de tokens CSS custom properties.
- **Paleta cálida**: bg `#faf9f6` (paper), primary verde profundo `#0a5847`,
  accent terracota `#b0663f`, supporting indigo/amber/rose.
- **Tipografía**: Outfit (sans) + JetBrains Mono (mono). Sin serif display.
- **Sombras sutiles**: 5 niveles xs/sm/md/lg/xl.
- **Espaciado**: grid de 4px, escala 4/8/12/16/24/32/48/64/96.
- **Sin frameworks**: CSS puro, sin Tailwind, sin Bootstrap.
- **Tokens en JS**: `js/utils.js` exporta la paleta `C` que espeja los tokens CSS.

## 6. Byline y reglas de presentación del autor

**Regla hard**: el autor aparece como "Miguel Ortiz C." + botones de contacto, sin títulos universitarios, en el hero y en el footer de ambas vistas.

**Botones del byline (3)**: LinkedIn, Email, WhatsApp. Sin Portafolio en el byline (consolidado en el callout "Más del autor" del footer).

**Por qué 3 y no 4**: el callout editorial al final del documento (con el link a `mortizcoilla.vercel.app/`) ya cumple la función de "ver más trabajo" sin saturar el byline. Es el mismo patrón que Atlas del Mercado Eléctrico Mayorista.

## 7. Lo que se excluyó y por qué

- **Perfiles de carga BT1 por cliente o subestación**: no son públicos. La CNE publica facturación mensual por comuna, pero no perfiles horarios individuales. Cualquier implementación que los use requiere convenio con la distribuidora.
- **Modelo de forecasting ejecutado en el dashboard**: el dashboard muestra los **insumos** (datos, benchmarks, predictores), no la salida del modelo. La ejecución del modelo es responsabilidad del equipo que use este dashboard como referencia.
- **Datos macro de actividad económica en tiempo real**: el dashboard es un snapshot editorial, no un monitor en vivo. La CNE, el Banco Central y el INE tienen APIs para series de tiempo si se necesita.
- **Smart meter data (15-min por cliente BT1)**: solo Enel Distribución las tiene, y publica una muestra agregada. No es razonable incluirlas en un dashboard público.

## 8. Pipeline de actualización — `scripts/update_dashboard_data.py`

Script de 32 KB que automatiza:
- Descarga de datasets desde CEN, CNE, SEC, Minenergía.
- Limpieza y normalización.
- Escritura a `data/*.json` con metadata actualizada.
- Logging de cambios.

**Estado**: funcional pero no documentado. Asume credenciales y rutas en `~/.config/`. **No se ejecuta automáticamente**; se corre bajo demanda cuando hay nueva data.

**Pendiente**: documentar el pipeline en un README dedicado. Ver `docs/plan_actualizacion.md` para la cadencia de uso.

## 9. Verificación antes de release

Antes de marcar un cambio como release:

1. `git status` limpio.
2. `python -m http.server 8000` y abrir `http://localhost:8000/index.html` en navegador.
3. Recorrer las 7 secciones. Verificar que cada chart renderiza sin NaN.
4. Probar los filtros (distribuidoras, drivers, mape).
5. Probar el menú hamburguesa en mobile (< 768px).
6. Verificar que la vista interna abre en local (`dashboard-internal.html`).
7. Vista de impresión (Ctrl+P): confirmar que oculta nav/filtros.
8. Lighthouse en Chrome DevTools: Performance > 90, Accessibility > 90.
9. Commit + push con mensaje en presente.

## 10. Referencias bibliográficas

La tabla de benchmarks MAPE en §5 cita 11 estudios. Las referencias completas se mantienen en el paper original (no incluido en el repo). Para agregar una referencia nueva, agregar fila a `data/benchmarks_mape.json` con:
- `study`: nombre descriptivo
- `method`: método exacto
- `mape`: valor publicado
- `horiz`: horizonte temporal
- `type`: classical/ml/deep/ensemble
- `latam`: true si es Chile/LATAM
- `ref`: cita corta (autor + año)

---

*Mantenedor: Miguel Ortiz C. · Última revisión: 21 de julio de 2026.*
