// ===========================================================
// charts/causal.js — Mapa de predictores (estabilidad × horizonte)
// Responsivo: re-renderiza al cambiar el ancho del contenedor.
// ===========================================================

import { C, showTip, hideTip, watchResize, chartWidth, isCompact, isTablet } from '../utils.js';

export function initCausalChart(DATA) {
  const svg = d3.select('#chart-causal');
  const container = svg.node().parentElement;
  const data = DATA.predictores.datos;

  function computeLayout() {
    const W = chartWidth(container, 980);
    const compact = isCompact(W);
    const tablet  = isTablet(W);
    // En compact: el alto aumenta para que las burbujas no se monten.
    const H = compact ? 560 : tablet ? 460 : 460;
    const margin = { top: 30, right: 20, bottom: 40, left: 20 };
    return { W, H, margin, innerW: W - margin.left - margin.right, innerH: H - margin.top - margin.bottom, compact, tablet };
  }

  function render() {
    const { W, H, margin, innerW, innerH, compact, tablet } = computeLayout();

    svg
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    const fsQuad   = compact ? 9  : 11;
    const fsLabel  = compact ? 9  : 11;
    const fsLegend = compact ? 10 : 11;
    const fsAxisHint = compact ? 9 : 10;
    const baseR    = compact ? 9  : 12;
    const hoverR   = compact ? 13 : 18;
    // Posiciones base
    const labelDy  = compact ? -12 : -16;

    // quadrant cross
    g.append('line').attr('x1', innerW / 2).attr('x2', innerW / 2).attr('y1', 0).attr('y2', innerH)
      .attr('stroke', C.line).attr('stroke-width', 1);
    g.append('line').attr('x1', 0).attr('x2', innerW).attr('y1', innerH / 2).attr('y2', innerH / 2)
      .attr('stroke', C.line).attr('stroke-width', 1);

    // quadrant labels
    const qStyle = { fontSize: fsQuad, fontWeight: 600, fill: C.ink4, letterSpacing: '0.08em' };
    function setQStyle(el) {
      el.attr('font-size', qStyle.fontSize)
        .attr('font-weight', qStyle.fontWeight)
        .attr('fill', qStyle.fill)
        .attr('letter-spacing', qStyle.letterSpacing);
      return el;
    }
    const pad = compact ? 8 : 10;
    setQStyle(g.append('text').attr('x', pad).attr('y', 16 + fsQuad)).text('CORTO PLAZO');
    setQStyle(g.append('text').attr('x', innerW - pad).attr('y', 16 + fsQuad).attr('text-anchor', 'end')).text('LARGO PLAZO');
    setQStyle(g.append('text').attr('x', pad).attr('y', innerH - 8)).text('ESTACIONARIO');
    setQStyle(g.append('text').attr('x', innerW - pad).attr('y', innerH - 8).attr('text-anchor', 'end')).text('DINÁMICO');

    // x-axis hint
    g.append('text')
      .attr('x', innerW / 2).attr('y', -10).attr('text-anchor', 'middle')
      .attr('font-size', fsAxisHint).attr('fill', C.ink4)
      .text(compact ? 'horizonte →' : 'horizonte del forecast →');

    // bubbles
    g.selectAll('circle.node').data(data).enter().append('circle')
      .attr('class', 'node')
      .attr('cx', d => d.x * innerW)
      .attr('cy', d => d.y * innerH)
      .attr('r', 0)
      .attr('fill', d => d.color)
      .attr('opacity', 0.85)
      .transition().duration(600).delay((d, i) => i * 40)
      .attr('r', d => baseR + (d.name.length > 18 ? 3 : 0));

    g.selectAll('text.lbl').data(data).enter().append('text')
      .attr('class', 'lbl')
      .attr('x', d => d.x * innerW)
      .attr('y', d => d.y * innerH + labelDy)
      .attr('text-anchor', 'middle')
      .attr('font-size', fsLabel).attr('font-weight', 500).attr('fill', C.ink)
      .text(d => d.name)
      .attr('opacity', 0)
      .transition().duration(600).delay((d, i) => 200 + i * 40)
      .attr('opacity', 1);

    // type legend — esquina inferior derecha, adaptada al ancho
    const lgW = compact ? 150 : 200;
    const lgX = W - lgW - 8;
    const lgY = H - (compact ? 90 : 110);
    const lg = svg.append('g').attr('transform', `translate(${lgX}, ${lgY})`);
    const types = [
      { name: 'Físico / climático', color: C.primary },
      { name: 'Tecnológico',        color: C.accent },
      { name: 'Regulatorio',       color: C.indigo },
      { name: 'Macro / shock',     color: C.rose }
    ];
    const rowH = compact ? 18 : 20;
    const dotR = compact ? 4 : 5;
    types.forEach((t, i) => {
      const r = lg.append('g').attr('transform', `translate(0, ${i * rowH})`);
      r.append('circle').attr('cx', 5).attr('cy', 0).attr('r', dotR).attr('fill', t.color);
      r.append('text').attr('x', 15).attr('y', 4).attr('font-size', fsLegend).attr('fill', C.ink2).text(t.name);
    });

    // hover
    g.selectAll('circle.node')
      .on('mouseenter', function (evt, d) {
        d3.select(this).attr('r', hoverR).attr('opacity', 1);
        showTip(evt, `<strong>${d.name}</strong><br>Tipo: ${d.type}<br>${d.note}`);
      })
      .on('mousemove', evt => {
        d3.select('#tooltip')
          .style('left', (evt.clientX + 12) + 'px')
          .style('top', (evt.clientY - 12) + 'px');
      })
      .on('mouseleave', function () {
        d3.select(this).attr('r', baseR).attr('opacity', 0.85);
        hideTip();
      });
  }

  render();
  const cleanup = watchResize(container, render);
  window.addEventListener('beforeunload', () => cleanup && cleanup(), { once: true });
}
