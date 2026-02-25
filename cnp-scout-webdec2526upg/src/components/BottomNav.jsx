import { Table2, Search, ClipboardList, Shield, Settings } from 'lucide-react';

const TABS = [
  { key:'data',     icon:Table2,        label:'Data'     },
  { key:'alliance', icon:Shield,        label:'Alliance' },
  { key:'scan',     icon:Search,        label:'Scan'     },
  { key:'form',     icon:ClipboardList, label:'Form'     },
  { key:'settings', icon:Settings,      label:'Settings' },
];

export default function BottomNav({ tab, setTab, teams }) {
  const targets  = teams?.filter(t => t.allianceTarget).length || 0;
  const analyzed = teams?.filter(t => t.tier).length || 0;

  return (
    <nav style={{
      display: 'flex', borderTop: '1px solid #1e1e1e',
      background: '#080808', flexShrink: 0,
    }}>
      {TABS.map(({ key, icon: Icon, label }) => {
        const active = tab === key;
        const badge = key === 'data' && targets > 0 ? targets
                    : key === 'alliance' && analyzed > 0 ? analyzed
                    : 0;
        return (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '10px 0 8px', border: 'none', cursor: 'pointer', background: 'transparent',
            color: active ? '#f97316' : '#3a3a3a',
            borderTop: `2px solid ${active ? '#f97316' : 'transparent'}`,
            transition: 'all 0.15s',
            fontFamily: 'var(--font-body)', fontSize: 10,
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
            position: 'relative',
          }}>
            <Icon size={17}/>
            {label}
            {badge > 0 && (
              <span style={{
                position: 'absolute', top: 6, right: 'calc(50% - 20px)',
                background: key === 'alliance' ? '#22c55e' : '#f97316',
                color: '#000', borderRadius: '50%',
                width: 14, height: 14, fontSize: 9, fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{badge > 99 ? '99+' : badge}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
