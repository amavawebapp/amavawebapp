import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { ScalePoint } from '../domain/config-logic'

type ConfigTable = 'development_area' | 'indicator'

export interface ConfigClient {
  addArea(programmeId: string, name: string, gardenOnly: boolean, sortOrder: number): Promise<void>
  updateArea(id: string, fields: { name?: string; gardenOnly?: boolean }): Promise<void>
  addIndicator(areaId: string, text: string, sortOrder: number): Promise<void>
  updateIndicator(id: string, fields: { text?: string; hint?: string | null }): Promise<void>
  setActive(table: ConfigTable, id: string, active: boolean): Promise<void>
  reorderRows(table: ConfigTable, updates: { id: string; sortOrder: number }[]): Promise<void>
  updateScale(programmeId: string, scaleMax: number, descriptors: ScalePoint[]): Promise<void>
  setThreshold(programmeId: string, n: number): Promise<void>
}

export class SupabaseConfigClient implements ConfigClient {
  constructor(private sb: SupabaseClient) {}

  private async run(p: PromiseLike<{ error: unknown }>) {
    const { error } = await p
    if (error) throw error
  }

  async addArea(programmeId: string, name: string, gardenOnly: boolean, sortOrder: number) {
    await this.run(this.sb.from('development_area').insert({
      programme_id: programmeId, name, garden_only: gardenOnly, sort_order: sortOrder, active: true,
    }))
  }
  async updateArea(id: string, fields: { name?: string; gardenOnly?: boolean }) {
    const patch: Record<string, unknown> = {}
    if (fields.name !== undefined) patch.name = fields.name
    if (fields.gardenOnly !== undefined) patch.garden_only = fields.gardenOnly
    await this.run(this.sb.from('development_area').update(patch).eq('id', id))
  }
  async addIndicator(areaId: string, text: string, sortOrder: number) {
    await this.run(this.sb.from('indicator').insert({
      area_id: areaId, text, hint: null, sort_order: sortOrder, active: true,
    }))
  }
  async updateIndicator(id: string, fields: { text?: string; hint?: string | null }) {
    const patch: Record<string, unknown> = {}
    if (fields.text !== undefined) patch.text = fields.text
    if (fields.hint !== undefined) patch.hint = fields.hint
    await this.run(this.sb.from('indicator').update(patch).eq('id', id))
  }
  async setActive(table: ConfigTable, id: string, active: boolean) {
    await this.run(this.sb.from(table).update({ active }).eq('id', id))
  }
  async reorderRows(table: ConfigTable, updates: { id: string; sortOrder: number }[]) {
    for (const u of updates) {
      await this.run(this.sb.from(table).update({ sort_order: u.sortOrder }).eq('id', u.id))
    }
  }
  async updateScale(programmeId: string, scaleMax: number, descriptors: ScalePoint[]) {
    await this.run(this.sb.from('programme').update({ scale_max: scaleMax, scale_descriptors: descriptors }).eq('id', programmeId))
  }
  async setThreshold(programmeId: string, n: number) {
    await this.run(this.sb.from('programme').update({ improved_threshold: n }).eq('id', programmeId))
  }
}

export const configClient: ConfigClient = new SupabaseConfigClient(supabase)
