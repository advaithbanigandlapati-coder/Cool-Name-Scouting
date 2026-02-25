import { useState } from 'react';
import { Swords, Shield, Users, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { TIER_COLOR, TIER_BG } from '../constants.js';

export default function AllianceTab({ teams }) {
  const [expanded, setExpanded] = useState(null);
  const [search,   setSearch]   = useState('');

  const analyzed = teams.filter(t => t.withTips?.length || t.againstTips?.length || t.notes);

  const filtered = analyzed.filter(t =>
    !search || t.teamName?.toLowerCase().includes(search.toLowerCase()) ||
    t.teamNumber?.includes(search)
  );

  const targets  = filtered.filter(t => t.allianceTarget);
  const optimal  = filtered.filter(t => t.tier === 'OPTIMAL' && !t.allianceTarget);
  const mid      = filtered.filter(t => t.tier === 'MID'     && !t.allianceTarget);
  const bad      = filtered.filter(t => t.tier === 'BAD'     && !t.allianceTarget);
  const unranked = filtered.filter(t => !t.tier             && !t.allianceTarget);

  function TeamCard({ team }) {
    const open = expanded === team.teamNumber;
    const hasTips = team.withTips?.length || team.againstTips?.length;

    return (
      <div style={{
        border: `1px solid ${team.allianceTarget ? 'rgba(249,115,22,0.4)' : '#1a1a1a'}`,
        borderRadius: 8,
        background: team.allianceTarget ? 'rgba(249,115,22,0.04)' : '#0f0f0f',
        overflow: 'hidden',
        transition: 'border-color 0.15s',
      }}>
        {/* Card header */}
        <button onClick={() => setExpanded(open ? null : team.teamNumber)}
          style={{
            width: '100%', background: 'none', border: 'none',
            cursor: hasTips ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px', color: 'var(--text)', textAlign: 'left',
          }}>
          {/* Team identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            {team.allianceTarget && (
              <span style={{ color: '#f97316', fontSize: 16, flexShrink: 0 }}>★</span>
            )}
            <span style={{
              fontFamily: 'var(--font-mono)', color: '#f97316',
              fontWeight: 700, fontSize: 14, flexShrink: 0,
            }}>
              #{team.teamNumber}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{team.teamName}</span>
            {team.rs === 'Yes' && (
              <span style={{
                fontSize: 10, background: '#14532d', color: '#22c55e',
                padding: '1px 6px', borderRadius: 3, fontWeight: 700, flexShrink: 0,
              }}>RS</span>
            )}
          </div>

          {/* Stats strip */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
            {team.matchPoints && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{team.matchPoints}</div>
                <div style={{ fontSize: 9, color: '#3a3a3a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Match Pts</div>
              </div>
            )}
            {team.wlt && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{team.wlt}</div>
                <div style={{ fontSize: 9, color: '#3a3a3a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>W-L-T</div>
              </div>
            )}
            {team.opr && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{team.opr}</div>
                <div style={{ fontSize: 9, color: '#3a3a3a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OPR</div>
              </div>
            )}
          </div>

          {/* Tier badge */}
          {team.tier && (
            <span style={{
              background: TIER_BG[team.tier],
              color: TIER_COLOR[team.tier],
              border: `1px solid ${TIER_COLOR[team.tier]}`,
              padding: '2px 10px', borderRadius: 4,
              fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)',
              flexShrink: 0,
            }}>
              {team.tier}{team.compatScore ? ` ${team.compatScore}%` : ''}
            </span>
          )}

          {hasTips && (
            <div style={{ color: '#3a3a3a', flexShrink: 0 }}>
              {open ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
            </div>
          )}
        </button>

        {/* AI notes summary */}
        {team.notes && !open && (
          <div style={{
            padding: '0 16px 12px',
            fontSize: 12, color: '#525252', lineHeight: 1.6,
          }}>
            {team.notes}
          </div>
        )}

        {/* Expanded tip content */}
        {open && (
          <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Why alliance */}
            {team.whyAlliance && (
              <div style={{
                fontSize: 12, color: '#a3a3a3', lineHeight: 1.7,
                borderLeft: '3px solid #f97316', paddingLeft: 12,
                background: 'rgba(249,115,22,0.04)', padding: '10px 12px',
                borderRadius: '0 6px 6px 0',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#f97316',
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Alliance Analysis
                </div>
                {team.whyAlliance}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* With them */}
              <div style={{
                background: '#0a1a0f', border: '1px solid #14532d',
                borderRadius: 8, padding: '12px 14px',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 11, fontWeight: 700, color: '#22c55e',
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10,
                }}>
                  <Users size={13}/> Allied With Them
                </div>
                {(team.withTips || []).map((tip, i) => (
                  <div key={i} style={{
                    fontSize: 12, color: '#a3a3a3', lineHeight: 1.6,
                    paddingLeft: 10, borderLeft: '2px solid #166534',
                    marginBottom: i < team.withTips.length - 1 ? 8 : 0,
                  }}>
                    {tip}
                  </div>
                ))}
              </div>

              {/* Against them */}
              <div style={{
                background: '#1a0a0a', border: '1px solid #7f1d1d',
                borderRadius: 8, padding: '12px 14px',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 11, fontWeight: 700, color: '#ef4444',
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10,
                }}>
                  <Swords size={13}/> Against Them
                </div>
                {(team.againstTips || []).map((tip, i) => (
                  <div key={i} style={{
                    fontSize: 12, color: '#a3a3a3', lineHeight: 1.6,
                    paddingLeft: 10, borderLeft: '2px solid #7f1d1d',
                    marginBottom: i < team.againstTips.length - 1 ? 8 : 0,
                  }}>
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function Section({ label, color, icon: Icon, teams: list }) {
    if (!list.length) return null;
    return (
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${color}33`,
        }}>
          <Icon size={14} color={color}/>
          <span style={{ fontSize: 12, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {label}
          </span>
          <span style={{ fontSize: 11, color: '#3a3a3a', fontFamily: 'var(--font-mono)' }}>({list.length})</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {list.map(t => <TeamCard key={t.teamNumber} team={t}/>)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* Toolbar */}
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid #1e1e1e',
        flexShrink: 0, display: 'flex', gap: 10, alignItems: 'center',
        background: '#0a0a0a',
      }}>
        <Shield size={15} color="#f97316"/>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#a3a3a3' }}>Strategy Tips</span>
        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#3a3a3a' }}/>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search teams…"
            style={{ paddingLeft: 30, width: 200, fontSize: 12, height: 32 }}
          />
        </div>
        <span style={{ fontSize: 11, color: '#3a3a3a', fontFamily: 'var(--font-mono)' }}>
          {analyzed.length} analyzed
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 32px' }}>
        {!analyzed.length ? (
          <div className="empty">
            <Shield size={32} color="#2a2a2a"/>
            <h3>No Strategy Tips Yet</h3>
            <p>Go to the Data tab and hit<br/><b style={{color:'#f97316'}}>AI Analyze All</b> to generate tips.</p>
          </div>
        ) : (
          <>
            <Section label="★ Alliance Targets" color="#f97316" icon={Users}   teams={targets} />
            <Section label="Optimal"            color="#22c55e" icon={Users}   teams={optimal} />
            <Section label="Mid"                color="#eab308" icon={Shield}  teams={mid}     />
            <Section label="Bad"                color="#ef4444" icon={Swords}  teams={bad}     />
            <Section label="Unranked"           color="#525252" icon={Shield}  teams={unranked}/>
          </>
        )}
      </div>
    </div>
  );
}
