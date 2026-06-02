import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { ChildInput } from '../domain/child-fields'

type RosterTable = 'programme' | 'class_group' | 'child'

const DEFAULT_SCALE = [
  { value: 1, label: 'Emerging', description: 'rarely or not yet observed' },
  { value: 2, label: 'Developing', description: 'beginning to show, inconsistent' },
  { value: 3, label: 'Consistent', description: 'reliably shows this most of the time' },
  { value: 4, label: 'Strong', description: 'consistently and independently demonstrates this' },
]

export interface RosterClient {
  addProgramme(name: string): Promise<void>
  updateProgramme(id: string, fields: { name?: string }): Promise<void>
  addClass(programmeId: string, name: string, hasGardenComponent: boolean): Promise<void>
  updateClass(id: string, fields: { name?: string; hasGardenComponent?: boolean; programmeId?: string }): Promise<void>
  addChild(input: ChildInput): Promise<void>
  updateChild(id: string, input: ChildInput): Promise<void>
  setActive(table: RosterTable, id: string, active: boolean): Promise<void>
}

export class SupabaseRosterClient implements RosterClient {
  constructor(private sb: SupabaseClient) {}
  private async run(p: PromiseLike<{ error: unknown }>) {
    const { error } = await p
    if (error) throw error
  }

  async addProgramme(name: string) {
    await this.run(this.sb.from('programme').insert({
      name, scale_max: 4, scale_descriptors: DEFAULT_SCALE, improved_threshold: 1, active: true,
    }))
  }
  async updateProgramme(id: string, fields: { name?: string }) {
    await this.run(this.sb.from('programme').update(fields).eq('id', id))
  }
  async addClass(programmeId: string, name: string, hasGardenComponent: boolean) {
    await this.run(this.sb.from('class_group').insert({
      programme_id: programmeId, name, has_garden_component: hasGardenComponent, active: true,
    }))
  }
  async updateClass(id: string, fields: { name?: string; hasGardenComponent?: boolean; programmeId?: string }) {
    const patch: Record<string, unknown> = {}
    if (fields.name !== undefined) patch.name = fields.name
    if (fields.hasGardenComponent !== undefined) patch.has_garden_component = fields.hasGardenComponent
    if (fields.programmeId !== undefined) patch.programme_id = fields.programmeId
    await this.run(this.sb.from('class_group').update(patch).eq('id', id))
  }
  async addChild(input: ChildInput) {
    await this.run(this.sb.from('child').insert({
      class_id: input.classId, first_name: input.firstName, surname: input.surname,
      fields: input.fields, date_started: input.dateStarted, is_sample: input.isSample, active: true,
    }))
  }
  async updateChild(id: string, input: ChildInput) {
    await this.run(this.sb.from('child').update({
      class_id: input.classId, first_name: input.firstName, surname: input.surname,
      fields: input.fields, date_started: input.dateStarted, is_sample: input.isSample,
    }).eq('id', id))
  }
  async setActive(table: RosterTable, id: string, active: boolean) {
    await this.run(this.sb.from(table).update({ active }).eq('id', id))
  }
}

export const rosterClient: RosterClient = new SupabaseRosterClient(supabase)
