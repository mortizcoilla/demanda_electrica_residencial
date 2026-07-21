"""
scripts/apply_css_v2.py — Anexa estilos del footer Atlas, donut limpio, cono CNE, peak shift.
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSS  = ROOT / "css" / "styles.css"

CSS_BLOCK = """

/* ===========================================================
   FOOTER ATLAS STYLE — 3 bloques separados por reglas
   =========================================================== */
footer {
  padding: clamp(48px, 6vw, 80px) 0 32px;
  background: var(--bg);
  border-top: 1px solid var(--line);
}
.footer-lecturas {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 18px 22px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-left: 4px solid var(--accent);  /* rojo mercantil */
  border-radius: var(--r-md);
  flex-wrap: wrap;
}
.footer-lecturas .fl-text { flex: 1 1 320px; }
.footer-lecturas .fl-eyebrow {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--accent);
  margin-bottom: 4px;
}
.footer-lecturas .fl-body {
  font-family: 'Outfit', serif;
  font-style: italic;
  font-size: 15px;
  color: var(--ink-2);
  margin: 0;
  line-height: 1.5;
}
.footer-lecturas .fl-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  background: var(--ink);
  color: var(--bg);
  border-radius: var(--r-sm);
  text-decoration: none;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  transition: background 180ms var(--ease);
  white-space: nowrap;
}
.footer-lecturas .fl-button:hover {
  background: var(--primary);
  color: #fff;
}

.footer-rule {
  border: 0;
  border-top: 1px solid var(--line);
  margin: 36px 0;
}

.footer-byline {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 32px;
  flex-wrap: wrap;
}
.footer-byline .fb-author { flex: 1 1 280px; }
.footer-byline .fb-eyebrow {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--ink-3);
  margin-bottom: 8px;
}
.footer-byline .fb-name {
  font-family: 'Outfit', serif;
  font-size: 32px;
  font-weight: 600;
  color: var(--ink);
  margin: 0 0 6px 0;
  letter-spacing: -0.02em;
  line-height: 1.1;
}
.footer-byline .fb-bio {
  font-family: 'Outfit', serif;
  font-style: italic;
  font-size: 13.5px;
  color: var(--ink-3);
  margin: 0;
}
.footer-byline .fb-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.footer-byline .fb-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid var(--ink-3);
  border-radius: var(--r-sm);
  color: var(--ink);
  text-decoration: none;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  transition: all 180ms var(--ease);
  background: transparent;
}
.footer-byline .fb-btn:hover {
  background: var(--ink);
  color: var(--bg);
  border-color: var(--ink);
}
.footer-byline .fb-btn svg { flex-shrink: 0; }

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.12em;
  color: var(--ink-3);
  text-transform: uppercase;
}

/* ===========================================================
   DONUT CLEAN — refactor del chart-sector
   - Leyenda con badges de color, valor grande, label
   - Sin overlaps
   - Centrado vertical, ocupa el bloque entero
   =========================================================== */
.sector-clean {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  align-items: center;
  padding: 8px 0;
}
.sector-clean .sc-chart { min-height: 280px; }
.sector-clean .sc-legend {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.sector-clean .sc-item {
  display: grid;
  grid-template-columns: 14px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  transition: all 180ms var(--ease);
}
.sector-clean .sc-item:hover {
  border-color: var(--ink-3);
  background: var(--surface);
}
.sector-clean .sc-swatch {
  width: 14px; height: 14px;
  border-radius: 3px;
}
.sector-clean .sc-label {
  font-size: 13.5px;
  color: var(--ink);
  font-weight: 500;
  line-height: 1.3;
}
.sector-clean .sc-label .sc-sub {
  display: block;
  font-size: 11.5px;
  color: var(--ink-3);
  margin-top: 2px;
  font-weight: 400;
}
.sector-clean .sc-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 18px;
  font-weight: 600;
  color: var(--ink);
  text-align: right;
}
@media (max-width: 640px) {
  .sector-clean { grid-template-columns: 1fr; }
}

