import { useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { fetchSheetHeaders } from '../api/sheets.js';
import { FIELD_LABELS, DEFAULT_MINE, PTS, MY_TEAM_NUM } from '../constants.js';
import { calcEst } from '../helpers.js';

const Sect = ({ title }) => (
  <div style={{
    fontSize:11, fontWeight:700, color:'#f97316', textTransform:'uppercase',
    letterSpacing:'0.07em', marginBottom:10, paddingBottom:6,
    borderBottom:'1px solid #1e1e1e',
  }}>{title}</div>
);

const Toggle = ({ label, val, onChange, hint }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'9px 14px', background:'#0f0f0f', borderRadius:6, border:'1px solid #1e1e1e',
    }}>
      <span style={{ fontSize:13 }}>{label}</span>
      <button onClick={() => onChange(!val)} style={{
        width:44, height:24, borderRadius:12, border:'none', cursor:'pointer',
        background: val ? '#f97316' : '#1e1e1e',
        position:'relative', transition:'background 0.2s', flexShrink:0,
      }}>
        <div style={{
          width:18, height:18, borderRadius:'50%', background: val ? '#fff' : '#3a3a3a',
          position:'absolute', top:3, left: val?23:3, transition:'all 0.2s',
        }} />
      </button>
    </div>
    {hint && <p style={{ fontSize:11, color:'#3a3a3a', margin:0, paddingLeft:2 }}>{hint}</p>}
  </div>
);

const Num = ({ label, val, onChange, hint }) => (
  <div>
    <label>{label}</label>
    <input type="number" min="0" step="0.1" value={val ?? 0}
      onChange={e => onChange(parseFloat(e.target.value)||0)} />
    {hint && <p style={{ fontSize:11, color:'#3a3a3a', margin:'3px 0 0', paddingLeft:2 }}>{hint}</p>}
  </div>
);

