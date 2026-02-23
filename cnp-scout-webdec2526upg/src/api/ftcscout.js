import { SEASON } from '../constants.js';

const ENDPOINT = '/api/ftcscout';

// Simplified query — only use fields confirmed in FTCScout schema
const QUERY = `
  query TeamStats($number: Int!, $season: Int!) {
    teamByNumber(number: $number) {
      name
      quickStats(season: $season) {
        tots { value rank }
        auto { value rank }
      }
    }
  }
`;

export async function fetchTeamStats(teamNumber) {
  const num = parseInt(teamNumber, 10);
  if (isNaN(num)) throw new Error('Invalid team number');

  const res = await fetch(ENDPOINT, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ query: QUERY, variables: { number: num, season: SEASON } }),
  });

  if (!res.ok) throw new Error(`FTCScout proxy ${res.status}`);
  const json = await res.json();

  // Surface GraphQL errors for debugging
  if (json.errors) throw new Error(json.errors.map(e => e.message).join(', '));

  const team = json?.data?.teamByNumber;
  if (!team) return null;

  const qs = team.quickStats;
  return {
    teamName:  team.name ?? null,
    opr:       qs?.tots?.value != null ? Number(qs.tots.value).toFixed(2) : '',
    stateRank: qs?.tots?.rank  != null ? String(qs.tots.rank)              : '',
    autoAvg:   qs?.auto?.value != null ? Number(qs.auto.value).toFixed(2)  : '',
    epa:       '', // FTCScout doesn't expose EPA directly
  };
}
