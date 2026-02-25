import { useState, useCallback } from 'react';
import { AlertTriangle, Star, ChevronUp, ChevronDown } from 'lucide-react';
import { TABLE_COLS, TIER_COLOR, TIER_BG } from '../constants.js';
import { fmt } from '../helpers.js';

// ── Inline cell editor ────────────────────────────────────────────────────────
function EditCell({ value, onSave, isAI, hasHumanEdit, type }) {
  const [editing, setEditing] = useState(false);
  const [val,     setVal]     = useState(value);
  const [reason,  setReason]  = useState('');

  function commit() {
    if (isAI && !reason.trim()) return;
    onSave(val, reason);
    setEditing(false); setReason('');
  }

  if (editing) return (
    <div style={{ display:'flex', flexDirection:'column', gap:3, minWidth:150, padding:'2px 0' }}>
      <input autoFocus value={val} onChange={e => setVal(e.target.value)}
        style={{ padding:'3px 6px', fontSize:12 }}
        onKeyDown={e => { if(e.key==='Enter' && !isAI) commit(); if(e.key==='Escape') setEditing(false); }} />
      {isAI && (
        <input placeholder="Why is this wrong? (required)" value={reason} onChange={e=>setReason(e.target.value)}
          style={{ padding:'3px 6px', fontSize:11, borderColor: reason?undefined:'#ef4444' }}
          onKeyDown={e => e.key==='Enter' && commit()} />
      )}
      <div style={{ display:'flex', gap:3 }}>
        <button onClick={commit} className="btn btn-primary" style={{ padding:'1px 8px', fontSize:11 }}>✓</button>
        <button onClick={()=>{setEditing(false);setVal(value);}} className="btn btn-ghost" style={{ padding:'1px 6px', fontSize:11 }}>✗</button>
      </div>
    </div>
  );

  const display = (value === '' || value === null || value === undefined) ? null : String(value);

  return (
    <div onClick={()=>{setVal(value);setEditing(true);}} style={{
      cursor:'pointer', padding:'2px 4px', borderRadius:3,
      borderBottom: hasHumanEdit ? '1px dashed #eab308' : '1px dashed transparent',
      display:'flex', alignItems:'center', gap:3, minHeight:20,
      transition:'background 0.1s',
    }}
    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.04)'}
    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
      <span style={{ fontSize:12, color: hasHumanEdit?'#eab308': display?'inherit':'#3a3a3a' }}>
        {display || '—'}
      </span>
      {hasHumanEdit && <AlertTriangle size={9} color="#eab308" />}
    </div>
  );
}

// ── Group header colours ──────────────────────────────────────────────────────
const GROUP_COLOR = { doc:'#a3a3a3', ftc:'#60a5fa', form:'#a78bfa', ai:'#f97316', meta:'#525252' };
const GROUP_LABEL = { doc:'Doc', ftc:'FTCScout', form:'Scouted', ai:'AI', meta:'' };

