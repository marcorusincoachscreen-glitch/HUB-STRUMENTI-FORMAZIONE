// =========================================================================
// MOTORE DI CALCOLO — Simulatore Forbice (Costo di tenere l'auto troppi anni)
// Replica esatta di computeAll(). Il browser manda solo lo stato inserito.
// =========================================================================
const DEPREC_SCHEDULE = [.15, .125, .125, .1, .1, .05, .05, .05, .05, .05, .05, .03, .03, .02, .02];
function deprecRateForYear(t) { return DEPREC_SCHEDULE[Math.min(t, DEPREC_SCHEDULE.length) - 1]; }

function computeAll(t) {
  const e = Math.max(1, Math.min(60, Math.round(t.anni))), o = [null];
  let n = 0;
  for (let t = 1; t <= e; t++) n += deprecRateForYear(t), o[t] = n;
  const i = o[e], a = t.prezzoOggi - t.valoreResiduo, r = [null];
  for (let t = 1; t <= e; t++) r[t] = a * (deprecRateForYear(t) / i);
  const l = [null];
  for (let o = 1; o <= e; o++) l[o] = (1 === o ? t.prezzoOggi : l[o - 1]) - r[o];
  const s = (t.prezzoSuccessiva - t.prezzoOggi) / e, d = [null];
  for (let o = 1; o <= e; o++) d[o] = (1 === o ? t.prezzoOggi : d[o - 1]) + s;
  const c = t.numTagliandiEntro48 * t.costoTagliandiEntro48, u = t.numTagliandiOltre48 * t.costoTagliandiOltre48, m = [null];
  for (let t = 1; t <= e; t++) { const o = t <= 4 ? c / 4 : 0, n = t > 4 ? u / (12 * e - 48) * 12 : 0; m[t] = o + n; }
  const p = [null]; let y = 0;
  for (let t = 1; t <= e; t++) y += m[t], p[t] = y;
  const f = [null];
  for (let o = 1; o <= e; o++) f[o] = t.assicurazioni;
  const x = [null]; let h = 0;
  for (let t = 1; t <= e; t++) h += f[t], x[t] = h;
  const $ = [null];
  for (let o = 1; o <= e; o++) $[o] = o > 4 && e > 4 ? t.imprevisti / (e - 4) : 0;
  const g = [null]; let F = 0;
  for (let t = 1; t <= e; t++) F += $[t], g[t] = F;
  const k = [null];
  for (let t = 1; t <= e; t++) k[t] = d[t] - l[t];
  const v = [null];
  for (let t = 1; t <= e; t++) v[t] = p[t] + x[t] + g[t];
  const E = [null];
  for (let o = 1; o <= e; o++) E[o] = t.prezzoOggi + k[o] + v[o];
  let S = 0, b = 0;
  for (let t = 1; t <= e; t++) S += f[t], b += m[t];
  const M = d[e], A = l[e], w = t.prezzoOggi + v[e], I = w / (12 * e), z = w + t.prezzoSuccessiva, C = z / (12 * e), R = t.prezzoOggi + v[e] - A, B = R / (12 * e), L = R + t.prezzoSuccessiva;
  return {
    years: e, listino: d, valore: l, assic: f, manut: m, imprev: $, differenza: k, autoAssManImpr: E,
    svalGestione: v, cumAssic: x, cumManut: p, cumImprev: g, totAssic: S, totManut: b,
    maxListino: M, minValore: A, uscitaCassaComplessiva: w, costoMedioMeseComplessivo: I,
    uscitaCassaComplessivaAuto: z, costoMedioMeseComplessivoAuto: C, uscitaCassa: R,
    uscitaCassaAuto: L, costoMedioMese: B, costoMedioMeseAuto: L / (12 * e),
  };
}

const KEYS = ['prezzoOggi', 'anni', 'kmAnno', 'anniAuto', 'kmAuto', 'valoreResiduo', 'numTagliandiEntro48', 'costoTagliandiEntro48', 'numTagliandiOltre48', 'costoTagliandiOltre48', 'assicurazioni', 'imprevisti', 'prezzoSuccessiva'];
function hasAllInputs(t) {
  return KEYS.every(e => 'number' == typeof t[e] && isFinite(t[e])) && t.anni > 0 && t.prezzoOggi > 0;
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  try {
    const s = JSON.parse(event.body || '{}');
    if (!hasAllInputs(s)) {
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ valid: false }) };
    }
    const r = computeAll(s);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ valid: true, result: r }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: String(e) }) };
  }
};

module.exports.computeAll = computeAll;
module.exports.hasAllInputs = hasAllInputs;
