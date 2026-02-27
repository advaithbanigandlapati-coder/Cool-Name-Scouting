import { useState } from 'react';
import { ClipboardCheck, Check, Table2, ChevronDown, ChevronUp } from 'lucide-react';

const BLANK = {
  teamNumber:'', autoNear:null, autoFar:null,
  autoArtifacts:'', leave:null, totalPts:'',
  teleopArtifacts:'', parking:null, notes:'',
};

const PARKING_OPTS = [
  { key:'none',    label:'No Park',  color:'#525252', bg:'#1a1a1a' },
  { key:'partial', label:'Partial',  color:'#eab308', bg:'#71370f' },
  { key:'full',    label:'Full',     color:'#22c55e', bg:'#14532d' },
];

// Aggregate raw match entries per team
function aggregate(entries) {
  const byTeam = {};
  for (const e of entries) {
    if (!e.teamNumber) continue;
    if (!byTeam[e.teamNumber]) byTeam[e.teamNumber] = [];
    byTeam[e.teamNumber].push(e);
  }
  return Object.entries(byTeam).map(([num, rows]) => {
    const n = rows.length;
    const avg = f => { const v=rows.map(r=>parseFloat(r[f])).filter(x=>!isNaN(x)); return v.length?Math.round(v.reduce((s,x)=>s+x,0)/v.length*10)/10:null; };
    const hi  = f => { const v=rows.map(r=>parseFloat(r[f])).filter(x=>!isNaN(x)); return v.length?Math.max(...v):null; };
    const parkRank = {full:2,partial:1,none:0};
    const bestPark = rows.reduce((b,r)=>(parkRank[r.parking]??-1)>(parkRank[b]??-1)?r.parking:b, null);
    return {
      teamNumber: num,
      matchCount: n,
      autoNear:   rows.some(r=>r.autoNear),
      autoFar:    rows.some(r=>r.autoFar),
      leave:      rows.some(r=>r.leave),
      avgAutoArt: avg('autoArtifacts'),
      highAutoArt:hi('autoArtifacts'),
      avgTpArt:   avg('teleopArtifacts'),
      highTpArt:  hi('teleopArtifacts'),
      avgPts:     avg('totalPts'),
      highPts:    hi('totalPts'),
      bestPark,
      notes: rows.map(r=>r.notes).filter(Boolean).join(' | '),
    };
  });
}

const yn = v => v===true
  ? <span style={{color:'#22c55e',fontWeight:700}}>✓</span>
  : v===false ? <span style={{color:'#2a2a2a'}}>✗</span>
  : <span style={{color:'#1e1e1e'}}>—</span>;

function ParkBadge({val}) {
  const c = {full:{color:'#22c55e',bg:'#14532d',label:'Full'},partial:{color:'#eab308',bg:'#71370f',label:'Partial'},none:{color:'#525252',bg:'#1a1a1a',label:'None'}};
  if (!val||!c[val]) return <span style={{color:'#2a2a2a'}}>—</span>;
  return <span style={{background:c[val].bg,color:c[val].color,padding:'1px 8px',borderRadius:4,fontSize:11,fontWeight:700}}>{c[val].label}</span>;
}

