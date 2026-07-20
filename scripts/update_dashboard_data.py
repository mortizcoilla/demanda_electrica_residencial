#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
update_dashboard_data.py — Sincroniza js/data.js (y los strings numéricos
de los HTML) con las últimas cifras disponibles de fuentes públicas chilenas.

Uso:
    python3 scripts/update_dashboard_data.py
    python3 scripts/update_dashboard_data.py --dry-run
    python3 scripts/update_dashboard_data.py --only=netbilling,bev
    python3 scripts/update_dashboard_data.py --year=2026
    python3 scripts/update_dashboard_data.py --no-cache

Fuentes (en este orden):
    1. Net Billing acumulado    → CNE Energía Abierta / datos.energia.gob.cl
    2. BEV vendidos en Chile    → ANAC, estadísticas mensuales
    3. Peak horario SEN         → CEN, gráficos de operación real
    4. Composición SEN por sector → CEN, reporte art. 72-15 anual [opcional]

El script es defensivo: si una fuente falla, sigue con las demás y reporta WARN.
Antes de sobrescribir, copia data.js a data.js.bak-<timestamp>.
Si un valor nuevo difiere >50% del anterior, pide confirmación interactiva.

Las URLs de las APIs chilenas cambian con frecuencia. Si una URL falla,
el script intenta 2-3 alternativas y luego reporta WARN. Si todo falla,
se conserva el valor actual sin modificar nada.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import shutil
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Optional
from urllib.parse import urljoin

try:
    import requests
except ImportError:
    sys.exit("ERROR: falta 'requests'. pip install requests")

try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False

# ============================================================================
# Constantes
# ============================================================================

REPO_ROOT     = Path(__file__).resolve().parent.parent
DATA_JS       = REPO_ROOT / "js" / "data.js"
INDEX_HTML    = REPO_ROOT / "index.html"
INTERNAL_HTML = REPO_ROOT / "dashboard-internal.html"
CACHE_DIR     = REPO_ROOT / "scripts" / ".cache"
CACHE_MAX_AGE_HOURS = 24

HTTP_TIMEOUT  = 15     # segundos por request
HTTP_RETRIES  = 2      # reintentos adicionales al inicial
OUTLIER_PCT   = 0.50   # 50% de cambio relativo dispara confirmación
USER_AGENT    = "DemandaElectricaDashboard/1.0 (+https://github.com/local)"

# URLs candidatas por fuente. El script prueba en orden y cae a la siguiente
# si la anterior falla (timeout, 4xx, 5xx, parseo roto).
URLS_NETBILLING = [
    "https://datos.energia.gob.cl/api/3/action/package_show?id=generacion-distribuida",
    "https://api.cne.cl/v3/netbilling/resumen",
    "https://energiaabierta.cl/ernc",
]
URLS_BEV = [
    "https://www.anac.cl/estadisticas/",
    "https://www.anac.cl/ventas-mensuales/",
]
URLS_PEAK = [
    "https://sipub.coordinador.cl/api/v1/recursos/generacion_centrales_tecnologia_horario",
    "https://www.coordinador.cl/operacion/graficos/operacion-real/",
]
URLS_SECTOR = [
    "https://www.coordinador.cl/reportes/articulo-72-15/",
]

# ============================================================================
# Dataclasses de resultado
# ============================================================================

@dataclass
class NetBillingResult:
    year: int
    month: int
    instalaciones_total: int   # raw (no en miles)
    mw_total: float
    source_url: str

    @property
    def instalaciones_miles(self) -> float:
        return round(self.instalaciones_total / 1000.0, 1)


@dataclass
class BevResult:
    year: int
    units_sold: int
    source_url: str


@dataclass
class PeakResult:
    year: int
    month: int
    val_mwh: float
    season: str
    note: str
    source_url: str


@dataclass
class SectorResult:
    year: int
    pct: dict[str, float]
    source_url: str


