import { describe, it, expect, beforeEach } from 'vitest'
import { SyncEngine } from './sync-engine'
import { DexieLocalStore } from './local-store'
import { FakeSyncClient } from './fake-sync-client'
import type { Assessment, ReferenceData } from '../domain/types'

const ref: ReferenceData = {
  programmes: [], areas: [], indicators: [], classes: [],
  children: [], facilitators: [], fetchedAt: '2026-03-03T00:00:00Z',
}
const mkAssessment = (id: string): Assessment => ({
  id, childId: 'c1', type: 'baseline', date: '2026-01-01', assessedBy: 'f',
  coAssessors: '', scaleMax: 4, scores: [], observations: [], attachments: [], syncState: 'pending',
})

describe('SyncEngine', () => {
  let store: DexieLocalStore
  beforeEach(async () => {
    store = new DexieLocalStore(`sync-${Math.floor(performance.now())}`)
    await store.clear()
  })

  it('pull caches reference data and synced assessments locally', async () => {
    const client = new FakeSyncClient(ref, [{ ...mkAssessment('a1'), syncState: 'synced' }])
    const engine = new SyncEngine(store, client)
    await engine.pull()
    expect((await store.getReferenceData())?.fetchedAt).toBe('2026-03-03T00:00:00Z')
    expect((await store.getAssessmentsForChild('c1')).map(a => a.id)).toEqual(['a1'])
  })

  it('push flushes pending assessments to the client and marks them synced', async () => {
    const client = new FakeSyncClient(ref)
    const engine = new SyncEngine(store, client)
    await store.enqueueAssessment(mkAssessment('a1'))
    const count = await engine.push()
    expect(count).toBe(1)
    expect(client.pushed.map(a => a.id)).toEqual(['a1'])
    expect(await store.getPendingAssessments()).toEqual([])
  })

  it('push leaves the item pending if the client throws', async () => {
    const client = new FakeSyncClient(ref)
    client.pushAssessment = async () => { throw new Error('offline') }
    const engine = new SyncEngine(store, client)
    await store.enqueueAssessment(mkAssessment('a1'))
    const count = await engine.push()
    expect(count).toBe(0)
    expect((await store.getPendingAssessments()).map(a => a.id)).toEqual(['a1'])
  })
})
