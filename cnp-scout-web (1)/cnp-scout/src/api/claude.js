import { MY_TEAM_NUM, MY_TEAM_NAME, GAME_NAME } from '../constants.js';

function fmtVal(v) {
  if (v === null || v === undefined || v === '') return '—';
  return String(v);
}

function buildPrompt(teams, mine) {
  const corrections = teams.flatMap(t =>
    Object.entries(t.humanEdits || {}).map(([field, edit]) =>
      `  Team #${t.teamNumber}: field "${field}" was corrected to "${edit.value}" — reason: "${edit.reason}"`
    )
  );

  const teamBlocks = teams.map(t => `
Team #${t.teamNumber} "${t.teamName || 'Unknown'}":
  State Rank: ${fmtVal(t.stateRank)} | RS: ${fmtVal(t.rs)} | W-L-T: ${fmtVal(t.wlt)} | Plays: ${fmtVal(t.plays)}
  Match Pts: ${fmtVal(t.matchPoints)} | Base Pts: ${fmtVal(t.basePoints)} | Auto Pts: ${fmtVal(t.autoPoints)} | High Score: ${fmtVal(t.highScore)}
  OPR: ${fmtVal(t.opr)} | EPA: ${fmtVal(t.epa)}
  Scouted — Auto: ${t.autoSamples}S ${t.autoSpecimen}Sp park:${t.autoParking}
  Scouted — Teleop: LB×${t.teleopLowBasket} HB×${t.teleopHighBasket} LC×${t.teleopLowChamber} HC×${t.teleopHighChamber}
  Scouted — Endgame: ${t.endgame}
  Human corrections: ${Object.keys(t.humanEdits || {}).length > 0
    ? Object.entries(t.humanEdits).map(([k,v]) => `${k}="${v.value}" (${v.reason})`).join(', ')
    : 'none'}`
  ).join('\n');

  return `You are an expert FTC strategist for the ${GAME_NAME} season.
You are advising team ${MY_TEAM_NAME} #${MY_TEAM_NUM}.

OUR ROBOT (#${MY_TEAM_NUM}):
  Match Pts: ${fmtVal(mine.matchPoints)} | Auto Pts: ${fmtVal(mine.autoPoints)} | High Score: ${fmtVal(mine.highScore)}
  OPR: ${fmtVal(mine.opr)} | EPA: ${fmtVal(mine.epa)} | W-L-T: ${fmtVal(mine.wlt)}
  Scouted — Auto: ${mine.autoSamples}S ${mine.autoSpecimen}Sp park:${mine.autoParking}
  Scouted — Teleop: LB×${mine.teleopLowBasket} HB×${mine.teleopHighBasket} LC×${mine.teleopLowChamber} HC×${mine.teleopHighChamber}
  Scouted — Endgame: ${mine.endgame}
${corrections.length > 0 ? `\nHUMAN CORRECTIONS (respect these — user fixed AI errors):\n${corrections.join('\n')}` : ''}

SCOUTED TEAMS:
${teamBlocks}

Use web_search to look up each team on FTCScout and verify stats before analyzing.

IMPORTANT: Respect any human corrections listed above. The user has already fixed those fields — do NOT revert them.

For EACH team return:
- tier: "OPTIMAL", "MID", or "BAD" (based on complementarity with our robot)
- compatScore: 0–100
- notes: 2–3 punchy sentences about this team's strengths, weaknesses, and tendencies
- complementary: 1 sentence — specifically how they complement or conflict with #${MY_TEAM_NUM}
- whyAlliance: 2–3 sentences on synergy/friction
- withTips: exactly 3 actionable tips when allied
- againstTips: exactly 3 actionable tips when against them

Return ONLY valid JSON array, zero markdown:
[{"teamNumber":"XXXX","tier":"OPTIMAL","compatScore":88,"notes":"...","complementary":"...","whyAlliance":"...","withTips":["","",""],"againstTips":["",""",""]}]`;
}

export async function runAnalysis(teams, mine) {
  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 6000,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    messages: [{ role: 'user', content: buildPrompt(teams, mine) }],
  };

  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));

  const raw   = data.content.filter(b => b.type === 'text').map(b => b.text).join('');
  const clean = raw.replace(/```json\n?|```\n?/g, '').trim();
  return JSON.parse(clean);
}

// Initial scan — fetch team info via web search
export async function scanTeams(teamNumbers, state) {
  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    messages: [{
      role: 'user',
      content: `Search FTCScout for these FTC teams in ${state || 'the US'} for the ${GAME_NAME} season: ${teamNumbers.join(', ')}.

For each team find: team name, state rank, OPR, EPA, W-L-T record, match points avg, auto points avg, high score, number of matches played, and whether they are regionals-qualified (RS).

Return ONLY a JSON array, zero markdown:
[{"teamNumber":"XXXX","teamName":"Name","stateRank":"15","rs":"Yes","matchPoints":"71.5","basePoints":"","autoPoints":"10.5","highScore":"90","wlt":"10-0-0","plays":"16","opr":"3.70","epa":""}]`
    }],
  };

  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));

  const raw   = data.content.filter(b => b.type === 'text').map(b => b.text).join('');
  const clean = raw.replace(/```json\n?|```\n?/g, '').trim();
  return JSON.parse(clean);
}
