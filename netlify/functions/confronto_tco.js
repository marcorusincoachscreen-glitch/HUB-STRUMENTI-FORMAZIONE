// =========================================================================
// MOTORE DI CALCOLO — Confronto TCO 3 auto
// Replica fedele delle formule del foglio "TCO PRIVATI". Il browser manda
// solo stato e tabella carburanti; qui viene calcolato tutto il resto.
// =========================================================================
const EXEMPT_CODES = [5, 6, 7, 8, 9, 10, 12, 13];
const MSG_POSSIBILE = 'Possibili esenzioni / riduzioni bollo';
const MSG_NON_PREV = 'Esenzioni / riduzioni bollo non previste';

function n(v) { const x = parseFloat(v); return isFinite(x) ? x : 0; }
function blank(v) { return v === null || v === undefined || v === ''; }

function cumInterest(rateMonthly, nper, pv, start, end) {
  if (!rateMonthly || !nper || !pv) return 0;
  const factor = Math.pow(1 + rateMonthly, nper);
  const pmt = -rateMonthly * (pv * factor) / (factor - 1);
  let balance = pv, total = 0;
  for (let p = 1; p <= nper; p++) {
    const interest = balance * rateMonthly;
    const principal = -pmt - interest;
    balance -= principal;
    if (p >= start && p <= end) total += interest;
  }
  return total;
}
function fuelPrice(fuelTable, name) { return fuelTable[name] ? n(fuelTable[name].price) : 0; }
function fuelCode(fuelTable, name) { return fuelTable[name] ? fuelTable[name].code : 0; }

