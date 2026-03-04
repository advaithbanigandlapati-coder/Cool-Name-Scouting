import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, FileText, Archive, Printer, X, ChevronRight, Globe } from 'lucide-react';

// ── Storage helpers ──────────────────────────────────────────────────────────
function lsGet(k, fb) { try { const v=localStorage.getItem(k); return v?JSON.parse(v):fb; } catch{return fb;} }
function lsSet(k, v)  { try { localStorage.setItem(k,JSON.stringify(v)); } catch{} }
function getApiKey()  { return lsGet('cnp_settings',{}).claudeApiKey||''; }

// ── Markdown renderer ────────────────────────────────────────────────────────
function Markdown({ text }) {
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Table detection
    if (line.includes('|') && lines[i+1]?.match(/^\|[\s\-\|]+\|$/)) {
      const rows = [];
      const headers = line.split('|').filter(c=>c.trim()).map(c=>c.trim());
      i += 2; // skip separator
      while (i < lines.length && lines[i].includes('|')) {
        rows.push(lines[i].split('|').filter(c=>c.trim()).map(c=>c.trim()));
        i++;
      }
      elements.push(
        <div key={i} style={{overflowX:'auto',margin:'10px 0'}}>
          <table style={{borderCollapse:'collapse',width:'100%',fontSize:12}}>
            <thead>
              <tr>{headers.map((h,j)=><th key={j} style={{background:'#1e3a5f',color:'#93c5fd',padding:'7px 10px',textAlign:'left',fontWeight:700,fontSize:11,textTransform:'uppercase',letterSpacing:'0.04em',whiteSpace:'nowrap'}}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row,j)=><tr key={j} style={{background:j%2===0?'#0c0c0c':'#0f0f0f'}}>
                {row.map((cell,k)=><td key={k} style={{padding:'6px 10px',borderBottom:'1px solid #1a1a1a',color:'#d4d4d4',fontSize:12}}>{cell}</td>)}
              </tr>)}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Headings
    if (line.startsWith('### ')) { elements.push(<h3 key={i} style={{fontSize:13,fontWeight:700,color:'#fb923c',margin:'14px 0 5px'}}>{line.slice(4)}</h3>); i++; continue; }
    if (line.startsWith('## '))  { elements.push(<h2 key={i} style={{fontSize:15,fontWeight:700,color:'#f97316',margin:'16px 0 6px',borderBottom:'1px solid #2a1500',paddingBottom:4}}>{line.slice(3)}</h2>); i++; continue; }
    if (line.startsWith('# '))   { elements.push(<h1 key={i} style={{fontSize:18,fontWeight:800,color:'#f97316',margin:'10px 0 8px'}}>{line.slice(2)}</h1>); i++; continue; }

    // Bullets
    if (line.match(/^[\-\*] /)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^[\-\*] /)) {
        items.push(lines[i].slice(2)); i++;
      }
      elements.push(<ul key={i} style={{margin:'6px 0 6px 16px',padding:0}}>
        {items.map((it,j)=><li key={j} style={{fontSize:13,color:'#d4d4d4',lineHeight:1.7,marginBottom:2}}>{inlineFormat(it)}</li>)}
      </ul>);
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\. /)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(lines[i].replace(/^\d+\. /,'')); i++;
      }
      elements.push(<ol key={i} style={{margin:'6px 0 6px 16px',padding:0}}>
        {items.map((it,j)=><li key={j} style={{fontSize:13,color:'#d4d4d4',lineHeight:1.7,marginBottom:2}}>{inlineFormat(it)}</li>)}
      </ol>);
      continue;
    }

    // Horizontal rule
    if (line.match(/^---+$/)) { elements.push(<hr key={i} style={{border:'none',borderTop:'1px solid #1e1e1e',margin:'12px 0'}}/>); i++; continue; }

    // Empty line
    if (!line.trim()) { elements.push(<div key={i} style={{height:6}}/>); i++; continue; }

    // Normal paragraph
    elements.push(<p key={i} style={{fontSize:13,color:'#d4d4d4',lineHeight:1.75,margin:'2px 0'}}>{inlineFormat(line)}</p>);
    i++;
  }
  return <div>{elements}</div>;
}

