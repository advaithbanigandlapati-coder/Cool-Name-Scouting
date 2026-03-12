import { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import BottomNav from './components/BottomNav.jsx';
import DataTab from './tabs/DataTab.jsx';
import AllianceTab from './tabs/AllianceTab.jsx';
import InitialScanTab from './tabs/InitialScanTab.jsx';
import FormTab from './tabs/FormTab.jsx';
import MatchFormTab from './tabs/MatchFormTab.jsx';
import SettingsTab from './tabs/SettingsTab.jsx';
import ChatTab from './tabs/ChatTab.jsx';
import { DEFAULT_MINE, BLANK_TEAM } from './constants.js';
import { INITIAL_TEAMS } from './data/initialTeams.js';

const LS = {
  get: (k,fb=null) => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):fb; } catch { return fb; } },
  set: (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} },
};

const TEAMS_VERSION = 'states-v3';

function seedTeams() {
  const saved    = LS.get('cnp_teams', null);
  const savedVer = LS.get('cnp_teams_version', null);
  if (saved && saved.length > 0 && savedVer === TEAMS_VERSION) return saved;
  // Version mismatch — load fresh from initialTeams, but preserve any scouted data
  const fresh = INITIAL_TEAMS.map(t => ({ ...BLANK_TEAM, ...t }));
  if (saved && saved.length > 0) {
    // Carry over human-scouted fields from old data
    const scoutedMap = Object.fromEntries(saved.map(t => [t.teamNumber, t]));
    return fresh.map(t => {
      const old = scoutedMap[t.teamNumber];
      if (!old) return t;
      return {
        ...t,
        // keep scouted form data
        hasAuto:         old.hasAuto         ?? t.hasAuto,
        autoClose:       old.autoClose       ?? t.autoClose,
        autoFar:         old.autoFar         ?? t.autoFar,
        leave:           old.leave           ?? t.leave,
        autoArtifacts:   old.autoArtifacts   || t.autoArtifacts,
        teleopArtifacts: old.teleopArtifacts || t.teleopArtifacts,
        canShoot:        old.canShoot        ?? t.canShoot,
        shootRange:      old.shootRange      || t.shootRange,
        motifPriority:   old.motifPriority   ?? t.motifPriority,
        playsDefense:    old.playsDefense    ?? t.playsDefense,
        defenseExplain:  old.defenseExplain  || t.defenseExplain,
        parkType:        old.parkType        || t.parkType,
        stratNotes:      old.stratNotes      || t.stratNotes,
        allianceTarget:  old.allianceTarget  || t.allianceTarget,
        humanEdits:      old.humanEdits      || t.humanEdits,
        tier:            old.tier            || t.tier,
        compatScore:     old.compatScore     || t.compatScore,
        withTips:        old.withTips        || t.withTips,
        againstTips:     old.againstTips     || t.againstTips,
      };
    });
  }
  return fresh;
}

export default function App() {
  const [tab,          setTab]          = useState('data');
  const [teams,        setTeams]        = useState(seedTeams);
  const [settings,     setSettings]     = useState(() => LS.get('cnp_settings', {}));
  const [mine,         setMine]         = useState(() => LS.get('cnp_mine', DEFAULT_MINE));
  const [archive,      setArchive]      = useState(() => LS.get('cnp_archive', []));
  const [matchEntries, setMatchEntries] = useState(() => LS.get('cnp_matches', []));
  const [toast,        setToastRaw]     = useState(null);

  function setToast(t) { setToastRaw(t); setTimeout(()=>setToastRaw(null),5000); }

  function archiveCurrent() {
    const hasAnalysis = teams.some(t=>t.tier||t.withTips?.length);
    if (!hasAnalysis) return;
    const snap = { timestamp:Date.now(), teams:teams.map(t=>({...t})) };
    setArchive(prev => { const next=[snap,...prev].slice(0,10); LS.set('cnp_archive',next); return next; });
  }

  useEffect(()=>{ LS.set('cnp_teams', teams); LS.set('cnp_teams_version', TEAMS_VERSION); }, [teams]);
  useEffect(()=>{ LS.set('cnp_settings', settings);     }, [settings]);
  useEffect(()=>{ LS.set('cnp_mine',     mine);         }, [mine]);
  useEffect(()=>{ LS.set('cnp_matches',  matchEntries); }, [matchEntries]);

  const props = { teams, setTeams, settings, setSettings, mine, setMine, setToast, archive, archiveCurrent };

  return (
    <>
      <Header tab={tab} teamCount={teams.length} targetCount={teams.filter(t=>t.allianceTarget).length}/>
      <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>
        {tab==='data'     && <DataTab        {...props}/>}
        {tab==='alliance' && <AllianceTab    teams={teams} archive={archive}/>}
        {tab==='scout'    && <FormTab        {...props}/>}
        {tab==='match'    && <MatchFormTab   teams={teams} setTeams={setTeams} mine={mine} matchEntries={matchEntries} setMatchEntries={setMatchEntries} setToast={setToast}/>}
        {tab==='scan'     && <InitialScanTab {...props}/>}
        {tab==='chat'     && <ChatTab        teams={teams} mine={mine} settings={settings}/>}
        {tab==='settings' && <SettingsTab    {...props}/>}
      </div>
      <BottomNav tab={tab} setTab={setTab} teams={teams} matchEntries={matchEntries}/>
      {toast && (
        <div className={`toast ${toast.type||''}`} onClick={()=>setToastRaw(null)}>
          {toast.msg}
        </div>
      )}
    </>
  );
}
