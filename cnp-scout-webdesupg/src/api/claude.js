import { MY_TEAM_NUM, MY_TEAM_NAME, GAME_NAME, PTS } from '../constants.js';
import { calcEst } from '../helpers.js';

const fv = v => (v === null || v === undefined || v === '') ? '—' : String(v);
const fb = v => v ? '✓' : '✗';

function teamBlock(t, label) {
  const hasFormData = t.teleopArtifacts || t.autoArtifacts || t.parkType;
  return `${label}
  Record: W-L-T=${fv(t.wlt)} | StateRank=${fv(t.stateRank)} | RS=${fv(t.rs)} | TournPts=${fv(t.tournamentPts)} | Conf=${fv(t.conference)}
  Performance: MatchPts=${fv(t.matchPoints)} | HighScore=${fv(t.highScore)} | OPR=${fv(t.opr)} | EPA=${fv(t.epa)}
  ${hasFormData
    ? `Scouted: AutoArt=${fv(t.autoArtifacts||t.avgAuto)} | TpArt=${fv(t.teleopArtifacts||t.avgTeleop)} | HasAuto=${fb(t.hasAuto)} | CloseAuto=${fb(t.autoClose)} | FarAuto=${fb(t.autoFar)} | Leave=${fb(t.leave)} | ReadsMotif=${fb(t.readsMotif)} | Shoots=${fb(t.canShoot)} | Range=${fv(t.shootRange)} | Defense=${fb(t.playsDefense)} | Park=${fv(t.parkType)}`
    : 'Scouted: No form data yet'}
  Notes: ${fv(t.stratNotes||t.notes||t.scoutNotes)}
  Human corrections: ${Object.keys(t.humanEdits||{}).length ? Object.entries(t.humanEdits).map(([k,v])=>`${k}="${v.value}"`).join(', ') : 'none'}`;
}

function buildPrompt(teams, mine) {
  const corrections = teams.flatMap(t =>
    Object.entries(t.humanEdits||{}).map(([f,e]) =>
      `  #${t.teamNumber}: "${f}" corrected to "${e.value}" — reason: ${e.reason}`
    )
  );

  return `You are an elite FTC strategist for DECODE 2025-26 NJ States.

═══ DECODE GAME REFERENCE ═══
Structure: 2-robot alliances. Artifacts scored through GOAL → CLASSIFIER (SQUARE + RAMP + GATE).
SCORING:
  AUTO (30s): Leave=${PTS.leave}pts | Classified=${PTS.autoClassified}pts | Overflow=${PTS.autoOverflow}pt | Pattern=${PTS.autoPattern}pts/artifact
  TELEOP (2m): Classified=${PTS.teleopClassified}pts | Overflow=${PTS.teleopOverflow}pt | Depot=${PTS.depot}pt | Pattern=${PTS.teleopPattern}pts/artifact
  ENDGAME: Partial=${PTS.basePartial}pts | Full=${PTS.baseFull}pts | BOTH full=+${PTS.baseBothBonus}pts alliance bonus
KEY: Gate must be opened once ramp fills. MOTIF color order = +2pts each artifact.

OUR ROBOT — #${MY_TEAM_NUM} ${MY_TEAM_NAME}:
${teamBlock({...mine, teamNumber:MY_TEAM_NUM, teamName:MY_TEAM_NAME}, `#${MY_TEAM_NUM} ${MY_TEAM_NAME}`)}
  Strengths: ${mine.strengths||'—'} | Weaknesses: ${mine.weaknesses||'—'}

${corrections.length ? `HUMAN CORRECTIONS (never override):\n${corrections.join('\n')}\n` : ''}
═══ ALL TEAMS ═══
${teams.map(t => teamBlock(t, `#${t.teamNumber} "${t.teamName||'Unknown'}"`)).join('\n\n')}

Use web_search to verify OPR/EPA/record on FTCScout for DECODE 2025-26 for any teams missing data.

Return ONLY a valid JSON array — NO markdown, NO preamble, NO explanation, NO text outside the array brackets:
[{"teamNumber":"XXXX","tier":"OPTIMAL","compatScore":88,"notes":"...","complementary":"...","whyAlliance":"...","withTips":["","",""],"againstTips":["","",""]}]`;
}

function extractJSON(raw) {
  // Strip markdown fences
  let s = raw.replace(/```json\n?|```\n?/g, '').trim();
  // Find first [ and last ]
  const start = s.indexOf('[');
  const end   = s.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`No JSON array found in response. Raw starts with: ${s.slice(0,200)}`);
  }
  s = s.slice(start, end + 1);
  try {
    return JSON.parse(s);
  } catch(e) {
    // Try to fix common issues: trailing commas, unescaped quotes in strings
    const fixed = s
      .replace(/,\s*([}\]])/g, '$1')  // trailing commas
      .replace(/([^\\])"([^"]*)"([^:,\]\}])/g, (m,p1,p2,p3) => `${p1}"${p2.replace(/"/g,'\\"')}"${p3}`);
    return JSON.parse(fixed);
  }
}

export async function runAnalysis(teams, mine) {
  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    messages: [{ role: 'user', content: buildPrompt(teams, mine) }],
  };
  const res  = await fetch('/api/analyze', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  const raw = data.content.filter(b=>b.type==='text').map(b=>b.text).join('');
  return extractJSON(raw);
}

export async function scanTeams(teamNumbers, state) {
  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    messages: [{ role:'user', content:
      `Search FTCScout for these FTC DECODE 2025-26 teams in ${state||'New Jersey'}: ${teamNumbers.join(', ')}.
Find for each: team name, state rank, OPR, EPA, W-L-T, avg match points, high score, matches played, RS qualified.
Return ONLY a JSON array, zero markdown, zero preamble:
[{"teamNumber":"XXXX","teamName":"Name","stateRank":"1","rs":"Yes","matchPoints":"71.5","highScore":"90","wlt":"10-0-0","plays":"16","opr":"3.70","epa":""}]` }],
  };
  const res  = await fetch('/api/analyze', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  const raw = data.content.filter(b=>b.type==='text').map(b=>b.text).join('');
  return extractJSON(raw);
}
