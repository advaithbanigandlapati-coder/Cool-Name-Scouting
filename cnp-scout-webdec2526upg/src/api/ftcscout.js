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

async function gql(query, variables) {
  const res = await fetch(ENDPOINT, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ query, variables }),
  });

  // If we get HTML back, the proxy endpoint doesn't exist on the server
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`/api/ftcscout endpoint not found (got ${res.status} ${contentType.split(';')[0]}). Deploy the updated server.js.`);
  }

  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map(e => e.message).join(', '));
  return json;
}

// Quick probe with a known team — call this before bulk fetching
export async function probeProxy() {
  const json = await gql(STATS_QUERY, { number: 755, season: SEASON });
  if (!json?.data?.teamByNumber) throw new Error('FTCScout returned no data for team 755');
  return true;
}

export async function fetchTeamStats(teamNumber) {
  const num = parseInt(teamNumber, 10);
  if (isNaN(num)) throw new Error('Invalid team number');

  const json = await gql(STATS_QUERY, { number: num, season: SEASON });
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
