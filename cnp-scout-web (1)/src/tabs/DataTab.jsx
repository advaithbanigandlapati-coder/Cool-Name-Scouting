import { useState } from 'react';
import { RefreshCw, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import DataTable from '../components/DataTable.jsx';
import { runAnalysis } from '../api/claude.js';
import { fetchTeamStats } from '../api/ftcscout.js';
import { TIER_ORDER } from '../constants.js';

export default function DataTab({ teams, setTeams, mine, settings, setToast }) {
  const [analyzing, setAnalyzing]   = useState(false);
  const [expanded,  setExpanded]    = useState(null); // teamNumber for tip drawer

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
    setToast({ msg: 'Claude is analyzing all teams (~30s)…', type: 'ok' });
    try {
      const results = await runAnalysis(teams, mine);
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

          {/* Strategy tip drawers */}
          <div style={{ borderTop: '1px solid #1e1e1e', overflowY: 'auto', maxHeight: 300, padding: '0 16px' }}>
            <div style={{ padding: '8px 0', fontSize: 11, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Strategy Tips — click a team to expand
            </div>
            {sorted.filter(t => t.withTips?.length || t.againstTips?.length).map(team => (
              <div key={team.teamNumber} style={{ borderBottom: '1px solid #141414' }}>
                <button onClick={() => setExpanded(e => e === team.teamNumber ? null : team.teamNumber)}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', color: 'var(--text)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#f97316', fontSize: 13 }}>#{team.teamNumber}</span>
                  <span style={{ fontSize: 13 }}>{team.teamName}</span>
                  {expanded === team.teamNumber ? <ChevronUp size={14} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={14} style={{ marginLeft: 'auto' }} />}
                </button>
                {expanded === team.teamNumber && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', marginBottom: 6, textTransform: 'uppercase' }}>With Them</div>
                      {(team.withTips || []).map((tip, i) => (
                        <div key={i} style={{ fontSize: 12, color: '#a3a3a3', marginBottom: 5,
                          paddingLeft: 8, borderLeft: '2px solid #14532d', lineHeight: 1.5 }}>{tip}</div>
                      ))}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', marginBottom: 6, textTransform: 'uppercase' }}>Against Them</div>
                      {(team.againstTips || []).map((tip, i) => (
                        <div key={i} style={{ fontSize: 12, color: '#a3a3a3', marginBottom: 5,
                          paddingLeft: 8, borderLeft: '2px solid #7f1d1d', lineHeight: 1.5 }}>{tip}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
