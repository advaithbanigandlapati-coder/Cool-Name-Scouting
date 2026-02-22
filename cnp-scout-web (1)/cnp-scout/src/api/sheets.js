import { parseNum, normalizeEndgame, normalizeParking } from '../helpers.js';

/**
 * Fetch headers from Google Sheet (row 1)
 */
async function sheetsGet(sheetId, range, googleApiKey) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?key=${googleApiKey}`;
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || `Sheets API ${res.status}`);
  return json;
}

export async function fetchSheetHeaders({ sheetId, googleApiKey }) {
  const json = await sheetsGet(sheetId, 'A1:Z1', googleApiKey);
  return json.values?.[0] ?? [];
}

export async function fetchSheetTeams({ sheetId, googleApiKey }, mapping, headers) {
  const json = await sheetsGet(sheetId, 'A1:Z1000', googleApiKey);

  const rows = json.values ?? [];
  if (rows.length < 2) return [];

  const headerRow = rows[0];

  // Build a helper: field → column index
  function colIndex(fieldKey) {
    const mapped = mapping[fieldKey];
    if (!mapped) return -1;
    // If it's a letter (A, B, C...) convert to 0-indexed
    if (/^[A-Za-z]$/.test(mapped)) return mapped.toUpperCase().charCodeAt(0) - 65;
    // Otherwise treat as header text match
    const idx = headerRow.findIndex(h => h.trim().toLowerCase() === mapped.trim().toLowerCase());
    return idx;
  }

  const teams = [];
  // Aggregate multiple rows per team (scouted in multiple matches → average)
  const byTeam = {};

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const teamNum = String(row[colIndex('teamNumber')] ?? '').trim();
    if (!teamNum) continue;

    const entry = {
      autoSamples:       parseNum(row[colIndex('autoSamples')]),
      autoSpecimen:      parseNum(row[colIndex('autoSpecimen')]),
      autoParking:       normalizeParking(row[colIndex('autoParking')] ?? ''),
      teleopLowBasket:   parseNum(row[colIndex('teleopLowBasket')]),
      teleopHighBasket:  parseNum(row[colIndex('teleopHighBasket')]),
      teleopLowChamber:  parseNum(row[colIndex('teleopLowChamber')]),
      teleopHighChamber: parseNum(row[colIndex('teleopHighChamber')]),
      endgame:           normalizeEndgame(row[colIndex('endgame')] ?? ''),
    };

    if (!byTeam[teamNum]) byTeam[teamNum] = [];
    byTeam[teamNum].push(entry);
  }

  // Average numeric fields per team, take max endgame seen
  const numFields = ['autoSamples','autoSpecimen','teleopLowBasket','teleopHighBasket','teleopLowChamber','teleopHighChamber'];
  const endgamePriority = { none: 0, level1: 1, level2: 2, level3: 3 };
  const parkPriority    = { none: 0, observation: 1, ascent: 2 };

  for (const [teamNumber, rows] of Object.entries(byTeam)) {
    const avg = {};
    for (const f of numFields) {
      avg[f] = Math.round(rows.reduce((s, r) => s + r[f], 0) / rows.length);
    }
    // Best endgame observed
    avg.endgame = rows.reduce((best, r) =>
      (endgamePriority[r.endgame] ?? 0) > (endgamePriority[best] ?? 0) ? r.endgame : best,
      'none'
    );
    avg.autoParking = rows.reduce((best, r) =>
      (parkPriority[r.autoParking] ?? 0) > (parkPriority[best] ?? 0) ? r.autoParking : best,
      'none'
    );

    teams.push({
      teamNumber,
      teamName: '',
      opr: null, epa: null, dpr: null,
      autoPoints: null, avgScore: null, stateRank: null,
      wins: null, losses: null, ties: null, highScore: null,
      fetchStatus: 'idle',
      matchCount: rows.length,
      ...avg,
    });
  }

  return teams;
}
