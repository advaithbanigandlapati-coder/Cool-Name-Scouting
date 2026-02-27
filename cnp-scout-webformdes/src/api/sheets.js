import { parseNum, normalizeBool, parseTeamNum } from '../helpers.js';

async function fetchCSV(csvUrl) {
  const res = await fetch(csvUrl);
  if (!res.ok) throw new Error(`Sheet fetch failed (${res.status}). Make sure it's published as CSV.`);
  return res.text();
}

function parseCSV(text) {
  const rows = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    const row = []; let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') inQ = !inQ;
      else if (ch === ',' && !inQ) { row.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    row.push(cur.trim());
    rows.push(row);
  }
  return rows;
}

function findCol(headers, ...keywords) {
  return headers.findIndex(h => keywords.every(k => h.toLowerCase().includes(k.toLowerCase())));
}

function parseMessyNum(val) {
  if (!val) return 0;
  const nums = String(val).match(/\d+\.?\d*/g);
  if (!nums) return 0;
  return Math.max(...nums.map(Number));
}

export async function fetchSheetTeams(csvUrl) {
  const text = await fetchCSV(csvUrl);
  const rows = parseCSV(text);
  if (rows.length < 2) throw new Error('Sheet is empty.');

  const H = rows[0];
  const cols = {
    teamName:    findCol(H, 'team name'),
    hasAuto:     findCol(H, 'autonomous'),
    autoClose:   findCol(H, 'up close'),
    autoFar:     findCol(H, 'far away'),
    capacity:    findCol(H, 'hold'),
    ballsAuto:   findCol(H, 'shooting in auto'),
    leave:       findCol(H, 'leave'),
    avgAuto:     findCol(H, 'average', 'auto'),
    highAuto:    findCol(H, 'highest', 'auto'),
    avgTeleop:   findCol(H, 'average', 'teleop'),
    highTeleop:  findCol(H, 'highest', 'teleop'),
    hasGoal:     findCol(H, 'point range'),
    goalDetail:  findCol(H, 'if so'),
    endgame:     findCol(H, 'endgame'),
  };

  if (cols.teamName === -1) throw new Error('Can\'t find "Team name" column. Wrong sheet?');

  const byTeam = {};
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const raw = (r[cols.teamName] ?? '').trim();
    const num = parseTeamNum(raw);
    if (!num) continue;
    const nameMatch = raw.match(/^\d+\s*[-–]+\s*(.+)/);
    byTeam[num] = byTeam[num] || [];
    byTeam[num].push({
      teamNameFromForm: nameMatch ? nameMatch[1].trim() : '',
      hasAuto:    cols.hasAuto    !== -1 ? normalizeBool(r[cols.hasAuto])       : false,
      autoClose:  cols.autoClose  !== -1 ? normalizeBool(r[cols.autoClose])     : false,
      autoFar:    cols.autoFar    !== -1 ? normalizeBool(r[cols.autoFar])       : false,
      capacity:   cols.capacity   !== -1 ? parseMessyNum(r[cols.capacity])      : 0,
      ballsAuto:  cols.ballsAuto  !== -1 ? parseMessyNum(r[cols.ballsAuto])     : 0,
      leave:      cols.leave      !== -1 ? normalizeBool(r[cols.leave])         : false,
      avgAuto:    cols.avgAuto    !== -1 ? parseMessyNum(r[cols.avgAuto])       : 0,
      highAuto:   cols.highAuto   !== -1 ? parseMessyNum(r[cols.highAuto])      : 0,
      avgTeleop:  cols.avgTeleop  !== -1 ? parseMessyNum(r[cols.avgTeleop])     : 0,
      highTeleop: cols.highTeleop !== -1 ? parseMessyNum(r[cols.highTeleop])    : 0,
      hasGoal:    cols.hasGoal    !== -1 ? normalizeBool(r[cols.hasGoal])       : false,
      goalDetail: cols.goalDetail !== -1 ? (r[cols.goalDetail] ?? '').trim()    : '',
      endgame:    cols.endgame    !== -1 ? (r[cols.endgame] ?? '').trim()       : '',
    });
  }

  return Object.entries(byTeam).map(([teamNumber, entries]) => {
    const n = entries.length;
    const avg = f => Math.round(entries.reduce((s,e)=>s+e[f],0)/n*10)/10;
    const hi  = f => Math.max(...entries.map(e=>e[f]));
    return {
      teamNumber,
      teamNameFromForm: entries[n-1].teamNameFromForm,
      matchCount: n,
      hasAuto:    entries.some(e=>e.hasAuto),
      autoClose:  entries.some(e=>e.autoClose),
      autoFar:    entries.some(e=>e.autoFar),
      leave:      entries.some(e=>e.leave),
      hasGoal:    entries.some(e=>e.hasGoal),
      capacity:   hi('capacity') || '',
      ballsAuto:  avg('ballsAuto'),
      avgAuto:    avg('avgAuto'),
      highAuto:   hi('highAuto'),
      avgTeleop:  avg('avgTeleop'),
      highTeleop: hi('highTeleop'),
      goalDetail: entries.map(e=>e.goalDetail).filter(Boolean).join(' | '),
      endgame:    entries.map(e=>e.endgame).filter(Boolean).join(' | '),
      source: 'sheet', humanEdits: {}, fetchStatus: 'ok',
    };
  });
}
