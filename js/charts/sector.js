// ===========================================================
// charts/sector.js — Donut: composición de la demanda SEN 2024
// Responsivo: re-renderiza al cambiar el ancho del contenedor.
// ===========================================================

import { C, showTip, hideTip, watchResize, chartWidth, isCompact } from '../utils.js';

export function initSectorChart(DATA) {
  const svg = d3.select('#chart-sector');
  const container = svg.node().parentElement;
  const SECTOR_DATA = DATA.composicion.datos;
  let cleanup = null;

  function render() {
    const W = chartWidth(container, 700);
    const compact = isCompact(W);

    // Aspect ratio se conserva (≈ 2.2:1 desktop, 1:1 móvil para apilar donut + leyenda)
    const H = compact ? Math.max(420, W) : 320;
    const viewW = W, viewH = H;

    svg
      .attr('viewBox', `0 0 ${viewW} ${viewH}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    svg.selectAll('*').remove();

    const radius       = compact ? Math.min(95, W * 0.28) : 110;
    const innerR       = compact ? radius * 0.62 : 70;
    const donutCx      = compact ? viewW / 2  : 175;
    const donutCy      = compact ? radius + 24 : viewH / 2;
    const legendX      = compact ? 16         : donutCx + radius + 50;
    const legendY      = compact ? donutCy + radius + 32 : 60;
    const labelFs      = compact ? 12 : 13;
    const valueFs      = compact ? 20 : 22;
    const headerFs     = compact ? 10 : 11;
    const centerLabelFs= compact ? 12 : 14;
    const centerValueFs= compact ? 30 : 38;
    const centerSubFs  = compact ? 10 : 12;
    const legendGap    = compact ? 28 : 40;
    const legendBlockW = compact ? viewW - 32 : 220;

    const g = svg.append('g').attr('transform', `translate(${donutCx},${donutCy})`);

    const pie = d3.pie().value(d => d.value).sort(null).padAngle(0.02);
    const arc = d3.arc().innerRadius(innerR).outerRadius(radius).cornerRadius(4);
    const arcHover = d3.arc().innerRadius(innerR).outerRadius(radius + (compact ? 6 : 8)).cornerRadius(4);

    // segments
    g.selectAll('path')
      .data(pie(SECTOR_DATA))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .attr('stroke', '#fafafa')
      .attr('stroke-width', 2)
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

    // center label
    g.append('text').attr('text-anchor', 'middle').attr('y', -8)
      .attr('font-size', centerLabelFs).attr('fill', C.ink3).attr('font-weight', 600)
      .text('DEMANDA SEN');
    g.append('text').attr('text-anchor', 'middle').attr('y', 20)
      .attr('font-size', centerValueFs).attr('fill', C.ink).attr('font-weight', 600)
      .attr('font-family', "'Outfit', sans-serif")
      .text('~85 TWh');
    g.append('text').attr('text-anchor', 'middle').attr('y', 38)
      .attr('font-size', centerSubFs).attr('fill', C.ink4)
      .text('año 2024');

    // legend block (lado derecho en desktop, debajo en móvil)
    const detail = svg.append('g').attr('transform', `translate(${legendX}, ${legendY})`);
    if (!compact) {
      detail.append('text').attr('font-size', headerFs).attr('fill', C.ink3)
        .attr('letter-spacing', '0.06em').attr('font-weight', 600)
        .text('REPARTO POR SECTOR');
    }
    SECTOR_DATA.forEach((d, i) => {
      const r = detail.append('g').attr('transform', `translate(0, ${(compact ? 0 : 24) + i * legendGap})`);
      r.append('rect').attr('width', compact ? 12 : 14).attr('height', compact ? 12 : 14)
        .attr('rx', 3).attr('fill', d.color);
      r.append('text').attr('x', compact ? 18 : 22).attr('y', compact ? 10 : 11)
        .attr('font-size', labelFs).attr('fill', C.ink2).text(d.label);
      r.append('text').attr('x', compact ? 18 : 22).attr('y', compact ? 10 + 14 : 32)
        .attr('font-size', valueFs).attr('fill', C.ink).attr('font-weight', 600)
        .text(d.value + '%');
    });
  }

  render();
  cleanup = watchResize(container, render);

  // Cleanup si el script se reinicia (HMR, hot reload)
  window.addEventListener('beforeunload', () => cleanup && cleanup(), { once: true });
}
