import { useState, useMemo } from 'react';
import { Sword, Send, RefreshCw, Copy, Check, Trophy, Users } from 'lucide-react';
import { researchOpponent } from '../api/claude.js';
import { fetchTeamStats } from '../api/ftcscout.js';
import { TIER_COLOR, TIER_BG, MY_TEAM_NUM } from '../constants.js';

// ── Simple markdown-ish renderer ─────────────────────────────────────────────
function MsgContent({ text }) {
  const lines = text.split('\n');
  return (
    <div style={{ lineHeight:1.7, fontSize:13 }}>
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <div key={i} style={{ fontWeight:700, color:'#f97316', fontSize:13, marginTop:10 }}>{line.slice(4)}</div>;
        if (line.startsWith('## '))  return <div key={i} style={{ fontWeight:700, color:'#f97316', fontSize:14, marginTop:12 }}>{line.slice(3)}</div>;
        if (line.startsWith('# '))   return <div key={i} style={{ fontWeight:700, color:'#f97316', fontSize:15, marginTop:14 }}>{line.slice(2)}</div>;
        if (line.startsWith('**') && line.endsWith('**')) return <div key={i} style={{ fontWeight:700, color:'#e5e5e5', marginTop:6 }}>{line.slice(2,-2)}</div>;
        if (line.match(/^\*\*.+\*\*/)) {
          const html = line.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#e5e5e5">$1</strong>');
          return <div key={i} dangerouslySetInnerHTML={{ __html: html }} />;
        }
        if (line.startsWith('- ') || line.startsWith('• ')) return (
          <div key={i} style={{ display:'flex', gap:8, marginTop:4, paddingLeft:8 }}>
            <span style={{ color:'#f97316', flexShrink:0 }}>•</span>
            <span>{line.slice(2)}</span>
          </div>
        );
        if (/^\d+\. /.test(line)) return (
          <div key={i} style={{ display:'flex', gap:8, marginTop:4, paddingLeft:8 }}>
            <span style={{ color:'#f97316', flexShrink:0, fontFamily:'var(--font-mono)', fontSize:11 }}>{line.match(/^\d+/)[0]}.</span>
            <span>{line.replace(/^\d+\. /, '')}</span>
          </div>
        );
        if (line === '') return <div key={i} style={{ height:6 }} />;
        return <div key={i}>{line}</div>;
      })}
    </div>
  );
}

// ── Best alliance calculator ──────────────────────────────────────────────────
function calcAllianceScore(team) {
  const tierPts  = { OPTIMAL: 100, MID: 50, BAD: 10 };
  const tier     = tierPts[team.tier] || 30;
  const compat   = parseFloat(team.compatScore) || 0;
  const matchPts = parseFloat(team.matchPoints) || 0;
  const rank     = team.stateRank ? (50 - Math.min(50, parseInt(team.stateRank))) : 0;
  return tier * 0.4 + compat * 0.3 + Math.min(matchPts / 2, 50) * 0.2 + rank * 0.1;
}

