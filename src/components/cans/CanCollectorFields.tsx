import type { CanFormData } from './CanForm'
import {
  availableForTradeFromStatus,
  openedFromStatus,
} from '../../lib/canCollectorFields'
import {
  CAN_TRADE_STATUS_LABELS,
  CAN_TRADE_STATUSES,
  CONDITION_GRADE_LABELS,
  CONDITION_GRADES,
  OPENING_STATUS_LABELS,
  OPENING_STATUSES,
  TRADE_CURRENCIES,
  type CanTradeStatus,
  type ConditionGrade,
  type OpeningStatus,
  type TradeCurrency,
} from '../../types/canCollector'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

interface CanCollectorFieldsProps {
  data: CanFormData
  onChange: (data: CanFormData) => void
  showTradeFields?: boolean
  showPrivacyFields?: boolean
}

export function CanCollectorFields({
  data,
  onChange,
  showTradeFields = true,
  showPrivacyFields = true,
}: CanCollectorFieldsProps) {
  const set = <K extends keyof CanFormData>(key: K, value: CanFormData[K]) => {
    onChange({ ...data, [key]: value })
  }

  const setOpeningStatus = (status: OpeningStatus) => {
    onChange({
      ...data,
      opening_status: status,
      opened: openedFromStatus(status),
    })
  }

  const setTradeStatus = (status: CanTradeStatus) => {
    onChange({
      ...data,
      trade_status: status,
      available_for_trade: availableForTradeFromStatus(status),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-monster-muted">
        Collection details
      </p>

      <Select
        label="Opening status"
        value={data.opening_status}
        onChange={(e) => setOpeningStatus(e.target.value as OpeningStatus)}
      >
        {OPENING_STATUSES.map((status) => (
          <option key={status} value={status}>
            {OPENING_STATUS_LABELS[status]}
          </option>
        ))}
      </Select>

      <Input
        label="Quantity"
        type="number"
        min={1}
        value={data.quantity}
        onChange={(e) => set('quantity', Math.max(1, parseInt(e.target.value) || 1))}
      />

      <Input
        label="Purchase date"
        type="date"
        value={data.purchase_date}
        onChange={(e) => set('purchase_date', e.target.value)}
      />

      <Input
        label="Purchase country"
        value={data.purchase_country}
        onChange={(e) => set('purchase_country', e.target.value)}
        placeholder="e.g. Sweden"
      />

      <Input
        label="Purchase city"
        value={data.purchase_city}
        onChange={(e) => set('purchase_city', e.target.value)}
        placeholder="e.g. Stockholm"
      />

      <Input
        label="Purchase store"
        value={data.purchase_store}
        onChange={(e) => set('purchase_store', e.target.value)}
        placeholder="e.g. ICA, gas station, festival"
      />

      <Select
        label="Condition grade"
        value={data.condition_grade}
        onChange={(e) => set('condition_grade', e.target.value as ConditionGrade)}
      >
        {CONDITION_GRADES.map((grade) => (
          <option key={grade} value={grade}>
            {CONDITION_GRADE_LABELS[grade]}
          </option>
        ))}
      </Select>

      <Input
        label="Condition notes"
        value={data.condition_notes}
        onChange={(e) => set('condition_notes', e.target.value)}
        placeholder="Dents, scratches, fill level..."
      />

      {showPrivacyFields ? (
        <>
          <p className="text-xs font-semibold uppercase tracking-wide text-monster-muted">
            Privacy
          </p>

          <label className="flex items-center gap-3 rounded-xl border border-monster-border bg-monster-dark px-4 py-3">
            <input
              type="checkbox"
              checked={data.is_public}
              onChange={(e) => set('is_public', e.target.checked)}
              className="h-4 w-4 accent-monster-green"
            />
            <span className="text-sm">Public can (visible when sharing)</span>
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-monster-border bg-monster-dark px-4 py-3">
            <input
              type="checkbox"
              checked={data.show_on_public_profile}
              onChange={(e) => set('show_on_public_profile', e.target.checked)}
              className="h-4 w-4 accent-monster-green"
            />
            <span className="text-sm">Show on public profile</span>
          </label>
        </>
      ) : null}

      {showTradeFields ? (
        <>
          <p className="text-xs font-semibold uppercase tracking-wide text-monster-muted">
            Trade
          </p>

          <Select
            label="Trade status"
            value={data.trade_status}
            onChange={(e) => setTradeStatus(e.target.value as CanTradeStatus)}
          >
            {CAN_TRADE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {CAN_TRADE_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Trade price"
              type="number"
              min={0}
              step="0.01"
              value={data.trade_price}
              onChange={(e) => set('trade_price', e.target.value)}
              placeholder="Optional"
              disabled={!data.available_for_trade}
            />
            <Select
              label="Currency"
              value={data.trade_currency}
              onChange={(e) => set('trade_currency', e.target.value as TradeCurrency)}
              disabled={!data.available_for_trade}
            >
              <option value="">—</option>
              {TRADE_CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Trade note"
            value={data.trade_note}
            onChange={(e) => set('trade_note', e.target.value)}
            placeholder="Swap preferences, shipping, bundle deals..."
            disabled={!data.available_for_trade}
          />
        </>
      ) : null}
    </div>
  )
}
