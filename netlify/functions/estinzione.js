// =========================================================================
// MOTORE FINANZIARIO — Calcolatore Estinzione (Easy Buy / Lineare / TCM)
// Validato riga per riga contro LibreOffice/Excel. Il browser non vede
// mai queste formule: manda solo {key, state} e riceve il risultato.
// =========================================================================
function pmt(rate, nper, pv, fv = 0, type = 0) {
  if (rate === 0) return -(pv + fv) / nper;
  const f = Math.pow(1 + rate, nper);
  let p = (rate * (pv * f + fv)) / (f - 1);
  if (type === 1) p /= (1 + rate);
  return -p;
}
function amortSums(rate, nper, pv, start, end, type = 0) {
  const pmtVal = pmt(rate, nper, pv, 0, type);
  let bal = pv, cumPrin = 0, cumInt = 0;
  for (let p = 1; p <= nper; p++) {
    const interest = (type === 1 && p === 1) ? 0 : -(bal * rate);
    const principal = pmtVal - interest;
    if (p >= start && p <= end) { cumPrin += principal; cumInt += interest; }
    bal += principal;
  }
  return [cumPrin, cumInt];
}
function cumprinc(rate, nper, pv, start, end, type = 0) { return amortSums(rate, nper, pv, start, end, type)[0]; }
function cumipmt(rate, nper, pv, start, end, type = 0) { return amortSums(rate, nper, pv, start, end, type)[1]; }
function irrSolve(cashflows, guess = 0.1) {
  let rate = guess;
  for (let iter = 0; iter < 100; iter++) {
    let npv = 0, dnpv = 0;
    for (let t = 0; t < cashflows.length; t++) {
      npv += cashflows[t] / Math.pow(1 + rate, t);
      if (t > 0) dnpv -= t * cashflows[t] / Math.pow(1 + rate, t + 1);
    }
    if (Math.abs(dnpv) < 1e-12) break;
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < 1e-10) { rate = newRate; break; }
    rate = newRate;
  }
  return rate;
}
function ife(fn, def = 0) {
  try { const v = fn(); return (typeof v === 'number' && isFinite(v)) ? v : def; }
  catch (e) { return def; }
}

// ---- Easy Buy / Lineare: calcolo diretto via PMT/CUMPRINC/CUMIPMT ----
function calcSimple(s) {
  const r = {};
  r.I8 = ife(() => s.I5 + s.I4 - s.I3 + s.I6 - s.I9);
  r.I12 = ife(() => Math.ceil(-pmt(s.I10 / 12, s.I11, r.I8) + 0.51) + s.I7);
  r.I14 = ife(() => -cumprinc(s.I10 / 12, s.I11, r.I8, s.I13 + 1, s.I11, 0));
  r.I15 = ife(() => r.I14 + r.I14 * 0.01);
  r.I16 = ife(() => s.I3 + r.I12 * s.I13 + r.I15);
  r.I17 = ife(() => -cumipmt(s.I10 / 12, s.I11, r.I8, 1, s.I13, 0));
  r.I18 = ife(() => -cumprinc(s.I10 / 12, s.I11, r.I8, 1, s.I13, 0));
  r.I19 = ife(() => r.I18 + r.I17);
  return r;
}

// ---- TCM: replica il foglio "A" (PMT+IRR) + "Piano ammortamento" ----
function buildTcmSchedule(importo, vfg, durata, tasso) {
  const C5 = importo, C7 = vfg || 0, C8 = durata, C9 = tasso;
  const nper1 = C7 !== 0 ? C8 - 1 : C8;
  const P6 = pmt(C9 / 12, nper1, -C5 + C7, 0, 0);
  const P7 = (C7 !== 0 && C8 > 1) ? (C7 * C9 / 12 * C8 / (C8 - 1)) : 0;
  const F1 = P6 + P7;
  const NMAX = 96;
  const L = [-C5];
  for (let k = 1; k <= NMAX; k++) {
    let f;
    if (k < C8) f = F1; else if (k === C8) f = (C7 !== 0 ? C7 : F1); else f = 0;
    L.push(f);
  }
  const P9 = irrSolve(L, (C9 / 12) || 0.01);
  const rows = [];
  let capResid = C5;
  for (let m = 1; m <= NMAX; m++) {
    let F;
    if (m < C8) F = F1; else if (m === C8) F = (C7 !== 0 ? C7 : F1); else F = 0;
    const G = capResid * P9;
    const H = F - G;
    const newResid = capResid - H;
    rows.push({ month: m, instalment: F, interest: G, amort: H, capital: newResid });
    capResid = newResid;
  }
  return { rows, F1, P9 };
}
function calcTCM(s) {
  const r = {};
  r.I8 = ife(() => s.I5 + s.I4 - s.I3 + s.I6 - s.I9);
  const sched = buildTcmSchedule(r.I8, s.I14, s.I11, s.I10);
  r.I12 = ife(() => sched.F1);
  const findRow = (month) => sched.rows.find(row => row.month === month);
  r.I15 = ife(() => {
    if (s.I13 === s.I11) { const row = findRow(s.I11); return row ? row.instalment : 0; }
    const row = findRow(s.I13); return row ? row.capital : 0;
  });
  r.I16 = ife(() => r.I15 + r.I15 * 0.01);
  r.I17 = ife(() => s.I3 + r.I12 * (s.I11 === s.I13 ? s.I13 - 1 : s.I13) + r.I16);
  const sumUpTo = (field, month) => sched.rows.filter(row => row.month <= month).reduce((a, row) => a + row[field], 0);
  r.I18 = ife(() => sumUpTo('interest', s.I13));
  r.I19 = ife(() => sumUpTo('amort', s.I13));
  r.I20 = ife(() => (s.I11 === s.I13) ? (r.I19 + r.I18) : (r.I18 + r.I19 + r.I16));
  return r;
}

const HASVFG = { eb: false, lineare: false, tcm: true };

function n(v) { const x = parseFloat(v); return isFinite(x) ? x : 0; }

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  try {
    const body = JSON.parse(event.body || '{}');
    const key = body.key;
    if (!(key in HASVFG)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'invalid key' }) };
    }
    const raw = body.state || {};
    const s = {
      I3: n(raw.I3), I4: n(raw.I4), I5: n(raw.I5), I6: n(raw.I6), I7: n(raw.I7),
      I9: n(raw.I9), I10: n(raw.I10),
      I11: Math.round(n(raw.I11)) || 1, I13: Math.round(n(raw.I13)) || 1,
    };
    if (HASVFG[key]) s.I14 = n(raw.I14);
    const r = HASVFG[key] ? calcTCM(s) : calcSimple(s);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(r),
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: String(e) }) };
  }
};
