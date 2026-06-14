import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Database, Flag, Inbox, LayoutDashboard, LogOut, Sparkles, Upload, Users } from 'lucide-react'
import { Button } from '../ui/Button'
import { fetchNewFeedbackCount } from '../../lib/feedback'
import { fetchNewMatchReportCount } from '../../lib/matchReports'

interface AdminHubNavProps {
  showExit?: boolean
  onExit?: () => void
}

export function AdminHubNav({ showExit, onExit }: AdminHubNavProps) {
  const [newFeedbackCount, setNewFeedbackCount] = useState(0)
  const [newMatchReportCount, setNewMatchReportCount] = useState(0)

  useEffect(() => {
    void fetchNewFeedbackCount()
      .then(setNewFeedbackCount)
      .catch(() => setNewFeedbackCount(0))
    void fetchNewMatchReportCount()
      .then(setNewMatchReportCount)
      .catch(() => setNewMatchReportCount(0))
  }, [])

  return (
    <div className="flex flex-wrap gap-2">
      <Link to="/admin">
        <Button variant="secondary" className="py-2 text-xs">
          <LayoutDashboard size={14} />
          Dashboard
        </Button>
      </Link>
      <Link to="/admin/feedback">
        <Button variant="secondary" className="relative py-2 text-xs">
          <Inbox size={14} />
          Feedback Inbox
          {newFeedbackCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-monster-green px-1 text-[9px] font-bold text-black">
              {newFeedbackCount > 99 ? '99+' : newFeedbackCount}
            </span>
          ) : null}
        </Button>
      </Link>
      <Link to="/admin/match-reports">
        <Button variant="secondary" className="relative py-2 text-xs">
          <Flag size={14} />
          Match Reports
          {newMatchReportCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-monster-green px-1 text-[9px] font-bold text-black">
              {newMatchReportCount > 99 ? '99+' : newMatchReportCount}
            </span>
          ) : null}
        </Button>
      </Link>
      <Link to="/admin/master-cans">
        <Button variant="secondary" className="py-2 text-xs">
          <Database size={14} />
          Scan queue
        </Button>
      </Link>
      <Link to="/admin/image-review">
        <Button variant="secondary" className="py-2 text-xs">
          <Sparkles size={14} />
          Image review
        </Button>
      </Link>
      <Link to="/admin/image-uploader">
        <Button variant="secondary" className="py-2 text-xs">
          <Upload size={14} />
          Image uploader
        </Button>
      </Link>
      <Link to="/admin/users">
        <Button variant="secondary" className="py-2 text-xs">
          <Users size={14} />
          Users
        </Button>
      </Link>
      {showExit && onExit ? (
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-1 self-center px-2 text-xs text-monster-muted hover:text-white"
        >
          <LogOut size={14} />
          Exit
        </button>
      ) : null}
    </div>
  )
}