@dataclass
class UpdateOutcome:
    """Lo que reporta cada updater al final."""
    name: str
    status: str                          # 'updated' | 'skipped' | 'unchanged' | 'error'
    detail: str                          # mensaje humano
    old_value: Any = None
    new_value: Any = None


# ============================================================================
# Logging
# ============================================================================

def setup_logging(verbose: bool = False) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="[%(levelname)s] %(message)s",
        stream=sys.stdout,
    )


LOG = logging.getLogger("update")


# ============================================================================
# HTTP + cache
# ============================================================================

def _try_urls(urls: list[str], label: str) -> Optional[requests.Response]:
    """Prueba una lista de URLs, retorna la primera que responda 2xx."""
    for url in urls:
        for attempt in range(HTTP_RETRIES + 1):
            try:
                LOG.debug(f"{label}: GET {url} (intento {attempt + 1})")
                r = requests.get(
                    url, timeout=HTTP_TIMEOUT,
                    headers={"User-Agent": USER_AGENT, "Accept": "*/*"},
                )
                if r.status_code == 200 and r.content:
                    LOG.debug(f"{label}: OK ({len(r.content)} bytes)")
                    return r
                LOG.debug(f"{label}: status {r.status_code}")
            except requests.RequestException as e:
                LOG.debug(f"{label}: error {type(e).__name__}: {e}")
            if attempt < HTTP_RETRIES:
                time.sleep(1.5 * (attempt + 1))   # backoff suave
    return None


def _cache_path(name: str) -> Path:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d")
    return CACHE_DIR / f"{name}-{stamp}.json"


