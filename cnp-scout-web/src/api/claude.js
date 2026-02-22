import { calcEst, fmt, fmtWLT, endgameLabel } from '../helpers.js';
import { MY_TEAM_NUM, MY_TEAM_NAME } from '../constants.js';

function buildPrompt(teams, mine) {
  const myPts = calcEst(mine);

  const teamBlocks = teams.map(t => `
Team #${t.teamNumber} "${t.teamName || 'Unknown'}":
  Est Score: ${calcEst(t)} pts${t.avgScore ? ` | FTCScout Avg: ${fmt(t.avgScore, 1)}` : ''}
  OPR: ${fmt(t.opr, 1)} | EPA/NP: ${fmt(t.epa, 1)} | State Rank: ${fmt(t.stateRank)}
  W-L-T: ${fmtWLT(t)} | High Score: ${fmt(t.highScore)} | Auto Avg: ${fmt(t.autoPoints, 1)}
  Auto: ${t.autoSamples} samples, ${t.autoSpecimen} specimen, park: ${t.autoParking}
  Teleop: LowBasket×${t.teleopLowBasket} HighBasket×${t.teleopHighBasket} LowChamber×${t.teleopLowChamber} HighChamber×${t.teleopHighChamber}
  Endgame: ${endgameLabel(t.endgame)}`).join('\n');

  return `You are an expert FTC strategist for the 2025-26 Decode season.
You are advising team ${MY_TEAM_NAME} #${MY_TEAM_NUM} — they won Inspire 2 at their league meet and are pushing hard for Inspire 1 and States.

OUR ROBOT (#${MY_TEAM_NUM}):
  Est. score: ${myPts} pts
  Auto: ${mine.autoSamples} samples, ${mine.autoSpecimen} specimen, park: ${mine.autoParking}
  Teleop: LowBasket×${mine.teleopLowBasket} HighBasket×${mine.teleopHighBasket} LowChamber×${mine.teleopLowChamber} HighChamber×${mine.teleopHighChamber}
  Endgame: ${endgameLabel(mine.endgame)}

SCOUTED TEAMS:
${teamBlocks}

Use web_search to look up "FTCScout team [number] Into The Deep 2024" for each team before analyzing.

For EACH scouted team return:
- tier: "OPTIMAL", "MID", or "BAD" based on complementarity with our robot
- compatScore: 0–100 integer
- role: short punchy label (e.g. "Auto Powerhouse", "Cycle Bot", "Endgame Anchor")
- summary: one punchy specific sentence
- whyAlliance: 2–3 sentences on synergy or friction with #${MY_TEAM_NUM}
- withTips: exactly 3 actionable in-game tips when ALLIED with them
- againstTips: exactly 3 actionable in-game tips when playing AGAINST them

Consider: auto zone conflicts, scoring lane overlap, endgame crowding, DPR, cycle timing.

Return ONLY valid JSON array, zero markdown, zero extra text:
[{"teamNumber":"XXXX","tier":"OPTIMAL","compatScore":88,"role":"Role","summary":"Sentence.","whyAlliance":"2–3 sentences.","withTips":["tip","tip","tip"],"againstTips":["tip","tip","tip"]}]`;
}

export async function runAllianceAnalysis(teams, mine) {
  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
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
