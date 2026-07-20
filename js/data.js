// ===========================================================
// data.js — Datos del dashboard
// Todas las cifras vienen del estudio integrado y son trazables
// a sus fuentes originales (ver Apéndice B del estudio).
// ===========================================================

/** Composición de la demanda SEN 2024 (% de retiros) */
export const SECTOR_DATA = [
  { label: 'Residencial regulado',        value: 30, color: '#14a37f' },
  { label: 'Comercial / pequeño industrial', value: 24, color: '#475569' },
  { label: 'Industrial y minero libre',     value: 42, color: '#c97b3f' },
  { label: 'Otros / autogeneración neta',   value:  4, color: '#d4d4d0' }
];

/** Clientes regulados por distribuidora. `zones` indica en qué macrozonas opera. */
export const DISTRIBUIDORAS_DATA = [
  { name: 'CGE Distribución + filiales', value: 3362294, region: 'XV, I, II, IV, V (sur RM), VI, VII, VIII, IX, XII', zones: ['norte','centro','sur','austral'] },
  { name: 'Enel Distribución Chile',     value: 2162606, region: 'Región Metropolitana (33 comunas)',                zones: ['centro'] },
  { name: 'Grupo Saesa',                 value: 1054635, region: 'VIII, XVI, IX, X, XI, XIV',                          zones: ['sur','austral'] },
  { name: 'Chilquinta + filiales',       value:  831372, region: 'V, VII, VIII',                                       zones: ['centro','sur'] },
  { name: 'EEPA (Puente Alto)',          value:   65009, region: 'Comuna de Puente Alto (RM)',                        zones: ['centro'] },
  { name: 'Otras + cooperativas',        value:  102000, region: 'VII, VIII, X principalmente',                        zones: ['sur'] }
];

/** Demanda máxima horaria del SEN 2018-2025 (MWh/h) y estacionalidad. */
export const PEAK_DEMAND_DATA = [
  { y: 2018, val: 10700, season: 'Invierno', note: '10.700 MWh/h' },
  { y: 2019, val: 10920, season: 'Invierno', note: '10.920 MWh/h' },
  { y: 2020, val: 10500, season: 'Invierno', note: '10.500 MWh/h' },
  { y: 2021, val: 11100, season: 'Invierno', note: '11.100 MWh/h' },
  { y: 2022, val: 11500, season: 'Verano',   note: '11.500 MWh/h' },
  { y: 2023, val: 11820, season: 'Verano',   note: '11.820 MWh/h' },
  { y: 2024, val: 12190, season: 'Verano',   note: '12.190 MWh/h · 31-ene 16h' },
  { y: 2025, val: 12400, season: 'Verano',   note: '12.400 MWh/h (est.)' }
];

/** Drivers de cambio en la demanda residencial 2018-2025. */
export const DRIVERS_YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

/** AC residencial (% hogares) */
export const AC_PCT = [3.1, 3.6, 4.0, 4.5, 5.5, 6.8, 8.5, 10.0, 11.5];

/** Net Billing (instalaciones, en miles) */
export const NET_BILLING = [1.5, 3, 5, 9, 14, 20, 28, 35, 39.6];

/** BEV vendidos al año (unidades) */
export const BEV_SOLD = [50, 100, 200, 500, 1100, 1500, 4507, 5200, 6500];

/** Benchmarks de MAPE de modelos de forecasting (literatura revisada por pares). */
export const MAPE_DATA = [
  { study: 'Revisión sistemática Chile (137 estudios)', method: 'ARIMA / SARIMA',     mape: 3.21, horiz: 'mixto',    type: 'classical',  latam: true,  ref: 'Vivas et al. 2020' },
  { study: 'Prophet vs LSTM — Colombia (Quindío)',      method: 'Prophet',            mape: 4.10, horiz: '24 h',     type: 'classical',  latam: true,  ref: 'Vargas-Forero et al. 2024' },
  { study: 'Prophet vs LSTM — Colombia (Quindío)',      method: 'LSTM',               mape: 4.90, horiz: '24 h',     type: 'deep',       latam: true,  ref: 'Vargas-Forero et al. 2024' },
  { study: 'LSTM clima + calendario — Argentina (CBA)', method: 'LSTM',               mape: 3.20, horiz: 'horario',  type: 'deep',       latam: true,  ref: 'arXiv 2509.19374, 2024' },
  { study: 'N-BEATS horario — Rumania (proxy)',         method: 'N-BEATS',            mape: 2.32, horiz: 'horario',  type: 'deep',       latam: false, ref: 'Romanian J. Econ. 2025' },
  { study: 'SARIMA horario — Rumania (proxy)',          method: 'SARIMA',             mape: 3.63, horiz: 'horario',  type: 'classical',  latam: false, ref: 'Romanian J. Econ. 2025' },
  { study: 'ExtraTrees ensamble — Uruguay',             method: 'ExtraTrees ensemble',mape: 5.17, horiz: 'day-ahead',type: 'ensemble',   latam: true,  ref: 'Porteiro et al. 2022' },
  { study: 'ExtraTrees ensamble — Uruguay',             method: 'ExtraTrees (subest.)',mape: 9.09, horiz: 'day-ahead',type: 'ensemble', latam: true,  ref: 'Porteiro et al. 2022' },
  { study: 'LSTM con ventana 2h — Melbourne',           method: 'LSTM (R² 0.878)',    mape: 6.20, horiz: 'horario',  type: 'deep',       latam: false, ref: 'arXiv 2604.12304, 2026' },
  { study: 'XGBoost + calendar — California',           method: 'XGBoost',            mape: 2.80, horiz: '24 h',     type: 'ml',         latam: false, ref: 'IEEE 2023' },
  { study: 'LightGBM + lags — España',                  method: 'LightGBM',           mape: 3.50, horiz: 'horario',  type: 'ml',         latam: false, ref: 'Applied Energy 2022' }
];

