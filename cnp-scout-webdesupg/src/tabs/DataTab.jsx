import { useState, useMemo } from 'react';
import { RefreshCw, Zap, Download } from 'lucide-react';
import DataTable from '../components/DataTable.jsx';
import { runAnalysis } from '../api/claude.js';
import { fetchTeamStats } from '../api/ftcscout.js';
import { TIER_ORDER, TIER_COLOR } from '../constants.js';

export default function DataTab({ teams, setTeams, mine, settings, setToast, archiveCurrent }) {
  const [analyzing,  setAnalyzing]  = useState(false);
  const [fetching,   setFetching]   = useState(false);
  const [expanded,   setExpanded]   = useState(null);
  const [sortKey,    setSortKey]    = useState('stateRank');
  const [sortDir,    setSortDir]    = useState('asc');
  const [filter,     setFilter]     = useState('all'); // all | targets | optimal | mid | bad

  function updateTeam(teamNumber, updater) {
    setTeams(prev => prev.map(t => t.teamNumber === teamNumber ? updater(t) : t));
  }

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  async function fetchAllFTC() {
    setFetching(true);
    setToast({ msg: `Fetching FTCScout data for ${teams.length} teams…`, type: 'ok' });
    let updated = 0;
    for (const team of teams) {
      try {
        const stats = await fetchTeamStats(team.teamNumber);
        if (stats) {
          updateTeam(team.teamNumber, prev => ({
            ...prev,
            opr:      stats.opr      || prev.opr,
            epa:      stats.epa      || prev.epa,
            teamName: prev.teamName  || stats.teamName || prev.teamName,
            fetchStatus: 'ok',
          }));
          updated++;
        }
      } catch { /* skip */ }
      await new Promise(r => setTimeout(r, 120)); // avoid rate limiting
    }
    setFetching(false);
    setToast({ msg: `✓ FTCScout: updated ${updated}/${teams.length} teams.`, type: 'ok' });
  }

  async function analyze() {
    if (!teams.length) { setToast({ msg: 'No teams loaded.', type: 'warn' }); return; }
    archiveCurrent();
    setAnalyzing(true);
    setToast({ msg: `Claude analyzing ${teams.length} teams — ~30–60s…`, type: 'ok' });
    try {
      const results = await runAnalysis(teams, mine);
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
      setToast({ msg: `✓ Analysis complete — ${results.length} teams ranked.`, type: 'ok' });
    } catch (err) {
      setToast({ msg: `Analysis failed: ${err.message}`, type: 'err' });
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

  // Sort
  const sorted = useMemo(() => {
    let list = [...teams];
    // Apply filter
    if (filter === 'targets') list = list.filter(t => t.allianceTarget);
    else if (filter === 'optimal') list = list.filter(t => t.tier === 'OPTIMAL');
    else if (filter === 'mid')     list = list.filter(t => t.tier === 'MID');
    else if (filter === 'bad')     list = list.filter(t => t.tier === 'BAD');

    list.sort((a, b) => {
      let av = a[sortKey] ?? '', bv = b[sortKey] ?? '';
      // numeric sort
      const an = parseFloat(av), bn = parseFloat(bv);
      if (!isNaN(an) && !isNaN(bn)) return sortDir==='asc' ? an-bn : bn-an;
      // tier sort
      if (sortKey === 'tier') {
        const ao = TIER_ORDER[av]??99, bo = TIER_ORDER[bv]??99;
        return sortDir==='asc' ? ao-bo : bo-ao;
      }
      // string
      return sortDir==='asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return list;
  }, [teams, sortKey, sortDir, filter]);

  const targets   = teams.filter(t => t.allianceTarget);
  const tiered    = { OPTIMAL: teams.filter(t=>t.tier==='OPTIMAL'), MID: teams.filter(t=>t.tier==='MID'), BAD: teams.filter(t=>t.tier==='BAD') };
  const ftcDone   = teams.filter(t => t.fetchStatus === 'ok').length;

  return (
    <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>

      {/* ── Toolbar ── */}
      <div style={{ padding:'10px 16px', borderBottom:'1px solid #1e1e1e', flexShrink:0,
        display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', background:'#0a0a0a' }}>

        <button className="btn btn-primary" onClick={analyze} disabled={analyzing||!teams.length}>
          {analyzing ? <><div className="spinner" /> Analyzing…</> : <><Zap size={14} /> AI Analyze All</>}
        </button>

        <button className="btn btn-ghost" onClick={fetchAllFTC} disabled={fetching||!teams.length}>
          {fetching ? <><div className="spinner" style={{width:12,height:12}} /> Fetching…</> : <><RefreshCw size={14} /> FTCScout</>}
        </button>

        <button className="btn btn-ghost" onClick={exportCSV} disabled={!teams.length}>
          <Download size={14} /> CSV
        </button>

        {/* Filter chips */}
        <div style={{ display:'flex', gap:4, marginLeft:8 }}>
          {[
            ['all',     `All (${teams.length})`,           '#a3a3a3'],
            ['targets', `★ Targets (${targets.length})`,   '#f97316'],
            ['optimal', `OPTIMAL (${tiered.OPTIMAL.length})`, '#22c55e'],
            ['mid',     `MID (${tiered.MID.length})`,      '#eab308'],
            ['bad',     `BAD (${tiered.BAD.length})`,      '#ef4444'],
          ].map(([key, label, color]) => (
            <button key={key} onClick={() => setFilter(key)} style={{
              padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:700,
              border:`1px solid ${filter===key ? color : '#2a2a2a'}`,
              background: filter===key ? `${color}22` : 'transparent',
              color: filter===key ? color : '#525252',
              cursor:'pointer', transition:'all 0.15s', fontFamily:'var(--font-mono)',
            }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ marginLeft:'auto', fontSize:11, color:'#525252', fontFamily:'var(--font-mono)', textAlign:'right' }}>
          {ftcDone}/{teams.length} FTCScout · click cell to edit · <span style={{color:'#f97316'}}>✦ AI</span> · <span style={{color:'#eab308'}}>underline = corrected</span>
        </div>
      </div>

      {/* ── Summary bar ── */}
      {targets.length > 0 && (
        <div style={{ padding:'8px 16px', background:'rgba(249,115,22,0.08)',
          borderBottom:'1px solid rgba(249,115,22,0.2)', flexShrink:0,
          display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
          <span style={{ fontSize:11, fontWeight:700, color:'#f97316', textTransform:'uppercase', letterSpacing:'0.05em' }}>
            ★ Alliance Targets:
          </span>
          {targets.map(t => (
            <span key={t.teamNumber} style={{
              fontSize:12, background:'rgba(249,115,22,0.15)',
              border:'1px solid rgba(249,115,22,0.3)',
              padding:'2px 10px', borderRadius:12,
              color: t.tier ? TIER_COLOR[t.tier] : '#f97316',
            }}>
              #{t.teamNumber} {t.teamName}
              {t.tier && <span style={{ marginLeft:6, fontSize:10 }}>({t.tier})</span>}
            </span>
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!teams.length ? (
        <div className="empty"><h3>No Data</h3><p>Use the Scan tab to import teams.</p></div>
      ) : (
        <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
          <DataTable teams={sorted} onUpdateTeam={updateTeam} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />


        </div>
      )}
    </div>
  );
}
