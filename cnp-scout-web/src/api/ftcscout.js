import { SEASON } from '../constants.js';

const QUERY = `
  query TeamStats($number: Int!, $season: Int!) {
    teamByNumber(number: $number, season: $season) {
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

  const res = await fetch('https://api.ftcscout.org/graphql', {
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
    teamName:   team.name ?? null,
    opr:        qs?.tots?.value  ?? null,
    epa:        qs?.np?.value    ?? null,
    autoPoints: qs?.auto?.value  ?? null,
    stateRank:  qs?.tots?.rank   ?? null,
    avgScore:   qs?.tots?.value  ?? null,
    wins: null, losses: null, ties: null, highScore: null, dpr: null,
  };
}
