"""
scripts/apply_ola2.py — Aplica cambios Ola 2 a index.html y dashboard-internal.html.

Hace 4 transformaciones:
1. Reemplaza el <head> original con el head nuevo (meta + favicon + OG + JSON-LD + Twitter).
2. Reemplaza el footer del público con endnotes + footer con callout de portafolio.
3. Reemplaza el footer del internal con endnotes + footer con callout (sin "© 2026" repetido).
4. En internal, remueve la promesa rota de "bajar el estudio completo en Markdown".
5. En internal, agrega las mismas meta tags + favicon + OG + JSON-LD en el head.

Pensado para correr una vez y commitear. Idempotente: si los marcadores ya están aplicados, no hace nada.
"""

import sys
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX_HTML       = ROOT / "index.html"
INTERNAL_HTML    = ROOT / "dashboard-internal.html"

# ============ NUEVOS HEADs ============

NEW_META_BLOCK = """  <meta name="author" content="Miguel Ortiz C." />
  <meta name="robots" content="index, follow" />
  <meta name="theme-color" content="#0a5847" />
  <meta name="color-scheme" content="light" />
  <meta name="format-detection" content="telephone=no" />
  <link rel="canonical" href="./" />

  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="favicon.svg" />
  <link rel="apple-touch-icon" href="favicon.svg" />

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

  <!-- Open Graph -->
  <meta property="og:type"        content="article" />
  <meta property="og:title"       content="Demanda eléctrica residencial en Chile — Dashboard 2026" />
  <meta property="og:description" content="Estudio integrado con visualizaciones D3.js sobre predicción de demanda eléctrica residencial en Chile: mercado, datos, modelos, implementación." />
  <meta property="og:locale"      content="es_CL" />
  <meta property="og:site_name"   content="Demanda Residencial Chile" />
  <meta property="og:url"         content="./" />
  <meta property="og:image"       content="og-preview.png" />
  <meta property="og:image:width"  content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt"    content="Demanda residencial chilena: 30% del SEN, 7.31M clientes, peak 12.190 MWh/h en ola de calor 2024." />

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="Demanda eléctrica residencial en Chile — Dashboard 2026" />
  <meta name="twitter:description" content="Estudio integrado con visualizaciones D3.js sobre predicción de demanda eléctrica residencial en Chile." />
  <meta name="twitter:image"       content="og-preview.png" />

  <!-- Article meta -->
  <meta property="article:published_time" content="2026-07-21" />
  <meta property="article:modified_time"  content="2026-07-21" />
  <meta property="article:author"         content="Miguel Ortiz C." />
  <meta property="article:section"        content="Energy" />
  <meta property="article:tag"            content="forecasting" />
  <meta property="article:tag"            content="electricity" />
  <meta property="article:tag"            content="chile" />
  <meta property="article:tag"            content="residential" />
  <meta property="article:tag"            content="load forecasting" />

  <!-- JSON-LD: Article estructurado -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Predicción de demanda eléctrica residencial en Chile — Dashboard 2026",
    "description": "Estudio integrado con visualizaciones interactivas D3.js sobre la predicción de demanda eléctrica residencial en Chile: mercado, datos, modelos, implementación y hoja de ruta.",
    "author": {
      "@type": "Person",
      "name": "Miguel Ortiz C.",
      "url": "https://mortizcoilla.vercel.app/",
      "sameAs": [
        "https://linkedin.com/in/mortizcoilla",
        "https://wa.me/56933293943"
      ]
    },
    "publisher": {
      "@type": "Person",
      "name": "Miguel Ortiz C.",
      "url": "https://mortizcoilla.vercel.app/"
    },
    "inLanguage": "es-CL",
    "datePublished": "2026-07-21",
    "dateModified": "2026-07-21",
    "about": [
      { "@type": "Thing", "name": "Forecasting de demanda eléctrica" },
      { "@type": "Thing", "name": "Sistema Eléctrico Nacional de Chile" },
      { "@type": "Thing", "name": "Demanda residencial" }
    ],
    "citation": [
      { "@type": "CreativeWork", "name": "CEN — Reporte anual art. 72-15", "url": "https://www.coordinador.cl/reporte-anual/" },
      { "@type": "CreativeWork", "name": "CNE — Energía Abierta",                "url": "https://energiaabierta.cl/" },
      { "@type": "CreativeWork", "name": "Minenergía — Plan Nacional de Energía", "url": "https://energia.gob.cl/planificacion/" }
    ]
  }
  </script>"""

# Para el internal, el robots es noindex,nofollow
NEW_META_BLOCK_INTERNAL = NEW_META_BLOCK.replace(
    '<meta name="robots" content="index, follow" />',
    '<meta name="robots" content="noindex, nofollow" />'
)

# ============ ENDNOTES + FOOTER UNIFICADO ============

