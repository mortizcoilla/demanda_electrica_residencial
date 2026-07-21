// ===========================================================
// controls.js — Navegación, menú móvil, back-to-top, active section
// ===========================================================

const SELECTORS = {
  nav:        'nav.top',
  links:      'nav.top .links a, .nav-drawer .nav-list a',
  toggle:     '.nav-toggle',
  drawer:     '#navDrawer',
  backdrop:   '#navDrawerBackdrop',
  drawerClose:'.nav-drawer-close',
  backToTop:  '.back-to-top',
  sections:   'section.section[id]'
};

/** Scroll suave al hacer click en links de navegación interna. */
export function initNavigation() {
  const navEl = document.querySelector(SELECTORS.nav);
  const navH = () => navEl?.offsetHeight || 0;

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href === '#' || href.length < 2) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - navH() - 12;
      window.scrollTo({ top, behavior: 'smooth' });
      // Cerrar drawer móvil si está abierto
      closeNavDrawer();
    });
  });

  initMobileMenu();
  initActiveSection();
  initBackToTop();
  initNavScrollState();
}

/** Menú hamburguesa — drawer lateral con backdrop. */
function initMobileMenu() {
  const toggle   = document.querySelector(SELECTORS.toggle);
  const drawer   = document.querySelector(SELECTORS.drawer);
  const backdrop = document.querySelector(SELECTORS.backdrop);
  const closeBtn = document.querySelector(SELECTORS.drawerClose);
  if (!toggle || !drawer) return;

  const open = () => {
    document.body.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
  };
  const close = () => {
    document.body.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
  };

  toggle.addEventListener('click', () => {
    document.body.classList.contains('nav-open') ? close() : open();
  });
  backdrop?.addEventListener('click', close);
  closeBtn?.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('nav-open')) close();
  });
  // Cerrar al cambiar a desktop
  const mq = window.matchMedia('(min-width: 769px)');
  mq.addEventListener?.('change', (e) => { if (e.matches) close(); });
}

function closeNavDrawer() {
  document.body.classList.remove('nav-open');
  document.querySelector(SELECTORS.toggle)?.setAttribute('aria-expanded', 'false');
  document.querySelector(SELECTORS.drawer)?.setAttribute('aria-hidden', 'true');
}

/** Resalta el link de la sección actualmente visible. */
function initActiveSection() {
  const links = Array.from(document.querySelectorAll(SELECTORS.links));
  if (!links.length) return;

  const sections = links
    .map(l => document.querySelector(l.getAttribute('href')))
    .filter(Boolean);

  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      links.forEach(l => {
        const isActive = l.getAttribute('href') === '#' + id;
        l.classList.toggle('is-active', isActive);
      });
    });
  }, {
    rootMargin: '-30% 0px -55% 0px',
    threshold: 0
  });

  sections.forEach(s => observer.observe(s));
}

/** Botón "volver arriba" — aparece tras scrollear. */
function initBackToTop() {
  const btn = document.querySelector(SELECTORS.backToTop);
  if (!btn) return;

  const toggle = () => {
    btn.classList.toggle('is-visible', window.scrollY > 600);
  };
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  window.addEventListener('scroll', toggle, { passive: true });
  toggle();
}

/** Añade clase cuando el nav sale del top — afina la línea inferior. */
function initNavScrollState() {
  const nav = document.querySelector(SELECTORS.nav);
  if (!nav) return;
  const update = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}