/** Predictores posicionados en el cuadrante estabilidad × horizonte. */
export const PREDICTOR_DATA = [
  { name: 'Temperatura / clima',          x: 0.20, y: 0.78, color: '#0d6b54', type: 'Físico',      note: 'Estable, alta señal' },
  { name: 'Calendario (hora, día, mes)', x: 0.18, y: 0.85, color: '#0d6b54', type: 'Temporal',    note: 'Determinista' },
  { name: 'Feriados y vacaciones',        x: 0.30, y: 0.65, color: '#0d6b54', type: 'Temporal',    note: 'Catálogo fijo' },
  { name: 'Humedad / sensación térmica',  x: 0.25, y: 0.55, color: '#0d6b54', type: 'Físico',      note: 'Aumenta sensibilidad' },
  { name: 'Radiación solar',              x: 0.35, y: 0.40, color: '#0d6b54', type: 'Físico',      note: 'Modula FV' },
  { name: 'Calidad de vivienda (CEV)',    x: 0.65, y: 0.20, color: '#c97b3f', type: 'Estructural', note: 'Cambio lento' },
  { name: 'Penetración FV por comuna',    x: 0.62, y: 0.32, color: '#c97b3f', type: 'Tecnológico', note: 'Crece rápido' },
  { name: 'Parque EV acumulado',          x: 0.72, y: 0.28, color: '#c97b3f', type: 'Tecnológico', note: 'Tendencia fuerte' },
  { name: 'Aire acondicionado',           x: 0.55, y: 0.38, color: '#c97b3f', type: 'Tecnológico', note: 'Penetración creciente' },
  { name: 'Tarifa (PEC/MPC/FET)',         x: 0.70, y: 0.55, color: '#4f5dde', type: 'Regulatorio', note: 'Salta en escalones' },
  { name: 'IPC / IMACEC',                 x: 0.55, y: 0.70, color: '#475569', type: 'Macro',       note: 'Estacional' },
  { name: 'Macrozona térmica',            x: 0.30, y: 0.15, color: '#0d6b54', type: 'Geográfico',  note: 'Estructura fija' },
  { name: 'Renta del hogar',              x: 0.50, y: 0.10, color: '#c97b3f', type: 'Socioecon.',  note: 'Lento, regional' },
  { name: 'Elasticidad precio',           x: 0.68, y: 0.62, color: '#4f5dde', type: 'Conductual',  note: '−0.05 a −0.38 cp' },
  { name: 'Pandemia / crisis',            x: 0.78, y: 0.70, color: '#b85b5b', type: 'Shock',       note: 'Corto plazo, alta señal' }
];

/** KPIs del hero. */
export const HERO_KPIS = [
  { label: 'Demanda residencial del SEN', value: '~30',  unit: '%',       subnote: '≈ 30 TWh sobre 85 TWh totales en 2024', variant: 'default' },
  { label: 'Clientes regulados',          value: '7.31', unit: 'M',       subnote: 'de los cuales ≈ 90% son residenciales',   variant: 'alt' },
  { label: 'Peak SEN 2024',               value: '12,190', unit: 'MWh/h', subnote: '31 de enero a las 16 h, ola de calor',     variant: 'indigo' },
  { label: 'Proyección SEN 2043',         value: '134.5', unit: 'TWh',   subnote: 'CAGR 2.82% — CNE, 2023-2043',              variant: 'amber' }
];

/** Etiquetas de familia para la leyenda MAPE. */
export const MAPE_FAMILY_LABELS = {
  classical: 'Clásico',
  ml: 'ML',
  deep: 'Deep Learning',
  ensemble: 'Ensemble'
};

/** Colores de familia para MAPE. */
export const MAPE_FAMILY_COLORS = {
  classical: '#c97b3f',
  ml:        '#4f5dde',
  deep:      '#0d6b54',
  ensemble:  '#d49a1c'
};
