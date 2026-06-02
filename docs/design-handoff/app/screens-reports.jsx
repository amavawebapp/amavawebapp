/* AMAVA — Reports screen (on-screen, mobile). */

const { useState: useStateR, useMemo: useMemoR } = React;

function ReportsScreen({ nav, params }) {
  const [scope, setScope] = useStateR(params?.scope || { kind: 'org' });
  const [areaFilter, setAreaFilter] = useStateR('all');

  const data = useMemoR(() => {
    let children = AMAVA.children;
    if (scope.kind === 'class') children = children.filter(c => c.classId === scope.id);
    if (scope.kind === 'child') {
      const child = AMAVA.children.find(c => c.id === scope.id);
      return { kind: 'child', child, report: buildChild(child) };
    }
    return { kind: 'agg', report: buildAggregate(children) };
  }, [scope]);

  const scopeTitle = scope.kind === 'org' ? 'Whole organisation'
    : scope.kind === 'class' ? AMAVA.classes.find(c => c.id === scope.id)?.name
    : (AMAVA.children.find(c => c.id === scope.id)?.firstName + ' ' + AMAVA.children.find(c => c.id === scope.id)?.surname);

  const visibleAreas = (rep) => areaFilter === 'all' ? rep.areas : rep.areas.filter(a => a.id === areaFilter);

  return (
    <div className="am-screen">
      <AppBar title="Reports" onBack={() => nav.go('home')} />
      <div className="am-scroll am-pad" style={{ paddingTop: 12, paddingBottom: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* scope selector */}
        <div className="am-seg">
          {[['org', 'Everyone'], ['class', 'By class'], ['child', 'One child']].map(([k, lab]) => (
            <button key={k} className={scope.kind === k ? 'on' : ''} onClick={() => {
              if (k === 'org') setScope({ kind: 'org' });
              else if (k === 'class') setScope({ kind: 'class', id: AMAVA.classes[0].id });
              else setScope({ kind: 'child', id: AMAVA.children.find(c => c.latest).id });
            }}>{lab}</button>
          ))}
        </div>

        {/* sub-pickers */}
        {scope.kind === 'class' && (
          <div className="am-hscroll">
            {AMAVA.classes.map(c => (
              <button key={c.id} className={'am-chip' + (scope.id === c.id ? ' am-chip--on' : '')} onClick={() => setScope({ kind: 'class', id: c.id })}>{c.name}</button>
            ))}
          </div>
        )}
        {scope.kind === 'child' && (
          <div className="am-hscroll">
            {AMAVA.children.filter(c => c.latest || c.baseline).map(c => (
              <button key={c.id} className={'am-chip' + (scope.id === c.id ? ' am-chip--on' : '')} onClick={() => setScope({ kind: 'child', id: c.id })}>{c.firstName}</button>
            ))}
          </div>
        )}

        {data.kind === 'agg'
          ? <AggregateReport report={data.report} title={scopeTitle} areaFilter={areaFilter} setAreaFilter={setAreaFilter} visibleAreas={visibleAreas} />
          : <ChildReport child={data.child} report={data.report} />}

        {/* export actions */}
        <div className="am-sectionlab"><span className="am-eyebrow">Share this report</span></div>
        <button className="am-btn am-btn--brand am-btn--block" onClick={() => nav.go('paper', { scope })}>
          <Icon name="report" size={20} /> Open printable report
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="am-btn am-btn--ghost" style={{ flex: 1 }} onClick={() => nav.go('paper', { scope })}><Icon name="download" size={20} /> PDF</button>
          <button className="am-btn am-btn--ghost" style={{ flex: 1 }} onClick={() => nav.go('paper', { scope })}><Icon name="print" size={20} /> Print</button>
        </div>
        <p className="am-muted" style={{ fontSize: '.78rem', textAlign: 'center', margin: 0 }}>
          Reports never show a child's name unless you choose “One child”.
        </p>
      </div>
      <BottomNav nav={nav} active="reports" />
    </div>
  );
}

/* ---------- Aggregate ---------- */
function AggregateReport({ report, title, areaFilter, setAreaFilter, visibleAreas }) {
  const overallPct = report.headlines.length
    ? Math.round(report.headlines.reduce((s, h) => s + h.percentImproved, 0) / report.headlines.length) : 0;
  const wins = report.headlines.slice(0, 3);

  return (
    <div className="am-anim" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div className="am-eyebrow">{title}</div>
        <div className="am-h1">How the children are growing</div>
      </div>

      {/* headline card */}
      <div className="am-card am-card--pad" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <Donut value={overallPct} label={overallPct + '%'} sublabel="improved" color="var(--good)" size={124} />
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>
            On average, <span style={{ color: 'var(--good)' }}>{overallPct}%</span> of children improved.
          </p>
          <div style={{ display: 'flex', gap: 18, marginTop: 14 }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--brand)' }}>{report.childrenInScope}</div>
              <div className="am-row__sub">children</div>
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--brand)' }}>{report.withFollowUp}</div>
              <div className="am-row__sub">with follow-up</div>
            </div>
          </div>
        </div>
      </div>

      {/* biggest wins */}
      {wins.length > 0 && (
        <div>
          <div className="am-sectionlab"><span className="am-eyebrow">Biggest wins</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            {wins.map(h => (
              <div key={h.id} className="am-card am-card--pad" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14 }}>
                <Donut value={h.percentImproved} label={h.percentImproved + '%'} color="var(--good)" size={62} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '.96rem' }}>{h.text}</div>
                  <div className="am-row__sub">{h.nImproved} of {h.nMeasured} children improved</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* area filter */}
      <div className="am-hscroll">
        <button className={'am-chip' + (areaFilter === 'all' ? ' am-chip--on' : '')} onClick={() => setAreaFilter('all')}>All areas</button>
        {report.areas.map(a => (
          <button key={a.id} className={'am-chip' + (areaFilter === a.id ? ' am-chip--on' : '')} onClick={() => setAreaFilter(a.id)}>{a.short}</button>
        ))}
      </div>

      {/* area sections */}
      {visibleAreas(report).map(area => (
        <div key={area.id} className="am-card am-card--pad">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div className="am-ava" style={{ background: 'var(--brand)', width: 38, height: 38, flexBasis: 38, borderRadius: 11 }}>
              <Icon name={area.icon} size={20} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800 }}>{area.name}</div>
              <div className="am-row__sub">Average now {area.avgLatest ?? '—'} / 4 · was {area.avgBaseline ?? '—'}</div>
            </div>
          </div>
          <Bars max={4} data={area.indicators.map(i => ({
            label: i.short, value: i.avgLatest, baseline: i.avgBaseline,
            color: 'var(--good)',
          }))} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
            <span style={{ width: 13, height: 13, borderRadius: 4, background: 'var(--good)' }} />
            <span className="am-row__sub">Now</span>
            <span style={{ width: 3, height: 14, background: 'var(--ink)', opacity: .35, marginLeft: 8, borderRadius: 2 }} />
            <span className="am-row__sub">Baseline</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Child ---------- */
function ChildReport({ child, report }) {
  const pct = report.measured ? Math.round((report.improved / report.measured) * 100) : 0;
  return (
    <div className="am-anim" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Avatar name={report.name} size={56} />
        <div>
          <div className="am-h1" style={{ fontSize: '1.5rem' }}>{report.name}</div>
          <div className="am-row__sub">{AMAVA.classes.find(c => c.id === child.classId)?.name}</div>
        </div>
      </div>

      {!report.hasLatest ? (
        <div className="am-card am-card--pad" style={{ textAlign: 'center' }}>
          <Icon name="flag" size={30} color="var(--sage)" />
          <p style={{ fontWeight: 700, margin: '8px 0 4px' }}>Baseline recorded</p>
          <p className="am-muted" style={{ margin: 0, fontSize: '.9rem' }}>Add a quarterly check-in to see how {report.firstName} is growing.</p>
        </div>
      ) : (
        <>
          <div className="am-card am-card--pad" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Donut value={pct} label={`${report.improved}/${report.measured}`} sublabel="grown" color="var(--good)" size={116} />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 800, margin: 0, fontSize: '1.02rem' }}>{report.firstName} improved on {report.improved} of {report.measured} things measured.</p>
            </div>
          </div>

          <div className="am-sectionlab"><span className="am-eyebrow">Growth by area</span></div>
          <div className="am-card am-card--pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {report.trends.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 96, flex: '0 0 96px', fontWeight: 700, fontSize: '.88rem' }}>{t.short}</div>
                <Dumbbell baseline={t.baseline} latest={t.latest} max={4} />
                <div style={{ width: 30, textAlign: 'right', fontWeight: 800, color: 'var(--brand)' }}>{t.latest ?? '—'}</div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 16, marginTop: 2 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="am-row__sub">
                <span style={{ width: 12, height: 12, borderRadius: 99, border: '3px solid var(--sage)' }} /> Baseline
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="am-row__sub">
                <span style={{ width: 12, height: 12, borderRadius: 99, background: 'var(--good)' }} /> Now
              </span>
            </div>
          </div>

          {report.observations.length > 0 && (
            <div>
              <div className="am-sectionlab"><span className="am-eyebrow">Facilitator notes</span></div>
              {report.observations.map((o, i) => (
                <div key={i} className="am-card am-card--pad" style={{ marginTop: 8 }}>
                  <div className="am-row__sub" style={{ fontWeight: 700, marginBottom: 4 }}>{o.date}</div>
                  <p style={{ margin: 0, fontSize: '.96rem', lineHeight: 1.45 }}>{o.note}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

Object.assign(window, { ReportsScreen });
