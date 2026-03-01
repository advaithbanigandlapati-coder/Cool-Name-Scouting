import { useState, useRef, useEffect } from 'react';
import { Send, Trash2 } from 'lucide-react';

export default function ChatTab({ teams, mine, settings }) {
  const [messages, setMessages] = useState([{ role:'assistant', content:'Ready. Ask me anything about any team.' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const apiKey = (() => { try { const s=localStorage.getItem('cnp_settings'); return s?JSON.parse(s).claudeApiKey:''; } catch{return '';} })() || settings?.claudeApiKey;
    setInput('');
    const next = [...messages, { role:'user', content:text }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{
          'content-type':'application/json',
          'x-api-key': apiKey || '',
          'anthropic-version':'2023-06-01',
          'anthropic-dangerous-direct-browser-access':'true',
        },
        body: JSON.stringify({
          model:'claude-sonnet-4-20250514',
          max_tokens:1500,
          system:`You are a scouting AI for FTC team #${mine?.teamNumber||30439} at DECODE 25-26. Answer anything. Team data:\n${teams.map(t=>`#${t.teamNumber} ${t.teamName}: pts=${t.matchPoints||'?'} opr=${t.opr||'?'} wlt=${t.wlt||'?'} tier=${t.tier||'?'} compat=${t.compatScore||'?'}% autoArt=${t.autoArtifacts||t.avgAuto||'?'} tpArt=${t.teleopArtifacts||t.avgTeleop||'?'} auto=${t.hasAuto} closeAuto=${t.autoClose} farAuto=${t.autoFar} leave=${t.leave} shoots=${t.canShoot} range=${t.shootRange||'?'} motif=${t.readsMotif} defense=${t.playsDefense} park=${t.parkType||t.endgame||'?'} notes="${t.stratNotes||t.notes||''}" tips="${(t.withTips||[]).join(';')}" against="${(t.againstTips||[]).join(';')}" target=${t.allianceTarget}`).join('\n')}\nOUR ROBOT: 12 auto artifacts, 25 teleop, close+far auto, full base return.`,
          messages: next.slice(-20),
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || data.error?.message || 'No response';
      setMessages(p => [...p, { role:'assistant', content:reply }]);
    } catch(e) {
      setMessages(p => [...p, { role:'assistant', content:'Error: '+e.message }]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>
      <div style={{padding:'10px 16px',borderBottom:'1px solid #1e1e1e',background:'#0a0a0a',display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
        <span style={{fontSize:13,fontWeight:600,color:'#a3a3a3'}}>Scout AI Chat</span>
        <span style={{fontSize:11,color:'#3a3a3a',fontFamily:'var(--font-mono)'}}>{teams.length} teams</span>
        {!settings?.claudeApiKey && <span style={{fontSize:11,color:'#ef4444',marginLeft:4}}>⚠ Set API key in Settings</span>}
        <button className="btn btn-ghost" style={{marginLeft:'auto',fontSize:11}} onClick={()=>setMessages([{role:'assistant',content:'Cleared.'}])}><Trash2 size={11}/></button>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:10}}>
        {messages.map((m,i)=>(
          <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
            <div style={{maxWidth:'85%',background:m.role==='user'?'#1a0f00':'#0f0f0f',border:`1px solid ${m.role==='user'?'#7c2d12':'#1e1e1e'}`,borderRadius:m.role==='user'?'16px 16px 4px 16px':'4px 16px 16px 16px',padding:'10px 14px',fontSize:13,lineHeight:1.7,color:m.role==='user'?'#fed7aa':'#e5e5e5',whiteSpace:'pre-wrap',wordBreak:'break-word'}}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{display:'flex',gap:5,padding:'12px 4px'}}>
            {[0,1,2].map(i=><span key={i} style={{width:7,height:7,borderRadius:'50%',background:'#f97316',display:'inline-block',animation:`pulse 1s ${i*0.2}s infinite`}}/>)}
          </div>
        )}
        <div ref={bottomRef}/>
      </div>
      <div style={{padding:'12px 16px',borderTop:'1px solid #1e1e1e',background:'#080808',display:'flex',gap:8,alignItems:'center',flexShrink:0}}>
        <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}}
          placeholder="Ask about any team…" disabled={loading}
          style={{flex:1,fontSize:13,padding:'10px 14px',borderRadius:24,background:'#0f0f0f',border:'1px solid #2a2a2a'}}/>
        <button onClick={send} disabled={!input.trim()||loading}
          style={{width:42,height:42,borderRadius:'50%',border:'none',cursor:'pointer',background:input.trim()&&!loading?'#f97316':'#1a1a1a',color:input.trim()&&!loading?'#000':'#3a3a3a',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <Send size={16}/>
        </button>
      </div>
    </div>
  );
}
