import { Crosshair } from 'lucide-react';

export default function Header({ tab }) {
  const titles = {
    teams:    'Scouted Teams',
    alliance: 'Alliance Board',
    settings: 'Settings',
  };
  return (
    <header style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 20px',
      background: '#0f0f0f',
      borderBottom: '1px solid #1e1e1e',
      WebkitAppRegion: 'drag',
      flexShrink: 0,
    }}>
      <Crosshair size={20} color="#f97316" style={{ WebkitAppRegion: 'no-drag' }} />
      <span style={{ fontFamily: 'var(--font-head)', fontSize: 22, letterSpacing: '0.05em', color: '#f97316' }}>
        CNP SCOUT
      </span>
      <span style={{ color: '#2a2a2a', marginLeft: 4 }}>|</span>
      <span style={{ fontFamily: 'var(--font-head)', fontSize: 18, color: '#a3a3a3', letterSpacing: '0.05em' }}>
        {titles[tab] || tab.toUpperCase()}
      </span>
      <span style={{
        marginLeft: 'auto', fontSize: 11, color: '#525252',
        fontFamily: 'var(--font-mono)',
      }}>
        #30439 · Decode 2025-2026
      </span>
    </header>
  );
}