function inlineFormat(text) {
  // **bold**, *italic*, `code`
  const parts = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const raw = m[0];
    if (raw.startsWith('**')) parts.push(<strong key={m.index} style={{color:'#fff',fontWeight:700}}>{raw.slice(2,-2)}</strong>);
    else if (raw.startsWith('*')) parts.push(<em key={m.index} style={{color:'#fbbf24'}}>{raw.slice(1,-1)}</em>);
    else parts.push(<code key={m.index} style={{background:'#1a1a1a',color:'#f97316',padding:'1px 5px',borderRadius:3,fontSize:11,fontFamily:'monospace'}}>{raw.slice(1,-1)}</code>);
    last = m.index + raw.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 1 ? parts : text;
}

// ── PDF printing ─────────────────────────────────────────────────────────────
function buildPrintHTML(title, content) {
  // Convert markdown-ish content to clean print HTML
  const html = content
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, s => `<ul>${s}</ul>`)
    .replace(/^---+$/gm, '<hr>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul]|<hr)(.+)$/gm, '<p>$1</p>');

  return `<!DOCTYPE html><html><head><title>${title}</title><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;color:#111;padding:40px;max-width:900px;margin:0 auto;font-size:13px}
    h1{font-size:22px;font-weight:800;color:#c2410c;margin:0 0 6px;padding-bottom:8px;border-bottom:3px solid #f97316}
    h2{font-size:16px;font-weight:700;color:#1e3a5f;margin:22px 0 8px;padding:5px 0;border-bottom:2px solid #dbeafe}
    h3{font-size:14px;font-weight:700;color:#374151;margin:14px 0 5px}
    p{line-height:1.75;margin:6px 0;color:#374151}
    ul,ol{margin:6px 0 6px 20px;padding:0}
    li{line-height:1.75;margin:2px 0;color:#374151}
    table{width:100%;border-collapse:collapse;margin:14px 0;font-size:12px}
    th{background:#1e3a5f;color:#fff;padding:8px 10px;text-align:left;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.05em}
    td{padding:7px 10px;border-bottom:1px solid #e5e7eb;vertical-align:top}
    tr:nth-child(even) td{background:#f8fafc}
    strong{font-weight:700;color:#111}
    em{color:#92400e;font-style:italic}
    hr{border:none;border-top:1px solid #ddd;margin:16px 0}
    .header-meta{font-size:11px;color:#6b7280;margin:4px 0 20px}
    .no-print{margin-bottom:20px}
    @media print{.no-print{display:none}body{padding:20px}}
  </style></head><body>
  <div class="no-print">
    <button onclick="window.print()" style="background:#f97316;color:#fff;border:none;padding:10px 24px;border-radius:6px;font-weight:700;cursor:pointer;font-size:14px;margin-right:8px">🖨 Print / Save PDF</button>
    <button onclick="window.close()" style="background:#e5e7eb;color:#111;border:none;padding:10px 18px;border-radius:6px;font-weight:700;cursor:pointer;font-size:14px">Close</button>
  </div>
  <h1>${title}</h1>
  <div class="header-meta">Generated by CNP Scout AI · Team #30439 · DECODE 25-26 · ${new Date().toLocaleString()}</div>
  ${html}
  </body></html>`;
}

function openPrint(title, content) {
  const win = window.open('','_blank');
  win.document.write(buildPrintHTML(title, content));
  win.document.close();
}

// ── Artifact card ─────────────────────────────────────────────────────────────
function ArtifactCard({ artifact, onDelete }) {
  return (
    <div style={{background:'#070d1a',border:'1px solid #1e3a5f',borderRadius:10,overflow:'hidden',marginTop:8}}>
      <div style={{padding:'9px 14px',background:'#0d1525',display:'flex',alignItems:'center',gap:8}}>
        <FileText size={13} color="#60a5fa"/>
        <span style={{fontSize:12,fontWeight:700,color:'#93c5fd',flex:1}}>{artifact.title}</span>
        <button onClick={()=>openPrint(artifact.title, artifact.content)}
          style={{display:'flex',alignItems:'center',gap:4,background:'#1e3a5f',
            color:'#60a5fa',border:'none',padding:'4px 10px',borderRadius:6,
            cursor:'pointer',fontSize:11,fontWeight:700}}>
          <Printer size={10}/> Print / PDF
        </button>
        {onDelete && <button onClick={onDelete}
          style={{background:'none',border:'none',color:'#3a3a3a',cursor:'pointer',marginLeft:4,padding:2,lineHeight:1}}>
          <X size={12}/>
        </button>}
      </div>
      <div style={{padding:'10px 14px',maxHeight:160,overflowY:'auto'}}>
        <Markdown text={artifact.content.slice(0,600)+(artifact.content.length>600?'\n\n*…scroll to see full report in print view*':'')}/>
      </div>
    </div>
  );
}

