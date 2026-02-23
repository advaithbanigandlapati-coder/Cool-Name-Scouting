import { useState } from 'react';
import { Download, Info } from 'lucide-react';
import { fetchSheetTeams } from '../api/sheets.js';

const bool = v => v
  ? <span style={{ color:'#22c55e', fontWeight:700 }}>✓</span>
  : <span style={{ color:'#2a2a2a' }}>✗</span>;

export default function FormTab({ teams, setTeams, settings, setToast }) {
  const [loading, setLoading] = useState(false);
  const scoutedTeams = teams.filter(t => t.source === 'form' || t.avgBallsTeleop || t.avgBallsAuto || t.endgamePlan);

  async function importForm() {
    if (!settings.googleApiKey || !settings.sheetId) {
      setToast({ msg:'Set your Google API Key and Sheet ID in Settings first.', type:'err' }); return;
    }
    const mapping = settings.columnMapping || {};
    if (!mapping.teamName) {
      setToast({ msg:'Map the Team Name column in Settings → Column Mapping first.', type:'warn' }); return;
    }
    setLoading(true);
    try {
      setToast({ msg:'Importing from Google Sheets…', type:'ok' });
      const imported = await fetchSheetTeams(
        { sheetId: settings.sheetId, googleApiKey: settings.googleApiKey },
        mapping
      );
      if (!imported.length) { setToast({ msg:'No rows found. Check your Sheet ID and column mapping.', type:'warn' }); return; }

      setTeams(prev => {
        const byNum = Object.fromEntries(prev.map(t => [t.teamNumber, t]));
        const updated = imported.map(t => ({
          ...(byNum[t.teamNumber] || {}),
          ...t,
          humanEdits: byNum[t.teamNumber]?.humanEdits || {},
          source: 'form',
        }));
        // Keep teams not in form import
        const importedNums = new Set(updated.map(t => t.teamNumber));
        return [...prev.filter(t => !importedNums.has(t.teamNumber)), ...updated]
          .sort((a,b) => (parseInt(a.stateRank)||999)-(parseInt(b.stateRank)||999));
      });
      setToast({ msg:`✓ Imported ${imported.length} teams from form (${imported.reduce((s,t)=>s+(t.matchCount||1),0)} responses).`, type:'ok' });
    } catch(err) {
      setToast({ msg:`Sheets error: ${err.message}`, type:'err' });
    } finally { setLoading(false); }
  }

  const th = {
    padding:'7px 10px', textAlign:'left', color:'#525252', fontSize:10,
    fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em',
    borderBottom:'1px solid #1a1a1a', whiteSpace:'nowrap', background:'#0a0a0a',
    position:'sticky', top:0,
  };
  const td = { padding:'5px 10px', borderBottom:'1px solid #111', verticalAlign:'middle', fontSize:12 };
  const ghdr = (label, color) => ({
    ...th, color, borderTop:`2px solid ${color}22`, background:'#080808',
  });

  return (
    <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>

      {/* Toolbar */}
      <div style={{ padding:'10px 16px', borderBottom:'1px solid #1e1e1e', flexShrink:0,
        display:'flex', gap:10, alignItems:'center', background:'#0a0a0a' }}>
        <button className="btn btn-primary" onClick={importForm} disabled={loading}>
          {loading ? <><div className="spinner"/>Importing…</> : <><Download size={14}/>Import from Google Sheets</>}
        </button>
        {scoutedTeams.length > 0 && (
          <span style={{ marginLeft:'auto', fontSize:11, color:'#3a3a3a', fontFamily:'var(--font-mono)' }}>
            {scoutedTeams.length} teams · {scoutedTeams.reduce((s,t)=>s+(t.matchCount||1),0)} form responses
          </span>
        )}
      </div>

      <div style={{ flex:1, overflowY:'auto', overflowX:'auto' }}>
        {!scoutedTeams.length ? (
          <div className="empty">
            <h3>No Form Data</h3>
            <p>Set up column mapping in Settings,<br/>then import your Google Sheet.</p>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, whiteSpace:'nowrap' }}>
            <thead>
              <tr>
                <th style={th}>#</th>
                <th style={th}>Team</th>
                <th style={th}>Matches</th>
                {/* Auto group */}
                <th style={ghdr('AUTO','#f97316')} colSpan={5}>AUTO</th>
                {/* Teleop group */}
                <th style={ghdr('TELEOP','#60a5fa')} colSpan={4}>TELEOP</th>
                {/* Endgame */}
                <th style={ghdr('ENDGAME','#a78bfa')} colSpan={1}>ENDGAME</th>
              </tr>
              <tr style={{ background:'#0c0c0c' }}>
                <th style={th}></th><th style={th}></th><th style={th}></th>
                <th style={th}>Has Auto</th>
                <th style={th}>Up Close</th>
                <th style={th}>Far Away</th>
                <th style={th}>Leave</th>
                <th style={th}>Avg Balls</th>
                <th style={th}>High Balls</th>
                <th style={th}>Capacity</th>
                <th style={th}>Avg Balls</th>
                <th style={th}>High Balls</th>
                <th style={th}>Plan</th>
              </tr>
            </thead>
            <tbody>
              {scoutedTeams.map((t,i) => (
                <tr key={t.teamNumber} style={{ background:i%2===0?'#0c0c0c':'#0f0f0f' }}>
                  <td style={{ ...td, color:'#f97316', fontFamily:'var(--font-mono)', fontWeight:700 }}>#{t.teamNumber}</td>
                  <td style={td}>{t.teamName || '—'}</td>
                  <td style={{ ...td, color:'#525252', fontFamily:'var(--font-mono)' }}>{t.matchCount||1}</td>
                  <td style={{ ...td, textAlign:'center' }}>{bool(t.hasAuto)}</td>
                  <td style={{ ...td, textAlign:'center' }}>{bool(t.autoCloseRange)}</td>
                  <td style={{ ...td, textAlign:'center' }}>{bool(t.autoFarRange)}</td>
                  <td style={{ ...td, textAlign:'center' }}>{bool(t.autoLeave)}</td>
                  <td style={{ ...td, textAlign:'right', fontFamily:'var(--font-mono)' }}>{t.avgBallsAuto||'—'}</td>
                  <td style={{ ...td, textAlign:'right', fontFamily:'var(--font-mono)' }}>{t.highBallsAuto||'—'}</td>
                  <td style={{ ...td, textAlign:'center', fontFamily:'var(--font-mono)' }}>{t.ballCapacity||'—'}</td>
                  <td style={{ ...td, textAlign:'right', fontFamily:'var(--font-mono)' }}>{t.avgBallsTeleop||'—'}</td>
                  <td style={{ ...td, textAlign:'right', fontFamily:'var(--font-mono)' }}>{t.highBallsTeleop||'—'}</td>
                  <td style={{ ...td, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', color:'#a3a3a3' }}>
                    {t.endgamePlan||'—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
