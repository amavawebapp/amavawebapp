import type { LocalStore, SyncClient } from './datastore'

export class SyncEngine {
  constructor(private store: LocalStore, private client: SyncClient) {}

  /** Pull reference data + this facilitator's assessments into the local cache. */
  async pull(): Promise<void> {
    const [ref, assessments] = await Promise.all([
      this.client.fetchReferenceData(),
      this.client.fetchAssessmentsForFacilitator(),
    ])
    await this.store.saveReferenceData(ref)
    await this.store.saveSyncedAssessments(assessments)
  }

  /** Flush queued assessments. Returns how many synced. Failures stay pending. */
  async push(): Promise<number> {
    const pending = await this.store.getPendingAssessments()
    let synced = 0
    for (const a of pending) {
      try {
        await this.client.pushAssessment(a)
        await this.store.markSynced(a.id)
        synced++
      } catch {
        // leave pending; will retry on next sync
      }
    }
    return synced
  }
}
