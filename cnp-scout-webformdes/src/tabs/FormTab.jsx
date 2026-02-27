import { useState, useEffect, useRef } from 'react';
import { ClipboardList, Check, Wifi, WifiOff, Radio } from 'lucide-react';
import { fetchSheetTeams } from '../api/sheets.js';

const POLL_INTERVAL = 15000; // 15 seconds

const QUESTIONS = [
  { key:'hasAuto',    label:'Do they have an autonomous?',              type:'bool' },
  { key:'autoClose',  label:'Do they have an auto for up close?',       type:'bool' },
  { key:'autoFar',    label:'Do they have an auto for far away?',       type:'bool' },
  { key:'capacity',   label:'How many balls can they hold / take in?',  type:'num'  },
  { key:'ballsAuto',  label:'How many balls are they shooting in auto?',type:'num'  },
  { key:'leave',      label:'Do they have a leave?',                    type:'bool' },
  { key:'avgAuto',    label:'Average balls scored in auto',             type:'num'  },
  { key:'highAuto',   label:'Highest balls scored in auto',             type:'num'  },
  { key:'avgTeleop',  label:'Average balls scored in teleop',           type:'num'  },
  { key:'highTeleop', label:'Highest balls scored in teleop',           type:'num'  },
  { key:'hasGoal',    label:'Do they have a point range / goal?',       type:'bool' },
  { key:'goalDetail', label:'If so — what is their goal?',              type:'text' },
  { key:'endgame',    label:'What is their endgame plan?',              type:'text' },
];

const BLANK = {
  hasAuto:null, autoClose:null, autoFar:null, capacity:'', ballsAuto:'',
  leave:null, avgAuto:'', highAuto:'', avgTeleop:'', highTeleop:'',
  hasGoal:null, goalDetail:'', endgame:'',
};

function mergeSheetData(prev, imported) {
  const byNum = Object.fromEntries(prev.map(t => [t.teamNumber, t]));
  const updated = imported.map(imp => {
    const existing = byNum[imp.teamNumber] || {};
    return {
      ...existing,
      ...imp,
      teamName: existing.teamName || imp.teamNameFromForm || imp.teamName || '',
      humanEdits: existing.humanEdits || {},
    };
  });
  const updatedNums = new Set(updated.map(t => t.teamNumber));
  return [
    ...prev.filter(t => !updatedNums.has(t.teamNumber)),
    ...updated,
  ].sort((a,b) => (parseInt(a.stateRank)||999)-(parseInt(b.stateRank)||999));
}

