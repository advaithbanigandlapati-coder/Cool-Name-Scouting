import { useState } from 'react';
import { Search, Upload, Trash2, RefreshCw, Plus, X, Copy, Check } from 'lucide-react';
import { scanTeams } from '../api/claude.js';
import { fetchTeamStats } from '../api/ftcscout.js';
import { BLANK_TEAM } from '../constants.js';
import { INITIAL_TEAMS } from '../data/initialTeams.js';

function CopyBtn({ text }) {
  const [done, setDone] = useState(false);
  function copy() { navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1800); }); }
  return (
    <button onClick={copy} style={{ background:'none', border:'none', cursor:'pointer', color: done?'#22c55e':'#525252', padding:'2px 6px', transition:'color 0.15s', display:'inline-flex', alignItems:'center', gap:4, fontSize:11 }}>
      {done ? <><Check size={11}/>Copied</> : <><Copy size={11}/>Copy</>}
    </button>
  );
}

export default function InitialScanTab({ teams, setTeams, setToast }) {
  const [input,      setInput]      = useState('');
  const [state,      setState]      = useState('New Jersey');
  const [loading,    setLoading]    = useState(false);
  const [paste,      setPaste]      = useState('');
  const [showPaste,  setShowPaste]  = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualTeam, setManualTeam] = useState({ teamNumber:'', teamName:'', stateRank:'', rs:'No', matchPoints:'', autoPoints:'', wlt:'', plays:'' });

  function parseNumbers(raw) {
    return [...new Set(raw.split(/[\n,\s]+/).map(s => s.trim()).filter(s => /^\d{4,6}$/.test(s)))];
  }

  async function runScan() {
    const nums = parseNumbers(input);
    if (!nums.length) { setToast({ msg:'Enter some team numbers first.', type:'warn' }); return; }
    setLoading(true);
    setToast({ msg:`Scanning ${nums.length} teams via Claude + FTCScout…`, type:'ok' });
    try {
      const aiResults = await scanTeams(nums, state);
      const enriched  = await Promise.all(aiResults.map(async r => {
        try {
          const ftc = await fetchTeamStats(r.teamNumber);
          return { ...BLANK_TEAM, ...r, opr: ftc?.opr || r.opr || '', epa: ftc?.epa || r.epa || '', teamName: r.teamName || ftc?.teamName || '', source:'scan', fetchStatus:'ok' };
        } catch { return { ...BLANK_TEAM, ...r, source:'scan', fetchStatus:'err' }; }
      }));
      setTeams(prev => {
        const byNum = Object.fromEntries(prev.map(t => [t.teamNumber, t]));
        const merged = enriched.map(t => {
          const ex = byNum[t.teamNumber];
          if (!ex) return t;
          const humanEdits = ex.humanEdits || {};
          const out = { ...ex };
          for (const [k, v] of Object.entries(t)) { if (!humanEdits[k]) out[k] = v; }
          out.humanEdits = humanEdits;
          return out;
        });
        const newNums = new Set(merged.map(t => t.teamNumber));
        return [...prev.filter(t => !newNums.has(t.teamNumber)), ...merged].sort((a,b) => (parseInt(a.stateRank)||999)-(parseInt(b.stateRank)||999));
      });
      setToast({ msg:`✓ Scanned ${enriched.length} teams.`, type:'ok' });
      setInput('');
    } catch(err) {
      setToast({ msg:`Scan failed: ${err.message}`, type:'err' });
    } finally { setLoading(false); }
  }

  async function fetchFTCOnly() {
    const nums = parseNumbers(input);
    if (!nums.length) { setToast({ msg:'Enter some team numbers first.', type:'warn' }); return; }
    setLoading(true);
    setToast({ msg:`Fetching ${nums.length} teams from FTCScout…`, type:'ok' });
    let ok = 0;
    try {
      const results = await Promise.all(nums.map(async num => {
        try {
          const ftc = await fetchTeamStats(num);
          return { ...BLANK_TEAM, teamNumber: num, teamName: ftc?.teamName || '', opr: ftc?.opr || '', epa: ftc?.epa || '', stateRank: ftc?.stateRank || '', source:'ftc', fetchStatus: ftc ? 'ok' : 'err' };
        } catch { return { ...BLANK_TEAM, teamNumber: num, source:'ftc', fetchStatus:'err' }; }
      }));
      ok = results.filter(r => r.fetchStatus === 'ok').length;
      setTeams(prev => {
        const byNum = Object.fromEntries(prev.map(t => [t.teamNumber, t]));
        const merged = results.map(t => ({ ...(byNum[t.teamNumber] || {}), ...t, humanEdits: byNum[t.teamNumber]?.humanEdits || {} }));
        const newNums = new Set(merged.map(t => t.teamNumber));
        return [...prev.filter(t => !newNums.has(t.teamNumber)), ...merged].sort((a,b) => (parseInt(a.stateRank)||999)-(parseInt(b.stateRank)||999));
      });
      setToast({ msg:`✓ FTCScout: ${ok}/${nums.length} teams fetched.`, type:'ok' });
      setInput('');
    } catch(err) {
      setToast({ msg:`FTCScout failed: ${err.message}`, type:'err' });
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
      parsed.push({ ...BLANK_TEAM, teamNumber, teamName:cols[1]||'', stateRank:cols[2]||'', rs:cols[3]||'', rpScore:cols[4]||'', matchPoints:cols[5]||'', basePoints:cols[6]||'', autoPoints:cols[7]||'', highScore:cols[8]||'', wlt:cols[9]||'', plays:cols[10]||'', source:'manual', fetchStatus:'idle' });
    }
    if (!parsed.length) { setToast({ msg:'No valid rows found. Copy the table directly from your doc (tab-separated).', type:'err' }); return; }
    setTeams(prev => {
      const byNum = Object.fromEntries(prev.map(t => [t.teamNumber, t]));
      return parsed.map(t => ({ ...(byNum[t.teamNumber]||{}), ...t, humanEdits: byNum[t.teamNumber]?.humanEdits||{} }));
    });
    setToast({ msg:`✓ Imported ${parsed.length} teams from doc paste.`, type:'ok' });
    setPaste(''); setShowPaste(false);
  }

  function addManual() {
    if (!manualTeam.teamNumber || !/^\d{3,6}$/.test(manualTeam.teamNumber)) {
      setToast({ msg:'Enter a valid team number (3–6 digits)', type:'warn' }); return;
    }
    setTeams(prev => {
      const existing = prev.find(t => t.teamNumber === manualTeam.teamNumber);
      if (existing) {
        return prev.map(t => t.teamNumber === manualTeam.teamNumber ? { ...t, ...manualTeam } : t);
      }
      return [...prev, { ...BLANK_TEAM, ...manualTeam, source:'manual', fetchStatus:'idle' }];
    });
    setToast({ msg:`✓ Team #${manualTeam.teamNumber} added.`, type:'ok' });
    setManualTeam({ teamNumber:'', teamName:'', stateRank:'', rs:'No', matchPoints:'', autoPoints:'', wlt:'', plays:'' });
    setShowManual(false);
  }

  function deleteTeam(teamNumber) {
    setTeams(prev => prev.filter(t => t.teamNumber !== teamNumber));
    setToast({ msg:`Removed team #${teamNumber}`, type:'warn' });
  }

  function resetToInitial() {
    if (!confirm('Reset all teams back to the 1.17.26 doc data? This will clear OPR/EPA/AI data.')) return;
    setTeams(INITIAL_TEAMS.map(t => ({ ...BLANK_TEAM, ...t })));
    setToast({ msg:'✓ Reset to initial doc data.', type:'ok' });
  }

  const det = parseNumbers(input);
  const teamNums = teams.map(t => t.teamNumber).join(', ');

  return (
    <div style={{ flex:1, overflowY:'auto', padding:20 }}>
      <div style={{ maxWidth:740, margin:'0 auto', display:'flex', flexDirection:'column', gap:16 }}>

        {/* ── AI Scan ── */}
        <div className="card">
          <h2 style={{ fontSize:20, marginBottom:4 }}>Scan Teams — AI + FTCScout</h2>
          <p style={{ fontSize:12, color:'#a3a3a3', marginBottom:14 }}>
            Enter team numbers → Claude searches FTCScout + web to auto-fill OPR, EPA, rank, record, and stats.
            <br/><span style={{ color:'#525252' }}>Or use "FTCScout Only" for just OPR/EPA without AI (faster + free).</span>
          </p>
          <div style={{ marginBottom:10 }}>
            <label>State / Region (helps Claude find the right event data)</label>
            <input value={state} onChange={e=>setState(e.target.value)} style={{ maxWidth:260 }} placeholder="New Jersey" />
          </div>
          <div style={{ marginBottom:10 }}>
            <label>Team Numbers — paste a list (comma, space, or newline separated)</label>
            <textarea value={input} onChange={e=>setInput(e.target.value)} rows={4}
              placeholder={"755, 9889, 16367, 31149\n30439\n26444..."} style={{ fontFamily:'var(--font-mono)', fontSize:12, resize:'vertical' }} />
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:4 }}>
              <span style={{ fontSize:11, color: det.length ? '#a3a3a3' : '#3a3a3a' }}>
                {det.length > 0 ? `${det.length} team numbers detected` : 'Supports any mix of separators'}
              </span>
              {det.length > 0 && <CopyBtn text={det.join(', ')} />}
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-primary" onClick={runScan} disabled={loading||!det.length}>
              {loading ? <><div className="spinner"/>Scanning…</> : <><Search size={14}/>AI Scan</>}
            </button>
            <button className="btn btn-ghost" onClick={fetchFTCOnly} disabled={loading||!det.length}>
              {loading ? <><div className="spinner" style={{width:12,height:12}}/>…</> : <>FTCScout Only</>}
            </button>
          </div>
        </div>

        {/* ── Manual Add ── */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: showManual ? 14 : 0 }}>
            <div>
              <h2 style={{ fontSize:20 }}>Add Team Manually</h2>
              {!showManual && <p style={{ fontSize:12, color:'#525252', marginTop:2 }}>Add a single team with known stats without AI scan.</p>}
            </div>
            <button className="btn btn-ghost" style={{ fontSize:12 }} onClick={() => setShowManual(s=>!s)}>
              {showManual ? 'Cancel' : <><Plus size={12}/>Add Team</>}
            </button>
          </div>
          {showManual && (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:10, marginBottom:10 }}>
                <div><label>Team # *</label><input value={manualTeam.teamNumber} onChange={e=>setManualTeam(p=>({...p,teamNumber:e.target.value.replace(/\D/g,'')}))} placeholder="30439" maxLength={6} style={{fontFamily:'var(--font-mono)'}}/></div>
                <div><label>Team Name</label><input value={manualTeam.teamName} onChange={e=>setManualTeam(p=>({...p,teamName:e.target.value}))} placeholder="Cool Name Pending"/></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
                {[['stateRank','State Rank'],['matchPoints','Match Pts'],['autoPoints','Auto Pts'],['wlt','W-L-T']].map(([k,lbl]) => (
                  <div key={k}><label>{lbl}</label><input value={manualTeam[k]} onChange={e=>setManualTeam(p=>({...p,[k]:e.target.value}))} placeholder="—"/></div>
                ))}
              </div>
              <button className="btn btn-primary" onClick={addManual}>
                <Plus size={14}/> Add to Table
              </button>
            </>
          )}
        </div>

        {/* ── Paste from doc ── */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: showPaste ? 10 : 0 }}>
            <div>
              <h2 style={{ fontSize:20 }}>Paste from Google Doc / Sheets</h2>
              {!showPaste && <p style={{ fontSize:12, color:'#525252', marginTop:2 }}>Paste a copied table — auto-parses tab-separated rows.</p>}
            </div>
            <button className="btn btn-ghost" style={{ fontSize:12 }} onClick={() => setShowPaste(s=>!s)}>
              {showPaste ? 'Hide' : 'Open'}
            </button>
          </div>
          {showPaste && (
            <>
              <div style={{ background:'#0a0a0a', border:'1px solid #1e1e1e', borderRadius:6, padding:'8px 12px', fontSize:11, color:'#525252', fontFamily:'var(--font-mono)', marginBottom:10, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span>Team # · Team Name · State Rank · RS · 1.17.26 · Match Pts · Base Pts · Auto Pts · High Score · W-L-T · Plays</span>
                <CopyBtn text="Team # | Team Name | State Rank | RS | 1.17.26 | Match Pts | Base Pts | Auto Pts | High Score | W-L-T | Plays" />
              </div>
              <textarea value={paste} onChange={e=>setPaste(e.target.value)} rows={8}
                placeholder="Paste table rows here (Ctrl+A in your doc table, Ctrl+C, then Ctrl+V here)..."
                style={{ fontFamily:'var(--font-mono)', fontSize:11, resize:'vertical', marginBottom:10 }} />
              <button className="btn btn-primary" onClick={importDocPaste} disabled={!paste.trim()}>
                <Upload size={14}/> Import Rows
              </button>
            </>
          )}
        </div>

        {/* ── Current teams ── */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: teams.length ? 14 : 0 }}>
            <div>
              <h2 style={{ fontSize:20 }}>Current Teams ({teams.length})</h2>
              <p style={{ fontSize:12, color:'#a3a3a3', marginTop:2 }}>
                {teams.filter(t=>t.opr).length} with OPR · {teams.filter(t=>t.tier).length} AI-analyzed
              </p>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {teamNums && <CopyBtn text={teamNums} />}
              <button className="btn btn-ghost" style={{ fontSize:12 }} onClick={resetToInitial}><RefreshCw size={12}/> Reset</button>
              <button className="btn btn-danger" style={{ fontSize:12 }} onClick={()=>{ if(confirm('Clear all teams?')) setTeams([]); }}><Trash2 size={12}/> Clear All</button>
            </div>
          </div>
          {teams.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {teams.map(t => (
                <div key={t.teamNumber} style={{
                  display:'flex', alignItems:'center', gap:6, background:'#0a0a0a',
                  border:'1px solid #1e1e1e', borderRadius:6, padding:'4px 10px 4px 12px',
                }}>
                  <span style={{ fontFamily:'var(--font-mono)', color:'#f97316', fontSize:12, fontWeight:700 }}>#{t.teamNumber}</span>
                  {t.teamName && <span style={{ fontSize:12, color:'#525252' }}>{t.teamName}</span>}
                  <button onClick={() => deleteTeam(t.teamNumber)} style={{ background:'none', border:'none', cursor:'pointer', color:'#3a3a3a', padding:'0 0 0 4px', lineHeight:1, transition:'color 0.15s', display:'flex' }}
                    onMouseEnter={e=>e.target.style.color='#ef4444'} onMouseLeave={e=>e.target.style.color='#3a3a3a'}>
                    <X size={11}/>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
