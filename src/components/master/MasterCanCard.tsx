import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import type { MasterCanCommunityCounts, MasterCanWithStatus } from '../../types/masterCan'
import type { UserCanStatusType } from '../../types/userCanStatus'
import { getMasterCollectionSet } from '../../lib/collectionSets'
import { getVariantCountryLabel } from '../../lib/countryVariants'
import {
  getMasterReferenceDisplayUrl,
  getMasterReferenceImageUrl,
} from '../../lib/masterReferenceImage'
import { CommunityCountLabels } from './CommunityCountLabels'
import { MasterCanStatusButtons } from './MasterCanStatusButtons'
import { Card } from '../ui/Card'

interface MasterCanCardProps {
  can: MasterCanWithStatus
  onStatus?: (can: MasterCanWithStatus, status: UserCanStatusType) => void
  statusLoading?: boolean
  showOwnedBadge?: boolean
  showStatusButtons?: boolean
  communityCounts?: MasterCanCommunityCounts
  linkToDetail?: boolean
}

const rarityColors: Record<string, string> = {
  common: 'text-monster-muted',
  uncommon: 'text-blue-400',
  rare: 'text-yellow-400',
  unknown: 'text-monster-muted',
}

export function MasterCanCard({
  can,
  onStatus,
  statusLoading,
  showOwnedBadge = true,
  showStatusButtons = false,
  communityCounts,
  linkToDetail = true,
}: MasterCanCardProps) {
  const country = getVariantCountryLabel(can)
  const set = getMasterCollectionSet(can)

  const inner = (
    <Card className="flex flex-col gap-3 p-3">
      <div className="flex gap-3">
        <div className="flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-monster-card">
          {getMasterReferenceImageUrl(can) ? (
            <img
              src={getMasterReferenceDisplayUrl(can)}
              alt=""
              className="h-full w-full object-contain p-0.5"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-[10px] font-bold uppercase text-monster-muted">{can.brand[0]}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {linkToDetail ? (
                <Link
                  to={`/cans/${can.id}`}
                  className="truncate font-semibold text-white hover:text-monster-green"
                >
                  {can.product_name}
                </Link>
              ) : (
                <p className="truncate font-semibold text-white">{can.product_name}</p>
              )}
              <p className="text-xs text-monster-muted">
                {[can.brand, can.flavor, can.volume].filter(Boolean).join(' · ')}
              </p>
              <p className="mt-0.5 text-[10px] text-monster-muted">
                {[set, country].filter(Boolean).join(' · ')}
              </p>
            </div>
            {showOwnedBadge && can.owned ? (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-monster-green/20 px-2 py-0.5 text-[10px] font-semibold text-monster-green">
                <Check size={12} />
                Owned
              </span>
            ) : null}
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <span className={`text-[10px] uppercase tracking-wide ${rarityColors[can.rarity]}`}>
              {can.rarity}
              {can.discontinued ? ' · discontinued' : ''}
            </span>
            {can.needed ? (
              <span className="text-[10px] font-semibold uppercase text-yellow-400">Needed</span>
            ) : can.wanted ? (
              <span className="text-[10px] font-semibold uppercase text-monster-green">Wanted</span>
            ) : null}
          </div>
        </div>
      </div>

      {communityCounts ? <CommunityCountLabels counts={communityCounts} compact /> : null}

      {showStatusButtons && onStatus ? (
        <MasterCanStatusButtons
          can={can}
          loading={statusLoading}
          compact
          onStatus={(status) => onStatus(can, status)}
        />
      ) : null}
    </Card>
  )

  if (linkToDetail && !showStatusButtons) {
    return (
      <Link to={`/cans/${can.id}`} className="block transition-opacity hover:opacity-90">
        {inner}
      </Link>
    )
  }

  return inner
}
