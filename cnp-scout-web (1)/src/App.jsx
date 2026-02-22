import { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import BottomNav from './components/BottomNav.jsx';
import InitialScanTab from './tabs/InitialScanTab.jsx';
import DataTab from './tabs/DataTab.jsx';
import FormTab from './tabs/FormTab.jsx';
import SettingsTab from './tabs/SettingsTab.jsx';
import { DEFAULT_MINE } from './constants.js';

const LS = {
  get: (k, fb = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

export default function App() {
  const [tab,      setTab]      = useState('scan');
  const [teams,    setTeams]    = useState(() => LS.get('cnp_teams', []));
  const [settings, setSettings] = useState(() => LS.get('cnp_settings', {}));
  const [mine,     setMine]     = useState(() => LS.get('cnp_mine', DEFAULT_MINE));
  const [toast,    setToastRaw] = useState(null);

  function setToast(t) { setToastRaw(t); setTimeout(() => setToastRaw(null), 4000); }

  useEffect(() => { LS.set('cnp_teams',    teams);    }, [teams]);
  useEffect(() => { LS.set('cnp_settings', settings); }, [settings]);
  useEffect(() => { LS.set('cnp_mine',     mine);     }, [mine]);

  const props = { teams, setTeams, settings, setSettings, mine, setMine, setToast };

  return (
    <>
      <Header tab={tab} />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {tab === 'scan'     && <InitialScanTab {...props} />}
        {tab === 'data'     && <DataTab        {...props} />}
        {tab === 'form'     && <FormTab        {...props} />}
        {tab === 'settings' && <SettingsTab    {...props} />}
      </div>
      <BottomNav tab={tab} setTab={setTab} />
      {toast && <div className={`toast ${toast.type || ''}`}>{toast.msg}</div>}
    </>
  );
}
