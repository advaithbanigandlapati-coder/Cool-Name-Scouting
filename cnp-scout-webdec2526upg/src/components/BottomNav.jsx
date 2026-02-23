import { Table2, Search, ClipboardList, Settings, HelpCircle, Sword } from 'lucide-react';

const TABS = [
  { key:'data',     icon:Table2,        label:'Data'     },
  { key:'scan',     icon:Search,        label:'Scan'     },
  { key:'form',     icon:ClipboardList, label:'Form'     },
  { key:'alliance', icon:Sword,         label:'Alliance' },
  { key:'faq',      icon:HelpCircle,    label:'Help'     },
  { key:'settings', icon:Settings,      label:'Settings' },
];

export default function BottomNav({ tab, setTab, teams }) {
  const targets = teams?.filter(t => t.allianceTarget).length || 0;
  return (
    <nav style={{ display:'flex', borderTop:'1px solid #1e1e1e', background:'#080808', flexShrink:0 }}>
      {TABS.map(({ key, icon: Icon, label }) => {
        const active = tab === key;
        return (
          <button key={key} onClick={() => setTab(key)} style={{
            flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2,
            padding:'9px 0 7px', border:'none', cursor:'pointer', background:'transparent',
            color: active ? '#f97316' : '#3a3a3a',
            borderTop:`2px solid ${active ? '#f97316' : 'transparent'}`,
            transition:'all 0.15s',
            fontFamily:'var(--font-body)', fontSize:9,
            fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em',
            position:'relative',
          }}>
            <Icon size={15} />
            {label}
            {key === 'data' && targets > 0 && (
              <span style={{
                position:'absolute', top:5, right:'calc(50% - 18px)',
                background:'#f97316', color:'#000', borderRadius:'50%',
                width:13, height:13, fontSize:8, fontWeight:900,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>{targets}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
