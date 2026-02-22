import { useState } from 'react';
import { Zap, Trophy } from 'lucide-react';
import AllianceCard from '../components/AllianceCard.jsx';
import { runAllianceAnalysis } from '../api/claude.js';
import { TIER_ORDER } from '../constants.js';

export default function AllianceTab({ teams, analysis, setAnalysis, settings, mine, setToast }) {
  const [loading, setLoading] = useState(false);

  async function analyze() {
    if (teams.length === 0) {
      setToast({ msg: 'Import teams first (Teams tab).', type: 'warn' });
      return;
    }
    setLoading(true);
    try {
      setToast({ msg: 'Claude is analyzing — this takes ~20s…', type: 'ok' });
      const results = await runAllianceAnalysis(teams, mine);
      const sorted  = [...results].sort((a, b) =>
        (TIER_ORDER[a.tier] ?? 99) - (TIER_ORDER[b.tier] ?? 99) ||
        b.compatScore - a.compatScore
      );
      setAnalysis(sorted);
      await window.api.analysis.save(sorted);
      setToast({ msg: `✓ Analysis done — ${results.length} teams ranked.`, type: 'ok' });
    } catch (err) {
      setToast({ msg: `Analysis failed: ${err.message}`, type: 'err' });
    } finally {
      setLoading(false);
    }
  }

  const grouped = {
    OPTIMAL: analysis?.filter(r => r.tier === 'OPTIMAL') ?? [],
    MID:     analysis?.filter(r => r.tier === 'MID')     ?? [],
    BAD:     analysis?.filter(r => r.tier === 'BAD')     ?? [],
  };

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #1e1e1e',
        display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        <button className="btn btn-primary" onClick={analyze} disabled={loading}>
          {loading
            ? <><div className="spinner" /> Analyzing…</>
            : <><Zap size={14} /> {analysis ? 'Re-Analyze' : 'Analyze Alliances'}</>}
        </button>
        {analysis && (
          <span style={{ fontSize: 12, color: '#525252', fontFamily: 'var(--font-mono)' }}>
            {grouped.OPTIMAL.length} optimal · {grouped.MID.length} mid · {grouped.BAD.length} bad
          </span>
        )}
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {!analysis ? (
          <div className="empty">
            <Trophy size={40} />
            <h3>No Analysis Yet</h3>
            <p>Import teams, then hit Analyze Alliances.<br/>Claude will rank every team vs. your robot.</p>
          </div>
        ) : (
          ['OPTIMAL', 'MID', 'BAD'].map(tier => (
            grouped[tier].length > 0 && (
              <div key={tier} style={{ marginBottom: 28 }}>
                <div style={{
                  fontFamily: 'var(--font-head)', fontSize: 18, letterSpacing: '0.05em',
                  color: { OPTIMAL: '#22c55e', MID: '#eab308', BAD: '#ef4444' }[tier],
                  marginBottom: 10,
                }}>
                  {tier} · {grouped[tier].length} team{grouped[tier].length !== 1 ? 's' : ''}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {grouped[tier].map(r => <AllianceCard key={r.teamNumber} result={r} />)}
                </div>
              </div>
            )
          ))
        )}
      </div>
    </div>
  );
}
