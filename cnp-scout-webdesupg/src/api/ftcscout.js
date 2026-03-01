import { SEASON } from '../constants.js';

const ENDPOINT = 'https://api.ftcscout.org/graphql';

const QUERY = `
  query TeamStats($number: Int!, $season: Int!) {
    teamByNumber(number: $number) {
      name
      quickStats(season: $season) {
        tots { value rank }
        auto { value rank }
        np   { value rank }
      }
    }
  }
`;

export async function fetchTeamStats(teamNumber) {
  const num = parseInt(teamNumber, 10);
  if (isNaN(num)) throw new Error('Invalid team number');
  const res  = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { number: num, season: SEASON } }),
  });
  if (!res.ok) throw new Error(`FTCScout ${res.status}`);
  const json = await res.json();
  const team = json?.data?.teamByNumber;
  if (!team) return null;
  const qs = team.quickStats;
  return {
    teamName:  team.name ?? null,
    opr:       qs?.tots?.value != null ? qs.tots.value.toFixed(2) : '',
    epa:       qs?.np?.value   != null ? qs.np.value.toFixed(2)   : '',
    stateRank: qs?.tots?.rank  != null ? String(qs.tots.rank)      : '',
    autoAvg:   qs?.auto?.value != null ? qs.auto.value.toFixed(2)  : '',
  };
}
