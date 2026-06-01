import type { Report, ChildReport } from '../domain/report-metrics'
import { StatCard } from './StatCard'
import { BarChart } from './BarChart'
import { Sparkline } from './Sparkline'
import { ReportTable } from './ReportTable'

interface Props {
  scaleMax: number
  aggregate?: Report
  child?: ChildReport
}

export function ReportView({ scaleMax, aggregate, child }: Props) {
  if (child) return <ChildReportBody report={child} scaleMax={scaleMax} />
  if (aggregate) return <AggregateBody report={aggregate} scaleMax={scaleMax} />
  return <p>No data.</p>
}

function AggregateBody({ report, scaleMax }: { report: Report; scaleMax: number }) {
  const top = report.headlines.slice(0, 3)
  return (
    <div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatCard value={`${report.childrenInScope}`} label="Children" sub={`${report.withFollowUp} with follow-up`} />
        {top.map(h => (
          <StatCard key={h.indicatorId} value={`${h.percentImproved}%`} label="improved"
            sub={`${h.indicatorText} (${h.nImproved}/${h.nMeasured})`} />
        ))}
      </div>
      {report.areas.map(area => (
        <section key={area.areaId} style={{ marginBottom: 24 }}>
          <h3>{area.areaName}</h3>
          <BarChart
            max={scaleMax}
            data={area.indicators
              .filter(i => i.avgLatest !== null)
              .map((i, idx) => ({ label: `${idx + 1}`, value: i.avgLatest as number }))}
          />
          <ReportTable
            columns={['Indicator', 'Measured', 'Improved', 'Stable', 'Declined', '% improved', 'Avg base', 'Avg latest']}
            rows={area.indicators.map(i => [
              i.indicatorText, i.nMeasured, i.nImproved, i.nStable, i.nDeclined,
              i.percentImproved, i.avgBaseline ?? '—', i.avgLatest ?? '—',
            ])}
          />
        </section>
      ))}
    </div>
  )
}

function ChildReportBody({ report, scaleMax }: { report: ChildReport; scaleMax: number }) {
  return (
    <div>
      <h2>{report.childName}</h2>
      {report.trends.map(t => (
        <div key={t.areaId} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ minWidth: 160 }}>{t.areaName}</span>
          <Sparkline points={t.points.map(p => p.avgScore)} max={scaleMax} />
        </div>
      ))}
      <ReportTable
        columns={['Indicator', 'Baseline', 'Latest', 'Change', 'Status']}
        rows={report.rows.map(r => [
          r.indicatorText, r.baseline ?? '—', r.latest ?? '—',
          r.change === null ? '—' : (r.change > 0 ? `+${r.change}` : `${r.change}`),
          r.classification ?? '—',
        ])}
      />
      {report.observations.length > 0 && (
        <section>
          <h3>Observations</h3>
          <ul>{report.observations.map((o, i) => <li key={i}>{o.date}: {o.note}</li>)}</ul>
        </section>
      )}
    </div>
  )
}
