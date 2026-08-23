// =========================================================================
// MOTORE DI CALCOLO — Simulatore costo di possesso — Premium
// Replica fedele della logica di calcola() e computeForbiceA().
// =========================================================================
function toNum(v) {
  if ('' === (v = String(v ?? '').trim())) return 0;
  v = v.replace(/\.(?=\d{3}(?:\D|$))/g, '');
  const x = parseFloat(v);
  return isNaN(x) ? 0 : x;
}
function effectiveValue(val, tipo, mult) {
  const o = toNum(val || 0);
  return 'annuo' === (tipo || 'totale') ? o * mult : o;
}
function effectiveValuePeriod(val, tipo, mult) {
  if (mult <= 0) return 0;
  const o = toNum(val || 0);
  return 'annuo' === (tipo || 'totale') ? o * mult : o;
}
function sommaPeriodi(v1, t1, n1, v2, t2, n2) {
  const a = effectiveValuePeriod(v1, t1, n1);
  const b = effectiveValuePeriod(v2, t2, n2);
  return { v1: a, v2: b, tot: a + b };
}
function franceseInteressiTot(capitale, tassoPercent, anni) {
  const nper = Math.max(0, Math.floor(12 * anni));
  if (0 === nper || capitale <= 0) return { monthlyPayment: 0, totalInterest: 0 };
  const rate = tassoPercent / 100 / 12;
  if (0 === rate) return { monthlyPayment: capitale / nper, totalInterest: 0 };
  const pay = capitale * rate / (1 - Math.pow(1 + rate, -nper));
  return { monthlyPayment: pay, totalInterest: pay * nper - capitale };
}
function interessiAttiviComposti(capitale, tassoPercent, anni) {
  const rate = tassoPercent / 100;
  if (capitale <= 0 || anni <= 0 || 0 === rate) return { lordo: 0, netto: 0 };
  const lordo = capitale * (Math.pow(1 + rate, anni) - 1);
  return { lordo, netto: .74 * lordo };
}

