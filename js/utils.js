// ===========================================================
// utils.js — Helpers compartidos por todos los charts
// (D3 se carga como global en index.html; este archivo solo
// expone utilities, no usa imports)
// ===========================================================

/** Paleta de colores del dashboard (sincronizada con vars en styles.css). */
export const C = {
  primary:     '#0d6b54',
  primary2:    '#14a37f',
  primarySoft: '#e6f4ee',
  accent:      '#c97b3f',
  accentSoft:  '#fbeede',
  indigo:      '#4f5dde',
  amber:       '#d49a1c',
  rose:        '#b85b5b',
  slate:       '#475569',
  slate2:      '#94a3b8',
  ink:         '#14171e',
  ink2:        '#3a4256',
  ink3:        '#6b7280',
  ink4:        '#9ca3af',
  line:        '#e7e7e3',
  lineSoft:    '#f0eeea'
};

/** Tooltip global compartido por todos los charts. */
const tooltip = d3.select('#tooltip');

/** Mostrar tooltip en posición del cursor. */
export function showTip(evt, html) {
  tooltip
    .html(html)
    .style('left', (evt.clientX + 12) + 'px')
    .style('top', (evt.clientY - 12) + 'px')
    .style('opacity', 1);
}

/** Ocultar tooltip. */
export function hideTip() {
  tooltip.style('opacity', 0);
}

/** Formateador numérico: 12345.678 → "12,345.68". */
export function fmt(n, d = 0) {
  return d3.format(',.' + d + 'f')(n);
}
