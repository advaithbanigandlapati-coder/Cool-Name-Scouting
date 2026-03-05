// NJ STATE CHAMPIONSHIP TEAMS — DECODE 25-26
// OPR/rank/record sourced from ftcstats.org NJ 2025
// Conference tournament points from bracket doc

export const INITIAL_TEAMS = [

  // ── DEEP SOUTH CONFERENCE ────────────────────────────────────────────────
  { teamNumber:'7149',  teamName:'ENFORCERS',          conference:'Deep South',  tournamentPts:'136', stateRank:'1',  opr:'175.3', wlt:'9-2-0',  matchPoints:'',  highScore:'387', rs:'Yes', plays:'11' },
  { teamNumber:'17036', teamName:'Robotech Anomaly',   conference:'Deep South',  tournamentPts:'83',  stateRank:'',  opr:'',      wlt:'',        matchPoints:'',  highScore:'',    rs:'',    plays:''   },
  { teamNumber:'18241', teamName:'Outer Galaxy',       conference:'Deep South',  tournamentPts:'74',  stateRank:'',  opr:'',      wlt:'',        matchPoints:'',  highScore:'',    rs:'',    plays:''   },
  { teamNumber:'9848',  teamName:'GearView',           conference:'Deep South',  tournamentPts:'68',  stateRank:'13', opr:'134.3', wlt:'6-2-0',  matchPoints:'',  highScore:'',    rs:'Yes', plays:'8'  },
  { teamNumber:'13583', teamName:'Triple Wire',        conference:'Deep South',  tournamentPts:'54',  stateRank:'',  opr:'',      wlt:'',        matchPoints:'',  highScore:'',    rs:'',    plays:''   },
  { teamNumber:'20204', teamName:'Chargeing Pioneers', conference:'Deep South',  tournamentPts:'51',  stateRank:'',  opr:'',      wlt:'',        matchPoints:'',  highScore:'',    rs:'',    plays:''   },
  { teamNumber:'5387',  teamName:'TecHounds',          conference:'Deep South',  tournamentPts:'39',  stateRank:'',  opr:'',      wlt:'',        matchPoints:'',  highScore:'',    rs:'',    plays:''   },
  { teamNumber:'28830', teamName:'Flameforge',         conference:'Deep South',  tournamentPts:'37',  stateRank:'',  opr:'',      wlt:'',        matchPoints:'',  highScore:'',    rs:'',    plays:''   },

  // ── CENTRAL CONFERENCE ───────────────────────────────────────────────────
  { teamNumber:'31257', teamName:'KinetIQ',            conference:'Central',     tournamentPts:'83',  stateRank:'',  opr:'',      wlt:'',        matchPoints:'',  highScore:'',    rs:'',    plays:''   },
  { teamNumber:'19772', teamName:'Rust in Piece',      conference:'Central',     tournamentPts:'82',  stateRank:'',  opr:'',      wlt:'',        matchPoints:'',  highScore:'',    rs:'',    plays:''   },
  { teamNumber:'23786', teamName:'MakEMinds',          conference:'Central',     tournamentPts:'73',  stateRank:'6',  opr:'152.4', wlt:'6-3-0',  matchPoints:'',  highScore:'349', rs:'',    plays:'9'  },
  { teamNumber:'11754', teamName:'EnergySmartFTC',     conference:'Central',     tournamentPts:'67',  stateRank:'',  opr:'',      wlt:'',        matchPoints:'',  highScore:'',    rs:'',    plays:''   },
  { teamNumber:'7350',  teamName:"Watt's NXT",         conference:'Central',     tournamentPts:'62',  stateRank:'17', opr:'128.2', wlt:'4-4-0',  matchPoints:'',  highScore:'',    rs:'',    plays:'8'  },
  { teamNumber:'11697', teamName:'TECH-tonic',         conference:'Central',     tournamentPts:'51',  stateRank:'',  opr:'',      wlt:'',        matchPoints:'',  highScore:'',    rs:'',    plays:''   },

  // ── ESSEX CONFERENCE ─────────────────────────────────────────────────────
  { teamNumber:'4102',  teamName:'CATScan',            conference:'Essex',       tournamentPts:'104', stateRank:'18', opr:'124.8', wlt:'2-5-0',  matchPoints:'',  highScore:'358', rs:'',    plays:'7'  },
  { teamNumber:'23650', teamName:'MillburnX',          conference:'Essex',       tournamentPts:'99',  stateRank:'',  opr:'',      wlt:'',        matchPoints:'',  highScore:'',    rs:'',    plays:''   },
  { teamNumber:'13302', teamName:'MKA Robotics',       conference:'Essex',       tournamentPts:'88',  stateRank:'',  opr:'',      wlt:'',        matchPoints:'',  highScore:'',    rs:'',    plays:''   },
  { teamNumber:'11180', teamName:'Beaks n Bolts',      conference:'Essex',       tournamentPts:'66',  stateRank:'14', opr:'133.7', wlt:'8-0-0',  matchPoints:'',  highScore:'',    rs:'',    plays:'8'  },
  { teamNumber:'7959',  teamName:'CHS Cougars',        conference:'Essex',       tournamentPts:'63',  stateRank:'19', opr:'124.6', wlt:'5-4-0',  matchPoints:'',  highScore:'',    rs:'',    plays:'9'  },

  // ── FAR NORTH CONFERENCE ─────────────────────────────────────────────────
  { teamNumber:'23314', teamName:'Galactic Pigeon',    conference:'Far North',   tournamentPts:'113', stateRank:'20', opr:'124.4', wlt:'4-1-0',  matchPoints:'',  highScore:'',    rs:'',    plays:'5'  },
  { teamNumber:'14450', teamName:'RoboRebels',         conference:'Far North',   tournamentPts:'88',  stateRank:'5',  opr:'155.3', wlt:'9-2-0',  matchPoints:'',  highScore:'373', rs:'',    plays:'11' },
  { teamNumber:'23375', teamName:'Robo Raptors',       conference:'Far North',   tournamentPts:'84',  stateRank:'9',  opr:'143.2', wlt:'5-0-0',  matchPoints:'',  highScore:'',    rs:'',    plays:'5'  },
  { teamNumber:'23268', teamName:'Ultraviolet',        conference:'Far North',   tournamentPts:'83',  stateRank:'3',  opr:'170.0', wlt:'8-3-0',  matchPoints:'',  highScore:'349', rs:'Yes', plays:'11' },
  { teamNumber:'8902',  teamName:'Cosmic Goose',       conference:'Far North',   tournamentPts:'53',  stateRank:'',  opr:'',      wlt:'',        matchPoints:'',  highScore:'373', rs:'',    plays:''   },
  { teamNumber:'248',   teamName:'Fatal Error',        conference:'Far North',   tournamentPts:'53',  stateRank:'',  opr:'',      wlt:'',        matchPoints:'',  highScore:'',    rs:'',    plays:''   },

  // ── MORRIS CONFERENCE ────────────────────────────────────────────────────
  { teamNumber:'30439', teamName:'Cool Name Pending',  conference:'Morris',      tournamentPts:'88',  stateRank:'15', opr:'',      wlt:'10-0-0', matchPoints:'81.00', highScore:'', rs:'Yes', plays:'16' },
  { teamNumber:'26014', teamName:'Ninjabotics',        conference:'Morris',      tournamentPts:'86',  stateRank:'',  opr:'',      wlt:'',        matchPoints:'',  highScore:'',    rs:'',    plays:''   },
  { teamNumber:'31149', teamName:'Mechanical Wave',    conference:'Morris',      tournamentPts:'85',  stateRank:'',  opr:'',      wlt:'',        matchPoints:'',  highScore:'',    rs:'',    plays:''   },
  { teamNumber:'755',   teamName:'Delbotics',          conference:'Morris',      tournamentPts:'68',  stateRank:'4',  opr:'163.9', wlt:'6-4-0',  matchPoints:'99.50', highScore:'313', rs:'',  plays:'10' },
  { teamNumber:'16367', teamName:'Krypton Warriors',   conference:'Morris',      tournamentPts:'57',  stateRank:'16', opr:'132.7', wlt:'4-4-0',  matchPoints:'87.90', highScore:'310', rs:'Yes', plays:'8' },
  { teamNumber:'9889',  teamName:'Cruise Control',     conference:'Morris',      tournamentPts:'55',  stateRank:'11', opr:'137.7', wlt:'9-1-0',  matchPoints:'59.40', highScore:'237', rs:'Yes', plays:'10' },

  // ── NORTHEAST CONFERENCE ─────────────────────────────────────────────────
  { teamNumber:'17670', teamName:'Raider Robotics',    conference:'Northeast',   tournamentPts:'134', stateRank:'',  opr:'',      wlt:'',        matchPoints:'',  highScore:'',    rs:'',    plays:''   },
  { teamNumber:'17009', teamName:'Steel Mangolias',    conference:'Northeast',   tournamentPts:'84',  stateRank:'',  opr:'',      wlt:'',        matchPoints:'',  highScore:'',    rs:'',    plays:''   },
  { teamNumber:'16557', teamName:'Honey K-Ohms',       conference:'Northeast',   tournamentPts:'71',  stateRank:'',  opr:'',      wlt:'',        matchPoints:'',  highScore:'',    rs:'',    plays:''   },
  { teamNumber:'5968',  teamName:'WR That Hertz',      conference:'Northeast',   tournamentPts:'68',  stateRank:'',  opr:'',      wlt:'',        matchPoints:'',  highScore:'',    rs:'',    plays:''   },
  { teamNumber:'10785', teamName:'Highlanders',        conference:'Northeast',   tournamentPts:'62',  stateRank:'',  opr:'',      wlt:'',        matchPoints:'',  highScore:'',    rs:'',    plays:''   },
  { teamNumber:'22704', teamName:'Robo Redwings',      conference:'Northeast',   tournamentPts:'54',  stateRank:'',  opr:'',      wlt:'',        matchPoints:'',  highScore:'',    rs:'',    plays:''   },

  // ── UPPER SOUTH CONFERENCE ───────────────────────────────────────────────
  { teamNumber:'22261', teamName:'Hornet Blue',        conference:'Upper South', tournamentPts:'134', stateRank:'',  opr:'',      wlt:'',        matchPoints:'',  highScore:'',    rs:'',    plays:''   },
  { teamNumber:'19735', teamName:'Hornet Silver',      conference:'Upper South', tournamentPts:'76',  stateRank:'',  opr:'',      wlt:'',        matchPoints:'',  highScore:'',    rs:'',    plays:''   },
  { teamNumber:'14481', teamName:"Don't Blink",        conference:'Upper South', tournamentPts:'63',  stateRank:'2',  opr:'170.9', wlt:'7-1-0',  matchPoints:'',  highScore:'358', rs:'Yes', plays:'8'  },
  { teamNumber:'25710', teamName:'ALPINE ROBOTICS',    conference:'Upper South', tournamentPts:'58',  stateRank:'',  opr:'',      wlt:'',        matchPoints:'',  highScore:'',    rs:'',    plays:''   },
  { teamNumber:'26910', teamName:'Mud Head Car',       conference:'Upper South', tournamentPts:'56',  stateRank:'12', opr:'135.6', wlt:'5-3-0',  matchPoints:'',  highScore:'313', rs:'',    plays:'8'  },
  { teamNumber:'23490', teamName:'Beta Blink',         conference:'Upper South', tournamentPts:'54',  stateRank:'',  opr:'',      wlt:'',        matchPoints:'',  highScore:'',    rs:'',    plays:''   },
];
