import { useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { fetchSheetHeaders } from '../api/sheets.js';
import { FIELD_LABELS, DEFAULT_MINE } from '../constants.js';
import { calcEst } from '../helpers.js';

export default function SettingsTab({ settings, setSettings, mine, setMine, setToast }) {
  const [local, setLocal]     = useState({ ...settings });
  const [localMine, setLocalMine] = useState({ ...mine });
  const [headers, setHeaders] = useState([]);
  const [loadingHeaders, setLoadingHeaders] = useState(false);

  function set(k, v) { setLocal(p => ({ ...p, [k]: v })); }
  function setMap(k, v) { setLocal(p => ({ ...p, columnMapping: { ...(p.columnMapping || {}), [k]: v } })); }
  function setM(k, v) { setLocalMine(p => ({ ...p, [k]: isNaN(Number(v)) ? v : Number(v) })); }

  async function loadHeaders() {
    if (!local.googleApiKey || !local.sheetId) {
      setToast({ msg: 'Fill in Google API Key and Sheet ID first.', type: 'err' });
      return;
    }
    setLoadingHeaders(true);
    try {
      const h = await fetchSheetHeaders({ sheetId: local.sheetId, googleApiKey: local.googleApiKey });
      setHeaders(h);
      setToast({ msg: `✓ Loaded ${h.length} column headers.`, type: 'ok' });
    } catch (err) {
      setToast({ msg: `Sheets error: ${err.message}`, type: 'err' });
    } finally {
      setLoadingHeaders(false);
    }
  }

  async function save() {
    await window.api.settings.save(local);
    setSettings(local);
    setMine(localMine);
    setToast({ msg: '✓ Settings saved.', type: 'ok' });
  }

  const headerOptions = ['', ...headers];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* API Keys */}
        <div className="card">
          <h2 style={{ marginBottom: 16, fontSize: 20 }}>Google API Key</h2>
          <div>
            <label>Google API Key</label>
            <input
              type="password"
              value={local.googleApiKey || ''}
              onChange={e => set('googleApiKey', e.target.value)}
              placeholder="AIza..."
            />
            <p style={{ fontSize: 11, color: '#525252', marginTop: 4 }}>
              Google Cloud Console → APIs → Enable "Google Sheets API" → Credentials → API key
            </p>
          </div>
        </div>

        {/* Google Sheet */}
        <div className="card">
          <h2 style={{ marginBottom: 16, fontSize: 20 }}>Google Sheet</h2>
          <div style={{ marginBottom: 14 }}>
            <label>Sheet ID</label>
            <input
              value={local.sheetId || ''}
              onChange={e => set('sheetId', e.target.value)}
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
            />
            <p style={{ fontSize: 11, color: '#525252', marginTop: 4 }}>
              From your sheet URL: docs.google.com/spreadsheets/d/<b>THIS_PART</b>/edit
            </p>
          </div>
          <button className="btn btn-ghost" onClick={loadHeaders} disabled={loadingHeaders}>
            {loadingHeaders ? <><div className="spinner" style={{ width: 12, height: 12 }} /> Loading…</> :
              <><RefreshCw size={12} /> Load Column Headers</>}
          </button>
        </div>

        {/* Column Mapping */}
        <div className="card">
          <h2 style={{ marginBottom: 4, fontSize: 20 }}>Column Mapping</h2>
          <p style={{ fontSize: 12, color: '#a3a3a3', marginBottom: 16 }}>
            Match your Google Form columns to each field. {headers.length === 0 && 'Load headers above first.'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {Object.entries(FIELD_LABELS).map(([key, label]) => (
              <div key={key}>
                <label>{label}</label>
                {headers.length > 0 ? (
                  <select
                    value={local.columnMapping?.[key] || ''}
                    onChange={e => setMap(key, e.target.value)}
                  >
                    {headerOptions.map(h => <option key={h} value={h}>{h || '— not mapped —'}</option>)}
                  </select>
                ) : (
                  <input
                    value={local.columnMapping?.[key] || ''}
                    onChange={e => setMap(key, e.target.value)}
                    placeholder="Column header text or letter (A, B…)"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* My Robot */}
        <div className="card">
          <h2 style={{ marginBottom: 4, fontSize: 20 }}>Our Robot Stats</h2>
          <p style={{ fontSize: 12, color: '#a3a3a3', marginBottom: 16 }}>
            Est. score: <b style={{ color: '#f97316' }}>{calcEst(localMine)} pts</b>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              ['autoSamples', 'Auto Samples'], ['autoSpecimen', 'Auto Specimen'],
              ['teleopLowBasket', 'Teleop Low Basket'], ['teleopHighBasket', 'Teleop High Basket'],
              ['teleopLowChamber', 'Teleop Low Chamber'], ['teleopHighChamber', 'Teleop High Chamber'],
            ].map(([k, lbl]) => (
              <div key={k}>
                <label>{lbl}</label>
                <input type="number" min="0" value={localMine[k] || 0}
                  onChange={e => setM(k, e.target.value)} />
              </div>
            ))}
            <div>
              <label>Auto Parking</label>
              <select value={localMine.autoParking || 'none'} onChange={e => setM('autoParking', e.target.value)}>
                <option value="none">None</option>
                <option value="observation">Observation</option>
                <option value="ascent">Ascent</option>
              </select>
            </div>
            <div>
              <label>Endgame</label>
              <select value={localMine.endgame || 'none'} onChange={e => setM('endgame', e.target.value)}>
                <option value="none">None</option>
                <option value="level1">L1 Ascent</option>
                <option value="level2">L2 Ascent</option>
                <option value="level3">L3 Ascent</option>
              </select>
            </div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={save} style={{ alignSelf: 'flex-start', padding: '10px 24px' }}>
          <Save size={14} /> Save Settings
        </button>
      </div>
    </div>
  );
}