export default function FormTab({ teams, setTeams, settings, setToast }) {
  const [viewTable,   setViewTable]   = useState(false);
  const [selectedTeam,setSelectedTeam]= useState('');
  const [response,    setResponse]    = useState({ ...BLANK });
  const [submitted,   setSubmitted]   = useState(false);
  const [liveStatus,  setLiveStatus]  = useState('off'); // 'off' | 'connecting' | 'live' | 'error'
  const [lastSync,    setLastSync]    = useState(null);
  const [newCount,    setNewCount]    = useState(0);
  const pollRef   = useRef(null);
  const prevCount = useRef(null);

  const csvUrl = settings?.csvUrl;

  // ── Live polling ────────────────────────────────────────────────────────────
  async function poll(showToast = false) {
    if (!csvUrl) return;
    try {
      const imported = await fetchSheetTeams(csvUrl);
      const total = imported.reduce((s,t)=>s+(t.matchCount||0),0);
      if (prevCount.current !== null && total > prevCount.current) {
        const diff = total - prevCount.current;
        setNewCount(diff);
        if (showToast) setToast({ msg:`🔴 ${diff} new submission${diff>1?'s':''} from Google Form!`, type:'ok' });
        setTimeout(()=>setNewCount(0), 4000);
      }
      prevCount.current = total;
      setTeams(prev => mergeSheetData(prev, imported));
      setLastSync(new Date());
      setLiveStatus('live');
    } catch(err) {
      setLiveStatus('error');
    }
  }

  function startLive() {
    if (!csvUrl) { setToast({ msg:'Paste your Google Sheet CSV URL in Settings first.', type:'err' }); return; }
    setLiveStatus('connecting');
    poll(false).then(() => {
      pollRef.current = setInterval(() => poll(true), POLL_INTERVAL);
    });
  }

  function stopLive() {
    clearInterval(pollRef.current);
    pollRef.current = null;
    setLiveStatus('off');
  }

  useEffect(() => () => clearInterval(pollRef.current), []);

  // ── Manual form submit ──────────────────────────────────────────────────────
  function set(key, val) { setResponse(p => ({ ...p, [key]: val })); }

  function submit() {
    if (!selectedTeam) { setToast({ msg:'Select a team first.', type:'warn' }); return; }
    setTeams(prev => prev.map(t => {
      if (t.teamNumber !== selectedTeam) return t;
      const prior = t.matchCount || 0, n = prior + 1;
      const avg = (old, nw) => {
        const o = parseFloat(old)||0, v = parseFloat(nw)||0;
        return Math.round(((o*prior)+v)/n*10)/10;
      };
      return {
        ...t,
        hasAuto:    response.hasAuto    ?? t.hasAuto,
        autoClose:  response.autoClose  ?? t.autoClose,
        autoFar:    response.autoFar    ?? t.autoFar,
        capacity:   response.capacity   || t.capacity,
        ballsAuto:  response.ballsAuto  || t.ballsAuto,
        leave:      response.leave      ?? t.leave,
        avgAuto:    avg(t.avgAuto,   response.avgAuto),
        highAuto:   Math.max(parseFloat(t.highAuto)||0, parseFloat(response.highAuto)||0)||'',
        avgTeleop:  avg(t.avgTeleop, response.avgTeleop),
        highTeleop: Math.max(parseFloat(t.highTeleop)||0, parseFloat(response.highTeleop)||0)||'',
        hasGoal:    response.hasGoal    ?? t.hasGoal,
        goalDetail: response.goalDetail ? [t.goalDetail,response.goalDetail].filter(Boolean).join(' | ') : t.goalDetail,
        endgame:    response.endgame    ? [t.endgame,response.endgame].filter(Boolean).join(' | ')       : t.endgame,
        matchCount: n, source:'form',
      };
    }));
    setSubmitted(true);
    setTimeout(()=>{ setSubmitted(false); setSelectedTeam(''); setResponse({...BLANK}); }, 1800);
  }

  const scoutedTeams = teams.filter(t => t.source==='form'||t.source==='sheet'||t.matchCount>0);
  const teamList     = teams.filter(t => t.teamNumber && t.teamName);

  // ── Status pill ─────────────────────────────────────────────────────────────
  const LivePill = () => {
    const configs = {
      off:        { color:'#3a3a3a', bg:'#1a1a1a', border:'#2a2a2a', icon:<WifiOff size={11}/>,  text:'Live Off'      },
      connecting: { color:'#eab308', bg:'#1a120a', border:'#713f12', icon:<Radio size={11}/>,     text:'Connecting…'   },
      live:       { color:'#22c55e', bg:'#0a1a0f', border:'#14532d', icon:<Wifi size={11}/>,      text:'Live'          },
      error:      { color:'#ef4444', bg:'#1a0a0a', border:'#7f1d1d', icon:<WifiOff size={11}/>,   text:'Error'         },
    };
    const c = configs[liveStatus];
    return (
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        {liveStatus==='live' && newCount>0 && (
          <span style={{ fontSize:11, fontWeight:700, color:'#f97316',
            background:'rgba(249,115,22,0.15)', border:'1px solid #f97316',
            padding:'1px 8px', borderRadius:12, animation:'pulse 0.5s ease' }}>
            +{newCount} new!
          </span>
        )}
        <div style={{
          display:'flex', alignItems:'center', gap:5,
          padding:'4px 10px', borderRadius:20, border:`1px solid ${c.border}`,
          background:c.bg, color:c.color, fontSize:11, fontWeight:700,
        }}>
          {liveStatus==='live' && (
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e',
              display:'inline-block', animation:'pulse 1.5s infinite' }}/>
          )}
          {c.icon} {c.text}
        </div>
        {liveStatus==='live' && lastSync && (
          <span style={{ fontSize:10, color:'#3a3a3a', fontFamily:'var(--font-mono)' }}>
            {lastSync.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}
          </span>
        )}
      </div>
    );
  };

  // ── Table view ──────────────────────────────────────────────────────────────
  if (viewTable) {
    const th = (color='#525252') => ({
      padding:'7px 10px', fontSize:10, fontWeight:700, textTransform:'uppercase',
      letterSpacing:'0.05em', color, borderBottom:'1px solid #1a1a1a',
      background:'#0a0a0a', position:'sticky', top:0, whiteSpace:'nowrap',
    });
    const td = { padding:'6px 10px', borderBottom:'1px solid #111', fontSize:12, verticalAlign:'middle' };
    const yn = v => v===true
      ? <span style={{color:'#22c55e',fontWeight:700}}>✓</span>
      : v===false ? <span style={{color:'#2a2a2a'}}>✗</span>
      : <span style={{color:'#1e1e1e'}}>—</span>;

    return (
      <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'10px 16px',borderBottom:'1px solid #1e1e1e',flexShrink:0,
          display:'flex',gap:10,alignItems:'center',background:'#0a0a0a',flexWrap:'wrap'}}>
          <button className="btn btn-ghost" onClick={()=>setViewTable(false)}>← Form</button>
          <LivePill/>
          {!csvUrl
            ? <span style={{fontSize:11,color:'#3a3a3a'}}>Add CSV URL in Settings to enable live sync</span>
            : liveStatus==='off'
            ? <button className="btn btn-primary" style={{fontSize:12}} onClick={startLive}>
                <Radio size={12}/> Start Live Sync
              </button>
            : <button className="btn btn-ghost" style={{fontSize:12,color:'#ef4444',borderColor:'#7f1d1d'}} onClick={stopLive}>
                Stop
              </button>
          }
          <span style={{marginLeft:'auto',fontSize:11,color:'#3a3a3a',fontFamily:'var(--font-mono)'}}>
            {scoutedTeams.length} teams · {scoutedTeams.reduce((s,t)=>s+(t.matchCount||0),0)} submissions
          </span>
        </div>
        <div style={{flex:1,overflowX:'auto',overflowY:'auto'}}>
          {!scoutedTeams.length
            ? <div className="empty"><h3>No data yet</h3><p>Start Live Sync or fill in forms manually.</p></div>
            : (
            <table style={{borderCollapse:'collapse',whiteSpace:'nowrap'}}>
              <thead>
                <tr>
                  <th style={th()}>#</th>
                  <th style={th()}>Team</th>
                  <th style={th()}>Subs</th>
                  <th style={th('#f97316')}>Auto</th>
                  <th style={th('#f97316')}>Close</th>
                  <th style={th('#f97316')}>Far</th>
                  <th style={th('#f97316')}>Leave</th>
                  <th style={th('#f97316')}>Balls Auto</th>
                  <th style={th('#f97316')}>Avg Auto</th>
                  <th style={th('#f97316')}>High Auto</th>
                  <th style={th('#60a5fa')}>Capacity</th>
                  <th style={th('#60a5fa')}>Avg TP</th>
                  <th style={th('#60a5fa')}>High TP</th>
                  <th style={th('#60a5fa')}>Has Goal</th>
                  <th style={th('#60a5fa')}>Goal</th>
                  <th style={th('#a78bfa')}>Endgame</th>
                </tr>
              </thead>
              <tbody>
                {scoutedTeams.map((t,i)=>(
                  <tr key={t.teamNumber} style={{background:i%2===0?'#0c0c0c':'#0f0f0f'}}>
                    <td style={{...td,color:'#f97316',fontFamily:'var(--font-mono)',fontWeight:700}}>#{t.teamNumber}</td>
                    <td style={td}>{t.teamName}</td>
                    <td style={{...td,color:'#525252',fontFamily:'var(--font-mono)',textAlign:'center'}}>{t.matchCount||'—'}</td>
                    <td style={{...td,textAlign:'center'}}>{yn(t.hasAuto)}</td>
                    <td style={{...td,textAlign:'center'}}>{yn(t.autoClose)}</td>
                    <td style={{...td,textAlign:'center'}}>{yn(t.autoFar)}</td>
                    <td style={{...td,textAlign:'center'}}>{yn(t.leave)}</td>
                    <td style={{...td,fontFamily:'var(--font-mono)',textAlign:'center'}}>{t.ballsAuto||'—'}</td>
                    <td style={{...td,fontFamily:'var(--font-mono)',textAlign:'center'}}>{t.avgAuto||'—'}</td>
                    <td style={{...td,fontFamily:'var(--font-mono)',textAlign:'center'}}>{t.highAuto||'—'}</td>
                    <td style={{...td,fontFamily:'var(--font-mono)',textAlign:'center'}}>{t.capacity||'—'}</td>
                    <td style={{...td,fontFamily:'var(--font-mono)',textAlign:'center'}}>{t.avgTeleop||'—'}</td>
                    <td style={{...td,fontFamily:'var(--font-mono)',textAlign:'center'}}>{t.highTeleop||'—'}</td>
                    <td style={{...td,textAlign:'center'}}>{yn(t.hasGoal)}</td>
                    <td style={{...td,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',color:'#a3a3a3'}}>{t.goalDetail||'—'}</td>
                    <td style={{...td,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',color:'#a3a3a3'}}>{t.endgame||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  // ── Manual scout form ───────────────────────────────────────────────────────
  return (
    <div style={{flex:1,overflowY:'auto'}}>
      <div style={{maxWidth:520,margin:'0 auto',padding:'20px 16px 48px'}}>

        {/* Header row */}
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
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          background:'#0a0a0a', border:'1px solid #1e1e1e',
          borderRadius:8, padding:'10px 14px', marginBottom:20,
        }}>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:'#a3a3a3',marginBottom:2}}>Google Form Live Sync</div>
            <div style={{fontSize:11,color:'#3a3a3a'}}>
              {csvUrl ? 'Auto-updates every 15s when live' : 'Add CSV URL in Settings to enable'}
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
            <LivePill/>
            {csvUrl && liveStatus==='off' && (
              <button className="btn btn-primary" style={{fontSize:11,padding:'4px 12px'}} onClick={startLive}>
                <Radio size={11}/> Go Live
              </button>
            )}
            {liveStatus==='live' && (
              <button className="btn btn-ghost" style={{fontSize:11,padding:'4px 10px',color:'#ef4444',borderColor:'#3a1f1f'}} onClick={stopLive}>
                Stop
              </button>
            )}
          </div>
        </div>

        {/* Team picker */}
        <div style={{marginBottom:20}}>
          <label>Which team are you scouting?</label>
          <select value={selectedTeam} onChange={e=>setSelectedTeam(e.target.value)}
            style={{fontSize:14,padding:'10px 12px'}}>
            <option value="">— Select a team —</option>
            {teamList.map(t=>(
              <option key={t.teamNumber} value={t.teamNumber}>
                #{t.teamNumber} — {t.teamName}
              </option>
            ))}
          </select>
        </div>

        {/* Questions */}
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {QUESTIONS.map(q => {
            if (q.key==='goalDetail' && response.hasGoal===false) return null;
            return (
              <div key={q.key} style={{background:'#0f0f0f',border:'1px solid #1e1e1e',borderRadius:8,padding:'13px 15px'}}>
                <div style={{fontSize:13,fontWeight:600,marginBottom:10,color:'#e5e5e5'}}>{q.label}</div>
                {q.type==='bool' && (
                  <div style={{display:'flex',gap:8}}>
                    {['Yes','No'].map(opt=>(
                      <button key={opt} onClick={()=>set(q.key,opt==='Yes')} style={{
                        flex:1,padding:'9px',borderRadius:6,border:'none',cursor:'pointer',
                        fontWeight:700,fontSize:13,transition:'all 0.15s',
                        background: response[q.key]===(opt==='Yes') ? (opt==='Yes'?'#14532d':'#1a0a0a') : '#1a1a1a',
                        color:      response[q.key]===(opt==='Yes') ? (opt==='Yes'?'#22c55e':'#ef4444') : '#525252',
                        outline:    response[q.key]===(opt==='Yes') ? `1px solid ${opt==='Yes'?'#22c55e':'#ef4444'}` : '1px solid transparent',
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
                  <textarea rows={2} value={response[q.key]}
                    onChange={e=>set(q.key,e.target.value)}
                    placeholder="Type here…"
                    style={{resize:'vertical',fontSize:13}}/>
                )}
              </div>
            );
          })}
        </div>

        <button className="btn btn-primary" onClick={submit}
          disabled={!selectedTeam||submitted}
          style={{width:'100%',marginTop:18,padding:'13px',fontSize:15,justifyContent:'center',
            background:submitted?'#14532d':undefined,color:submitted?'#22c55e':undefined}}>
          {submitted ? <><Check size={16}/> Saved!</> : 'Submit'}
        </button>
      </div>
    </div>
  );
}
