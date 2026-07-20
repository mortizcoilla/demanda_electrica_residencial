# scripts/ — Automatización de datos del dashboard

Scripts auxiliares para mantener `js/data.js` sincronizado con las últimas
cifras disponibles de fuentes públicas chilenas.

## `update_dashboard_data.py`

Consulta CNE, ANAC y CEN, y reescribe los arrays de tiempo de
`js/data.js` (más los strings numéricos en los HTML) con los valores
más recientes.

### Instalación

```bash
pip install -r scripts/requirements.txt
```

### Uso básico

```bash
# Actualizar todo (consulta red, modifica data.js y los HTML)
python scripts/update_dashboard_data.py

# Solo previsualizar qué cambiaría
python scripts/update_dashboard_data.py --dry-run

# Solo net billing y BEV
python scripts/update_dashboard_data.py --only=netbilling,bev

# Forzar un año específico
python scripts/update_dashboard_data.py --year=2026

# Sin cache (reconsulta las fuentes aunque haya cache del día)
python scripts/update_dashboard_data.py --no-cache
```

### Ejecución mensual sugerida

Primer lunes del mes, vía cron / Task Scheduler:

```cron
0 9 1 * * cd /path/to/repo && python scripts/update_dashboard_data.py
```

### Salida esperada (caso feliz)

```
[INFO] ============================================================
[INFO] Actualizando dashboard — 2026-07-20 10:56
[INFO] ============================================================
[INFO] netbilling: consultando CNE Energía Abierta…
[INFO] netbilling: 41,238 instalaciones, 489.2 MW a 06/2026
[INFO] bev: consultando ANAC…
[INFO] bev: 6,840 unidades vendidas en 2026
[INFO] peak 2026: consultando CEN…
[INFO] peak 2026: 12,580 MWh/h en mes 1 (Verano)
[INFO] data.js escrito: js/data.js
[INFO] html actualizados: 2 archivo(s)

============================================================
RESUMEN
============================================================
  [OK]      NET_BILLING: 39.6 → 41.2 miles (a 06/2026)
  [OK]      BEV_SOLD: 6500 → 6840 unidades (2026)
  [OK]      PEAK_DEMAND_DATA: año 2026: 12400 → 12580 MWh/h (Verano)
  [SKIP]    sector: fuente no accesible
```

### Salida esperada (caso degradado)

Si una o más fuentes no responden, el script continúa con las demás
y reporta WARN sin abortar:

```
[WARNING] netbilling: ninguna URL respondió
[WARNING] netbilling: parseo falló (JSONDecodeError: ...)
[INFO] bev: 6,840 unidades vendidas en 2026
...

  [OK]      BEV_SOLD: 6500 → 6840 unidades (2026)
  [SKIP]    netbilling: fuente no accesible
```

### Detección de outliers

Si el valor nuevo difiere más de 50% del anterior (por ejemplo, un cambio
de política que duplica el parque de net billing de un mes a otro), el
script pregunta antes de escribir:

```
[WARNING] NET_BILLING: cambio relativo 87% (39.6 → 74.0)
  ¿Aplicar 74.0? (y/N):
```

Responder `n` (o Enter) conserva el valor actual.

### ¿Por qué no se automatiza 100%?

Las APIs chilenas cambian seguido (CKAN de datos.energia.gob.cl se ha
movido 3 veces desde 2023; ANAC cambió el formato de su reporte en 2024).
El script tiene **2-3 URLs alternativas por fuente** y documenta los
supuestos de parseo en comentarios. Si todas las URLs fallan, el script
reporta WARN y deja los datos como están — la intervención manual es
preferible a un valor inventado.

Para auditar lo que está pasando: `python scripts/update_dashboard_data.py -v`.

### Cache

Las respuestas exitosas se guardan en `scripts/.cache/<fuente>-<YYYYMMDD>.json`
durante 24h. La segunda corrida del mismo día usa cache y termina en
<1 segundo. Usa `--no-cache` para forzar una reconsulta.

### Archivos modificados

- `js/data.js` — siempre (cuando hay cambios reales)
- `index.html` y `dashboard-internal.html` — strings numéricos del card
  de Net Billing (§3), BEV (§3) y peak 2024 (§2 + hero KPI)
- `js/data.js.bak-<timestamp>` — backup automático antes de cada escritura

**NO** se tocan: charts, CSS, otros archivos del repo.
