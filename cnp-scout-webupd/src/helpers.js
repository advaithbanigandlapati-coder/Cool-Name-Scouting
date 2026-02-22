export function calcEst(t) {
  let s = 0;
  s += (t.autoSamples  || 0) * 4;
  s += (t.autoSpecimen || 0) * 10;
  if (t.autoParking === 'observation') s += 3;
  if (t.autoParking === 'ascent')      s += 6;
  s += (t.teleopLowBasket   || 0) * 2;
  s += (t.teleopHighBasket  || 0) * 4;
  s += (t.teleopLowChamber  || 0) * 6;
  s += (t.teleopHighChamber || 0) * 10;
  if (t.endgame === 'level1') s += 3;
  if (t.endgame === 'level2') s += 15;
  if (t.endgame === 'level3') s += 30;
  return s;
}

export function fmt(n, d = 0) {
  if (n === null || n === undefined) return '—';
  return typeof n === 'number' ? n.toFixed(d) : String(n);
}

export function fmtWLT(t) {
  if (t.wins === null && t.losses === null) return '—';
  const w = t.wins ?? 0, l = t.losses ?? 0;
  return t.ties ? `${w}W-${l}L-${t.ties}T` : `${w}W-${l}L`;
}

export function endgameLabel(v) {
  return { none: 'None', level1: 'L1 Ascent', level2: 'L2 Ascent', level3: 'L3 Ascent' }[v] || v;
}

/** Parse a number from a Google Sheets cell value (handles blank, strings, etc.) */
export function parseNum(val) {
  if (val === undefined || val === null || val === '') return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

/** Normalize endgame string from form to internal key */
export function normalizeEndgame(val = '') {
  const v = String(val).toLowerCase().trim();
  if (v.includes('3') || v.includes('three')) return 'level3';
  if (v.includes('2') || v.includes('two'))   return 'level2';
  if (v.includes('1') || v.includes('one'))   return 'level1';
  if (v.includes('park') || v.includes('obs')) return 'level1';
  return 'none';
}

/** Normalize auto parking string */
export function normalizeParking(val = '') {
  const v = String(val).toLowerCase().trim();
  if (v.includes('ascent') || v.includes('sub')) return 'ascent';
  if (v.includes('obs') || v.includes('park'))   return 'observation';
  return 'none';
}
