import { RefreshCw, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { fmt, fmtWLT, calcEst, endgameLabel } from '../helpers.js';

export default function TeamCard({ team, onFetch }) {
  const status = team.fetchStatus;
  const est = calcEst(team);

  return (
    <div className="card" style={{ position: 'relative' }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <span style={{ fontFamily: 'var(--font-head)', fontSize: 24, color: '#f97316' }}>
            #{team.teamNumber}
          </span>
          {team.teamName && (
            <span style={{ marginLeft: 8, color: '#a3a3a3', fontSize: 13 }}>{team.teamName}</span>
          )}
          {team.matchCount > 1 && (
            <span style={{ marginLeft: 8, fontSize: 11, color: '#525252', fontFamily: 'var(--font-mono)' }}>
              avg of {team.matchCount} matches
            </span>
          )}
        </div>
        <button className="btn btn-ghost" onClick={() => onFetch(team.teamNumber)}
          style={{ padding: '4px 8px', fontSize: 12 }} disabled={status === 'loading'}>
          {status === 'loading' ? <><div className="spinner" style={{ width: 12, height: 12 }} /> Loading</> :
           status === 'ok'      ? <><CheckCircle size={12} color="var(--grn)" /> Fetched</> :
           status === 'err'     ? <><AlertCircle size={12} color="var(--red)" /> Retry</> :
                                  <><RefreshCw size={12} /> FTCScout</>}
        </button>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12 }}>
        <div className="stat-chip"><div className="val">{est}</div><div className="lbl">Est Pts</div></div>
        <div className="stat-chip"><div className="val">{fmt(team.opr, 1)}</div><div className="lbl">OPR</div></div>
        <div className="stat-chip"><div className="val">{fmt(team.epa, 1)}</div><div className="lbl">EPA/NP</div></div>
        <div className="stat-chip"><div className="val">{fmtWLT(team)}</div><div className="lbl">W-L-T</div></div>
      </div>

      {/* Scouted breakdown */}
      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#a3a3a3', flexWrap: 'wrap' }}>
        <span><b style={{ color: '#f97316' }}>Auto:</b> {team.autoSamples}S {team.autoSpecimen}Sp · {team.autoParking}</span>
        <span><b style={{ color: '#f97316' }}>Teleop:</b> LB×{team.teleopLowBasket} HB×{team.teleopHighBasket} LC×{team.teleopLowChamber} HC×{team.teleopHighChamber}</span>
        <span><b style={{ color: '#f97316' }}>End:</b> {endgameLabel(team.endgame)}</span>
        {team.stateRank && <span><b style={{ color: '#f97316' }}>Rank:</b> #{team.stateRank}</span>}
      </div>
    </div>
  );
}
