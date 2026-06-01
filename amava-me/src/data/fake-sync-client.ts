import type { Assessment, ReferenceData } from '../domain/types'
import type { SyncClient } from './datastore'

/** In-memory SyncClient: lets the whole app run + be tested with no backend. */
export class FakeSyncClient implements SyncClient {
  pushed: Assessment[] = []
  constructor(
    private reference: ReferenceData,
    private existing: Assessment[] = [],
  ) {}

  async fetchReferenceData(): Promise<ReferenceData> {
    return this.reference
  }
  async fetchAssessmentsForFacilitator(): Promise<Assessment[]> {
    return [...this.existing, ...this.pushed]
  }
  async pushAssessment(a: Assessment): Promise<void> {
    this.pushed.push({ ...a, syncState: 'synced' })
  }
}
