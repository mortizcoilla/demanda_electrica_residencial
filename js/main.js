// ===========================================================
// main.js — Entry point: inicializa todos los charts y controles
// ===========================================================

import { initSectorChart }        from './charts/sector.js';
import { initDistribuidorasChart } from './charts/distribuidoras.js';
import { initDemandChart }         from './charts/demand.js';
import { initDriversChart }        from './charts/drivers.js';
import { initMapeChart }           from './charts/mape.js';
import { initCausalChart }         from './charts/causal.js';
import { initNavigation }          from './controls.js';

document.addEventListener('DOMContentLoaded', () => {
  // charts
  initSectorChart();
  initDistribuidorasChart();
  initDemandChart();
  initDriversChart();
  initMapeChart();
  initCausalChart();

  // controls
  initNavigation();

  console.info('[dashboard] Todos los charts y controles inicializados.');
});
