// ===========================================================
// data.js — Loader async de data/*.json
//
// Single source of truth: cada dataset vive en data/<nombre>.json con
// metadata de provenance (fuente_primaria, url_fuente, fecha_extraccion,
// cobertura_temporal, cobertura_geografica, nota_metodologica).
//
// Este módulo es solo un thin loader. NO contiene datos.
// Para agregar/editar un dataset, edita el JSON correspondiente.
// ===========================================================

const DATA_FILES = {
  composicion:    'data/composicion_sen.json',
  distribuidoras: 'data/distribuidoras.json',
  peak:           'data/peak_demanda_sen.json',
  vectores:       'data/vectores_cambio.json',
  benchmarks:     'data/benchmarks_mape.json',
  predictores:    'data/predictores.json',
  kpis:           'data/kpis_hero.json'
};

/**
 * Carga todos los datasets en paralelo y devuelve un objeto indexado por clave.
 * Cada valor es el JSON parseado completo (incluye `metadata` y `datos`).
 *
 * @returns {Promise<Object>}  Ej: { composicion: { metadata, datos }, ... }
 */
export async function loadAllData() {
  const entries = await Promise.all(
    Object.entries(DATA_FILES).map(async ([key, url]) => {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`No se pudo cargar ${url} (HTTP ${res.status})`);
      }
      const json = await res.json();
      return [key, json];
    })
  );
  return Object.fromEntries(entries);
}
