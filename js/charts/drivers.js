// ===========================================================
// charts/drivers.js — Evolución de los 3 vectores de cambio
// (AC, Net Billing, BEV) + toggle show/hide por vector
// Responsivo: re-renderiza al cambiar el ancho del contenedor.
// ===========================================================

import { C, fmt, showTip, hideTip, watchResize, chartWidth, isCompact, isTablet } from '../utils.js';

export function initDriversChart(DATA) {
  const svg = d3.select('#chart-drivers');
  const container = svg.node().parentElement;
  const V = DATA.vectores;
  const years = V.years;
  const AC_PCT      = V.series.ac_pct.values;
  const NET_BILLING = V.series.net_billing.values;
  const BEV_SOLD    = V.series.bev_sold.values;

  const visible = { ac: true, nb: true, bev: true };

  function computeLayout() {
    const W = chartWidth(container, 980);
    const compact = isCompact(W);
    const tablet  = isTablet(W);
    const H = compact ? 360 : 360;
    // En compact: menos margin.right (sin labels de final de línea) y
    //             margin.bottom mayor para envolver el footer.
    const margin = compact
      ? { top: 30, right: 16, bottom: 64, left: 44 }
      : tablet
        ? { top: 30, right: 130, bottom: 54, left: 54 }
        : { top: 30, right: 150, bottom: 50, left: 60 };
    return {
      W, H, margin,
      innerW: W - margin.left - margin.right,
      innerH: H - margin.top - margin.bottom,
      compact, tablet
    };
  }

  function render() {
    const { W, H, margin, innerW, innerH, compact, tablet } = computeLayout();

    svg
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');
    svg.selectAll('*').remove();

    const root = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);
    const x = d3.scaleLinear().domain([years[0], years[years.length - 1]]).range([0, innerW]);
    const yAC  = d3.scaleLinear().domain([0, 12]).range([innerH, 0]);
    const yNB  = d3.scaleLinear().domain([0, 40000]).range([innerH, 0]);
    const yBEV = d3.scaleLinear().domain([0, 7000]).range([innerH, 0]);

    const fsAxis   = compact ? 10 : 11;
    const fsLabel  = compact ? 9  : 10.5;
    const fsEndLbl = compact ? 10 : 12;
    const barW     = compact ? Math.max(8, innerW / years.length * 0.35) : 18;
    const dotR     = compact ? 3  : 4;

    // grid
    root.append('g').selectAll('line')
      .data(yAC.ticks(compact ? 4 : 6)).enter().append('line')
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
        .attr('r', dotR).attr('fill', C.accent).attr('stroke', '#fff').attr('stroke-width', 1.5)
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
        .attr('r', dotR).attr('fill', C.primary).attr('stroke', '#fff').attr('stroke-width', 1.5)
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

    // end-of-line labels — solo si hay espacio suficiente (no en compact ni tablet)
    if (!compact && !tablet) {
      const labelX = x(years[years.length - 1]) + 14;
      const minLabelGap = 20;

      const visibleSeries = [
        { key: 'nb',  color: C.accent,  text: 'NB 39.6k',  dot: () => [x(years[years.length - 1]), yNB(39.6 * 1000)] },
        { key: 'ac',  color: C.primary, text: 'AC 11.5%',  dot: () => [x(years[years.length - 1]), yAC(11.5)] },
        { key: 'bev', color: C.indigo,  text: 'BEV 6,500', dot: () => [x(years[years.length - 1]), yBEV(6500)] }
      ].filter(s => visible[s.key]);

      const sorted = visibleSeries.slice().sort((a, b) => a.dot()[1] - b.dot()[1]);

      let cursor = -Infinity;
      const positioned = sorted.map((s) => {
        const [dotX, dotY] = s.dot();
        const labelY = Math.max(dotY, cursor + minLabelGap);
        cursor = labelY;
        return { s, dotX, dotY, labelY };
      });

      positioned.forEach(({ s, dotX, dotY, labelY }) => {
        if (labelY > dotY + 2) {
          root.append('line')
            .attr('x1', dotX + 4).attr('y1', dotY)
            .attr('x2', labelX - 4).attr('y2', labelY + 4)
            .attr('stroke', s.color).attr('stroke-width', 1).attr('opacity', 0.5)
            .attr('stroke-dasharray', '2,2');
        }
        root.append('circle').attr('cx', labelX).attr('cy', labelY + 4)
          .attr('r', 3).attr('fill', s.color);
        root.append('text')
          .attr('x', labelX + 8).attr('y', labelY + 8)
          .attr('font-size', fsEndLbl).attr('font-weight', 600).attr('fill', s.color)
          .text(s.text);
      });
    }

    // axes
    root.append('g').attr('transform', `translate(0, ${innerH})`)
      .call(d3.axisBottom(x).ticks(compact ? 4 : 9).tickFormat(d3.format('d')).tickSize(0))
      .call(g => g.select('.domain').attr('stroke', C.line))
      .call(g => g.selectAll('text').attr('fill', C.ink2).attr('font-size', fsAxis).attr('dy', 14));

    root.append('g')
      .call(d3.axisLeft(yAC).ticks(compact ? 4 : 6).tickFormat(d => d + '%').tickSize(0))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text').attr('fill', C.primary).attr('font-size', fsAxis));

    // En compact: el eje derecho y los axis labels se ocultan para no saturar
    if (!compact) {
      // En tablet: solo el eje derecho (sin axis label), el left label sí
      // En desktop: ambos ejes + axis labels
      root.append('g').attr('transform', `translate(${innerW}, 0)`)
        .call(d3.axisRight(yBEV).ticks(5).tickFormat(d => fmt(d)).tickSize(0))
        .call(g => g.select('.domain').remove())
        .call(g => g.selectAll('text').attr('fill', C.indigo).attr('font-size', fsAxis));

      // axis labels
      root.append('text').attr('x', -50).attr('y', -14)
        .attr('font-size', fsLabel).attr('fill', C.primary).attr('font-weight', 600)
        .text('% HOGARES');
      if (!tablet) {
        root.append('text').attr('x', innerW + 50).attr('y', -14)
          .attr('font-size', fsLabel).attr('fill', C.indigo).attr('font-weight', 600)
          .attr('text-anchor', 'end').text('BEV VENDIDOS/AÑO');
      }
    } else {
      // Solo el label izquierdo en compact
      root.append('text').attr('x', -36).attr('y', -14)
        .attr('font-size', fsLabel).attr('fill', C.primary).attr('font-weight', 600)
        .text('% HOGARES');
    }

    // footer note
    const parts = [];
    if (visible.ac)  parts.push(compact ? 'AC (% hogares)' : 'AC residencial (% hogares, línea verde)');
    if (visible.nb)  parts.push(compact ? 'Net Billing'    : 'Net Billing (instalaciones, área naranja)');
    if (visible.bev) parts.push(compact ? 'BEV vendidos'   : 'BEV vendidos (barras azules)');
    root.append('text').attr('x', 0).attr('y', innerH + (compact ? 44 : 38))
      .attr('font-size', fsAxis).attr('fill', C.ink3)
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
  const cleanup = watchResize(container, render);
  window.addEventListener('beforeunload', () => cleanup && cleanup(), { once: true });
}
