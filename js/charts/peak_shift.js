// ===========================================================
// charts/peak_shift.js — Peak shift del SEN 2018-2025
// Visualización: line chart con dots coloreados por estación
//   - Línea de peak anual
//   - Dots: verde (invierno), naranja (verano), ocre (transición)
//   - Anotaciones: COVID 2020, ola calor 2024, peak febr 2025
//   - Stat callouts: shift de 6 meses, +16% magnitud
// ===========================================================

import { C, fmt, showTip, hideTip, watchResize, chartWidth, isCompact, isTablet } from '../utils.js';

export function initPeakShiftChart(DATA) {
  const svg = d3.select('#chart-peak-shift');
  const container = svg.node().parentElement;
  const data = DATA.peak_shift.peaks;
  const meta = DATA.peak_shift.metadata;
  const stats = DATA.peak_shift.estadisticas_shift;
  const proj2026 = DATA.peak_shift.proyeccion_2026;

  // Mapa de colores por estación
  const COLOR = {
    invierno:    '#0a5847',  // verde profundo
    verano:      '#b0663f',  // terracota
    transicion:  '#b88a1c'   // ocre
  };

  function computeLayout() {
    const W = chartWidth(container, 980);
    const compact = isCompact(W);
    const tablet  = isTablet(W);
    const H = 380;
    const margin = compact
      ? { top: 30, right: 20, bottom: 60, left: 50 }
      : { top: 30, right: 30, bottom: 50, left: 56 };
    return { W, H, margin, innerW: W - margin.left - margin.right, innerH: H - margin.top - margin.bottom, compact, tablet };
  }

  function render() {
    const { W, H, margin, innerW, innerH, compact } = computeLayout();

    svg.attr('viewBox', `0 0 ${W} ${H}`).attr('preserveAspectRatio', 'xMidYMid meet');
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    const fsAxis  = compact ? 10 : 11;
    const fsLabel = compact ? 9  : 10.5;
    const fsFoot  = compact ? 9  : 10;

    // Eje X: años 2018-2026 (incluyendo proyección)
    const x = d3.scaleLinear().domain([2018, 2026]).range([0, innerW]);
    // Eje Y: MWh/h 10000-13000
    const y = d3.scaleLinear().domain([10000, 13000]).range([innerH, 0]);

    // Grid
    g.append('g').selectAll('line')
      .data(y.ticks(6)).enter().append('line')
      .attr('x1', 0).attr('x2', innerW)
      .attr('y1', d => y(d)).attr('y2', d => y(d))
      .attr('stroke', C.lineSoft);

    // === Línea conectando peaks históricos ===
    const histData = data.map(d => ({ year: d.year, val: d.val }));
    const line = d3.line().x(d => x(d.year)).y(d => y(d.val)).curve(d3.curveMonotoneX);
    g.append('path').datum(histData).attr('d', line)
      .attr('fill', 'none').attr('stroke', C.ink).attr('stroke-width', 2).attr('opacity', 0.5);

    // === Línea punteada 2026 (proyección) ===
    g.append('line')
      .attr('x1', x(2025)).attr('x2', x(2026))
      .attr('y1', y(12397)).attr('y2', y(proj2026.valor_estimado))
      .attr('stroke', C.ink3).attr('stroke-width', 1.5).attr('stroke-dasharray', '4,4').attr('opacity', 0.7);

    // === Dots de cada peak ===
    g.selectAll('circle.peak').data(data).enter().append('circle')
      .attr('class', 'peak')
      .attr('cx', d => x(d.year))
      .attr('cy', d => y(d.val))
      .attr('r', compact ? 6 : 8)
      .attr('fill', d => COLOR[d.estacion])
      .attr('stroke', '#faf9f6')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseenter', (evt, d) => showTip(evt,
        `<strong>${d.fecha}</strong><br>Peak: ${fmt(d.val)} MWh/h<br>Estación: ${d.estacion}<br><span style="color:#a8a8a4">${d.evento}</span>`
      ))
      .on('mouseleave', hideTip);

    // === Anotación del peak 2024 (ola calor) ===
    const peak2024 = data.find(d => d.year === 2024);
    g.append('line')
      .attr('x1', x(2024)).attr('x2', x(2024))
      .attr('y1', y(12190) - 14).attr('y2', y(12190) - 40)
      .attr('stroke', C.ink3).attr('stroke-width', 0.8);
    g.append('text')
      .attr('x', x(2024)).attr('y', y(12190) - 46)
      .attr('text-anchor', 'middle')
      .attr('font-size', fsLabel).attr('font-weight', 600).attr('fill', '#b0663f')
      .text('Ola calor 2024');
    g.append('text')
      .attr('x', x(2024)).attr('y', y(12190) - 32)
      .attr('text-anchor', 'middle')
      .attr('font-size', fsFoot).attr('fill', C.ink3)
      .text('35.8°C · 31-ene');

    // === Anotación del peak 2025 ===
    g.append('text')
      .attr('x', x(2025)).attr('y', y(12397) - 32)
      .attr('text-anchor', 'middle')
      .attr('font-size', fsLabel).attr('font-weight', 600).attr('fill', '#b0663f')
      .text('Ola calor feb 2025');

    // === Anotación COVID 2020 ===
    g.append('text')
      .attr('x', x(2020)).attr('y', y(10500) - 18)
      .attr('text-anchor', 'middle')
      .attr('font-size', fsLabel).attr('font-weight', 600).attr('fill', C.ink3)
      .text('COVID');
    g.append('text')
      .attr('x', x(2020)).attr('y', y(10500) - 4)
      .attr('text-anchor', 'middle')
      .attr('font-size', fsFoot).attr('fill', C.ink4)
      .text('lockdown ↓');

    // === Eje X ===
    g.append('g').attr('transform', `translate(0, ${innerH})`)
      .call(d3.axisBottom(x).ticks(compact ? 4 : 9).tickFormat(d3.format('d')).tickSize(0))
      .call(g => g.select('.domain').attr('stroke', C.line))
      .call(g => g.selectAll('text').attr('fill', C.ink2).attr('font-size', fsAxis).attr('dy', 14));

    // === Eje Y ===
    g.append('g')
      .call(d3.axisLeft(y).ticks(compact ? 4 : 5).tickFormat(d => (d / 1000).toFixed(0) + 'k').tickSize(0))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('line').attr('stroke', 'transparent'))
      .call(g => g.selectAll('text').attr('fill', C.ink4).attr('font-size', fsAxis));

    // === Eje Y label ===
    g.append('text').attr('x', -40).attr('y', -14)
      .attr('font-size', fsLabel).attr('fill', C.ink3).attr('font-weight', 600)
      .attr('letter-spacing', '0.1em')
      .text('PEAK MWh/h');

    // === Footer con stat ===
    g.append('text').attr('x', 0).attr('y', innerH + 32)
      .attr('font-size', fsFoot).attr('fill', C.ink3)
      .text(`Peak shift: ${stats.shift_meses} meses antes · +${stats.cambio_peak_pct.toFixed(1)}% en magnitud (2018→2025)`);
  }

  render();
  const cleanup = watchResize(container, render);
  window.addEventListener('beforeunload', () => cleanup && cleanup(), { once: true });
}
