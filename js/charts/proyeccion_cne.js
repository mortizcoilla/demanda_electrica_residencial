// ===========================================================
// charts/proyeccion_cne.js — Cono CNE 3 escenarios 2023-2043
// Visualización: line chart con banda de incertidumbre
//   - Histórico observado 2018-2024 (CEN)
//   - Proyección Medio (oficial) 2023-2043
//   - Proyección Alto 2023-2043
//   - Proyección Alto + H2V 2023-2043
//   - Drivers 2043: electromovilidad, calefacción, H2V
// Interacción: toggles para mostrar/ocultar cada serie.
// ===========================================================

import { C, fmt, showTip, hideTip, watchResize, chartWidth, isCompact, isTablet } from '../utils.js';

export function initProyeccionCneChart(DATA) {
  const svg = d3.select('#chart-cono-cne');
  const container = svg.node().parentElement;
  const D = DATA.proyeccion_cne;
  const data = D.proyeccion_medio;  // escenario base
  const historico = D.historico_observado;
  const escenarios = D.escenarios;
  const projAlto = D.proyeccion_alto;
  const projAltoH2v = D.proyeccion_alto_h2v;
  const drivers = D.drivers_2043;

  const SERIES = [
    { key: 'hist',  label: 'Observado',      color: '#14171e', sw: C.ink },
    { key: 'medio', label: 'Medio (oficial)', color: '#0a5847', sw: '#0a5847' },
    { key: 'alto',  label: 'Alto',            color: '#b0663f', sw: '#b0663f' },
    { key: 'h2v',   label: 'Alto + H2V',      color: '#4048b8', sw: '#4048b8' },
    { key: 'banda', label: 'Banda de incertidumbre', color: '#94a3b8', sw: '#94a3b8' }
  ];
  const visible = { hist: true, medio: true, alto: true, h2v: true, banda: true };

  // --- Toggles interactivos (se inyectan antes del svg, patrón ctrl-check) ---
  if (!document.getElementById('conoFilter')) {
    const row = document.createElement('div');
    row.className = 'chart-controls';
    row.setAttribute('data-chart', 'cono-cne');
    row.innerHTML =
      '<span class="ctrl-label">Mostrar series:</span>' +
      '<div class="ctrl-group" id="conoFilter">' +
      SERIES.map(s =>
        `<label class="ctrl-check" data-series="${s.key}"><span class="sw" style="background:${s.sw}"></span><input type="checkbox" checked />${s.label}</label>`
      ).join('') +
      '</div>';
    svg.node().insertAdjacentElement('beforebegin', row);
    document.querySelectorAll('#conoFilter .ctrl-check').forEach(label => {
      const cb = label.querySelector('input');
      const key = label.getAttribute('data-series');
      cb.addEventListener('change', () => {
        visible[key] = cb.checked;
        label.classList.toggle('off', !cb.checked);
        render();
      });
    });
  }

  function computeLayout() {
    const W = chartWidth(container, 980);
    const compact = isCompact(W);
    const tablet  = isTablet(W);
    const H = 460;
    // margin.right amplio en desktop para etiquetas de fin de línea
    const margin = compact
      ? { top: 30, right: 20, bottom: 60, left: 50 }
      : tablet
        ? { top: 30, right: 30, bottom: 60, left: 56 }
        : { top: 30, right: 96, bottom: 60, left: 60 };
    return { W, H, margin, innerW: W - margin.left - margin.right, innerH: H - margin.top - margin.bottom, compact, tablet };
  }

  function render() {
    const { W, H, margin, innerW, innerH, compact } = computeLayout();

    svg
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Eje X: años 2018-2043
    const xMin = 2018, xMax = 2043;
    const x = d3.scaleLinear().domain([xMin, xMax]).range([0, innerW]);
    // Eje Y: TWh, 0 a 210
    const yMax = 210;
    const y = d3.scaleLinear().domain([0, yMax]).range([innerH, 0]);

    const fsAxis = compact ? 10 : 11;
    const fsLabel = compact ? 10 : 11.5;
    const fsFoot = compact ? 9 : 10;

    // Grid
    g.append('g').selectAll('line')
      .data(y.ticks(7)).enter().append('line')
      .attr('x1', 0).attr('x2', innerW)
      .attr('y1', d => y(d)).attr('y2', d => y(d))
      .attr('stroke', C.lineSoft);

    // === Series derivadas del escenario Medio (interpolación lineal del factor) ===
    const factorAlto2043 = projAlto.factor_vs_medio_2043;
    const factorAltoH2v2043 = projAltoH2v.factor_vs_medio_2043;
    const bandData = data.map(d => {
      const t = (d.year - 2023) / (2043 - 2023);  // 0 a 1
      const medio = d.total_gwh / 1000;
      return {
        year: d.year,
        medio,
        alto:     medio * (1 + t * (factorAlto2043 - 1)),
        alto_h2v: medio * (1 + t * (factorAltoH2v2043 - 1))
      };
    });

    // === Banda de incertidumbre (Medio → Alto → Alto+H2V) ===
    if (visible.banda) {
      g.append('path').datum(bandData)
        .attr('d', d3.area().x(d => x(d.year)).y0(d => y(d.alto)).y1(d => y(d.alto_h2v)).curve(d3.curveMonotoneX))
        .attr('fill', '#4048b8').attr('opacity', 0.10);
      g.append('path').datum(bandData)
        .attr('d', d3.area().x(d => x(d.year)).y0(d => y(d.medio)).y1(d => y(d.alto)).curve(d3.curveMonotoneX))
        .attr('fill', '#b0663f').attr('opacity', 0.14);
    }

    // === Histórico observado 2018-2024 ===
    if (visible.hist) {
      const histData = historico.map(d => ({ year: d.year, val: d.valor_twh }));
      const histLine = d3.line().x(d => x(d.year)).y(d => y(d.val)).curve(d3.curveMonotoneX);
      g.append('path').datum(histData).attr('d', histLine)
        .attr('fill', 'none').attr('stroke', C.ink).attr('stroke-width', 2.5);
      g.selectAll('circle.hist').data(histData).enter().append('circle')
        .attr('class', 'hist')
        .attr('cx', d => x(d.year)).attr('cy', d => y(d.val))
        .attr('r', 4).attr('fill', C.ink).attr('stroke', '#fff').attr('stroke-width', 1.5)
        .on('mouseenter', (evt, d) => showTip(evt, `<strong>${d.year} (observado)</strong><br>${d.val.toFixed(1)} TWh`))
        .on('mousemove', evt => {
          d3.select('#tooltip')
            .style('left', (evt.clientX + 12) + 'px')
            .style('top', (evt.clientY - 12) + 'px');
        })
        .on('mouseleave', hideTip);
    }

    // === Proyección Medio (oficial) 2023-2043 ===
    if (visible.medio) {
      const medioData = data.map(d => ({ year: d.year, val: d.total_gwh / 1000 }));
      const medioLine = d3.line().x(d => x(d.year)).y(d => y(d.val)).curve(d3.curveMonotoneX);
      g.append('path').datum(medioData).attr('d', medioLine)
        .attr('fill', 'none').attr('stroke', '#0a5847').attr('stroke-width', 3);
      g.selectAll('circle.medio').data(medioData).enter().append('circle')
        .attr('class', 'medio')
        .attr('cx', d => x(d.year)).attr('cy', d => y(d.val))
        .attr('r', 3.5).attr('fill', '#0a5847').attr('stroke', '#fff').attr('stroke-width', 1.5)
        .on('mouseenter', (evt, d) => {
          const row = data.find(r => r.year === d.year);
          const reg = row.reg_gwh / 1000;
          const lib = row.libre_gwh / 1000;
          showTip(evt, `<strong>${d.year} — Escenario Medio</strong><br>Total: ${d.val.toFixed(1)} TWh<br>Reg: ${reg.toFixed(1)} · Libre: ${lib.toFixed(1)}`);
        })
        .on('mousemove', evt => {
          d3.select('#tooltip')
            .style('left', (evt.clientX + 12) + 'px')
            .style('top', (evt.clientY - 12) + 'px');
        })
        .on('mouseleave', hideTip);
    }

    // === Proyección Alto 2023-2043 ===
    if (visible.alto) {
      const altoData = bandData.map(d => ({ year: d.year, val: d.alto }));
      g.append('path').datum(altoData).attr('d', d3.line().x(d => x(d.year)).y(d => y(d.val)).curve(d3.curveMonotoneX))
        .attr('fill', 'none').attr('stroke', '#b0663f').attr('stroke-width', 2).attr('stroke-dasharray', '4,3');
    }

    // === Proyección Alto + H2V 2023-2043 ===
    if (visible.h2v) {
      const h2vData = bandData.map(d => ({ year: d.year, val: d.alto_h2v }));
      g.append('path').datum(h2vData).attr('d', d3.line().x(d => x(d.year)).y(d => y(d.val)).curve(d3.curveMonotoneX))
        .attr('fill', 'none').attr('stroke', '#4048b8').attr('stroke-width', 2).attr('stroke-dasharray', '4,3');
    }

    // === Etiquetas de fin de línea (solo desktop, con valores 2043) ===
    if (!compact && !isTablet(W)) {
      const last = bandData[bandData.length - 1];
      const ends = [];
      if (visible.medio) ends.push({ val: last.medio,     color: '#0a5847', label: 'Medio' });
      if (visible.alto)  ends.push({ val: last.alto,      color: '#b0663f', label: 'Alto' });
      if (visible.h2v)   ends.push({ val: last.alto_h2v,  color: '#4048b8', label: 'Alto+H2V' });
      const labelX = x(2043) + 10;
      ends
        .slice().sort((a, b) => b.val - a.val)
        .forEach((e, i) => {
          const ly = y(e.val) + (i === 0 ? -8 : 4);
          g.append('circle').attr('cx', x(2043)).attr('cy', y(e.val)).attr('r', 3.5).attr('fill', e.color);
          g.append('text')
            .attr('x', labelX).attr('y', ly)
            .attr('font-size', fsLabel).attr('font-weight', 600).attr('fill', e.color)
            .text(e.label)
            .append('tspan').attr('font-weight', 400).attr('fill', C.ink2)
            .text(' ' + e.val.toFixed(0));
        });
    }

    // === Línea vertical separadora observado / proyectado (en 2024) ===
    if (visible.hist) {
      g.append('line')
        .attr('x1', x(2024)).attr('x2', x(2024))
        .attr('y1', 0).attr('y2', innerH)
        .attr('stroke', C.lineStrong).attr('stroke-width', 1).attr('stroke-dasharray', '2,2');
      g.append('text')
        .attr('x', x(2024) - 4).attr('y', -10)
        .attr('text-anchor', 'end')
        .attr('font-size', fsAxis).attr('fill', C.ink3).attr('font-weight', 600)
        .attr('letter-spacing', '0.1em')
        .text('← OBSERVADO');
      g.append('text')
        .attr('x', x(2024) + 6).attr('y', -10)
        .attr('text-anchor', 'start')
        .attr('font-size', fsAxis).attr('fill', C.ink4).attr('font-weight', 600)
        .attr('letter-spacing', '0.1em')
        .text('PROYECTADO →');
    }

    // === Anotación de drivers 2043 (bloque apilado, arriba-izquierda del plot) ===
    if (visible.h2v) {
      const drv = g.append('g').attr('transform', 'translate(10, 14)');
      drv.append('text')
        .attr('font-size', fsFoot).attr('fill', C.ink3).attr('font-weight', 600)
        .attr('letter-spacing', '0.08em')
        .text('DRIVERS 2043 (ESC. ALTO + H2V)');
      const items = [
        { label: `+${(drivers.hidrogeno_verde_gwh / 1000).toFixed(1).replace('.', ',')} TWh hidrógeno verde`, color: '#4048b8' },
        { label: `+${(drivers.electromovilidad_gwh / 1000).toFixed(1).replace('.', ',')} TWh electromovilidad`, color: C.ink2 },
        { label: `+${(drivers.electrificacion_calefaccion_gwh / 1000).toFixed(1).replace('.', ',')} TWh calefacción`, color: C.ink2 }
      ];
      items.forEach((it, i) => {
        const r = drv.append('g').attr('transform', `translate(0, ${20 + i * 17})`);
        r.append('circle').attr('cx', 3).attr('cy', -3).attr('r', 3).attr('fill', it.color);
        r.append('text').attr('x', 12).attr('y', 0)
          .attr('font-size', fsFoot).attr('fill', it.color).attr('font-weight', 500)
          .text(it.label);
      });
    }

    // === Ejes ===
    g.append('g').attr('transform', `translate(0, ${innerH})`)
      .call(d3.axisBottom(x).ticks(compact ? 4 : 8).tickFormat(d3.format('d')).tickSize(0))
      .call(g => g.select('.domain').attr('stroke', C.line))
      .call(g => g.selectAll('text').attr('fill', C.ink2).attr('font-size', fsAxis).attr('dy', 14));

    g.append('g')
      .call(d3.axisLeft(y).ticks(compact ? 4 : 6).tickFormat(d => d + ' TWh').tickSize(0))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('line').attr('stroke', 'transparent'))
      .call(g => g.selectAll('text').attr('fill', C.ink4).attr('font-size', fsAxis));

    // Eje X label
    g.append('text').attr('x', innerW / 2).attr('y', innerH + 42)
      .attr('text-anchor', 'middle')
      .attr('font-size', fsAxis).attr('fill', C.ink3).attr('letter-spacing', '0.12em')
      .text('AÑO');
  }

  render();
  const cleanup = watchResize(container, render);
  window.addEventListener('beforeunload', () => cleanup && cleanup(), { once: true });
}
