import { useState } from 'react';
import { Search, Plus, Trash2, Upload } from 'lucide-react';
import { scanTeams } from '../api/claude.js';
import { fetchTeamStats } from '../api/ftcscout.js';
import { BLANK_TEAM } from '../constants.js';

export default function InitialScanTab({ teams, setTeams, setToast }) {
  const [input,   setInput]   = useState('');
  const [state,   setState]   = useState('New Jersey');
  const [loading, setLoading] = useState(false);
  const [docPaste, setDocPaste] = useState('');
  const [showDoc,  setShowDoc]  = useState(false);

  // Parse pasted team numbers (comma, newline, space separated)
  function parseNumbers(raw) {
    return [...new Set(
      raw.split(/[\n,\s]+/)
         .map(s => s.trim())
         .filter(s => /^\d{4,6}$/.test(s))
    )];
  }

  async function runScan() {
    const nums = parseNumbers(input);
    if (nums.length === 0) {
      setToast({ msg: 'Enter some team numbers first.', type: 'warn' });
      return;
    }
    setLoading(true);
    setToast({ msg: `Scanning ${nums.length} teams — AI + FTCScout…`, type: 'ok' });
    try {
      // 1. AI web search scan
      const aiResults = await scanTeams(nums, state);

      // 2. FTCScout for each (merge in OPR/EPA)
      const enriched = await Promise.all(aiResults.map(async r => {
        try {
          const ftc = await fetchTeamStats(r.teamNumber);
          return {
            ...BLANK_TEAM,
            ...r,
            opr: ftc?.opr != null ? String(ftc.opr.toFixed(2)) : r.opr || '',
            epa: ftc?.epa != null ? String(ftc.epa.toFixed(2)) : r.epa || '',
            teamName: r.teamName || ftc?.teamName || '',
            source: 'scan',
            fetchStatus: 'ok',
          };
        } catch {
          return { ...BLANK_TEAM, ...r, source: 'scan', fetchStatus: 'err' };
        }
      }));

      // Merge with existing teams (don't overwrite human edits)
      setTeams(prev => {
        const byNum = Object.fromEntries(prev.map(t => [t.teamNumber, t]));
        const merged = enriched.map(t => {
          const existing = byNum[t.teamNumber];
          if (existing) {
            // Keep human edits, merge new data for non-edited fields
            const humanEdits = existing.humanEdits || {};
            const merged = { ...existing };
            for (const [k, v] of Object.entries(t)) {
              if (!humanEdits[k]) merged[k] = v; // only update if not human-edited
            }
            merged.humanEdits = humanEdits;
            return merged;
          }
          return t;
        });
        // Add any teams not in enriched list
        const mergedNums = new Set(merged.map(t => t.teamNumber));
        const kept = prev.filter(t => !mergedNums.has(t.teamNumber));
        return [...kept, ...merged].sort((a, b) =>
          (parseInt(a.stateRank) || 999) - (parseInt(b.stateRank) || 999)
        );
      });

      setToast({ msg: `✓ Scanned ${enriched.length} teams successfully.`, type: 'ok' });
      setInput('');
    } catch (err) {
      setToast({ msg: `Scan failed: ${err.message}`, type: 'err' });
    } finally {
      setLoading(false);
    }
  }

  function importDocData() {
    // Parse the tab-separated doc format
    const lines = docPaste.trim().split('\n').filter(l => l.trim());
    const parsed = [];
    for (const line of lines) {
      const cols = line.split('\t').map(s => s.trim());
      if (cols.length < 2) continue;
      const teamNumber = cols[0];
      if (!/^\d{4,6}$/.test(teamNumber)) continue;
      parsed.push({
        ...BLANK_TEAM,
        teamNumber,
        teamName:     cols[1] || '',
        stateRank:    cols[2] || '',
        rs:           cols[3] || '',
        matchPoints:  cols[4] || '',
        basePoints:   cols[5] || '',
        autoPoints:   cols[6] || '',
        highScore:    cols[7] || '',
        wlt:          cols[8] || '',
        plays:        cols[9] || '',
        source:       'manual',
        fetchStatus:  'idle',
      });
    }
    if (parsed.length === 0) {
      setToast({ msg: 'No valid team data found. Make sure you copied the whole table from your doc.', type: 'err' });
      return;
    }
    setTeams(prev => {
      const byNum = Object.fromEntries(prev.map(t => [t.teamNumber, t]));
      return parsed.map(t => ({ ...(byNum[t.teamNumber] || {}), ...t,
        humanEdits: byNum[t.teamNumber]?.humanEdits || {} }));
    });
    setToast({ msg: `✓ Imported ${parsed.length} teams from your doc.`, type: 'ok' });
    setDocPaste('');
    setShowDoc(false);
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* AI Scan */}
        <div className="card">
          <h2 style={{ marginBottom: 4, fontSize: 20 }}>Initial Scan</h2>
          <p style={{ fontSize: 12, color: '#a3a3a3', marginBottom: 16 }}>
            Paste team numbers and Claude will search the web + FTCScout to build your sheet automatically.
          </p>
          <div style={{ marginBottom: 12 }}>
            <label>State / Region</label>
            <input value={state} onChange={e => setState(e.target.value)}
              placeholder="e.g. New Jersey" style={{ maxWidth: 240 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Team Numbers (paste a list — comma, space, or newline separated)</label>
            <textarea
              value={input} onChange={e => setInput(e.target.value)}
              placeholder="755, 6101, 9853, 9889, 11248&#10;30439&#10;31149..."
              rows={5}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 12, resize: 'vertical' }}
            />
            <p style={{ fontSize: 11, color: '#525252', marginTop: 4 }}>
              {parseNumbers(input).length > 0
                ? `${parseNumbers(input).length} team numbers detected`
                : 'Tip: you can also type one per line'}
            </p>
          </div>
          <button className="btn btn-primary" onClick={runScan} disabled={loading}>
            {loading
              ? <><div className="spinner" /> Scanning…</>
              : <><Search size={14} /> Run Initial Scan</>}
          </button>
        </div>

        {/* Paste from Google Doc */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <h2 style={{ fontSize: 20 }}>Paste from Google Doc</h2>
              <p style={{ fontSize: 12, color: '#a3a3a3', marginTop: 2 }}>
                Copy your existing table directly from Google Docs/Sheets and paste it here.
              </p>
            </div>
            <button className="btn btn-ghost" onClick={() => setShowDoc(s => !s)}>
              {showDoc ? 'Hide' : 'Show'}
            </button>
          </div>
          {showDoc && (
            <>
              <p style={{ fontSize: 11, color: '#525252', marginBottom: 8 }}>
                Expected column order: Team # · Team Name · State Rank · RS · Match Pts · Base Pts · Auto Pts · High Score · W-L-T · Plays
              </p>
              <textarea
                value={docPaste} onChange={e => setDocPaste(e.target.value)}
                placeholder="Paste your table here..."
                rows={8}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 11, resize: 'vertical', marginBottom: 10 }}
              />
              <button className="btn btn-primary" onClick={importDocData} disabled={!docPaste.trim()}>
                <Upload size={14} /> Import Table
              </button>
            </>
          )}
        </div>

        {/* Current teams summary */}
        {teams.length > 0 && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 20 }}>Current Teams</h2>
                <p style={{ fontSize: 12, color: '#a3a3a3', marginTop: 2 }}>
                  {teams.length} teams loaded · Go to the <b style={{ color: '#f97316' }}>Data</b> tab to view and edit
                </p>
              </div>
              <button className="btn btn-danger" onClick={() => setTeams([])}>
                <Trash2 size={14} /> Clear All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
