import { useState } from 'react';
import { Download, Copy, Check, HelpCircle, RefreshCw, X } from 'lucide-react';
import { fetchSheetTeams } from '../api/sheets.js';

const bool = v => v
  ? <span style={{ color:'#22c55e', fontWeight:700 }}>✓</span>
  : <span style={{ color:'#2a2a2a' }}>✗</span>;

function CopyBtn({ text, label }) {
  const [done, setDone] = useState(false);
  function copy() { navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1800); }); }
  return (
    <button onClick={copy} title={`Copy ${label||''}`} style={{
      background:'none', border:'1px solid #2a2a2a', borderRadius:4, cursor:'pointer',
      color: done?'#22c55e':'#525252', padding:'3px 8px', display:'inline-flex', alignItems:'center',
      gap:4, fontSize:11, transition:'all 0.15s',
    }}>
      {done ? <><Check size={10}/>Copied!</> : <><Copy size={10}/>{label||'Copy'}</>}
    </button>
  );
}

export default function FormTab({ teams, setTeams, settings, setToast }) {
  const [loading,   setLoading]   = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const scoutedTeams = teams.filter(t => t.source === 'form' || t.avgBallsTeleop || t.avgBallsAuto || t.endgamePlan);

  async function importForm() {
    if (!settings.googleApiKey || !settings.sheetId) {
      setToast({ msg:'⚙️ Set your Google API Key and Sheet ID in Settings first.', type:'err' }); return;
    }
    const mapping = settings.columnMapping || {};
    if (!mapping.teamName) {
      setToast({ msg:'⚙️ Map the Team Name column in Settings → Column Mapping first.', type:'warn' }); return;
    }
    setLoading(true);
    try {
      setToast({ msg:'Importing from Google Sheets…', type:'ok' });
      const imported = await fetchSheetTeams({ sheetId: settings.sheetId, googleApiKey: settings.googleApiKey }, mapping);
      if (!imported.length) { setToast({ msg:'No rows found. Check Sheet ID, column mapping, and that the sheet is public.', type:'warn' }); return; }
      setTeams(prev => {
        const byNum = Object.fromEntries(prev.map(t => [t.teamNumber, t]));
        const updated = imported.map(t => ({ ...(byNum[t.teamNumber] || {}), ...t, humanEdits: byNum[t.teamNumber]?.humanEdits || {}, source:'form' }));
        const importedNums = new Set(updated.map(t => t.teamNumber));
        return [...prev.filter(t => !importedNums.has(t.teamNumber)), ...updated].sort((a,b) => (parseInt(a.stateRank)||999)-(parseInt(b.stateRank)||999));
      });
      setToast({ msg:`✓ Imported ${imported.length} teams (${imported.reduce((s,t)=>s+(t.matchCount||1),0)} responses).`, type:'ok' });
    } catch(err) {
      setToast({ msg:`Sheets error: ${err.message}`, type:'err' });
    } finally { setLoading(false); }
  }

  function clearFormData() {
    if (!confirm('Clear all form data? This removes scouted ball counts and endgame plans.')) return;
    setTeams(prev => prev.map(t => t.source === 'form' ? { ...t, avgBallsAuto:0, highBallsAuto:0, avgBallsTeleop:0, highBallsTeleop:0, endgamePlan:'', hasAuto:false, autoCloseRange:false, autoFarRange:false, autoLeave:false, ballCapacity:'', source:'manual' } : t));
    setToast({ msg:'Form data cleared.', type:'warn' });
  }

  const th = { padding:'6px 10px', textAlign:'left', color:'#525252', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'1px solid #1a1a1a', whiteSpace:'nowrap', background:'#0a0a0a', position:'sticky', top:0 };
  const td = { padding:'5px 10px', borderBottom:'1px solid #111', verticalAlign:'middle', fontSize:12 };

  const setupOk = settings.googleApiKey && settings.sheetId;

  return (
    <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>

      {/* Toolbar */}
      <div style={{ padding:'10px 16px', borderBottom:'1px solid #1e1e1e', flexShrink:0, display:'flex', gap:10, alignItems:'center', background:'#0a0a0a', flexWrap:'wrap' }}>
        <button className="btn btn-primary" onClick={importForm} disabled={loading}>
          {loading ? <><div className="spinner"/>Importing…</> : <><Download size={14}/>Import from Google Sheets</>}
        </button>
        <button className="btn btn-ghost" style={{ fontSize:12 }} onClick={() => setShowGuide(s=>!s)}>
          <HelpCircle size={13}/> Setup Guide
        </button>
        {scoutedTeams.length > 0 && (
          <>
            <CopyBtn text={scoutedTeams.map(t=>`#${t.teamNumber} ${t.teamName}`).join('\n')} label="Team List" />
            <button className="btn btn-ghost" style={{ fontSize:12, color:'#ef4444', borderColor:'#3a1f1f' }} onClick={clearFormData}>
              <X size={12}/> Clear Form Data
            </button>
            <span style={{ marginLeft:'auto', fontSize:11, color:'#3a3a3a', fontFamily:'var(--font-mono)' }}>
              {scoutedTeams.length} teams · {scoutedTeams.reduce((s,t)=>s+(t.matchCount||1),0)} responses
            </span>
          </>
        )}
        {!setupOk && (
          <span style={{ fontSize:11, color:'#eab308', marginLeft:'auto' }}>
            ⚠️ Go to Settings to add Google API Key + Sheet ID
          </span>
        )}
      </div>

      {/* Setup guide */}
      {showGuide && (
        <div style={{ padding:'14px 16px', background:'#0a0a0a', borderBottom:'1px solid #1e1e1e', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <span style={{ fontSize:12, fontWeight:700, color:'#f97316', textTransform:'uppercase', letterSpacing:'0.05em' }}>Google Form → Sheets Setup</span>
            <button onClick={() => setShowGuide(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#525252' }}><X size={14}/></button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, fontSize:12, color:'#a3a3a3', maxWidth:780 }}>
            {[
              ['1. Link your form to Sheets', 'Open Google Form → Responses tab → green Sheets icon → Create new spreadsheet.'],
              ['2. Make sheet public', 'In the spreadsheet: Share → change to "Anyone with the link" → Viewer → Done.'],
              ['3. Get Sheet ID', 'Copy the long ID from the URL between /d/ and /edit. Paste in Settings.'],
              ['4. Load headers', 'In Settings → click "Load Column Headers" to pull your form\'s column names.'],
              ['5. Map columns', 'Use the dropdowns to match each field to your form\'s question column.'],
              ['6. Import', 'Come back here and click "Import from Google Sheets". Done!'],
            ].map(([step, desc]) => (
              <div key={step} style={{ background:'#0f0f0f', border:'1px solid #1e1e1e', borderRadius:6, padding:'10px 12px' }}>
                <div style={{ fontWeight:700, color:'#f97316', marginBottom:3 }}>{step}</div>
                <div>{desc}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:10, background:'#0f0f0f', border:'1px solid #2a2a2a', borderRadius:6, padding:'8px 12px', fontSize:11, fontFamily:'var(--font-mono)', color:'#525252', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span>Team name format: <span style={{color:'#a3a3a3'}}>"755 -- Delbotics"</span> or <span style={{color:'#a3a3a3'}}>"755"</span> — number must come first</span>
            <CopyBtn text='755 -- Delbotics' label="Example" />
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ flex:1, overflowY:'auto', overflowX:'auto' }}>
        {!scoutedTeams.length ? (
          <div className="empty">
            <h3>No Form Data</h3>
            <p>
              {!setupOk
                ? 'Go to ⚙️ Settings → add your Google API Key + Sheet ID → Load Headers → map columns → Save.\nThen come back and click Import.'
                : 'Click "Import from Google Sheets" above, or click "Setup Guide" if you haven\'t connected your sheet yet.'}
            </p>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, whiteSpace:'nowrap' }}>
            <thead>
              <tr>
                <th style={th}>#</th>
                <th style={th}>Team</th>
                <th style={th}>Responses</th>
                <th style={{...th, color:'#f97316', borderTop:'2px solid rgba(249,115,22,0.2)'}} colSpan={5}>AUTO</th>
                <th style={{...th, color:'#60a5fa', borderTop:'2px solid rgba(96,165,250,0.2)'}} colSpan={4}>TELEOP</th>
                <th style={{...th, color:'#a78bfa', borderTop:'2px solid rgba(167,139,250,0.2)'}} colSpan={2}>ENDGAME</th>
              </tr>
              <tr style={{ background:'#0c0c0c' }}>
                <th style={th}/><th style={th}/><th style={th}/>
                <th style={th}>Has Auto</th><th style={th}>Up Close</th><th style={th}>Far Range</th><th style={th}>Leave</th><th style={th}>Avg Balls</th>
                <th style={th}>Avg Balls</th><th style={th}>High Balls</th><th style={th}>Capacity</th>
                <th style={th}>High Balls</th><th style={th}>Plan</th>
              </tr>
            </thead>
            <tbody>
              {scoutedTeams.map((t,i) => (
                <tr key={t.teamNumber} style={{ background:i%2===0?'#0c0c0c':'#0f0f0f' }}>
                  <td style={{ ...td, color:'#f97316', fontFamily:'var(--font-mono)', fontWeight:700 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      #{t.teamNumber}
                      <button onClick={() => navigator.clipboard.writeText(t.teamNumber)} title="Copy number"
                        style={{ background:'none', border:'none', cursor:'pointer', color:'#3a3a3a', padding:0, display:'flex', lineHeight:1 }}
                        onMouseEnter={e=>e.currentTarget.style.color='#a3a3a3'} onMouseLeave={e=>e.currentTarget.style.color='#3a3a3a'}>
                        <Copy size={9}/>
                      </button>
                    </div>
                  </td>
                  <td style={td}>{t.teamName || '—'}</td>
                  <td style={{ ...td, color:'#525252', fontFamily:'var(--font-mono)', textAlign:'center' }}>{t.matchCount||1}</td>
                  <td style={{ ...td, textAlign:'center' }}>{bool(t.hasAuto)}</td>
                  <td style={{ ...td, textAlign:'center' }}>{bool(t.autoCloseRange)}</td>
                  <td style={{ ...td, textAlign:'center' }}>{bool(t.autoFarRange)}</td>
                  <td style={{ ...td, textAlign:'center' }}>{bool(t.autoLeave)}</td>
                  <td style={{ ...td, textAlign:'right', fontFamily:'var(--font-mono)' }}>{t.avgBallsAuto||'—'}</td>
                  <td style={{ ...td, textAlign:'right', fontFamily:'var(--font-mono)' }}>{t.avgBallsTeleop||'—'}</td>
                  <td style={{ ...td, textAlign:'right', fontFamily:'var(--font-mono)' }}>{t.highBallsTeleop||'—'}</td>
                  <td style={{ ...td, textAlign:'center', fontFamily:'var(--font-mono)' }}>{t.ballCapacity||'—'}</td>
                  <td style={{ ...td, textAlign:'right', fontFamily:'var(--font-mono)' }}>{t.highBallsAuto||'—'}</td>
                  <td style={{ ...td, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', color:'#a3a3a3' }}>{t.endgamePlan||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
