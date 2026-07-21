"""
scripts/apply_internal_head.py — Aplica el head nuevo y la promesa rota a dashboard-internal.html.

A diferencia de apply_ola2.py, este script:
1. Reemplaza el <head> del internal con el head nuevo (incluye noindex,nofollow).
2. Reemplaza la promesa rota de "bajar el estudio en MD" con la nota honesta.
"""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INTERNAL_HTML = ROOT / "dashboard-internal.html"

NEW_HEAD_BLOCK = """  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Predicción de demanda eléctrica residencial en Chile — Dashboard 2026 [INTERNAL]</title>
  <meta name="description" content="Vista interna completa (local only) del estudio integrado. Incluye recomendación metodológica, hoja de ruta y conclusiones. NO desplegar." />
  <meta name="robots" content="noindex, nofollow" />

  <meta name="author" content="Miguel Ortiz C." />
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

  <!-- Open Graph (internal no se publica, pero dejamos los tags para consistencia) -->
  <meta property="og:type"        content="article" />
  <meta property="og:title"       content="Demanda eléctrica residencial en Chile — Dashboard 2026 [INTERNAL]" />
  <meta property="og:description" content="Vista interna completa del estudio integrado sobre predicción de demanda eléctrica residencial en Chile." />
  <meta property="og:locale"      content="es_CL" />
  <meta property="og:site_name"   content="Demanda Residencial Chile" />
  <meta property="og:url"         content="./" />
  <meta property="og:image"       content="og-preview.png" />

  <!-- JSON-LD: Article estructurado (mismo que público) -->
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
    "dateModified": "2026-07-21"
  }
  </script>"""

BROKEN_PROMISE_REPLACEMENT = """<div class="callout mt-8">
      <b>Sobre este documento:</b> este dashboard <b>es</b> el estudio. El archivo <code>index.html</code> contiene las 10 secciones (las 7 públicas más recomendación, hoja de ruta y cierre). La versión interna (<code>dashboard-internal.html</code>) replica el contenido público más las secciones de metodología y roadmap — sin claims de un paper MD separado que no existe en este repo.
    </div>"""


def main():
    text = INTERNAL_HTML.read_text(encoding="utf-8")
    print(f"Tamaño inicial: {len(text)} chars")

    # 1) Reemplazar el head: desde <!doctype html> hasta el <link rel="stylesheet" href="css/styles.css" />
    #    con un head nuevo que incluye robots: noindex,nofollow, favicon, OG, JSON-LD.
    pattern_head = re.compile(
        r'<!doctype html>\s*\n'
        r'<html lang="es">\s*\n'
        r'<head>\s*\n'
        r'  <meta charset="utf-8" />\s*\n'
        r'  <meta name="viewport" content="width=device-width,initial-scale=1" />\s*\n'
        r'  <title>[^<]*</title>\s*\n'
        r'  <meta name="description" content="[^"]*" />\s*\n'
        r'  <meta name="robots" content="noindex, nofollow" />\s*\n'
        r'\s*\n'
        r'  <link rel="preconnect" href="https://fonts\.googleapis\.com" />\s*\n'
        r'  <link rel="preconnect" href="https://fonts\.gstatic\.com" crossorigin />\s*\n'
        r'  <link href="https://fonts\.googleapis\.com/css2\?family=Outfit[^"]*" rel="stylesheet" />\s*\n'
        r'\s*\n'
        r'  <script src="https://cdn\.jsdelivr\.net/npm/d3@7\.9\.0/dist/d3\.min\.js"></script>\s*\n'
        r'  <link rel="stylesheet" href="css/styles\.css" />\s*\n'
        r'(  <style>.*?</style>\s*\n)?'   # opcional: bloque <style> extra del internal
        r'</head>',
        re.DOTALL
    )
    new_text, n = pattern_head.subn(NEW_HEAD_BLOCK + "\n</head>", text)
    if n == 0:
        print("WARN: no se encontró patrón de head")
    else:
        print(f"head: {n} reemplazo(s)")
        text = new_text

    # 2) Reemplazar la promesa rota
    pattern_promise = re.compile(
        r'<div class="callout mt-8">\s*\n'
        r'\s*<b>El siguiente paso natural después de leer esto:</b>.*?'
        r'\s*</div>',
        re.DOTALL
    )
    new_text, n = pattern_promise.subn(BROKEN_PROMISE_REPLACEMENT, text)
    if n == 0:
        print("WARN: no se encontró promesa rota")
    else:
        print(f"promesa rota: {n} reemplazo(s)")
        text = new_text

    INTERNAL_HTML.write_text(text, encoding="utf-8")
    print(f"Tamaño final: {len(text)} chars")
    print("OK")


if __name__ == "__main__":
    main()
