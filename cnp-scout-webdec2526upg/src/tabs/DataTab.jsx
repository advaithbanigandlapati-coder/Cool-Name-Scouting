import { useState, useMemo } from 'react';
import { RefreshCw, Zap, ChevronDown, ChevronUp, Download, Copy, Check, Plus } from 'lucide-react';
import DataTable from '../components/DataTable.jsx';
import { runAnalysis } from '../api/claude.js';
import { fetchTeamStats } from '../api/ftcscout.js';
import { TIER_ORDER, TIER_COLOR, BLANK_TEAM } from '../constants.js';

function CopyBtn({ text, label }) {
  const [done, setDone] = useState(false);
  function copy() { navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1800); }); }
  return (
    <button onClick={copy} title={`Copy ${label||''}`} style={{
      background:'none', border:'1px solid #2a2a2a', borderRadius:4, cursor:'pointer',
      color: done?'#22c55e':'#525252', padding:'4px 9px', display:'inline-flex', alignItems:'center',
      gap:4, fontSize:11, transition:'all 0.15s',
    }}>
      {done ? <><Check size={10}/>Copied!</> : <><Copy size={10}/>{label||'Copy'}</>}
    </button>
  );
}

export default function DataTab({ teams, setTeams, mine, settings, setToast }) {
  const [analyzing,  setAnalyzing]  = useState(false);
  const [fetching,   setFetching]   = useState(false);
  const [sortKey,    setSortKey]    = useState('stateRank');
  const [sortDir,    setSortDir]    = useState('asc');
  const [filter,     setFilter]     = useState('all');

  function updateTeam(teamNumber, updater) {
    setTeams(prev => prev.map(t => t.teamNumber === teamNumber ? updater(t) : t));
  }

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d==='asc'?'desc':'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  async function fetchAllFTC() {
    setFetching(true);
    setToast({ msg:`Fetching FTCScout for ${teams.length} teams…`, type:'ok' });
    let updated = 0;
    let proxyError = null;
    for (const team of teams) {
      try {
        const stats = await fetchTeamStats(team.teamNumber);
        if (stats) {
          updateTeam(team.teamNumber, prev => ({ ...prev, opr: stats.opr||prev.opr, epa: stats.epa||prev.epa, teamName: prev.teamName||stats.teamName||prev.teamName, fetchStatus:'ok' }));
          updated++;
        }
        // null just means team has no FTCScout data yet — not an error
      } catch (err) {
        // Real error (network/proxy) — capture once and stop
        proxyError = err.message;
        break;
      }
      await new Promise(r => setTimeout(r, 120));
    }
    setFetching(false);
    if (proxyError) {
      setToast({ msg:`FTCScout error: ${proxyError}`, type:'err' });
    } else {
      setToast({ msg:`FTCScout: ${updated}/${teams.length} teams have data.`, type:'ok' });
    }
  }

  async function analyze() {
    if (!teams.length) { setToast({ msg:'No teams loaded.', type:'warn' }); return; }
    setAnalyzing(true);
    setToast({ msg:`Analyzing ${teams.length} teams in batches of 5…`, type:'ok' });
    try {
      const results = await runAnalysis(teams, mine, (batchIdx, total, batchSize) => {
        setToast({ msg:`Batch ${batchIdx + 1}/${total} — analyzing ${batchSize} teams…`, type:'ok' });
      });
      setTeams(prev => prev.map(t => {
        const r = results.find(r => String(r.teamNumber) === String(t.teamNumber));
        if (!r) return t;
        const humanEdits = t.humanEdits || {};
        const updates = {};
        for (const f of ['notes','complementary','tier','compatScore','withTips','againstTips','whyAlliance']) {
          if (!humanEdits[f]) updates[f] = r[f] ?? t[f];
        }
        return { ...t, ...updates };
      }));
      setToast({ msg:`✓ Analysis complete — ${results.length} teams ranked.`, type:'ok' });
    } catch (err) {
      setToast({ msg:`Analysis failed: ${err.message}`, type:'err' });
    } finally { setAnalyzing(false); }
  }

  function exportCSV() {
    const headers = ['Team #','Team Name','State Rank','RS','1.17.26','Match Pts','Base Pts','Auto Pts','High Score','W-L-T','Plays','OPR','EPA','Tier','Compat','Complementary','Notes','Alliance Target'];
    const rows = sorted.map(t => [
      t.teamNumber, t.teamName, t.stateRank, t.rs, t.rpScore,
      t.matchPoints, t.basePoints, t.autoPoints, t.highScore, t.wlt, t.plays,
      t.opr, t.epa, t.tier, t.compatScore, t.complementary, t.notes,
      t.allianceTarget ? 'YES' : '',
    ].map(v => `"${String(v??'').replace(/"/g,'""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'cnp-scout-data.csv'; a.click();
  }

  const sorted = useMemo(() => {
    let list = [...teams];
    if (filter === 'targets') list = list.filter(t => t.allianceTarget);
    else if (filter === 'optimal') list = list.filter(t => t.tier === 'OPTIMAL');
    else if (filter === 'mid')     list = list.filter(t => t.tier === 'MID');
    else if (filter === 'bad')     list = list.filter(t => t.tier === 'BAD');
    list.sort((a, b) => {
      let av = a[sortKey]??'', bv = b[sortKey]??'';
      const an = parseFloat(av), bn = parseFloat(bv);
      if (!isNaN(an) && !isNaN(bn)) return sortDir==='asc'?an-bn:bn-an;
      if (sortKey === 'tier') { const ao=TIER_ORDER[av]??99, bo=TIER_ORDER[bv]??99; return sortDir==='asc'?ao-bo:bo-ao; }
      return sortDir==='asc'?String(av).localeCompare(String(bv)):String(bv).localeCompare(String(av));
    });
    return list;
  }, [teams, sortKey, sortDir, filter]);

  const targets = teams.filter(t => t.allianceTarget);
  const tiered  = { OPTIMAL: teams.filter(t=>t.tier==='OPTIMAL'), MID: teams.filter(t=>t.tier==='MID'), BAD: teams.filter(t=>t.tier==='BAD') };
  const ftcDone = teams.filter(t => t.fetchStatus==='ok').length;
  const teamNums = teams.map(t=>t.teamNumber).join(', ');

  return (
    <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>

      {/* Toolbar */}
      <div style={{ padding:'8px 14px', borderBottom:'1px solid #1e1e1e', flexShrink:0,
        display:'flex', gap:7, alignItems:'center', flexWrap:'wrap', background:'#0a0a0a' }}>
        <button className="btn btn-primary" onClick={analyze} disabled={analyzing||!teams.length}>
          {analyzing ? <><div className="spinner"/> Analyzing…</> : <><Zap size={13}/> AI Analyze All</>}
        </button>
        <button className="btn btn-ghost" onClick={fetchAllFTC} disabled={fetching||!teams.length}>
          {fetching ? <><div className="spinner" style={{width:12,height:12}}/> Fetching…</> : <><RefreshCw size={13}/> FTCScout</>}
        </button>
        <button className="btn btn-ghost" onClick={exportCSV} disabled={!teams.length}>
          <Download size={13}/> CSV
        </button>
        {teams.length > 0 && <CopyBtn text={teamNums} label="All #s" />}
        {targets.length > 0 && <CopyBtn text={targets.map(t=>`#${t.teamNumber} ${t.teamName}`).join(', ')} label="Targets" />}

        {/* Filter chips */}
        <div style={{ display:'flex', gap:4, marginLeft:4 }}>
          {[
            ['all',     `All (${teams.length})`,              '#a3a3a3'],
            ['targets', `Targets (${targets.length})`,      '#f97316'],
            ['optimal', `OPTIMAL (${tiered.OPTIMAL.length})`, '#22c55e'],
            ['mid',     `MID (${tiered.MID.length})`,         '#eab308'],
            ['bad',     `BAD (${tiered.BAD.length})`,         '#ef4444'],
          ].map(([key, label, color]) => (
            <button key={key} onClick={() => setFilter(key)} style={{
              padding:'3px 9px', borderRadius:20, fontSize:10, fontWeight:700,
              border:`1px solid ${filter===key ? color : '#2a2a2a'}`,
              background: filter===key ? `${color}22` : 'transparent',
              color: filter===key ? color : '#525252',
              cursor:'pointer', transition:'all 0.15s', fontFamily:'var(--font-mono)',
            }}>{label}</button>
          ))}
        </div>

        <div style={{ marginLeft:'auto', fontSize:10, color:'#525252', fontFamily:'var(--font-mono)', textAlign:'right' }}>
          {ftcDone}/{teams.length} FTCScout · click cell to edit · <span style={{color:'#f97316'}}>AI</span>
        </div>
      </div>

      {/* Alliance targets bar */}
      {targets.length > 0 && (
        <div style={{ padding:'7px 14px', background:'rgba(249,115,22,0.07)', borderBottom:'1px solid rgba(249,115,22,0.2)', flexShrink:0, display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <span style={{ fontSize:10, fontWeight:700, color:'#f97316', textTransform:'uppercase', letterSpacing:'0.05em' }}>Alliance Targets:</span>
          {targets.map(t => (
            <span key={t.teamNumber} style={{ fontSize:11, background:'rgba(249,115,22,0.15)', border:'1px solid rgba(249,115,22,0.3)', padding:'1px 10px', borderRadius:12, color: t.tier ? TIER_COLOR[t.tier] : '#f97316' }}>
              #{t.teamNumber} {t.teamName}{t.tier && <span style={{ marginLeft:5, fontSize:9 }}>({t.tier})</span>}
            </span>
          ))}
        </div>
      )}

      {!teams.length ? (
        <div className="empty">
          <h3>No Teams</h3>
          <p>Go to the Scan tab to add teams,<br/>or Form tab to import from Google Sheets.</p>
        </div>
      ) : (
        <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
          <DataTable teams={sorted} onUpdateTeam={updateTeam} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
        </div>
      )}
    </div>
  );
}
