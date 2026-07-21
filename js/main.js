// ===========================================================
// main.js — Entry point: carga data/*.json y luego inicializa charts
// ===========================================================

import { loadAllData }            from './data.js';
import { initSectorChart }        from './charts/sector.js';
import { initDistribuidorasChart } from './charts/distribuidoras.js';
import { initDemandChart }         from './charts/demand.js';
import { initDriversChart }        from './charts/drivers.js';
import { initMapeChart }           from './charts/mape.js';
import { initCausalChart }         from './charts/causal.js';
import { initNavigation }          from './controls.js';

document.addEventListener('DOMContentLoaded', () => {
  loadAllData()
    .then(DATA => {
      // charts
      initSectorChart(DATA);
      initDistribuidorasChart(DATA);
      initDemandChart(DATA);
      initDriversChart(DATA);
      initMapeChart(DATA);
      initCausalChart(DATA);

      // controls (no requiere data)
      initNavigation();

      console.info('[dashboard] Todos los charts y controles inicializados.');
    })
    .catch(err => {
      console.error('[dashboard] Error cargando datasets:', err);
      document.body.insertAdjacentHTML('afterbegin',
        `<div style="background:#9c4f48;color:#fff;padding:12px 20px;font-family:'JetBrains Mono',monospace;font-size:13px;position:sticky;top:0;z-index:9999">
          ⚠ Error cargando datos: ${err.message}. Levanta el dashboard con un servidor local (python -m http.server) — el protocolo file:// bloquea fetch.
        </div>`
      );
    });
});
