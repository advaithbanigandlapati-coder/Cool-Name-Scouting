import { PTS } from './constants.js';

export function calcEst(t) {
  let s = 0;
  if (t.autoLeave)            s += PTS.leave;
  s += (t.autoClassified   || 0) * PTS.autoClassified;
  s += (t.autoOverflow     || 0) * PTS.autoOverflow;
  s += (t.autoPatternPts   || 0);
  s += (t.teleopClassified || 0) * PTS.teleopClassified;
  s += (t.teleopOverflow   || 0) * PTS.teleopOverflow;
  s += (t.teleopDepot      || 0) * PTS.depot;
  s += (t.teleopPatternPts || 0);
  if (t.baseResult === 'partial') s += PTS.basePartial;
  if (t.baseResult === 'full')    s += PTS.baseFull;
  return Math.round(s * 10) / 10;
}

export function fmt(n, d = 1) {
  if (n === null || n === undefined || n === '') return '—';
  const num = parseFloat(n);
  return isNaN(num) ? String(n) : num.toFixed(d);
}

export function parseNum(val) {
  if (val === undefined || val === null || val === '') return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

export function normalizeBase(val = '') {
  const v = String(val).toLowerCase();
  if (v.includes('full') || v.includes('completely') || v.includes('all the way')) return 'full';
  if (v.includes('partial') || v.includes('park') || v.includes('base') || v.includes('return') || v.includes('low')) return 'partial';
  return 'none';
}

export function normalizeBool(val = '') {
  const v = String(val).toLowerCase().trim();
  return v === 'yes' || v === 'true' || v === '1';
}

// Parse "755 -- Delbotics" or "755" → "755"
export function parseTeamNum(val = '') {
  const m = String(val).match(/^(\d{3,6})/);
  return m ? m[1] : '';
}
