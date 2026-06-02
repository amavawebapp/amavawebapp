import { useState } from 'react'
import type { Report, ChildReport } from '../domain/report-metrics'
import { Donut, Bars, Dumbbell, Avatar, Icon } from './ui'
import { areaIcon, shortLabel, deriveChildView } from '../domain/view-model'

interface Props {
  scaleMax: number
  aggregate?: Report
  child?: ChildReport
}

const round = (x: number) => Math.round(x)
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)

export function ReportView({ scaleMax, aggregate, child }: Props) {
  if (child) return <ChildReportBody report={child} scaleMax={scaleMax} />
  if (aggregate) return <AggregateBody report={aggregate} scaleMax={scaleMax} />
  return <p className="am-muted">No data.</p>
}

function AggregateBody({ report, scaleMax }: { report: Report; scaleMax: number }) {
  const [areaFilter, setAreaFilter] = useState('all')
  const overallPct = report.areas.length
    ? round(mean(report.areas.map(a => a.percentImproved)))
    : report.headlines.length
      ? round(mean(report.headlines.map(h => h.percentImproved)))
      : 0
  const wins = report.headlines.slice(0, 3)
  const visibleAreas = areaFilter === 'all' ? report.areas : report.areas.filter(a => a.areaId === areaFilter)

  return (
    <div className="am-anim" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div className="am-eyebrow">How the children are growing</div>
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
              <div key={h.indicatorId} className="am-card am-card--pad" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14 }}>
                <Donut value={h.percentImproved} label={h.percentImproved + '%'} color="var(--good)" size={62} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '.96rem' }}>{h.indicatorText}</div>
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
          <button key={a.areaId} className={'am-chip' + (areaFilter === a.areaId ? ' am-chip--on' : '')} onClick={() => setAreaFilter(a.areaId)}>{shortLabel(a.areaName)}</button>
        ))}
      </div>

      {/* area sections */}
      {visibleAreas.map((area, index) => (
        <div key={area.areaId} className="am-card am-card--pad">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div className="am-ava" style={{ background: 'var(--brand)', width: 38, height: 38, flexBasis: 38, borderRadius: 11 }}>
              <Icon name={areaIcon(index)} size={20} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800 }}>{area.areaName}</div>
              <div className="am-row__sub">Average now {area.avgLatest ?? '—'} / {scaleMax} · was {area.avgBaseline ?? '—'}</div>
            </div>
          </div>
          <Bars max={scaleMax} data={area.indicators.map(i => ({
            label: shortLabel(i.indicatorText), value: i.avgLatest, baseline: i.avgBaseline,
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
  )
}

function ChildReportBody({ report, scaleMax }: { report: ChildReport; scaleMax: number }) {
  const v = deriveChildView(report)
  const pct = v.measured ? round((v.improved / v.measured) * 100) : 0
  return (
    <div className="am-anim" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Avatar name={v.name} size={56} />
        <div>
          <div className="am-h1" style={{ fontSize: '1.5rem' }}>{v.name}</div>
        </div>
      </div>

      {!v.hasLatest ? (
        <div className="am-card am-card--pad" style={{ textAlign: 'center' }}>
          <Icon name="flag" size={30} color="var(--sage)" />
          <p style={{ fontWeight: 700, margin: '8px 0 4px' }}>Baseline recorded</p>
          <p className="am-muted" style={{ margin: 0, fontSize: '.9rem' }}>Add a quarterly check-in to see how {v.firstName} is growing.</p>
        </div>
      ) : (
        <>
          <div className="am-card am-card--pad" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Donut value={pct} label={`${v.improved}/${v.measured}`} sublabel="grown" color="var(--good)" size={116} />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 800, margin: 0, fontSize: '1.02rem' }}>{v.firstName} improved on {v.improved} of {v.measured} things measured.</p>
            </div>
          </div>

          <div className="am-sectionlab"><span className="am-eyebrow">Growth by area</span></div>
          <div className="am-card am-card--pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {v.trends.map(t => (
              <div key={t.areaId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 96, flex: '0 0 96px', fontWeight: 700, fontSize: '.88rem' }}>{shortLabel(t.areaName, 16)}</div>
                <Dumbbell baseline={t.baseline} latest={t.latest} max={scaleMax} />
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

          {v.observations.length > 0 && (
            <div>
              <div className="am-sectionlab"><span className="am-eyebrow">Facilitator notes</span></div>
              {v.observations.map((o, i) => (
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
  )
}
