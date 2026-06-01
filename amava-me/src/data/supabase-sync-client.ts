import type { SupabaseClient } from '@supabase/supabase-js'
import type { Assessment, Facilitator, ReferenceData } from '../domain/types'
import type { SyncClient } from './datastore'

/** Maps snake_case DB rows to the camelCase domain shape and back. */
export class SupabaseSyncClient implements SyncClient {
  constructor(private sb: SupabaseClient) {}

  async fetchReferenceData(): Promise<ReferenceData> {
    const [programmes, areas, indicators, classes, facilitators, children] = await Promise.all([
      this.sb.from('programme').select('*').eq('active', true),
      this.sb.from('development_area').select('*'),
      this.sb.from('indicator').select('*'),
      this.sb.from('class_group').select('*').eq('active', true),
      this.sb.from('facilitator').select('*'),
      this.sb.from('child').select('*').eq('active', true),
    ])
    const err = [programmes, areas, indicators, classes, facilitators, children].find(r => r.error)
    if (err?.error) throw err.error
    return {
      programmes: (programmes.data ?? []).map(p => ({
        id: p.id, name: p.name, scaleMax: p.scale_max,
        scaleDescriptors: p.scale_descriptors, active: p.active,
      })),
      areas: (areas.data ?? []).map(a => ({
        id: a.id, programmeId: a.programme_id, name: a.name,
        sortOrder: a.sort_order, gardenOnly: a.garden_only, active: a.active,
      })),
      indicators: (indicators.data ?? []).map(i => ({
        id: i.id, areaId: i.area_id, text: i.text, hint: i.hint,
        sortOrder: i.sort_order, active: i.active,
      })),
      classes: (classes.data ?? []).map(c => ({
        id: c.id, programmeId: c.programme_id, name: c.name,
        hasGardenComponent: c.has_garden_component, active: c.active,
      })),
      children: (children.data ?? []).map(c => ({
        id: c.id, classId: c.class_id, firstName: c.first_name, surname: c.surname,
        fields: c.fields, dateStarted: c.date_started, isSample: c.is_sample, active: c.active,
      })),
      facilitators: (facilitators.data ?? []).map((f): Facilitator => ({
        id: f.id, name: f.name, role: f.role, classIds: f.class_ids,
      })),
      fetchedAt: new Date().toISOString(),
    }
  }

  async fetchAssessmentsForFacilitator(): Promise<Assessment[]> {
    const { data, error } = await this.sb.from('assessment').select('*')
    if (error) throw error
    return (data ?? []).map(a => ({
      id: a.id, childId: a.child_id, type: a.type, date: a.date,
      assessedBy: a.assessed_by, coAssessors: a.co_assessors, scaleMax: a.scale_max,
      scores: a.scores, observations: a.observations, syncState: 'synced',
    }))
  }

  async pushAssessment(a: Assessment): Promise<void> {
    const { error } = await this.sb.from('assessment').upsert({
      id: a.id, child_id: a.childId, type: a.type, date: a.date,
      assessed_by: a.assessedBy, co_assessors: a.coAssessors, scale_max: a.scaleMax,
      scores: a.scores, observations: a.observations,
    })
    if (error) throw error
  }
}
