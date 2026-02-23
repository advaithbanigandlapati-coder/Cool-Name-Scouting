import { SEASON } from '../constants.js';

const ENDPOINT = '/api/ftcscout';

const STATS_QUERY = `
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
  if (isNaN(num)) return null;

  let res;
  try {
    res = await fetch(ENDPOINT, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ query: STATS_QUERY, variables: { number: num, season: SEASON } }),
    });
  } catch (err) {
    throw new Error(`Network: ${err.message}`);
  }

  if (!res.ok) throw new Error(`Proxy ${res.status}`);

  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error('Proxy returned non-JSON — is server.js deployed?');
  }

  // GraphQL errors mean the team just has no data — not a hard failure
  if (json.errors) return null;

  const team = json?.data?.teamByNumber;
  if (!team) return null;

  const qs = team.quickStats;
  return {
    teamName:  team.name ?? null,
    opr:       qs?.tots?.value != null ? Number(qs.tots.value).toFixed(2) : '',
    stateRank: qs?.tots?.rank  != null ? String(qs.tots.rank)              : '',
    autoAvg:   qs?.auto?.value != null ? Number(qs.auto.value).toFixed(2)  : '',
    epa:       '',
  };
}
