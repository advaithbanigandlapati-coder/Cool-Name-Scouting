import { Crosshair } from 'lucide-react';

const TITLES = { scan: 'Initial Scan', data: 'Data & Analysis', form: 'Form Data', settings: 'Settings' };

export default function Header({ tab }) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 20px', background: '#0f0f0f',
      borderBottom: '1px solid #1e1e1e', flexShrink: 0,
    }}>
      <Crosshair size={20} color="#f97316" />
      <span style={{ fontFamily: 'var(--font-head)', fontSize: 22, letterSpacing: '0.05em', color: '#f97316' }}>
        CNP SCOUT
      </span>
      <span style={{ color: '#2a2a2a', marginLeft: 4 }}>|</span>
      <span style={{ fontFamily: 'var(--font-head)', fontSize: 18, color: '#a3a3a3', letterSpacing: '0.05em' }}>
        {TITLES[tab] || tab.toUpperCase()}
      </span>
      <span style={{ marginLeft: 'auto', fontSize: 11, color: '#525252', fontFamily: 'var(--font-mono)' }}>
        #30439 · DECODE 25-26
      </span>
    </header>
  );
}
