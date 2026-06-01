import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReportView } from './ReportView'
import type { Report } from '../domain/report-metrics'

const report: Report = {
  childrenInScope: 2, withBaseline: 2, withFollowUp: 2,
  headlines: [{ indicatorId: 'i1', indicatorText: 'Listens', percentImproved: 100, nImproved: 2, nMeasured: 2 }],
  areas: [{
    areaId: 'gen', areaName: 'General', nMeasured: 2, percentImproved: 100, avgBaseline: 1.5, avgLatest: 3,
    indicators: [{
      indicatorId: 'i1', indicatorText: 'Listens', areaId: 'gen',
      nMeasured: 2, nImproved: 2, nStable: 0, nDeclined: 0, percentImproved: 100,
      avgBaseline: 1.5, avgLatest: 3, avgChange: 1.5,
    }],
  }],
}

describe('ReportView (aggregate)', () => {
  it('shows a headline percentage and the area name and indicator row', () => {
    render(<ReportView scaleMax={4} aggregate={report} />)
    expect(screen.getAllByText(/100%/).length).toBeGreaterThan(0)
    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getAllByText('Listens').length).toBeGreaterThan(0)
  })
})