// Cross-reference a match aggregate row with the scouting form data for the same team
function CrossRef({matchRow, formTeam}) {
  if (!formTeam) return <span style={{color:'#3a3a3a',fontSize:11}}>No form data</span>;
  const conflicts = [];
  const confirms  = [];

  // Auto near/far
  if (matchRow.autoNear && !formTeam.autoClose) conflicts.push('Match shows close auto, form says no');
  if (matchRow.autoNear && formTeam.autoClose)  confirms.push('Close auto confirmed');
  if (matchRow.autoFar  && !formTeam.autoFar)   conflicts.push('Match shows far auto, form says no');
  if (matchRow.autoFar  && formTeam.autoFar)    confirms.push('Far auto confirmed');

  // Teleop volume
  if (matchRow.avgTpArt !== null && formTeam.avgTeleop) {
    const diff = Math.abs(matchRow.avgTpArt - parseFloat(formTeam.avgTeleop));
    if (diff > 5) conflicts.push(`TP artifacts: match avg ${matchRow.avgTpArt} vs form avg ${formTeam.avgTeleop}`);
    else confirms.push(`TP volume consistent (~${matchRow.avgTpArt} artifacts)`);
  }

  // Parking
  if (matchRow.bestPark === 'full' && formTeam.endgame?.toLowerCase().includes('partial'))
    conflicts.push('Match shows full park, form mentions partial');
  if (matchRow.bestPark === 'full' && formTeam.endgame?.toLowerCase().includes('full'))
    confirms.push('Full park confirmed');

  return (
    <div style={{fontSize:11,lineHeight:1.7}}>
      {confirms.map((c,i) => <div key={i} style={{color:'#22c55e'}}>✓ {c}</div>)}
      {conflicts.map((c,i) => <div key={i} style={{color:'#f97316'}}>⚠ {c}</div>)}
      {!confirms.length && !conflicts.length && <div style={{color:'#3a3a3a'}}>No discrepancies</div>}
    </div>
  );
}


// ── Reusable team picker with "not listed" fallback ──────────────────────────
function TeamPicker({ form, setF, handleTeamNum, teamList }) {
  const [notListed, setNotListed] = useState(false);

  if (notListed) return (
    <div style={{marginBottom:14}}>
      <label>Team Number</label>
      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
        <input value={form.teamNumber} onChange={e=>handleTeamNum(e.target.value)}
          placeholder="e.g. 12345"
          style={{maxWidth:140,fontFamily:'var(--font-mono)',fontSize:16}}/>
        <input value={form.teamName||''} onChange={e=>setF('teamName',e.target.value)}
          placeholder="Team name (optional)"
          style={{flex:1,fontSize:13}}/>
      </div>
      <button onClick={()=>setNotListed(false)}
        style={{fontSize:11,background:'none',border:'none',color:'#525252',cursor:'pointer',padding:0}}>
        ← Back to dropdown
      </button>
    </div>
  );

  return (
    <div style={{marginBottom:14}}>
      <label>Team</label>
      <select value={form.teamNumber} onChange={e=>{
        if (e.target.value==='__not_listed__') { setNotListed(true); return; }
        handleTeamNum(e.target.value);
      }} style={{fontSize:13,padding:'10px 12px'}}>
        <option value="">— Select a team —</option>
        {teamList.map(t=>(
          <option key={t.teamNumber} value={t.teamNumber}>
            #{t.teamNumber} — {t.teamName}
          </option>
        ))}
        <option value="__not_listed__">Team not listed? Enter manually →</option>
      </select>
      {form.teamNumber && teamList.find(t=>t.teamNumber===form.teamNumber) && (
        <div style={{fontSize:11,color:'#525252',marginTop:4,paddingLeft:2}}>
          {teamList.find(t=>t.teamNumber===form.teamNumber)?.teamName}
        </div>
      )}
    </div>
  );
}

