// ===========================================================
// charts/distribuidoras.js — Barras horizontales + filtro de zona
// ===========================================================

import { C, fmt, showTip, hideTip } from '../utils.js';
import { DISTRIBUIDORAS_DATA } from '../data.js';

export function initDistribuidorasChart() {
  const svg = d3.select('#chart-distribuidoras');
  const W = 1000, H = 280;
  const data = DISTRIBUIDORAS_DATA;

  const margin = { top: 16, right: 200, bottom: 24, left: 240 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;
  const root = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

  const baseFill = (i) => i === 1 ? C.primary
                       : i === 0 ? C.primary2
                       : i === 2 ? C.accent
                       : i === 3 ? C.amber
                       : C.slate2;

  let activeZone = 'all';

  function render(filtered) {
    root.selectAll('*').remove();

    const y = d3.scaleBand().domain(filtered.map(d => d.name)).range([0, innerH]).padding(0.25);
    const x = d3.scaleLinear().domain([0, d3.max(filtered, d => d.value) * 1.05 || 1]).range([0, innerW]);

    // grid
    root.append('g').attr('class', 'grid')
      .selectAll('line').data(x.ticks(5)).enter().append('line')
      .attr('x1', d => x(d)).attr('x2', d => x(d))
      .attr('y1', 0).attr('y2', innerH)
      .attr('stroke', C.lineSoft);

    // bars
    root.selectAll('rect.bar').data(filtered).enter().append('rect')
      .attr('class', 'bar')
      .attr('x', 0).attr('y', d => y(d.name))
      .attr('height', y.bandwidth()).attr('rx', 4).attr('width', 0)
      .attr('fill', d => baseFill(data.indexOf(d)))
      .transition().duration(500).delay((d, i) => i * 40)
      .attr('width', d => x(d.value));

    // value labels
    root.selectAll('text.val').data(filtered).enter().append('text')
      .attr('class', 'val')
      .attr('x', d => x(d.value) + 8)
      .attr('y', d => y(d.name) + y.bandwidth() / 2 + 4)
      .attr('font-size', 13).attr('font-weight', 600).attr('fill', C.ink)
      .text(d => fmt(d.value) + ' clientes');

    // y labels (name + region)
    root.selectAll('text.name').data(filtered).enter().append('text')
      .attr('class', 'name')
      .attr('x', -12)
      .attr('y', d => y(d.name) + y.bandwidth() / 2 - 1)
      .attr('text-anchor', 'end')
      .attr('font-size', 13).attr('font-weight', 600).attr('fill', C.ink)
      .text(d => d.name);
    root.selectAll('text.region').data(filtered).enter().append('text')
      .attr('class', 'region')
      .attr('x', -12)
      .attr('y', d => y(d.name) + y.bandwidth() / 2 + 14)
      .attr('text-anchor', 'end')
      .attr('font-size', 11).attr('fill', C.ink4)
      .text(d => d.region);

    // x axis
    root.append('g').attr('transform', `translate(0, ${innerH})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => (d / 1e6).toFixed(1) + 'M'))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text').attr('fill', C.ink4).attr('font-size', 11));

    // hover
    root.selectAll('rect.bar')
      .on('mouseenter', function (evt, d) {
        d3.select(this).attr('opacity', 0.85);
        showTip(evt, `<strong>${d.name}</strong><br>${fmt(d.value)} clientes regulados<br><span style="color:#a8a8a4">${d.region}</span>`);
      })
      .on('mousemove', evt => {
        d3.select('#tooltip')
          .style('left', (evt.clientX + 12) + 'px')
          .style('top', (evt.clientY - 12) + 'px');
      })
      .on('mouseleave', function () {
        d3.select(this).attr('opacity', 1);
        hideTip();
      });

    // empty state
    if (filtered.length === 0) {
      root.append('text')
        .attr('x', innerW / 2).attr('y', innerH / 2)
        .attr('text-anchor', 'middle')
        .attr('font-size', 13).attr('fill', C.ink4)
        .text('Sin distribuidoras para esta zona');
    }
  }

  function applyFilter() {
    const filtered = activeZone === 'all'
      ? data
      : data.filter(d => d.zones.includes(activeZone));
    render(filtered);
    const total = filtered.reduce((s, d) => s + d.value, 0);
    const countEl = document.getElementById('distribuidorasCount');
    if (countEl) {
      countEl.textContent = `${fmt(filtered.length)} distribuidora(s) · ${(total / 1e6).toFixed(2)}M clientes`;
    }
  }

  // wire up filter buttons
  document.querySelectorAll('#distribuidorasFilter .ctrl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#distribuidorasFilter .ctrl-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeZone = btn.getAttribute('data-zone');
      applyFilter();
    });
  });

  applyFilter();
}
