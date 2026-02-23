import { MY_TEAM_NUM, MY_TEAM_NAME, GAME_NAME, PTS } from '../constants.js';
import { calcEst } from '../helpers.js';

const fv = v => (v === null || v === undefined || v === '') ? '—' : String(v);
const fb = v => v ? '✓' : '✗';

function teamBlock(t, label) {
  const hasFormData = t.avgBallsTeleop || t.avgBallsAuto || t.endgamePlan;
  return `${label}
  Record: W-L-T=${fv(t.wlt)} | State Rank=${fv(t.stateRank)} | RS=${fv(t.rs)} | Plays=${fv(t.plays)} | 1.17.26 RP=${fv(t.rpScore)}
  Performance: MatchPts=${fv(t.matchPoints)} | BasePts=${fv(t.basePoints)} | AutoPts=${fv(t.autoPoints)} | HighScore=${fv(t.highScore)}
  FTCScout: OPR=${fv(t.opr)} | EPA=${fv(t.epa)}
  ${hasFormData ? `Scouted: AutoAvg=${fv(t.avgBallsAuto)} | AutoHigh=${fv(t.highBallsAuto)} | TeleopAvg=${fv(t.avgBallsTeleop)} | TeleopHigh=${fv(t.highBallsTeleop)} | Capacity=${fv(t.ballCapacity)} | Leave=${fb(t.autoLeave)} | HasAuto=${fb(t.hasAuto)} | CloseAuto=${fb(t.autoCloseRange)} | FarAuto=${fb(t.autoFarRange)}` : 'Scouted: No form data yet'}
  Endgame Plan: ${fv(t.endgamePlan)}
  Est Score: ~${calcEst(t)} pts
  Human corrections: ${Object.keys(t.humanEdits||{}).length ? Object.entries(t.humanEdits).map(([k,v])=>`${k}="${v.value}"`).join(', ') : 'none'}`;
}

function gameRef() {
  return `DECODE 2025-26 GAME REFERENCE:
Structure: 2-robot alliances. GOAL → CLASSIFIER (SQUARE + RAMP + GATE).
Artifacts: 24 purple + 12 green per side. OBELISK randomizes MOTIF (GPP/PGP/PPG) each match.
AUTO (30s): Leave=${PTS.leave}pts | Classified=${PTS.autoClassified}pts | Overflow=${PTS.autoOverflow}pt | Pattern=${PTS.autoPattern}pts
TELEOP (2m): Classified=${PTS.teleopClassified}pts | Overflow=${PTS.teleopOverflow}pt | Depot=${PTS.depot}pt | Pattern=${PTS.teleopPattern}pts
ENDGAME: Partial=${PTS.basePartial}pts | Full=${PTS.baseFull}pts | Both robots full = +${PTS.baseBothBonus}pts alliance bonus
CRITICAL: Gate MUST be opened once ramp fills (9 artifacts). Classified (3pts) = 3× Overflow (1pt).`;
}

async function callAPI(body) {
  const res  = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data;
}

function extractJSON(data) {
  const raw   = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  // Strip markdown code fences and leading/trailing whitespace
  const clean = raw.replace(/^[\s\S]*?(\[[\s\S]*\])[\s\S]*$/, '$1').trim();
  try {
    return JSON.parse(clean);
  } catch {
    // Try to find first [ ... ] block
    const m = raw.match(/\[[\s\S]*\]/);
    if (m) return JSON.parse(m[0]);
    throw new Error('Claude response was not valid JSON. Raw: ' + raw.substring(0, 200));
  }
}

export async function runAnalysis(teams, mine) {
  const corrections = teams.flatMap(t =>
    Object.entries(t.humanEdits||{}).map(([f,e]) =>
      `  #${t.teamNumber}: "${f}" corrected to "${e.value}" — reason: ${e.reason}`
    )
  );
  const prompt = `You are an elite FTC strategist for DECODE 2025-26.

${gameRef()}

OUR ROBOT — #${MY_TEAM_NUM} ${MY_TEAM_NAME}:
${teamBlock({...mine, teamNumber:MY_TEAM_NUM, teamName:MY_TEAM_NAME}, `#${MY_TEAM_NUM} ${MY_TEAM_NAME}`)}
  Strengths: ${mine.strengths||'—'} | Weaknesses: ${mine.weaknesses||'—'}
  Strategy: ${mine.strategy||'—'} | Notes: ${mine.extraNotes||'—'}

${corrections.length ? `HUMAN CORRECTIONS (never override):\n${corrections.join('\n')}\n` : ''}
ALL SCOUTED TEAMS:
${teams.map(t => teamBlock(t, `#${t.teamNumber} "${t.teamName||'Unknown'}"`)).join('\n\n')}

Use web_search to look up each team on FTCScout for DECODE 2025-26 stats if data is missing.
For EACH team return ONLY a JSON array (zero markdown, zero preamble):
[{"teamNumber":"XXXX","tier":"OPTIMAL|MID|BAD","compatScore":0-100,"notes":"2-3 sentences","complementary":"1 sentence","whyAlliance":"2-3 sentences","withTips":["tip1","tip2","tip3"],"againstTips":["tip1","tip2","tip3"]}]`;

  const data = await callAPI({
    model: 'claude-opus-4-6', max_tokens: 8000,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    messages: [{ role: 'user', content: prompt }],
  });
  return extractJSON(data);
}

export async function scanTeams(teamNumbers, state) {
  const prompt = `Search FTCScout for FTC DECODE 2025-26 teams in ${state||'the US'}: ${teamNumbers.join(', ')}.
For each find: team name, state rank, OPR, EPA, W-L-T, avg match points, avg auto points, high score, matches played, regionals qualified (yes/no).
Return ONLY a JSON array, zero markdown:
[{"teamNumber":"XXXX","teamName":"Name","stateRank":"15","rs":"Yes","matchPoints":"71.5","basePoints":"","autoPoints":"10.5","highScore":"90","wlt":"10-0-0","plays":"16","opr":"3.70","epa":""}]`;

  const data = await callAPI({
    model: 'claude-opus-4-6', max_tokens: 4000,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    messages: [{ role: 'user', content: prompt }],
  });
  return extractJSON(data);
}

// Chat with Claude about a specific opponent team — multi-turn
export async function researchOpponent(teamNumber, ourTeam, mine, history = []) {
  const systemPrompt = `You are a sharp FTC alliance strategy assistant for team #${MY_TEAM_NUM} ${MY_TEAM_NAME}.
${gameRef()}
Our robot: ${teamBlock({...mine, teamNumber:MY_TEAM_NUM, teamName:MY_TEAM_NAME}, `#${MY_TEAM_NUM}`)}
Strengths: ${mine.strengths||'—'} | Weaknesses: ${mine.weaknesses||'—'}
Be concise and actionable. Use bullet points when listing tips. Always reference DECODE-specific mechanics.`;

  const initialPrompt = history.length === 0
    ? `Research FTC team #${teamNumber} for DECODE 2025-26. Use web_search to find their stats on FTCScout, recent match results, and any video/scouting info.
Then give me:
1. **Team Overview** — who they are, record, ranking
2. **Scoring Profile** — what they score in auto/teleop/endgame typically
3. **Key Strengths & Weaknesses**
4. **Strategic Tips** — 3 bullets for playing AGAINST them in DECODE
5. **What to Watch For** — their biggest threat to us specifically`
    : null;

  const messages = history.length > 0
    ? history
    : [{ role: 'user', content: initialPrompt }];

  const data = await callAPI({
    model: 'claude-opus-4-6', max_tokens: 2000,
    system: systemPrompt,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    messages,
  });
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  return text;
}
