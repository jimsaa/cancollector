import type { Can, CanInsert, CanUpdate } from '../types/can'
import { generateId } from './id'

const CANS_KEY = 'cancollector-cans'
const USER_ID_KEY = 'cancollector-local-user-id'

let sessionUserId: string | null = null

export function getLocalUserId(): string {
  try {
    let id = localStorage.getItem(USER_ID_KEY)
    if (!id) {
      id = generateId()
      localStorage.setItem(USER_ID_KEY, id)
    }
    return id
  } catch {
    if (!sessionUserId) sessionUserId = generateId()
    return sessionUserId
  }
}

function readAll(): Can[] {
  try {
    const raw = localStorage.getItem(CANS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Can[]
  } catch {
    return []
  }
}

function writeAll(cans: Can[]): void {
  try {
    localStorage.setItem(CANS_KEY, JSON.stringify(cans))
  } catch {
    throw new Error('Could not save — browser storage may be full or disabled')
  }
}

function toCan(userId: string, input: CanInsert): Can {
  return {
    id: generateId(),
    user_id: userId,
    barcode: input.barcode ?? null,
    name: input.name ?? null,
    brand: input.brand ?? null,
    flavor: input.flavor ?? null,
    volume: input.volume ?? null,
    country: input.country ?? null,
    image_url: input.image_url ?? null,
    opened: input.opened ?? false,
    purchase_date: input.purchase_date ?? null,
    added_date: new Date().toISOString(),
    available_for_trade: input.available_for_trade ?? false,
    notes: input.notes ?? null,
    rarity: input.rarity ?? 'unknown',
    quantity: input.quantity ?? 1,
  }
}

export async function fetchLocalCans(userId: string): Promise<Can[]> {
  return readAll()
    .filter((c) => c.user_id === userId)
    .sort((a, b) => new Date(b.added_date).getTime() - new Date(a.added_date).getTime())
}

export async function fetchLocalCanById(id: string): Promise<Can | null> {
  return readAll().find((c) => c.id === id) ?? null
}

export async function createLocalCan(userId: string, can: CanInsert): Promise<Can> {
  const created = toCan(userId, can)
  writeAll([created, ...readAll()])
  return created
}

export async function updateLocalCan(id: string, updates: CanUpdate): Promise<Can> {
  const cans = readAll()
  const index = cans.findIndex((c) => c.id === id)
  if (index === -1) throw new Error('Can not found')

  const updated = { ...cans[index], ...updates }
  cans[index] = updated
  writeAll(cans)
  return updated
}

export async function deleteLocalCan(id: string): Promise<void> {
  writeAll(readAll().filter((c) => c.id !== id))
}