export default function SettingsTab({ settings, setSettings, mine, setMine, setToast }) {
  const [local,     setLocal]     = useState({ ...settings });
  const [localMine, setLocalMine] = useState({ ...mine });
  const [headers,   setHeaders]   = useState([]);
  const [loadingH,  setLoadingH]  = useState(false);

  const set    = (k, v) => setLocal(p => ({ ...p, [k]: v }));
  const setM   = (k, v) => setLocalMine(p => ({ ...p, [k]: v }));
  const setMap = (k, v) => setLocal(p => ({ ...p, columnMapping: { ...(p.columnMapping||{}), [k]: v } }));

  async function loadHeaders() {
    if (!local.googleApiKey || !local.sheetId) {
      setToast({ msg:'Fill in Google API Key and Sheet ID first.', type:'err' }); return;
    }
    setLoadingH(true);
    try {
      const h = await fetchSheetHeaders({ sheetId:local.sheetId, googleApiKey:local.googleApiKey });
      setHeaders(h);
      setToast({ msg:`✓ Loaded ${h.length} column headers from sheet.`, type:'ok' });
    } catch(err) {
      setToast({ msg:`Sheets error: ${err.message}`, type:'err' });
    } finally { setLoadingH(false); }
  }

  function save() {
    setSettings(local);
    setMine(localMine);
    setToast({ msg:'✓ Settings saved.', type:'ok' });
  }

  const est = calcEst({
    autoLeave: localMine.autoLeave,
    autoClassified: localMine.autoClassified, autoOverflow: localMine.autoOverflow,
    autoPatternPts: localMine.autoPatternPts,
    teleopClassified: localMine.teleopClassified, teleopOverflow: localMine.teleopOverflow,
    teleopDepot: localMine.teleopDepot, teleopPatternPts: localMine.teleopPatternPts,
    baseResult: localMine.baseResult,
  });

  return (
    <div style={{ flex:1, overflowY:'auto', padding:24 }}>
      <div style={{ maxWidth:800, margin:'0 auto', display:'flex', flexDirection:'column', gap:20 }}>

        {/* ── Google API ── */}
        <div className="card">
          <h2 style={{ fontSize:20, marginBottom:16 }}>Google Sheets API</h2>
          <div style={{ marginBottom:12 }}>
            <label>Google API Key</label>
            <input type="password" value={local.googleApiKey||''} onChange={e=>set('googleApiKey',e.target.value)} placeholder="AIza..." />
            <p style={{ fontSize:11, color:'#3a3a3a', marginTop:4 }}>
              Free · Google Cloud Console → Enable Sheets API → Credentials → Create API Key
            </p>
          </div>
          <div>
            <label>Sheet ID</label>
            <input value={local.sheetId||''} onChange={e=>set('sheetId',e.target.value)} placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74..." />
            <p style={{ fontSize:11, color:'#3a3a3a', marginTop:4 }}>
              From your sheet URL: docs.google.com/spreadsheets/d/<b style={{color:'#a3a3a3'}}>SHEET_ID</b>/edit
            </p>
          </div>
          <button className="btn btn-ghost" style={{ marginTop:14 }} onClick={loadHeaders} disabled={loadingH}>
            {loadingH ? <><div className="spinner" style={{width:12,height:12}}/>Loading…</> : <><RefreshCw size={12}/>Load Column Headers</>}
          </button>
        </div>

        {/* ── Column Mapping ── */}
        <div className="card">
          <h2 style={{ fontSize:20, marginBottom:4 }}>Column Mapping — Scouting Form</h2>
          <p style={{ fontSize:12, color:'#a3a3a3', marginBottom:16 }}>
            Match each field to your Google Form column header exactly.{' '}
            {headers.length === 0 && 'Load headers above, or type the exact column header text.'}
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {Object.entries(FIELD_LABELS).map(([key, label]) => (
              <div key={key}>
                <label style={{ fontSize:11 }}>{label}</label>
                {headers.length > 0 ? (
                  <select value={local.columnMapping?.[key]||''} onChange={e=>setMap(key,e.target.value)}>
                    <option value="">— not mapped —</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                ) : (
                  <input
                    value={local.columnMapping?.[key]||''}
                    onChange={e=>setMap(key,e.target.value)}
                    placeholder="Exact column header text..."
                    style={{ fontSize:12 }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Our Robot ── */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
            <div>
              <h2 style={{ fontSize:20 }}>Our Robot — #{MY_TEAM_NUM}</h2>
              <p style={{ fontSize:12, color:'#a3a3a3', marginTop:3 }}>
                Estimated score: <b style={{ color:'#f97316', fontSize:16 }}>{est} pts</b>
              </p>
            </div>
            {/* Point reference card */}
            <div style={{
              fontSize:10, color:'#3a3a3a', fontFamily:'var(--font-mono)',
              lineHeight:2, textAlign:'right', background:'#0a0a0a',
              border:'1px solid #1e1e1e', borderRadius:6, padding:'8px 12px',
            }}>
              <span style={{color:'#a3a3a3'}}>DECODE point values</span><br/>
              Leave +{PTS.leave} · Classified +{PTS.autoClassified}/{PTS.teleopClassified}<br/>
              Overflow +{PTS.autoOverflow}/{PTS.teleopOverflow} · Depot +{PTS.depot}<br/>
              Pattern +{PTS.autoPattern}/{PTS.teleopPattern} · Base {PTS.basePartial}/{PTS.baseFull}<br/>
              <span style={{color:'#f97316'}}>Both full base = +{PTS.baseBothBonus} alliance bonus</span>
            </div>
          </div>

          {/* AUTO */}
          <div style={{ marginBottom:22 }}>
            <Sect title="Auto Period (30 seconds)" />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
              <Toggle label={`Leaves Launch Line (+${PTS.leave}pts)`} val={localMine.autoLeave} onChange={v=>setM('autoLeave',v)} />
              <Toggle label="Opens the Gate" val={localMine.opensGate} onChange={v=>setM('opensGate',v)}
                hint="Gate must be opened by a robot to continue scoring once ramp fills" />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
              <Num label="Classified / match" val={localMine.autoClassified} onChange={v=>setM('autoClassified',v)} hint={`+${PTS.autoClassified}pts each`} />
              <Num label="Overflow / match"   val={localMine.autoOverflow}   onChange={v=>setM('autoOverflow',v)}   hint={`+${PTS.autoOverflow}pt each`} />
              <Num label="Pattern pts / match" val={localMine.autoPatternPts} onChange={v=>setM('autoPatternPts',v)} hint={`+${PTS.autoPattern}pts per motif-matching artifact`} />
            </div>
          </div>

          {/* TELEOP */}
          <div style={{ marginBottom:22 }}>
            <Sect title="Teleop Period (2 minutes)" />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
              <Num label="Classified / match"  val={localMine.teleopClassified} onChange={v=>setM('teleopClassified',v)} hint={`+${PTS.teleopClassified}pts`} />
              <Num label="Overflow / match"    val={localMine.teleopOverflow}   onChange={v=>setM('teleopOverflow',v)}   hint={`+${PTS.teleopOverflow}pt`} />
              <Num label="Depot / match"       val={localMine.teleopDepot}      onChange={v=>setM('teleopDepot',v)}      hint={`+${PTS.depot}pt (fallback)`} />
              <Num label="Pattern pts / match" val={localMine.teleopPatternPts} onChange={v=>setM('teleopPatternPts',v)} hint={`+${PTS.teleopPattern}pts per match`} />
            </div>
          </div>

          {/* ENDGAME */}
          <div style={{ marginBottom:22 }}>
            <Sect title="Endgame — Base Return" />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
              {[
                ['none',    'None',          '0 pts',                  '#3a3a3a'],
                ['partial', 'Partial Return', `+${PTS.basePartial} pts`, '#eab308'],
                ['full',    'Full Return',    `+${PTS.baseFull} pts`,    '#22c55e'],
              ].map(([v, lbl, sub, col]) => (
                <button key={v} onClick={() => setM('baseResult', v)} style={{
                  padding:'14px', borderRadius:8, cursor:'pointer', transition:'all 0.15s',
                  border:`2px solid ${localMine.baseResult===v ? col : '#1e1e1e'}`,
                  background: localMine.baseResult===v ? `${col}11` : '#0f0f0f',
                }}>
                  <div style={{ fontSize:14, fontWeight:700, color: localMine.baseResult===v ? col : '#525252' }}>{lbl}</div>
                  <div style={{ fontSize:11, color:'#525252', marginTop:4 }}>{sub}</div>
                </button>
              ))}
            </div>
            <p style={{ fontSize:11, color:'#3a3a3a', marginTop:8 }}>
              Alliance bonus: if BOTH robots fully return → +{PTS.baseBothBonus}pts (assigned by field, not per-robot)
            </p>
          </div>

          {/* Our stats from doc */}
          <div style={{ marginBottom:22 }}>
            <Sect title="Our Stats (1.17.26 doc)" />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
              {[
                ['matchPoints','Match Pts'], ['basePoints','Base Pts'],
                ['autoPoints','Auto Pts'], ['highScore','High Score'],
                ['wlt','W-L-T'], ['opr','OPR'], ['epa','EPA'],
              ].map(([k,lbl]) => (
                <div key={k}>
                  <label>{lbl}</label>
                  <input value={localMine[k]||''} onChange={e=>setM(k,e.target.value)} placeholder="—" />
                </div>
              ))}
            </div>
          </div>

          {/* Free-form strategy notes for AI */}
          <div>
            <Sect title="Strategy Notes — Given to AI During Analysis" />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[
                ['strengths',   'Our Strengths',  'e.g. Consistent classifier, fast cycles, reliable gate operation…'],
                ['weaknesses',  'Our Weaknesses', 'e.g. Slow base return, struggle with overflow scoring…'],
                ['strategy',    'Match Strategy', 'e.g. Focus on pattern matching, let partner handle gate…'],
                ['extraNotes',  'Extra Notes',    'Anything else Claude should know about our robot…'],
              ].map(([k, lbl, ph]) => (
                <div key={k}>
                  <label>{lbl}</label>
                  <textarea rows={3} value={localMine[k]||''} onChange={e=>setM(k,e.target.value)}
                    placeholder={ph} style={{ resize:'vertical' }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={save}
          style={{ alignSelf:'flex-start', padding:'11px 32px', fontSize:14 }}>
          <Save size={15}/> Save Settings
        </button>
      </div>
    </div>
  );
}
