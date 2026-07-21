# Plan de actualización — Dashboard Demanda Eléctrica Residencial Chile

> Cadencia de actualización por fuente primaria. Tiempos estimados de re-trabajo.
> Última revisión: 21 de julio de 2026.

## Resumen ejecutivo

El dashboard tiene **8 fuentes primarias** que se actualizan con cadencias distintas. La cadencia mínima es **trimestral** (CEN publica operación real cada mes, CNE publica precios trimestralmente). El costo de mantener el dashboard al día es bajo si se automatiza la extracción, alto si se hace a mano.

## Cadencia por fuente

| Fuente | Dataset afectado | Cadencia primaria | Tiempo estimado de re-trabajo | Notas |
|---|---|---|---|---|
| **CEN** — Reporte anual art. 72-15 | `composicion_sen.json` | Anual (julio) | 1–2 h | Una vez al año. Esperar publicación oficial. |
| **CEN** — Gráficos de operación real | `peak_demanda_sen.json` | Diaria (peak nuevo instantáneo) | 30 min cuando hay peak nuevo | El peak del SEN cambia 1–2 veces al año (verano e invierno). Actualizar el `datos` con el nuevo valor. |
| **Empresas Eléctricas A.G.** | `distribuidoras.json` | Anual (diciembre) | 2–3 h | Anuario con detalle de clientes por distribuidora. |
| **CNE — Energía Abierta** | `distribuidoras.json`, `kpis_hero.json` (parcial) | Mensual | 1 h | Datos de facturación y empalmes. No siempre actualiza la composición de clientes. |
| **Minenergía — Encuesta residencial** | `vectores_cambio.json` (AC%) | Cada 4–5 años | 1 h cuando publica | Última encuesta pública conocida: 2018. El siguiente estudio puede demorar. |
| **CNE — Reporte ERNC** | `vectores_cambio.json` (Net Billing) | Mensual | 30 min | Datos de Net Billing se actualizan mensualmente. La serie se extiende en `values[]` de `series.net_billing`. |
| **ANAC** | `vectores_cambio.json` (BEV) | Mensual | 30 min | Ventas de vehículos. Revisar el anuario anual en diciembre. |
| **Literatura revisada por pares** | `benchmarks_mape.json` | Continua | 1–2 h por paper nuevo | Cuando aparece un paper LATAM nuevo, agregarlo a `datos[]` con su `ref`. |

## Procedimiento de release

### Trimestral (mínimo)

- Revisar si CEN publicó nuevo peak del SEN.
- Revisar CNE Reporte ERNC para nuevas instalaciones Net Billing.
- Revisar ANAC para ventas BEV del trimestre.
- **Tiempo total**: 1–2 h.

### Anual (julio–agosto)

- Actualizar composición SEN con el reporte anual del CEN.
- Actualizar Anuario Empresas Eléctricas A.G. con datos de clientes.
- Revisar literatura revisada por pares: agregar 1–3 papers nuevos a `benchmarks_mape.json`.
- Actualizar `fecha_extraccion` de cada dataset modificado.
- **Tiempo total**: 4–6 h, idealmente concentrado en 1 sesión.

### Por shock

Si ocurre un evento extraordinario (ola de calor extrema, cambio tarifario MPC/FET, decreto nuevo), considerar:
- ¿El peak del SEN se superó? Actualizar `peak_demanda_sen.json`.
- ¿Se publicó un nuevo decreto tarifario? Documentar en `kpis_hero.json` con `subnote` actualizado.
- **Tiempo total**: 1 h.

## Automatización (pendiente)

El script `scripts/update_dashboard_data.py` (32 KB) ya existe y automatiza parte del trabajo. Pendiente:
- Documentar el pipeline en un README dedicado (`scripts/README.md`).
- Configurar credenciales y rutas en `~/.config/`.
- Validar que las URLs de las fuentes siguen activas (algunas cambian).
- Agregar tests unitarios sobre los JSONs (schema validation).

## Calendario sugerido 2026–2027

| Trimestre | Acción | Entregable |
|---|---|---|
| Q3 2026 (jul–sep) | v0.2.0 — Atlas level (este release) | Publicación inicial con provenance completa |
| Q4 2026 (oct–dic) | Revisión trimestral + actualización Anuario | v0.3.0 con clientes 2023 actualizados |
| Q1 2027 (ene–mar) | Revisión literatura + nueva ola de calor | v0.4.0 con benchmarks actualizados |
| Q2 2027 (abr–jun) | Revisión trimestral | v0.5.0 |
| Q3 2027 (jul–sep) | **Release anual** — peak nuevo + composición CEN | v1.0.0 (release estable) |

## Dependencias externas

- **CEN publica reportes con delay**: el reporte anual art. 72-15 sale en julio con datos del año anterior.
- **CNE tarda en consolidar**: la información de empalmes y Net Billing tiene lag de 2–3 meses.
- **Anuario ANAC**: diciembre con cierre del año.
- **Papers LATAM**: frecuencia impredecible. Revisar Google Scholar mensualmente con alertas: "load forecasting Chile", "residential demand LATAM", "short-term load forecasting".

## Riesgos

- **URLs de fuentes cambian**: los `url_fuente` en los JSONs pueden romperse. Mitigación: validar URLs trimestralmente.
- **Cambio de metodología del regulador**: si el CEN cambia cómo reporta la composición SEN, hay que ajustar las notas metodológicas y posiblemente el shape de los datos.
- **Discontinuidad de series**: si una fuente deja de publicar, hay que marcar el dataset como `estado: discontinuo` y dejar de actualizarlo.

## Cómo ayudar

Si encuentras:
- Un paper LATAM nuevo → PR con el JSON actualizado y la `ref` completa.
- Un error en un dato → issue con la fuente que lo contradice.
- Un chart que no se ve bien en tu navegador → issue con screenshot + browser + viewport size.

---

*Mantenedor: Miguel Ortiz C. · Calendario tentativo 2026–2027.*
