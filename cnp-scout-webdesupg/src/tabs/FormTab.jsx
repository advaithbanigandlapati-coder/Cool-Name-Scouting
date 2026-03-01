import { useState, useEffect, useRef } from 'react';
import { ClipboardList, Check, Wifi, WifiOff, Radio } from 'lucide-react';
import { fetchSheetTeams } from '../api/sheets.js';
import { BLANK_TEAM } from '../constants.js';


const POLL_INTERVAL = 15000;

const QUESTIONS = [
  { key:'fieldPref',      label:'Do they have a field position preference?',     type:'bool' },
  { key:'fieldPrefWhere', label:'If yes — where?',                               type:'text' },
  { key:'hasAuto',        label:'Do they have an AUTON?',                        type:'bool' },
  { key:'readsMotif',     label:'Can they read the motif April Tag?',            type:'bool' },
  { key:'autoArtifacts',  label:'How many artifacts in Auton?',                  type:'num'  },
  { key:'teleopArtifacts',label:'How many artifacts in Teleop?',                 type:'num'  },
  { key:'pickupMethod',   label:'How do they pick up artifacts?',                type:'select', options:['Human Player','Floor','Both'] },
  { key:'canShoot',       label:'Can they shoot artifacts?',                     type:'bool' },
  { key:'shootRange',     label:'Can they shoot from?',                          type:'select', options:['Near Side','Far Side','Both'] },
  { key:'motifPriority',  label:'Is motif pattern a priority?',                  type:'bool' },
  { key:'playsDefense',   label:'Is the robot able to play defense?',            type:'bool' },
  { key:'defenseExplain', label:'Explain their defense',                         type:'text' },
  { key:'parkType',       label:'What type of park can they do?',                type:'select', options:['Full','Partial','None'] },
  { key:'stratNotes',     label:'Strategist notes (AI will read this)',          type:'text' },
];

const BLANK = {
  fieldPref:null, fieldPrefWhere:'', hasAuto:null, readsMotif:null,
  autoArtifacts:'', teleopArtifacts:'', pickupMethod:'',
  canShoot:null, shootRange:'', motifPriority:null,
  playsDefense:null, defenseExplain:'', parkType:'', stratNotes:'',
};

function mergeSheetData(prev, imported) {
  const byNum = Object.fromEntries(prev.map(t => [t.teamNumber, t]));
  const updated = imported.map(imp => ({
    ...(byNum[imp.teamNumber] || {}), ...imp,
    teamName: byNum[imp.teamNumber]?.teamName || imp.teamNameFromForm || '',
    humanEdits: byNum[imp.teamNumber]?.humanEdits || {},
  }));
  const updatedNums = new Set(updated.map(t => t.teamNumber));
  return [...prev.filter(t => !updatedNums.has(t.teamNumber)), ...updated]
    .sort((a,b) => (parseInt(a.stateRank)||999)-(parseInt(b.stateRank)||999));
}