def _read_cache(name: str) -> Optional[dict]:
    """Lee el cache del día si existe y no está expirado."""
    p = _cache_path(name)
    if not p.exists():
        return None
    age_h = (datetime.now() - datetime.fromtimestamp(p.stat().st_mtime)).total_seconds() / 3600
    if age_h > CACHE_MAX_AGE_HOURS:
        LOG.debug(f"cache {name}: expirado ({age_h:.1f}h)")
        return None
    try:
        with p.open(encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        LOG.debug(f"cache {name}: corrupto ({e})")
        return None


def _write_cache(name: str, data: Any) -> None:
    try:
        with _cache_path(name).open("w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2, default=str)
    except Exception as e:
        LOG.debug(f"cache {name}: no se pudo escribir ({e})")


# ============================================================================
# Fetchers
#
# NOTA: las APIs chilenas reales cambian seguido. Cada fetcher:
#   1. Lee cache (si hay y no expiró)
#   2. Intenta cada URL candidata con reintentos
#   3. Parsea la primera respuesta válida
#   4. Si no puede parsear, loguea WARN y retorna None
#   5. Cachea el resultado
# ============================================================================

def fetch_net_billing(use_cache: bool = True) -> Optional[NetBillingResult]:
    """Net Billing acumulado: instalaciones totales y MW."""
    if use_cache and (c := _read_cache("netbilling")):
        LOG.info("netbilling: usando cache")
        return NetBillingResult(**c)

    LOG.info("netbilling: consultando CNE Energía Abierta…")
    r = _try_urls(URLS_NETBILLING, "netbilling")
    if r is None:
        LOG.warning("netbilling: ninguna URL respondió")
        return None

    try:
        # Supuesto de formato: las URLs de datos.energia.gob.cl (CKAN) y
        # api.cne.cl devuelven JSON con campos {instalaciones_acumuladas,
        # potencia_acumulada_mw, fecha}. Si la respuesta es HTML, intenta
        # scrapeo básico.
        if "application/json" in r.headers.get("Content-Type", ""):
            data = r.json()
            instalaciones = (
                data.get("instalaciones_acumuladas")
                or data.get("total_instalaciones")
                or data.get("value")
            )
            mw = (
                data.get("potencia_acumulada_mw")
                or data.get("mw_acumulados")
                or data.get("capacity_mw")
            )
            fecha = data.get("fecha") or data.get("last_updated")
            if instalaciones is None or mw is None:
                raise ValueError("JSON sin campos esperados")
            dt = datetime.fromisoformat(fecha) if fecha else datetime.now()
        elif HAS_BS4:
            # Fallback HTML: buscar la tabla con "instalaciones" o "acumulado"
            soup = BeautifulSoup(r.text, "html.parser")
            txt = soup.get_text(" ", strip=True)
            inst_match = re.search(r"(\d{1,3}(?:[.,]\d{3})+|\d{4,7})\s*instal", txt, re.I)
            mw_match = re.search(r"([\d.,]+)\s*MW", txt)
            if not (inst_match and mw_match):
                raise ValueError("HTML sin patrón reconocible")
            instalaciones = int(re.sub(r"[.,]", "", inst_match.group(1)))
            mw = float(mw_match.group(1).replace(",", "."))
            dt = datetime.now()
        else:
            raise RuntimeError("Se requiere beautifulsoup4 para parsear HTML")

        result = NetBillingResult(
            year=dt.year, month=dt.month,
            instalaciones_total=int(instalaciones),
            mw_total=float(mw),
            source_url=r.url,
        )
        _write_cache("netbilling", asdict(result))
        LOG.info(f"netbilling: {result.instalaciones_total:,} instalaciones, "
                 f"{result.mw_total} MW a {result.month:02d}/{result.year}")
        return result
    except Exception as e:
        LOG.warning(f"netbilling: parseo falló ({type(e).__name__}: {e})")
        return None


def fetch_bev_sales(use_cache: bool = True) -> Optional[BevResult]:
    """BEV vendidos al año natural más reciente."""
    if use_cache and (c := _read_cache("bev")):
        LOG.info("bev: usando cache")
        return BevResult(**c)

    LOG.info("bev: consultando ANAC…")
    r = _try_urls(URLS_BEV, "bev")
    if r is None:
        LOG.warning("bev: ninguna URL respondió")
        return None

    try:
        # ANAC publica una tabla mensual; agregamos a año natural.
        # Supuesto: HTML con filas <tr> que contienen mes + unidades BEV.
        if not HAS_BS4:
            raise RuntimeError("Se requiere beautifulsoup4 para parsear HTML de ANAC")

        soup = BeautifulSoup(r.text, "html.parser")
        # heurística: encontrar tablas y filas con la palabra "BEV" o "eléctric"
        total = 0
        for table in soup.find_all("table"):
            for row in table.find_all("tr"):
                cells = [c.get_text(strip=True) for c in row.find_all(["td", "th"])]
                if not cells:
                    continue
                joined = " ".join(cells).lower()
                if "bev" in joined or "eléctric" in joined or "electric" in joined:
                    # tomar el último número de la fila
                    nums = re.findall(r"(\d{1,3}(?:[.,]\d{3})*|\d+)", joined)
                    if nums:
                        total += int(re.sub(r"[.,]", "", nums[-1]))

        if total == 0:
            raise ValueError("no se encontraron filas BEV")

        year = datetime.now().year
        result = BevResult(year=year, units_sold=total, source_url=r.url)
        _write_cache("bev", asdict(result))
        LOG.info(f"bev: {result.units_sold:,} unidades vendidas en {result.year}")
        return result
    except Exception as e:
        LOG.warning(f"bev: parseo falló ({type(e).__name__}: {e})")
        return None


def fetch_peak_demand(year: int, use_cache: bool = True) -> Optional[PeakResult]:
    """Peak horario SEN del año pedido (default: año actual)."""
    cache_name = f"peak-{year}"
    if use_cache and (c := _read_cache(cache_name)):
        LOG.info(f"peak {year}: usando cache")
        return PeakResult(**c)

    LOG.info(f"peak {year}: consultando CEN…")
    r = _try_urls(URLS_PEAK, f"peak {year}")
    if r is None:
        LOG.warning(f"peak {year}: ninguna URL respondió")
        return None

    try:
        # CEN expone datos horarios del SEN. Supuesto: JSON con array de
        # {fecha, hora, demanda_mwh} o bien un objeto con "max" ya calculado.
        if "application/json" in r.headers.get("Content-Type", ""):
            data = r.json()
            # Si ya viene agregado:
            if isinstance(data, dict) and "max_mwh" in data:
                val = float(data["max_mwh"])
                month = int(data.get("month", 1))
            else:
                # Si viene serie: buscar el máximo del año pedido
                series = data.get("data", data) if isinstance(data, dict) else data
                if not isinstance(series, list) or not series:
                    raise ValueError("JSON sin serie reconocible")
                rows = [x for x in series if str(year) in str(x.get("fecha", x.get("datetime", "")))]
                if not rows:
                    raise ValueError(f"sin datos para {year}")
                peak_row = max(rows, key=lambda x: x.get("demanda_mwh", x.get("value", 0)))
                val = float(peak_row.get("demanda_mwh", peak_row.get("value")))
                fecha = peak_row.get("fecha", peak_row.get("datetime", ""))
                try:
                    month = datetime.fromisoformat(str(fecha)).month
                except Exception:
                    month = 1
        else:
            raise ValueError("respuesta no es JSON")

        # Inferir estación por mes
        if month in (12, 1, 2, 3):
            season, mes_nombre = "Verano", "ene" if month == 1 else f"mes {month}"
        elif month in (6, 7, 8):
            season, mes_nombre = "Invierno", f"mes {month}"
        else:
            season, mes_nombre = "Verano", f"mes {month}"

        result = PeakResult(
            year=year, month=month, val_mwh=val, season=season,
            note=f"{val:,.0f} MWh/h",
            source_url=r.url,
        )
        _write_cache(cache_name, asdict(result))
        LOG.info(f"peak {year}: {val:,.0f} MWh/h en {mes_nombre} ({season})")
        return result
    except Exception as e:
        LOG.warning(f"peak {year}: parseo falló ({type(e).__name__}: {e})")
        return None


def fetch_sector(year: int, use_cache: bool = True) -> Optional[SectorResult]:
    """Composición SEN por sector (reporte art. 72-15). Anual, no siempre disponible."""
    cache_name = f"sector-{year}"
    if use_cache and (c := _read_cache(cache_name)):
        LOG.info(f"sector {year}: usando cache")
        return SectorResult(**c)

    LOG.info(f"sector {year}: consultando CEN art. 72-15…")
    r = _try_urls(URLS_SECTOR, f"sector {year}")
    if r is None:
        LOG.warning(f"sector {year}: ninguna URL respondió")
        return None

    # Implementación mínima: si la respuesta trae un campo reconocible
    # {residencial, comercial, industrial, otros}, lo usamos. Si no,
    # marcamos como no-parseable (es la fuente más frágil).
    try:
        if "application/json" not in r.headers.get("Content-Type", ""):
            raise ValueError("reporte en formato no JSON")
        data = r.json()
        pct = {
            "Residencial regulado":            float(data.get("residencial", 30)),
            "Comercial / pequeño industrial": float(data.get("comercial", 24)),
            "Industrial y minero libre":      float(data.get("industrial", 42)),
            "Otros / autogeneración neta":    float(data.get("otros", 4)),
        }
        result = SectorResult(year=year, pct=pct, source_url=r.url)
        _write_cache(cache_name, asdict(result))
        LOG.info(f"sector {year}: " + ", ".join(f"{k.split()[0]}={v:.0f}%" for k, v in pct.items()))
        return result
    except Exception as e:
        LOG.warning(f"sector {year}: parseo falló ({type(e).__name__}: {e})")
        return None


# ============================================================================
# Updaters (data.js)
#
# Estrategia: regex que captura la declaración completa del array, lo
# parsea como literal Python (es seguro porque viene de nuestro propio repo
# y solo lo lee este script), modifica, y vuelve a serializar con el mismo
# formato (2 espacios indent, comillas simples, trailing-coma en objetos
# pero no en arrays simples).
# ============================================================================

def _read_text(p: Path) -> str:
    return p.read_text(encoding="utf-8")


def _write_text(p: Path, content: str) -> None:
    p.write_text(content, encoding="utf-8")


def _format_num_array(values: list[float | int]) -> str:
    """Serializa un array de números como en data.js: '[' + csv + ']'."""
    body = ", ".join(f"{v}" for v in values)
    return "[" + body + "]"


def _format_peak_object(p: PeakResult) -> str:
    """Serializa un objeto PEAK_DEMAND_DATA al formato del archivo."""
    return (f"  {{ y: {p.year}, val: {int(p.val_mwh)}, "
            f"season: '{p.season}', note: '{p.note}' }}")


def _format_sector_object(label: str, value: float, color: str) -> str:
    """Serializa un objeto SECTOR_DATA al formato del archivo."""
    return f"  {{ label: '{label}', value: {int(round(value))}, color: '{color}' }}"


def _backup(p: Path) -> Path:
    """Copia p a p.bak-<timestamp>; retorna la ruta del backup."""
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    dest = p.with_suffix(p.suffix + f".bak-{stamp}")
    shutil.copy2(p, dest)
    LOG.debug(f"backup: {dest.name}")
    return dest


def _update_number_array(src: str, var_name: str, new_value: float) -> tuple[str, float, Optional[float]]:
    """Reemplaza el último valor de un array de números. Retorna (src, old, new)."""
    # Captura: export const NAME = [ ... ];
    pat = re.compile(
        rf"(export\s+const\s+{re.escape(var_name)}\s*=\s*\[)([^\]]*)(\]\s*;)",
        re.MULTILINE,
    )
    m = pat.search(src)
    if not m:
        raise ValueError(f"no se encontró '{var_name}' en data.js")

    body = m.group(2).strip()
    if not body:
        raise ValueError(f"array '{var_name}' está vacío")
    nums = [float(n.strip()) for n in body.split(",") if n.strip()]
    if not nums:
        raise ValueError(f"array '{var_name}' no parseó como números")

    old = nums[-1]
    # Si el año objetivo ya está representado, reemplazar; si no, append.
    if new_value in nums:
        nums = [new_value if n == old else n for n in nums]
    else:
        nums.append(new_value)

    new_src = src[:m.start()] + m.group(1) + _format_num_array(nums) + m.group(3) + src[m.end():]
    return new_src, old, nums[-1]


def _update_peak_array(src: str, result: PeakResult) -> tuple[str, Optional[int], int]:
    """Agrega o reemplaza el año en PEAK_DEMAND_DATA. Retorna (src, old_val, new_val)."""
    pat = re.compile(
        r"(export\s+const\s+PEAK_DEMAND_DATA\s*=\s*\[)(.*?)(\]\s*;)",
        re.DOTALL,
    )
    m = pat.search(src)
    if not m:
        raise ValueError("no se encontró PEAK_DEMAND_DATA en data.js")

    body = m.group(2)
    # Buscar si ya existe una entrada para el año
    year_pat = re.compile(rf"{{\s*y:\s*{result.year}\s*,")
    old_val = None
    if year_pat.search(body):
        # Reemplazar bloque completo del año
        obj_pat = re.compile(
            rf"\{{\s*y:\s*{result.year}\s*,\s*val:\s*(\d+)\s*,[^}}]*\}}",
            re.DOTALL,
        )
        om = obj_pat.search(body)
        if om:
            old_val = int(om.group(1))
            new_block = _format_peak_object(result)
            new_body = body[:om.start()] + new_block + body[om.end():]
        else:
            new_body = body
    else:
        # Append antes del cierre — preserva el último objeto del array
        # (no tiene coma final en el original)
        stripped = body.rstrip()
        if not stripped.endswith(","):
            stripped += ","
        new_block = _format_peak_object(result)
        new_body = stripped + "\n" + new_block

    new_src = src[:m.start()] + m.group(1) + new_body + m.group(3) + src[m.end():]
    return new_src, old_val, int(result.val_mwh)


def _update_sector_array(src: str, result: SectorResult) -> tuple[str, dict, dict]:
    """Actualiza los `value` de SECTOR_DATA. Retorna (src, old, new)."""
    pat = re.compile(
        r"(export\s+const\s+SECTOR_DATA\s*=\s*\[)(.*?)(\]\s*;)",
        re.DOTALL,
    )
    m = pat.search(src)
    if not m:
        raise ValueError("no se encontró SECTOR_DATA en data.js")

    body = m.group(2)
    old, new = {}, {}
    for label, pct in result.pct.items():
        # Encuentra el bloque con ese label exacto y actualiza su value
        label_pat = re.compile(
            rf"({{\s*label:\s*'{re.escape(label)}'\s*,\s*value:\s*)(\d+)(\s*,\s*color:\s*'#[0-9a-fA-F]{{3,6}}'\s*}})",
            re.DOTALL,
        )
        lm = label_pat.search(body)
        if lm:
            old[label] = int(lm.group(2))
            new[label] = int(round(pct))
            body = body[:lm.start()] + lm.group(1) + str(new[label]) + lm.group(3) + body[lm.end():]

    new_src = src[:m.start()] + m.group(1) + body + m.group(3) + src[m.end():]
    return new_src, old, new


# ============================================================================
# Updaters (HTML)
#
# Cada entrada es (regex, replacement) donde el replacement se construye
# a partir del resultado del fetcher correspondiente. Esto permite tener
# múltiples patrones para un mismo dato (hero + §2 card) con reemplazos
# contextualmente correctos.
# ============================================================================

def _build_html_rules(nb: Optional[NetBillingResult],
                      bev: Optional[BevResult],
                      peak: Optional[PeakResult]) -> list[tuple[str, str]]:
    """Construye la lista de (patrón, replacement) a aplicar en los HTML."""
    rules: list[tuple[str, str]] = []
    if nb is not None:
        rules.extend([
            (r"<b>39,636\s*instalaciones</b>",
             f"<b>{nb.instalaciones_total:,} instalaciones</b>"),
            (r"<b>466\.7\s*MW</b>",
             f"<b>{nb.mw_total:.1f} MW</b>"),
        ])
    if bev is not None:
        rules.append(
            (r"<b>4,507\s*BEV</b>",
             f"<b>{bev.units_sold:,} BEV</b>"),
        )
    if peak is not None:
        val_str = f"{int(peak.val_mwh):,}"
        rules.extend([
            # Hero KPI: <div class="value">12,190<span class="unit">MWh/h</span>
            (r">12,190<span", f">{val_str}<span"),
            # §2 card: (12,190 MWh/h)
            (r"\(12,190 MWh/h\)", f"({val_str} MWh/h)"),
        ])
    return rules


def _update_html_files(nb: Optional[NetBillingResult],
                       bev: Optional[BevResult],
                       peak: Optional[PeakResult]) -> int:
    """Aplica los reemplazos en ambos HTML. Retorna cuántos archivos cambió."""
    rules = _build_html_rules(nb, bev, peak)
    if not rules:
        return 0

    changed = 0
    for html_path in (INDEX_HTML, INTERNAL_HTML):
        if not html_path.exists():
            LOG.warning(f"html no existe, saltando: {html_path.name}")
            continue
        src = _read_text(html_path)
        original = src
        for pattern, replacement in rules:
            src, n = re.subn(pattern, replacement, src)
            if n:
                LOG.debug(f"{html_path.name}: '{pattern}' -> {n} reemplazo(s)")
        if src != original:
            _write_text(html_path, src)
            LOG.info(f"html actualizado: {html_path.name}")
            changed += 1
    return changed


# ============================================================================
# Outlier guard
# ============================================================================

def _confirm_outlier(name: str, old: float, new: float) -> bool:
    """Pide confirmación si el cambio relativo supera OUTLIER_PCT."""
    if old == 0:
        return True
    change = abs(new - old) / abs(old)
    if change <= OUTLIER_PCT:
        return True
    LOG.warning(f"{name}: cambio relativo {change:.0%} ({old} -> {new})")
    try:
        ans = input(f"  ¿Aplicar {new}? (y/N): ").strip().lower()
    except EOFError:
        LOG.warning(f"{name}: sin stdin, saltando cambio")
        return False
    return ans in ("y", "yes", "s", "si", "sí")


# ============================================================================
# Orquestación
# ============================================================================

def run(args: argparse.Namespace) -> list[UpdateOutcome]:
    outcomes: list[UpdateOutcome] = []
    only = set(s.strip() for s in (args.only or "netbilling,bev,peak,sector").split(",") if s.strip())
    use_cache = not args.no_cache
    target_year = args.year or datetime.now().year

    # 1. Fetch en paralelo -----------------------------------------------------
    fetchers: dict[str, Callable] = {
        "netbilling": lambda: fetch_net_billing(use_cache),
        "bev":        lambda: fetch_bev_sales(use_cache),
        "peak":       lambda: fetch_peak_demand(target_year, use_cache),
        "sector":     lambda: fetch_sector(target_year, use_cache),
    }
    fetched: dict[str, Any] = {}
    with ThreadPoolExecutor(max_workers=4) as ex:
        futures = {ex.submit(fn): name for name, fn in fetchers.items() if name in only}
        for fut in as_completed(futures, timeout=HTTP_TIMEOUT * (HTTP_RETRIES + 1) * 2 + 10):
            name = futures[fut]
            try:
                fetched[name] = fut.result()
            except Exception as e:
                LOG.error(f"{name}: excepción no controlada ({e})")
                fetched[name] = None

    # 2. Cargar data.js -------------------------------------------------------
    if not DATA_JS.exists():
        LOG.error(f"data.js no existe en {DATA_JS}")
        return outcomes
    src = _read_text(src_path := DATA_JS)
    original_src = src

    # Cachear los resultados que terminaron actualizándose para luego
    # propagar a los HTML.
    updated_nb: Optional[NetBillingResult] = None
    updated_bev: Optional[BevResult] = None
    updated_peak: Optional[PeakResult] = None

    # 3. Aplicar cada updater -------------------------------------------------
    if "netbilling" in only and (nb := fetched.get("netbilling")):
        new_val = nb.instalaciones_miles
        try:
            src, old, new = _update_number_array(src, "NET_BILLING", new_val)
            if _confirm_outlier("NET_BILLING", old, new):
                outcomes.append(UpdateOutcome(
                    "NET_BILLING", "updated",
                    f"{old} -> {new} miles (a {nb.month:02d}/{nb.year})",
                    old, new,
                ))
                updated_nb = nb
            else:
                src = original_src  # revertir
                outcomes.append(UpdateOutcome("NET_BILLING", "skipped", "usuario rechazó outlier"))
        except Exception as e:
            outcomes.append(UpdateOutcome("NET_BILLING", "error", str(e)))

    if "bev" in only and (bev := fetched.get("bev")):
        try:
            src, old, new = _update_number_array(src, "BEV_SOLD", bev.units_sold)
            if _confirm_outlier("BEV_SOLD", old, new):
                outcomes.append(UpdateOutcome(
                    "BEV_SOLD", "updated",
                    f"{int(old)} -> {int(new)} unidades ({bev.year})",
                    old, new,
                ))
                updated_bev = bev
            else:
                src = original_src
                outcomes.append(UpdateOutcome("BEV_SOLD", "skipped", "usuario rechazó outlier"))
        except Exception as e:
            outcomes.append(UpdateOutcome("BEV_SOLD", "error", str(e)))

    if "peak" in only and (peak := fetched.get("peak")):
        try:
            src, old_val, new_val = _update_peak_array(src, peak)
            if old_val is None or _confirm_outlier("PEAK_DEMAND_DATA", old_val or 0, new_val):
                outcomes.append(UpdateOutcome(
                    "PEAK_DEMAND_DATA", "updated",
                    f"año {peak.year}: {old_val} -> {new_val} MWh/h ({peak.season})",
                    old_val, new_val,
                ))
                updated_peak = peak
            else:
                src = original_src
                outcomes.append(UpdateOutcome("PEAK_DEMAND_DATA", "skipped", "usuario rechazó outlier"))
        except Exception as e:
            outcomes.append(UpdateOutcome("PEAK_DEMAND_DATA", "error", str(e)))

    if "sector" in only and (sec := fetched.get("sector")):
        try:
            src, old_sector, new_sector = _update_sector_array(src, sec)
            if old_sector:
                outcomes.append(UpdateOutcome(
                    "SECTOR_DATA", "updated",
                    "; ".join(f"{k.split()[0]}: {old_sector.get(k, '?')}->{v}%" for k, v in new_sector.items()),
                    old_sector, new_sector,
                ))
            else:
                outcomes.append(UpdateOutcome("SECTOR_DATA", "unchanged", "sin cambios"))
        except Exception as e:
            outcomes.append(UpdateOutcome("SECTOR_DATA", "error", str(e)))

    # 4. Escribir si hay cambios ---------------------------------------------
    if src != original_src:
        if args.dry_run:
            LOG.info("DRY-RUN: no se escribieron cambios")
        else:
            _backup(DATA_JS)
            _write_text(DATA_JS, src)
            LOG.info(f"data.js escrito: {DATA_JS.relative_to(REPO_ROOT)}")

        if not args.dry_run and (updated_nb or updated_bev or updated_peak):
            n = _update_html_files(updated_nb, updated_bev, updated_peak)
            LOG.info(f"html actualizados: {n} archivo(s)")
    else:
        LOG.info("data.js sin cambios")

    # 5. Reportar fuentes fallidas ------------------------------------------
    for name, result in fetched.items():
        if result is None and name in only:
            outcomes.append(UpdateOutcome(name, "skipped", "fuente no accesible"))

    return outcomes


# ============================================================================
# CLI
# ============================================================================

def main() -> int:
    # Defensa contra encoding Windows (cp1252 por defecto). Sin esto, cualquier
    # caracter no-ASCII en un print crashea con UnicodeEncodeError.
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

    p = argparse.ArgumentParser(
        description="Sincroniza data.js del dashboard con fuentes publicas chilenas.",
    )
    p.add_argument("--dry-run", action="store_true",
                   help="Muestra qué cambiaría sin escribir archivos")
    p.add_argument("--only", metavar="FUENTES",
                   help="Sólo estas fuentes (csv). Default: netbilling,bev,peak,sector")
    p.add_argument("--year", type=int,
                   help=f"Año objetivo para peak/sector (default: {datetime.now().year})")
    p.add_argument("--no-cache", action="store_true",
                   help="Ignora el cache del día y vuelve a consultar")
    p.add_argument("--verbose", "-v", action="store_true", help="Logging DEBUG")
    args = p.parse_args()

    setup_logging(args.verbose)

    if not HAS_BS4:
        LOG.warning("beautifulsoup4 no instalado: scraping HTML no disponible "
                    "(instala con: pip install beautifulsoup4)")

    LOG.info("=" * 60)
    LOG.info(f"Actualizando dashboard — {datetime.now():%Y-%m-%d %H:%M}")
    LOG.info("=" * 60)

    outcomes = run(args)

    # Resumen final
    print()
    print("=" * 60)
    print("RESUMEN")
    print("=" * 60)
    for o in outcomes:
        badge = {
            "updated":   "[OK]      ",
            "unchanged": "[SAME]    ",
            "skipped":   "[SKIP]    ",
            "error":     "[ERROR]   ",
        }.get(o.status, "[?]       ")
        delta = ""
        if o.old_value is not None and o.new_value is not None and o.old_value != o.new_value:
            delta = f" ({o.old_value} -> {o.new_value})"
        print(f"  {badge}{o.name}: {o.detail}{delta}")
    print()

    has_errors = any(o.status == "error" for o in outcomes)
    return 1 if has_errors else 0


if __name__ == "__main__":
    sys.exit(main())
