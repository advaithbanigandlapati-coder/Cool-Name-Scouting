import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, FileText, Archive, Printer, X, ChevronDown, ChevronUp, Globe, Download } from 'lucide-react';

function lsGet(k,fb){try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb;}catch{return fb;}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}
function getApiKey(){return lsGet('cnp_settings',{}).claudeApiKey||'';}

// ── Markdown ─────────────────────────────────────────────────────────────────
function inlineFmt(text){
  const parts=[];const re=/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last=0,m;
  while((m=re.exec(String(text)))!==null){
    if(m.index>last)parts.push(String(text).slice(last,m.index));
    const raw=m[0];
    if(raw.startsWith('**'))parts.push(<strong key={m.index} style={{color:'#fff',fontWeight:700}}>{raw.slice(2,-2)}</strong>);
    else if(raw.startsWith('*'))parts.push(<em key={m.index} style={{color:'#fbbf24'}}>{raw.slice(1,-1)}</em>);
    else parts.push(<code key={m.index} style={{background:'#1a1a1a',color:'#f97316',padding:'1px 5px',borderRadius:3,fontSize:11,fontFamily:'monospace'}}>{raw.slice(1,-1)}</code>);
    last=m.index+raw.length;
  }
  if(last<String(text).length)parts.push(String(text).slice(last));
  return parts.length>1?parts:text;
}

function Markdown({text}){
  const lines=String(text).split('\n');
  const out=[];let i=0;
  while(i<lines.length){
    const l=lines[i];
    if(l.includes('|')&&lines[i+1]?.match(/^\|[\s\-|]+\|$/)){
      const heads=l.split('|').filter(c=>c.trim()).map(c=>c.trim());i+=2;
      const rows=[];while(i<lines.length&&lines[i].includes('|')){rows.push(lines[i].split('|').filter(c=>c.trim()).map(c=>c.trim()));i++;}
      out.push(<div key={`t${i}`} style={{overflowX:'auto',margin:'10px 0'}}>
        <table style={{borderCollapse:'collapse',width:'100%',fontSize:12}}>
          <thead><tr>{heads.map((h,j)=><th key={j} style={{background:'#1e3a5f',color:'#93c5fd',padding:'7px 10px',textAlign:'left',fontWeight:700,fontSize:11,textTransform:'uppercase',whiteSpace:'nowrap'}}>{h}</th>)}</tr></thead>
          <tbody>{rows.map((r,j)=><tr key={j} style={{background:j%2===0?'#0c0c0c':'#0f0f0f'}}>{r.map((c,k)=><td key={k} style={{padding:'6px 10px',borderBottom:'1px solid #1a1a1a',color:'#d4d4d4',fontSize:12}}>{inlineFmt(c)}</td>)}</tr>)}</tbody>
        </table></div>);continue;
    }
    if(l.startsWith('### ')){out.push(<h3 key={i} style={{fontSize:13,fontWeight:700,color:'#fb923c',margin:'14px 0 5px'}}>{inlineFmt(l.slice(4))}</h3>);i++;continue;}
    if(l.startsWith('## ')){out.push(<h2 key={i} style={{fontSize:15,fontWeight:700,color:'#f97316',margin:'16px 0 6px',borderBottom:'1px solid #2a1500',paddingBottom:4}}>{inlineFmt(l.slice(3))}</h2>);i++;continue;}
    if(l.startsWith('# ')){out.push(<h1 key={i} style={{fontSize:18,fontWeight:800,color:'#f97316',margin:'10px 0 8px'}}>{inlineFmt(l.slice(2))}</h1>);i++;continue;}
    if(l.match(/^[-*] /)){
      const items=[];while(i<lines.length&&lines[i].match(/^[-*] /)){items.push(lines[i].slice(2));i++;}
      out.push(<ul key={`u${i}`} style={{margin:'6px 0 6px 16px',padding:0}}>{items.map((it,j)=><li key={j} style={{fontSize:13,color:'#d4d4d4',lineHeight:1.7,marginBottom:2}}>{inlineFmt(it)}</li>)}</ul>);continue;
    }
    if(l.match(/^\d+\. /)){
      const items=[];while(i<lines.length&&lines[i].match(/^\d+\. /)){items.push(lines[i].replace(/^\d+\. /,''));i++;}
      out.push(<ol key={`o${i}`} style={{margin:'6px 0 6px 16px',padding:0}}>{items.map((it,j)=><li key={j} style={{fontSize:13,color:'#d4d4d4',lineHeight:1.7,marginBottom:2}}>{inlineFmt(it)}</li>)}</ol>);continue;
    }
    if(l.match(/^---+$/)){out.push(<hr key={i} style={{border:'none',borderTop:'1px solid #1e1e1e',margin:'12px 0'}}/>);i++;continue;}
    if(!l.trim()){out.push(<div key={i} style={{height:6}}/>);i++;continue;}
    out.push(<p key={i} style={{fontSize:13,color:'#d4d4d4',lineHeight:1.75,margin:'2px 0'}}>{inlineFmt(l)}</p>);i++;
  }
  return <>{out}</>;
}

