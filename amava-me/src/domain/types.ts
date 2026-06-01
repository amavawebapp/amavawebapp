export type Role = 'facilitator' | 'coordinator'
export type AssessmentType = 'baseline' | 'quarterly'
export type SyncState = 'pending' | 'synced'

export interface Programme {
  id: string
  name: string
  scaleMax: number
  scaleDescriptors: { value: number; label: string; description: string }[]
  active: boolean
}

export interface DevelopmentArea {
  id: string
  programmeId: string
  name: string
  sortOrder: number
  /** When true this area only shows for classes with hasGardenComponent. */
  gardenOnly: boolean
  active: boolean
}

export interface Indicator {
  id: string
  areaId: string
  text: string
  hint: string | null
  sortOrder: number
  active: boolean
}

export interface ClassGroup {
  id: string
  programmeId: string
  name: string
  hasGardenComponent: boolean
  active: boolean
}

export interface Child {
  id: string
  classId: string
  firstName: string
  surname: string
  /** Extra demographic fields are config-driven; stored as a bag. */
  fields: Record<string, string>
  dateStarted: string // ISO date
  isSample: boolean
  active: boolean
}

export interface Facilitator {
  id: string
  name: string
  role: Role
  classIds: string[]
}

export interface ScoreEntry {
  indicatorId: string
  /** Snapshot of indicator text at scoring time, for history integrity. */
  indicatorText: string
  score: number
}

export interface ObservationEntry {
  areaId: string | null
  note: string
}

export interface Assessment {
  id: string
  childId: string
  type: AssessmentType
  date: string // ISO date
  assessedBy: string // facilitator id
  coAssessors: string
  /** Snapshot of the scale max in force when this was taken. */
  scaleMax: number
  scores: ScoreEntry[]
  observations: ObservationEntry[]
  syncState: SyncState
}

/** Everything a facilitator needs cached to assess offline. */
export interface ReferenceData {
  programmes: Programme[]
  areas: DevelopmentArea[]
  indicators: Indicator[]
  classes: ClassGroup[]
  children: Child[]
  facilitators: Facilitator[]
  fetchedAt: string
}
