/* AMAVA screens — Login, Home, Child list, Assessment flow. */

const { useState: useStateS, useRef: useRefS, useEffect: useEffectS } = React;

/* ============================ LOGIN ============================ */
function LoginScreen({ nav }) {
  const [user, setUser] = useStateS('nomsa');
  const [pw, setPw] = useStateS('••••••••');
  return (
    <div className="am-screen" style={{ background: 'var(--bg)' }}>
      <div className="am-scroll am-pad" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* warm hero band */}
        <div style={{ paddingTop: 78, paddingBottom: 26, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 92, height: 92, borderRadius: 28, background: 'var(--brand)', display: 'grid', placeItems: 'center', boxShadow: 'var(--shadow-lg)', marginBottom: 20 }}>
            <Icon name="leaf" size={48} color="#fff" stroke={1.8} />
          </div>
          <Logo size={48} />
          <p className="am-muted" style={{ marginTop: 18, fontSize: '1.05rem', maxWidth: 280 }}>
            Welcome back. Sign in to record how your children are growing.
          </p>
        </div>

        <div className="am-card am-card--pad am-stack" style={{ gap: 16, marginTop: 8 }}>
          <label className="am-field">
            <span className="am-field__lab">Username</span>
            <input className="am-input" value={user} onChange={e => setUser(e.target.value)} autoCapitalize="none" />
          </label>
          <label className="am-field">
            <span className="am-field__lab">Password</span>
            <input className="am-input" type="password" value={pw} onChange={e => setPw(e.target.value)} />
          </label>
          <button className="am-btn am-btn--primary am-btn--block am-btn--lg" onClick={() => nav.go('home')}>
            Sign in
          </button>
          <p className="am-muted" style={{ fontSize: '.86rem', textAlign: 'center', margin: 0 }}>
            Use the username your coordinator gave you.
          </p>
        </div>

        <div style={{ flex: 1 }} />
        <p className="am-muted" style={{ textAlign: 'center', fontSize: '.74rem', padding: '24px 0 14px' }}>
          {AMAVA.regLine}
        </p>
      </div>
    </div>
  );
}

