import { useState } from 'react';
import { Search, Upload, Trash2, RefreshCw } from 'lucide-react';
import { scanTeams } from '../api/claude.js';
import { fetchTeamStats } from '../api/ftcscout.js';
import { BLANK_TEAM } from '../constants.js';
import { INITIAL_TEAMS } from '../data/initialTeams.js';

export default function InitialScanTab({ teams, setTeams, setToast }) {
  const [input,    setInput]    = useState('');
  const [state,    setState]    = useState('New Jersey');
  const [loading,  setLoading]  = useState(false);
  const [paste,    setPaste]    = useState('');
  const [showPaste,setShowPaste]= useState(false);

  function parseNumbers(raw) {
    return [...new Set(
      raw.split(/[\n,\s]+/).map(s => s.trim()).filter(s => /^\d{4,6}$/.test(s))
    )];
  }

  async function runScan() {
    const nums = parseNumbers(input);
    if (!nums.length) { setToast({ msg: 'Enter some team numbers first.', type:'warn' }); return; }
    setLoading(true);
    setToast({ msg: `Scanning ${nums.length} teams via AI + FTCScout…`, type:'ok' });
    try {
      const aiResults = await scanTeams(nums, state);
      const enriched  = await Promise.all(aiResults.map(async r => {
        try {
          const ftc = await fetchTeamStats(r.teamNumber);
          return {
            ...BLANK_TEAM, ...r,
            opr: ftc?.opr || r.opr || '',
            epa: ftc?.epa || r.epa || '',
            teamName: r.teamName || ftc?.teamName || '',
            source: 'scan', fetchStatus: 'ok',
          };
        } catch {
          return { ...BLANK_TEAM, ...r, source:'scan', fetchStatus:'err' };
        }
      }));

      setTeams(prev => {
        const byNum = Object.fromEntries(prev.map(t => [t.teamNumber, t]));
        const merged = enriched.map(t => {
          const existing = byNum[t.teamNumber];
          if (!existing) return t;
          const humanEdits = existing.humanEdits || {};
          const out = { ...existing };
          for (const [k, v] of Object.entries(t)) {
            if (!humanEdits[k]) out[k] = v;
          }
          out.humanEdits = humanEdits;
          return out;
        });
        const newNums = new Set(merged.map(t => t.teamNumber));
        return [...prev.filter(t => !newNums.has(t.teamNumber)), ...merged]
          .sort((a,b) => (parseInt(a.stateRank)||999) - (parseInt(b.stateRank)||999));
      });

      setToast({ msg: `✓ Scanned ${enriched.length} teams.`, type:'ok' });
      setInput('');
    } catch(err) {
      setToast({ msg: `Scan failed: ${err.message}`, type:'err' });
    } finally { setLoading(false); }
  }

  function importDocPaste() {
    const lines = paste.trim().split('\n').filter(l => l.trim());
    const parsed = [];
    for (const line of lines) {
      const cols = line.split('\t').map(s => s.trim());
      if (cols.length < 2) continue;
      const teamNumber = cols[0];
      if (!/^\d{3,6}$/.test(teamNumber)) continue;
      parsed.push({
        ...BLANK_TEAM,
        teamNumber,
        teamName:    cols[1]  || '',
        stateRank:   cols[2]  || '',
        rs:          cols[3]  || '',
        rpScore:     cols[4]  || '',
        matchPoints: cols[5]  || '',
        basePoints:  cols[6]  || '',
        autoPoints:  cols[7]  || '',
        highScore:   cols[8]  || '',
        wlt:         cols[9]  || '',
        plays:       cols[10] || '',
        source: 'manual', fetchStatus:'idle',
      });
    }
    if (!parsed.length) { setToast({ msg:'No valid rows found. Copy the table directly from your doc (tab-separated).', type:'err' }); return; }
    setTeams(prev => {
      const byNum = Object.fromEntries(prev.map(t => [t.teamNumber, t]));
      return parsed.map(t => ({ ...(byNum[t.teamNumber]||{}), ...t, humanEdits: byNum[t.teamNumber]?.humanEdits||{} }));
    });
    setToast({ msg:`✓ Imported ${parsed.length} teams from doc.`, type:'ok' });
    setPaste(''); setShowPaste(false);
  }

  function resetToInitial() {
    if (!confirm('Reset all teams back to the 1.17.26 doc data? This will clear OPR/EPA/AI data.')) return;
    setTeams(INITIAL_TEAMS.map(t => ({ ...BLANK_TEAM, ...t })));
    setToast({ msg:'✓ Reset to initial doc data.', type:'ok' });
  }

  const det = parseNumbers(input);

  return (
    <div style={{ flex:1, overflowY:'auto', padding:24 }}>
      <div style={{ maxWidth:720, margin:'0 auto', display:'flex', flexDirection:'column', gap:20 }}>

        {/* AI Scan */}
        <div className="card">
          <h2 style={{ fontSize:20, marginBottom:4 }}>AI Team Scan</h2>
          <p style={{ fontSize:12, color:'#a3a3a3', marginBottom:16 }}>
            Enter team numbers and Claude will search FTCScout + web to pull OPR, EPA, rank, record, and stats automatically.
          </p>
          <div style={{ marginBottom:12 }}>
            <label>State / Region</label>
            <input value={state} onChange={e=>setState(e.target.value)} style={{ maxWidth:260 }} placeholder="New Jersey" />
          </div>
          <div style={{ marginBottom:12 }}>
            <label>Team Numbers — paste a list (comma, space, or newline separated)</label>
            <textarea
              value={input} onChange={e=>setInput(e.target.value)}
              rows={5} placeholder={"755, 9889, 16367, 31149\n30439\n26444..."}
              style={{ fontFamily:'var(--font-mono)', fontSize:12, resize:'vertical' }}
            />
            <p style={{ fontSize:11, color:det.length?'#a3a3a3':'#3a3a3a', marginTop:4 }}>
              {det.length > 0 ? `${det.length} team numbers detected` : 'Supports any mix of separators'}
            </p>
          </div>
          <button className="btn btn-primary" onClick={runScan} disabled={loading||!det.length}>
            {loading ? <><div className="spinner"/>Scanning…</> : <><Search size={14}/>Run Scan</>}
          </button>
        </div>

        {/* Paste from doc */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <div>
              <h2 style={{ fontSize:20 }}>Paste from Google Doc / Sheets</h2>
              <p style={{ fontSize:12, color:'#a3a3a3', marginTop:2 }}>
                Copy your table and paste it here — auto-parses tab-separated rows.
              </p>
            </div>
            <button className="btn btn-ghost" style={{ fontSize:12 }} onClick={()=>setShowPaste(s=>!s)}>
              {showPaste ? 'Hide' : 'Open'}
            </button>
          </div>
          {showPaste && (
            <>
              <p style={{ fontSize:11, color:'#3a3a3a', marginBottom:8, fontFamily:'var(--font-mono)' }}>
                Expected: Team # · Team Name · State Rank · RS · 1.17.26 · Match Pts · Base Pts · Auto Pts · High Score · W-L-T · Plays
              </p>
              <textarea
                value={paste} onChange={e=>setPaste(e.target.value)}
                rows={10} placeholder="Paste table rows here..."
                style={{ fontFamily:'var(--font-mono)', fontSize:11, resize:'vertical', marginBottom:10 }}
              />
              <button className="btn btn-primary" onClick={importDocPaste} disabled={!paste.trim()}>
                <Upload size={14}/> Import
              </button>
            </>
          )}
        </div>

        {/* Current status */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <h2 style={{ fontSize:20 }}>Current Data</h2>
              <p style={{ fontSize:12, color:'#a3a3a3', marginTop:2 }}>
                {teams.length} teams loaded · {teams.filter(t=>t.opr).length} with OPR/EPA · {teams.filter(t=>t.tier).length} AI-analyzed
              </p>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-ghost" style={{ fontSize:12 }} onClick={resetToInitial}>
                <RefreshCw size={12}/> Reset to Doc
              </button>
              <button className="btn btn-danger" style={{ fontSize:12 }} onClick={()=>{ if(confirm('Clear all teams?')) setTeams([]); }}>
                <Trash2 size={12}/> Clear All
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
