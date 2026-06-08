import type { Can, CanInsert, CanUpdate } from '../types/can'
import type {
  CanTradeStatus,
  ConditionGrade,
  OpeningStatus,
  TradeCurrency,
} from '../types/canCollector'
import {
  CAN_TRADE_STATUSES,
  CONDITION_GRADES,
  OPENING_STATUSES,
} from '../types/canCollector'

export function isOpenedStatus(status: OpeningStatus): boolean {
  return status !== 'sealed'
}

export function openedFromStatus(status: OpeningStatus): boolean {
  return isOpenedStatus(status)
}

export function openingStatusFromLegacy(
  opened?: boolean | null,
  existing?: OpeningStatus | null,
): OpeningStatus {
  if (existing && OPENING_STATUSES.includes(existing)) return existing
  return opened ? 'opened_unknown' : 'sealed'
}

export function availableForTradeFromStatus(status: CanTradeStatus): boolean {
  return status === 'available' || status === 'reserved'
}

export function tradeStatusFromLegacy(
  available?: boolean | null,
  existing?: CanTradeStatus | null,
): CanTradeStatus {
  if (existing && CAN_TRADE_STATUSES.includes(existing)) return existing
  return available ? 'available' : 'not_for_trade'
}

function normalizeConditionGrade(value: unknown): ConditionGrade {
  if (typeof value === 'string' && CONDITION_GRADES.includes(value as ConditionGrade)) {
    return value as ConditionGrade
  }
  return 'unknown'
}

function normalizeTradeCurrency(value: unknown): TradeCurrency | null {
  if (typeof value === 'string' && value.trim()) {
    return value.trim().toUpperCase() as TradeCurrency
  }
  return null
}

function normalizeTradePrice(value: unknown): number | null {
  if (value == null || value === '') return null
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) && num >= 0 ? num : null
}

/** Apply collector defaults and keep legacy opened / available_for_trade in sync. */
export function normalizeCanCollectorFields<T extends Partial<Can>>(can: T): T & Can {
  const opening_status = openingStatusFromLegacy(can.opened, can.opening_status)
  const trade_status = tradeStatusFromLegacy(can.available_for_trade, can.trade_status)

  return {
    ...can,
    opening_status,
    opened: openedFromStatus(opening_status),
    purchase_country: can.purchase_country ?? null,
    purchase_city: can.purchase_city ?? null,
    purchase_store: can.purchase_store ?? null,
    condition_grade: normalizeConditionGrade(can.condition_grade),
    condition_notes: can.condition_notes ?? null,
    is_public: can.is_public ?? false,
    show_on_public_profile: can.show_on_public_profile ?? false,
    trade_status,
    available_for_trade: availableForTradeFromStatus(trade_status),
    trade_price: normalizeTradePrice(can.trade_price),
    trade_currency: normalizeTradeCurrency(can.trade_currency),
    trade_note: can.trade_note ?? null,
  } as T & Can
}

export function applyOpeningStatusToInsert(
  opening_status: OpeningStatus,
): Pick<CanInsert, 'opening_status' | 'opened'> {
  return {
    opening_status,
    opened: openedFromStatus(opening_status),
  }
}

export function applyTradeStatusToInsert(
  trade_status: CanTradeStatus,
): Pick<CanInsert, 'trade_status' | 'available_for_trade'> {
  return {
    trade_status,
    available_for_trade: availableForTradeFromStatus(trade_status),
  }
}

export function syncCollectorFieldsOnUpdate(updates: CanUpdate): CanUpdate {
  const next = { ...updates }

  if (next.opening_status !== undefined) {
    next.opened = openedFromStatus(next.opening_status)
  } else if (next.opened !== undefined && next.opening_status === undefined) {
    next.opening_status = openingStatusFromLegacy(next.opened, null)
  }

  if (next.trade_status !== undefined) {
    next.available_for_trade = availableForTradeFromStatus(next.trade_status)
  } else if (next.available_for_trade !== undefined && next.trade_status === undefined) {
    next.trade_status = tradeStatusFromLegacy(next.available_for_trade, null)
  }

  return next
}

export function formatTradePrice(
  price: number | null | undefined,
  currency: TradeCurrency | null | undefined,
): string | null {
  if (price == null) return null
  const code = currency && currency !== 'OTHER' ? currency : ''
  return code ? `${price} ${code}` : String(price)
}
