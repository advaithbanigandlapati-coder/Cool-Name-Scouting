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

function buildPrompt(teams, mine) {
  const corrections = teams.flatMap(t =>
    Object.entries(t.humanEdits||{}).map(([f,e]) =>
      `  #${t.teamNumber}: "${f}" corrected to "${e.value}" — reason: ${e.reason}`
    )
  );

  return `You are an elite FTC strategist for DECODE 2025-26.

═══ DECODE GAME REFERENCE ═══
Structure: 2-robot alliances. Each alliance has a GOAL → CLASSIFIER (SQUARE + RAMP + GATE). 
Artifacts: 24 purple + 12 green per side. OBELISK randomizes MOTIF (GPP/PGP/PPG) before each match.
Robots score Artifacts through the GOAL. GATE must be opened by a robot to continue scoring once ramp fills.

SCORING (official point values):
  AUTO (30s):  Leave=${PTS.leave}pts | Classified=${PTS.autoClassified}pts | Overflow=${PTS.autoOverflow}pt | Pattern match=${PTS.autoPattern}pts/artifact
  TELEOP (2m): Classified=${PTS.teleopClassified}pts | Overflow=${PTS.teleopOverflow}pt | Depot=${PTS.depot}pt | Pattern=${PTS.teleopPattern}pts/artifact  
  ENDGAME:     Partial Base=${PTS.basePartial}pts | Full Base=${PTS.baseFull}pts | BOTH robots fully returned=+${PTS.baseBothBonus}pts ALLIANCE bonus
  RPs (regular events): Movement≥${PTS.movementRpThreshold} | Goal≥${PTS.goalRpThreshold} artifacts | Pattern≥${PTS.patternRpThreshold}pts

CRITICAL STRATEGY FACTS:
  • Classified (3pts) = 3× more valuable than Overflow (1pt). Prioritize classification accuracy.
  • Gate operation is ESSENTIAL — once ramp fills (9 artifacts), robot MUST open Gate to keep scoring.
  • MOTIF awareness: placing correct color at correct ramp index = +2pts each. Green vs purple ORDER matters.
  • Base endgame: BOTH robots fully returning = 10+10+10 = 30pts per team + 10 alliance bonus. Match-deciding.
  • Movement RP requires both robots leave AND return to base. Requires alliance coordination.
  • Depot (1pt) is fallback for overflow or late-match positioning.
  • NOTE: This form tracks "balls" — these are ARTIFACTS in DECODE terminology.

OUR ROBOT — #${MY_TEAM_NUM} ${MY_TEAM_NAME}:
${teamBlock({...mine, teamNumber:MY_TEAM_NUM, teamName:MY_TEAM_NAME, wlt:mine.wlt, stateRank:'15', rs:'Yes'}, `#${MY_TEAM_NUM} ${MY_TEAM_NAME}`)}
  Strengths: ${mine.strengths||'—'}
  Weaknesses: ${mine.weaknesses||'—'}
  Strategy: ${mine.strategy||'—'}
  Notes: ${mine.extraNotes||'—'}

${corrections.length ? `HUMAN CORRECTIONS (user-verified truths — never override):\n${corrections.join('\n')}\n` : ''}
═══ ALL SCOUTED TEAMS ═══
${teams.map(t => teamBlock(t, `Team #${t.teamNumber} "${t.teamName||'Unknown'}"`)).join('\n\n')}

Use web_search to look up each team on FTCScout for DECODE 2025-26 to verify and enrich data.
If human corrections exist for a team, respect them — never revert to pre-correction values.

For EACH team return:
- tier: "OPTIMAL" | "MID" | "BAD" — based on complementarity with OUR robot specifically
- compatScore: 0–100 integer
- notes: 2–3 punchy, specific sentences about this team's DECODE capabilities, tendencies, risks
- complementary: 1 concise sentence — exactly HOW they complement or conflict with #${MY_TEAM_NUM}
- whyAlliance: 2–3 sentences — alliance synergy covering Gate ops, Motif coordination, Base bonus setup
- withTips: exactly 3 actionable DECODE-specific in-match tips when allied (Gate timing, Motif color, Base coord)
- againstTips: exactly 3 actionable DECODE-specific tips when opposing them

Return ONLY a valid JSON array. Zero markdown. Zero preamble. Zero explanation:
[{"teamNumber":"XXXX","tier":"OPTIMAL","compatScore":88,"notes":"...","complementary":"...","whyAlliance":"...","withTips":["","",""],"againstTips":["",""",""]}]`;
}

export async function runAnalysis(teams, mine) {
  const body = {
    model: 'claude-sonnet-4-20250514', max_tokens: 8000,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    messages: [{ role: 'user', content: buildPrompt(teams, mine) }],
  };
  const res  = await fetch('/api/analyze', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  const raw   = data.content.filter(b=>b.type==='text').map(b=>b.text).join('');
  const clean = raw.replace(/```json\n?|```\n?/g,'').trim();
  return JSON.parse(clean);
}

export async function scanTeams(teamNumbers, state) {
  const body = {
    model: 'claude-sonnet-4-20250514', max_tokens: 4000,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    messages: [{ role:'user', content:
      `Search FTCScout for these FTC DECODE 2025-26 teams in ${state||'the US'}: ${teamNumbers.join(', ')}.
Find for each: team name, state rank, OPR, EPA, W-L-T, avg match points, avg auto points, high score, matches played, regionals qualified (RS yes/no).
Return ONLY JSON array, zero markdown:
[{"teamNumber":"XXXX","teamName":"Name","stateRank":"15","rs":"Yes","matchPoints":"71.5","basePoints":"","autoPoints":"10.5","highScore":"90","wlt":"10-0-0","plays":"16","opr":"3.70","epa":""}]` }],
  };
  const res  = await fetch('/api/analyze', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  const raw   = data.content.filter(b=>b.type==='text').map(b=>b.text).join('');
  const clean = raw.replace(/```json\n?|```\n?/g,'').trim();
  return JSON.parse(clean);
}
