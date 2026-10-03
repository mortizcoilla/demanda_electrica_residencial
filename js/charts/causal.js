// ===========================================================
// charts/causal.js — Mapa de predictores (estabilidad × horizonte)
// Eje X = estabilidad (izq: estable · der: cambiante)
// Eje Y = horizonte (abajo: corto plazo · arriba: largo plazo)
// Leyenda de familias derivada de los colores del dataset,
// clickeable para aislar una familia (click de nuevo = reset).
// Responsivo: re-renderiza al cambiar el ancho del contenedor.
// ===========================================================

import { C, showTip, hideTip, watchResize, chartWidth, isCompact, isTablet } from '../utils.js';

export function initCausalChart(DATA) {
  const svg = d3.select('#chart-causal');
  const container = svg.node().parentElement;
  const data = DATA.predictores.datos;

  // Familias por color — se derivan del dataset para que leyenda y
  // burbujas siempre coincidan. El label resume los types agrupados.
  const FAMILIES = [
    { color: '#0a5847', label: 'Clima · calendario · zona' },
    { color: '#b0663f', label: 'Tecnológico · estructural' },
    { color: '#4048b8', label: 'Regulatorio · conductual' },
    { color: '#475569', label: 'Macro' },
    { color: '#9c4f48', label: 'Shocks' }
  ].filter(f => data.some(d => d.color === f.color));

  let selectedFamily = null;  // color de familia activa, o null

  function computeLayout() {
    const W = chartWidth(container, 980);
    const compact = isCompact(W);
    const tablet  = isTablet(W);
    const H = compact ? 560 : 460;
    const margin = {
      top: 34,
      right: 20,
      bottom: compact ? 96 : 64,   // espacio para la leyenda horizontal
      left: compact ? 40 : 46      // espacio para el label Y rotado
    };
    return { W, H, margin, innerW: W - margin.left - margin.right, innerH: H - margin.top - margin.bottom, compact, tablet };
  }

  function render() {
    const { W, H, margin, innerW, innerH, compact } = computeLayout();

    svg
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    const fsAxis  = compact ? 9 : 10;
    const fsLabel = compact ? 9 : 11;
    const fsLegend = compact ? 9.5 : 11;
    const baseR    = compact ? 9  : 12;
    const hoverR   = compact ? 13 : 18;
    const labelDy  = compact ? -12 : -16;

    // quadrant cross
    g.append('line').attr('x1', innerW / 2).attr('x2', innerW / 2).attr('y1', 0).attr('y2', innerH)
      .attr('stroke', C.line).attr('stroke-width', 1);
    g.append('line').attr('x1', 0).attr('x2', innerW).attr('y1', innerH / 2).attr('y2', innerH / 2)
      .attr('stroke', C.line).attr('stroke-width', 1);

    // === Etiquetas de ejes (semántica corregida según metadata del dataset) ===
    // X: estabilidad (0 = estable · 1 = cambiante)
    g.append('text')
      .attr('x', innerW / 2).attr('y', innerH + 26).attr('text-anchor', 'middle')
      .attr('font-size', fsAxis).attr('fill', C.ink4).attr('letter-spacing', '0.1em')
      .text('ESTABILIDAD:  ESTABLE → CAMBIANTE');
    // Y: horizonte (0 = corto · 1 = largo), rotada
    g.append('text')
      .attr('transform', `rotate(-90)`)
      .attr('x', -innerH / 2).attr('y', -10).attr('text-anchor', 'middle')
      .attr('font-size', fsAxis).attr('fill', C.ink4).attr('letter-spacing', '0.1em')
      .text('HORIZONTE:  CORTO → LARGO');
    // hints de extremos del eje Y
    g.append('text')
      .attr('x', -2).attr('y', innerH + 12).attr('text-anchor', 'end')
      .attr('font-size', fsAxis).attr('fill', C.ink4)
      .text('corto');
    g.append('text')
      .attr('x', -2).attr('y', 10).attr('text-anchor', 'end')
      .attr('font-size', fsAxis).attr('fill', C.ink4)
      .text('largo');

    // === Burbujas ===
    const isDim = d => selectedFamily !== null && d.color !== selectedFamily;

    const bubbles = g.selectAll('circle.node').data(data).enter().append('circle')
      .attr('class', 'node')
      .attr('cx', d => d.x * innerW)
      .attr('cy', d => d.y * innerH)
      .attr('r', 0)
      .attr('fill', d => d.color)
      .attr('opacity', d => isDim(d) ? 0.12 : 0.85)
      .style('cursor', 'pointer')
      .transition().duration(600).delay((d, i) => i * 40)
      .attr('r', d => baseR + (d.name.length > 18 ? 3 : 0));

    g.selectAll('text.lbl').data(data).enter().append('text')
      .attr('class', 'lbl')
      .attr('x', d => d.x * innerW)
      .attr('y', d => d.y * innerH + labelDy)
      .attr('text-anchor', 'middle')
      .attr('font-size', fsLabel).attr('font-weight', 500)
      .attr('fill', d => isDim(d) ? C.line : C.ink)
      .text(d => d.name)
      .attr('opacity', 0)
      .transition().duration(600).delay((d, i) => 200 + i * 40)
      .attr('opacity', 1);

    // === Leyenda horizontal de familias (clickeable), debajo del plot ===
    const legendY = H - margin.bottom + 44;
    const lg = svg.append('g').attr('transform', `translate(${margin.left}, ${legendY})`);
    const rowH = 20;
    const itemH = 14; // swatch
    let cx = 0;
    const measure = f => 14 + 8 + f.label.length * (fsLegend * 0.58) + 26;

    if (!compact) {
      // Una sola fila en desktop/tablet
      FAMILIES.forEach(f => {
        const item = lg.append('g')
          .attr('transform', `translate(${cx}, 0)`)
          .style('cursor', 'pointer')
          .classed('lg-active', selectedFamily === f.color);
        item.append('circle')
          .attr('cx', 5).attr('cy', 0).attr('r', 5)
          .attr('fill', f.color)
          .attr('opacity', selectedFamily === null || selectedFamily === f.color ? 1 : 0.3);
        item.append('text')
          .attr('x', 16).attr('y', 3.5)
          .attr('font-size', fsLegend)
          .attr('font-weight', selectedFamily === f.color ? 600 : 400)
          .attr('fill', selectedFamily === f.color ? C.ink : C.ink2)
          .text(f.label + (selectedFamily === f.color ? ' ✓' : ''));
        wireLegend(item, f);
        cx += measure(f);
      });
    } else {
      // Dos filas en compact
      const half = Math.ceil(FAMILIES.length / 2);
      FAMILIES.forEach((f, i) => {
        const row = Math.floor(i / half);
        const col = i % half;
        const rowItems = FAMILIES.slice(row * half, row * half + half);
        const xOff = rowItems.slice(0, col).reduce((s, ff) => s + measure(ff), 0);
        const item = lg.append('g')
          .attr('transform', `translate(${xOff}, ${row * rowH})`)
          .style('cursor', 'pointer')
          .classed('lg-active', selectedFamily === f.color);
        item.append('circle')
          .attr('cx', 5).attr('cy', 0).attr('r', 4.5)
          .attr('fill', f.color)
          .attr('opacity', selectedFamily === null || selectedFamily === f.color ? 1 : 0.3);
        item.append('text')
          .attr('x', 15).attr('y', 3.5)
          .attr('font-size', fsLegend)
          .attr('font-weight', selectedFamily === f.color ? 600 : 400)
          .attr('fill', selectedFamily === f.color ? C.ink : C.ink2)
          .text(f.label + (selectedFamily === f.color ? ' ✓' : ''));
        wireLegend(item, f);
      });
    }

    function wireLegend(item, f) {
      item
        .on('click', () => {
          selectedFamily = selectedFamily === f.color ? null : f.color;
          render();
        })
        .on('mouseenter', (evt) => {
          const types = [...new Set(data.filter(d => d.color === f.color).map(d => d.type))].join(' · ');
          const n = data.filter(d => d.color === f.color).length;
          showTip(evt, `<strong>${f.label}</strong><br>${n} predictores<br><span style="color:#a8a8a4">${types}</span><br><span style="color:#7dd8b5">click para ${selectedFamily === f.color ? 'ver todos' : 'aislar familia'}</span>`);
        })
        .on('mousemove', evt => {
          d3.select('#tooltip')
            .style('left', (evt.clientX + 12) + 'px')
            .style('top', (evt.clientY - 12) + 'px');
        })
        .on('mouseleave', hideTip);
    }

    // hover en burbujas
    g.selectAll('circle.node')
      .on('mouseenter', function (evt, d) {
        d3.select(this)
          .transition().duration(120)
          .attr('r', isDim(d) ? baseR : hoverR)
          .attr('opacity', isDim(d) ? 0.35 : 1);
        showTip(evt, `<strong>${d.name}</strong><br>Tipo: ${d.type}<br>${d.note}`);
      })
      .on('mousemove', evt => {
        d3.select('#tooltip')
          .style('left', (evt.clientX + 12) + 'px')
          .style('top', (evt.clientY - 12) + 'px');
      })
      .on('mouseleave', function (evt, d) {
        d3.select(this)
          .transition().duration(120)
          .attr('r', baseR + (d.name.length > 18 ? 3 : 0))
          .attr('opacity', isDim(d) ? 0.12 : 0.85);
        hideTip();
      });
  }

  render();
  const cleanup = watchResize(container, render);
  window.addEventListener('beforeunload', () => cleanup && cleanup(), { once: true });
}
