/* AMAVA shared UI — icons + reusable presentational components.
   Exported to window for the screen + report scripts. */

const { useState, useEffect, useRef } = React;

/* ---------- Icons (simple line set) ---------- */
const PATHS = {
  home:    'M3 11l9-7 9 7M5 10v9a1 1 0 001 1h12a1 1 0 001-1v-9',
  people:  'M16 19v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 10a3 3 0 100-6 3 3 0 000 6zM17 11a3 3 0 10-1-5.8M21 19v-1a4 4 0 00-3-3.8',
  chart:   'M4 20V10M10 20V4M16 20v-7M22 20H2',
  report:  'M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1zM14 3v5h5M9 13h7M9 17h5',
  gear:    'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 00-2-1.2L14 2h-4l-.5 2.6a7 7 0 00-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1c.6.5 1.3.9 2 1.2L10 22h4l.5-2.6c.7-.3 1.4-.7 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z',
  chevron: 'M9 6l6 6-6 6',
  back:    'M15 6l-6 6 6 6',
  check:   'M20 6L9 17l-5-5',
  plus:    'M12 5v14M5 12h14',
  sun:     'M12 3v2M12 19v2M5 5l1.5 1.5M17.5 17.5L19 19M3 12h2M19 12h2M5 19l1.5-1.5M17.5 6.5L19 5M12 8a4 4 0 100 8 4 4 0 000-8z',
  heart:   'M12 20s-7-4.5-9.5-9A4.5 4.5 0 0112 5a4.5 4.5 0 019.5 6c-2.5 4.5-9.5 9-9.5 9z',
  spark:   'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
  leaf:    'M5 19c0-8 6-13 14-13 0 8-5 14-13 14M5 19c2-3 4-5 7-6.5',
  search:  'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
  download:'M12 3v12M7 11l5 5 5-5M5 21h14',
  print:   'M6 9V3h12v6M6 18H4a1 1 0 01-1-1v-5a1 1 0 011-1h16a1 1 0 011 1v5a1 1 0 01-1 1h-2M6 14h12v7H6z',
  arrowup: 'M12 19V5M6 11l6-6 6 6',
  arrowright:'M5 12h14M13 6l6 6-6 6',
  flag:    'M5 21V4M5 4s1.5-1 4-1 4 2 7 2 3-1 3-1v9s-1 1-3 1-4.5-2-7-2-4 1-4 1',
  pencil:  'M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z',
  wifi:    'M5 12.5a10 10 0 0114 0M8.5 16a5 5 0 017 0M12 19.5h.01',
  logout:  'M9 21H5a1 1 0 01-1-1V4a1 1 0 011-1h4M16 17l5-5-5-5M21 12H9',
  info:    'M12 16v-4M12 8h.01M12 21a9 9 0 100-18 9 9 0 000 18z',
};
function Icon({ name, size = 24, stroke = 2, color = 'currentColor', fill = 'none', style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <path d={PATHS[name] || ''} />
    </svg>
  );
}

/* ---------- Logo lockup ---------- */
function Logo({ size = 30, sub = true, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
      <span className="am-logo" style={{ fontSize: size, color }}>Amava</span>
      {sub && <span style={{ fontWeight: 800, fontSize: size * 0.26, letterSpacing: '.34em',
        textTransform: 'uppercase', color: 'var(--sage)', marginTop: 4, marginLeft: 2 }}>Oluntu</span>}
    </div>
  );
}

/* ---------- App bar ---------- */
function AppBar({ title, onBack, right, center, big }) {
  return (
    <div className="am-appbar">
      <div className="am-appbar__row">
        {onBack && (
          <button className="am-back" onClick={onBack} aria-label="Back">
            <Icon name="back" size={26} />
          </button>
        )}
        <div className={'am-appbar__title' + (center ? ' center' : '')} style={big ? { fontSize: '1.6rem', fontWeight: 900 } : null}>{title}</div>
        {right}
      </div>
    </div>
  );
}

/* ---------- Avatar ---------- */
const AVA_COLORS = ['#DD866C', '#6fa173', '#687F8B', '#c9a24a', '#7fae9f', '#b07d63'];
function Avatar({ name, color, size = 46 }) {
  const initials = name.split(' ').map(s => s[0]).slice(0, 2).join('');
  const c = color || AVA_COLORS[(name.charCodeAt(0) + name.length) % AVA_COLORS.length];
  return (
    <div className="am-ava" style={{ width: size, height: size, flexBasis: size, background: c, fontSize: size * 0.36, borderRadius: size * 0.3 }}>
      {initials}
    </div>
  );
}

