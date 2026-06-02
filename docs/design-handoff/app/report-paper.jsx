/* AMAVA — printable A4 impact report. */

function PaperReport({ scope, onBack }) {
  const isChild = scope.kind === 'child';
  let children = AMAVA.children;
  if (scope.kind === 'class') children = children.filter(c => c.classId === scope.id);

  const period = '1 Feb – 31 May 2026';
  const scopeName = scope.kind === 'org' ? 'Whole organisation'
    : scope.kind === 'class' ? AMAVA.classes.find(c => c.id === scope.id)?.name
    : (() => { const c = AMAVA.children.find(c => c.id === scope.id); return c.firstName + ' ' + c.surname; })();

  return (
    <div className="paper-stage">
      <div className="paper-topbar">
        <button className="am-back" onClick={onBack} style={{ background: 'rgba(255,255,255,.15)', color: '#fff' }} aria-label="Back">
          <Icon name="back" size={24} />
        </button>
        <div className="paper-topbar__t">Printable report</div>
        <button className="am-btn" style={{ minHeight: 40, padding: '0 14px', background: '#fff' }} onClick={() => window.print()}>
          <Icon name="download" size={18} /> Save PDF
        </button>
      </div>
      <div className="paper-scroll">
        <div className="paper">
          <div className="paper__band">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="paper__logo">Amava</div>
                <div className="paper__oluntu">Oluntu</div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7, paddingTop: 6 }}>
                <div className="paper__kicker" style={{ whiteSpace: 'nowrap' }}>Impact Report</div>
                <div className="paper__meta" style={{ marginTop: 0, whiteSpace: 'nowrap' }}>{AMAVA.programmeName}</div>
              </div>
            </div>
            <div className="paper__title">{isChild ? scopeName : 'Child development progress'}</div>
            <div className="paper__meta">{isChild ? AMAVA.classes.find(c => c.id === AMAVA.children.find(x => x.id === scope.id).classId)?.name + ' · ' : scopeName + ' · '}{period}</div>
          </div>

          {isChild
            ? <PaperChild child={AMAVA.children.find(c => c.id === scope.id)} />
            : <PaperAggregate report={buildAggregate(children)} />}

          <div className="paper__foot">
            <span>{AMAVA.regLine}</span>
            <span>Generated {new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaperAggregate({ report }) {
  const overall = report.headlines.length ? Math.round(report.headlines.reduce((s, h) => s + h.percentImproved, 0) / report.headlines.length) : 0;
  const wins = report.headlines.slice(0, 3);
  return (
    <div className="paper__body">
      <p style={{ fontSize: 15, lineHeight: 1.6, color: '#4a5450', margin: '0 0 8px' }}>
        Across <b>{report.childrenInScope} children</b> assessed this period, facilitators recorded an average
        improvement of <b style={{ color: 'var(--green-deep)' }}>{overall}%</b> on the indicators measured —
        meaning most children are moving steadily toward consistent, independent behaviour.
      </p>

      <div className="paper-h">At a glance</div>
      <div className="paper-stats">
        <div className="paper-stat"><div className="paper-stat__v">{report.childrenInScope}</div><div className="paper-stat__l">Children assessed</div><div className="paper-stat__s">of {report.total} enrolled</div></div>
        <div className="paper-stat"><div className="paper-stat__v">{report.withFollowUp}</div><div className="paper-stat__l">With follow-up</div><div className="paper-stat__s">baseline + check-in</div></div>
        <div className="paper-stat"><div className="paper-stat__v">{overall}%</div><div className="paper-stat__l">Average improved</div><div className="paper-stat__s">across all indicators</div></div>
      </div>

      <div className="paper-h">Biggest wins</div>
      <div className="paper-wins">
        {wins.map(h => (
          <div className="paper-win" key={h.id}>
            <div className="paper-win__v">{h.percentImproved}%</div>
            <div className="paper-win__t">{h.text}</div>
            <div className="paper-win__s">{h.nImproved} of {h.nMeasured} children improved</div>
          </div>
        ))}
      </div>

      <div className="paper-h">Progress by development area</div>
      {report.areas.map(area => (
        <div className="paper-area" key={area.id}>
          <div className="paper-area__h">
            <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--slate)', display: 'grid', placeItems: 'center' }}>
              <Icon name={area.icon} size={18} color="#fff" />
            </div>
            <div className="paper-area__name">{area.name}</div>
            <div className="paper-area__avg">avg {area.avgBaseline ?? '—'} → <b style={{ color: 'var(--green-deep)' }}>{area.avgLatest ?? '—'}</b> / 4</div>
          </div>
          {area.indicators.map(i => (
            <div className="paper-ind" key={i.id}>
              <div className="paper-ind__t">{i.text}</div>
              <div className="paper-ind__track">
                <div className="paper-ind__fill" style={{ width: ((i.avgLatest ?? 0) / 4) * 100 + '%' }} />
                {i.avgBaseline != null && <div className="paper-ind__base" style={{ left: (i.avgBaseline / 4) * 100 + '%' }} />}
              </div>
              <div className="paper-ind__nums"><b>{i.avgLatest ?? '—'}</b> · {i.percentImproved}% up</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function PaperChild({ child }) {
  const report = buildChild(child);
  const pct = report.measured ? Math.round((report.improved / report.measured) * 100) : 0;
  const chgClass = (c) => c === 'improved' ? 'paper-chg--up' : c === 'declined' ? 'paper-chg--down' : 'paper-chg--flat';
  const chgText = (r) => r.change == null ? '—' : r.change > 0 ? `▲ +${r.change}` : r.change < 0 ? `▼ ${r.change}` : 'same';
  return (
    <div className="paper__body">
      <div className="paper-h">Summary</div>
      <div className="paper-stats">
        <div className="paper-stat"><div className="paper-stat__v">{report.improved}/{report.measured}</div><div className="paper-stat__l">Indicators improved</div><div className="paper-stat__s">{pct}% of those measured</div></div>
        <div className="paper-stat"><div className="paper-stat__v">{report.trends.length}</div><div className="paper-stat__l">Areas tracked</div><div className="paper-stat__s">development areas</div></div>
        <div className="paper-stat"><div className="paper-stat__v" style={{ color: 'var(--green-deep)' }}>{(report.trends.reduce((s, t) => s + ((t.latest ?? 0) - (t.baseline ?? 0)), 0) / report.trends.length).toFixed(1)}</div><div className="paper-stat__l">Average gain</div><div className="paper-stat__s">points on the 1–4 scale</div></div>
      </div>

      <div className="paper-h">Growth by area</div>
      {report.trends.map(t => (
        <div className="paper-ind" key={t.id} style={{ gridTemplateColumns: '168px 1fr 116px' }}>
          <div className="paper-ind__t" style={{ fontWeight: 700 }}>{t.name}</div>
          <div className="paper-ind__track">
            <div className="paper-ind__fill" style={{ width: ((t.latest ?? 0) / 4) * 100 + '%' }} />
            {t.baseline != null && <div className="paper-ind__base" style={{ left: (t.baseline / 4) * 100 + '%' }} />}
          </div>
          <div className="paper-ind__nums">{t.baseline ?? '—'} → <b>{t.latest ?? '—'}</b> / 4</div>
        </div>
      ))}

      <div className="paper-h">Every indicator</div>
      <table className="paper-tbl">
        <thead><tr><th>Indicator</th><th style={{ textAlign: 'center' }}>Baseline</th><th style={{ textAlign: 'center' }}>Now</th><th style={{ textAlign: 'center' }}>Change</th></tr></thead>
        <tbody>
          {report.rows.map((r, i) => (
            <tr key={i}>
              <td>{r.text}</td>
              <td style={{ textAlign: 'center' }}>{r.baseline ?? '—'}</td>
              <td style={{ textAlign: 'center', fontWeight: 800 }}>{r.latest ?? '—'}</td>
              <td style={{ textAlign: 'center' }}><span className={'paper-chg ' + chgClass(r.classification)}>{chgText(r)}</span></td>
            </tr>
          ))}
        </tbody>
      </table>

      {report.observations.length > 0 && (
        <>
          <div className="paper-h">Facilitator notes</div>
          {report.observations.map((o, i) => (
            <div className="paper-note" key={i}>
              <div className="paper-note__d">{o.date}</div>
              <div className="paper-note__t">{o.note}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

Object.assign(window, { PaperReport });
