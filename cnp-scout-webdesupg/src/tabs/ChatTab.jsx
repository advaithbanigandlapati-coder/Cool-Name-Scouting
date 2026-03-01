import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Trash2, AlertCircle } from 'lucide-react';

export default function ChatTab({ teams, mine, settings }) {
  const apiKey = settings?.claudeApiKey;

  const systemPrompt = `You are a scouting AI assistant for FTC team #${mine?.teamNumber||30439} (Cool Name Pending) competing in DECODE 25-26. You have complete scouting data for every team. Answer any question — strategy, alliance picks, specific teams, matchups, anything — with full detail and real numbers. Never say you lack data if it's listed below.

OUR ROBOT (#${mine?.teamNumber||30439}): 12 auto artifacts, 25 teleop artifacts, close+far auto, full base return.

TEAM DATA:
${teams.map(t=>[
  `#${t.teamNumber} ${t.teamName}:`,
  `rank=${t.stateRank||'?'} wlt=${t.wlt||'?'} pts=${t.matchPoints||'?'} high=${t.highScore||'?'} opr=${t.opr||'?'} epa=${t.epa||'?'} rs=${t.rs||'?'}`,
  `tier=${t.tier||'?'} compat=${t.compatScore||'?'}% target=${t.allianceTarget||false}`,
  `hasAuto=${t.hasAuto} closeAuto=${t.autoClose} farAuto=${t.autoFar} leave=${t.leave} readsMotif=${t.readsMotif}`,
  `autoArt=${t.autoArtifacts||t.avgAuto||'?'} tpArt=${t.teleopArtifacts||t.avgTeleop||'?'} highAuto=${t.highAuto||'?'} highTp=${t.highTeleop||'?'}`,
  `canShoot=${t.canShoot} range=${t.shootRange||'?'} motifPriority=${t.motifPriority} pickup=${t.pickupMethod||'?'}`,
  `defense=${t.playsDefense} defenseNotes="${t.defenseExplain||''}" park=${t.parkType||t.endgame||'?'}`,
  `fieldPref=${t.fieldPref} fieldWhere="${t.fieldPrefWhere||''}"`,
  `stratNotes="${t.stratNotes||t.notes||t.scoutNotes||''}"`,
  `withTips="${(t.withTips||[]).join('; ')}"`,
  `againstTips="${(t.againstTips||[]).join('; ')}"`,
].join(' ')).join('\n')}`;

  const [messages, setMessages] = useState([
    { role:'assistant', content:`Ready. I have data on ${teams.length} teams. Ask me anything.` }
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    if (!apiKey) {
      setMessages(prev => [...prev,
        { role:'user', content:text },
        { role:'assistant', content:'⚠️ No API key set. Go to Settings → Claude API Key and paste your key from console.anthropic.com' }
      ]);
      setInput('');
      return;
    }

    setInput('');
    const newMsg = { role:'user', content:text };
    setMessages(prev => [...prev, newMsg]);
    setLoading(true);

    try {
      const history = [...messages, newMsg].filter(m => m.role !== 'system').slice(-20);
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          system: systemPrompt,
          messages: history,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const reply = data.content?.map(b => b.text||'').join('') || 'No response.';
      setMessages(prev => [...prev, { role:'assistant', content:reply }]);
    } catch(e) {
      setMessages(prev => [...prev, { role:'assistant', content:`Error: ${e.message}` }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  return (
    <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>

      <div style={{padding:'10px 16px',borderBottom:'1px solid #1e1e1e',flexShrink:0,
        display:'flex',gap:10,alignItems:'center',background:'#0a0a0a'}}>
        <MessageSquare size={15} color="#f97316"/>
        <span style={{fontSize:13,fontWeight:600,color:'#a3a3a3'}}>Scout AI</span>
        <span style={{fontSize:11,color:'#3a3a3a',fontFamily:'var(--font-mono)'}}>{teams.length} teams</span>
        {!apiKey && (
          <span style={{fontSize:11,color:'#ef4444',display:'flex',alignItems:'center',gap:4}}>
            <AlertCircle size={11}/> Set API key in Settings
          </span>
        )}
        <button className="btn btn-ghost"
          style={{marginLeft:'auto',fontSize:11,color:'#3a3a3a'}}
          onClick={()=>setMessages([{role:'assistant',content:`Cleared. ${teams.length} teams loaded.`}])}>
          <Trash2 size={11}/> Clear
        </button>
      </div>

      <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:10}}>
        {messages.map((m,i) => (
          <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
            <div style={{
              maxWidth:'85%',
              background:   m.role==='user'?'#1a0f00':'#0f0f0f',
              border:       m.role==='user'?'1px solid #7c2d12':'1px solid #1e1e1e',
              borderRadius: m.role==='user'?'16px 16px 4px 16px':'4px 16px 16px 16px',
              padding:'11px 14px',fontSize:13,lineHeight:1.7,
              color:m.role==='user'?'#fed7aa':'#e5e5e5',
              whiteSpace:'pre-wrap',wordBreak:'break-word',
            }}>{m.content}</div>
          </div>
        ))}

        {loading && (
          <div style={{display:'flex',justifyContent:'flex-start'}}>
            <div style={{background:'#0f0f0f',border:'1px solid #1e1e1e',
              borderRadius:'4px 16px 16px 16px',padding:'12px 18px',
              display:'flex',gap:5,alignItems:'center'}}>
              {[0,1,2].map(i=>(
                <span key={i} style={{width:7,height:7,borderRadius:'50%',background:'#f97316',
                  display:'inline-block',animation:`pulse 1s ${i*0.25}s infinite`}}/>
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      <div style={{padding:'12px 16px',borderTop:'1px solid #1e1e1e',
        flexShrink:0,display:'flex',gap:8,background:'#080808',alignItems:'center'}}>
        <input
          ref={inputRef}
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}}
          placeholder={apiKey?"Ask anything about any team or strategy…":"Set API key in Settings first"}
          disabled={loading}
          style={{flex:1,fontSize:13,padding:'10px 14px',borderRadius:24,
            background:'#0f0f0f',border:'1px solid #2a2a2a'}}
        />
        <button onClick={send} disabled={!input.trim()||loading} style={{
          width:42,height:42,borderRadius:'50%',border:'none',cursor:'pointer',flexShrink:0,
          background:input.trim()&&!loading?'#f97316':'#1a1a1a',
          color:input.trim()&&!loading?'#000':'#3a3a3a',
          display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}}>
          <Send size={16}/>
        </button>
      </div>
    </div>
  );
}
