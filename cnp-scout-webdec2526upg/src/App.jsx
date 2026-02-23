import { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import BottomNav from './components/BottomNav.jsx';
import InitialScanTab from './tabs/InitialScanTab.jsx';
import DataTab from './tabs/DataTab.jsx';
import FormTab from './tabs/FormTab.jsx';
import SettingsTab from './tabs/SettingsTab.jsx';
import FAQTab from './tabs/FAQTab.jsx';
import AllianceTab from './tabs/AllianceTab.jsx';
import { DEFAULT_MINE, BLANK_TEAM } from './constants.js';
import { INITIAL_TEAMS } from './data/initialTeams.js';

const LS = {
  get: (k, fb = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

function seedTeams() {
  const saved = LS.get('cnp_teams', null);
  if (saved && saved.length > 0) return saved;
  return INITIAL_TEAMS.map(t => ({ ...BLANK_TEAM, ...t }));
}

export default function App() {
  const [tab,      setTab]      = useState('data');
  const [teams,    setTeams]    = useState(seedTeams);
  const [settings, setSettings] = useState(() => LS.get('cnp_settings', {}));
  const [mine,     setMine]     = useState(() => LS.get('cnp_mine', DEFAULT_MINE));
  const [toast,    setToastRaw] = useState(null);

  function setToast(t) { setToastRaw(t); setTimeout(() => setToastRaw(null), 5000); }

  useEffect(() => { LS.set('cnp_teams',    teams);    }, [teams]);
  useEffect(() => { LS.set('cnp_settings', settings); }, [settings]);
  useEffect(() => { LS.set('cnp_mine',     mine);     }, [mine]);

  const props = { teams, setTeams, settings, setSettings, mine, setMine, setToast };

  return (
    <>
      <Header tab={tab} teamCount={teams.length} targetCount={teams.filter(t=>t.allianceTarget).length} />
      <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
        {tab === 'data'     && <DataTab      {...props} />}
        {tab === 'scan'     && <InitialScanTab {...props} />}
        {tab === 'form'     && <FormTab      {...props} />}
        {tab === 'alliance' && <AllianceTab  teams={teams} mine={mine} />}
        {tab === 'faq'      && <FAQTab />}
        {tab === 'settings' && <SettingsTab  {...props} />}
      </div>
      <BottomNav tab={tab} setTab={setTab} teams={teams} />
      {toast && (
        <div className={`toast ${toast.type||''}`} onClick={() => setToastRaw(null)}>
          {toast.msg}
        </div>
      )}
    </>
  );
}
