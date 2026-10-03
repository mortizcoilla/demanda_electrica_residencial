// ===========================================================
// charts/mape.js — Benchmarks de MAPE + filtros de referencia y familia
// Responsivo: re-renderiza al cambiar el ancho del contenedor.
// ===========================================================

import { C, showTip, hideTip, watchResize, chartWidth, isCompact, isTablet } from '../utils.js';

export function initMapeChart(DATA) {
  const svg = d3.select('#chart-mape');
  const container = svg.node().parentElement;
  const M = DATA.benchmarks;
  const data = M.datos;
  const MAPE_FAMILY_LABELS = M.metadata.familia_leyenda;
  const MAPE_FAMILY_COLORS = M.metadata.familia_color;

  let activeRef = 'all';
  let activeFamily = 'all';
  let activeSort = 'desc';

  // --- Toggle de ordenamiento (Mayor/Menor MAPE), inyectado junto a los filtros ---
  if (!document.getElementById('mapeSortFilter')) {
    const countEl = document.getElementById('mapeCount');
    if (countEl) {
      const lbl = document.createElement('span');
      lbl.className = 'ctrl-label';
      lbl.style.marginLeft = '12px';
      lbl.textContent = 'Orden:';
      const grp = document.createElement('div');
      grp.className = 'ctrl-group';
      grp.id = 'mapeSortFilter';
      grp.innerHTML =
        '<button class="ctrl-btn active" data-sort="desc">Mayor MAPE</button>' +
        '<button class="ctrl-btn" data-sort="asc">Menor MAPE</button>';
      countEl.parentElement.insertBefore(lbl, countEl);
      countEl.parentElement.insertBefore(grp, countEl);
      grp.querySelectorAll('.ctrl-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          grp.querySelectorAll('.ctrl-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          activeSort = btn.getAttribute('data-sort');
          render();
        });
      });
    }
  }

  function computeLayout() {
    const W = chartWidth(container, 980);
    const compact = isCompact(W);
    const tablet  = isTablet(W);
    // En compact: el margin.left se reduce drásticamente y las etiquetas de
    // método se acortan o se ocultan, y la leyenda lateral se mueve abajo.
    // En tablet: el margin.left es intermedio y la leyenda también va abajo.
    const margin = compact
      ? { top: 30, right: 16, bottom: 56, left: 160 }
      : tablet
        ? { top: 30, right: 16, bottom: 32, left: 270 }
        : { top: 30, right: 220, bottom: 40, left: 320 };
    return { W, H: 480, margin, innerW: W - margin.left - margin.right, compact, tablet };
  }

  function render() {
    const { W, H, margin, innerW, compact, tablet } = computeLayout();
    const innerH = H - margin.top - margin.bottom;

    svg
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');
    svg.selectAll('*').remove();

    const root = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    const filtered = data
      .filter(d => {
        const refOk = activeRef === 'all' || (activeRef === 'latam' && d.latam);
        const famOk = activeFamily === 'all' || d.type === activeFamily;
        return refOk && famOk;
      })
      .sort((a, b) => activeSort === 'desc' ? b.mape - a.mape : a.mape - b.mape);

    // dynamic height based on filtered count + legend wrap
    const itemH = compact ? 32 : 38;
    const baseH = Math.max(180, Math.min(480, filtered.length * itemH + 40));
    // Reservar más espacio si la leyenda va a ocupar 2 líneas (solo en compact)
    const needsWrapLegend = compact;
    const dynamicH = baseH + (needsWrapLegend ? 24 : 0);
    const localInnerH = dynamicH - margin.top - margin.bottom;
    svg.attr('viewBox', `0 0 ${W} ${dynamicH}`);

    const fsStudy  = compact ? 10.5 : 12.5;
    const fsMethod = compact ? 9    : 11;
    const fsValue  = compact ? 10   : 12;
    const fsAxis   = compact ? 9.5  : 11;
    const fsLegend = compact ? 10   : 12;
    const fsLegendH= compact ? 10   : 11;
    const xTickMax = compact ? 4    : 5;

    const y = d3.scaleBand().domain(filtered.map(d => d.study + '|' + d.method)).range([0, localInnerH]).padding(0.18);
    const x = d3.scaleLinear().domain([0, 10]).range([0, innerW]);

    // grid
    root.append('g').selectAll('line')
      .data(x.ticks(xTickMax)).enter().append('line')
      .attr('x1', d => x(d)).attr('x2', d => x(d))
      .attr('y1', 0).attr('y2', localInnerH)
      .attr('stroke', C.lineSoft);

    // threshold at 5%
    root.append('line')
      .attr('x1', x(5)).attr('x2', x(5))
      .attr('y1', 0).attr('y2', localInnerH)
      .attr('stroke', C.slate2).attr('stroke-dasharray', '3,3').attr('stroke-width', 1);
    root.append('text').attr('x', x(5)).attr('y', -10)
      .attr('font-size', fsAxis).attr('fill', C.ink4).attr('text-anchor', 'middle')
      .text(compact ? 'Umbral 5%' : 'Umbral 5% MAPE');

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
      .attr('font-size', fsValue).attr('font-weight', 600).attr('fill', C.ink)
      .text(d => d.mape.toFixed(2) + '%');

    // y axis labels (study / method)
    root.selectAll('text.lbl').data(filtered).enter().append('text')
      .attr('class', 'lbl')
      .attr('x', -10)
      .attr('y', d => y(d.study + '|' + d.method) + y.bandwidth() / 2 - (compact ? 1 : 2))
      .attr('text-anchor', 'end')
      .attr('font-size', fsStudy).attr('font-weight', 500).attr('fill', C.ink)
      .text(d => {
        // Truncar nombres largos en modo compact para que no se salga del margin
        if (!compact) return d.study;
        const max = 22;
        return d.study.length > max ? d.study.slice(0, max - 1) + '…' : d.study;
      });
    // method + horiz subtitle — solo si hay espacio
    if (!compact) {
      root.selectAll('text.method').data(filtered).enter().append('text')
        .attr('class', 'method')
        .attr('x', -10)
        .attr('y', d => y(d.study + '|' + d.method) + y.bandwidth() / 2 + 14)
        .attr('text-anchor', 'end')
        .attr('font-size', fsMethod).attr('fill', C.ink3)
        .text(d => `${d.method} · ${d.horiz}`);
    }

    // x axis
    root.append('g').attr('transform', `translate(0, ${localInnerH})`)
      .call(d3.axisBottom(x).ticks(xTickMax).tickFormat(d => d + '%').tickSize(0))
      .call(g => g.select('.domain').attr('stroke', C.line))
      .call(g => g.selectAll('text').attr('fill', C.ink3).attr('font-size', fsAxis).attr('dy', 14));

    // side legend (family) — solo visible en desktop; en tablet/compact usamos leyenda horizontal abajo
    const showSideLegend = !compact && !tablet;
    if (showSideLegend) {
      const sideLg = svg.append('g').attr('transform', `translate(${margin.left + innerW + 20}, ${margin.top + 8})`);
      sideLg.append('text').attr('font-size', fsLegendH).attr('font-weight', 600).attr('fill', C.ink3)
        .attr('letter-spacing', '0.06em').text('FAMILIA');
      ['classical', 'ml', 'deep', 'ensemble'].forEach((k, i) => {
        const r = sideLg.append('g').attr('transform', `translate(0, ${24 + i * 28})`);
        r.append('rect').attr('width', 14).attr('height', 14).attr('rx', 3).attr('fill', MAPE_FAMILY_COLORS[k]);
        r.append('text').attr('x', 22).attr('y', 11).attr('font-size', fsLegend).attr('fill', C.ink2).text(MAPE_FAMILY_LABELS[k]);
      });
      sideLg.append('text').attr('font-size', fsLegendH).attr('font-weight', 600).attr('fill', C.ink3)
        .attr('letter-spacing', '0.06em').attr('y', 160).text('REFERENCIA');
      sideLg.append('text').attr('font-size', fsLegend).attr('fill', C.ink2).attr('y', 178).text('Opacas = Chile/LATAM');
      sideLg.append('text').attr('font-size', fsLegend).attr('fill', C.ink2).attr('y', 196).text('Claras = otros países');
    } else {
      // Leyenda en formato horizontal debajo del chart, con wrap si no cabe
      const legendY = baseH + 6; // justo debajo del área de bars con padding
      const legend = svg.append('g').attr('transform', `translate(${margin.left}, ${legendY})`);
      const items = [
        { k: 'classical', label: 'Clásico' },
        { k: 'ml',        label: 'ML' },
        { k: 'deep',      label: 'Deep Learning' },
        { k: 'ensemble',  label: 'Ensemble' }
      ];
      const charW = compact ? 6 : 6.5;
      const itemW = (label) => 14 + label.length * charW + 14;
      const totalW = items.reduce((s, it) => s + itemW(it.label), 0);
      const maxW = innerW; // ancho disponible

      if (totalW <= maxW) {
        // Una sola línea
        let cursor = 0;
        items.forEach(it => {
          const g = legend.append('g').attr('transform', `translate(${cursor}, 0)`);
          g.append('rect').attr('width', 10).attr('height', 10).attr('rx', 2).attr('fill', MAPE_FAMILY_COLORS[it.k]);
          g.append('text').attr('x', 14).attr('y', 9).attr('font-size', fsLegend).attr('fill', C.ink2).text(it.label);
          cursor += itemW(it.label);
        });
      } else {
        // Dos líneas: dos items por línea
        for (let i = 0; i < items.length; i += 2) {
          let cursor = 0;
          for (let j = i; j < Math.min(i + 2, items.length); j++) {
            const it = items[j];
            const g = legend.append('g').attr('transform', `translate(${cursor}, ${(i / 2) * 16})`);
            g.append('rect').attr('width', 10).attr('height', 10).attr('rx', 2).attr('fill', MAPE_FAMILY_COLORS[it.k]);
            g.append('text').attr('x', 14).attr('y', 9).attr('font-size', fsLegend).attr('fill', C.ink2).text(it.label);
            cursor += itemW(it.label);
          }
        }
      }
    }

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
  const cleanup = watchResize(container, render);
  window.addEventListener('beforeunload', () => cleanup && cleanup(), { once: true });
}
