import { getAllLocalCans, updateLocalCan } from './localCans'
import { useGuestStorage } from './guestStorage'
import { isConfigured } from './mode'
import { supabase } from './supabase'

function requireClient() {
  if (!supabase) throw new Error('Supabase client unavailable')
  return supabase
}

function normalizeBarcode(barcode: string): string {
  return barcode.trim()
}

/** Link all user-owned cans with matching barcode to an approved master can. */
export async function linkUserCansToMasterByBarcode(
  barcode: string,
  masterCanId: string,
): Promise<number> {
  const code = normalizeBarcode(barcode)
  if (!code) return 0

  if (!isConfigured || useGuestStorage()) {
    let linked = 0
    const cans = getAllLocalCans()
    for (const can of cans) {
      if ((can.barcode ?? '').trim() === code && !can.master_can_id) {
        await updateLocalCan(can.id, { master_can_id: masterCanId })
        linked += 1
      }
    }
    return linked
  }

  const client = requireClient()
  const { data, error } = await client
    .from('cans')
    .update({ master_can_id: masterCanId })
    .eq('barcode', code)
    .is('master_can_id', null)
    .select('id')

  if (error) throw error
  return data?.length ?? 0
}