/* ===========================================================
   CONO CNE 3 escenarios 2023-2043
   - Tres líneas: Medio, Alto, Alto+H2V
   - Banda sombreada del rango entre Medio y Alto
   - Anotaciones: H2V 86 TWh, electromovilidad +10.5 TWh
   - Eje X: años, Eje Y: TWh
   =========================================================== */
.cono-cne {
  margin-top: 12px;
}
.cono-cne .cc-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  margin-bottom: 24px;
}
.cono-cne .cc-stat {
  padding: 16px 18px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
}
.cono-cne .cc-stat .cc-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--ink-3);
  margin-bottom: 6px;
}
.cono-cne .cc-stat .cc-value {
  font-family: 'Outfit', serif;
  font-size: 28px;
  font-weight: 600;
  color: var(--ink);
  line-height: 1;
  margin-bottom: 4px;
}
.cono-cne .cc-stat .cc-unit {
  font-size: 14px;
  color: var(--ink-3);
  font-weight: 400;
  margin-left: 2px;
}
.cono-cne .cc-stat .cc-sub {
  font-size: 11.5px;
  color: var(--ink-3);
}
.cono-cne .cc-legend {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-top: 12px;
  flex-wrap: wrap;
  font-size: 11.5px;
  color: var(--ink-2);
  font-family: 'JetBrains Mono', monospace;
}
.cono-cne .cc-legend .cc-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.cono-cne .cc-legend .cc-sw {
  width: 18px; height: 3px;
  border-radius: 2px;
}
.cono-cne .cc-legend .cc-band {
  width: 18px; height: 12px;
  background: linear-gradient(to right, rgba(10,88,71,0.12), rgba(176,102,63,0.18));
  border: 1px dashed var(--ink-3);
  border-radius: 2px;
}

/* ===========================================================
   PEAK SHIFT CHART — peak horario SEN 2010-2026 con mes
   - Line chart de peak anual
   - Dots coloreados por estación (invierno/verano)
   - Anotaciones de eventos: COVID, olas calor, H2V
   =========================================================== */
.peak-shift-callouts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 18px;
}
.peak-shift-callouts .ps-stat {
  padding: 12px 14px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  border-left: 3px solid var(--primary);
}
.peak-shift-callouts .ps-stat.warn { border-left-color: var(--accent); }
.peak-shift-callouts .ps-stat .ps-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--ink-3);
  margin-bottom: 4px;
}
.peak-shift-callouts .ps-stat .ps-value {
  font-family: 'Outfit', serif;
  font-size: 22px;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.1;
}
.peak-shift-callouts .ps-stat .ps-sub {
  font-size: 11px;
  color: var(--ink-3);
  margin-top: 2px;
}

/* ===========================================================
   Filling empty space — callouts editoriales tipo Atlas
   - Tarjetas de "dato duro" para llenar huecos en §1
   - Mini-charts inline
   =========================================================== */
.empty-filler {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-top: 16px;
}
.empty-filler .ef-cell {
  padding: 14px 16px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
}
.empty-filler .ef-cell .ef-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--ink-3);
  margin-bottom: 4px;
}
.empty-filler .ef-cell .ef-value {
  font-family: 'Outfit', serif;
  font-size: 22px;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.1;
}
.empty-filler .ef-cell .ef-sub {
  font-size: 11px;
  color: var(--ink-3);
  margin-top: 4px;
}
"""


def main():
    current = CSS.read_text(encoding="utf-8")
    if "footer-lecturas" in current and "cono-cne" in current:
        print("CSS ya tiene los estilos nuevos. Saltando.")
        return
    new = current + CSS_BLOCK
    CSS.write_text(new, encoding="utf-8")
    print(f"OK: {CSS} ahora tiene {len(new.splitlines())} líneas")


if __name__ == "__main__":
    main()
