import { parseNum, normalizeBool, parseTeamNum } from '../helpers.js';

// Fetch CSV directly from published Google Sheet — no API key needed
export async function fetchSheetCSV(csvUrl) {
  const res = await fetch(csvUrl);
  if (!res.ok) throw new Error(`Could not fetch sheet (${res.status}). Make sure it's published as CSV.`);
  const text = await res.text();
  return text;
}

function parseCSV(text) {
  const rows = [];
  const lines = text.split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    // Handle quoted fields with commas inside
    const row = [];
    let current = '', inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { row.push(current.trim()); current = ''; }
      else { current += ch; }
    }
    row.push(current.trim());
    rows.push(row);
  }
  return rows;
}

export async function fetchSheetHeaders(csvUrl) {
  const text = await fetchSheetCSV(csvUrl);
  const rows = parseCSV(text);
  return rows[0] ?? [];
}

export async function fetchSheetTeams(csvUrl, mapping) {
  const text = await fetchSheetCSV(csvUrl);
  const rows = parseCSV(text);
  if (rows.length < 2) return [];

  const headerRow = rows[0];

  function colIdx(field) {
    const mapped = mapping[field];
    if (!mapped) return -1;
    return headerRow.findIndex(h => h.trim().toLowerCase() === mapped.trim().toLowerCase());
  }

  const byTeam = {};

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rawTeam = String(row[colIdx('teamName')] ?? '').trim();
    const teamNumber = parseTeamNum(rawTeam);
    if (!teamNumber) continue;

    const entry = {
      hasAuto:         normalizeBool(row[colIdx('hasAuto')]        ?? ''),
      autoCloseRange:  normalizeBool(row[colIdx('autoCloseRange')] ?? ''),
      autoFarRange:    normalizeBool(row[colIdx('autoFarRange')]    ?? ''),
      ballCapacity:    String(row[colIdx('ballCapacity')]           ?? '').trim(),
      autoLeave:       normalizeBool(row[colIdx('autoLeave')]       ?? ''),
      avgBallsAuto:    parseNum(row[colIdx('avgBallsAuto')]),
      highBallsAuto:   parseNum(row[colIdx('highBallsAuto')]),
      avgBallsTeleop:  parseNum(row[colIdx('avgBallsTeleop')]),
      highBallsTeleop: parseNum(row[colIdx('highBallsTeleop')]),
      endgamePlan:     String(row[colIdx('endgamePlan')]            ?? '').trim(),
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
    avg.endgamePlan    = entries.map(r => r.endgamePlan).filter(Boolean).join(' | ');
    const caps = entries.map(r => parseInt(r.ballCapacity)).filter(n => !isNaN(n));
    avg.ballCapacity   = caps.length ? String(Math.max(...caps)) : entries[entries.length-1].ballCapacity;

    results.push({
      teamNumber, matchCount: entries.length,
      source: 'form', humanEdits: {}, fetchStatus: 'idle',
      ...avg,
    });
  }

  return results;
}
