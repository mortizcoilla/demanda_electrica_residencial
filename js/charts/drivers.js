// ===========================================================
// charts/drivers.js — Evolución de los 3 vectores de cambio
// (AC, Net Billing, BEV) + toggle show/hide por vector
// ===========================================================

import { C, fmt, showTip, hideTip } from '../utils.js';
import { DRIVERS_YEARS, AC_PCT, NET_BILLING, BEV_SOLD } from '../data.js';

export function initDriversChart() {
  const svg = d3.select('#chart-drivers');
  const W = 980, H = 360;
  const margin = { top: 30, right: 150, bottom: 50, left: 60 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;
  const years = DRIVERS_YEARS;

  const root = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);
  const x = d3.scaleLinear().domain([years[0], years[years.length - 1]]).range([0, innerW]);
  const yAC  = d3.scaleLinear().domain([0, 12]).range([innerH, 0]);
  const yNB  = d3.scaleLinear().domain([0, 40000]).range([innerH, 0]);
  const yBEV = d3.scaleLinear().domain([0, 7000]).range([innerH, 0]);

  const visible = { ac: true, nb: true, bev: true };

  function render() {
    root.selectAll('*').remove();

    // grid
    root.append('g').selectAll('line')
      .data(yAC.ticks(6)).enter().append('line')
      .attr('x1', 0).attr('x2', innerW)
      .attr('y1', d => yAC(d)).attr('y2', d => yAC(d))
      .attr('stroke', C.lineSoft);

    // NET BILLING (area + line)
    if (visible.nb) {
      const areaNB = d3.area()
        .x((d, i) => x(years[i]))
        .y0(innerH)
        .y1((d, i) => yNB(d * 1000))
        .curve(d3.curveMonotoneX);
      root.append('path').datum(NET_BILLING).attr('d', areaNB).attr('fill', C.accent).attr('opacity', 0.12);

      const lineNB = d3.line().x((d, i) => x(years[i])).y(d => yNB(d * 1000)).curve(d3.curveMonotoneX);
      root.append('path').datum(NET_BILLING).attr('d', lineNB).attr('fill', 'none').attr('stroke', C.accent).attr('stroke-width', 2.5);

      root.selectAll('circle.nb').data(NET_BILLING).enter().append('circle')
        .attr('class', 'nb')
        .attr('cx', (d, i) => x(years[i]))
        .attr('cy', d => yNB(d * 1000))
        .attr('r', 4).attr('fill', C.accent).attr('stroke', '#fff').attr('stroke-width', 1.5)
        .on('mouseenter', (evt, d) => showTip(evt, `<strong>Net Billing</strong><br>${(d * 1000).toLocaleString('es-CL')} instalaciones`))
        .on('mousemove', evt => {
          d3.select('#tooltip')
            .style('left', (evt.clientX + 12) + 'px')
            .style('top', (evt.clientY - 12) + 'px');
        })
        .on('mouseleave', hideTip);
    }

    // AC line
    if (visible.ac) {
      const lineAC = d3.line().x((d, i) => x(years[i])).y(d => yAC(d)).curve(d3.curveMonotoneX);
      root.append('path').datum(AC_PCT).attr('d', lineAC).attr('fill', 'none').attr('stroke', C.primary).attr('stroke-width', 2.5);

      root.selectAll('circle.ac').data(AC_PCT).enter().append('circle')
        .attr('class', 'ac')
        .attr('cx', (d, i) => x(years[i]))
        .attr('cy', d => yAC(d))
        .attr('r', 4).attr('fill', C.primary).attr('stroke', '#fff').attr('stroke-width', 1.5)
        .on('mouseenter', (evt, d) => showTip(evt, `<strong>Aire acondicionado</strong><br>${d}% de hogares en ${years[AC_PCT.indexOf(d)]}`))
        .on('mousemove', evt => {
          d3.select('#tooltip')
            .style('left', (evt.clientX + 12) + 'px')
            .style('top', (evt.clientY - 12) + 'px');
        })
        .on('mouseleave', hideTip);
    }

    // BEV bars
    if (visible.bev) {
      const barW = 18;
      root.selectAll('rect.bev').data(BEV_SOLD).enter().append('rect')
        .attr('class', 'bev')
        .attr('x', (d, i) => x(years[i]) - barW / 2)
        .attr('y', d => yBEV(d))
        .attr('width', barW)
        .attr('height', d => innerH - yBEV(d))
        .attr('rx', 2)
        .attr('fill', C.indigo).attr('opacity', 0.7)
        .on('mouseenter', (evt, d) => showTip(evt, `<strong>Vehículos eléctricos (BEV)</strong><br>${fmt(d)} unidades vendidas`))
        .on('mousemove', evt => {
          d3.select('#tooltip')
            .style('left', (evt.clientX + 12) + 'px')
            .style('top', (evt.clientY - 12) + 'px');
        })
        .on('mouseleave', hideTip);
    }

    // end-of-line labels: smart stacking — cada label se ubica en la y
    // de su dato; si dos colisionan (gap < minLabelGap), el segundo se
    // empuja hacia abajo. Connector dashed solo cuando hay offset.
    const labelX = x(years[years.length - 1]) + 14;
    const minLabelGap = 20;   // separación mínima vertical entre labels (px)

    const visibleSeries = [
      { key: 'nb',  color: C.accent,  text: 'NB 39.6k',  dot: () => [x(years[years.length - 1]), yNB(39.6 * 1000)] },
      { key: 'ac',  color: C.primary, text: 'AC 11.5%',  dot: () => [x(years[years.length - 1]), yAC(11.5)] },
      { key: 'bev', color: C.indigo,  text: 'BEV 6,500', dot: () => [x(years[years.length - 1]), yBEV(6500)] }
    ].filter(s => visible[s.key]);

    // Ordenar por y del dato (arriba → abajo en pantalla = y ascendente)
    const sorted = visibleSeries.slice().sort((a, b) => a.dot()[1] - b.dot()[1]);

    // Calcular posiciones de label con stacking inteligente
    let cursor = -Infinity;
    const positioned = sorted.map((s) => {
      const [dotX, dotY] = s.dot();
      const labelY = Math.max(dotY, cursor + minLabelGap);
      cursor = labelY;
      return { s, dotX, dotY, labelY };
    });

    // Dibujar labels y connectors
    positioned.forEach(({ s, dotX, dotY, labelY }) => {
      // Connector dashed solo si el label está desplazado del dato
      if (labelY > dotY + 2) {
        root.append('line')
          .attr('x1', dotX + 4).attr('y1', dotY)
          .attr('x2', labelX - 4).attr('y2', labelY + 4)
          .attr('stroke', s.color).attr('stroke-width', 1).attr('opacity', 0.5)
          .attr('stroke-dasharray', '2,2');
      }
      // Dot del label
      root.append('circle').attr('cx', labelX).attr('cy', labelY + 4)
        .attr('r', 3).attr('fill', s.color);
      // Texto
      root.append('text')
        .attr('x', labelX + 8).attr('y', labelY + 8)
        .attr('font-size', 12).attr('font-weight', 600).attr('fill', s.color)
        .text(s.text);
    });

    // axes
    root.append('g').attr('transform', `translate(0, ${innerH})`)
      .call(d3.axisBottom(x).ticks(9).tickFormat(d3.format('d')).tickSize(0))
      .call(g => g.select('.domain').attr('stroke', C.line))
      .call(g => g.selectAll('text').attr('fill', C.ink2).attr('font-size', 11).attr('dy', 14));

    root.append('g')
      .call(d3.axisLeft(yAC).ticks(6).tickFormat(d => d + '%').tickSize(0))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text').attr('fill', C.primary).attr('font-size', 11));

    root.append('g').attr('transform', `translate(${innerW}, 0)`)
      .call(d3.axisRight(yBEV).ticks(5).tickFormat(d => fmt(d)).tickSize(0))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text').attr('fill', C.indigo).attr('font-size', 11));

    // axis labels
    root.append('text').attr('x', -50).attr('y', -14)
      .attr('font-size', 10.5).attr('fill', C.primary).attr('font-weight', 600)
      .text('% HOGARES');
    root.append('text').attr('x', innerW + 50).attr('y', -14)
      .attr('font-size', 10.5).attr('fill', C.indigo).attr('font-weight', 600)
      .attr('text-anchor', 'end').text('BEV VENDIDOS/AÑO');

    // footer note
    const parts = [];
    if (visible.ac)  parts.push('AC residencial (% hogares, línea verde)');
    if (visible.nb)  parts.push('Net Billing (instalaciones, área naranja)');
    if (visible.bev) parts.push('BEV vendidos (barras azules)');
    root.append('text').attr('x', 0).attr('y', innerH + 38)
      .attr('font-size', 11).attr('fill', C.ink3)
      .text(parts.join(' · ') || 'Ningún vector seleccionado');
  }

  // wire up checkboxes
  document.querySelectorAll('#driversFilter .ctrl-check').forEach(label => {
    const cb = label.querySelector('input');
    const vec = label.getAttribute('data-vector');
    cb.addEventListener('change', () => {
      visible[vec] = cb.checked;
      label.classList.toggle('off', !cb.checked);
      render();
    });
  });

  render();
}