/* ---------- Sync banner ---------- */
function SyncBanner({ online, pending }) {
  return (
    <div className={'am-sync ' + (online ? 'am-sync--on' : 'am-sync--off')}>
      <span className="am-sync__dot" />
      {online ? 'Saved & synced' : 'Offline — saved on this phone'}
      {pending > 0 && <span style={{ opacity: .85 }}>· {pending} waiting</span>}
    </div>
  );
}

/* ---------- Status pill for a child ---------- */
function StatusPill({ status }) {
  const map = {
    up:   { cls: 'am-tag--up',   icon: 'arrowup', text: 'Improving' },
    flat: { cls: 'am-tag--flat', text: 'Steady' },
    down: { cls: 'am-tag--down', text: 'Watch' },
    base: { cls: 'am-tag--flat', text: 'Baseline done' },
    new:  { cls: 'am-tag--flat', text: 'Not started' },
  };
  const m = map[status.key] || map.flat;
  return (
    <span className={'am-tag ' + m.cls}>
      {m.icon && <Icon name={m.icon} size={13} stroke={2.6} />}
      {m.text}
    </span>
  );
}

/* ---------- Horizontal bar chart (baseline → latest) ---------- */
function Bars({ data, max = 4, showBaseline = true }) {
  return (
    <div className="am-bars">
      {data.map((d, i) => {
        const pct = Math.max(4, ((d.value ?? 0) / max) * 100);
        const basePct = d.baseline != null ? (d.baseline / max) * 100 : null;
        const color = d.color || 'var(--good)';
        return (
          <div key={i}>
            <div className="am-bar__top">
              <span className="am-bar__lab">{d.label}</span>
              <span className="am-bar__val">{d.value ?? '—'}{d.suffix || ''}</span>
            </div>
            <div className="am-bar__track">
              <div className="am-bar__fill" style={{ width: pct + '%', background: color }} />
              {showBaseline && basePct != null && <div className="am-bar__base" style={{ left: `calc(${basePct}% - 1px)` }} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Mini trend (baseline vs latest dumbbell) ---------- */
function Dumbbell({ baseline, latest, max = 4 }) {
  const bp = baseline != null ? (baseline / max) * 100 : null;
  const lp = latest != null ? (latest / max) * 100 : null;
  const up = latest != null && baseline != null && latest >= baseline;
  return (
    <div style={{ position: 'relative', height: 26, flex: 1 }}>
      <div style={{ position: 'absolute', top: 12, left: 0, right: 0, height: 3, borderRadius: 2, background: 'var(--surface-2)', border: '1px solid var(--line)' }} />
      {bp != null && lp != null && (
        <div style={{ position: 'absolute', top: 11.5, height: 4, borderRadius: 2,
          left: Math.min(bp, lp) + '%', width: Math.abs(lp - bp) + '%',
          background: up ? 'var(--good)' : 'var(--warn)' }} />
      )}
      {bp != null && <Dot left={bp} ring />}
      {lp != null && <Dot left={lp} color={up ? 'var(--good)' : 'var(--warn)'} />}
    </div>
  );
}
function Dot({ left, color, ring }) {
  return <div style={{ position: 'absolute', top: 7, left: `calc(${left}% - 7px)`, width: 14, height: 14,
    borderRadius: 999, background: ring ? 'var(--surface)' : color, border: ring ? '3px solid var(--sage)' : '3px solid var(--surface)',
    boxShadow: ring ? 'none' : '0 1px 3px rgba(0,0,0,.18)' }} />;
}

/* ---------- Donut (single value gauge) ---------- */
function Donut({ value, label, sublabel, color = 'var(--good)', size = 116 }) {
  const r = (size - 16) / 2, c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: `0 0 ${size}px` }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth="11" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: size * 0.27, color: 'var(--ink)', letterSpacing: '-.04em', lineHeight: 1 }}>{label}</div>
          {sublabel && <div style={{ fontWeight: 800, fontSize: size * 0.1, color: 'var(--ink-soft)', marginTop: 3 }}>{sublabel}</div>}
        </div>
      </div>
    </div>
  );
}

/* ---------- Toast ---------- */
function Toast({ show, children }) {
  if (!show) return null;
  return <div className="am-toast"><Icon name="check" size={18} stroke={3} /> {children}</div>;
}

Object.assign(window, { Icon, Logo, AppBar, Avatar, SyncBanner, StatusPill, Bars, Dumbbell, Donut, Toast, AVA_COLORS });
