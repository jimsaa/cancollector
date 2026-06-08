export type OpeningStatus =
  | 'sealed'
  | 'opened_top'
  | 'opened_bottom'
  | 'opened_tab_intact'
  | 'opened_unknown'

export type ConditionGrade = 'mint' | 'excellent' | 'good' | 'fair' | 'damaged' | 'unknown'

export type CanTradeStatus = 'not_for_trade' | 'available' | 'reserved' | 'traded'

export type TradeCurrency = 'USD' | 'EUR' | 'GBP' | 'SEK' | 'NOK' | 'DKK' | 'CAD' | 'AUD' | 'OTHER'

export const OPENING_STATUSES: OpeningStatus[] = [
  'sealed',
  'opened_top',
  'opened_bottom',
  'opened_tab_intact',
  'opened_unknown',
]

export const CONDITION_GRADES: ConditionGrade[] = [
  'mint',
  'excellent',
  'good',
  'fair',
  'damaged',
  'unknown',
]

export const CAN_TRADE_STATUSES: CanTradeStatus[] = [
  'not_for_trade',
  'available',
  'reserved',
  'traded',
]

export const TRADE_CURRENCIES: TradeCurrency[] = [
  'USD',
  'EUR',
  'GBP',
  'SEK',
  'NOK',
  'DKK',
  'CAD',
  'AUD',
  'OTHER',
]

export const OPENING_STATUS_LABELS: Record<OpeningStatus, string> = {
  sealed: 'Sealed / Unopened',
  opened_top: 'Opened at top',
  opened_bottom: 'Opened at bottom',
  opened_tab_intact: 'Opened with tab intact',
  opened_unknown: 'Opened, unknown method',
}

export const OPENING_STATUS_SHORT_LABELS: Record<OpeningStatus, string> = {
  sealed: 'Sealed',
  opened_top: 'Top opened',
  opened_bottom: 'Bottom opened',
  opened_tab_intact: 'Tab intact',
  opened_unknown: 'Opened',
}

export const CONDITION_GRADE_LABELS: Record<ConditionGrade, string> = {
  mint: 'Mint',
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  damaged: 'Damaged',
  unknown: 'Unknown',
}

export const CAN_TRADE_STATUS_LABELS: Record<CanTradeStatus, string> = {
  not_for_trade: 'Not for trade',
  available: 'Available for trade',
  reserved: 'Reserved',
  traded: 'Traded',
}
