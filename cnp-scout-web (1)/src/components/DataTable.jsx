import { useState } from 'react';
import { Edit2, Check, X, AlertTriangle } from 'lucide-react';
import { TABLE_COLS, TIER_COLOR, TIER_BG } from '../constants.js';

function EditCell({ value, onSave, isAI, hasHumanEdit }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(value);
  const [reason, setReason]   = useState('');

  function save() {
    if (isAI && !reason.trim()) return;
    onSave(val, reason);
    setEditing(false);
    setReason('');
  }

  if (editing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
        <input
          autoFocus value={val} onChange={e => setVal(e.target.value)}
          style={{ padding: '3px 6px', fontSize: 12 }}
          onKeyDown={e => e.key === 'Enter' && !isAI && save()}
        />
        {isAI && (
          <input
            placeholder="Why is this wrong? (required)"
            value={reason} onChange={e => setReason(e.target.value)}
            style={{ padding: '3px 6px', fontSize: 11, borderColor: reason ? '#2a2a2a' : '#ef4444' }}
            onKeyDown={e => e.key === 'Enter' && save()}
          />
        )}
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={save} className="btn btn-primary" style={{ padding: '2px 8px', fontSize: 11 }}>
            <Check size={10} /> Save
          </button>
          <button onClick={() => { setEditing(false); setVal(value); }} className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: 11 }}>
            <X size={10} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => { setVal(value); setEditing(true); }}
      style={{
        cursor: 'pointer', minHeight: 22, padding: '2px 4px',
        borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4,
        borderBottom: `1px dashed ${hasHumanEdit ? '#eab308' : 'transparent'}`,
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#1e1e1e'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <span style={{ fontSize: 12, color: hasHumanEdit ? '#eab308' : 'inherit' }}>
        {value || <span style={{ color: '#525252' }}>—</span>}
      </span>
      {hasHumanEdit && <AlertTriangle size={10} color="#eab308" title="Human corrected" />}
      <Edit2 size={9} color="#525252" style={{ marginLeft: 'auto', flexShrink: 0 }} />
    </div>
  );
}

export default function DataTable({ teams, onUpdateTeam }) {
  if (!teams || teams.length === 0) return null;

  function handleEdit(teamNumber, colKey, value, reason, isAI) {
    onUpdateTeam(teamNumber, prev => {
      const humanEdits = { ...(prev.humanEdits || {}) };
      if (isAI) {
        humanEdits[colKey] = { value, reason, timestamp: Date.now() };
      }
      return { ...prev, [colKey]: value, humanEdits };
    });
  }

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12, tableLayout: 'fixed' }}>
        <thead>
          <tr style={{ background: '#0f0f0f', position: 'sticky', top: 0, zIndex: 2 }}>
            <th style={{ ...th, width: 80, position: 'sticky', left: 0, background: '#0f0f0f', zIndex: 3 }}>#</th>
            <th style={{ ...th, width: 160, position: 'sticky', left: 80, background: '#0f0f0f', zIndex: 3 }}>Team Name</th>
            {TABLE_COLS.map(c => (
              <th key={c.key} style={{ ...th, width: c.width, color: c.ai ? '#f97316' : '#a3a3a3' }}>
                {c.label}{c.ai ? ' ✦' : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {teams.map((team, i) => (
            <tr key={team.teamNumber} style={{ background: i % 2 === 0 ? '#0d0d0d' : '#111' }}>
              {/* Team number — sticky */}
              <td style={{ ...td, position: 'sticky', left: 0, background: i % 2 === 0 ? '#0d0d0d' : '#111',
                fontFamily: 'var(--font-mono)', color: '#f97316', fontWeight: 700, zIndex: 1 }}>
                {team.teamNumber}
              </td>
              {/* Team name — sticky */}
              <td style={{ ...td, position: 'sticky', left: 80, background: i % 2 === 0 ? '#0d0d0d' : '#111', zIndex: 1 }}>
                <EditCell
                  value={team.teamName}
                  isAI={false}
                  hasHumanEdit={false}
                  onSave={(v, r) => handleEdit(team.teamNumber, 'teamName', v, r, false)}
                />
              </td>
              {/* All other columns */}
              {TABLE_COLS.map(col => {
                const hasHumanEdit = !!team.humanEdits?.[col.key];
                const val = col.key === 'tier'
                  ? team[col.key]
                  : String(team[col.key] ?? '');

                if (col.key === 'tier' && team.tier) {
                  return (
                    <td key={col.key} style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{
                          background: TIER_BG[team.tier] || '#1e1e1e',
                          color: TIER_COLOR[team.tier] || '#a3a3a3',
                          padding: '1px 6px', borderRadius: 4,
                          fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)',
                        }}>
                          {team.tier}
                        </span>
                        {team.compatScore && (
                          <span style={{ fontSize: 11, color: '#525252' }}>{team.compatScore}%</span>
                        )}
                      </div>
                    </td>
                  );
                }

                return (
                  <td key={col.key} style={{ ...td, maxWidth: col.width }}>
                    <EditCell
                      value={val}
                      isAI={col.ai}
                      hasHumanEdit={hasHumanEdit}
                      onSave={(v, r) => handleEdit(team.teamNumber, col.key, v, r, col.ai)}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th = {
  padding: '8px 10px', textAlign: 'left',
  color: '#a3a3a3', fontWeight: 700,
  fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em',
  borderBottom: '1px solid #1e1e1e', whiteSpace: 'nowrap',
};

const td = {
  padding: '4px 10px', borderBottom: '1px solid #141414',
  verticalAlign: 'middle', whiteSpace: 'nowrap',
};
