import { useState } from 'react';
import { Download, RefreshCw, Trash2 } from 'lucide-react';
import { fetchSheetTeams, fetchSheetHeaders } from '../api/sheets.js';
import { endgameLabel } from '../helpers.js';

export default function FormTab({ teams, setTeams, settings, setToast }) {
  const [loading, setLoading] = useState(false);

  // Get only teams that have scouting form data
  const scoutedTeams = teams.filter(t => t.source === 'form' || t.autoSamples || t.teleopHighBasket || t.endgame !== 'none');

  async function importForm() {
    if (!settings.googleApiKey || !settings.sheetId) {
      setToast({ msg: 'Set Google API Key and Sheet ID in Settings first.', type: 'err' });
      return;
    }
    if (!settings.columnMapping || Object.keys(settings.columnMapping).length === 0) {
      setToast({ msg: 'Set up column mapping in Settings first.', type: 'warn' });
      return;
    }
    setLoading(true);
    try {
      setToast({ msg: 'Importing from Google Sheets…', type: 'ok' });
      const imported = await fetchSheetTeams(
        { sheetId: settings.sheetId, googleApiKey: settings.googleApiKey },
        settings.columnMapping, []
      );
      if (imported.length === 0) {
        setToast({ msg: 'No data found. Check your Sheet ID and column mapping.', type: 'warn' });
        return;
      }
      // Merge form data into existing teams
      setTeams(prev => {
        const byNum = Object.fromEntries(prev.map(t => [t.teamNumber, t]));
        return imported.map(t => ({
          ...(byNum[t.teamNumber] || {}),
          ...t,
          source: 'form',
          humanEdits: byNum[t.teamNumber]?.humanEdits || {},
        }));
      });
      setToast({ msg: `✓ Imported ${imported.length} teams from form.`, type: 'ok' });
    } catch (err) {
      setToast({ msg: `Sheets error: ${err.message}`, type: 'err' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #1e1e1e',
        display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        <button className="btn btn-primary" onClick={importForm} disabled={loading}>
          {loading ? <><div className="spinner" /> Importing…</> : <><Download size={14} /> Import from Sheets</>}
        </button>
        {scoutedTeams.length > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#525252', fontFamily: 'var(--font-mono)' }}>
            {scoutedTeams.length} teams with scouting data
          </span>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {scoutedTeams.length === 0 ? (
          <div className="empty">
            <h3>No Form Data Yet</h3>
            <p>Connect your Google Sheet in Settings,<br />then import here.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#0f0f0f' }}>
                {['#','Team','Matches','Auto S','Auto Sp','Park','LB','HB','LC','HC','Endgame'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#a3a3a3',
                    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #1e1e1e' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scoutedTeams.map((t, i) => (
                <tr key={t.teamNumber} style={{ background: i % 2 === 0 ? '#0d0d0d' : '#111' }}>
                  <td style={td}><span style={{ color: '#f97316', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>#{t.teamNumber}</span></td>
                  <td style={td}>{t.teamName || '—'}</td>
                  <td style={td}>{t.matchCount || 1}</td>
                  <td style={td}>{t.autoSamples}</td>
                  <td style={td}>{t.autoSpecimen}</td>
                  <td style={td}>{t.autoParking}</td>
                  <td style={td}>{t.teleopLowBasket}</td>
                  <td style={td}>{t.teleopHighBasket}</td>
                  <td style={td}>{t.teleopLowChamber}</td>
                  <td style={td}>{t.teleopHighChamber}</td>
                  <td style={td}>{endgameLabel(t.endgame)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const td = { padding: '6px 10px', borderBottom: '1px solid #141414', verticalAlign: 'middle' };
