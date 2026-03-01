const TITLES = {
  data:     'Scouting Data',
  scan:     'Initial Scan',
  form:     'Form Import',
  settings: 'Settings',
};

export default function Header({ tab, teamCount, targetCount }) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '0 16px', height: 52,
      background: '#080808', borderBottom: '1px solid #1e1e1e', flexShrink: 0,
    }}>
      <img
        src="/Logo.png"
        alt="CNP Scout"
        style={{ height: 38, width: 38, objectFit: 'contain', borderRadius: 4 }}
      />
      <span style={{
        fontFamily: 'var(--font-head)', fontSize: 20,
        letterSpacing: '0.08em', color: '#f97316',
      }}>
        CNP SCOUT
      </span>
      <span style={{ color: '#1e1e1e', fontSize: 18 }}>|</span>
      <span style={{
        fontFamily: 'var(--font-head)', fontSize: 16,
        color: '#3a3a3a', letterSpacing: '0.05em',
      }}>
        {TITLES[tab] || tab.toUpperCase()}
      </span>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
        {targetCount > 0 && (
          <span style={{
            fontSize: 11, fontFamily: 'var(--font-mono)',
            color: '#f97316', background: 'rgba(249,115,22,0.1)',
            border: '1px solid rgba(249,115,22,0.3)',
            padding: '2px 10px', borderRadius: 12,
          }}>
            ★ {targetCount} target{targetCount !== 1 ? 's' : ''}
          </span>
        )}
        <span style={{ fontSize: 11, color: '#3a3a3a', fontFamily: 'var(--font-mono)' }}>
          #30439 · DECODE 25-26
        </span>
      </div>
    </header>
  );
}
