// ===========================================================
// charts/mape.js — Benchmarks de MAPE + filtros de referencia y familia
// ===========================================================

import { C, showTip, hideTip } from '../utils.js';
import { MAPE_DATA, MAPE_FAMILY_LABELS, MAPE_FAMILY_COLORS } from '../data.js';

export function initMapeChart() {
  const svg = d3.select('#chart-mape');
  const W = 980, H = 480;
  const margin = { top: 30, right: 220, bottom: 40, left: 320 };
  const innerW = W - margin.left - margin.right;

  const data = MAPE_DATA;
  const root = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);
  const sideLg = svg.append('g').attr('transform', `translate(${margin.left + innerW + 20}, ${margin.top + 8})`);

  let activeRef = 'all';
  let activeFamily = 'all';

  function render() {
    root.selectAll('*').remove();
    sideLg.selectAll('*').remove();

    const filtered = data
      .filter(d => {
        const refOk = activeRef === 'all' || (activeRef === 'latam' && d.latam);
        const famOk = activeFamily === 'all' || d.type === activeFamily;
        return refOk && famOk;
      })
      .sort((a, b) => b.mape - a.mape);   // mayor a menor MAPE

    // dynamic height based on filtered count
    const dynamicH = Math.max(180, Math.min(480, filtered.length * 38 + 40));
    svg.attr('viewBox', `0 0 ${W} ${dynamicH}`);
    const localInnerH = dynamicH - margin.top - margin.bottom;

    const y = d3.scaleBand().domain(filtered.map(d => d.study + '|' + d.method)).range([0, localInnerH]).padding(0.18);
    const x = d3.scaleLinear().domain([0, 10]).range([0, innerW]);

    // grid
    root.append('g').selectAll('line')
      .data(x.ticks(5)).enter().append('line')
      .attr('x1', d => x(d)).attr('x2', d => x(d))
      .attr('y1', 0).attr('y2', localInnerH)
      .attr('stroke', C.lineSoft);

    // threshold at 5%
    root.append('line')
      .attr('x1', x(5)).attr('x2', x(5))
      .attr('y1', 0).attr('y2', localInnerH)
      .attr('stroke', C.slate2).attr('stroke-dasharray', '3,3').attr('stroke-width', 1);
    root.append('text').attr('x', x(5)).attr('y', -10)
      .attr('font-size', 10).attr('fill', C.ink4).attr('text-anchor', 'middle')
      .text('Umbral 5% MAPE');

    // bars
    root.selectAll('rect.bar').data(filtered).enter().append('rect')
      .attr('class', 'bar')
      .attr('x', 0).attr('y', d => y(d.study + '|' + d.method))
      .attr('height', y.bandwidth())
      .attr('width', 0).attr('rx', 3)
      .attr('fill', d => MAPE_FAMILY_COLORS[d.type])
      .attr('opacity', d => d.latam ? 0.95 : 0.55)
      .transition().duration(500).delay((d, i) => i * 30)
      .attr('width', d => x(d.mape));

    // value labels
    root.selectAll('text.val').data(filtered).enter().append('text')
      .attr('x', d => x(d.mape) + 6)
      .attr('y', d => y(d.study + '|' + d.method) + y.bandwidth() / 2 + 4)
      .attr('font-size', 12).attr('font-weight', 600).attr('fill', C.ink)
      .text(d => d.mape.toFixed(2) + '%');

    // y axis labels
    root.selectAll('text.lbl').data(filtered).enter().append('text')
      .attr('x', -12)
      .attr('y', d => y(d.study + '|' + d.method) + y.bandwidth() / 2 - 2)
      .attr('text-anchor', 'end')
      .attr('font-size', 12.5).attr('font-weight', 500).attr('fill', C.ink)
      .text(d => d.study);
    root.selectAll('text.method').data(filtered).enter().append('text')
      .attr('x', -12)
      .attr('y', d => y(d.study + '|' + d.method) + y.bandwidth() / 2 + 14)
      .attr('text-anchor', 'end')
      .attr('font-size', 11).attr('fill', C.ink3)
      .text(d => `${d.method} · ${d.horiz}`);

    // x axis
    root.append('g').attr('transform', `translate(0, ${localInnerH})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => d + '%').tickSize(0))
      .call(g => g.select('.domain').attr('stroke', C.line))
      .call(g => g.selectAll('text').attr('fill', C.ink3).attr('font-size', 11).attr('dy', 14));

    // side legend (family)
    sideLg.append('text').attr('font-size', 11).attr('font-weight', 600).attr('fill', C.ink3)
      .attr('letter-spacing', '0.06em').text('FAMILIA');
    ['classical', 'ml', 'deep', 'ensemble'].forEach((k, i) => {
      const r = sideLg.append('g').attr('transform', `translate(0, ${24 + i * 28})`);
      r.append('rect').attr('width', 14).attr('height', 14).attr('rx', 3).attr('fill', MAPE_FAMILY_COLORS[k]);
      r.append('text').attr('x', 22).attr('y', 11).attr('font-size', 12).attr('fill', C.ink2).text(MAPE_FAMILY_LABELS[k]);
    });
    sideLg.append('text').attr('font-size', 11).attr('font-weight', 600).attr('fill', C.ink3)
      .attr('letter-spacing', '0.06em').attr('y', 160).text('REFERENCIA');
    sideLg.append('text').attr('font-size', 11).attr('fill', C.ink2).attr('y', 178).text('Opacas = Chile/LATAM');
    sideLg.append('text').attr('font-size', 11).attr('fill', C.ink2).attr('y', 196).text('Claras = otros países');

    // hover
    root.selectAll('rect.bar')
      .on('mouseenter', function (evt, d) {
        d3.select(this).attr('opacity', 1);
        showTip(evt, `<strong>${d.study}</strong><br>Método: ${d.method}<br>Horizonte: ${d.horiz}<br>MAPE: <strong>${d.mape.toFixed(2)}%</strong><br><span style="color:#a8a8a4">${d.ref}</span>`);
      })
      .on('mousemove', evt => {
        d3.select('#tooltip')
          .style('left', (evt.clientX + 12) + 'px')
          .style('top', (evt.clientY - 12) + 'px');
      })
      .on('mouseleave', function (evt, d) {
        d3.select(this).attr('opacity', d.latam ? 0.95 : 0.55);
        hideTip();
      });

    // empty state
    if (filtered.length === 0) {
      root.append('text')
        .attr('x', innerW / 2).attr('y', localInnerH / 2)
        .attr('text-anchor', 'middle')
        .attr('font-size', 13).attr('fill', C.ink4)
        .text('Ningún estudio coincide con los filtros activos');
    }

    // count
    const countEl = document.getElementById('mapeCount');
    if (countEl) {
      if (filtered.length > 0) {
        const avgMape = filtered.reduce((s, d) => s + d.mape, 0) / filtered.length;
        countEl.textContent = `${filtered.length} estudio(s) · MAPE medio ${avgMape.toFixed(2)}%`;
      } else {
        countEl.textContent = 'Sin resultados';
      }
    }
  }

  // wire up filter buttons
  document.querySelectorAll('#mapeRefFilter .ctrl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#mapeRefFilter .ctrl-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeRef = btn.getAttribute('data-ref');
      render();
    });
  });
  document.querySelectorAll('#mapeFamilyFilter .ctrl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#mapeFamilyFilter .ctrl-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFamily = btn.getAttribute('data-family');
      render();
    });
  });

  render();
}
