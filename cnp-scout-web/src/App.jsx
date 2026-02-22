import { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import BottomNav from './components/BottomNav.jsx';
import TeamsTab from './tabs/TeamsTab.jsx';
import AllianceTab from './tabs/AllianceTab.jsx';
import SettingsTab from './tabs/SettingsTab.jsx';
import { DEFAULT_MINE } from './constants.js';

const LS = {
  get: (k, fallback = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

export default function App() {
  const [tab,      setTab]      = useState('teams');
  const [teams,    setTeams]    = useState(() => LS.get('cnp_teams', []));
  const [analysis, setAnalysis] = useState(() => LS.get('cnp_analysis', null));
  const [settings, setSettings] = useState(() => LS.get('cnp_settings', {}));
  const [mine,     setMine]     = useState(() => LS.get('cnp_mine', DEFAULT_MINE));
  const [toast,    setToastRaw] = useState(null);

  function setToast(t) { setToastRaw(t); setTimeout(() => setToastRaw(null), 3500); }

  useEffect(() => { LS.set('cnp_teams',    teams);    }, [teams]);
  useEffect(() => { LS.set('cnp_analysis', analysis); }, [analysis]);
  useEffect(() => { LS.set('cnp_settings', settings); }, [settings]);
  useEffect(() => { LS.set('cnp_mine',     mine);     }, [mine]);

  const tabProps = { settings, setSettings, teams, setTeams, analysis, setAnalysis, mine, setMine, setToast };

  return (
    <>
      <Header tab={tab} />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {tab === 'teams'    && <TeamsTab    {...tabProps} />}
        {tab === 'alliance' && <AllianceTab {...tabProps} />}
        {tab === 'settings' && <SettingsTab {...tabProps} />}
      </div>
      <BottomNav tab={tab} setTab={setTab} />
      {toast && <div className={`toast ${toast.type || ''}`}>{toast.msg}</div>}
    </>
  );
}
