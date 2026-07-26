// =========================================================================
// MOTORE FINANZIARIO — Interessi e Inflazione (contanti / mutuo / investimento)
// Validato riga per riga contro il file Excel originale (LibreOffice
// recalc, 0 scostamenti su 220 celle confrontate). Il browser non vede mai
// queste formule: manda solo {state} e riceve le 4 tabelle già calcolate.
// =========================================================================
function cumInterest(annualRate, nperMonths, pv, startMonth, endMonth) {
  if (startMonth < 1 || endMonth > nperMonths || endMonth < startMonth) {
    throw new Error('periodo fuori intervallo');
  }
  const r = annualRate / 12;
  let pmt;
  if (r === 0) {
    pmt = pv / nperMonths;
  } else {
    pmt = (pv * r) / (1 - Math.pow(1 + r, -nperMonths));
  }
  let bal = pv;
  let total = 0;
  for (let m = 1; m <= nperMonths; m++) {
    const interest = bal * r;
    const principal = pmt - interest;
    bal -= principal;
    if (m >= startMonth && m <= endMonth) total += interest;
  }
  return total;
}

function rateSolve(nper, pmt, pv, fv = 0, type = 0, guess = 0.1) {
  let r = guess;
  const f = (rr) => {
    if (rr === 0) return pv + pmt * nper + fv;
    return pv * Math.pow(1 + rr, nper) + pmt * (1 + rr * type) * ((Math.pow(1 + rr, nper) - 1) / rr) + fv;
  };
  for (let i = 0; i < 100; i++) {
    if (r <= -1) r = 0.0001;
    const h = 1e-6;
    const f0 = f(r);
    const f1 = f(r + h === 0 ? h : r + h);
    const fp = (f1 - f0) / h;
    if (fp === 0) break;
    const rNew = r - f0 / fp;
    if (Math.abs(rNew - r) < 1e-10) { r = rNew; break; }
    r = rNew;
  }
  return r;
}

function ife(fn) {
  try {
    const v = fn();
    return (typeof v === 'number' && isFinite(v)) ? v : NaN;
  } catch (e) { return NaN; }
}

function computeAll(inp) {
  const amount = inp.amount;
  const infl = inp.inflation;
  const loanMonths = inp.loanMonths;
  const refMonth = inp.refMonth;
  const loanRate = inp.loanRate;
  const invRate = inp.invRate;
  const tax = inp.tax;

  const years = [1,2,3,4,5,6,7,8,9,10];
  const t1 = {}, t2 = {}, t3 = {}, t4 = {};

  years.forEach(y => {
    const D1 = ife(() => amount / Math.pow(1 + infl, y));
    const E1 = ife(() => D1 - amount);
    const F1 = ife(() => E1 / amount);
    t1[y] = { D: D1, E: E1, F: F1 };
  });

  years.forEach(y => {
    const D2 = ife(() => cumInterest(loanRate, loanMonths, amount, 1, y * refMonth));
    const E2 = ife(() => amount + D2);
    const F2 = ife(() => D2 / Math.pow(1 + infl, y));
    const G2 = ife(() => amount + F2);
    const H2 = ife(() => t1[y].D + F2);
    const I2 = ife(() => H2 - amount);
    t2[y] = { D: D2, E: E2, F: F2, G: G2, H: H2, I: I2 };
  });

  years.forEach(y => {
    const J3 = ife(() => amount * Math.pow(1 + invRate, y));
    const K3 = ife(() => J3 - amount);
    const D3 = ife(() => K3 - K3 * tax);
    const E3 = ife(() => amount + D3);
    const F3 = ife(() => D3 / Math.pow(1 + infl, y));
    const G3 = ife(() => amount + F3);
    const H3 = ife(() => t1[y].D + F3);
    const I3 = ife(() => H3 - amount);
    t3[y] = { J: J3, K: K3, D: D3, E: E3, F: F3, G: G3, H: H3, I: I3 };
  });

  years.forEach(y => {
    const C4 = t2[y].F;
    const D4 = t3[y].F;
    const E4 = ife(() => D4 - C4);
    const F4 = ife(() => 1 - D4 / C4);
    const G4 = ife(() => {
      const nper = y * 12;
      const pmtVal = (amount - E4) / (y * 12);
      const pv = -amount;
      return rateSolve(nper, pmtVal, pv) * 12;
    });
    const H4 = ife(() => t1[y].D - E4);
    t4[y] = { C: C4, D: D4, E: E4, F: F4, G: G4, H: H4 };
  });

  return { t1, t2, t3, t4 };
}

function n(v, def = 0) {
  const x = parseFloat(v);
  return isFinite(x) ? x : def;
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  try {
    const body = JSON.parse(event.body || '{}');
    const raw = body.state || {};
    const s = {
      amount: n(raw.amount),
      inflation: n(raw.inflation) / 100,
      loanRate: n(raw.loanRate) / 100,
      loanMonths: Math.round(n(raw.loanMonths, 96)) || 96,
      refMonth: Math.round(n(raw.refMonth, 12)) || 12,
      invRate: n(raw.invRate) / 100,
      tax: n(raw.tax) / 100,
    };
    const r = computeAll(s);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(r),
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: String(e) }) };
  }
};
