export const SEASON       = 2025;
export const MY_TEAM_NUM  = '30439';
export const MY_TEAM_NAME = 'Cool Name Pending';
export const GAME_NAME    = 'DECODE';

export const TIER_ORDER = { OPTIMAL: 0, MID: 1, BAD: 2 };
export const TIER_COLOR = { OPTIMAL: '#22c55e', MID: '#eab308', BAD: '#ef4444' };
export const TIER_BG    = { OPTIMAL: '#14532d33', MID: '#71370f33', BAD: '#7f1d1d33' };

// Official DECODE 2025-26 point values — edit here if rules update
export const PTS = {
  leave: 3,
  autoClassified: 3, autoOverflow: 1, autoPattern: 2,
  teleopClassified: 3, teleopOverflow: 1, depot: 1, teleopPattern: 2,
  basePartial: 5, baseFull: 10, baseBothBonus: 10,
  movementRpThreshold: 16, goalRpThreshold: 36, patternRpThreshold: 18,
};

export const BLANK_TEAM = {
  teamNumber: '', teamName: '',
  // Doc stats (1.17.26 meet)
  stateRank: '', rs: '', rpScore: '',
  matchPoints: '', basePoints: '', autoPoints: '', highScore: '', wlt: '', plays: '',
  // FTCScout fetched
  opr: '', epa: '',
  // Alliance targeting
  allianceTarget: false,
  // Form scouted fields (PI3 form)
  hasAuto: false, autoCloseRange: false, autoFarRange: false,
  ballCapacity: '', autoLeave: false,
  avgBallsAuto: 0, highBallsAuto: 0,
  avgBallsTeleop: 0, highBallsTeleop: 0,
  endgamePlan: '',
  // AI output
  notes: '', complementary: '', tier: '', compatScore: '',
  withTips: [], againstTips: [], whyAlliance: '',
  // Human override tracking
  humanEdits: {},
  fetchStatus: 'idle', source: 'manual',
};

export const DEFAULT_MINE = {
  autoLeave: true, autoClassified: 0, autoOverflow: 0, autoPatternPts: 0,
  teleopClassified: 0, teleopOverflow: 0, teleopDepot: 0, teleopPatternPts: 0,
  opensGate: false, baseResult: 'none',
  strengths: '', weaknesses: '', strategy: '', extraNotes: '',
  matchPoints: '', basePoints: '', autoPoints: '', highScore: '', wlt: '', opr: '', epa: '',
};

// Matches PI3 form question text exactly
export const FIELD_LABELS = {
  teamName:        'Team name',
  hasAuto:         'Do they have a autonomous?',
  autoCloseRange:  'Do they have an auto for up close',
  autoFarRange:    'Do they have an auto for far away',
  ballCapacity:    'How many balls can they hold',
  autoLeave:       'Do they have a leave?',
  avgBallsAuto:    'Average amount of balls shot in auto',
  highBallsAuto:   'Highest amount of balls shot in auto',
  avgBallsTeleop:  'Average amount of balls shot in teleop',
  highBallsTeleop: 'Highest amount of balls shot in teleop',
  endgamePlan:     'What is their endgame plan?',
};

export const TABLE_COLS = [
  // Pinned identity
  { key: 'allianceTarget', label: '★',           width: 42,  type: 'star',   group: 'meta'   },
  { key: 'stateRank',      label: 'Rank',         width: 65,  type: 'num',    group: 'doc'    },
  { key: 'rs',             label: 'RS',            width: 50,  type: 'badge',  group: 'doc'    },
  { key: 'rpScore',        label: '1.17.26',       width: 78,  type: 'num',    group: 'doc'    },
  { key: 'matchPoints',    label: 'Match Pts',     width: 88,  type: 'num',    group: 'doc'    },
  { key: 'basePoints',     label: 'Base Pts',      width: 80,  type: 'num',    group: 'doc'    },
  { key: 'autoPoints',     label: 'Auto Pts',      width: 80,  type: 'num',    group: 'doc'    },
  { key: 'highScore',      label: 'High Score',    width: 85,  type: 'num',    group: 'doc'    },
  { key: 'wlt',            label: 'W-L-T',         width: 90,  type: 'text',   group: 'doc'    },
  { key: 'plays',          label: 'Plays',         width: 58,  type: 'num',    group: 'doc'    },
  { key: 'opr',            label: 'OPR',           width: 72,  type: 'num',    group: 'ftc'    },
  { key: 'epa',            label: 'EPA',           width: 72,  type: 'num',    group: 'ftc'    },
  // Form scouted
  { key: 'avgBallsAuto',   label: 'Auto Avg',      width: 80,  type: 'num',    group: 'form'   },
  { key: 'highBallsAuto',  label: 'Auto High',     width: 82,  type: 'num',    group: 'form'   },
  { key: 'avgBallsTeleop', label: 'TP Avg',        width: 72,  type: 'num',    group: 'form'   },
  { key: 'highBallsTeleop',label: 'TP High',       width: 78,  type: 'num',    group: 'form'   },
  { key: 'ballCapacity',   label: 'Capacity',      width: 76,  type: 'text',   group: 'form'   },
  { key: 'endgamePlan',    label: 'Endgame',       width: 150, type: 'text',   group: 'form'   },
  // AI
  { key: 'tier',           label: 'Tier',          width: 90,  type: 'tier',   group: 'ai',  ai: true },
  { key: 'compatScore',    label: 'Compat',        width: 70,  type: 'num',    group: 'ai',  ai: true },
  { key: 'complementary',  label: 'Complementary', width: 200, type: 'text',   group: 'ai',  ai: true },
  { key: 'notes',          label: 'AI Notes',      width: 260, type: 'text',   group: 'ai',  ai: true },
];
