import { useState } from 'react';
import { Swords, Shield, Users, ChevronDown, ChevronUp, Search, Archive } from 'lucide-react';
import { TIER_COLOR, TIER_BG } from '../constants.js';

function TeamCard({ team }) {
  const [open, setOpen] = useState(false);
  const hasTips = team.withTips?.length || team.againstTips?.length;

  return (
    <div style={{
      border:`1px solid ${team.allianceTarget ? 'rgba(249,115,22,0.4)' : '#1a1a1a'}`,
      borderRadius:8, background: team.allianceTarget ? 'rgba(249,115,22,0.04)' : '#0f0f0f',
    }}>
      <button onClick={() => hasTips && setOpen(o=>!o)} style={{
        width:'100%', background:'none', border:'none', cursor: hasTips?'pointer':'default',
        display:'flex', alignItems:'center', gap:10, padding:'12px 16px',
        color:'var(--text)', textAlign:'left',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0 }}>
          {team.allianceTarget && <span style={{color:'#f97316',flexShrink:0}}>★</span>}
          <span style={{ fontFamily:'var(--font-mono)', color:'#f97316', fontWeight:700, fontSize:14, flexShrink:0 }}>
            #{team.teamNumber}
          </span>
          <span style={{ fontSize:14, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {team.teamName}
          </span>
          {team.rs === 'Yes' && (
            <span style={{ fontSize:10, background:'#14532d', color:'#22c55e',
              padding:'1px 6px', borderRadius:3, fontWeight:700, flexShrink:0 }}>RS</span>
          )}
        </div>
        <div style={{ display:'flex', gap:14, alignItems:'center', flexShrink:0 }}>
          {team.matchPoints && <div style={{textAlign:'center'}}>
            <div style={{fontSize:13,fontWeight:700,fontFamily:'var(--font-mono)'}}>{team.matchPoints}</div>
            <div style={{fontSize:9,color:'#3a3a3a',textTransform:'uppercase'}}>Pts</div>
          </div>}
          {team.wlt && <div style={{textAlign:'center'}}>
            <div style={{fontSize:12,fontWeight:700,fontFamily:'var(--font-mono)'}}>{team.wlt}</div>
            <div style={{fontSize:9,color:'#3a3a3a',textTransform:'uppercase'}}>W-L-T</div>
          </div>}
          {team.opr && <div style={{textAlign:'center'}}>
            <div style={{fontSize:13,fontWeight:700,fontFamily:'var(--font-mono)'}}>{team.opr}</div>
            <div style={{fontSize:9,color:'#3a3a3a',textTransform:'uppercase'}}>OPR</div>
          </div>}
        </div>
        {team.tier && (
          <span style={{
            background:TIER_BG[team.tier], color:TIER_COLOR[team.tier],
            border:`1px solid ${TIER_COLOR[team.tier]}`,
            padding:'2px 10px', borderRadius:4,
            fontSize:11, fontWeight:700, fontFamily:'var(--font-mono)', flexShrink:0,
          }}>
            {team.tier}{team.compatScore ? ` ${team.compatScore}%` : ''}
          </span>
        )}
        {hasTips && <div style={{color:'#3a3a3a',flexShrink:0}}>{open?<ChevronUp size={14}/>:<ChevronDown size={14}/>}</div>}
      </button>

      {team.notes && !open && (
        <div style={{padding:'0 16px 12px',fontSize:12,color:'#525252',lineHeight:1.6}}>{team.notes}</div>
      )}

      {open && (
        <div style={{padding:'0 16px 16px',display:'flex',flexDirection:'column',gap:12}}>
          {team.whyAlliance && (
            <div style={{fontSize:12,color:'#a3a3a3',lineHeight:1.7,
              borderLeft:'3px solid #f97316',
              background:'rgba(249,115,22,0.04)',padding:'10px 12px',borderRadius:'0 6px 6px 0'}}>
              <div style={{fontSize:10,fontWeight:700,color:'#f97316',
                textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>Alliance Analysis</div>
              {team.whyAlliance}
            </div>
          )}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div style={{background:'#0a1a0f',border:'1px solid #14532d',borderRadius:8,padding:'12px 14px'}}>
              <div style={{display:'flex',alignItems:'center',gap:6,fontSize:11,fontWeight:700,
                color:'#22c55e',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:10}}>
                <Users size={12}/> Allied With Them
              </div>
              {(team.withTips||[]).map((tip,i)=>(
                <div key={i} style={{fontSize:12,color:'#a3a3a3',lineHeight:1.6,
                  paddingLeft:10,borderLeft:'2px solid #166534',marginBottom:i<(team.withTips.length-1)?8:0}}>{tip}</div>
              ))}
            </div>
            <div style={{background:'#1a0a0a',border:'1px solid #7f1d1d',borderRadius:8,padding:'12px 14px'}}>
              <div style={{display:'flex',alignItems:'center',gap:6,fontSize:11,fontWeight:700,
                color:'#ef4444',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:10}}>
                <Swords size={12}/> Against Them
              </div>
              {(team.againstTips||[]).map((tip,i)=>(
                <div key={i} style={{fontSize:12,color:'#a3a3a3',lineHeight:1.6,
                  paddingLeft:10,borderLeft:'2px solid #7f1d1d',marginBottom:i<(team.againstTips.length-1)?8:0}}>{tip}</div>
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
    <div style={{marginBottom:24}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10,
        paddingBottom:8,borderBottom:`1px solid ${color}33`}}>
        <Icon size={13} color={color}/>
        <span style={{fontSize:12,fontWeight:700,color,textTransform:'uppercase',letterSpacing:'0.07em'}}>{label}</span>
        <span style={{fontSize:11,color:'#3a3a3a',fontFamily:'var(--font-mono)'}}>({list.length})</span>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {list.map(t=><TeamCard key={t.teamNumber} team={t}/>)}
      </div>
    </div>
  );
}

export default function AllianceTab({ teams, archive }) {
  const [search,      setSearch]      = useState('');
  const [showArchive, setShowArchive] = useState(false);
  const [archiveIdx,  setArchiveIdx]  = useState(0);

  // ── Archive view ──────────────────────────────────────────────────────────
  if (showArchive) {
    const snaps = archive || [];
    const snap  = snaps[archiveIdx];
    const snapTeams = snap?.teams || [];
    return (
      <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'10px 16px',borderBottom:'1px solid #1e1e1e',flexShrink:0,
          display:'flex',gap:10,alignItems:'center',background:'#0a0a0a'}}>
          <button className="btn btn-ghost" style={{fontSize:12}} onClick={()=>setShowArchive(false)}>
            ← Current
          </button>
          <span style={{fontSize:12,color:'#525252'}}>{snaps.length} archived analysis{snaps.length!==1?'es':''}</span>
        </div>
        {!snaps.length ? (
          <div className="empty">
            <Archive size={32} color="#2a2a2a"/>
            <h3>No Archives</h3>
            <p>Every time you run AI Analyze,<br/>the previous analysis is saved here.</p>
          </div>
        ) : (
          <div style={{flex:1,overflow:'hidden',display:'flex'}}>
            {/* Sidebar */}
            <div style={{width:190,flexShrink:0,borderRight:'1px solid #1e1e1e',
              overflowY:'auto',background:'#080808'}}>
              {snaps.map((s,i) => (
                <button key={i} onClick={()=>setArchiveIdx(i)} style={{
                  width:'100%',padding:'12px 14px',background: archiveIdx===i?'#1a1a1a':'none',
                  border:'none',borderBottom:'1px solid #1a1a1a',cursor:'pointer',textAlign:'left',
                  color: archiveIdx===i?'#f97316':'#a3a3a3',transition:'background 0.1s',
                }}>
                  <div style={{fontSize:12,fontWeight:600,marginBottom:3}}>
                    Analysis #{snaps.length - i}
                  </div>
                  <div style={{fontSize:10,color:'#525252',fontFamily:'var(--font-mono)'}}>
                    {new Date(s.timestamp).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
                  </div>
                  <div style={{fontSize:10,color:'#3a3a3a',marginTop:2}}>
                    {s.teams.filter(t=>t.tier).length} teams ranked
                  </div>
                </button>
              ))}
            </div>
            {/* Content */}
            <div style={{flex:1,overflowY:'auto',padding:16}}>
              {snap && (() => {
                const t = snapTeams.filter(t=>t.tier||t.withTips?.length);
                const targets  = t.filter(x=>x.allianceTarget);
                const optimal  = t.filter(x=>x.tier==='OPTIMAL'&&!x.allianceTarget);
                const mid      = t.filter(x=>x.tier==='MID'    &&!x.allianceTarget);
                const bad      = t.filter(x=>x.tier==='BAD'    &&!x.allianceTarget);
                return <>
                  <div style={{fontSize:11,color:'#3a3a3a',marginBottom:16,fontFamily:'var(--font-mono)'}}>
                    Archived {new Date(snap.timestamp).toLocaleString()}
                  </div>
                  <Section label="★ Targets" color="#f97316" icon={Users}  teams={targets}/>
                  <Section label="Optimal"   color="#22c55e" icon={Users}  teams={optimal}/>
                  <Section label="Mid"       color="#eab308" icon={Shield} teams={mid}/>
                  <Section label="Bad"       color="#ef4444" icon={Swords} teams={bad}/>
                </>;
              })()}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Current view ──────────────────────────────────────────────────────────
  const analyzed = teams.filter(t=>t.withTips?.length||t.againstTips?.length||t.notes);
  const filtered = analyzed.filter(t =>
    !search ||
    t.teamName?.toLowerCase().includes(search.toLowerCase()) ||
    t.teamNumber?.includes(search)
  );

  const targets  = filtered.filter(t=>t.allianceTarget);
  const optimal  = filtered.filter(t=>t.tier==='OPTIMAL'&&!t.allianceTarget);
  const mid      = filtered.filter(t=>t.tier==='MID'    &&!t.allianceTarget);
  const bad      = filtered.filter(t=>t.tier==='BAD'    &&!t.allianceTarget);
  const unranked = filtered.filter(t=>!t.tier           &&!t.allianceTarget);

  return (
    <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>
      <div style={{padding:'10px 16px',borderBottom:'1px solid #1e1e1e',flexShrink:0,
        display:'flex',gap:10,alignItems:'center',background:'#0a0a0a',flexWrap:'wrap'}}>
        <Shield size={15} color="#f97316"/>
        <span style={{fontSize:13,fontWeight:600,color:'#a3a3a3'}}>Strategy Tips</span>
        <div style={{position:'relative',marginLeft:4}}>
          <Search size={12} style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:'#3a3a3a'}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search…"
            style={{paddingLeft:26,width:160,fontSize:12,height:30}}/>
        </div>
        <button className="btn btn-ghost" style={{fontSize:11,marginLeft:'auto'}}
          onClick={()=>setShowArchive(true)}>
          <Archive size={12}/> Archive {archive?.length>0?`(${archive.length})`:''}
        </button>
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'16px 16px 32px'}}>
        {!analyzed.length ? (
          <div className="empty">
            <Shield size={32} color="#2a2a2a"/>
            <h3>No Tips Yet</h3>
            <p>Go to Data tab → hit <b style={{color:'#f97316'}}>AI Analyze All</b></p>
          </div>
        ) : (
          <>
            <Section label="★ Alliance Targets" color="#f97316" icon={Users}  teams={targets}/>
            <Section label="Optimal"            color="#22c55e" icon={Users}  teams={optimal}/>
            <Section label="Mid"                color="#eab308" icon={Shield} teams={mid}/>
            <Section label="Bad"                color="#ef4444" icon={Swords} teams={bad}/>
            <Section label="Unranked"           color="#525252" icon={Shield} teams={unranked}/>
          </>
        )}
      </div>
    </div>
  );
}
