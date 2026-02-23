import { Crosshair } from 'lucide-react';

const TITLES = {
  data:     'Scouting Data',
  scan:     'Import Teams',
  form:     'Form Import',
  alliance: 'Alliance Strategy',
  faq:      'Help & Directions',
  settings: 'Settings',
};

export default function Header({ tab, teamCount, targetCount }) {
  return (
    <header style={{
      display:'flex', alignItems:'center', gap:12,
      padding:'0 20px', height:52,
      background:'#080808', borderBottom:'1px solid #1e1e1e', flexShrink:0,
    }}>
      <Crosshair size={18} color="#f97316" strokeWidth={2.5} />
      <span style={{ fontFamily:'var(--font-head)', fontSize:20, letterSpacing:'0.08em', color:'#f97316' }}>
        CNP SCOUT
      </span>
      <span style={{ color:'#1e1e1e', fontSize:18 }}>|</span>
      <span style={{ fontFamily:'var(--font-head)', fontSize:16, color:'#3a3a3a', letterSpacing:'0.05em' }}>
        {TITLES[tab] || tab.toUpperCase()}
      </span>
      <div style={{ marginLeft:'auto', display:'flex', gap:16, alignItems:'center' }}>
        {targetCount > 0 && (
          <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'#f97316', background:'rgba(249,115,22,0.1)', border:'1px solid rgba(249,115,22,0.3)', padding:'2px 10px', borderRadius:12 }}>
            ★ {targetCount} target{targetCount !== 1 ? 's' : ''}
          </span>
        )}
        {teamCount > 0 && (
          <span style={{ fontSize:11, color:'#2a2a2a', fontFamily:'var(--font-mono)' }}>
            {teamCount} teams
          </span>
        )}
        <span style={{ fontSize:11, color:'#3a3a3a', fontFamily:'var(--font-mono)' }}>
          #30439 · DECODE 25-26
        </span>
      </div>
    </header>
  );
}