ENDNOTES_AND_FOOTER = """<!-- ============================== ENDNOTES ============================== -->
<section class="section" id="endnotes">
  <div class="wrap">
    <div class="eyebrow"><span class="num">END</span> Fuentes y datos</div>
    <div class="section-head">
      <h2>De dónde sale cada número.</h2>
      <p>Todas las cifras del dashboard son trazables a una fuente primaria. Esta lista resume las fuentes y su rol en el análisis. La metadata completa (URL, fecha de extracción, cobertura) está disponible en <code>data/*.json</code>.</p>
    </div>

    <div class="endnotes-grid mt-6">
      <div class="endnote">
        <div class="en-label">Coordinador</div>
        <div class="en-org">CEN — Coordinador Eléctrico Nacional</div>
        <ul>
          <li><a href="https://www.coordinador.cl/operacion/graficos/" target="_blank" rel="noopener">Gráficos de operación real, demanda horaria</a></li>
          <li><a href="https://www.coordinador.cl/reporte-anual/" target="_blank" rel="noopener">Reporte anual art. 72-15</a></li>
        </ul>
        <div class="en-role">Operación real del SEN, demanda peak, composición de retiros.</div>
      </div>

      <div class="endnote">
        <div class="en-label">Regulador</div>
        <div class="en-org">CNE — Comisión Nacional de Energía</div>
        <ul>
          <li><a href="https://energiaabierta.cl/" target="_blank" rel="noopener">Energía Abierta</a> — facturación, empalmes</li>
          <li><a href="https://energiaabierta.cl/cne/reporte-ernc" target="_blank" rel="noopener">Reporte ERNC y Generación Distribuida</a> (Ley 21.118)</li>
        </ul>
        <div class="en-role">Precios de nudo, Net Billing, proyecciones 2023-2043.</div>
      </div>

      <div class="endnote">
        <div class="en-label">Fiscalización</div>
        <div class="en-org">SEC — Superintendencia de Electricidad y Combustibles</div>
        <ul>
          <li><a href="https://www.sec.cl" target="_blank" rel="noopener">sec.cl</a> — calidad de servicio</li>
        </ul>
        <div class="en-role">SAIDI/SAIFI por comuna, fiscalización, calidad de suministro.</div>
      </div>

      <div class="endnote">
        <div class="en-label">Política</div>
        <div class="en-org">Ministerio de Energía</div>
        <ul>
          <li><a href="https://energia.gob.cl/estudios/encuesta-residencial" target="_blank" rel="noopener">Encuesta residencial y parque de artefactos</a></li>
          <li><a href="https://energia.gob.cl/planificacion/" target="_blank" rel="noopener">Plan Nacional de Energía 2023-2043</a></li>
        </ul>
        <div class="en-role">Penetración AC, decretos tarifarios, planes de expansión.</div>
      </div>

      <div class="endnote">
        <div class="en-label">Clima</div>
        <div class="en-org">CR2 — Centro de Ciencia del Clima y la Resiliencia</div>
        <ul>
          <li><a href="https://www.cr2.cl" target="_blank" rel="noopener">cr2.cl</a> — grilla CR2MET v2.5 (0.05°, 1960–2021+)</li>
        </ul>
        <div class="en-role">Temperatura y precipitación grillada para features de modelo.</div>
      </div>

      <div class="endnote">
        <div class="en-label">Mercado automotriz</div>
        <div class="en-org">ANAC — Asociación Nacional Automotriz de Chile</div>
        <ul>
          <li><a href="https://www.anac.cl/ventas/" target="_blank" rel="noopener">Anuario de ventas</a> — vehículos livianos y medianos</li>
        </ul>
        <div class="en-role">Ventas anuales de BEV, parque acumulado por categoría.</div>
      </div>

      <div class="endnote">
        <div class="en-label">Industria</div>
        <div class="en-org">Empresas Eléctricas A.G.</div>
        <ul>
          <li><a href="https://www.electricas.cl/anuario" target="_blank" rel="noopener">Anuario Empresas Eléctricas</a></li>
        </ul>
        <div class="en-role">Distribución de clientes regulados por distribuidora.</div>
      </div>

      <div class="endnote">
        <div class="en-label">Literatura</div>
        <div class="en-org">Revisión sistemática PRISMA + arXiv + IEEE + Scielo</div>
        <ul>
          <li>30+ papers sobre forecasting de demanda eléctrica (2009–2026)</li>
        </ul>
        <div class="en-role">Benchmarks MAPE de modelos (clásico, ML, deep, ensemble).</div>
      </div>
    </div>
  </div>
</section>

<!-- ============================== FOOTER ============================== -->
<footer>
  <div class="wrap">
    <div class="grid-2">
      <div>
        <h4>Sobre este dashboard</h4>
        <p>Visualización analítica del estudio integrado sobre predicción de demanda eléctrica residencial en Chile. Cobertura 2018–2025, con series de proyección hasta 2043.</p>
        <p class="copy" style="margin-top: 12px">Compilado y publicado en Chile · 2026</p>
      </div>
      <div>
        <h4>Autor</h4>
        <p class="author">Miguel Ortiz C.</p>
        <div class="social-links" style="margin-top: 16px">
          <a class="social-link" href="https://linkedin.com/in/mortizcoilla" target="_blank" rel="noopener" aria-label="LinkedIn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
            LinkedIn
          </a>
          <a class="social-link" href="mailto:mortizcoilla@gmail.com" aria-label="Email">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            Email
          </a>
          <a class="social-link" href="https://wa.me/56933293943" target="_blank" rel="noopener" aria-label="WhatsApp">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
            WhatsApp
          </a>
        </div>
      </div>
    </div>

    <!-- Callout editorial al portafolio — discreto, mismo patrón visual que el byline -->
    <div class="portafolio-callout">
      <span class="pc-label">Más del autor</span>
      <a class="pc-link" href="https://mortizcoilla.vercel.app/" target="_blank" rel="noopener" aria-label="Portafolio completo en mortizcoilla.vercel.app">
        <span class="pc-text">Portafolio</span>
        <svg class="pc-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>
    </div>
  </div>
</footer>"""

