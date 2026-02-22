import { Users, Trophy, Settings } from 'lucide-react';

const TABS = [
  { key: 'teams',    icon: Users,    label: 'Teams'    },
  { key: 'alliance', icon: Trophy,   label: 'Alliance' },
  { key: 'settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav({ tab, setTab }) {
  return (
    <nav style={{
      display: 'flex', borderTop: '1px solid #1e1e1e',
      background: '#0f0f0f', flexShrink: 0,
    }}>
      {TABS.map(({ key, icon: Icon, label }) => {
        const active = tab === key;
        return (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 3,
            padding: '10px 0', border: 'none', cursor: 'pointer',
            background: 'transparent',
            color: active ? '#f97316' : '#525252',
            borderTop: `2px solid ${active ? '#f97316' : 'transparent'}`,
            transition: 'all 0.15s',
            fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            <Icon size={18} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
