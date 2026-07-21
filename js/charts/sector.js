// ===========================================================
// charts/sector.js — Composición de la demanda SEN 2024
// Layout: SVG donut a la izquierda + HTML legend a la derecha.
// Sin overlaps. Responsivo: en mobile se apila.
// ===========================================================

import { C, showTip, hideTip, watchResize, chartWidth, isCompact } from '../utils.js';

export function initSectorChart(DATA) {
  const container = d3.select('#sector-host');
  const data = DATA.composicion.datos;
  const meta = DATA.composicion.metadata;
  let cleanup = null;

  function render() {
    const W = chartWidth(container.node(), 800);
    const compact = isCompact(W);
    container.selectAll('*').remove();

    // Layout
    const root = container.append('div').attr('class', 'sector-clean');

    // === SVG donut ===
    const chartDiv = root.append('div').attr('class', 'sc-chart');
    const chartH = compact ? 320 : 300;
    const radius = compact ? Math.min(110, W * 0.32) : 120;
    const innerR = radius * 0.62;
    const svg = chartDiv.append('svg')
      .attr('viewBox', `0 0 ${radius * 2.4} ${chartH}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', '100%')
      .style('height', chartH + 'px');
    const cx = radius * 1.2;
    const cy = chartH / 2;

    const pie = d3.pie().value(d => d.value).sort(null).padAngle(0.025);
    const arc = d3.arc().innerRadius(innerR).outerRadius(radius).cornerRadius(4);
    const arcHover = d3.arc().innerRadius(innerR).outerRadius(radius + 8).cornerRadius(4);

    const g = svg.append('g').attr('transform', `translate(${cx}, ${cy})`);

    const arcs = pie(data);
    const segs = g.selectAll('path')
      .data(arcs)
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .attr('stroke', '#faf9f6')
      .attr('stroke-width', 3)
      .style('cursor', 'pointer')
      .on('mouseenter', function (evt, d) {
        d3.select(this).transition().duration(120).attr('d', arcHover);
        showTip(evt, `<strong>${d.data.label}</strong><br>${d.data.value}% de la demanda SEN`);
      })
      .on('mousemove', evt => {
        d3.select('#tooltip')
          .style('left', (evt.clientX + 12) + 'px')
          .style('top', (evt.clientY - 12) + 'px');
      })
      .on('mouseleave', function () {
        d3.select(this).transition().duration(120).attr('d', arc);
        hideTip();
      });

    // center label — value + label
    g.append('text').attr('text-anchor', 'middle').attr('y', -8)
      .attr('font-size', 10).attr('fill', C.ink3).attr('font-weight', 600)
      .attr('letter-spacing', '0.12em')
      .text('DEMANDA SEN');
    g.append('text').attr('text-anchor', 'middle').attr('y', 18)
      .attr('font-size', 30).attr('fill', C.ink).attr('font-weight', 700)
      .attr('font-family', "'Outfit', sans-serif")
      .text('~85 TWh');
    g.append('text').attr('text-anchor', 'middle').attr('y', 36)
      .attr('font-size', 11).attr('fill', C.ink4)
      .text('año 2024');

    // === HTML legend (right side) ===
    const legend = root.append('div').attr('class', 'sc-legend');
    data.forEach(d => {
      const item = legend.append('div').attr('class', 'sc-item');
      item.append('div').attr('class', 'sc-swatch').style('background', d.color);
      const text = item.append('div').attr('class', 'sc-label');
      text.append('span').text(d.label);
      if (d.descripcion) {
        text.append('span').attr('class', 'sc-sub').text(d.descripcion);
      }
      item.append('div').attr('class', 'sc-value').text(d.value + '%');
    });
  }

  render();
  cleanup = watchResize(container.node(), render);
  window.addEventListener('beforeunload', () => cleanup && cleanup(), { once: true });
}
