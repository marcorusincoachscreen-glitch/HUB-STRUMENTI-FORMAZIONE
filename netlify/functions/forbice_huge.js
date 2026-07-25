// =========================================================================
// MOTORE DI CALCOLO — Simulatore Forbice Huge (Tieni o Cambi l'auto?)
// Replica esatta di calc() + computeForbiceTieni/Cambia/Unico. Il browser
// manda solo i valori inseriti e lo stato degli interruttori (chip).
// =========================================================================
const DEPREC_SCHEDULE = [.15, .125, .125, .1, .1, .05, .05, .05, .05, .05, .05, .03, .03, .02, .02];
function deprecRateForYear(t) { return DEPREC_SCHEDULE[Math.min(t, DEPREC_SCHEDULE.length) - 1]; }
function num(v) { const s = String(v ?? '').replace(/\D/g, ''); const n = parseFloat(s); return isNaN(n) ? 0 : n; }

// ---- Motore principale (equivalente della parte di calcolo di calc()) ----
function computeMain(inp) {
  const t = num(inp.prezzoAcquisto), e = num(inp.anniTieni), o = num(inp.valoreResiduoTieni);
  const n = num(inp.numTagliandi48Tieni) * num(inp.costoMedioTagliandi48Tieni);
  const a = num(inp.numTagliandiOltre48Tieni) * num(inp.costoMedioTagliandiOltre48Tieni);
  const r = num(inp.assicurazioniTieni) * e;
  const l = num(inp.eventiTieni);
  const c = num(inp.prezzoNuovaTieni);
  const s = 12 * e;
  const u = n + (s > 48 ? a : 0);
  const m = !!inp.chipAcquisto1Tieni, p = !!inp.chipAcquisto2Tieni;
  const h = (m ? t : 0) + (p ? c - o : 0);
  const x = (inp.chipManutTieni ? u : 0) + (inp.chipAssicTieni ? r : 0) + (inp.chipEventiTieni ? l : 0) + h;
  const f = 1 + (p ? 1 : 0);
  const g = f ? x / f : 0;
  const b = s ? x / s : 0;

  const y = num(inp.anniCambio);
  const F = num(inp.valorePermutaCambio), $ = num(inp.prezzoRiacquistoCambio);
  const v = num(inp.manutCicloCambio), k = num(inp.assicCicloCambio), E = num(inp.eventiCicloCambio);
  const T = y > 0 && e > 0 ? Math.max(1, Math.round(e / y)) : y > 0 ? 1 : 0;
  const M = T * y * 12;
  const I = $ - F;
  const A = T * I;
  const O = T * v, S = T * k, B = T * E;
  const L = t;
  const R = A + (inp.chipManutCambio ? O : 0) + (inp.chipAssicCambio ? S : 0) + (inp.chipEventiCambio ? B : 0) + L;
  const w = 1 + T;
  const D = w ? R / w : 0;
  const z = M ? R / M : 0;
  const P = s ? g / s : 0;
  const G = M ? D / M : 0;

  const q = R - x, V = z - b, W = V / 30, U = D - g, N = D ? U / D : 0;
  const J = -W, K = g ? -U / g : 0;
  const permeseDiffAbs = G - P, permeseDiffPct = P ? permeseDiffAbs / P : 0;
  const hasVerdict = (x > 0 || R > 0) && e > 0 && y > 0;

  const dt = 12 * y;
  const ut = I + (inp.chipManutCambio ? v : 0) + (inp.chipAssicCambio ? k : 0) + (inp.chipEventiCambio ? E : 0);
  const mt = x - h;
  const pt = Math.max(s, M, 12);
  const labels = [], xt = [], ft = [];
  for (let tt = 0; tt <= pt; tt++) {
    labels.push(tt);
    xt.push(s ? mt * (Math.min(tt, s) / s) + (tt >= s ? h : 0) : 0);
    let ev = L;
    if (dt > 0) ev += Math.min(T, Math.floor(tt / dt)) * ut;
    ft.push(ev);
  }

  return {
    mesiTieni: s, autoTieni: f, spesaTieni: x, perAutoTieni: g, mensileTieni: b, perAutoMensileTieni: P,
    mesiCambio: M, cicliCambio: T, autoCambio: w, spesaCambio: R, perAutoCambio: D, mensileCambio: z, perAutoMensileCambio: G,
    detManutTieni: inp.chipManutTieni ? u : 0, detAssicTieni: inp.chipAssicTieni ? r : 0, detEventiTieni: inp.chipEventiTieni ? l : 0, detAcquistoTieni: h,
    detSwapCambio: A + L, detManutCambio: inp.chipManutCambio ? O : 0, detAssicCambio: inp.chipAssicCambio ? S : 0, detEventiCambio: inp.chipEventiCambio ? B : 0,
    diffTotale: q, diffMensile: V, diffGiorno: W, diffPerAuto: U, diffPerAutoPct: N,
    forbiceADiffGiorno: J, forbiceADiffPct: K,
    permeseDiffAbs, permeseDiffPct, hasVerdict,
    andamento: { labels, tieni: xt, cambia: ft },
    // grezzi utili per costruire i grafici a torta lato client
    tagliandiTotTieni: u, acquistoTieni: h, swapTotCambio: A + L,
  };
}

