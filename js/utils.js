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
  lineSoft:    '#f0eeea',
  lineStrong:  '#c9c7c0'
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

/**
 * Observa cambios de tamaño del contenedor de un chart y re-renderiza
 * con un callback. Usa ResizeObserver cuando está disponible,
 * con fallback a window resize. Debounceado a ~120ms.
 *
 * @param {Element} el   - Elemento DOM a observar (típicamente el chart-block).
 * @param {Function} fn  - Función a invocar en cada cambio de tamaño.
 * @returns {Function}   - Cleanup para desconectar el observer.
 */
export function watchResize(el, fn) {
  if (!el) return () => {};
  let timer = null;
  const run = () => {
    clearTimeout(timer);
    timer = setTimeout(fn, 120);
  };
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(run);
    ro.observe(el);
    return () => ro.disconnect();
  }
  window.addEventListener('resize', run, { passive: true });
  return () => window.removeEventListener('resize', run);
}

/**
 * Devuelve el ancho actual del contenedor de un chart en píxeles,
 * con fallback al ancho de la ventana si el contenedor aún no está medido.
 *
 * @param {Element} container
 * @param {number} fallback
 * @returns {number}
 */
export function chartWidth(container, fallback = 800) {
  if (!container) return fallback;
  const w = container.clientWidth || container.getBoundingClientRect().width;
  return w > 0 ? w : fallback;
}

/** Breakpoints compartidos (px). */
export const BP = {
  mobile:  480,
  tablet:  768,
  desktop: 1024
};

/** Devuelve true si el ancho indica pantalla móvil/tablet pequeña. */
export function isCompact(w) {
  return w < BP.tablet;
}

/** Devuelve true si el ancho indica tablet (entre mobile y desktop). */
export function isTablet(w) {
  return w >= BP.tablet && w < BP.desktop;
}