/* ============================ HOME ============================ */
function HomeScreen({ nav }) {
  const classes = AMAVA.classes;
  const childrenByClass = (cid) => AMAVA.children.filter(c => c.classId === cid);
  const totalChildren = AMAVA.children.length;
  const assessedThisTerm = AMAVA.children.filter(c => c.latest).length;

  return (
    <div className="am-screen">
      {/* custom warm header */}
      <div className="am-appbar" style={{ background: 'var(--surface)' }}>
        <div className="am-appbar__row" style={{ paddingBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div className="am-eyebrow">Hello, {AMAVA.user.firstName}</div>
            <Logo size={30} sub={false} />
          </div>
          <Avatar name={AMAVA.user.name} color="var(--brand)" size={46} />
        </div>
      </div>

      <div className="am-scroll am-pad am-anim" style={{ paddingTop: 16, paddingBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SyncBanner online pending={0} />

        {/* term snapshot */}
        <div className="am-card am-card--pad" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Donut value={Math.round((assessedThisTerm / totalChildren) * 100)} label={`${assessedThisTerm}/${totalChildren}`} sublabel="this term" color="var(--good)" size={104} />
          <div style={{ flex: 1 }}>
            <div className="am-h2">This term's progress</div>
            <p className="am-muted" style={{ margin: '6px 0 0', fontSize: '.92rem' }}>
              {assessedThisTerm} of {totalChildren} children have a follow-up assessment. Keep going!
            </p>
          </div>
        </div>

        <div className="am-sectionlab"><span className="am-eyebrow">My classes</span></div>

        {classes.map(c => {
          const kids = childrenByClass(c.id);
          const done = kids.filter(k => k.latest).length;
          return (
            <button key={c.id} className="am-row" onClick={() => nav.go('class', { classId: c.id })}>
              <div className="am-ava" style={{ background: c.color }}>
                <Icon name="people" size={24} color="#fff" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="am-row__title">{c.name}</div>
                <div className="am-row__sub">{kids.length} children · {done} assessed this term</div>
              </div>
              <Icon name="chevron" className="am-row__chev" size={22} color="var(--sage)" />
            </button>
          );
        })}

        <button className="am-btn am-btn--brand am-btn--block" style={{ marginTop: 4 }} onClick={() => nav.go('reports')}>
          <Icon name="chart" size={22} /> View reports
        </button>
      </div>

      <BottomNav nav={nav} active="home" />
    </div>
  );
}

/* ============================ CHILD LIST ============================ */
function ChildListScreen({ nav, params }) {
  const cls = AMAVA.classes.find(c => c.id === params.classId);
  const [q, setQ] = useStateS('');
  const kids = AMAVA.children.filter(c => c.classId === params.classId);
  const filtered = kids.filter(k => (k.firstName + ' ' + k.surname).toLowerCase().includes(q.toLowerCase()));
  const done = kids.filter(k => k.latest).length;

  return (
    <div className="am-screen">
      <AppBar title={cls?.name} onBack={() => nav.go('home')} />
      <div className="am-scroll am-pad am-anim" style={{ paddingTop: 14, paddingBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="am-chip" style={{ background: 'var(--good-soft)', color: 'var(--good)', borderColor: 'transparent' }}>
            {done} of {kids.length} assessed
          </span>
          {cls?.garden && <span className="am-chip"><Icon name="leaf" size={14} /> Garden class</span>}
        </div>

        {/* search */}
        <div style={{ position: 'relative' }}>
          <Icon name="search" size={20} color="var(--sage)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
          <input className="am-input" placeholder="Find a child…" value={q} onChange={e => setQ(e.target.value)} style={{ paddingLeft: 46 }} />
        </div>

        {filtered.map(k => {
          const st = childStatus(k);
          return (
            <button key={k.id} className="am-row" onClick={() => nav.go('assess', { childId: k.id })}>
              <Avatar name={k.firstName + ' ' + k.surname} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="am-row__title">{k.firstName} {k.surname}</div>
                <div className="am-row__sub">
                  {st.key === 'new' ? 'Tap to start baseline' : st.key === 'base' ? 'Tap to add quarterly check-in' : 'Tap to assess'}
                  {!k.sample && ' · not in sample'}
                </div>
              </div>
              <StatusPill status={st} />
            </button>
          );
        })}

        <button className="am-btn am-btn--ghost am-btn--block" style={{ marginTop: 6, borderStyle: 'dashed' }}>
          <Icon name="plus" size={22} /> Add a child
        </button>
      </div>
      <BottomNav nav={nav} active="home" />
    </div>
  );
}

/* ============================ ASSESSMENT FLOW ============================ */
function AssessScreen({ nav, params }) {
  const child = AMAVA.children.find(c => c.id === params.childId);
  const cls = AMAVA.classes.find(c => c.id === child.classId);
  const type = child.baseline ? 'quarterly' : 'baseline';
  const areas = AMAVA.areas.filter(a => !a.gardenOnly || cls.garden);
  const totalSteps = areas.length + 1; // +1 review

  const [step, setStep] = useStateS(0);
  const [scores, setScores] = useStateS({});
  const [notes, setNotes] = useStateS({});
  const [co, setCo] = useStateS('');
  const [err, setErr] = useStateS(false);
  const scrollRef = useRefS(null);

  const isReview = step === areas.length;
  const area = areas[step];

  useEffectS(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [step]);

  const allInds = areas.flatMap(a => a.indicators);
  const scored = allInds.filter(i => scores[i.id] != null).length;

  function next() {
    if (!isReview) {
      const unscored = area.indicators.filter(i => scores[i.id] == null);
      if (unscored.length) { setErr(true); return; }
      setErr(false); setStep(s => s + 1);
    }
  }
  function save() {
    nav.go('class', { classId: cls.id, saved: child.firstName });
  }

  return (
    <div className="am-screen">
      {/* header with progress */}
      <div className="am-appbar">
        <div className="am-appbar__row" style={{ paddingBottom: 10 }}>
          <button className="am-back" onClick={() => step === 0 ? nav.go('class', { classId: cls.id }) : setStep(s => s - 1)} aria-label="Back">
            <Icon name="back" size={26} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="am-appbar__title" style={{ fontSize: '1.15rem' }}>{child.firstName} {child.surname}</div>
            <div className="am-row__sub">{type === 'baseline' ? 'First assessment' : 'Quarterly check-in'} · {cls.name}</div>
          </div>
          <Avatar name={child.firstName + ' ' + child.surname} size={42} />
        </div>
        <div className="am-pad" style={{ paddingBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="am-steps">
            {areas.map((a, i) => <div key={a.id} className={'am-steps__d' + (i < step ? ' done' : i === step ? ' now' : '')} />)}
            <div className={'am-steps__d' + (isReview ? ' now' : '')} />
          </div>
          <div className="am-row__sub" style={{ fontWeight: 700 }}>
            {isReview ? 'Review & save' : `Step ${step + 1} of ${totalSteps} · ${area.name}`}
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="am-scroll am-pad" style={{ paddingTop: 16, paddingBottom: 120 }}>
        {!isReview ? (
          <div className="am-anim" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="am-ava" style={{ background: 'var(--brand)', width: 44, height: 44, flexBasis: 44 }}>
                <Icon name={area.icon} size={24} color="#fff" />
              </div>
              <div>
                <div className="am-eyebrow">{type === 'baseline' ? 'Baseline' : 'Quarterly'}</div>
                <div className="am-h2">{area.name}</div>
              </div>
            </div>

            {area.indicators.map(ind => (
              <div key={ind.id}>
                <p style={{ fontWeight: 800, fontSize: '1.06rem', margin: '0 0 4px' }}>{ind.text}</p>
                <p className="am-muted" style={{ margin: '0 0 12px', fontSize: '.9rem' }}>How often do you see this?</p>
                <div className="am-scale">
                  {AMAVA.descriptors.map(d => (
                    <button key={d.value} className={'am-scaleopt' + (scores[ind.id] === d.value ? ' on' : '')}
                      onClick={() => { setScores(s => ({ ...s, [ind.id]: d.value })); setErr(false); }}>
                      <span className="am-scaleopt__num">{d.value}</span>
                      <span style={{ flex: 1 }}>
                        <span className="am-scaleopt__lab">{d.label}</span>
                        <span className="am-scaleopt__desc" style={{ display: 'block' }}>{d.description}</span>
                      </span>
                      {scores[ind.id] === d.value && <Icon name="check" size={22} color="var(--accent)" stroke={3} />}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <label className="am-field">
              <span className="am-field__lab">Anything you noticed? <span className="am-muted" style={{ fontWeight: 600 }}>(optional)</span></span>
              <textarea className="am-input" rows={3} placeholder="e.g. shared tools without being asked today"
                value={notes[area.id] || ''} onChange={e => setNotes(n => ({ ...n, [area.id]: e.target.value }))} />
            </label>
          </div>
        ) : (
          <ReviewStep areas={areas} scores={scores} notes={notes} co={co} setCo={setCo} setStep={setStep} />
        )}
      </div>

      {/* sticky action bar */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '12px 16px calc(12px + env(safe-area-inset-bottom, 18px))',
        background: 'color-mix(in srgb, var(--surface) 86%, transparent)', backdropFilter: 'blur(10px)', borderTop: '1px solid var(--line)', zIndex: 9 }}>
        {err && <p style={{ color: 'var(--warn)', fontWeight: 700, fontSize: '.88rem', margin: '0 0 8px', textAlign: 'center' }}>Please score every line before moving on.</p>}
        {!isReview ? (
          <button className="am-btn am-btn--primary am-btn--block am-btn--lg" onClick={next}>
            Next <Icon name="arrowright" size={20} stroke={2.6} />
          </button>
        ) : (
          <button className="am-btn am-btn--primary am-btn--block am-btn--lg" onClick={save}>
            <Icon name="check" size={20} stroke={3} /> Save assessment
          </button>
        )}
      </div>
    </div>
  );
}

function ReviewStep({ areas, scores, notes, co, setCo, setStep }) {
  const labelFor = (v) => AMAVA.descriptors.find(d => d.value === v)?.label || '—';
  return (
    <div className="am-anim" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div className="am-eyebrow">Almost done</div>
        <div className="am-h1">Review the scores</div>
        <p className="am-muted" style={{ margin: '6px 0 0' }}>Tap any area to fix a score before saving.</p>
      </div>
      {areas.map((a, i) => {
        const vals = a.indicators.map(ind => scores[ind.id]).filter(v => v != null);
        const av = vals.length ? (vals.reduce((x, y) => x + y, 0) / vals.length).toFixed(1) : '—';
        return (
          <button key={a.id} className="am-card am-card--pad" onClick={() => setStep(i)}
            style={{ textAlign: 'left', cursor: 'pointer', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div className="am-ava" style={{ background: 'var(--brand)', width: 36, height: 36, flexBasis: 36, borderRadius: 11 }}>
                <Icon name={a.icon} size={20} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800 }}>{a.name}</div>
                <div className="am-row__sub">Average {av} / 4</div>
              </div>
              <Icon name="pencil" size={18} color="var(--sage)" />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {a.indicators.map(ind => (
                <span key={ind.id} className="am-chip" style={{ fontSize: '.74rem', padding: '5px 9px' }}>
                  {ind.short}: <strong style={{ color: 'var(--brand)' }}>{scores[ind.id] ?? '–'}</strong>
                </span>
              ))}
            </div>
          </button>
        );
      })}
      <label className="am-field">
        <span className="am-field__lab">Who agreed on these scores? <span className="am-muted" style={{ fontWeight: 600 }}>(optional)</span></span>
        <input className="am-input" placeholder="e.g. Thandi, Joseph" value={co} onChange={e => setCo(e.target.value)} />
      </label>
    </div>
  );
}

/* ============================ BOTTOM NAV ============================ */
function BottomNav({ nav, active }) {
  const items = [
    { key: 'home', label: 'Classes', icon: 'home', go: () => nav.go('home') },
    { key: 'reports', label: 'Reports', icon: 'chart', go: () => nav.go('reports') },
    { key: 'settings', label: 'Settings', icon: 'gear', go: () => nav.go('settings') },
  ];
  return (
    <div className="am-bottomnav">
      {items.map(it => (
        <button key={it.key} className={'am-navbtn' + (active === it.key ? ' on' : '')} onClick={it.go}>
          <Icon name={it.icon} size={25} stroke={active === it.key ? 2.4 : 2} />
          {it.label}
        </button>
      ))}
    </div>
  );
}

Object.assign(window, { LoginScreen, HomeScreen, ChildListScreen, AssessScreen, BottomNav });