// ── Main table ────────────────────────────────────────────────────────────────
export default function DataTable({ teams, onUpdateTeam, sortKey, sortDir, onSort }) {
  function update(teamNumber, field, value, reason, isAI) {
    onUpdateTeam(teamNumber, prev => {
      const humanEdits = { ...(prev.humanEdits||{}) };
      if (isAI) humanEdits[field] = { value, reason, timestamp: Date.now() };
      return { ...prev, [field]: value, humanEdits };
    });
  }

  function toggleTarget(teamNumber) {
    onUpdateTeam(teamNumber, prev => ({ ...prev, allianceTarget: !prev.allianceTarget }));
  }

  const SortIcon = ({ col }) => {
    if (sortKey !== col.key) return <ChevronUp size={10} style={{ opacity:0.2 }} />;
    return sortDir === 'asc' ? <ChevronUp size={10} style={{ color:'#f97316' }} /> : <ChevronDown size={10} style={{ color:'#f97316' }} />;
  };

  if (!teams?.length) return null;

  // Group headers
  const groups = [];
  let lastGroup = null, groupStart = 0;
  TABLE_COLS.forEach((col, i) => {
    if (col.group !== lastGroup) {
      if (lastGroup !== null) groups.push({ group: lastGroup, count: i - groupStart, start: groupStart });
      lastGroup = col.group; groupStart = i;
    }
  });
  groups.push({ group: lastGroup, count: TABLE_COLS.length - groupStart, start: groupStart });

  return (
    <div style={{ overflowX:'auto', overflowY:'auto', flex:1, position:'relative' }}>
      <table style={{ borderCollapse:'collapse', tableLayout:'fixed', fontSize:12, whiteSpace:'nowrap' }}>
        {/* Group header row */}
        <thead>
          <tr style={{ background:'#080808' }}>
            {/* Sticky team# + name */}
            <th style={{ ...stickyTH(0), width:72, textAlign:'left', fontSize:10, color:'#525252', textTransform:'uppercase', letterSpacing:'0.05em' }} colSpan={1}>Team</th>
            <th style={{ ...stickyTH(72), width:160, textAlign:'left', fontSize:10, color:'#525252', textTransform:'uppercase', letterSpacing:'0.05em' }} colSpan={1} />
            {groups.map(({group, count}) => (
              <th key={group} colSpan={count} style={{
                padding:'5px 10px', textAlign:'center', fontSize:10, fontWeight:700,
                textTransform:'uppercase', letterSpacing:'0.06em',
                color: GROUP_COLOR[group], borderBottom:'1px solid #1e1e1e',
                borderLeft:'1px solid #1e1e1e',
              }}>
                {GROUP_LABEL[group]}
              </th>
            ))}
          </tr>
          {/* Column header row */}
          <tr style={{ background:'#0a0a0a', position:'sticky', top:28, zIndex:3 }}>
            <th style={{ ...stickyTH(0), width:72, ...colTH }}>
              <span style={{ fontFamily:'var(--font-mono)', color:'#f97316' }}>#</span>
            </th>
            <th style={{ ...stickyTH(72), width:160, ...colTH }}>Team Name</th>
            {TABLE_COLS.map(col => (
              <th key={col.key} style={{ ...colTH, width:col.width, cursor:'pointer',
                color: col.ai ? '#f97316' : GROUP_COLOR[col.group] || '#a3a3a3',
                borderLeft: col.group !== TABLE_COLS[TABLE_COLS.indexOf(col)-1]?.group ? '1px solid #1e1e1e' : undefined,
              }} onClick={() => onSort(col.key)}>
                <div style={{ display:'flex', alignItems:'center', gap:3, justifyContent:'center' }}>
                  {col.ai && <span style={{ fontSize:9, opacity:0.7 }}>✦</span>}
                  {col.label}
                  <SortIcon col={col} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {teams.map((team, i) => {
            const isTarget = team.allianceTarget;
            const rowBg = isTarget ? 'rgba(249,115,22,0.06)' : i%2===0 ? '#0c0c0c' : '#0f0f0f';
            return (
              <tr key={team.teamNumber} style={{ background: rowBg,
                outline: isTarget ? '1px solid rgba(249,115,22,0.3)' : undefined }}>
                {/* Team number — sticky */}
                <td style={{ ...stickyTD(0, rowBg), width:72 }}>
                  <span style={{ fontFamily:'var(--font-mono)', color:'#f97316', fontWeight:700, fontSize:13 }}>
                    #{team.teamNumber}
                  </span>
                </td>
                {/* Team name — sticky */}
                <td style={{ ...stickyTD(72, rowBg), width:160 }}>
                  <EditCell value={team.teamName} isAI={false} hasHumanEdit={false}
                    onSave={(v,r) => update(team.teamNumber, 'teamName', v, r, false)} />
                </td>
                {/* Data columns */}
                {TABLE_COLS.map(col => {
                  const hasHumanEdit = !!team.humanEdits?.[col.key];
                  const val = team[col.key];
                  const groupBorder = col.group !== TABLE_COLS[TABLE_COLS.indexOf(col)-1]?.group
                    ? '1px solid #1a1a1a' : undefined;

                  // Alliance target star
                  if (col.type === 'star') return (
                    <td key={col.key} style={{ ...dataTD, width:col.width, textAlign:'center', borderLeft:groupBorder }}>
                      <button onClick={() => toggleTarget(team.teamNumber)} style={{
                        background:'none', border:'none', cursor:'pointer',
                        color: isTarget ? '#f97316' : '#2a2a2a',
                        fontSize:16, lineHeight:1, transition:'color 0.15s',
                        padding:'0 4px',
                      }} title={isTarget ? 'Remove alliance target' : 'Mark as alliance target'}>
                        ★
                      </button>
                    </td>
                  );

                  // Tier badge
                  if (col.type === 'tier') return (
                    <td key={col.key} style={{ ...dataTD, width:col.width, textAlign:'center', borderLeft:groupBorder }}>
                      {val ? (
                        <div style={{ display:'flex', alignItems:'center', gap:4, justifyContent:'center' }}>
                          <span style={{
                            background: TIER_BG[val] || '#1e1e1e',
                            color: TIER_COLOR[val] || '#a3a3a3',
                            border: `1px solid ${TIER_COLOR[val] || '#2a2a2a'}`,
                            padding:'1px 7px', borderRadius:4,
                            fontSize:11, fontWeight:700, fontFamily:'var(--font-mono)',
                            cursor:'pointer',
                          }} onClick={() => {setVal = val; }}>
                            {val}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color:'#2a2a2a', fontSize:11 }}>—</span>
                      )}
                    </td>
                  );

                  // RS badge
                  if (col.key === 'rs') return (
                    <td key={col.key} style={{ ...dataTD, width:col.width, textAlign:'center', borderLeft:groupBorder }}>
                      {val ? (
                        <span style={{
                          background: val==='Yes' ? '#14532d' : '#1a1a1a',
                          color: val==='Yes' ? '#22c55e' : '#525252',
                          padding:'1px 6px', borderRadius:3, fontSize:11, fontWeight:700,
                        }}>{val}</span>
                      ) : <span style={{ color:'#2a2a2a' }}>—</span>}
                    </td>
                  );

                  // FTCScout status indicator
                  if (col.key === 'opr' || col.key === 'epa') return (
                    <td key={col.key} style={{ ...dataTD, width:col.width, textAlign:'right', borderLeft:groupBorder }}>
                      <EditCell value={String(val??'')} isAI={false} hasHumanEdit={hasHumanEdit}
                        onSave={(v,r) => update(team.teamNumber, col.key, v, r, false)} />
                    </td>
                  );

                  // Default editable cell
                  return (
                    <td key={col.key} style={{ ...dataTD, width:col.width,
                      textAlign: col.type==='num' ? 'right' : 'left',
                      borderLeft:groupBorder,
                      maxWidth: col.width,
                      overflow:'hidden',
                    }}>
                      <EditCell
                        value={String(val ?? '')}
                        isAI={!!col.ai}
                        hasHumanEdit={hasHumanEdit}
                        onSave={(v,r) => update(team.teamNumber, col.key, v, r, !!col.ai)}
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const stickyTH = (left) => ({
  position:'sticky', left, zIndex:4,
  background:'#080808',
  padding:'6px 10px',
  borderBottom:'1px solid #1e1e1e',
  borderRight:'1px solid #1e1e1e',
  whiteSpace:'nowrap',
});

const stickyTD = (left, bg) => ({
  position:'sticky', left,
  background: bg,
  padding:'3px 10px',
  borderBottom:'1px solid #111',
  borderRight:'1px solid #1a1a1a',
  zIndex:1,
  verticalAlign:'middle',
});

const colTH = {
  padding:'6px 8px', textAlign:'center',
  fontSize:11, fontWeight:700, textTransform:'uppercase',
  letterSpacing:'0.04em', borderBottom:'1px solid #1e1e1e',
  verticalAlign:'middle', whiteSpace:'nowrap',
};

const dataTD = {
  padding:'2px 8px',
  borderBottom:'1px solid #111',
  verticalAlign:'middle',
  overflow:'hidden',
  textOverflow:'ellipsis',
};
