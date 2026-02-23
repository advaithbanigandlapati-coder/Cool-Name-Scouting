import { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check, ExternalLink } from 'lucide-react';

function CopyBox({ text, label }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }
  return (
    <div style={{ background:'#0a0a0a', border:'1px solid #2a2a2a', borderRadius:6, padding:'10px 12px', fontFamily:'var(--font-mono)', fontSize:11, color:'#a3a3a3', position:'relative', marginTop:6 }}>
      <pre style={{ margin:0, whiteSpace:'pre-wrap', wordBreak:'break-all', paddingRight:32 }}>{text}</pre>
      <button onClick={copy} style={{ position:'absolute', top:8, right:8, background:'none', border:'none', cursor:'pointer', color: copied ? '#22c55e' : '#525252', transition:'color 0.15s' }}>
        {copied ? <Check size={13}/> : <Copy size={13}/>}
      </button>
      {label && <div style={{ fontSize:10, color:'#3a3a3a', marginTop:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</div>}
    </div>
  );
}

function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border:'1px solid #1e1e1e', borderRadius:8, overflow:'hidden', marginBottom:10 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'14px 18px', background: open ? '#141414' : '#0f0f0f',
        border:'none', cursor:'pointer', color:'var(--text)', textAlign:'left',
      }}>
        <span style={{ fontFamily:'var(--font-head)', fontSize:16, letterSpacing:'0.04em', color: open ? '#f97316' : '#e5e5e5' }}>{title}</span>
        {open ? <ChevronUp size={16} color="#f97316"/> : <ChevronDown size={16} color="#525252"/>}
      </button>
      {open && <div style={{ padding:'18px 20px', background:'#0c0c0c', borderTop:'1px solid #1e1e1e' }}>{children}</div>}
    </div>
  );
}

const P = ({ children }) => <p style={{ fontSize:13, color:'#a3a3a3', lineHeight:1.7, marginBottom:10 }}>{children}</p>;
const Step = ({ n, children }) => (
  <div style={{ display:'flex', gap:12, marginBottom:14, alignItems:'flex-start' }}>
    <div style={{ background:'#f97316', color:'#000', borderRadius:'50%', width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, flexShrink:0, marginTop:1 }}>{n}</div>
    <div style={{ fontSize:13, color:'#a3a3a3', lineHeight:1.7 }}>{children}</div>
  </div>
);
const Warn = ({ children }) => (
  <div style={{ background:'rgba(234,179,8,0.08)', border:'1px solid rgba(234,179,8,0.2)', borderRadius:6, padding:'10px 14px', fontSize:12, color:'#eab308', marginBottom:10 }}>{children}</div>
);
const Tip = ({ children }) => (
  <div style={{ background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:6, padding:'10px 14px', fontSize:12, color:'#22c55e', marginBottom:10 }}>{children}</div>
);

