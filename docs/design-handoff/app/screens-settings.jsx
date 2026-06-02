/* AMAVA — Settings: full screen + sub-screens (programmes, areas, scale,
   facilitators, offline). Presentational reference; real editors stay in the
   codebase. Sample facilitator data lives here (mirror accounts-client). */

const { useState: useStateSet } = React;

/* sample facilitators — replace with accounts-client data */
const FACILITATORS = [
  { name: 'Nomsa Dlamini',  role: 'Coordinator', classes: 'All classes',        status: 'active'  },
  { name: 'Thandi Mkhize',  role: 'Facilitator', classes: 'Sunrise Class',      status: 'active'  },
  { name: 'Joseph Adams',   role: 'Facilitator', classes: 'Garden Club',        status: 'active'  },
  { name: 'Lerato Khumalo', role: 'Facilitator', classes: 'Afternoon Group',    status: 'active'  },
  { name: 'Sipho Ndaba',    role: 'Facilitator', classes: 'Sunrise Class',      status: 'invited' },
  { name: 'Aisha Patel',    role: 'Facilitator', classes: 'Garden Club',        status: 'active'  },
];

/* small reusable subhead for sub-screens */
function SubHead({ eyebrow, title, sub }) {
  return (
    <div>
      {eyebrow && <div className="am-eyebrow">{eyebrow}</div>}
      <div className="am-h1" style={{ fontSize: '1.5rem', marginTop: 2 }}>{title}</div>
      {sub && <p className="am-muted" style={{ margin: '6px 0 0', fontSize: '.95rem' }}>{sub}</p>}
    </div>
  );
}