// ---- Motore principale (equivalente di calcola()) ----
function calcolaCore(inp) {
  const t = toNum(inp.prezzoAcquisto);
  const e = Math.max(1, Math.floor(toNum(inp.anniPossesso) || 1));
  const i = 12 * e;
  const o = Math.max(0, toNum(inp.kmAnno || 0));

  const r = Math.min(4, e), s = Math.max(0, e - 4);
  const l = sommaPeriodi(inp.manutenzioni_p1, inp.manutenzioniTipo_p1, r, inp.manutenzioni_p2, inp.manutenzioniTipo_p2, s);
  const c = sommaPeriodi(inp.tutele_p1, inp.tuteleTipo_p1, r, inp.tutele_p2, inp.tuteleTipo_p2, s);
  const u = sommaPeriodi(inp.pneumatici_p1, inp.pneumaticiTipo_p1, r, inp.pneumatici_p2, inp.pneumaticiTipo_p2, s);
  const p = effectiveValue(inp.bollo, inp.bolloTipo, e);
  const d = effectiveValue(inp.revisioni, inp.revisioniTipo, e);
  const m = effectiveValue(inp.carburante, inp.carburanteTipo, e);
  const f = sommaPeriodi(inp.rotture_p1, inp.rottureTipo_p1, r, inp.rotture_p2, inp.rottureTipo_p2, s);
  const v = sommaPeriodi(inp.imprevisti_p1, inp.imprevistiTipo_p1, r, inp.imprevisti_p2, inp.imprevistiTipo_p2, s);
  const h = sommaPeriodi(inp.altro_p1, inp.altroTipo_p1, r, inp.altro_p2, inp.altroTipo_p2, s);

  const g = l.tot, b = c.tot, z = u.tot, y = f.tot, P = v.tot, T = h.tot;
  const C = l.v1 + c.v1 + u.v1 + f.v1 + v.v1 + h.v1;
  const _ = l.v2 + c.v2 + u.v2 + f.v2 + v.v2 + h.v2;
  const S = g + b + z + p + d + m + y + P + T;

  const A = toNum(inp.cifraFinanziata);
  const k = toNum(inp.tassoFinanziamento);
  const I = Math.max(0, toNum(inp.anniFinanziamento));
  const x = franceseInteressiTot(A, k, I);
  const E = x.totalInterest, N = x.monthlyPayment;

  const w = toNum(inp.cifraInvestibile);
  const D = toNum(inp.tassoAttivo);
  const M = Math.max(0, toNum(inp.anniInvestimento));
  const L = interessiAttiviComposti(w, D, M);
  const dollar = L.lordo, F = L.netto;
  const R = E > 0;
  const O = R ? -F : +F;
  const B = t + S + E + O;

  const q = effectiveValue(inp.valoreUsato, inp.valoreUsatoTipo, e);
  const U = effectiveValue(inp.prezzoNuova, inp.prezzoNuovaTipo, e);
  const V = Math.max(0, B - q);
  const W = V + U;
  const K = i > 0 ? B / i : 0;
  const Y = i > 0 ? V / i : 0;
  const H = i > 0 ? W / i : 0;
  const J = t + S;
  const G = i > 0 ? J / i : 0;

  const j = inp.scenario || 'base';
  let Q = K, X = B;
  if ('dopoUsato' === j) { Q = Y; X = V; }
  if ('conNuova' === j) { Q = H; X = W; }

  const Z = o * e;
  const tt = t + S - q + E + (R ? -F : +F);
  const et = Z > 0 ? tt / Z : 0;

  let it = 0;
  if (t > 0) it = 'base' === j ? (B - t) / t * 100 : 'dopoUsato' === j ? (V - t) / t * 100 : (W - t) / t * 100;

  return {
    prezzo: t, anni: e, mesi: i, kmAnno: o,
    kmTotaliPeriodo: Z, costoPerKm: et, baseCalcoloCostoKm: tt,
    manutenz: g, tutele: b, pneumatici: z, bollo: p, revisioni: d, carburante: m, rotture: y, imprevisti: P, altro: T,
    totaleServiziPeriodo1: C, totaleServiziPeriodo2: _, serviziTotali: S,
    cifraFinanziata: A, tassoFin: k, anniFin: I, interessiPassiviTot: E, rataMensileFin: N,
    cifraInvestibile: w, tassoAttPercent: D, anniInv: M, interessiAttiviLordi: dollar, interessiAttiviNetti: F, interessiAttiviEffettivi: O,
    valoreUsato: q, prezzoNuova: U,
    totaleBase: B, totaleDopoUsato: V, totaleConNuova: W,
    mensileBase: K, mensileDopoUsato: Y, mensileConNuova: H,
    costoAutoServiziTot: J, costoMensileAutoServizi: G,
    scenario: j, valorePrincipale: Q, totaleFinaleAssoluto: X, percAggiunta: it,
  };
}

