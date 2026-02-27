import { Table2, Search, ClipboardList, ClipboardCheck, Shield, Settings } from 'lucide-react';

const TABS = [
  { key:'data',     icon:Table2,         label:'Data'    },
  { key:'alliance', icon:Shield,         label:'Alliance'},
  { key:'match',    icon:ClipboardCheck, label:'Match'   },
  { key:'scout',    icon:ClipboardList,  label:'Scout'   },
  { key:'scan',     icon:Search,         label:'Scan'    },
  { key:'settings', icon:Settings,       label:'Settings'},
];

export default function BottomNav({ tab, setTab, teams, matchEntries }) {
  const targets  = teams?.filter(t=>t.allianceTarget).length||0;
  const analyzed = teams?.filter(t=>t.tier).length||0;
  const matches  = matchEntries?.length||0;

  return (
    <nav style={{display:'flex',borderTop:'1px solid #1e1e1e',background:'#080808',flexShrink:0}}>
      {TABS.map(({key,icon:Icon,label})=>{
        const active = tab===key;
        const badge  = key==='data'&&targets>0 ? targets
                     : key==='alliance'&&analyzed>0 ? analyzed
                     : key==='match'&&matches>0 ? matches
                     : 0;
        const badgeColor = key==='alliance'?'#22c55e':key==='match'?'#60a5fa':'#f97316';
        return (
          <button key={key} onClick={()=>setTab(key)} style={{
            flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3,
            padding:'10px 0 8px',border:'none',cursor:'pointer',background:'transparent',
            color:active?'#f97316':'#3a3a3a',
            borderTop:`2px solid ${active?'#f97316':'transparent'}`,
            transition:'all 0.15s',
            fontFamily:'var(--font-body)',fontSize:9,
            fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',
            position:'relative',
          }}>
            <Icon size={16}/>
            {label}
            {badge>0&&(
              <span style={{
                position:'absolute',top:5,right:'calc(50% - 18px)',
                background:badgeColor,color:'#000',borderRadius:'50%',
                width:14,height:14,fontSize:9,fontWeight:900,
                display:'flex',alignItems:'center',justifyContent:'center',
              }}>{badge>99?'99+':badge}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