/* ============================ SETTINGS (main) ============================ */
function SettingsScreen({ nav, t, setTweak }) {
  const groups = [
    { h: 'Programme set-up', rows: [
      { t: 'Programmes & classes', s: '1 programme · 3 classes', icon: 'people', go: 'settings-programmes' },
      { t: 'Areas & indicators',   s: '5 areas · 24 indicators', icon: 'spark',  go: 'settings-areas' },
      { t: 'Rating scale',         s: '1–4 · Emerging → Strong', icon: 'chart',  go: 'settings-scale' },
    ]},
    { h: 'People', rows: [
      { t: 'Facilitator accounts', s: '6 facilitators · 1 invited', icon: 'people', go: 'settings-facilitators' },
    ]},
    { h: 'This phone', rows: [
      { t: 'Offline data & sync', s: 'Everything saved · synced today', icon: 'wifi', go: 'settings-offline' },
    ]},
  ];
  const simple = t.direction === 'simple';

  return (
    <div className="am-screen">
      <AppBar title="Settings" />
      <div className="am-scroll am-pad am-anim" style={{ paddingTop: 14, paddingBottom: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* account */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar name={AMAVA.user.name} color="var(--brand)" size={56} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>{AMAVA.user.name}</div>
            <div className="am-row__sub" style={{ textTransform: 'capitalize' }}>{AMAVA.user.role} · {AMAVA.orgName}</div>
          </div>
        </div>

        {/* appearance / accessibility */}
        <div>
          <div className="am-sectionlab"><span className="am-eyebrow">Display</span></div>
          <div className="am-stack" style={{ gap: 10, marginTop: 8 }}>
            <div className="am-card am-card--pad am-stack" style={{ gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="am-ctrl__lab">Text size</span>
                <span className="am-chip" style={{ cursor: 'default' }}>{Math.round(t.textScale * 100)}%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontWeight: 900, fontSize: '.95rem', color: 'var(--ink-soft)' }}>A</span>
                <input className="am-range" type="range" min={0.9} max={1.35} step={0.05} value={t.textScale}
                  onChange={e => setTweak('textScale', +e.target.value)} style={{ flex: 1 }} aria-label="Text size" />
                <span style={{ fontWeight: 900, fontSize: '1.55rem', color: 'var(--ink-soft)', lineHeight: 1 }}>A</span>
              </div>
              <p className="am-muted" style={{ margin: 0, fontSize: '.92rem' }}>Drag to make every screen easier to read.</p>
            </div>

            <div className="am-ctrl">
              <div style={{ flex: 1 }}>
                <div className="am-ctrl__lab">Big &amp; Simple mode</div>
                <div className="am-ctrl__sub">Bigger buttons, higher contrast, less clutter.</div>
              </div>
              <button className={'am-switch' + (simple ? ' on' : '')} role="switch" aria-checked={simple}
                aria-label="Big and Simple mode" onClick={() => setTweak('direction', simple ? 'soft' : 'simple')}>
                <span className="am-switch__knob" />
              </button>
            </div>
          </div>
        </div>

        {/* grouped settings rows */}
        {groups.map(g => (
          <div key={g.h}>
            <div className="am-sectionlab"><span className="am-eyebrow">{g.h}</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              {g.rows.map(r => (
                <button key={r.t} className="am-row" onClick={() => nav.go(r.go)}>
                  <div className="am-ava" style={{ width: 40, height: 40, flexBasis: 40, borderRadius: 12, background: 'var(--surface-2)' }}>
                    <Icon name={r.icon} size={20} color="var(--brand)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="am-row__title" style={{ fontSize: '1rem' }}>{r.t}</div>
                    <div className="am-row__sub">{r.s}</div>
                  </div>
                  <Icon name="chevron" size={20} color="var(--sage)" />
                </button>
              ))}
            </div>
          </div>
        ))}

        <button className="am-btn am-btn--ghost am-btn--block" style={{ marginTop: 6, color: 'var(--warn)', borderColor: 'var(--line)' }} onClick={() => nav.go('login')}>
          <Icon name="logout" size={20} /> Sign out
        </button>
        <p className="am-muted" style={{ textAlign: 'center', fontSize: '.74rem', margin: 0 }}>{AMAVA.regLine}</p>
      </div>
      <BottomNav nav={nav} active="settings" />
    </div>
  );
}

/* shared layout for a settings detail screen */
function SubScreen({ nav, title, children }) {
  return (
    <div className="am-screen">
      <AppBar title={title} onBack={() => nav.go('settings')} />
      <div className="am-scroll am-pad am-anim" style={{ paddingTop: 14, paddingBottom: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
      <BottomNav nav={nav} active="settings" />
    </div>
  );
}

/* ============================ PROGRAMMES & CLASSES ============================ */
function SettingsProgrammes({ nav }) {
  return (
    <SubScreen nav={nav} title="Programmes & classes">
      <SubHead eyebrow="Programme" title={AMAVA.programmeName}
        sub="The set of areas, indicators and classes you assess against." />
      <div className="am-card am-card--pad" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <span className="am-chip" style={{ cursor: 'default' }}><Icon name="spark" size={14} /> 5 areas</span>
        <span className="am-chip" style={{ cursor: 'default' }}>24 indicators</span>
        <span className="am-chip" style={{ cursor: 'default' }}>1–4 scale</span>
        <span className="am-chip" style={{ cursor: 'default' }}><Icon name="leaf" size={14} /> Garden component</span>
      </div>

      <div className="am-sectionlab"><span className="am-eyebrow">Classes</span></div>
      <div className="am-stack" style={{ gap: 10 }}>
        {AMAVA.classes.map(c => {
          const n = AMAVA.children.filter(k => k.classId === c.id).length;
          return (
            <div key={c.id} className="am-row" style={{ cursor: 'pointer' }}>
              <div className="am-ava" style={{ background: c.color }}><Icon name="people" size={22} color="#fff" /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="am-row__title">{c.name}</div>
                <div className="am-row__sub">{n} children{c.garden ? ' · Garden class' : ''}</div>
              </div>
              <Icon name="pencil" size={18} color="var(--sage)" />
            </div>
          );
        })}
      </div>
      <button className="am-btn am-btn--ghost am-btn--block" style={{ borderStyle: 'dashed' }}>
        <Icon name="plus" size={20} /> Add a class
      </button>
    </SubScreen>
  );
}

/* ============================ AREAS & INDICATORS ============================ */
function SettingsAreas({ nav }) {
  return (
    <SubScreen nav={nav} title="Areas & indicators">
      <SubHead eyebrow="What you assess" title="5 development areas"
        sub="Each child is scored on every indicator below. Garden indicators only apply to garden classes." />
      {AMAVA.areas.map(a => (
        <div key={a.id} className="am-card am-card--pad">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div className="am-ava" style={{ background: 'var(--brand)', width: 40, height: 40, flexBasis: 40, borderRadius: 12 }}>
              <Icon name={a.icon} size={22} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{a.name}</div>
              <div className="am-row__sub">{a.indicators.length} indicators{a.gardenOnly ? ' · garden only' : ''}</div>
            </div>
            <Icon name="pencil" size={18} color="var(--sage)" />
          </div>
          <div className="am-stack" style={{ gap: 7 }}>
            {a.indicators.map((ind, i) => (
              <div key={ind.id} style={{ display: 'flex', gap: 11, alignItems: 'baseline' }}>
                <span style={{ fontWeight: 900, color: 'var(--sage)', fontSize: '.82rem', flex: '0 0 18px' }}>{i + 1}</span>
                <span style={{ fontSize: '.95rem', fontWeight: 600 }}>{ind.text}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <button className="am-btn am-btn--ghost am-btn--block" style={{ borderStyle: 'dashed' }}>
        <Icon name="plus" size={20} /> Add an area
      </button>
    </SubScreen>
  );
}

/* ============================ RATING SCALE ============================ */
function SettingsScale({ nav }) {
  return (
    <SubScreen nav={nav} title="Rating scale">
      <SubHead eyebrow="How you score" title="The 1–4 scale"
        sub="Every indicator is scored on this scale. Facilitators tap a number during an assessment." />
      <div className="am-stack" style={{ gap: 10 }}>
        {AMAVA.descriptors.map(d => (
          <div key={d.value} className="am-defrow">
            <span className="am-defrow__num">{d.value}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '1.02rem' }}>{d.label}</div>
              <div className="am-row__sub">{d.description}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="am-card am-card--pad" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Icon name="info" size={22} color="var(--brand)" style={{ flex: '0 0 22px', marginTop: 1 }} />
        <p className="am-muted" style={{ margin: 0, fontSize: '.92rem' }}>
          A child counts as <strong style={{ color: 'var(--good)' }}>improved</strong> when their score rises by 1 or more between the baseline and a later check-in.
        </p>
      </div>
      <button className="am-btn am-btn--ghost am-btn--block">
        <Icon name="pencil" size={18} /> Edit scale labels
      </button>
    </SubScreen>
  );
}

/* ============================ FACILITATOR ACCOUNTS ============================ */
function SettingsFacilitators({ nav }) {
  return (
    <SubScreen nav={nav} title="Facilitators">
      <SubHead eyebrow="People" title="Who can record assessments"
        sub="Coordinators see every class and all reports. Facilitators see only their own classes." />
      <div className="am-stack" style={{ gap: 10 }}>
        {FACILITATORS.map(f => {
          const invited = f.status === 'invited';
          return (
            <div key={f.name} className="am-row" style={{ cursor: 'pointer' }}>
              <Avatar name={f.name} size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="am-row__title" style={{ fontSize: '1.02rem' }}>{f.name}</div>
                <div className="am-row__sub">{f.role} · {f.classes}</div>
              </div>
              <span className="am-tag" style={invited
                ? { background: 'color-mix(in srgb, var(--highlight) 30%, var(--surface))', color: 'var(--terracotta-deep)' }
                : { background: 'var(--good-soft)', color: 'var(--good)' }}>
                {invited ? 'Invited' : 'Active'}
              </span>
            </div>
          );
        })}
      </div>
      <button className="am-btn am-btn--brand am-btn--block">
        <Icon name="plus" size={20} /> Invite a facilitator
      </button>
    </SubScreen>
  );
}

/* ============================ OFFLINE DATA & SYNC ============================ */
function SettingsOffline({ nav }) {
  const stored = AMAVA.children.filter(c => c.baseline).length;
  return (
    <SubScreen nav={nav} title="Offline data & sync">
      <div className="am-card am-card--pad" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 56, height: 56, flex: '0 0 56px', borderRadius: 18, background: 'var(--good-soft)', display: 'grid', placeItems: 'center' }}>
          <Icon name="check" size={28} color="var(--good)" stroke={3} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Everything is saved</div>
          <div className="am-row__sub">Last synced today at 09:14</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="am-stat">
          <div className="am-stat__v">{stored}</div>
          <div className="am-stat__l">On this phone</div>
          <div className="am-stat__s">assessments stored</div>
        </div>
        <div className="am-stat">
          <div className="am-stat__v" style={{ color: 'var(--good)' }}>0</div>
          <div className="am-stat__l">Waiting</div>
          <div className="am-stat__s">to upload</div>
        </div>
      </div>

      <button className="am-btn am-btn--brand am-btn--block">
        <Icon name="wifi" size={20} /> Sync now
      </button>

      <div className="am-card am-card--pad" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Icon name="info" size={22} color="var(--brand)" style={{ flex: '0 0 22px', marginTop: 1 }} />
        <p className="am-muted" style={{ margin: 0, fontSize: '.92rem' }}>
          You can keep working with no signal. Everything is saved on this phone and uploads on its own once you’re back online.
        </p>
      </div>
    </SubScreen>
  );
}

Object.assign(window, {
  SettingsScreen, SettingsProgrammes, SettingsAreas, SettingsScale,
  SettingsFacilitators, SettingsOffline, FACILITATORS,
});
