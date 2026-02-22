export const SEASON       = 2025;
export const MY_TEAM_NUM  = '30439';
export const MY_TEAM_NAME = 'Cool Name Pending';
export const GAME_NAME    = 'DECODE 25-26';

export const TIER_ORDER = { OPTIMAL: 0, MID: 1, BAD: 2 };
export const TIER_COLOR = { OPTIMAL: '#22c55e', MID: '#eab308', BAD: '#ef4444' };
export const TIER_BG    = { OPTIMAL: '#14532d', MID: '#713f12', BAD: '#7f1d1d' };

export const BLANK_TEAM = {
  teamNumber: '', teamName: '',
  stateRank: '', rs: '', matchPoints: '', basePoints: '',
  autoPoints: '', highScore: '', wlt: '', plays: '',
  opr: '', epa: '',
  autoSamples: 0, autoSpecimen: 0, autoParking: 'none',
  teleopLowBasket: 0, teleopHighBasket: 0,
  teleopLowChamber: 0, teleopHighChamber: 0,
  endgame: 'none',
  notes: '', complementary: '', tier: '', compatScore: '',
  withTips: [], againstTips: [], whyAlliance: '',
  humanEdits: {}, fetchStatus: 'idle', source: 'manual',
};

export const DEFAULT_MINE = {
  autoSamples: 0, autoSpecimen: 1, autoParking: 'observation',
  teleopLowBasket: 0, teleopHighBasket: 2,
  teleopLowChamber: 0, teleopHighChamber: 3,
  endgame: 'level1',
  matchPoints: '', basePoints: '', autoPoints: '',
  highScore: '', wlt: '', opr: '', epa: '',
};

export const FIELD_LABELS = {
  teamNumber: 'Team Number',
  autoSamples: 'Auto — Samples Scored',
  autoSpecimen: 'Auto — Specimen Scored',
  autoParking: 'Auto — Parking',
  teleopLowBasket: 'TeleOp — Low Basket',
  teleopHighBasket: 'TeleOp — High Basket',
  teleopLowChamber: 'TeleOp — Low Chamber',
  teleopHighChamber: 'TeleOp — High Chamber',
  endgame: 'Endgame',
};

export const TABLE_COLS = [
  { key: 'stateRank',    label: 'State Rank',   width: 90,  ai: false },
  { key: 'rs',           label: 'RS',            width: 60,  ai: false },
  { key: 'matchPoints',  label: 'Match Pts',     width: 90,  ai: false },
  { key: 'basePoints',   label: 'Base Pts',      width: 90,  ai: false },
  { key: 'autoPoints',   label: 'Auto Pts',      width: 90,  ai: false },
  { key: 'highScore',    label: 'High Score',    width: 90,  ai: false },
  { key: 'wlt',          label: 'W-L-T',         width: 100, ai: false },
  { key: 'plays',        label: 'Plays',         width: 70,  ai: false },
  { key: 'opr',          label: 'OPR',           width: 80,  ai: false },
  { key: 'epa',          label: 'EPA',           width: 80,  ai: false },
  { key: 'notes',        label: 'AI Notes',      width: 240, ai: true  },
  { key: 'complementary',label: 'Complementary', width: 180, ai: true  },
  { key: 'tier',         label: 'Tier',          width: 90,  ai: true  },
];
