import type { Assessment, ReferenceData } from '../domain/types'

/** On-device cache + pending-assessment queue. */
export interface LocalStore {
  saveReferenceData(data: ReferenceData): Promise<void>
  getReferenceData(): Promise<ReferenceData | null>
  /** Queue an assessment captured offline. */
  enqueueAssessment(a: Assessment): Promise<void>
  getPendingAssessments(): Promise<Assessment[]>
  markSynced(id: string): Promise<void>
  /** All assessments (pending + synced) for a child, for history views. */
  getAssessmentsForChild(childId: string): Promise<Assessment[]>
  /** All assessments in the local cache (pending + synced), for reporting. */
  getAllAssessments(): Promise<Assessment[]>
  saveSyncedAssessments(list: Assessment[]): Promise<void>
}

/** Remote source of truth (Supabase in production, fake in tests). */
export interface SyncClient {
  fetchReferenceData(): Promise<ReferenceData>
  fetchAssessmentsForFacilitator(): Promise<Assessment[]>
  pushAssessment(a: Assessment): Promise<void>
}
