"""
src/build_og_preview.py — Genera og-preview.png (1200x630) para Open Graph.

Diseño coherente con el dashboard (warm cream + verde profundo + terracota).
Reconstruye los KPIs del hero con tipografía editorial.

Uso: python src/build_og_preview.py
Requiere: Pillow (PIL)
"""

from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("ERROR: Pillow no instalado. Ejecuta: pip install Pillow")
    raise SystemExit(1)

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "og-preview.png"

W, H = 1200, 630
BG       = (250, 249, 246)   # paper cream
INK      = (12, 15, 23)      # ink
INK2     = (44, 51, 64)
INK3     = (91, 99, 115)
PRIMARY  = (10, 88, 71)      # verde profundo
ACCENT   = (176, 102, 63)    # terracota
INDIGO   = (64, 72, 184)
AMBER    = (184, 138, 28)
LINE     = (230, 226, 216)


def font(size, bold=False, mono=False):
    """Carga fuente del sistema. Windows incluye Segoe UI, JetBrains Mono, Georgia."""
    candidates = []
    if mono:
        candidates = [
            r"C:\Windows\Fonts\consola.ttf",
            r"C:\Windows\Fonts\cour.ttf",
            r"C:\Users\morti\AppData\Local\Microsoft\Windows Fonts\JetBrainsMono-Regular.ttf",
        ]
    elif bold:
        candidates = [
            r"C:\Windows\Fonts\segoeuib.ttf",
            r"C:\Windows\Fonts\georgiab.ttf",
            r"C:\Windows\Fonts\arialbd.ttf",
        ]
    else:
        candidates = [
            r"C:\Windows\Fonts\segoeui.ttf",
            r"C:\Windows\Fonts\georgia.ttf",
            r"C:\Windows\Fonts\arial.ttf",
        ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def main():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    # Borde superior de 8px en primary
    d.rectangle([(0, 0), (W, 8)], fill=PRIMARY)

    # Marca pequeña arriba a la izquierda
    d.text((60, 32), "ATLAS · DEMANDA RESIDENCIAL · CHILE", font=font(11, mono=True), fill=INK3)

    # Título
    d.text((60, 70), "Predecir la demanda eléctrica", font=font(56, bold=True), fill=INK)
    d.text((60, 132), "residencial en Chile:", font=font(56, bold=True), fill=INK)
    d.text((60, 196), "qué cambia, qué medir,", font=font(56, bold=True), fill=PRIMARY)
    d.text((60, 258), "qué construir.", font=font(56, bold=True), fill=PRIMARY)

    # Subtítulo
    d.text((60, 332), "≈ 85 TWh al año, 7.31M clientes regulados, peak 12,190 MWh/h en ola de calor 2024.", font=font(18), fill=INK2)
    d.text((60, 358), "Visualización analítica con 6 charts D3.js, datos trazables, 7 datasets públicos.", font=font(18), fill=INK2)

    # Mini-chart de barras en la derecha (peak demand 2018-2025)
    chart_x, chart_y = 760, 100
    chart_w, chart_h = 380, 220
    peaks = [10700, 10920, 10500, 11100, 11500, 11820, 12190, 12400]
    years = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]
    maxv = max(peaks)
    barW = (chart_w - 60) / len(peaks)
    for i, (y, v) in enumerate(zip(years, peaks)):
        h = (v / maxv) * (chart_h - 30)
        x = chart_x + 30 + i * barW + 4
        top = chart_y + chart_h - h
        c = ACCENT if i >= 4 else PRIMARY  # verano en rojo, invierno en verde
        d.rectangle([(x, top), (x + barW - 8, chart_y + chart_h)], fill=c)
    # eje
    d.line([(chart_x + 30, chart_y + chart_h), (chart_x + chart_w, chart_y + chart_h)], fill=LINE, width=2)
    d.text((chart_x, chart_y + chart_h + 8), "Peak horario SEN 2018–2025 (MWh/h)", font=font(11, mono=True), fill=INK3)

    # Footer con autor
    d.line([(60, 530), (W - 60, 530)], fill=LINE, width=1)
    d.text((60, 548), "Miguel Ortiz C.", font=font(16, bold=True), fill=INK)
    d.text((60, 570), "mortizcoilla.vercel.app", font=font(13, mono=True), fill=INK3)

    d.text((W - 60, 548), "Julio 2026", font=font(13, mono=True), fill=INK3, anchor="rt")
    d.text((W - 60, 570), "github.com/mortizcoilla/demanda_electrica_residencial", font=font(12, mono=True), fill=INK3, anchor="rt")

    img.save(OUT, "PNG", optimize=True)
    print(f"OK: {OUT}  ({OUT.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
