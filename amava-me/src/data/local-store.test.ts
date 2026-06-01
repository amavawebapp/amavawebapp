import { describe, it, expect, beforeEach } from 'vitest'
import { DexieLocalStore } from './local-store'
import type { Assessment, ReferenceData } from '../domain/types'

const emptyRef: ReferenceData = {
  programmes: [], areas: [], indicators: [], classes: [],
  children: [], facilitators: [], fetchedAt: '2026-01-01T00:00:00Z',
}
const mkAssessment = (id: string, childId: string): Assessment => ({
  id, childId, type: 'baseline', date: '2026-01-01', assessedBy: 'f',
  coAssessors: '', scaleMax: 4, scores: [], observations: [], syncState: 'pending',
})

describe('DexieLocalStore', () => {
  let store: DexieLocalStore
  beforeEach(async () => {
    store = new DexieLocalStore(`test-${Math.floor(performance.now())}`)
    await store.clear()
  })

  it('round-trips reference data', async () => {
    await store.saveReferenceData({ ...emptyRef, fetchedAt: '2026-02-02T00:00:00Z' })
    const got = await store.getReferenceData()
    expect(got?.fetchedAt).toBe('2026-02-02T00:00:00Z')
  })

  it('enqueues and lists pending assessments', async () => {
    await store.enqueueAssessment(mkAssessment('a1', 'c1'))
    const pending = await store.getPendingAssessments()
    expect(pending.map(a => a.id)).toEqual(['a1'])
  })

  it('markSynced removes an item from the pending list', async () => {
    await store.enqueueAssessment(mkAssessment('a1', 'c1'))
    await store.markSynced('a1')
    expect(await store.getPendingAssessments()).toEqual([])
  })

  it('returns all assessments for a child', async () => {
    await store.enqueueAssessment(mkAssessment('a1', 'c1'))
    await store.saveSyncedAssessments([{ ...mkAssessment('a2', 'c1'), syncState: 'synced' }])
    const list = await store.getAssessmentsForChild('c1')
    expect(list.map(a => a.id).sort()).toEqual(['a1', 'a2'])
  })
})