// ── Archive panel ─────────────────────────────────────────────────────────────
function ArchivePanel({ onClose, onLoad }) {
  const [sessions] = useState(()=>lsGet('cnp_chat_archive',[]));
  return (
    <div style={{position:'absolute',top:0,right:0,bottom:0,width:300,background:'#080808',
      borderLeft:'1px solid #1e1e1e',zIndex:10,display:'flex',flexDirection:'column'}}>
      <div style={{padding:'12px 16px',borderBottom:'1px solid #1e1e1e',display:'flex',alignItems:'center',gap:8}}>
        <Archive size={14} color="#f97316"/>
        <span style={{fontSize:13,fontWeight:700,color:'#a3a3a3',flex:1}}>Chat Archive</span>
        <button onClick={onClose} style={{background:'none',border:'none',color:'#525252',cursor:'pointer'}}><X size={14}/></button>
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {!sessions.length
          ? <div style={{padding:24,color:'#3a3a3a',fontSize:12,textAlign:'center'}}>No saved sessions yet.</div>
          : sessions.map((s,i)=>(
            <button key={i} onClick={()=>{onLoad(s.messages); onClose();}}
              style={{width:'100%',background:'none',border:'none',borderBottom:'1px solid #0f0f0f',
                padding:'12px 16px',cursor:'pointer',textAlign:'left',color:'var(--text)'}}>
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

// ── PDF list sidebar ──────────────────────────────────────────────────────────
function PDFList({ pdfs, onOpen, onClose }) {
  return (
    <div style={{position:'absolute',top:0,left:0,bottom:0,width:280,background:'#080808',
      borderRight:'1px solid #1e1e1e',zIndex:10,display:'flex',flexDirection:'column'}}>
      <div style={{padding:'12px 16px',borderBottom:'1px solid #1e1e1e',display:'flex',alignItems:'center',gap:8}}>
        <FileText size={14} color="#60a5fa"/>
        <span style={{fontSize:13,fontWeight:700,color:'#a3a3a3',flex:1}}>Saved Reports</span>
        <button onClick={onClose} style={{background:'none',border:'none',color:'#525252',cursor:'pointer'}}><X size={14}/></button>
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {!pdfs.length
          ? <div style={{padding:24,color:'#3a3a3a',fontSize:12,textAlign:'center'}}>No reports yet.<br/>Ask the AI to generate a strategy report.</div>
          : pdfs.map((p,i)=>(
            <div key={i} style={{borderBottom:'1px solid #0f0f0f',padding:'10px 14px'}}>
              <div style={{fontSize:12,fontWeight:600,color:'#93c5fd',marginBottom:4}}>{p.title}</div>
              <div style={{fontSize:10,color:'#3a3a3a',marginBottom:6}}>
                {new Date(p.timestamp).toLocaleString([],{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
              </div>
              <button onClick={()=>openPrint(p.title,p.content)}
                style={{display:'flex',alignItems:'center',gap:4,background:'#0d1525',
                  color:'#60a5fa',border:'1px solid #1e3a5f',padding:'4px 10px',
                  borderRadius:6,cursor:'pointer',fontSize:11,fontWeight:700}}>
                <Printer size={10}/> Print / PDF
              </button>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ── Main ChatTab ──────────────────────────────────────────────────────────────
export default function ChatTab({ teams, mine, settings }) {
  const initMsg = { role:'assistant', content:`Ready. I have data on **${teams.length} teams**. Ask me anything — alliance strategy, specific team breakdowns, matchup analysis, or say **"generate a strategy report"** for a printable PDF.` };

  const [messages,     setMessages]     = useState([initMsg]);
  const [artifacts,    setArtifacts]    = useState(()=>lsGet('cnp_chat_pdfs',[]));
  const [input,        setInput]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [searching,    setSearching]    = useState(false);
  const [showArchive,  setShowArchive]  = useState(false);
  const [showPDFs,     setShowPDFs]     = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}); }, [messages]);

  const systemPrompt = `You are CNP Scout AI — the scouting assistant for FTC team #${mine?.teamNumber||30439} (Cool Name Pending) at DECODE 25-26. You have full scouting data for every team. Answer any question with real specifics, reference actual numbers, give decisive recommendations. Use web_search to look up current FTCScout data, recent match results, or anything beyond your training data.

When asked to generate a report/PDF/printable, format your response in clean markdown with headers (##), tables (using | pipe syntax), and bullet points. Start with a clear title using # and make it comprehensive and print-ready.

OUR ROBOT (#${mine?.teamNumber||30439}): 12 auto artifacts, 25 teleop, close+far auto, full base return.

TEAM DATA:
${teams.map(t=>`#${t.teamNumber} ${t.teamName||'?'}: rank=${t.stateRank||'?'} wlt=${t.wlt||'?'} pts=${t.matchPoints||'?'} high=${t.highScore||'?'} opr=${t.opr||'?'} epa=${t.epa||'?'} rs=${t.rs||'?'} tier=${t.tier||'?'} compat=${t.compatScore||'?'}% target=${!!t.allianceTarget} hasAuto=${t.hasAuto} closeAuto=${t.autoClose} farAuto=${t.autoFar} leave=${t.leave} readsMotif=${t.readsMotif} autoArt=${t.autoArtifacts||t.avgAuto||'?'} tpArt=${t.teleopArtifacts||t.avgTeleop||'?'} shoots=${t.canShoot} range=${t.shootRange||'?'} motifPri=${t.motifPriority} defense=${t.playsDefense} park=${t.parkType||t.endgame||'?'} notes="${t.stratNotes||t.notes||t.scoutNotes||''}" with="${(t.withTips||[]).join(';')}" against="${(t.againstTips||[]).join(';')}"`)
.join('\n')}`;

  function saveToArchive(msgs) {
    const archive = lsGet('cnp_chat_archive',[]);
    archive.unshift({ timestamp:Date.now(), messages:msgs });
    lsSet('cnp_chat_archive', archive.slice(0,20));
  }

  function detectAndSaveArtifact(content) {
    // If response looks like a report (has # heading), save as artifact
    if (!content.match(/^#\s/m) && !content.match(/^##\s/m)) return null;
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : `Report — ${new Date().toLocaleDateString()}`;
    const artifact = { title, content, timestamp:Date.now() };
    setArtifacts(prev => {
      const next = [artifact, ...prev].slice(0,30);
      lsSet('cnp_chat_pdfs', next);
      return next;
    });
    return artifact;
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const apiKey = getApiKey();
    if (!apiKey) {
      setMessages(p=>[...p,{role:'user',content:text},{role:'assistant',content:'⚠️ **No API key set.** Go to **Settings → Claude API Key** and paste your key from console.anthropic.com'}]);
      setInput(''); return;
    }

    setInput('');
    const newMsg = { role:'user', content:text };
    const history = [...messages, newMsg];
    setMessages(history);
    setLoading(true);
    setSearching(false);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{
          'content-type':'application/json',
          'x-api-key': apiKey,
          'anthropic-version':'2023-06-01',
          'anthropic-dangerous-direct-browser-access':'true',
        },
        body: JSON.stringify({
          model:'claude-sonnet-4-20250514',
          max_tokens:2000,
          tools:[{ type:'web_search_20250305', name:'web_search' }],
          system: systemPrompt,
          messages: history.slice(-20),
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      // Check if it searched
      const searched = data.content?.some(b=>b.type==='tool_use'&&b.name==='web_search');
      if (searched) setSearching(true);

      const reply = data.content?.filter(b=>b.type==='text').map(b=>b.text).join('') || 'No response.';
      const finalMessages = [...history, { role:'assistant', content:reply, searched }];
      setMessages(finalMessages);
      saveToArchive(finalMessages);
      detectAndSaveArtifact(reply);

    } catch(e) {
      setMessages(p=>[...p,{role:'assistant',content:`**Error:** ${e.message}`}]);
    } finally {
      setLoading(false);
      setSearching(false);
      setTimeout(()=>inputRef.current?.focus(), 50);
    }
  }

  return (
    <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column',position:'relative'}}>

      {/* Header */}
      <div style={{padding:'10px 16px',borderBottom:'1px solid #1e1e1e',background:'#0a0a0a',
        display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
        <span style={{fontSize:13,fontWeight:600,color:'#a3a3a3'}}>Scout AI</span>
        <span style={{fontSize:11,color:'#3a3a3a',fontFamily:'var(--font-mono)'}}>{teams.length} teams · v2: report and webscrape</span>
        {!getApiKey() && <span style={{fontSize:11,color:'#ef4444'}}>⚠ Set API key in Settings</span>}
        <div style={{marginLeft:'auto',display:'flex',gap:6}}>
          <button className="btn btn-ghost" style={{fontSize:11,gap:4}} onClick={()=>{setShowPDFs(p=>!p);setShowArchive(false);}}>
            <FileText size={11}/> Reports {artifacts.length>0&&`(${artifacts.length})`}
          </button>
          <button className="btn btn-ghost" style={{fontSize:11,gap:4}} onClick={()=>{setShowArchive(p=>!p);setShowPDFs(false);}}>
            <Archive size={11}/> Archive
          </button>
          <button className="btn btn-ghost" style={{fontSize:11,color:'#3a3a3a'}}
            onClick={()=>{saveToArchive(messages);setMessages([initMsg]);}}>
            <Trash2 size={11}/>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:'auto',padding:'16px',display:'flex',flexDirection:'column',gap:12}}>
        {messages.map((m,i)=>(
          <div key={i}>
            <div style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
              <div style={{
                maxWidth:'88%',
                background:   m.role==='user'?'#1a0f00':'#0f0f0f',
                border:       m.role==='user'?'1px solid #7c2d12':'1px solid #1e1e1e',
                borderRadius: m.role==='user'?'18px 18px 4px 18px':'4px 18px 18px 18px',
                padding:'11px 15px',
              }}>
                {m.searched && (
                  <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:8,
                    fontSize:11,color:'#60a5fa',fontWeight:600}}>
                    <Globe size={11}/> Searched the web
                  </div>
                )}
                {m.role==='user'
                  ? <p style={{fontSize:13,color:'#fed7aa',lineHeight:1.7,margin:0}}>{m.content}</p>
                  : <Markdown text={m.content}/>
                }
              </div>
            </div>
            {/* Artifact card below AI message if it was a report */}
            {m.role==='assistant' && (() => {
              const saved = artifacts.find(a=>m.content.includes(a.content?.slice(0,40)));
              return saved ? <ArtifactCard artifact={saved} onDelete={()=>{
                setArtifacts(p=>{const n=p.filter(x=>x!==saved);lsSet('cnp_chat_pdfs',n);return n;});
              }}/> : null;
            })()}
          </div>
        ))}

        {loading && (
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {searching && (
              <div style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:'#60a5fa',paddingLeft:4}}>
                <Globe size={11}/> <span style={{animation:'pulse 1s infinite'}}>Searching the web…</span>
              </div>
            )}
            <div style={{background:'#0f0f0f',border:'1px solid #1e1e1e',
              borderRadius:'4px 18px 18px 18px',padding:'12px 18px',display:'flex',gap:5,alignItems:'center',width:'fit-content'}}>
              {[0,1,2].map(i=><span key={i} style={{width:7,height:7,borderRadius:'50%',background:'#f97316',
                display:'inline-block',animation:`pulse 1s ${i*0.25}s infinite`}}/>)}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Quick prompts */}
      {messages.length===1 && (
        <div style={{padding:'0 16px 12px',display:'flex',gap:6,flexWrap:'wrap'}}>
          {['Who are our best alliance picks?','Break down team 755','Which teams play defense?','Generate a full strategy report'].map(p=>(
            <button key={p} onClick={()=>{setInput(p);setTimeout(()=>inputRef.current?.focus(),50);}}
              style={{fontSize:11,background:'#0f0f0f',border:'1px solid #1e1e1e',color:'#a3a3a3',
                padding:'6px 12px',borderRadius:20,cursor:'pointer',fontFamily:'var(--font-body)'}}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{padding:'12px 16px',borderTop:'1px solid #1e1e1e',background:'#080808',
        display:'flex',gap:8,alignItems:'center',flexShrink:0}}>
        <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}}
          placeholder="Ask anything…"
          disabled={loading}
          style={{flex:1,fontSize:13,padding:'10px 16px',borderRadius:24,
            background:'#0f0f0f',border:'1px solid #2a2a2a'}}/>
        <button onClick={send} disabled={!input.trim()||loading} style={{
          width:44,height:44,borderRadius:'50%',border:'none',cursor:'pointer',flexShrink:0,
          background:input.trim()&&!loading?'#f97316':'#1a1a1a',
          color:input.trim()&&!loading?'#000':'#3a3a3a',
          display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}}>
          <Send size={16}/>
        </button>
      </div>

      {/* Sidebars */}
      {showArchive && <ArchivePanel onClose={()=>setShowArchive(false)} onLoad={msgs=>{setMessages(msgs);}}/>}
      {showPDFs    && <PDFList pdfs={artifacts} onClose={()=>setShowPDFs(false)}/>}
    </div>
  );
}