export default function FAQTab() {
  return (
    <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
      <div style={{ maxWidth:780, margin:'0 auto' }}>

        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontFamily:'var(--font-head)', fontSize:32, color:'#f97316', letterSpacing:'0.05em', marginBottom:6 }}>CNP SCOUT — HOW IT WORKS</h1>
          <p style={{ fontSize:13, color:'#525252' }}>Full directions for setup and use. Click any section to expand.</p>
        </div>

        {/* ── QUICK START ── */}
        <Section title="⚡ Quick Start — Read This First" defaultOpen={true}>
          <P>CNP Scout has 6 tabs. Here's what they do and what order to use them:</P>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
            {[
              ['📊 Data',     'Main scouting table. All team stats, AI analysis, sorting/filtering.'],
              ['🔍 Scan',     'Add teams by number — AI fetches their stats automatically.'],
              ['📋 Form',     'Import your Google Form responses from Google Sheets.'],
              ['⚔️ Alliance', 'Best alliance picks + opponent research chatbot.'],
              ['❓ FAQ',      'This page.'],
              ['⚙️ Settings', 'API keys, column mapping, your robot\'s stats.'],
            ].map(([tab, desc]) => (
              <div key={tab} style={{ background:'#0f0f0f', border:'1px solid #1e1e1e', borderRadius:6, padding:'10px 12px' }}>
                <div style={{ fontWeight:700, fontSize:13, color:'#f97316', marginBottom:4 }}>{tab}</div>
                <div style={{ fontSize:12, color:'#a3a3a3' }}>{desc}</div>
              </div>
            ))}
          </div>
          <Tip>✓ Recommended order: Settings → Form → Scan → Data → Alliance</Tip>
        </Section>

        {/* ── SETTINGS FIRST ── */}
        <Section title="⚙️ First-Time Setup (Settings Tab)">
          <P>Before anything else, go to <b style={{color:'#f97316'}}>Settings</b> and fill in:</P>
          <Step n="1"><b style={{color:'#e5e5e5'}}>Google API Key</b> — needed to read your scouting form responses from Google Sheets.<br/>
            Get one free: <span style={{color:'#60a5fa'}}>console.cloud.google.com</span> → Create Project → APIs &amp; Services → Library → search "Google Sheets API" → Enable → Credentials → Create API Key</Step>
          <Step n="2"><b style={{color:'#e5e5e5'}}>Sheet ID</b> — the ID from your Google Sheets URL.
            <CopyBox text="https://docs.google.com/spreadsheets/d/  ← YOUR SHEET ID IS HERE  /edit" label="URL format" />
            Copy the long string between /d/ and /edit.</Step>
          <Step n="3">Click <b style={{color:'#f97316'}}>"Load Column Headers"</b> — it will pull your form's column names automatically.</Step>
          <Step n="4">In <b style={{color:'#e5e5e5'}}>Column Mapping</b>, use the dropdowns to match each field to your form's column. This is how CNP Scout knows which column is "team name", which is "balls in auto", etc.</Step>
          <Step n="5">Fill in <b style={{color:'#e5e5e5'}}>Our Robot Stats</b> — your match points, strengths, weaknesses. This is what Claude uses when analyzing alliance compatibility.</Step>
          <Step n="6">Click <b style={{color:'#f97316'}}>Save Settings</b>.</Step>
          <Warn>⚠️ Your Google Sheet must be shared as "Anyone with the link → Viewer" for the API to read it.</Warn>
        </Section>

        {/* ── GOOGLE FORM SETUP ── */}
        <Section title="📋 How to Connect Your Google Form / Sheets">
          <P>Your Google Form automatically creates a linked spreadsheet. Here's how to connect it:</P>
          <Step n="1"><b style={{color:'#e5e5e5'}}>Open your Google Form</b> → click the <b>Responses</b> tab → click the green Sheets icon → "Create a new spreadsheet". This creates the linked sheet.</Step>
          <Step n="2"><b style={{color:'#e5e5e5'}}>Share the sheet:</b> In the spreadsheet, click Share → change from "Restricted" to "Anyone with the link" → Viewer. Click Done.</Step>
          <Step n="3"><b style={{color:'#e5e5e5'}}>Copy the Sheet ID</b> from the URL (between /d/ and /edit).</Step>
          <Step n="4">Go to <b style={{color:'#f97316'}}>Settings</b> → paste your Google API key and Sheet ID → click Load Column Headers.</Step>
          <Step n="5">Map your form columns in the Column Mapping section. Your form's "Team Name" question becomes the <b>teamName</b> mapping, etc.</Step>
          <Step n="6">Go to <b style={{color:'#f97316'}}>Form tab</b> → click "Import from Google Sheets". Your responses appear instantly.</Step>
          <Tip>✓ Every new form response is automatically added to the sheet. Just re-import to get the latest data.</Tip>
          <div style={{ marginTop:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#a78bfa', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Your form's team name column format</div>
            <P>The form likely stores team names as "755 -- Delbotics". CNP Scout automatically extracts the number from this format. As long as the team number appears first, it works.</P>
            <CopyBox text={`Example form responses that work:
"755 -- Delbotics"     → team #755
"30439"                → team #30439
"Team 16367"           → won't work (no leading number)
"16367 Krypton Warriors" → team #16367`} label="Team name format examples" />
          </div>
        </Section>

        {/* ── IMPORT TEAMS ── */}
        <Section title="🔍 Adding Teams (Scan Tab)">
          <P>Two ways to add teams to the Data table:</P>
          <Step n="1"><b style={{color:'#e5e5e5'}}>AI Scan</b> — Enter team numbers (any format, comma/space/newline separated). Claude searches FTCScout + web to auto-fill OPR, EPA, rank, record, and stats.
            <CopyBox text={`Example input:
755, 9889, 16367, 31149
30439
26444 9853 6101`} label="Paste any mix of formats" /></Step>
          <Step n="2"><b style={{color:'#e5e5e5'}}>Paste from Google Doc</b> — If you have a scouting doc with a table, select all rows, copy, and paste here. It auto-parses tab-separated columns.
            Expected column order:
            <CopyBox text="Team # | Team Name | State Rank | RS | 1.17.26 | Match Pts | Base Pts | Auto Pts | High Score | W-L-T | Plays" label="Expected column order" /></Step>
          <Tip>✓ You can also manually add individual teams using the "+ Add Team" button and typing in the data directly.</Tip>
          <Warn>⚠️ AI Scan uses Claude (costs a tiny bit — ~$0.01/scan). FTCScout is always free.</Warn>
        </Section>

        {/* ── DATA TABLE ── */}
        <Section title="📊 Using the Data Table">
          <P>The main table shows all scouted teams with columns from multiple sources:</P>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
            {[
              ['Doc (grey)',   'Stats from your league doc: rank, RS, match/auto/base points'],
              ['FTCScout (blue)', 'OPR and EPA fetched live from FTCScout'],
              ['Scouted (purple)', 'Data imported from your Google Form responses'],
              ['AI (orange ✦)', 'Claude\'s analysis: tier, compat score, notes, tips'],
            ].map(([src, desc]) => (
              <div key={src} style={{ background:'#0f0f0f', border:'1px solid #1e1e1e', borderRadius:6, padding:'8px 12px' }}>
                <div style={{ fontWeight:700, fontSize:11, color:'#a3a3a3', marginBottom:3 }}>{src}</div>
                <div style={{ fontSize:11, color:'#525252' }}>{desc}</div>
              </div>
            ))}
          </div>
          <Step n="1"><b style={{color:'#e5e5e5'}}>Click any cell</b> to edit it. For AI columns (marked ✦), you'll need to explain why you're correcting it.</Step>
          <Step n="2">Click <b style={{color:'#f97316'}}>★</b> on any team to mark them as an Alliance Target. Targets are highlighted in orange and shown in a summary bar.</Step>
          <Step n="3">Click <b style={{color:'#f97316'}}>FTCScout</b> button to refresh OPR/EPA for all teams from live data.</Step>
          <Step n="4">Click <b style={{color:'#f97316'}}>AI Analyze All</b> to run Claude's full analysis — tiers, compat scores, strategy tips (~30–60s).</Step>
          <Step n="5">Use filter chips (OPTIMAL / MID / BAD / ★ Targets) to narrow the view. Click any column header to sort.</Step>
          <Step n="6">Expand the Strategy Tips panel at the bottom to see per-team allied/against tips.</Step>
          <Tip>✓ Use CSV export to share the full table with your drive team.</Tip>
        </Section>

        {/* ── ALLIANCE TAB ── */}
        <Section title="⚔️ Alliance Tab — Best Picks + Strategy Chatbot">
          <P>The Alliance tab has two sections:</P>
          <Step n="1"><b style={{color:'#e5e5e5'}}>Best Alliance Picks</b> — Automatically calculates the top alliance partner combinations from your loaded teams, weighted by AI tier, compat score, and match performance.</Step>
          <Step n="2"><b style={{color:'#e5e5e5'}}>Opponent Research</b> — Enter any team number. Claude looks them up on FTCScout + web and gives you a full strategic brief: their scoring profile, strengths, weaknesses, and 3 specific tips for beating them.</Step>
          <Step n="3"><b style={{color:'#e5e5e5'}}>Chatbot</b> — After the initial research, the text box becomes a chat interface. Ask Claude anything about the opponent:
            <CopyBox text={`Example questions:
"How do they typically handle the gate?"
"What's their endgame strategy?"
"What should we do differently if we're in auto together?"`} label="Follow-up question examples" /></Step>
          <Tip>✓ Opponent research uses Claude + web search. Works for any FTC team worldwide — not just teams in your league.</Tip>
        </Section>

        {/* ── TROUBLESHOOTING ── */}
        <Section title="🔧 Troubleshooting">
          {[
            ['Claude says "ANTHROPIC_API_KEY not set"', 'Go to Render → your service → Environment → add ANTHROPIC_API_KEY with your key from console.anthropic.com'],
            ['FTCScout fetch fails / shows —', 'This was a CORS bug — now fixed via server proxy. If it still fails, check /health endpoint on your server.'],
            ['Google Sheets returns "403" or "forbidden"', 'The sheet isn\'t public. Go to your spreadsheet → Share → change to "Anyone with the link" → Viewer.'],
            ['Google Sheets returns "API key not valid"', 'Your Google API key is wrong, or Sheets API isn\'t enabled. Go to Google Cloud Console → APIs & Services → Library → search "Sheets API" → Enable.'],
            ['Column mapping shows no dropdowns', 'Click "Load Column Headers" in Settings first — it reads your sheet\'s first row.'],
            ['Team numbers not parsing from form', 'The team name column must start with the number: "755 -- Delbotics" works, "Team 755" doesn\'t.'],
            ['AI analysis returns empty / parse error', 'Claude sometimes returns extra text around the JSON. Fixed in latest version — retries with regex extraction.'],
          ].map(([q, a]) => (
            <div key={q} style={{ marginBottom:14, padding:'12px 14px', background:'#0f0f0f', borderRadius:6, border:'1px solid #1e1e1e' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#eab308', marginBottom:5 }}>Q: {q}</div>
              <div style={{ fontSize:12, color:'#a3a3a3' }}>→ {a}</div>
            </div>
          ))}
        </Section>

        {/* ── COST ── */}
        <Section title="💰 API Costs">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
            {[
              ['FTCScout', 'Free', 'Always'],
              ['Google Sheets API', 'Free', 'Always'],
              ['Claude AI Analyze All', '~$0.05–0.10', 'Per full event scan'],
              ['Claude Scan Teams', '~$0.01–0.02', 'Per batch of teams'],
              ['Opponent Research', '~$0.01–0.03', 'Per team + follow-ups'],
              ['Full qualifier season', 'Under $2', 'Estimated total'],
            ].map(([what, cost, when]) => (
              <div key={what} style={{ background:'#0f0f0f', border:'1px solid #1e1e1e', borderRadius:6, padding:'10px 12px' }}>
                <div style={{ fontSize:11, color:'#525252', marginBottom:2 }}>{what}</div>
                <div style={{ fontSize:16, fontWeight:700, color:'#f97316', fontFamily:'var(--font-mono)' }}>{cost}</div>
                <div style={{ fontSize:10, color:'#3a3a3a' }}>{when}</div>
              </div>
            ))}
          </div>
        </Section>

      </div>
    </div>
  );
}