// ---- Grafici "a forbice" (anno per anno) ----
function computeForbiceTieni(inp) {
  const t = num(inp.prezzoAcquisto), e = Math.max(1, Math.round(num(inp.anniTieni)));
  if (!(t > 0 && num(inp.anniTieni) > 0)) return null;
  const i = num(inp.valoreResiduoTieni), o = num(inp.prezzoNuovaTieni);
  const n = inp.chipManutTieni ? num(inp.numTagliandi48Tieni) * num(inp.costoMedioTagliandi48Tieni) : 0;
  const a = inp.chipManutTieni ? num(inp.numTagliandiOltre48Tieni) * num(inp.costoMedioTagliandiOltre48Tieni) : 0;
  const r = inp.chipAssicTieni ? num(inp.assicurazioniTieni) * e : 0;
  const l = inp.chipEventiTieni ? num(inp.eventiTieni) : 0;
  const c = !!inp.chipAcquisto1Tieni, s = !!inp.chipAcquisto2Tieni;
  const d = 12 * e;
  const u = [null], m = [null], p = [null], h = [null], x = [null], f = [null], g = [null], b = [null];
  const y = (o - t) / e;
  let C = 0;
  const F = [null];
  for (let t = 1; t <= e; t++) { C += deprecRateForYear(t); F[t] = C; }
  const $ = F[e], v = t - i;
  let k = 0;
  for (let i2 = 1; i2 <= e; i2++) {
    u[i2] = 1 === i2 ? t + y : u[i2 - 1] + y;
    const o2 = v * (deprecRateForYear(i2) / $);
    m[i2] = 1 === i2 ? t - o2 : m[i2 - 1] - o2;
    const C2 = 12 * i2;
    let F2 = n * (Math.min(C2, 48) / 48);
    if (d > 48 && C2 > 48) { const t2 = d - 48, e2 = Math.min(C2, d) - 48; F2 += t2 > 0 ? a * (e2 / t2) : 0; }
    h[i2] = F2; p[i2] = r * (i2 / e);
    k += i2 > 4 && e > 4 ? l / (e - 4) : 0;
    x[i2] = k; b[i2] = u[i2] - m[i2]; g[i2] = p[i2] + h[i2] + x[i2];
    f[i2] = (c ? t : 0) + (s ? b[i2] : 0) + g[i2];
  }
  return { years: e, listino: u, valore: m, differenza: b, autoAssManImpr: f, svalGestione: g };
}
function computeForbiceCambia(inp) {
  const t = num(inp.prezzoAcquisto), e = Math.round(num(inp.anniCambio)), i = num(inp.anniTieni);
  if (!(t > 0 && e > 0 && i > 0)) return null;
  const o = Math.max(1, Math.round(i / e)) * e;
  const n = num(inp.valorePermutaCambio);
  const a = num(inp.prezzoRiacquistoCambio) - t;
  const r = (inp.chipManutCambio ? num(inp.manutCicloCambio) : 0) / e;
  const l = (inp.chipAssicCambio ? num(inp.assicCicloCambio) : 0) / e;
  const c = (inp.chipEventiCambio ? num(inp.eventiCicloCambio) : 0) / e;
  const s = [null], d = [null], u = [null], m = [null], p = [null], h = [null], x = [null], f = [null];
  let g = 0, b = 0, y = 0;
  for (let i2 = 1; i2 <= o; i2++) {
    const o2 = Math.ceil(i2 / e), C = i2 - (o2 - 1) * e;
    if (1 === C) { g = 0; b = 0; y = 0; }
    const F = t + (o2 - 1) * a, $ = t + o2 * a;
    const v = (F - (n + (o2 - 1) * a)) / e;
    d[i2] = F - v * C;
    const k = ($ - F) / e;
    s[i2] = F + k * C;
    g += l; b += r; y += c;
    u[i2] = g; m[i2] = b; p[i2] = y;
    f[i2] = s[i2] - d[i2]; x[i2] = u[i2] + m[i2] + p[i2]; h[i2] = t + f[i2] + x[i2];
  }
  return { years: o, listino: s, valore: d, differenza: f, autoAssManImpr: h, svalGestione: x };
}
function computeForbiceUnico(inp) {
  const t = num(inp.prezzoAcquisto), e = Math.max(1, Math.round(num(inp.anniCambio)));
  if (!(t > 0 && e > 0)) return null;
  const i = num(inp.valorePermutaCambio), o = num(inp.prezzoRiacquistoCambio);
  const n = inp.chipManutCambio ? num(inp.manutCicloCambio) : 0;
  const a = inp.chipAssicCambio ? num(inp.assicCicloCambio) : 0;
  const r = inp.chipEventiCambio ? num(inp.eventiCicloCambio) : 0;
  const l = e;
  const c = [null], s = [null], d = [null], u = [null], m = [null], p = [null], h = [null], x = [null];
  let f = 0;
  const g = [null];
  for (let t2 = 1; t2 <= l; t2++) { f += deprecRateForYear(t2); g[t2] = f; }
  const b = g[l], y = t - i, C = (o - t) / l, F = n / l, $ = a / l;
  let v = 0, k = 0, E = 0;
  for (let e2 = 1; e2 <= l; e2++) {
    const i2 = y * (deprecRateForYear(e2) / b);
    s[e2] = 1 === e2 ? t - i2 : s[e2 - 1] - i2;
    c[e2] = 1 === e2 ? t + C : c[e2 - 1] + C;
    k += F; v += $;
    u[e2] = k; d[e2] = v;
    if (e2 === l) E = r;
    m[e2] = E;
    x[e2] = e2 === l ? c[e2] - s[e2] : t - s[e2];
    h[e2] = d[e2] + u[e2] + m[e2];
    p[e2] = t + x[e2] + h[e2];
  }
  return { years: l, listino: c, valore: s, differenza: x, autoAssManImpr: p, svalGestione: h };
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  try {
    const inp = JSON.parse(event.body || '{}');
    const main = computeMain(inp);
    const forbiceTieni = computeForbiceTieni(inp);
    const forbiceCambia = computeForbiceCambia(inp);
    const forbiceUnico = computeForbiceUnico(inp);
    return {
      statusCode: 200, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ main, forbiceTieni, forbiceCambia, forbiceUnico }),
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: String(e) }) };
  }
};

module.exports.computeMain = computeMain;
module.exports.computeForbiceTieni = computeForbiceTieni;
module.exports.computeForbiceCambia = computeForbiceCambia;
module.exports.computeForbiceUnico = computeForbiceUnico;