export default function MatchFormTab({ teams, setTeams, matchEntries, setMatchEntries, setToast }) {
  const [form,      setForm]      = useState({ ...BLANK });
  const [submitted, setSubmitted] = useState(false);
  const [view,      setView]      = useState('form'); // 'form' | 'table' | 'crossref'
  const [expanded,  setExpanded]  = useState(null);

  const teamList = teams.filter(t => t.teamNumber && t.teamName);

  function setF(k, v) { setForm(p => ({...p, [k]:v})); }

  // Auto-fill team name when number is typed
  function handleTeamNum(val) {
    const match = teamList.find(t => t.teamNumber === val.trim());
    setForm(p => ({...p, teamNumber: val, teamName: match?.teamName||p.teamName}));
  }

  function submit() {
    if (!form.teamNumber) { setToast({msg:'Enter a team number.',type:'warn'}); return; }
    const entry = { ...form, id: Date.now(), timestamp: new Date().toISOString() };
    setMatchEntries(prev => [...prev, entry]);

    const inRegistry = teams.some(t => t.teamNumber === form.teamNumber);

    setTeams(prev => {
      const avg = (old, nw, prior) => {
        const o = parseFloat(old)||0, v = parseFloat(nw)||0;
        if (!v) return old;
        const n = prior + 1;
        return Math.round(((o*prior)+v)/n*10)/10;
      };

      if (inRegistry) {
        // Update existing team
        return prev.map(t => {
          if (t.teamNumber !== form.teamNumber) return t;
          const prior = t.matchCount || 0;
          return {
            ...t,
            matchCount: prior + 1,
            ...(form.autoNear  !== null && { autoClose: form.autoNear  || t.autoClose }),
            ...(form.autoFar   !== null && { autoFar:   form.autoFar   || t.autoFar   }),
            ...(form.leave     !== null && { leave:     form.leave     || t.leave     }),
            ...(form.autoArtifacts   && {
              avgAuto:  avg(t.avgAuto,  form.autoArtifacts, prior),
              highAuto: String(Math.max(parseFloat(t.highAuto)||0, parseFloat(form.autoArtifacts)||0)||''  ),
            }),
            ...(form.teleopArtifacts && {
              avgTeleop:  avg(t.avgTeleop,  form.teleopArtifacts, prior),
              highTeleop: String(Math.max(parseFloat(t.highTeleop)||0, parseFloat(form.teleopArtifacts)||0)||''  ),
            }),
            ...(form.totalPts && {
              matchPoints: avg(t.matchPoints, form.totalPts, prior),
              highScore:   String(Math.max(parseFloat(t.highScore)||0, parseFloat(form.totalPts)||0)||''  ),
            }),
            ...(form.parking && { endgame: t.endgame || form.parking }),
            ...(form.notes   && { scoutNotes: [t.scoutNotes, form.notes].filter(Boolean).join(' | ') }),
          };
        });
      } else {
        // Brand new team — add to registry from match data
        const newTeam = {
          ...BLANK_TEAM,
          teamNumber:   form.teamNumber,
          teamName:     form.teamName || '',
          matchCount:   1,
          autoClose:    form.autoNear  ?? false,
          autoFar:      form.autoFar   ?? false,
          leave:        form.leave     ?? false,
          avgAuto:      parseFloat(form.autoArtifacts)   || '',
          highAuto:     parseFloat(form.autoArtifacts)   || '',
          avgTeleop:    parseFloat(form.teleopArtifacts) || '',
          highTeleop:   parseFloat(form.teleopArtifacts) || '',
          matchPoints:  parseFloat(form.totalPts)        || '',
          highScore:    parseFloat(form.totalPts)        || '',
          endgame:      form.parking || '',
          scoutNotes:   form.notes   || '',
          source: 'match',
        };
        return [...prev, newTeam]
          .sort((a,b) => (parseInt(a.stateRank)||999)-(parseInt(b.stateRank)||999));
      }
    });

    // Auto-fetch OPR/EPA from FTCScout in background
    fetchTeamStats(form.teamNumber).then(stats => {
      if (!stats) return;
      setTeams(prev => prev.map(t => {
        if (t.teamNumber !== form.teamNumber) return t;
        return {
          ...t,
          opr:      stats.opr      || t.opr,
          epa:      stats.epa      || t.epa,
          teamName: t.teamName     || stats.teamName || t.teamName,
          fetchStatus: 'ok',
        };
      }));
    }).catch(() => {});

    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setForm({...BLANK}); }, 1600);
    setToast({
      msg: inRegistry
        ? `✓ #${form.teamNumber} stats updated from match`
        : `✓ #${form.teamNumber} added to registry + fetching OPR/EPA…`,
      type:'ok'
    });
  }

  const aggregated = aggregate(matchEntries);

  // ── Table view ──────────────────────────────────────────────────────────────
  const th = (color='#525252') => ({
    padding:'7px 10px', fontSize:10, fontWeight:700, textTransform:'uppercase',
    letterSpacing:'0.05em', color, borderBottom:'1px solid #1a1a1a',
    background:'#0a0a0a', position:'sticky', top:0, whiteSpace:'nowrap',
  });
  const td = {padding:'6px 10px', borderBottom:'1px solid #111', fontSize:12, verticalAlign:'middle'};

  if (view === 'table') return (
    <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>
      <div style={{padding:'10px 16px',borderBottom:'1px solid #1e1e1e',flexShrink:0,
        display:'flex',gap:10,alignItems:'center',background:'#0a0a0a',flexWrap:'wrap'}}>
        <button className="btn btn-ghost" onClick={()=>setView('form')}>← Form</button>
        <button className="btn btn-ghost" style={{fontSize:12,
          color:view==='crossref'?'#f97316':'inherit'}}
          onClick={()=>setView('crossref')}>Cross-Reference ↗</button>
        <span style={{marginLeft:'auto',fontSize:11,color:'#3a3a3a',fontFamily:'var(--font-mono)'}}>
          {matchEntries.length} match logs · {aggregated.length} teams
        </span>
      </div>
      <div style={{flex:1,overflowX:'auto',overflowY:'auto'}}>
        {!aggregated.length
          ? <div className="empty"><h3>No matches logged</h3><p>Submit match forms to see data here.</p></div>
          : <table style={{borderCollapse:'collapse',whiteSpace:'nowrap'}}>
              <thead><tr>
                <th style={th()}>#</th>
                <th style={th()}>Team</th>
                <th style={th()}>Matches</th>
                <th style={th('#f97316')}>Near</th>
                <th style={th('#f97316')}>Far</th>
                <th style={th('#f97316')}>Leave</th>
                <th style={th('#f97316')}>Auto Art Avg</th>
                <th style={th('#60a5fa')}>TP Art Avg</th>
                <th style={th('#60a5fa')}>TP Art High</th>
                <th style={th('#60a5fa')}>Pts Avg</th>
                <th style={th('#60a5fa')}>Pts High</th>
                <th style={th('#a78bfa')}>Best Park</th>
                <th style={th()}>Notes</th>
              </tr></thead>
              <tbody>
                {aggregated.map((r,i) => {
                  const t = teams.find(x=>x.teamNumber===r.teamNumber);
                  return (
                    <tr key={r.teamNumber} style={{background:i%2===0?'#0c0c0c':'#0f0f0f'}}>
                      <td style={{...td,color:'#f97316',fontFamily:'var(--font-mono)',fontWeight:700}}>#{r.teamNumber}</td>
                      <td style={td}>{t?.teamName||'—'}</td>
                      <td style={{...td,textAlign:'center',color:'#525252',fontFamily:'var(--font-mono)'}}>{r.matchCount}</td>
                      <td style={{...td,textAlign:'center'}}>{yn(r.autoNear)}</td>
                      <td style={{...td,textAlign:'center'}}>{yn(r.autoFar)}</td>
                      <td style={{...td,textAlign:'center'}}>{yn(r.leave)}</td>
                      <td style={{...td,textAlign:'center',fontFamily:'var(--font-mono)'}}>{r.avgAutoArt??'—'}</td>
                      <td style={{...td,textAlign:'center',fontFamily:'var(--font-mono)'}}>{r.avgTpArt??'—'}</td>
                      <td style={{...td,textAlign:'center',fontFamily:'var(--font-mono)'}}>{r.highTpArt??'—'}</td>
                      <td style={{...td,textAlign:'center',fontFamily:'var(--font-mono)'}}>{r.avgPts??'—'}</td>
                      <td style={{...td,textAlign:'center',fontFamily:'var(--font-mono)'}}>{r.highPts??'—'}</td>
                      <td style={{...td,textAlign:'center'}}><ParkBadge val={r.bestPark}/></td>
                      <td style={{...td,maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',color:'#a3a3a3'}}>{r.notes||'—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
        }
      </div>
    </div>
  );

  // ── Cross-reference view ────────────────────────────────────────────────────
  if (view === 'crossref') {
    const scoutedTeams = teams.filter(t => t.source==='form'||t.source==='sheet'||t.matchCount>0);
    const allTeamNums  = [...new Set([
      ...aggregated.map(r=>r.teamNumber),
      ...scoutedTeams.map(t=>t.teamNumber),
    ])];

    return (
      <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'10px 16px',borderBottom:'1px solid #1e1e1e',flexShrink:0,
          display:'flex',gap:10,alignItems:'center',background:'#0a0a0a'}}>
          <button className="btn btn-ghost" onClick={()=>setView('form')}>← Form</button>
          <button className="btn btn-ghost" style={{fontSize:12}} onClick={()=>setView('table')}>Match Table</button>
          <span style={{fontSize:13,fontWeight:600,color:'#a3a3a3',marginLeft:4}}>Cross-Reference</span>
          <span style={{marginLeft:'auto',fontSize:11,color:'#3a3a3a',fontFamily:'var(--font-mono)'}}>
            {allTeamNums.length} teams
          </span>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:16}}>
          {!allTeamNums.length
            ? <div className="empty"><h3>No data to cross-reference</h3><p>Log match forms and scout forms first.</p></div>
            : allTeamNums.map(num => {
                const matchRow  = aggregated.find(r=>r.teamNumber===num);
                const formTeam  = scoutedTeams.find(t=>t.teamNumber===num);
                const docTeam   = teams.find(t=>t.teamNumber===num);
                const isOpen    = expanded===num;

                return (
                  <div key={num} style={{borderRadius:8,border:'1px solid #1a1a1a',
                    background:'#0f0f0f',marginBottom:8,overflow:'hidden'}}>
                    <button onClick={()=>setExpanded(isOpen?null:num)} style={{
                      width:'100%',background:'none',border:'none',cursor:'pointer',
                      display:'flex',alignItems:'center',gap:12,
                      padding:'12px 16px',color:'var(--text)',textAlign:'left',
                    }}>
                      <span style={{fontFamily:'var(--font-mono)',color:'#f97316',fontWeight:700,fontSize:14}}>
                        #{num}
                      </span>
                      <span style={{fontSize:14,fontWeight:600}}>{docTeam?.teamName||'Unknown'}</span>
                      <div style={{display:'flex',gap:10,marginLeft:'auto',alignItems:'center'}}>
                        {matchRow && (
                          <span style={{fontSize:11,color:'#60a5fa',fontFamily:'var(--font-mono)'}}>
                            {matchRow.matchCount} match{matchRow.matchCount!==1?'es':''}
                          </span>
                        )}
                        {formTeam && (
                          <span style={{fontSize:11,color:'#a78bfa',fontFamily:'var(--font-mono)'}}>
                            {formTeam.matchCount||0} scouted
                          </span>
                        )}
                        {!matchRow && <span style={{fontSize:11,color:'#3a3a3a'}}>No match data</span>}
                        {!formTeam && <span style={{fontSize:11,color:'#3a3a3a'}}>No form data</span>}
                      </div>
                      {isOpen?<ChevronUp size={14} color="#3a3a3a"/>:<ChevronDown size={14} color="#3a3a3a"/>}
                    </button>

                    {isOpen && (
                      <div style={{padding:'0 16px 16px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                        {/* Match data */}
                        <div>
                          <div style={{fontSize:11,fontWeight:700,color:'#60a5fa',
                            textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>
                            📋 Match Data ({matchRow?.matchCount||0} matches)
                          </div>
                          {matchRow ? (
                            <div style={{fontSize:12,lineHeight:2,color:'#a3a3a3',fontFamily:'var(--font-mono)'}}>
                              <div>Auto Near: {yn(matchRow.autoNear)} &nbsp; Far: {yn(matchRow.autoFar)}</div>
                              <div>Leave: {yn(matchRow.leave)}</div>
                              <div>Auto Art Avg: {matchRow.avgAutoArt??'—'}</div>
                              <div>TP Art Avg: {matchRow.avgTpArt??'—'} / High: {matchRow.highTpArt??'—'}</div>
                              <div>Pts Avg: {matchRow.avgPts??'—'} / High: {matchRow.highPts??'—'}</div>
                              <div>Best Park: <ParkBadge val={matchRow.bestPark}/></div>
                              {matchRow.notes && <div style={{color:'#525252',marginTop:4}}>{matchRow.notes}</div>}
                            </div>
                          ) : <div style={{fontSize:12,color:'#3a3a3a'}}>No match logs yet.</div>}
                        </div>

                        {/* Scouting form data */}
                        <div>
                          <div style={{fontSize:11,fontWeight:700,color:'#a78bfa',
                            textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>
                            🔍 Scouting Form ({formTeam?.matchCount||0} responses)
                          </div>
                          {formTeam ? (
                            <div style={{fontSize:12,lineHeight:2,color:'#a3a3a3',fontFamily:'var(--font-mono)'}}>
                              <div>Has Auto: {yn(formTeam.hasAuto)}</div>
                              <div>Close: {yn(formTeam.autoClose)} &nbsp; Far: {yn(formTeam.autoFar)}</div>
                              <div>Leave: {yn(formTeam.leave)}</div>
                              <div>TP Avg: {formTeam.avgTeleop||'—'} / High: {formTeam.highTeleop||'—'}</div>
                              <div>Capacity: {formTeam.capacity||'—'}</div>
                              <div style={{color:'#525252'}}>{formTeam.endgame||'—'}</div>
                            </div>
                          ) : <div style={{fontSize:12,color:'#3a3a3a'}}>No scouting responses yet.</div>}
                        </div>

                        {/* Cross-ref analysis */}
                        <div style={{gridColumn:'1/-1',
                          background:'#0a0a0a',border:'1px solid #1e1e1e',
                          borderRadius:6,padding:'10px 14px'}}>
                          <div style={{fontSize:11,fontWeight:700,color:'#f97316',
                            textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>
                            ⚡ Cross-Reference Analysis
                          </div>
                          <CrossRef matchRow={matchRow} formTeam={formTeam}/>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
          }
        </div>
      </div>
    );
  }

  // ── Match entry form ────────────────────────────────────────────────────────
  return (
    <div style={{flex:1,overflowY:'auto'}}>
      <div style={{maxWidth:520,margin:'0 auto',padding:'20px 16px 48px'}}>

        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <ClipboardCheck size={18} color="#f97316"/>
            <span style={{fontFamily:'var(--font-head)',fontSize:22,letterSpacing:'0.05em'}}>Match Form</span>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-ghost" style={{fontSize:12}} onClick={()=>setView('table')}>
              <Table2 size={12}/> Table
            </button>
            <button className="btn btn-ghost" style={{fontSize:12}} onClick={()=>setView('crossref')}>
              Cross-Ref ↗
            </button>
          </div>
        </div>

        {/* Team picker */}
        <TeamPicker form={form} setF={setF} handleTeamNum={handleTeamNum} teamList={teamList}/>

        {/* Question cards */}
        {[
          // Autonomous
          { section:'AUTO', color:'#f97316', fields:[
            { key:'autoNear', label:'Autonomous Near', type:'bool' },
            { key:'autoFar',  label:'Autonomous Far',  type:'bool' },
            { key:'autoArtifacts', label:'Artifacts scored in Auto', type:'num' },
            { key:'leave',    label:'Leave?',           type:'bool' },
          ]},
          // Teleop
          { section:'TELEOP', color:'#60a5fa', fields:[
            { key:'totalPts',        label:'Total Points',             type:'num' },
            { key:'teleopArtifacts', label:'Artifacts scored in Teleop', type:'num' },
          ]},
          // Endgame
          { section:'ENDGAME', color:'#a78bfa', fields:[
            { key:'parking', label:'Parking', type:'parking' },
          ]},
          // Notes
          { section:'NOTES', color:'#525252', fields:[
            { key:'notes', label:'Notes (optional)', type:'text' },
          ]},
        ].map(({ section, color, fields }) => (
          <div key={section} style={{marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:700,color,textTransform:'uppercase',
              letterSpacing:'0.07em',marginBottom:6,paddingBottom:4,
              borderBottom:`1px solid ${color}33`}}>
              {section}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {fields.map(f => (
                <div key={f.key} style={{background:'#0f0f0f',border:'1px solid #1e1e1e',
                  borderRadius:8,padding:'12px 14px'}}>
                  <div style={{fontSize:13,fontWeight:600,marginBottom:9,color:'#e5e5e5'}}>{f.label}</div>

                  {f.type==='bool' && (
                    <div style={{display:'flex',gap:8}}>
                      {['Yes','No'].map(opt=>(
                        <button key={opt} onClick={()=>setF(f.key,opt==='Yes')} style={{
                          flex:1,padding:'8px',borderRadius:6,border:'none',cursor:'pointer',
                          fontWeight:700,fontSize:13,transition:'all 0.15s',
                          background: form[f.key]===(opt==='Yes') ? (opt==='Yes'?'#14532d':'#1a0a0a') : '#1a1a1a',
                          color:      form[f.key]===(opt==='Yes') ? (opt==='Yes'?'#22c55e':'#ef4444') : '#525252',
                          outline:    form[f.key]===(opt==='Yes') ? `1px solid ${opt==='Yes'?'#22c55e':'#ef4444'}` : '1px solid transparent',
                        }}>{opt}</button>
                      ))}
                    </div>
                  )}

                  {f.type==='num' && (
                    <input type="number" min="0" value={form[f.key]}
                      onChange={e=>setF(f.key,e.target.value)}
                      style={{maxWidth:130,textAlign:'center',fontSize:18,padding:'7px 12px'}}
                      placeholder="0"/>
                  )}

                  {f.type==='parking' && (
                    <div style={{display:'flex',gap:8}}>
                      {PARKING_OPTS.map(opt=>(
                        <button key={opt.key} onClick={()=>setF('parking',opt.key)} style={{
                          flex:1,padding:'9px 6px',borderRadius:6,border:'none',cursor:'pointer',
                          fontWeight:700,fontSize:12,transition:'all 0.15s',
                          background: form.parking===opt.key ? opt.bg : '#1a1a1a',
                          color:      form.parking===opt.key ? opt.color : '#525252',
                          outline:    form.parking===opt.key ? `1px solid ${opt.color}` : '1px solid transparent',
                        }}>{opt.label}</button>
                      ))}
                    </div>
                  )}

                  {f.type==='text' && (
                    <textarea rows={2} value={form[f.key]}
                      onChange={e=>setF(f.key,e.target.value)}
                      placeholder="Type here…"
                      style={{resize:'vertical',fontSize:13}}/>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <button className="btn btn-primary" onClick={submit}
          disabled={!form.teamNumber||submitted}
          style={{width:'100%',marginTop:10,padding:'13px',fontSize:15,
            justifyContent:'center',
            background:submitted?'#14532d':undefined,
            color:submitted?'#22c55e':undefined}}>
          {submitted?<><Check size={16}/> Logged!</>:'Log Match'}
        </button>

        {matchEntries.length>0 && (
          <div style={{marginTop:12,fontSize:11,color:'#3a3a3a',textAlign:'center',fontFamily:'var(--font-mono)'}}>
            {matchEntries.length} match{matchEntries.length!==1?'es':''} logged this session
          </div>
        )}
      </div>
    </div>
  );
}