// ── PDF helpers ───────────────────────────────────────────────────────────────
function mdToHTML(content){
  return content
    .replace(/^### (.+)$/gm,'<h3>$1</h3>')
    .replace(/^## (.+)$/gm,'<h2>$1</h2>')
    .replace(/^# (.+)$/gm,'<h1>$1</h1>')
    .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g,'<em>$1</em>')
    .replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/^[-*] (.+)$/gm,'<li>$1</li>')
    .replace(/(<li>[^<]+<\/li>\n?)+/g,s=>`<ul>${s}</ul>`)
    .replace(/^---+$/gm,'<hr>')
    .split('\n\n').map(p=>p.startsWith('<')?p:`<p>${p}</p>`).join('\n');
}

const PRINT_CSS=`*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;color:#111;padding:40px;max-width:900px;margin:0 auto;font-size:13px}h1{font-size:22px;font-weight:800;color:#c2410c;margin:0 0 6px;padding-bottom:8px;border-bottom:3px solid #f97316}h2{font-size:16px;font-weight:700;color:#1e3a5f;margin:22px 0 8px;padding:5px 0;border-bottom:2px solid #dbeafe}h3{font-size:14px;font-weight:700;color:#374151;margin:14px 0 5px}p{line-height:1.75;margin:6px 0;color:#374151}ul,ol{margin:6px 0 6px 20px}li{line-height:1.75;margin:2px 0;color:#374151}table{width:100%;border-collapse:collapse;margin:14px 0;font-size:12px}th{background:#1e3a5f;color:#fff;padding:8px 10px;text-align:left;font-weight:700;font-size:11px;text-transform:uppercase}td{padding:7px 10px;border-bottom:1px solid #e5e7eb}tr:nth-child(even) td{background:#f8fafc}strong{font-weight:700}code{background:#f3f4f6;color:#c2410c;padding:1px 4px;border-radius:3px;font-size:11px}hr{border:none;border-top:1px solid #ddd;margin:16px 0}.meta{font-size:11px;color:#6b7280;margin:4px 0 20px}.noprint{margin-bottom:20px}@media print{.noprint{display:none}body{padding:20px}}`;

function buildFullHTML(title, content){
  return `<!DOCTYPE html><html><head><title>${title}</title><style>${PRINT_CSS}</style></head><body>
<div class="noprint">
  <button onclick="window.print()" style="background:#f97316;color:#fff;border:none;padding:10px 24px;border-radius:6px;font-weight:700;cursor:pointer;font-size:14px;margin-right:8px">🖨 Print / Save as PDF</button>
  <button onclick="window.close()" style="background:#e5e7eb;color:#111;border:none;padding:10px 18px;border-radius:6px;font-weight:700;cursor:pointer;font-size:14px">Close</button>
</div>
<h1>${title}</h1>
<div class="meta">CNP Scout AI · Team #30439 · DECODE 25-26 · ${new Date().toLocaleString()}</div>
${mdToHTML(content)}
</body></html>`;
}

function openPrint(title, content){
  const win=window.open('','_blank');
  win.document.write(buildFullHTML(title,content));
  win.document.close();
}

function downloadHTML(title, content){
  const blob=new Blob([buildFullHTML(title,content)],{type:'text/html'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`${title.replace(/[^a-z0-9]/gi,'-').toLowerCase()}.html`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── Artifact card ─────────────────────────────────────────────────────────────
function ArtifactCard({artifact,onDelete}){
  const [open,setOpen]=useState(false);
  return(
    <div style={{background:'#070d1a',border:'1px solid #1e3a5f',borderRadius:10,overflow:'hidden',marginTop:8}}>
      <div onClick={()=>setOpen(p=>!p)}
        style={{padding:'9px 14px',background:'#0d1525',display:'flex',alignItems:'center',gap:8,cursor:'pointer',userSelect:'none'}}>
        <FileText size={13} color="#60a5fa"/>
        <span style={{fontSize:12,fontWeight:700,color:'#93c5fd',flex:1}}>{artifact.title}</span>
        <div style={{display:'flex',gap:5,alignItems:'center'}} onClick={e=>e.stopPropagation()}>
          <button onClick={()=>openPrint(artifact.title,artifact.content)}
            style={{display:'flex',alignItems:'center',gap:3,background:'#1e3a5f',color:'#60a5fa',border:'none',padding:'4px 9px',borderRadius:5,cursor:'pointer',fontSize:11,fontWeight:700}}>
            <Printer size={10}/> Print
          </button>
          <button onClick={()=>downloadHTML(artifact.title,artifact.content)}
            style={{display:'flex',alignItems:'center',gap:3,background:'#14532d',color:'#4ade80',border:'none',padding:'4px 9px',borderRadius:5,cursor:'pointer',fontSize:11,fontWeight:700}}>
            <Download size={10}/> Download
          </button>
          {onDelete&&<button onClick={onDelete}
            style={{background:'none',border:'none',color:'#3a3a3a',cursor:'pointer',padding:2,lineHeight:1}}>
            <X size={12}/></button>}
        </div>
        <span style={{color:'#3a3a3a',marginLeft:4}}>{open?<ChevronUp size={13}/>:<ChevronDown size={13}/>}</span>
      </div>
      {open&&<div style={{padding:'12px 14px',borderTop:'1px solid #0f1a2e'}}>
        <Markdown text={artifact.content}/>
      </div>}
    </div>
  );
}

// ── Archive sidebar ───────────────────────────────────────────────────────────
function ArchivePanel({onClose,onLoad}){
  const sessions=lsGet('cnp_chat_archive',[]);
  return(
    <div style={{position:'absolute',top:0,right:0,bottom:0,width:300,background:'#080808',borderLeft:'1px solid #1e1e1e',zIndex:10,display:'flex',flexDirection:'column'}}>
      <div style={{padding:'12px 16px',borderBottom:'1px solid #1e1e1e',display:'flex',alignItems:'center',gap:8}}>
        <Archive size={14} color="#f97316"/>
        <span style={{fontSize:13,fontWeight:700,color:'#a3a3a3',flex:1}}>Chat Archive</span>
        <button onClick={onClose} style={{background:'none',border:'none',color:'#525252',cursor:'pointer'}}><X size={14}/></button>
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {!sessions.length
          ?<div style={{padding:24,color:'#3a3a3a',fontSize:12,textAlign:'center'}}>No saved sessions yet.</div>
          :sessions.map((s,i)=>(
            <button key={i} onClick={()=>{onLoad(s.messages);onClose();}}
              style={{width:'100%',background:'none',border:'none',borderBottom:'1px solid #0f0f0f',padding:'12px 16px',cursor:'pointer',textAlign:'left',color:'var(--text)'}}>
              <div style={{fontSize:12,fontWeight:600,color:'#a3a3a3',marginBottom:3}}>
                {new Date(s.timestamp).toLocaleString([],{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
              </div>
              <div style={{fontSize:11,color:'#3a3a3a',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                {s.messages.find(m=>m.role==='user')?.content?.slice(0,60)||'Session'}
              </div>
            </button>
          ))
        }
      </div>
    </div>
  );
}

// ── Reports sidebar ────────────────────────────────────────────────────────────
function ReportsPanel({reports,onClose,onDelete}){
  return(
    <div style={{position:'absolute',top:0,left:0,bottom:0,width:290,background:'#080808',borderRight:'1px solid #1e1e1e',zIndex:10,display:'flex',flexDirection:'column'}}>
      <div style={{padding:'12px 16px',borderBottom:'1px solid #1e1e1e',display:'flex',alignItems:'center',gap:8}}>
        <FileText size={14} color="#60a5fa"/>
        <span style={{fontSize:13,fontWeight:700,color:'#a3a3a3',flex:1}}>Reports</span>
        <button onClick={onClose} style={{background:'none',border:'none',color:'#525252',cursor:'pointer'}}><X size={14}/></button>
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {!reports.length
          ?<div style={{padding:24,color:'#3a3a3a',fontSize:12,textAlign:'center'}}>No reports yet.<br/>Ask for a "strategy report" or "alliance analysis".</div>
          :reports.map((r,i)=>(
            <div key={i} style={{borderBottom:'1px solid #0f0f0f',padding:'10px 14px'}}>
              <div style={{fontSize:12,fontWeight:600,color:'#93c5fd',marginBottom:3}}>{r.title}</div>
              <div style={{fontSize:10,color:'#3a3a3a',marginBottom:8}}>{new Date(r.timestamp).toLocaleString([],{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
              <div style={{display:'flex',gap:5'}}>
                <button onClick={()=>openPrint(r.title,r.content)}
                  style={{display:'flex',alignItems:'center',gap:3,background:'#0d1525',color:'#60a5fa',border:'1px solid #1e3a5f',padding:'4px 9px',borderRadius:5,cursor:'pointer',fontSize:11,fontWeight:700}}>
                  <Printer size={10}/> Print
                </button>
                <button onClick={()=>downloadHTML(r.title,r.content)}
                  style={{display:'flex',alignItems:'center',gap:3,background:'#0a1a10',color:'#4ade80',border:'1px solid #14532d',padding:'4px 9px',borderRadius:5,cursor:'pointer',fontSize:11,fontWeight:700}}>
                  <Download size={10}/> Download
                </button>
                <button onClick={()=>onDelete(i)}
                  style={{background:'none',border:'none',color:'#3a3a3a',cursor:'pointer',padding:'4px'}}>
                  <X size={11}/>
                </button>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ChatTab({teams,mine,settings}){
  const initMsg={role:'assistant',content:`Ready. I have data on **${teams.length} teams**. I can search the web for current info and generate printable strategy reports on request.`};
  const [messages,    setMessages]    = useState([initMsg]);
  const [reports,     setReports]     = useState(()=>lsGet('cnp_chat_pdfs',[]));
  const [input,       setInput]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [searching,   setSearching]   = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const bottomRef=useRef(null);
  const inputRef=useRef(null);

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth'});},[messages]);

  const SYSTEM=`You are CNP Scout AI for FTC team #${mine?.teamNumber||30439} (Cool Name Pending), DECODE 25-26. Answer any question directly with real numbers and decisive recommendations. Use web_search to look up current FTCScout.com data, recent match results, team pages, or any info that might be outdated — always prefer fresh web data over stored stats when relevant.

ONLY generate a structured markdown report (with # headers and tables) when the user explicitly asks for a report, analysis document, or printable output. For regular questions, respond conversationally.

OUR ROBOT (#${mine?.teamNumber||30439}): 12 auto artifacts, 25 teleop, close+far auto, full base return.

TEAM DATA:
${teams.map(t=>`#${t.teamNumber} ${t.teamName||'?'}: rank=${t.stateRank||'?'} wlt=${t.wlt||'?'} pts=${t.matchPoints||'?'} high=${t.highScore||'?'} opr=${t.opr||'?'} epa=${t.epa||'?'} rs=${t.rs||'?'} tier=${t.tier||'?'} compat=${t.compatScore||'?'}% target=${!!t.allianceTarget} hasAuto=${t.hasAuto} closeAuto=${t.autoClose} farAuto=${t.autoFar} leave=${t.leave} readsMotif=${t.readsMotif} autoArt=${t.autoArtifacts||t.avgAuto||'?'} tpArt=${t.teleopArtifacts||t.avgTeleop||'?'} shoots=${t.canShoot} range=${t.shootRange||'?'} motifPri=${t.motifPriority} defense=${t.playsDefense} park=${t.parkType||t.endgame||'?'} notes="${t.stratNotes||t.notes||t.scoutNotes||''}" with="${(t.withTips||[]).join(';')}" against="${(t.againstTips||[]).join(';')}"`)
.join('\n')}`;

  function saveArchive(msgs){
    const a=lsGet('cnp_chat_archive',[]);
    a.unshift({timestamp:Date.now(),messages:msgs});
    lsSet('cnp_chat_archive',a.slice(0,20));
  }

  function maybeExtractReport(content){
    if(!content.match(/^#\s/m))return;
    const titleMatch=content.match(/^#\s+(.+)$/m);
    const title=titleMatch?titleMatch[1].trim():`Report — ${new Date().toLocaleDateString()}`;
    const report={title,content,timestamp:Date.now()};
    setReports(prev=>{const next=[report,...prev].slice(0,30);lsSet('cnp_chat_pdfs',next);return next;});
    return report;
  }

  async function send(){
    const text=input.trim();
    if(!text||loading)return;
    const apiKey=getApiKey();
    if(!apiKey){
      setMessages(p=>[...p,{role:'user',content:text},{role:'assistant',content:'⚠️ **No API key.** Go to **Settings → Claude API Key**.'}]);
      setInput('');return;
    }
    setInput('');
    const history=[...messages,{role:'user',content:text}];
    setMessages(history);
    setLoading(true);setSearching(false);
    try{
      const res=await fetch('/api/analyze',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          model:'claude-sonnet-4-20250514',
          max_tokens:2000,
          tools:[{type:'web_search_20250305',name:'web_search'}],
          system:SYSTEM,
          messages:history.slice(-20),
        }),
      });
      const data=await res.json();
      if(data.error)throw new Error(data.error.message||JSON.stringify(data.error));
      const searched=data.content?.some(b=>b.type==='tool_use'&&b.name==='web_search');
      if(searched)setSearching(true);
      const reply=data.content?.filter(b=>b.type==='text').map(b=>b.text).join('')||'No response.';
      const final=[...history,{role:'assistant',content:reply,searched}];
      setMessages(final);
      saveArchive(final);
      maybeExtractReport(reply);
    }catch(e){
      setMessages(p=>[...p,{role:'assistant',content:`**Error:** ${e.message}`}]);
    }finally{
      setLoading(false);setSearching(false);
      setTimeout(()=>inputRef.current?.focus(),50);
    }
  }

  return(
    <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column',position:'relative'}}>

      {/* Header */}
      <div style={{padding:'10px 16px',borderBottom:'1px solid #1e1e1e',background:'#0a0a0a',display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
        <span style={{fontSize:13,fontWeight:600,color:'#a3a3a3'}}>Scout AI</span>
        <span style={{fontSize:11,color:'#3a3a3a',fontFamily:'var(--font-mono)'}}>{teams.length} teams · web search on</span>
        {!getApiKey()&&<span style={{fontSize:11,color:'#ef4444'}}>⚠ Set API key in Settings</span>}
        <div style={{marginLeft:'auto',display:'flex',gap:6}}>
          <button className="btn btn-ghost" style={{fontSize:11}} onClick={()=>{setShowReports(p=>!p);setShowArchive(false);}}>
            <FileText size={11}/> Reports{reports.length>0?` (${reports.length})`:''}
          </button>
          <button className="btn btn-ghost" style={{fontSize:11}} onClick={()=>{setShowArchive(p=>!p);setShowReports(false);}}>
            <Archive size={11}/> Archive
          </button>
          <button className="btn btn-ghost" style={{fontSize:11,color:'#3a3a3a'}}
            onClick={()=>{saveArchive(messages);setMessages([initMsg]);}}>
            <Trash2 size={11}/>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:12}}>
        {messages.map((m,i)=>{
          const isReport=m.role==='assistant'&&m.content.match(/^#\s/m);
          const savedReport=isReport?reports.find(r=>r.content===m.content):null;
          return(
            <div key={i}>
              <div style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                <div style={{
                  maxWidth:'88%',
                  background:m.role==='user'?'#1a0f00':'#0f0f0f',
                  border:`1px solid ${m.role==='user'?'#7c2d12':'#1e1e1e'}`,
                  borderRadius:m.role==='user'?'18px 18px 4px 18px':'4px 18px 18px 18px',
                  padding:'11px 15px',
                }}>
                  {m.searched&&<div style={{display:'flex',alignItems:'center',gap:5,marginBottom:8,fontSize:11,color:'#60a5fa',fontWeight:600}}><Globe size={11}/> Searched the web</div>}
                  {m.role==='user'
                    ?<p style={{fontSize:13,color:'#fed7aa',lineHeight:1.7,margin:0}}>{m.content}</p>
                    :<Markdown text={m.content}/>
                  }
                </div>
              </div>
              {savedReport&&<ArtifactCard artifact={savedReport} onDelete={()=>{
                setReports(p=>{const n=p.filter(r=>r!==savedReport);lsSet('cnp_chat_pdfs',n);return n;});
              }}/>}
            </div>
          );
        })}

        {loading&&(
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {searching&&<div style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:'#60a5fa',paddingLeft:4}}><Globe size={11}/><span>Searching the web…</span></div>}
            <div style={{background:'#0f0f0f',border:'1px solid #1e1e1e',borderRadius:'4px 18px 18px 18px',padding:'12px 18px',display:'flex',gap:5,alignItems:'center',width:'fit-content'}}>
              {[0,1,2].map(j=><span key={j} style={{width:7,height:7,borderRadius:'50%',background:'#f97316',display:'inline-block',animation:`pulse 1s ${j*0.25}s infinite`}}/>)}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Quick prompts */}
      {messages.length===1&&(
        <div style={{padding:'0 16px 10px',display:'flex',gap:6,flexWrap:'wrap'}}>
          {['Best alliance picks?','Break down team 755','Who plays defense?','Generate alliance strategy report'].map(p=>(
            <button key={p} onClick={()=>{setInput(p);setTimeout(()=>inputRef.current?.focus(),50);}}
              style={{fontSize:11,background:'#0f0f0f',border:'1px solid #1e1e1e',color:'#a3a3a3',padding:'5px 12px',borderRadius:20,cursor:'pointer',fontFamily:'var(--font-body)'}}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{padding:'12px 16px',borderTop:'1px solid #1e1e1e',background:'#080808',display:'flex',gap:8,alignItems:'center',flexShrink:0}}>
        <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}}
          placeholder="Ask anything… say 'generate a report' for a printable PDF"
          disabled={loading}
          style={{flex:1,fontSize:13,padding:'10px 16px',borderRadius:24,background:'#0f0f0f',border:'1px solid #2a2a2a'}}/>
        <button onClick={send} disabled={!input.trim()||loading} style={{
          width:44,height:44,borderRadius:'50%',border:'none',cursor:'pointer',flexShrink:0,
          background:input.trim()&&!loading?'#f97316':'#1a1a1a',
          color:input.trim()&&!loading?'#000':'#3a3a3a',
          display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}}>
          <Send size={16}/>
        </button>
      </div>

      {showArchive&&<ArchivePanel onClose={()=>setShowArchive(false)} onLoad={msgs=>{setMessages(msgs);}}/>}
      {showReports&&<ReportsPanel reports={reports} onClose={()=>setShowReports(false)} onDelete={i=>{
        setReports(p=>{const n=[...p];n.splice(i,1);lsSet('cnp_chat_pdfs',n);return n;});
      }}/>}
    </div>
  );
}
