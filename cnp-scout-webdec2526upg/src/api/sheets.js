import { parseNum, normalizeBool, normalizeBase, parseTeamNum } from '../helpers.js';

async function sheetsGet(sheetId, range, googleApiKey) {
  const url  = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?key=${googleApiKey}`;
  const res  = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || `Sheets API ${res.status}`);
  return json;
}

export async function fetchSheetHeaders({ sheetId, googleApiKey }) {
  const json = await sheetsGet(sheetId, 'A1:Z1', googleApiKey);
  return json.values?.[0] ?? [];
}

export async function fetchSheetTeams({ sheetId, googleApiKey }, mapping) {
  const json = await sheetsGet(sheetId, 'A1:Z2000', googleApiKey);
  const rows = json.values ?? [];
  if (rows.length < 2) return [];

  const headerRow = rows[0];

  function colIdx(field) {
    const mapped = mapping[field];
    if (!mapped) return -1;
    if (/^[A-Za-z]$/.test(mapped)) return mapped.toUpperCase().charCodeAt(0) - 65;
    return headerRow.findIndex(h => h.trim().toLowerCase() === mapped.trim().toLowerCase());
  }

  const byTeam = {};

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // Team name column has format "755 -- Delbotics"
    const rawTeam = String(row[colIdx('teamName')] ?? '').trim();
    const teamNumber = parseTeamNum(rawTeam);
    if (!teamNumber) continue;

    const entry = {
      hasAuto:         normalizeBool(row[colIdx('hasAuto')]),
      autoCloseRange:  normalizeBool(row[colIdx('autoCloseRange')]),
      autoFarRange:    normalizeBool(row[colIdx('autoFarRange')]),
      ballCapacity:    String(row[colIdx('ballCapacity')] ?? '').trim(),
      autoLeave:       normalizeBool(row[colIdx('autoLeave')]),
      avgBallsAuto:    parseNum(row[colIdx('avgBallsAuto')]),
      highBallsAuto:   parseNum(row[colIdx('highBallsAuto')]),
      avgBallsTeleop:  parseNum(row[colIdx('avgBallsTeleop')]),
      highBallsTeleop: parseNum(row[colIdx('highBallsTeleop')]),
      endgamePlan:     String(row[colIdx('endgamePlan')] ?? '').trim(),
    };

    if (!byTeam[teamNumber]) byTeam[teamNumber] = [];
    byTeam[teamNumber].push(entry);
  }

  const numFields = ['avgBallsAuto','highBallsAuto','avgBallsTeleop','highBallsTeleop'];
  const results = [];

  for (const [teamNumber, entries] of Object.entries(byTeam)) {
    const avg = {};
    for (const f of numFields) {
      avg[f] = Math.round((entries.reduce((s,r) => s + r[f], 0) / entries.length) * 10) / 10;
    }
    avg.hasAuto        = entries.some(r => r.hasAuto);
    avg.autoCloseRange = entries.some(r => r.autoCloseRange);
    avg.autoFarRange   = entries.some(r => r.autoFarRange);
    avg.autoLeave      = entries.some(r => r.autoLeave);
    avg.ballCapacity   = entries[entries.length - 1].ballCapacity;
    avg.endgamePlan    = entries.map(r => r.endgamePlan).filter(Boolean).join(' | ');
    // best ball capacity seen
    const caps = entries.map(r => parseInt(r.ballCapacity)).filter(n => !isNaN(n));
    if (caps.length) avg.ballCapacity = String(Math.max(...caps));

    results.push({ teamNumber, matchCount: entries.length, source: 'form', humanEdits: {}, fetchStatus: 'idle', ...avg });
  }

  return results;
}