function calculate(s, fuelTable) {
  const anni = n(s.anni), km = n(s.kmAnnui);
  const r = {};
  const prezzo = s.prezzo.map(n);
  r.prezzo = prezzo;
  r.d8 = prezzo[1] - prezzo[0];
  r.f8 = prezzo[2] - prezzo[0];
  r.f10 = prezzo[2] - prezzo[1];

  const annualFuel = [], periodFuel = [], altPct = [];
  for (let i = 0; i < 3; i++) {
    const pctP = n(s.pctPrimary[i]);
    const ap = blank(s.fuelAlt[i]) ? 0 : (1 - pctP);
    altPct.push(ap);
    const kmP = n(s.kmPrimary[i]), kmA = n(s.kmAlt[i]);
    const costP = kmP > 0 ? (km * pctP) / kmP * fuelPrice(fuelTable, s.fuelPrimary[i]) : 0;
    const costA = (kmA > 0) ? (km / kmA) * ap * (blank(s.fuelAlt[i]) ? 0 : fuelPrice(fuelTable, s.fuelAlt[i])) : 0;
    const tot = costP + costA;
    annualFuel.push(tot);
    periodFuel.push(tot * anni);
  }
  r.altPct = altPct;
  r.annualFuel = annualFuel; r.periodFuel = periodFuel;
  r.fuelDiff = { d25: annualFuel[1] - annualFuel[0], f25: annualFuel[2] - annualFuel[0], f27: annualFuel[2] - annualFuel[1] };
  r.fuelDiff.d26 = r.fuelDiff.d25 * anni; r.fuelDiff.f26 = r.fuelDiff.f25 * anni; r.fuelDiff.f28 = r.fuelDiff.f27 * anni;

  r.sumCode = [0, 1, 2].map(i => fuelCode(fuelTable, s.fuelPrimary[i]) + (blank(s.fuelAlt[i]) ? 0 : fuelCode(fuelTable, s.fuelAlt[i])));
  r.exemptMsg = r.sumCode.map(c => c === 0 ? '' : (EXEMPT_CODES.includes(c) ? MSG_POSSIBILE : MSG_NON_PREV));

  const bolloTot = [0, 1, 2].map(i => n(s.bolloAnnuo[i]) * n(s.bolloAnni[i]));
  r.bolloTot = bolloTot;
  r.bolloDiff = { c35: bolloTot[1] - bolloTot[0], e35: bolloTot[2] - bolloTot[0], e37: bolloTot[2] - bolloTot[1] };

  const manutTot = [0, 1, 2].map(i => n(s.manutCosto[i]) * n(s.manutCount[i]));
  r.manutTot = manutTot;
  r.manutDiff = { c43: manutTot[1] - manutTot[0], e43: manutTot[2] - manutTot[0], e45: manutTot[2] - manutTot[1] };

  const pneumTot = [0, 1, 2].map(i => n(s.pneumCosto[i]) * n(s.pneumTreni[i]));
  r.pneumTot = pneumTot;
  r.pneumDiff = { c52: pneumTot[1] - pneumTot[0], e52: pneumTot[2] - pneumTot[0], e54: pneumTot[2] - pneumTot[1] };

  const interPassivi = [0, 1, 2].map(i => cumInterest(n(s.finTasso[i]) / 12, n(s.finMesi[i]), n(s.finCifra[i]), 1, n(s.finEstinzione[i])));
  r.interPassivi = interPassivi;
  r.interPassiviDiff = { c66: interPassivi[1] - interPassivi[0], e66: interPassivi[2] - interPassivi[0], f66: interPassivi[2] - interPassivi[1] };

  const interMancati = [0, 1, 2].map(i => {
    const cc = n(s.contCifra[i]), ta = n(s.contAnni[i]), ts = n(s.contTasso[i]);
    const grown = (cc * Math.pow(1 + ts / 12, ta * 12) - cc) * 0.74;
    return blank(s.finCifra[i]) ? grown : -grown;
  });
  r.interMancati = interMancati;
  r.interMancatiDiff = { c74: interMancati[1] - interMancati[0], e74: interMancati[2] - interMancati[0], f74: interMancati[2] - interMancati[1] };

  const assTot = [0, 1, 2].map(i => n(s.assAnniPag[i]) * n(s.assAnnuo[i]));
  r.assTot = assTot;
  r.assDiff = { d79: assTot[1] - assTot[0], f79: assTot[2] - assTot[0], f80: assTot[2] - assTot[1] };

  const imprev = [0, 1, 2].map(i => n(s.imprevisti[i]));
  r.imprev = imprev;
  r.imprevDiff = { c84: imprev[1] - imprev[0], e84: imprev[2] - imprev[0], f84: imprev[2] - imprev[1] };

  const rivendita = [0, 1, 2].map(i => n(s.rivendita[i]));
  r.rivendita = rivendita;
  r.rivenditaPct = [0, 1, 2].map(i => prezzo[i] ? rivendita[i] / prezzo[i] : 0);
  r.rivenditaDiff = { c88: rivendita[1] - rivendita[0], e88: rivendita[2] - rivendita[0], f88: rivendita[2] - rivendita[1] };

  const totale = [0, 1, 2].map(i => prezzo[i] + periodFuel[i] + bolloTot[i] + manutTot[i] + pneumTot[i]
    + interPassivi[i] + interMancati[i] + assTot[i] + imprev[i] - rivendita[i]);
  r.totale = totale;
  r.costoKm = totale.map(t => (km * anni) ? t / (km * anni) : 0);
  r.costoAnno = totale.map(t => anni ? t / anni : 0);
  r.costoMese = totale.map(t => anni ? t / (anni * 12) : 0);

  r.d91 = r.costoMese[1] - r.costoMese[0];
  r.f91 = r.costoMese[2] - r.costoMese[0];
  r.g91 = r.costoMese[2] - r.costoMese[1];
  r.d98 = totale[1] - totale[0];
  r.g98 = totale[2] - totale[0];
  r.h98 = totale[2] - totale[1];

  r.c99 = r.fuelDiff.d26 + r.bolloDiff.c35 + r.manutDiff.c43 + r.pneumDiff.c52 + r.interPassiviDiff.c66 + r.interMancatiDiff.c74 + r.assDiff.d79 + r.imprevDiff.c84;
  r.e99 = r.fuelDiff.f26 + r.bolloDiff.e35 + r.manutDiff.e43 + r.pneumDiff.e52 + r.interPassiviDiff.e66 + r.interMancatiDiff.e74 + r.assDiff.f79 + r.imprevDiff.e84;
  r.f99 = r.fuelDiff.f28 + r.bolloDiff.e37 + r.manutDiff.e45 + r.pneumDiff.e54 + r.interPassiviDiff.f66 + r.interMancatiDiff.f74 + r.assDiff.f80 + r.imprevDiff.f84;

  r.c101 = r.d8; r.e101 = r.f8; r.f101 = r.f10;
  r.c103 = r.c99 + (prezzo[1] - prezzo[0]);
  r.e103 = prezzo[2] ? (r.e99 + (prezzo[2] - prezzo[0])) : 0;
  r.f103 = prezzo[2] ? (r.f99 + (prezzo[2] - prezzo[1])) : 0;

  r.c105 = r.c101 ? (r.c99 < 0 ? -(Math.abs(r.c99) - r.c101) / r.c101 : -(r.c99 - r.c101) / r.c101) : 0;
  r.e105 = r.e101 ? (r.e99 < 0 ? -(Math.abs(r.e99) - r.e101) / r.e101 : -(r.e99 - r.e101) / r.e101) : 0;
  r.f105 = r.f101 ? (r.f99 < 0 ? -(Math.abs(r.f99) - r.f101) / r.f101 : -(r.f99 - r.f101) / r.f101) : 0;

  const meseB = blank(s.meseIns[0]) ? null : n(s.meseIns[0]);
  const meseD = blank(s.meseIns[1]) ? null : n(s.meseIns[1]);
  r.c107 = meseB ? r.c103 / meseB : r.c103 / (anni * 12);
  r.e107 = meseD ? r.e103 / meseD : r.e103 / (anni * 12);
  r.f107 = meseD ? r.f103 / meseD : r.f103 / (anni * 12);

  r.c108pareggia = r.c103 <= 0;
  r.e108pareggia = r.e103 <= 0;

  r.active = [0, 1, 2].map(i => !blank(s.pctPrimary[i]));
  r.activeIdxs = [0, 1, 2].filter(i => r.active[i]);
  r.cheapestIdx = r.activeIdxs.length
    ? r.activeIdxs.reduce((best, i) => totale[i] < totale[best] ? i : best, r.activeIdxs[0])
    : -1;

  return r;
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  try {
    const body = JSON.parse(event.body || '{}');
    const s = body.state;
    const fuelTable = body.fuelTable || {};
    if (!s || !Array.isArray(s.prezzo)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'invalid state' }) };
    }
    const r = calculate(s, fuelTable);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(r) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: String(e) }) };
  }
};