function BestAlliance({ teams }) {
  const picks = useMemo(() => {
    return [...teams]
      .filter(t => t.teamNumber !== MY_TEAM_NUM)
      .map(t => ({ ...t, allianceScore: calcAllianceScore(t) }))
      .sort((a, b) => b.allianceScore - a.allianceScore)
      .slice(0, 5);
  }, [teams]);

  if (!picks.length) return (
    <div className="empty"><h3>No Teams</h3><p>Add teams in the Scan tab and run AI Analyze first.</p></div>
  );

  const hasAI = picks.some(t => t.tier);

  return (
    <div style={{ padding:'0 0 20px' }}>
      {!hasAI && (
        <div style={{ padding:'10px 16px', background:'rgba(234,179,8,0.08)', border:'1px solid rgba(234,179,8,0.2)', borderRadius:6, margin:'0 0 16px', fontSize:12, color:'#eab308' }}>
          Run "AI Analyze All" in the Data tab first for best results. Rankings below are based on match points and rank only.
        </div>
      )}
      <div style={{ fontSize:11, color:'#525252', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:12, fontWeight:700 }}>Top Alliance Picks — scored by AI tier × compat × match performance</div>
      {picks.map((team, idx) => (
        <div key={team.teamNumber} style={{
          display:'flex', alignItems:'center', gap:14, padding:'12px 16px',
          background: idx === 0 ? 'rgba(249,115,22,0.08)' : '#0f0f0f',
          border: `1px solid ${idx === 0 ? 'rgba(249,115,22,0.3)' : '#1e1e1e'}`,
          borderRadius:8, marginBottom:8,
        }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:18, fontWeight:900, color: idx===0?'#f97316': idx===1?'#a3a3a3': idx===2?'#a16207':'#3a3a3a', width:24, textAlign:'center' }}>
            {idx + 1}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontFamily:'var(--font-mono)', color:'#f97316', fontWeight:700 }}>#{team.teamNumber}</span>
              <span style={{ fontWeight:600, fontSize:14 }}>{team.teamName}</span>
              {team.tier && (
                <span style={{ background: TIER_BG[team.tier], color: TIER_COLOR[team.tier], border:`1px solid ${TIER_COLOR[team.tier]}`, padding:'0px 8px', borderRadius:4, fontSize:10, fontWeight:700, fontFamily:'var(--font-mono)' }}>
                  {team.tier} {team.compatScore ? `${team.compatScore}%` : ''}
                </span>
              )}
              {team.stateRank && <span style={{ fontSize:11, color:'#525252' }}>Rank #{team.stateRank}</span>}
              {team.rs === 'Yes' && <span style={{ background:'#14532d', color:'#22c55e', padding:'0px 6px', borderRadius:3, fontSize:10, fontWeight:700 }}>RS</span>}
            </div>
            <div style={{ fontSize:11, color:'#525252', marginTop:3, display:'flex', gap:16 }}>
              {team.matchPoints && <span>Match pts: <b style={{color:'#a3a3a3'}}>{team.matchPoints}</b></span>}
              {team.opr && <span>OPR: <b style={{color:'#60a5fa'}}>{team.opr}</b></span>}
              {team.wlt && <span>Record: <b style={{color:'#a3a3a3'}}>{team.wlt}</b></span>}
            </div>
            {team.complementary && <div style={{ fontSize:12, color:'#a3a3a3', marginTop:4, fontStyle:'italic' }}>{team.complementary}</div>}
          </div>
          <div style={{ textAlign:'right', fontFamily:'var(--font-mono)', fontSize:12 }}>
            <div style={{ color: idx===0?'#f97316':'#525252', fontWeight:700 }}>{Math.round(team.allianceScore)}</div>
            <div style={{ color:'#3a3a3a', fontSize:10 }}>score</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Opponent research chatbot ─────────────────────────────────────────────────
function OpponentChat({ teams, mine }) {
  const [teamInput,  setTeamInput]  = useState('');
  const [targetTeam, setTargetTeam] = useState(null);
  const [messages,   setMessages]   = useState([]); // {role, content}
  const [chatInput,  setChatInput]  = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [copied,     setCopied]     = useState(false);

  const knownTeam = useMemo(() => {
    if (!teamInput) return null;
    return teams.find(t => t.teamNumber === teamInput.trim());
  }, [teamInput, teams]);

  async function research() {
    const num = teamInput.trim();
    if (!/^\d{3,6}$/.test(num)) { setError('Enter a valid team number (3–6 digits)'); return; }
    setError('');
    setLoading(true);
    setMessages([]);
    setTargetTeam(num);

    const initialMsg = { role: 'user', content: `Research FTC team #${num} for DECODE 2025-26. Use web_search to find their FTCScout stats, recent match results, and any scouting info. Give me:
1. **Team Overview** — who they are, record, ranking
2. **Scoring Profile** — what they score in auto/teleop/endgame
3. **Key Strengths & Weaknesses**
4. **3 Strategic Tips** for playing against them in DECODE
5. **What to Watch For** — their biggest threat to us (#30439 Cool Name Pending)` };

    try {
      const reply = await researchOpponent(num, knownTeam, mine, [initialMsg]);
      setMessages([initialMsg, { role: 'assistant', content: reply }]);
    } catch (err) {
      setError(`Research failed: ${err.message}`);
    } finally { setLoading(false); }
  }

  async function sendChat() {
    if (!chatInput.trim() || loading) return;
    const userMsg = { role: 'user', content: chatInput.trim() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setChatInput('');
    setLoading(true);
    try {
      const reply = await researchOpponent(targetTeam, knownTeam, mine, newHistory);
      setMessages([...newHistory, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages([...newHistory, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally { setLoading(false); }
  }

  function copyAll() {
    const text = messages.filter(m => m.role === 'assistant').map(m => m.content).join('\n\n---\n\n');
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Team input */}
      <div style={{ background:'#0f0f0f', border:'1px solid #1e1e1e', borderRadius:8, padding:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#f97316', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:10 }}>Research an Opponent</div>
        <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
          <div style={{ flex:1 }}>
            <label>Team Number</label>
            <input
              value={teamInput} onChange={e => setTeamInput(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && research()}
              placeholder="e.g. 16367" maxLength={6}
              style={{ fontFamily:'var(--font-mono)', fontSize:18, height:44 }}
            />
            {knownTeam && <div style={{ fontSize:11, color:'#22c55e', marginTop:4 }}>{knownTeam.teamName} — already in your data</div>}
          </div>
          <button className="btn btn-primary" onClick={research} disabled={loading || !teamInput} style={{ height:44, padding:'0 20px' }}>
            {loading && messages.length === 0 ? <><div className="spinner"/>Researching…</> : <><Sword size={14}/>Research</>}
          </button>
        </div>
        {error && <div style={{ fontSize:12, color:'#ef4444', marginTop:8 }}>{error}</div>}
        <p style={{ fontSize:11, color:'#3a3a3a', marginTop:8 }}>Claude will search FTCScout + web to build a full strategic brief. Works for any FTC team worldwide.</p>
      </div>

      {/* Chat area */}
      {messages.length > 0 && (
        <div style={{ background:'#0c0c0c', border:'1px solid #1e1e1e', borderRadius:8, display:'flex', flexDirection:'column', gap:0, overflow:'hidden' }}>
          {/* Chat header */}
          <div style={{ padding:'10px 16px', borderBottom:'1px solid #1e1e1e', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#0f0f0f' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#f97316' }}>
              <Sword size={13} style={{ display:'inline', marginRight:6 }}/>
              Team #{targetTeam} — Strategic Brief
            </div>
            <button onClick={copyAll} style={{ background:'none', border:'none', cursor:'pointer', color: copied?'#22c55e':'#525252', display:'flex', alignItems:'center', gap:5, fontSize:11, transition:'color 0.15s' }}>
              {copied ? <><Check size={12}/>Copied!</> : <><Copy size={12}/>Copy all</>}
            </button>
          </div>

          {/* Messages */}
          <div style={{ overflowY:'auto', maxHeight:400, padding:'4px 0' }}>
            {messages.filter(m => m.role === 'assistant').map((msg, i) => (
              <div key={i} style={{ padding:'12px 16px', borderBottom:'1px solid #111', color:'#a3a3a3' }}>
                <MsgContent text={msg.content} />
              </div>
            ))}
            {loading && (
              <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:10, color:'#525252', fontSize:13 }}>
                <div className="spinner" style={{ width:14, height:14 }}/> Claude is researching…
              </div>
            )}
          </div>

          {/* Follow-up input */}
          <div style={{ padding:'10px 12px', borderTop:'1px solid #1e1e1e', display:'flex', gap:8, background:'#0f0f0f' }}>
            <input
              value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
              placeholder="Ask a follow-up… e.g. 'How do they handle the gate?' or 'What's their endgame?'"
              style={{ flex:1, height:38, fontSize:13 }}
              disabled={loading}
            />
            <button className="btn btn-primary" onClick={sendChat} disabled={loading || !chatInput.trim()} style={{ height:38, padding:'0 14px' }}>
              {loading ? <div className="spinner" style={{width:12,height:12}}/> : <Send size={13}/>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main AllianceTab ──────────────────────────────────────────────────────────
export default function AllianceTab({ teams, mine }) {
  const [view, setView] = useState('picks'); // 'picks' | 'research'

  return (
    <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
      {/* Sub-nav */}
      <div style={{ display:'flex', borderBottom:'1px solid #1e1e1e', background:'#0a0a0a', flexShrink:0 }}>
        {[
          ['picks',    <><Trophy size={13}/>Best Alliance Picks</>, ''],
          ['research', <><Sword size={13}/>Opponent Research</>,    ''],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setView(key)} style={{
            padding:'11px 20px', border:'none', cursor:'pointer', background:'transparent',
            color: view===key ? '#f97316' : '#525252',
            borderBottom: `2px solid ${view===key ? '#f97316' : 'transparent'}`,
            fontFamily:'var(--font-body)', fontSize:13, fontWeight:600,
            display:'flex', alignItems:'center', gap:7, transition:'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:20 }}>
        <div style={{ maxWidth:760, margin:'0 auto' }}>
          {view === 'picks'    && <BestAlliance teams={teams} />}
          {view === 'research' && <OpponentChat teams={teams} mine={mine} />}
        </div>
      </div>
    </div>
  );
}
