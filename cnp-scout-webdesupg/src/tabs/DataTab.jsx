import { useState } from 'react';
import { RefreshCw, Zap } from 'lucide-react';
import DataTable from '../components/DataTable.jsx';
import { runAnalysis } from '../api/claude.js';
import { fetchTeamStats } from '../api/ftcscout.js';
import { TIER_ORDER } from '../constants.js';

export default function DataTab({ teams, setTeams, mine, settings, setToast }) {
  const [analyzing, setAnalyzing]   = useState(false);

  function updateTeam(teamNumber, updater) {
    setTeams(prev => prev.map(t => t.teamNumber === teamNumber ? updater(t) : t));
  }

  async function fetchAllFTC() {
    setToast({ msg: 'Fetching FTCScout data for all teams…', type: 'ok' });
    for (const team of teams) {
      try {
        const stats = await fetchTeamStats(team.teamNumber);
        if (stats) {
          setTeams(prev => prev.map(t => t.teamNumber === team.teamNumber ? {
            ...t,
            opr: stats.opr != null ? String(stats.opr.toFixed(2)) : t.opr,
            epa: stats.epa != null ? String(stats.epa.toFixed(2)) : t.epa,
            teamName: t.teamName || stats.teamName || t.teamName,
            fetchStatus: 'ok',
          } : t));
        }
      } catch {}
    }
    setToast({ msg: '✓ FTCScout data updated.', type: 'ok' });
  }

  async function analyze() {
    if (teams.length === 0) { setToast({ msg: 'No teams to analyze.', type: 'warn' }); return; }
    setAnalyzing(true);
    const total = teams.filter(t => t.teamNumber !== String(30439)).length;
    setToast({ msg: `Analyzing batch 1/${Math.ceil(total/8)}…`, type: 'ok' });
    try {
      const results = await runAnalysis(
        teams.filter(t => t.teamNumber !== String(30439)),
        mine,
        (done, all) => {
          const batch = Math.floor(done/8) + 1;
          const batches = Math.ceil(all/8);
          setToast({ msg: `Analyzing batch ${batch}/${batches}… (${done}/${all} teams done)`, type: 'ok' });
        }
      );
      setTeams(prev => prev.map(t => {
        const r = results.find(r => String(r.teamNumber) === String(t.teamNumber));
        if (!r) return t;
        // Only update AI fields that haven't been human-edited
        const updates = {};
        const humanEdits = t.humanEdits || {};
        for (const field of ['notes','complementary','tier','compatScore','withTips','againstTips','whyAlliance']) {
          if (!humanEdits[field]) updates[field] = r[field] ?? t[field];
        }
        return { ...t, ...updates };
      }));
      setToast({ msg: '✓ Analysis complete.', type: 'ok' });
    } catch (err) {
      setToast({ msg: `Analysis failed: ${err.message}`, type: 'err' });
    } finally {
      setAnalyzing(false);
    }
  }

  const sorted = [...teams].sort((a, b) =>
    (parseInt(a.stateRank) || 999) - (parseInt(b.stateRank) || 999)
  );

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #1e1e1e',
        display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={analyze} disabled={analyzing || teams.length === 0}>
          {analyzing ? <><div className="spinner" /> Analyzing…</> : <><Zap size={14} /> AI Analyze All</>}
        </button>
        <button className="btn btn-ghost" onClick={fetchAllFTC} disabled={teams.length === 0}>
          <RefreshCw size={14} /> Refresh FTCScout
        </button>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#525252', fontFamily: 'var(--font-mono)' }}>
          {teams.length} teams · click any cell to edit · <span style={{ color: '#f97316' }}>✦ = AI field</span> · <span style={{ color: '#eab308' }}>underline = human corrected</span>
        </span>
      </div>

      {teams.length === 0 ? (
        <div className="empty">
          <h3>No Data Yet</h3>
          <p>Use the Scan tab to import teams.</p>
        </div>
      ) : (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <DataTable teams={sorted} onUpdateTeam={updateTeam} />
        </div>
      )}
    </div>
  );
}
