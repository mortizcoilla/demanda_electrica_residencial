// ===========================================================
// charts/causal.js — Mapa de predictores (estabilidad × horizonte)
// ===========================================================

import { C, showTip, hideTip } from '../utils.js';
import { PREDICTOR_DATA } from '../data.js';

export function initCausalChart() {
  const svg = d3.select('#chart-causal');
  const W = 980, H = 460;
  const margin = { top: 30, right: 30, bottom: 40, left: 30 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;
  const data = PREDICTOR_DATA;

  const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

  // quadrant cross
  g.append('line').attr('x1', innerW / 2).attr('x2', innerW / 2).attr('y1', 0).attr('y2', innerH)
    .attr('stroke', C.line).attr('stroke-width', 1);
  g.append('line').attr('x1', 0).attr('x2', innerW).attr('y1', innerH / 2).attr('y2', innerH / 2)
    .attr('stroke', C.line).attr('stroke-width', 1);

  // quadrant labels
  const qStyle = { fontSize: 11, fontWeight: 600, fill: C.ink4, letterSpacing: '0.08em' };
  function setQStyle(el) {
    el.attr('font-size', qStyle.fontSize)
      .attr('font-weight', qStyle.fontWeight)
      .attr('fill', qStyle.fill)
      .attr('letter-spacing', qStyle.letterSpacing);
    return el;
  }
  setQStyle(g.append('text').attr('x', 10).attr('y', 18)).text('CORTO PLAZO');
  setQStyle(g.append('text').attr('x', innerW - 10).attr('y', 18).attr('text-anchor', 'end')).text('LARGO PLAZO');
  setQStyle(g.append('text').attr('x', 10).attr('y', innerH - 10)).text('ESTACIONARIO');
  setQStyle(g.append('text').attr('x', innerW - 10).attr('y', innerH - 10).attr('text-anchor', 'end')).text('DINÁMICO');

  // x-axis hint
  g.append('text')
    .attr('x', innerW / 2).attr('y', -12).attr('text-anchor', 'middle')
    .attr('font-size', 10).attr('fill', C.ink4)
    .text('horizonte del forecast →');

  // bubbles
  g.selectAll('circle.node').data(data).enter().append('circle')
    .attr('class', 'node')
    .attr('cx', d => d.x * innerW)
    .attr('cy', d => d.y * innerH)
    .attr('r', 0)
    .attr('fill', d => d.color)
    .attr('opacity', 0.85)
    .transition().duration(600).delay((d, i) => i * 40)
    .attr('r', d => 12 + (d.name.length > 18 ? 3 : 0));

  g.selectAll('text.lbl').data(data).enter().append('text')
    .attr('class', 'lbl')
    .attr('x', d => d.x * innerW)
    .attr('y', d => d.y * innerH - 16)
    .attr('text-anchor', 'middle')
    .attr('font-size', 11).attr('font-weight', 500).attr('fill', C.ink)
    .text(d => d.name)
    .attr('opacity', 0)
    .transition().duration(600).delay((d, i) => 200 + i * 40)
    .attr('opacity', 1);

  // type legend (bottom right)
  const lg = svg.append('g').attr('transform', `translate(${W - 200}, ${H - 110})`);
  const types = [
    { name: 'Físico / climático', color: C.primary },
    { name: 'Tecnológico',        color: C.accent },
    { name: 'Regulatorio',       color: C.indigo },
    { name: 'Macro / shock',     color: C.rose }
  ];
  types.forEach((t, i) => {
    const r = lg.append('g').attr('transform', `translate(0, ${i * 20})`);
    r.append('circle').attr('cx', 6).attr('cy', 0).attr('r', 5).attr('fill', t.color);
    r.append('text').attr('x', 18).attr('y', 4).attr('font-size', 11).attr('fill', C.ink2).text(t.name);
  });

  // hover
  g.selectAll('circle.node')
    .on('mouseenter', function (evt, d) {
      d3.select(this).attr('r', 18).attr('opacity', 1);
      showTip(evt, `<strong>${d.name}</strong><br>Tipo: ${d.type}<br>${d.note}`);
    })
    .on('mousemove', evt => {
      d3.select('#tooltip')
        .style('left', (evt.clientX + 12) + 'px')
        .style('top', (evt.clientY - 12) + 'px');
    })
    .on('mouseleave', function () {
      d3.select(this).attr('r', 12).attr('opacity', 0.85);
      hideTip();
    });
}