export default function FormTab({ teams, setTeams, settings, mine, setToast }) {
  const [viewTable,    setViewTable]    = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [notListed,    setNotListed]    = useState(false);
  const [manualNum,    setManualNum]    = useState('');
  const [manualName,   setManualName]   = useState('');
  const [response,     setResponse]     = useState({ ...BLANK });
  const [submitted,    setSubmitted]    = useState(false);
  const [liveStatus,   setLiveStatus]   = useState('off');
  const [lastSync,     setLastSync]     = useState(null);
  const [newCount,     setNewCount]     = useState(0);
  const pollRef   = useRef(null);
  const prevCount = useRef(null);

  const csvUrl       = settings?.csvUrl;
  const teamList     = teams.filter(t => t.teamNumber && t.teamName);
  const activeTeamNum = notListed ? manualNum.trim() : selectedTeam;
  const scoutedTeams  = teams.filter(t => t.source==='form'||t.source==='sheet'||t.matchCount>0);

  // ── Live polling ──────────────────────────────────────────────────────────
  async function poll(showToast=false) {
    if (!csvUrl) return;
    try {
      const imported = await fetchSheetTeams(csvUrl);
      const total = imported.reduce((s,t)=>s+(t.matchCount||0),0);
      if (prevCount.current !== null && total > prevCount.current) {
        const diff = total - prevCount.current;
        setNewCount(diff);
        if (showToast) setToast({ msg:`🔴 ${diff} new form submission${diff>1?'s':''}!`, type:'ok' });
        setTimeout(()=>setNewCount(0), 4000);
      }
      prevCount.current = total;
      setTeams(prev => mergeSheetData(prev, imported));
      setLastSync(new Date());
      setLiveStatus('live');
    } catch { setLiveStatus('error'); }
  }

  function startLive() {
    if (!csvUrl) { setToast({ msg:'Add CSV URL in Settings first.', type:'err' }); return; }
    setLiveStatus('connecting');
    poll(false).then(() => { pollRef.current = setInterval(()=>poll(true), POLL_INTERVAL); });
  }
  function stopLive() { clearInterval(pollRef.current); pollRef.current=null; setLiveStatus('off'); }
  useEffect(() => () => clearInterval(pollRef.current), []);

  // ── Submit ────────────────────────────────────────────────────────────────
  function set(key, val) { setResponse(p => ({...p, [key]:val})); }

  function submit() {
    if (!activeTeamNum) { setToast({ msg:'Select or enter a team first.', type:'warn' }); return; }
    setTeams(prev => {
      const inRegistry = prev.some(t => t.teamNumber === activeTeamNum);
      if (inRegistry) {
        return prev.map(t => {
          if (t.teamNumber !== activeTeamNum) return t;
          return {
            ...t,
            fieldPref:      response.fieldPref      ?? t.fieldPref,
            fieldPrefWhere: response.fieldPrefWhere || t.fieldPrefWhere,
            hasAuto:        response.hasAuto        ?? t.hasAuto,
            readsMotif:     response.readsMotif     ?? t.readsMotif,
            autoArtifacts:  response.autoArtifacts  || t.autoArtifacts,
            teleopArtifacts:response.teleopArtifacts|| t.teleopArtifacts,
            pickupMethod:   response.pickupMethod   || t.pickupMethod,
            canShoot:       response.canShoot       ?? t.canShoot,
            shootRange:     response.shootRange     || t.shootRange,
            motifPriority:  response.motifPriority  ?? t.motifPriority,
            playsDefense:   response.playsDefense   ?? t.playsDefense,
            defenseExplain: response.defenseExplain || t.defenseExplain,
            parkType:       response.parkType       || t.parkType,
            stratNotes:     [t.stratNotes, response.stratNotes].filter(Boolean).join(' | '),
            matchCount: (t.matchCount||0)+1, source:'form',
          };
        });
      } else {
        return [...prev, {
          ...BLANK_TEAM, teamNumber:activeTeamNum,
          teamName: notListed ? manualName.trim() : '',
          ...response, matchCount:1, source:'form',
        }].sort((a,b)=>(parseInt(a.stateRank)||999)-(parseInt(b.stateRank)||999));
      }
    });
    setSubmitted(true);
    setTimeout(()=>{
      setSubmitted(false);
      setSelectedTeam(''); setManualNum(''); setManualName('');
      setNotListed(false); setResponse({...BLANK});
    }, 1500);
  }


  // ── Live pill ─────────────────────────────────────────────────────────────
  function LivePill() {
    const cfg = {
      off:        { color:'#3a3a3a', bg:'#1a1a1a', border:'#2a2a2a', icon:<WifiOff size={11}/>, text:'Live Off'    },
      connecting: { color:'#eab308', bg:'#1a120a', border:'#713f12', icon:<Radio size={11}/>,    text:'Connecting…' },
      live:       { color:'#22c55e', bg:'#0a1a0f', border:'#14532d', icon:<Wifi size={11}/>,     text:'Live'        },
      error:      { color:'#ef4444', bg:'#1a0a0a', border:'#7f1d1d', icon:<WifiOff size={11}/>,  text:'Error'       },
    };
    const c = cfg[liveStatus];
    return (
      <div style={{display:'flex',alignItems:'center',gap:6}}>
        {liveStatus==='live' && newCount>0 && (
          <span style={{fontSize:11,fontWeight:700,color:'#f97316',
            background:'rgba(249,115,22,0.15)',border:'1px solid #f97316',
            padding:'1px 8px',borderRadius:12}}>+{newCount} new!</span>
        )}
        <div style={{display:'flex',alignItems:'center',gap:5,
          padding:'4px 10px',borderRadius:20,border:`1px solid ${c.border}`,
          background:c.bg,color:c.color,fontSize:11,fontWeight:700}}>
          {liveStatus==='live' && <span style={{width:6,height:6,borderRadius:'50%',background:'#22c55e',display:'inline-block',animation:'pulse 1.5s infinite'}}/>}
          {c.icon} {c.text}
        </div>
        {liveStatus==='live' && lastSync && (
          <span style={{fontSize:10,color:'#3a3a3a',fontFamily:'var(--font-mono)'}}>
            {lastSync.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
          </span>
        )}
      </div>
    );
  }

  // ── Table view ────────────────────────────────────────────────────────────
  if (viewTable) {
    const th = (color='#525252') => ({
      padding:'7px 10px',fontSize:10,fontWeight:700,textTransform:'uppercase',
      letterSpacing:'0.05em',color,borderBottom:'1px solid #1a1a1a',
      background:'#0a0a0a',position:'sticky',top:0,whiteSpace:'nowrap',
    });
    const td = {padding:'6px 10px',borderBottom:'1px solid #111',fontSize:12,verticalAlign:'middle'};
    const yn = v => v===true?<span style={{color:'#22c55e',fontWeight:700}}>✓</span>
                  :v===false?<span style={{color:'#2a2a2a'}}>✗</span>
                  :<span style={{color:'#1e1e1e'}}>—</span>;
    return (
      <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'10px 16px',borderBottom:'1px solid #1e1e1e',flexShrink:0,
          display:'flex',gap:10,alignItems:'center',background:'#0a0a0a',flexWrap:'wrap'}}>
          <button className="btn btn-ghost" onClick={()=>setViewTable(false)}>← Form</button>
          <LivePill/>
          {csvUrl
            ? liveStatus==='off'
              ? <button className="btn btn-primary" style={{fontSize:12}} onClick={startLive}><Radio size={12}/> Start Live Sync</button>
              : <button className="btn btn-ghost" style={{fontSize:12,color:'#ef4444',borderColor:'#7f1d1d'}} onClick={stopLive}>Stop</button>
            : <span style={{fontSize:11,color:'#3a3a3a'}}>Add CSV URL in Settings for live sync</span>
          }
          <span style={{marginLeft:'auto',fontSize:11,color:'#3a3a3a',fontFamily:'var(--font-mono)'}}>
            {scoutedTeams.length} teams
          </span>
        </div>
        <div style={{flex:1,overflowX:'auto',overflowY:'auto'}}>
          {!scoutedTeams.length
            ? <div className="empty"><h3>No data yet</h3><p>Submit forms or start live sync.</p></div>
            : <table style={{borderCollapse:'collapse',whiteSpace:'nowrap'}}>
                <thead><tr>
                  <th style={th()}>#</th><th style={th()}>Team</th>
                  <th style={th('#f97316')}>Auto</th>
                  <th style={th('#f97316')}>Motif Tag</th>
                  <th style={th('#f97316')}>Auto Art</th>
                  <th style={th('#60a5fa')}>TP Art</th>
                  <th style={th('#60a5fa')}>Pickup</th>
                  <th style={th('#60a5fa')}>Shoots</th>
                  <th style={th('#60a5fa')}>Range</th>
                  <th style={th('#60a5fa')}>Motif Pri</th>
                  <th style={th('#a78bfa')}>Defense</th>
                  <th style={th('#a78bfa')}>Park</th>
                </tr></thead>
                <tbody>
                  {scoutedTeams.map((t,i)=>(
                    <tr key={t.teamNumber} style={{background:i%2===0?'#0c0c0c':'#0f0f0f'}}>
                      <td style={{...td,color:'#f97316',fontFamily:'var(--font-mono)',fontWeight:700}}>#{t.teamNumber}</td>
                      <td style={td}>{t.teamName}</td>
                      <td style={{...td,textAlign:'center'}}>{yn(t.hasAuto)}</td>
                      <td style={{...td,textAlign:'center'}}>{yn(t.readsMotif)}</td>
                      <td style={{...td,fontFamily:'var(--font-mono)',textAlign:'center'}}>{t.autoArtifacts||'—'}</td>
                      <td style={{...td,fontFamily:'var(--font-mono)',textAlign:'center'}}>{t.teleopArtifacts||'—'}</td>
                      <td style={td}>{t.pickupMethod||'—'}</td>
                      <td style={{...td,textAlign:'center'}}>{yn(t.canShoot)}</td>
                      <td style={td}>{t.shootRange||'—'}</td>
                      <td style={{...td,textAlign:'center'}}>{yn(t.motifPriority)}</td>
                      <td style={{...td,textAlign:'center'}}>{yn(t.playsDefense)}</td>
                      <td style={td}>{t.parkType||'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      </div>
    );
  }

  // ── Scout form ────────────────────────────────────────────────────────────
  return (
    <div style={{flex:1,overflowY:'auto'}}>
      <div style={{maxWidth:520,margin:'0 auto',padding:'20px 16px 48px'}}>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <ClipboardList size={18} color="#f97316"/>
            <span style={{fontFamily:'var(--font-head)',fontSize:22,letterSpacing:'0.05em'}}>Scout a Team</span>
          </div>
          <button className="btn btn-ghost" style={{fontSize:12}} onClick={()=>setViewTable(true)}>
            View Table →
          </button>
        </div>

        {/* Live sync banner */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
          background:'#0a0a0a',border:'1px solid #1e1e1e',borderRadius:8,padding:'10px 14px',marginBottom:20}}>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:'#a3a3a3',marginBottom:2}}>Google Form Live Sync</div>
            <div style={{fontSize:11,color:'#3a3a3a'}}>{csvUrl?'Auto-updates every 15s when live':'Add CSV URL in Settings to enable'}</div>
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
            <LivePill/>
            {csvUrl && liveStatus==='off' && (
              <button className="btn btn-primary" style={{fontSize:11,padding:'4px 12px'}} onClick={startLive}>
                <Radio size={11}/> Go Live
              </button>
            )}
            {liveStatus==='live' && (
              <button className="btn btn-ghost" style={{fontSize:11,padding:'4px 10px',color:'#ef4444',borderColor:'#3a1f1f'}} onClick={stopLive}>Stop</button>
            )}
          </div>
        </div>

        {/* Team picker */}
        {notListed ? (
          <div style={{marginBottom:20}}>
            <label>Which team are you scouting?</label>
            <div style={{display:'flex',gap:8,marginBottom:8}}>
              <input value={manualNum} onChange={e=>setManualNum(e.target.value)}
                placeholder="Team #" style={{maxWidth:130,fontFamily:'var(--font-mono)',fontSize:14}}/>
              <input value={manualName} onChange={e=>setManualName(e.target.value)}
                placeholder="Team name (optional)" style={{flex:1,fontSize:13}}/>
            </div>
            <button onClick={()=>setNotListed(false)}
              style={{fontSize:11,background:'none',border:'none',color:'#525252',cursor:'pointer',padding:0}}>
              ← Back to dropdown
            </button>
          </div>
        ) : (
          <div style={{marginBottom:20}}>
            <label>Which team are you scouting?</label>
            <select value={selectedTeam} onChange={e=>{
              if (e.target.value==='__not_listed__') { setNotListed(true); return; }
              setSelectedTeam(e.target.value);
            }} style={{fontSize:14,padding:'10px 12px'}}>
              <option value="">— Select a team —</option>
              {teamList.map(t=>(
                <option key={t.teamNumber} value={t.teamNumber}>#{t.teamNumber} — {t.teamName}</option>
              ))}
              <option value="__not_listed__">Team not listed? Enter manually →</option>
            </select>
          </div>
        )}

        {/* Questions */}
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {QUESTIONS.map(q => {
            if (q.key==='fieldPrefWhere' && response.fieldPref===false) return null;
            if (q.key==='shootRange'     && response.canShoot===false)  return null;
            if (q.key==='defenseExplain' && response.playsDefense===false) return null;
            return (
              <div key={q.key} style={{background:'#0f0f0f',border:'1px solid #1e1e1e',borderRadius:8,padding:'13px 15px'}}>
                <div style={{fontSize:13,fontWeight:600,marginBottom:10,color:'#e5e5e5'}}>{q.label}</div>

                {q.type==='bool' && (
                  <div style={{display:'flex',gap:8}}>
                    {['Yes','No'].map(opt=>(
                      <button key={opt} onClick={()=>set(q.key,opt==='Yes')} style={{
                        flex:1,padding:'9px',borderRadius:6,border:'none',cursor:'pointer',
                        fontWeight:700,fontSize:13,transition:'all 0.15s',
                        background:response[q.key]===(opt==='Yes')?(opt==='Yes'?'#14532d':'#1a0a0a'):'#1a1a1a',
                        color:response[q.key]===(opt==='Yes')?(opt==='Yes'?'#22c55e':'#ef4444'):'#525252',
                        outline:response[q.key]===(opt==='Yes')?`1px solid ${opt==='Yes'?'#22c55e':'#ef4444'}`:'1px solid transparent',
                      }}>{opt}</button>
                    ))}
                  </div>
                )}

                {q.type==='select' && (
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {q.options.map(opt=>(
                      <button key={opt} onClick={()=>set(q.key,opt)} style={{
                        padding:'8px 16px',borderRadius:6,border:'none',cursor:'pointer',
                        fontWeight:700,fontSize:12,transition:'all 0.15s',
                        background:response[q.key]===opt?'#7c2d12':'#1a1a1a',
                        color:response[q.key]===opt?'#f97316':'#525252',
                        outline:response[q.key]===opt?'1px solid #f97316':'1px solid transparent',
                      }}>{opt}</button>
                    ))}
                  </div>
                )}

                {q.type==='num' && (
                  <input type="number" min="0" value={response[q.key]}
                    onChange={e=>set(q.key,e.target.value)}
                    style={{maxWidth:140,textAlign:'center',fontSize:18,padding:'8px 12px'}}
                    placeholder="0"/>
                )}

                {q.type==='text' && (
                  <textarea rows={q.key==='stratNotes'?3:2} value={response[q.key]}
                    onChange={e=>set(q.key,e.target.value)}
                    placeholder={q.key==='stratNotes'?'Your observations and strategy ideas…':'Type here…'}
                    style={{resize:'vertical',fontSize:13}}/>
                )}
              </div>
            );
          })}
        </div>

        <button className="btn btn-primary" onClick={submit}
          disabled={!activeTeamNum||submitted}
          style={{width:'100%',marginTop:18,padding:'13px',fontSize:15,justifyContent:'center',
            background:submitted?'#14532d':undefined,color:submitted?'#22c55e':undefined}}>
          {submitted?<><Check size={16}/> Saved!</>:'Submit'}
        </button>
      </div>
    </div>
  );
}
