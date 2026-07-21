// ===========================================================
// charts/demand.js — Demanda máxima horaria del SEN 2018-2025
// Responsivo: re-renderiza al cambiar el ancho del contenedor.
// ===========================================================

import { C, fmt, showTip, hideTip, watchResize, chartWidth, isCompact, isTablet } from '../utils.js';

export function initDemandChart(DATA) {
  const svg = d3.select('#chart-demand');
  const container = svg.node().parentElement;
  const peaks = DATA.peak.datos;

  function computeLayout() {
    const W = chartWidth(container, 880);
    const compact = isCompact(W);
    const tablet  = isTablet(W);
    const H = compact ? 300 : tablet ? 320 : 340;
    const margin = compact
      ? { top: 24, right: 16, bottom: 50, left: 50 }
      : { top: 30, right: 30, bottom: 40, left: 50 };
    return { W, H, margin, innerW: W - margin.left - margin.right, innerH: H - margin.top - margin.bottom, compact, tablet };
  }

  function render() {
    const { W, H, margin, innerW, innerH, compact } = computeLayout();

    svg
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);
    const x = d3.scaleBand().domain(peaks.map(d => d.y)).range([0, innerW]).padding(0.25);
    const y = d3.scaleLinear().domain([10000, 12800]).range([innerH, 0]);

    const fsAxis   = compact ? 10 : 11;
    const fsVal    = compact ? 10 : 12;
    const fsSeason = compact ? 9  : 10;
    const fsFoot   = compact ? 10 : 11;
    const labelOff = compact ? 16 : 22;
    const seasonOff= compact ? 6  : 8;

    // grid
    g.append('g').selectAll('line')
      .data(y.ticks(compact ? 4 : 6)).enter().append('line')
      .attr('x1', 0).attr('x2', innerW)
      .attr('y1', d => y(d)).attr('y2', d => y(d))
      .attr('stroke', C.lineSoft);

    // bars
    g.selectAll('rect.bar').data(peaks).enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.y))
      .attr('y', innerH)
      .attr('width', x.bandwidth())
      .attr('height', 0).attr('rx', 4)
      .attr('fill', d => d.season === 'Verano' ? C.accent : C.primary2)
      .attr('opacity', 0.9)
      .transition().duration(700).delay((d, i) => i * 40)
      .attr('y', d => y(d.val))
      .attr('height', d => innerH - y(d.val));

    // value labels
    g.selectAll('text.val').data(peaks).enter().append('text')
      .attr('x', d => x(d.y) + x.bandwidth() / 2)
      .attr('y', d => y(d.val) - labelOff)
      .attr('text-anchor', 'middle')
      .attr('font-size', fsVal).attr('font-weight', 600).attr('fill', C.ink)
      .text(d => fmt(d.val));

    // season labels
    g.selectAll('text.season').data(peaks).enter().append('text')
      .attr('x', d => x(d.y) + x.bandwidth() / 2)
      .attr('y', d => y(d.val) - seasonOff)
      .attr('text-anchor', 'middle')
      .attr('font-size', fsSeason).attr('fill', C.ink4)
      .text(d => d.season);

    // highlight 2024 — accent mark on top of the peak bar
    const peak2024 = peaks[6];
    g.append('rect')
      .attr('x', x(peak2024.y))
      .attr('y', y(peak2024.val) - 4)
      .attr('width', x.bandwidth())
      .attr('height', 4)
      .attr('fill', C.ink)
      .attr('rx', 2);

    // x axis
    g.append('g').attr('transform', `translate(0, ${innerH})`)
      .call(d3.axisBottom(x).tickFormat(d => d).tickSize(0))
      .call(g => g.select('.domain').attr('stroke', C.line))
      .call(g => g.selectAll('text').attr('fill', C.ink2).attr('font-size', fsAxis).attr('dy', 14));

    // y axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(compact ? 4 : 5).tickFormat(d => fmt(d)))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('line').attr('stroke', 'transparent'))
      .call(g => g.selectAll('text').attr('fill', C.ink4).attr('font-size', fsAxis));

    // footer annotation (no collision with bars)
    g.append('text')
      .attr('x', 0).attr('y', innerH + 32).attr('text-anchor', 'start')
      .attr('font-size', fsFoot).attr('fill', C.ink3)
      .text(compact
        ? '+16% en 7 años · peak 12.190 MWh/h el 31-ene-2024'
        : '+16% en 7 años (10.700 → 12.400 MWh/h) · peak histórico: 12.190 MWh/h el 31-ene-2024');

    // hover
    g.selectAll('rect.bar')
      .on('mouseenter', function (evt, d) {
        d3.select(this).attr('opacity', 1);
        showTip(evt, `<strong>${d.y} · ${d.season}</strong><br>${d.note}`);
      })
      .on('mousemove', evt => {
        d3.select('#tooltip')
          .style('left', (evt.clientX + 12) + 'px')
          .style('top', (evt.clientY - 12) + 'px');
      })
      .on('mouseleave', function () {
        d3.select(this).attr('opacity', 0.9);
        hideTip();
      });
  }

  render();
  const cleanup = watchResize(container, render);
  window.addEventListener('beforeunload', () => cleanup && cleanup(), { once: true });
}
