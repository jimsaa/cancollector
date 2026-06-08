import { Check, Heart, Target } from 'lucide-react'
import type { MasterCanWithStatus } from '../../types/masterCan'
import type { UserCanStatusType } from '../../types/userCanStatus'
import { Button } from '../ui/Button'

interface MasterCanStatusButtonsProps {
  can: MasterCanWithStatus
  loading?: boolean
  compact?: boolean
  onStatus: (status: UserCanStatusType) => void
}

export function MasterCanStatusButtons({
  can,
  loading,
  compact,
  onStatus,
}: MasterCanStatusButtonsProps) {
  const btnClass = compact ? 'flex-1 py-1.5 text-xs' : 'flex-1 py-2 text-sm'

  return (
    <div className={`flex gap-2 ${compact ? '' : 'mt-4'}`}>
      <Button
        type="button"
        variant={can.markedGot ? 'primary' : 'secondary'}
        className={btnClass}
        loading={loading}
        onClick={() => onStatus('got')}
      >
        <Check size={compact ? 14 : 16} />
        {can.markedGot ? 'Got' : 'Got it'}
      </Button>
      <Button
        type="button"
        variant={can.wanted ? 'primary' : 'secondary'}
        className={btnClass}
        loading={loading}
        onClick={() => onStatus('want')}
      >
        <Heart size={compact ? 14 : 16} className={can.wanted ? 'fill-current' : ''} />
        {can.wanted ? 'Wanting' : 'Want it'}
      </Button>
      <Button
        type="button"
        variant={can.needed ? 'primary' : 'secondary'}
        className={btnClass}
        loading={loading}
        onClick={() => onStatus('need')}
      >
        <Target size={compact ? 14 : 16} />
        {can.needed ? 'Needed' : 'Need it'}
      </Button>
    </div>
  )
}
