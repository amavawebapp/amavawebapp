import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface AccountsClient {
  createUser(username: string, password: string, name: string, role: string, classIds: string[]): Promise<void>
  setPassword(userId: string, password: string): Promise<void>
  updateFacilitator(userId: string, name: string, role: string, classIds: string[]): Promise<void>
  setActive(userId: string, active: boolean): Promise<void>
}

export class SupabaseAccountsClient implements AccountsClient {
  constructor(private sb: SupabaseClient) {}
  private async rpc(fn: string, args: Record<string, unknown>) {
    const { error } = await this.sb.rpc(fn, args)
    if (error) throw error
  }
  async createUser(username: string, password: string, name: string, role: string, classIds: string[]) {
    await this.rpc('admin_create_user', { p_username: username, p_password: password, p_name: name, p_role: role, p_class_ids: classIds })
  }
  async setPassword(userId: string, password: string) {
    await this.rpc('admin_set_password', { p_user_id: userId, p_password: password })
  }
  async updateFacilitator(userId: string, name: string, role: string, classIds: string[]) {
    await this.rpc('admin_update_facilitator', { p_user_id: userId, p_name: name, p_role: role, p_class_ids: classIds })
  }
  async setActive(userId: string, active: boolean) {
    await this.rpc('admin_set_active', { p_user_id: userId, p_active: active })
  }
}

export const accountsClient: AccountsClient = new SupabaseAccountsClient(supabase)
