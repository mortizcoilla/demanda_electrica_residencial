"""
scripts/apply_footer_v2.py — Aplica el footer estilo Atlas_Mercado_Electrico.

Estructura nueva (3 bloques):
1. LECTURAS ADICIONALES — callout con eyebrow rojo + serif italic + boton portafolio
2. DESARROLLADO POR — autor en serif + 3 botones outlined con border
3. BOTTOM LINE — titulo del proyecto + "Compilado y publicado en Chile"

Reemplaza el footer completo desde <!-- ============================== FOOTER ============================== --> hasta </footer>.
"""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX_HTML       = ROOT / "index.html"
INTERNAL_HTML    = ROOT / "dashboard-internal.html"

NEW_FOOTER = """<!-- ============================== FOOTER ATLAS STYLE ============================== -->
<footer>
  <div class="wrap">

    <!-- ===== Bloque 1: Lecturas adicionales (callout editorial) ===== -->
    <div class="footer-lecturas">
      <div class="fl-text">
        <div class="fl-eyebrow">LECTURAS ADICIONALES</div>
        <p class="fl-body">Otros estudios, dashboards y notas técnicas del autor en su portafolio profesional.</p>
      </div>
      <a class="fl-button" href="https://mortizcoilla.vercel.app/" target="_blank" rel="noopener" aria-label="Portafolio completo en mortizcoilla.vercel.app">
        <span>Portafolio</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>
    </div>

    <hr class="footer-rule" />

    <!-- ===== Bloque 2: Desarrollado por ===== -->
    <div class="footer-byline">
      <div class="fb-author">
        <div class="fb-eyebrow">DESARROLLADO POR</div>
        <h3 class="fb-name">Miguel Ortiz C.</h3>
        <p class="fb-bio">Análisis y edición · julio 2026</p>
      </div>
      <div class="fb-buttons">
        <a class="fb-btn" href="https://linkedin.com/in/mortizcoilla" target="_blank" rel="noopener" aria-label="LinkedIn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
          <span>LinkedIn</span>
        </a>
        <a class="fb-btn" href="mailto:mortizcoilla@gmail.com" aria-label="Email">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          <span>Email</span>
        </a>
        <a class="fb-btn" href="https://wa.me/56933293943" target="_blank" rel="noopener" aria-label="WhatsApp">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
          <span>WhatsApp</span>
        </a>
      </div>
    </div>

    <hr class="footer-rule" />

    <!-- ===== Bloque 3: Bottom line ===== -->
    <div class="footer-bottom">
      <div class="fb-left">Atlas de Demanda Residencial Chile · v2026Q3 · Datos públicos primarios</div>
      <div class="fb-right">Compilado y publicado en Chile</div>
    </div>

  </div>
</footer>"""


def main():
    for path, label in [(INDEX_HTML, "público"), (INTERNAL_HTML, "internal")]:
        text = path.read_text(encoding="utf-8")

        # Idempotencia
        if "footer-lecturas" in text:
            print(f"  {label}: ya tiene footer Atlas style. Saltando.")
            continue

        # Reemplazar TODO el bloque del footer: desde el comment header hasta </footer>
        # Captura el header que usé en Ola 2 ("<!-- ============================== FOOTER ============================== -->")
        # o el header que ya tenía el dashboard antes ("<!-- ============================== ENDNOTES" o similar).
        pattern_footer = re.compile(
            r'<!-- =+ FOOTER[A-Z =]+-->\s*\n'
            r'<footer>.*?</footer>',
            re.DOTALL
        )
        new_text, n = pattern_footer.subn(NEW_FOOTER, text)
        if n == 0:
            # fallback: el header original del dashboard era más simple
            pattern_footer2 = re.compile(
                r'<footer>.*?</footer>',
                re.DOTALL
            )
            new_text, n = pattern_footer2.subn(NEW_FOOTER, text)
            if n == 0:
                print(f"  {label}: WARN — no se encontró <footer>")
                continue
            else:
                print(f"  {label}: footer reemplazado (fallback, {n} match)")
        else:
            print(f"  {label}: footer reemplazado ({n} match)")

        path.write_text(new_text, encoding="utf-8")
        print(f"  {label}: escrito ({len(new_text)} chars)")


if __name__ == "__main__":
    main()
