import { ChevronDown, ChevronUp, Zap, Shield } from 'lucide-react';
import { useState } from 'react';
import { TIER_COLOR, TIER_BG } from '../constants.js';

export default function AllianceCard({ result }) {
  const [open, setOpen] = useState(false);
  const tc = TIER_COLOR[result.tier] || '#a3a3a3';
  const tb = TIER_BG[result.tier]   || '#1e1e1e';

  return (
    <div className="card" style={{ borderLeft: `3px solid ${tc}` }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--font-head)', fontSize: 22, color: '#f97316' }}>
          #{result.teamNumber}
        </span>
        <span className={`badge badge-${result.tier.toLowerCase()}`}>{result.tier}</span>
        <span style={{ fontSize: 12, color: '#a3a3a3', fontStyle: 'italic' }}>{result.role}</span>
        <span style={{
          marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 13,
          color: tc, background: tb, padding: '2px 8px', borderRadius: 4,
        }}>
          {result.compatScore}%
        </span>
      </div>

      <p style={{ fontSize: 13, color: '#d4d4d4', marginBottom: 10 }}>{result.summary}</p>

      {/* Alliance reason */}
      <p style={{ fontSize: 12, color: '#a3a3a3', marginBottom: 10, lineHeight: 1.6 }}>
        {result.whyAlliance}
      </p>

      {/* Tips toggle */}
      <button onClick={() => setOpen(o => !o)} className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 12 }}>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {open ? 'Hide tips' : 'Show strategy tips'}
      </button>

      {open && (
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6,
              fontSize: 11, fontWeight: 700, color: 'var(--grn)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Zap size={11} /> With Them
            </div>
            {result.withTips.map((tip, i) => (
              <div key={i} style={{ fontSize: 12, color: '#a3a3a3', marginBottom: 5, paddingLeft: 8,
                borderLeft: '2px solid #14532d', lineHeight: 1.5 }}>
                {tip}
              </div>
            ))}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6,
              fontSize: 11, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Shield size={11} /> Against Them
            </div>
            {result.againstTips.map((tip, i) => (
              <div key={i} style={{ fontSize: 12, color: '#a3a3a3', marginBottom: 5, paddingLeft: 8,
                borderLeft: '2px solid #7f1d1d', lineHeight: 1.5 }}>
                {tip}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
