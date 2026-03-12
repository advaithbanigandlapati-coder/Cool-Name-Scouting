import { MY_TEAM_NUM, MY_TEAM_NAME, GAME_NAME, PTS } from '../constants.js';
import { calcEst } from '../helpers.js';

const fv = v => (v === null || v === undefined || v === '') ? '—' : String(v);
const fb = v => v ? '✓' : '✗';

function teamLine(t) {
  const parts = [`#${t.teamNumber} "${t.teamName||'Unknown'}"`];
  if (t.stateRank)    parts.push(`rank=${t.stateRank}`);
  if (t.wlt)          parts.push(`wlt=${t.wlt}`);
  if (t.opr)          parts.push(`opr=${t.opr}`);
  if (t.tournamentPts)parts.push(`tpts=${t.tournamentPts}`);
  if (t.highScore)    parts.push(`high=${t.highScore}`);
  if (t.matchPoints)  parts.push(`matchPts=${t.matchPoints}`);
  if (t.conference)   parts.push(`conf=${t.conference}`);
  // scouted fields — only if filled
  if (t.hasAuto != null)      parts.push(`auto=${fb(t.hasAuto)}`);
  if (t.autoClose)            parts.push(`closeAuto`);
  if (t.autoFar)              parts.push(`farAuto`);
  if (t.autoArtifacts)        parts.push(`autoArt=${t.autoArtifacts}`);
  if (t.teleopArtifacts)      parts.push(`tpArt=${t.teleopArtifacts}`);
  if (t.canShoot != null)     parts.push(`shoots=${fb(t.canShoot)}`);
  if (t.shootRange)           parts.push(`range=${t.shootRange}`);
  if (t.playsDefense)         parts.push(`DEFENSE`);
  if (t.parkType)             parts.push(`park=${t.parkType}`);
  const notes = (t.stratNotes||t.notes||t.scoutNotes||'').slice(0, 80);
  if (notes)                  parts.push(`notes="${notes}"`);
  return parts.join(' | ');
}

function buildBatchPrompt(batch, mine) {
  return `FTC DECODE 2025-26 strategist for #${MY_TEAM_NUM} ${MY_TEAM_NAME} (NJ States, Turnpike division).

OUR ROBOT: rank=${fv(mine.stateRank)} | opr=${fv(mine.opr)} | wlt=${fv(mine.wlt)} | high=${fv(mine.highScore)} | auto:close+far | teleop:25art | park:full
Strengths: ${mine.strengths||'high cycle speed, full base return'} | Weaknesses: ${mine.weaknesses||'—'}

DECODE KEY FACTS: Classified=3pts, Overflow=1pt. Gate must be opened to keep scoring. Full base return = 20pts + 10pt alliance bonus if BOTH robots return. Motif pattern match = +2pts/artifact.

ANALYZE THESE ${batch.length} TEAMS — respond with ONLY a JSON array, no other text:
${batch.map(teamLine).join('\n')}

Tier must be exactly "OPTIMAL", "MID", or "BAD".
[{"teamNumber":"XXXX","tier":"OPTIMAL","compatScore":85,"notes":"2-3 sentences","complementary":"1 sentence","whyAlliance":"2-3 sentences","withTips":["tip1","tip2","tip3"],"againstTips":["tip1","tip2","tip3"]}]`;
}

function extractJSON(raw) {
  let s = raw.replace(/```json\n?|```\n?/g, '').trim();
  const start = s.indexOf('[');
  const end   = s.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`No JSON array in response. Got: ${s.slice(0,300)}`);
  }
  s = s.slice(start, end + 1);
  try {
    return JSON.parse(s);
  } catch {
    return JSON.parse(s.replace(/,\s*([}\]])/g, '$1'));
  }
}

async function analyzeBatch(batch, mine) {
  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 6000,
    messages: [{ role: 'user', content: buildBatchPrompt(batch, mine) }],
  };
  const res  = await fetch('/api/analyze', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  const raw = data.content.filter(b => b.type === 'text').map(b => b.text).join('');
  return extractJSON(raw);
}

export async function runAnalysis(teams, mine, onProgress) {
  const BATCH_SIZE = 8;
  const results = [];
  for (let i = 0; i < teams.length; i += BATCH_SIZE) {
    const batch = teams.slice(i, i + BATCH_SIZE);
    onProgress && onProgress(i, teams.length);
    const batchResult = await analyzeBatch(batch, mine);
    results.push(...batchResult);
    // Small delay between batches to avoid rate limits
    if (i + BATCH_SIZE < teams.length) await new Promise(r => setTimeout(r, 2000));
  }
  return results;
}

export async function scanTeams(teamNumbers, state) {
  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    messages: [{
      role: 'user',
      content: `Search FTCScout for these FTC DECODE 2025-26 teams in ${state||'New Jersey'}: ${teamNumbers.join(', ')}.
Find for each: team name, state rank, OPR, EPA, W-L-T, avg match points, high score, matches played, RS qualified.
Return ONLY a JSON array, zero markdown, zero preamble:
[{"teamNumber":"XXXX","teamName":"Name","stateRank":"1","rs":"Yes","matchPoints":"71.5","highScore":"90","wlt":"10-0-0","plays":"16","opr":"3.70","epa":""}]`,
    }],
  };
  const res  = await fetch('/api/analyze', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  const raw = data.content.filter(b => b.type === 'text').map(b => b.text).join('');
  return extractJSON(raw);
}