# ============ PROMESAS ROTAS A REMOVER ============

# En dashboard-internal.html, la promesa rota está en §10 — el callout dice "bajar el estudio completo
# en Markdown (12 secciones, 4 apéndices, ~230 KB) y el notebook de baseline SARIMAX + LightGBM".
# Lo reemplazamos por una nota honesta que indique que el dashboard es el estudio.

BROKEN_PROMISE_REPLACEMENT = """    <div class="callout mt-8">
      <b>Sobre este documento:</b> este dashboard <b>es</b> el estudio. El archivo <code>index.html</code> contiene las 10 secciones (las 7 públicas más recomendación, hoja de ruta y cierre). La versión interna (<code>dashboard-internal.html</code>) replica el contenido público más las secciones de metodología y roadmap — sin claims de un paper MD separado que no existe en este repo.
    </div>"""


def apply_to_file(path: Path, is_internal: bool):
    print(f"Procesando {path.name}...")
    text = path.read_text(encoding="utf-8")

    # Idempotencia: si ya tiene el callout de portafolio, no hacer nada
    if "portafolio-callout" in text:
        print(f"  {path.name} ya tiene callout portafolio. Saltando.")
        return

    # 1) Reemplazar el head: desde <meta name="description" hasta el <link href="...googleapis...">
    #    con el nuevo bloque meta + favicon + OG + JSON-LD + Twitter, y volver a poner el link de fuentes.
    pattern_head = re.compile(
        r'  <meta name="description" content="[^"]*" />\s*\n'
        r'\s*\n'
        r'  <link rel="preconnect" href="https://fonts\.googleapis\.com" />.*?'
        r'(<link href="https://fonts\.googleapis\.com/css2\?family=Outfit[^"]*" rel="stylesheet" />)',
        re.DOTALL
    )
    new_head = NEW_META_BLOCK if not is_internal else NEW_META_BLOCK_INTERNAL
    replacement_head = new_head + '\n  ' + r'\1'
    new_text, n = pattern_head.subn(replacement_head, text)
    if n == 0:
        print(f"  WARN: no se encontró patrón de head en {path.name}")
    else:
        print(f"  head: {n} reemplazo(s)")
        text = new_text

    # 2) Reemplazar el footer completo (incluyendo lo que viene después de </section> del §7)
    pattern_footer = re.compile(
        r'<!-- ============================== FOOTER ============================== -->\s*\n'
        r'<footer>.*?</footer>',
        re.DOTALL
    )
    new_text, n = pattern_footer.subn(ENDNOTES_AND_FOOTER, text)
    if n == 0:
        print(f"  WARN: no se encontró patrón de footer en {path.name}")
    else:
        print(f"  footer: {n} reemplazo(s)")
        text = new_text

    # 3) En internal: reemplazar la promesa rota
    if is_internal:
        pattern_promise = re.compile(
            r'    <div class="callout mt-8">\s*\n'
            r'      <b>El siguiente paso natural después de leer esto:</b>.*?'
            r'    </div>\s*\n\s*</section>\s*\n\s*<!-- ============================== FOOTER',
            re.DOTALL
        )
        new_text, n = pattern_promise.subn(
            BROKEN_PROMISE_REPLACEMENT + '\n  </div>\n</section>\n\n<!-- ============================== FOOTER',
            text
        )
        if n == 0:
            print(f"  WARN: no se encontró promesa rota en {path.name}")
        else:
            print(f"  promesa rota: {n} reemplazo(s)")
            text = new_text

    path.write_text(text, encoding="utf-8")
    print(f"  {path.name} escrito.")


def main():
    apply_to_file(INDEX_HTML, is_internal=False)
    apply_to_file(INTERNAL_HTML, is_internal=True)
    print("OK")


if __name__ == "__main__":
    main()
