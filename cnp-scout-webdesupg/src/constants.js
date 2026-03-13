export const SEASON       = 2025;
export const MY_TEAM_NUM  = '30439';
export const MY_TEAM_NAME = 'Cool Name Pending';
export const GAME_NAME    = 'DECODE';

export const TIER_ORDER = { OPTIMAL: 0, MID: 1, BAD: 2 };
export const TIER_COLOR = { OPTIMAL: '#22c55e', MID: '#eab308', BAD: '#ef4444' };
export const TIER_BG    = { OPTIMAL: '#14532d', MID: '#713f12', BAD: '#7f1d1d' };

export const PTS = {
  leave: 3,
  autoClassified: 3, autoOverflow: 1, autoPattern: 2,
  teleopClassified: 3, teleopOverflow: 1, depot: 1, teleopPattern: 2,
  basePartial: 5, baseFull: 10, baseBothBonus: 10,
  movementRpThreshold: 16, goalRpThreshold: 36, patternRpThreshold: 18,
};

export const BLANK_TEAM = {
  teamNumber: '', teamName: '',
  stateRank: '', rs: '', rpScore: '',
  rp: '', judgingAP: '', totalAP: '',
  matchPoints: '', basePoints: '', autoPoints: '', highScore: '', wlt: '', plays: '',
  opr: '', penaltyOpr: '', epa: '',
  allianceTarget: false,
  // DECODE scouted from form
  hasAuto: false,
  autoCloseRange: false,
  autoFarRange: false,
  ballCapacity: '',
  autoLeave: false,
  avgBallsAuto: 0,
  highBallsAuto: 0,
  avgBallsTeleop: 0,
  highBallsTeleop: 0,
  endgamePlan: '',
  // Computed / mapped
  autoClassified: 0,
  teleopClassified: 0,
  baseResult: 'none',
  scoutNotes: '',
  // AI
  notes: '', complementary: '', tier: '', compatScore: '',
  withTips: [], againstTips: [], whyAlliance: '',
  humanEdits: {}, fetchStatus: 'idle', source: 'manual',
};

export const DEFAULT_MINE = {
  autoLeave: true,
  autoClassified: 0, autoOverflow: 0, autoPatternPts: 0,
  teleopClassified: 0, teleopOverflow: 0, teleopDepot: 0, teleopPatternPts: 0,
  opensGate: false, baseResult: 'none',
  strengths: '', weaknesses: '', strategy: '', extraNotes: '',
  matchPoints: '', basePoints: '', autoPoints: '', highScore: '', wlt: '', opr: '', penaltyOpr: '', epa: '',
};

// Google Form column headers from the PI3 scouting form
export const FIELD_LABELS = {
  teamName:       'Team name (dropdown)',
  hasAuto:        'Do they have a autonomous?',
  autoCloseRange: 'Do they have an auto for up close',
  autoFarRange:   'Do they have an auto for far away',
  ballCapacity:   'How many balls can they hold',
  autoLeave:      'Do they have a leave?',
  avgBallsAuto:   'Average amount of balls shot in auto',
  highBallsAuto:  'Highest amount of balls shot in auto',
  avgBallsTeleop: 'Average amount of balls shot in teleop',
  highBallsTeleop:'Highest amount of balls shot in teleop',
  endgamePlan:    'What is their endgame plan?',
};

export const TABLE_COLS = [
  { key: 'allianceTarget', label: '★ Target', width: 70,  ai: false, type: 'star' },
  { key: 'stateRank',      label: 'Rank',      width: 70,  ai: false },
  { key: 'rs',             label: 'RS',         width: 55,  ai: false },
  { key: 'rp',            label: 'RP',         width: 55,  ai: false },
  { key: 'judgingAP',    label: 'Judging AP', width: 85,  ai: false },
  { key: 'totalAP',      label: 'Total AP',   width: 75,  ai: false },
  { key: 'rpScore',        label: '1.17.26',    width: 75,  ai: false },
  { key: 'matchPoints',    label: 'Match Pts',  width: 85,  ai: false },
  { key: 'basePoints',     label: 'Base Pts',   width: 80,  ai: false },
  { key: 'autoPoints',     label: 'Auto Pts',   width: 80,  ai: false },
  { key: 'highScore',      label: 'High Score', width: 85,  ai: false },
  { key: 'wlt',            label: 'W-L-T',      width: 95,  ai: false },
  { key: 'plays',          label: 'Plays',      width: 60,  ai: false },
  { key: 'opr',            label: 'OPR',        width: 75,  ai: false },
  { key: 'penaltyOpr',    label: 'OPR+Pen',    width: 80,  ai: false },
  { key: 'epa',            label: 'EPA',        width: 75,  ai: false },
  { key: 'avgBallsAuto',   label: 'Auto Avg',   width: 80,  ai: false },
  { key: 'avgBallsTeleop', label: 'TP Avg',     width: 75,  ai: false },
  { key: 'endgamePlan',    label: 'Endgame',    width: 140, ai: false },
  { key: 'tier',           label: 'Tier',       width: 90,  ai: true,  type: 'tier' },
];
