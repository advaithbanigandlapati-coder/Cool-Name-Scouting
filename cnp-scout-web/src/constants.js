export const SEASON       = 2026;
export const MY_TEAM_NUM  = '30439';
export const MY_TEAM_NAME = 'Cool Name Pending';

export const TIER_ORDER = { OPTIMAL: 0, MID: 1, BAD: 2 };
export const TIER_COLOR = { OPTIMAL: '#22c55e', MID: '#eab308', BAD: '#ef4444' };
export const TIER_BG    = { OPTIMAL: '#14532d', MID: '#713f12', BAD: '#7f1d1d' };

// Default column mapping keys — user maps their form headers to these
export const FIELD_LABELS = {
  teamNumber:        'Team Number',
  autoSamples:       'Auto — Samples Scored',
  autoSpecimen:      'Auto — Specimen Scored',
  autoParking:       'Auto — Parking (none/observation/ascent)',
  teleopLowBasket:   'TeleOp — Low Basket',
  teleopHighBasket:  'TeleOp — High Basket',
  teleopLowChamber:  'TeleOp — Low Chamber',
  teleopHighChamber: 'TeleOp — High Chamber',
  endgame:           'Endgame (none/level1/level2/level3)',
};

export const BLANK_TEAM = {
  teamNumber: '',
  teamName: '',
  // FTCScout
  opr: null, epa: null, dpr: null,
  autoPoints: null, avgScore: null, stateRank: null,
  wins: null, losses: null, ties: null, highScore: null,
  fetchStatus: 'idle',
  // Scouted
  autoSamples: 0, autoSpecimen: 0, autoParking: 'none',
  teleopLowBasket: 0, teleopHighBasket: 0,
  teleopLowChamber: 0, teleopHighChamber: 0,
  endgame: 'none',
};

export const DEFAULT_MINE = {
  autoSamples: 0, autoSpecimen: 1, autoParking: 'observation',
  teleopLowBasket: 0, teleopHighBasket: 2,
  teleopLowChamber: 0, teleopHighChamber: 3,
  endgame: 'level1',
};
