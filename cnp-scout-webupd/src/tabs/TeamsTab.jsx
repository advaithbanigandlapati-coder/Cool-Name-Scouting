import { RefreshCw, Download, Trash2 } from 'lucide-react';
import TeamCard from '../components/TeamCard.jsx';
import { fetchSheetTeams } from '../api/sheets.js';
import { fetchTeamStats } from '../api/ftcscout.js';

export default function TeamsTab({ teams, setTeams, settings, setToast }) {
  async function importFromSheets() {
    if (!settings.googleApiKey || !settings.sheetId) {
      setToast({ msg: 'Set your Google API Key and Sheet ID in Settings first.', type: 'err' });
      return;
    }
    if (!settings.columnMapping || Object.keys(settings.columnMapping).length === 0) {
      setToast({ msg: 'Set up column mapping in Settings first.', type: 'warn' });
      return;
    }
    try {
      setToast({ msg: 'Importing from Google Sheets…', type: 'ok' });
      const imported = await fetchSheetTeams(
        { sheetId: settings.sheetId, googleApiKey: settings.googleApiKey },
        settings.columnMapping,
        []
      );
      if (imported.length === 0) {
        setToast({ msg: 'No team data found. Check your Sheet ID and column mapping.', type: 'warn' });
        return;
      }
      // Merge with existing (keep FTCScout data if already fetched)
      setTeams(prev => {
        const byNum = Object.fromEntries(prev.map(t => [t.teamNumber, t]));
        return imported.map(t => ({ ...(byNum[t.teamNumber] || {}), ...t,
          fetchStatus: byNum[t.teamNumber]?.fetchStatus || 'idle' }));
      });
      setToast({ msg: `✓ Imported ${imported.length} teams from Sheets.`, type: 'ok' });
    } catch (err) {
      setToast({ msg: `Sheets error: ${err.message}`, type: 'err' });
    }
  }

  async function fetchOne(teamNumber) {
    setTeams(prev => prev.map(t => t.teamNumber === teamNumber ? { ...t, fetchStatus: 'loading' } : t));
    try {
      const stats = await fetchTeamStats(teamNumber);
      if (!stats) throw new Error('Team not found on FTCScout');
      setTeams(prev => prev.map(t => t.teamNumber === teamNumber
        ? { ...t, ...stats, fetchStatus: 'ok' } : t));
    } catch (err) {
      setTeams(prev => prev.map(t => t.teamNumber === teamNumber ? { ...t, fetchStatus: 'err' } : t));
      setToast({ msg: `FTCScout: ${err.message}`, type: 'err' });
    }
  }

  async function fetchAll() {
    for (const t of teams) {
      if (t.fetchStatus !== 'ok') await fetchOne(t.teamNumber);
    }
    setToast({ msg: '✓ FTCScout data fetched for all teams.', type: 'ok' });
  }

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #1e1e1e',
        display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        <button className="btn btn-primary" onClick={importFromSheets}>
          <Download size={14} /> Import from Sheets
        </button>
        {teams.length > 0 && (
          <>
            <button className="btn btn-ghost" onClick={fetchAll}>
              <RefreshCw size={14} /> Fetch All FTCScout
            </button>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#525252', fontFamily: 'var(--font-mono)' }}>
              {teams.length} teams
            </span>
            <button className="btn btn-danger" onClick={() => { setTeams([]); setToast({ msg: 'Teams cleared.', type: 'warn' }); }}>
              <Trash2 size={14} /> Clear
            </button>
          </>
        )}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {teams.length === 0 ? (
          <div className="empty">
            <Download size={40} />
            <h3>No teams yet</h3>
            <p>Import from Google Sheets to get started,<br/>or configure your sheet in Settings.</p>
          </div>
        ) : (
          teams.map(t => <TeamCard key={t.teamNumber} team={t} onFetch={fetchOne} />)
        )}
      </div>
    </div>
  );
}
