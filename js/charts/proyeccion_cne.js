// ===========================================================
// charts/proyeccion_cne.js — Cono CNE 3 escenarios 2023-2043
// Visualización: line chart con banda de incertidumbre
//   - Histórico observado 2018-2024 (CEN)
//   - Proyección Medio (oficial) 2023-2043
//   - Proyección Alto 2023-2043
//   - Proyección Alto + H2V 2023-2043
//   - Descomposición Reg/Libre del escenario Medio
//   - Drivers 2043: electromovilidad, calefacción, H2V
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

  function computeLayout() {
    const W = chartWidth(container, 980);
    const compact = isCompact(W);
    const tablet  = isTablet(W);
    const H = 460;
    const margin = compact
      ? { top: 30, right: 20, bottom: 60, left: 50 }
      : tablet
        ? { top: 30, right: 30, bottom: 60, left: 56 }
        : { top: 30, right: 40, bottom: 60, left: 60 };
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

    // === Banda de incertidumbre entre Medio y Alto (2023-2043) ===
    const bandPath = d3.area()
      .x(d => x(d.year))
      .y0(d => y(d.medio))
      .y1(d => y(d.alto))
      .curve(d3.curveMonotoneX);
    const bandData = data.map(d => ({
      year: d.year,
      medio: d.total_gwh / 1000,
      alto: d.total_gwh * projAlto.factor_vs_medio_2043 / 1000
    }));
    // Interpolación lineal del factor
    const factorAlto2043 = projAlto.factor_vs_medio_2043;
    const factorAltoH2v2043 = projAltoH2v.factor_vs_medio_2043;
    for (let i = 0; i < bandData.length; i++) {
      const t = (bandData[i].year - 2023) / (2043 - 2023);  // 0 a 1
      bandData[i].alto     = bandData[i].medio * (1 + t * (factorAlto2043 - 1));
      bandData[i].alto_h2v = bandData[i].medio * (1 + t * (factorAltoH2v2043 - 1));
    }
    g.append('path').datum(bandData)
      .attr('d', d3.area().x(d => x(d.year)).y0(d => y(d.alto)).y1(d => y(d.alto_h2v)).curve(d3.curveMonotoneX))
      .attr('fill', '#4048b8').attr('opacity', 0.10);
    g.append('path').datum(bandData)
      .attr('d', d3.area().x(d => x(d.year)).y0(d => y(d.medio)).y1(d => y(d.alto)).curve(d3.curveMonotoneX))
      .attr('fill', '#b0663f').attr('opacity', 0.14);

    // === Histórico observado 2018-2024 ===
    const histData = historico.map(d => ({ year: d.year, val: d.valor_twh }));
    const histLine = d3.line().x(d => x(d.year)).y(d => y(d.val)).curve(d3.curveMonotoneX);
    g.append('path').datum(histData).attr('d', histLine)
      .attr('fill', 'none').attr('stroke', C.ink).attr('stroke-width', 2.5);
    g.selectAll('circle.hist').data(histData).enter().append('circle')
      .attr('class', 'hist')
      .attr('cx', d => x(d.year)).attr('cy', d => y(d.val))
      .attr('r', 4).attr('fill', C.ink).attr('stroke', '#fff').attr('stroke-width', 1.5)
      .on('mouseenter', (evt, d) => showTip(evt, `<strong>${d.year} (observado)</strong><br>${d.val.toFixed(1)} TWh`))
      .on('mouseleave', hideTip);

    // === Proyección Medio (oficial) 2023-2043 ===
    const medioData = data.map(d => ({ year: d.year, val: d.total_gwh / 1000 }));
    const medioLine = d3.line().x(d => x(d.year)).y(d => y(d.val)).curve(d3.curveMonotoneX);
    g.append('path').datum(medioData).attr('d', medioLine)
      .attr('fill', 'none').attr('stroke', '#0a5847').attr('stroke-width', 3);
    g.selectAll('circle.medio').data(medioData).enter().append('circle')
      .attr('class', 'medio')
      .attr('cx', d => x(d.year)).attr('cy', d => y(d.val))
      .attr('r', 3.5).attr('fill', '#0a5847').attr('stroke', '#fff').attr('stroke-width', 1.5)
      .on('mouseenter', (evt, d) => {
        const reg = data.find(r => r.year === d.year).reg_gwh / 1000;
        const lib = data.find(r => r.year === d.year).libre_gwh / 1000;
        showTip(evt, `<strong>${d.year} — Escenario Medio</strong><br>Total: ${d.val.toFixed(1)} TWh<br>Reg: ${reg.toFixed(1)} · Libre: ${lib.toFixed(1)}`);
      })
      .on('mouseleave', hideTip);

    // === Proyección Alto 2023-2043 ===
    const altoData = bandData.map(d => ({ year: d.year, val: d.alto }));
    g.append('path').datum(altoData).attr('d', d3.line().x(d => x(d.year)).y(d => y(d.val)).curve(d3.curveMonotoneX))
      .attr('fill', 'none').attr('stroke', '#b0663f').attr('stroke-width', 2).attr('stroke-dasharray', '4,3');

    // === Proyección Alto + H2V 2023-2043 ===
    const h2vData = bandData.map(d => ({ year: d.year, val: d.alto_h2v }));
    g.append('path').datum(h2vData).attr('d', d3.line().x(d => x(d.year)).y(d => y(d.val)).curve(d3.curveMonotoneX))
      .attr('fill', 'none').attr('stroke', '#4048b8').attr('stroke-width', 2).attr('stroke-dasharray', '4,3');

    // === Línea vertical separadora observado / proyectado (en 2024) ===
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

    // === Anotaciones H2V y electromovilidad al 2043 ===
    g.append('line')
      .attr('x1', x(2043)).attr('x2', x(2043))
      .attr('y1', y(134.5)).attr('y2', y(201.6))
      .attr('stroke', '#4048b8').attr('stroke-width', 1).attr('stroke-dasharray', '2,2').attr('opacity', 0.4);
    g.append('text')
      .attr('x', x(2043) - 4).attr('y', y(170))
      .attr('text-anchor', 'end')
      .attr('font-size', fsLabel).attr('fill', '#4048b8').attr('font-weight', 600)
      .text('+ H2V 86 TWh');

    g.append('text')
      .attr('x', x(2043) - 4).attr('y', y(112))
      .attr('text-anchor', 'end')
      .attr('font-size', fsFoot).attr('fill', C.ink3)
      .text('+10.5 TWh electromovilidad');

    g.append('text')
      .attr('x', x(2043) - 4).attr('y', y(108) - 14)
      .attr('text-anchor', 'end')
      .attr('font-size', fsFoot).attr('fill', C.ink3)
      .text('+6.8 TWh electrificación calefacción');

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
