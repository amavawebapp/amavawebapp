import Dexie, { type Table } from 'dexie'
import type { Assessment, ReferenceData } from '../domain/types'
import type { LocalStore } from './datastore'

interface RefRow { key: 'current'; data: ReferenceData }

export class DexieLocalStore extends Dexie implements LocalStore {
  private reference!: Table<RefRow, string>
  private assessments!: Table<Assessment, string>

  constructor(name = 'amava-me') {
    super(name)
    this.version(1).stores({
      reference: 'key',
      assessments: 'id, childId, syncState',
    })
  }

  async clear(): Promise<void> {
    await this.reference.clear()
    await this.assessments.clear()
  }

  async saveReferenceData(data: ReferenceData): Promise<void> {
    await this.reference.put({ key: 'current', data })
  }

  async getReferenceData(): Promise<ReferenceData | null> {
    const row = await this.reference.get('current')
    return row ? row.data : null
  }

  async enqueueAssessment(a: Assessment): Promise<void> {
    await this.assessments.put({ ...a, syncState: 'pending' })
  }

  async getPendingAssessments(): Promise<Assessment[]> {
    return this.assessments.where('syncState').equals('pending').toArray()
  }

  async markSynced(id: string): Promise<void> {
    await this.assessments.update(id, { syncState: 'synced' })
  }

  async getAssessmentsForChild(childId: string): Promise<Assessment[]> {
    return this.assessments.where('childId').equals(childId).toArray()
  }

  async getAllAssessments(): Promise<Assessment[]> {
    return this.assessments.toArray()
  }

  async saveSyncedAssessments(list: Assessment[]): Promise<void> {
    await this.assessments.bulkPut(list.map(a => ({ ...a, syncState: 'synced' as const })))
  }
}