// ---- Motore "Effetto Forbice A" (equivalente di computeForbiceA()) ----
const DEPREC_SCHEDULE_FA = [.15, .125, .125, .1, .1, .05, .05, .05, .05, .05, .05, .03, .03, .02, .02];
function depRatesForYearsFA(years) {
  if (years <= DEPREC_SCHEDULE_FA.length) {
    const slice = DEPREC_SCHEDULE_FA.slice(0, years);
    const sum = slice.reduce((a, b) => a + b, 0) || 1;
    return slice.map(x => x / sum);
  }
  const arr = DEPREC_SCHEDULE_FA.slice();
  const last = DEPREC_SCHEDULE_FA[DEPREC_SCHEDULE_FA.length - 1];
  for (let i = DEPREC_SCHEDULE_FA.length + 1; i <= years; i++) arr.push(last);
  return arr;
}
function calcolaForbiceA(inp) {
  const t = toNum(inp.prezzoAcquisto);
  const o = Math.max(1, Math.floor(toNum(inp.anniPossesso)) || 1);
  const i = effectiveValue(inp.valoreUsato, inp.valoreUsatoTipo, o);
  const r = effectiveValue(inp.prezzoNuova, inp.prezzoNuovaTipo, o);
  const a = Math.min(4, o), l = Math.max(0, o - 4);

  function perYearRate(campo, tipo) {
    const p1 = effectiveValuePeriod(inp[campo + '_p1'], inp[tipo + '_p1'], a);
    const p2 = effectiveValuePeriod(inp[campo + '_p2'], inp[tipo + '_p2'], l);
    return { rp1: a > 0 ? p1 / a : 0, rp2: l > 0 ? p2 / l : 0 };
  }
  const s = perYearRate('manutenzioni', 'manutenzioniTipo');
  const c = perYearRate('tutele', 'tuteleTipo');
  const u = perYearRate('pneumatici', 'pneumaticiTipo');
  const p = perYearRate('rotture', 'rottureTipo');
  const d = perYearRate('imprevisti', 'imprevistiTipo');
  const f = perYearRate('altro', 'altroTipo');

  // Voci opzionali per Divario 2°: bollo, revisione, carburante, differenza interessi passivi-attivi
  function perYearFlat(val, tipo, years) {
    const raw = toNum(val || 0);
    return years > 0 ? ('annuo' === (tipo || 'totale') ? raw : raw / years) : 0;
  }
  const bolloPerYear = perYearFlat(inp.bollo, inp.bolloTipo, o);
  const revisioniPerYear = perYearFlat(inp.revisioni, inp.revisioniTipo, o);
  const carburantePerYear = perYearFlat(inp.carburante, inp.carburanteTipo, o);
  const finTot = franceseInteressiTot(toNum(inp.cifraFinanziata), toNum(inp.tassoFinanziamento), Math.max(0, toNum(inp.anniFinanziamento)));
  const attTot = interessiAttiviComposti(toNum(inp.cifraInvestibile), toNum(inp.tassoAttivo), Math.max(0, toNum(inp.anniInvestimento)));
  const diffInteressiPerYear = o > 0 ? (finTot.totalInterest - attTot.netto) / o : 0;
  const onBollo = !!inp.includeBolloDiv2, onRevisioni = !!inp.includeRevisioneDiv2, onCarburante = !!inp.includeCarburanteDiv2, onInteressi = !!inp.includeInteressiDiv2;

  const g = depRatesForYearsFA(o);
  const v = Math.max(0, t - i);
  const A = Math.min(i, t);

  let x = 0, E = 0;
  const labels = [], valore = [], listino = [], div1 = [], div2 = [], gest = [];
  for (let e = 1; e <= o; e++) {
    x += g[e - 1] || 0;
    let valAuto = t - v * x;
    if (valAuto < A) valAuto = A;
    const listinoEquiv = t + e / o * (r - t);
    const isP1 = e <= 4;
    E += (isP1 ? s.rp1 : s.rp2) + (isP1 ? c.rp1 : c.rp2) + (isP1 ? u.rp1 : u.rp2) + (isP1 ? p.rp1 : p.rp2) + (isP1 ? d.rp1 : d.rp2) + (isP1 ? f.rp1 : f.rp2)
      + (onBollo ? bolloPerYear : 0) + (onRevisioni ? revisioniPerYear : 0) + (onCarburante ? carburantePerYear : 0) + (onInteressi ? diffInteressiPerYear : 0);
    const divario1 = listinoEquiv - valAuto;
    const divario2cum = E;
    const prezzoGest = t + divario1 + divario2cum;
    labels.push(1 === e ? "Quest'anno" : e === o ? 'Anno ' + e : String(e));
    valore.push(valAuto); listino.push(listinoEquiv); div1.push(divario1); div2.push(divario2cum); gest.push(prezzoGest);
  }
  const lastIdx = o - 1;
  const divario1Finale = div1[lastIdx], divario2Finale = div2[lastIdx];
  return {
    labels, valore, listino, gest, div1, div2,
    divario1Finale, divario2Finale, divarioTot: divario1Finale + divario2Finale,
    uscitaCassa: t + divario2Finale - i + r,
  };
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  try {
    const inp = JSON.parse(event.body || '{}');
    const main = calcolaCore(inp);
    const forbiceA = calcolaForbiceA(inp);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ main, forbiceA }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: String(e) }) };
  }
};

module.exports.calcolaCore = calcolaCore;
module.exports.calcolaForbiceA = calcolaForbiceA;
