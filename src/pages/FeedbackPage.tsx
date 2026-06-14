import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AlertTriangle, ImagePlus, MessageSquare, UserPlus } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { useAuth } from '../hooks/useAuth'
import { submitFeedback } from '../lib/feedback'
import {
  FEEDBACK_PRIORITY_LABELS,
  FEEDBACK_TYPE_LABELS,
  type FeedbackPriority,
  type FeedbackType,
} from '../types/feedback'

const FEEDBACK_TYPES = Object.keys(FEEDBACK_TYPE_LABELS) as FeedbackType[]
const FEEDBACK_PRIORITIES = Object.keys(FEEDBACK_PRIORITY_LABELS) as FeedbackPriority[]

export function FeedbackPage() {
  const { user, displayLabel, isCloudSynced, isGuest, isConfigured } = useAuth()
  const location = useLocation()

  const [type, setType] = useState<FeedbackType>('feature')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<FeedbackPriority>('normal')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  const canSubmit = isCloudSynced && user && !isGuest

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !user) return

    setSubmitting(true)
    setError(null)
    setSuccess(null)
    setWarning(null)

    try {
      const result = await submitFeedback(
        {
          user_id: user.id,
          user_email: user.email ?? null,
          display_name: displayLabel ?? null,
          type,
          title,
          message,
          priority,
          current_url: window.location.origin + location.pathname,
          user_agent: navigator.userAgent,
          screenshot_url: null,
        },
        screenshot,
      )

      if (result.screenshotWarning) setWarning(result.screenshotWarning)
      setSuccess('Thanks — your feedback has been sent to the CanTrove admin dashboard.')
      setTitle('')
      setMessage('')
      setPriority('normal')
      setType('feature')
      setScreenshot(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send feedback')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout title="Feedback">
      <div className="flex flex-col gap-4">
        <Card className="flex items-start gap-3 p-4">
          <MessageSquare size={22} className="mt-0.5 shrink-0 text-monster-green" />
          <div>
            <p className="font-semibold text-white">Send feedback</p>
            <p className="mt-1 text-sm text-monster-muted">
              Report bugs, request features, or flag image and trade issues. Everything goes to the
              admin dashboard — no email.
            </p>
          </div>
        </Card>

        {!canSubmit ? (
          <Card className="border-monster-green/30 bg-monster-green/5 p-4 text-center">
            <p className="text-sm text-white">
              Create a free account to send feedback and feature requests.
            </p>
            {isConfigured ? (
              <Link to="/register" className="mt-4 inline-block">
                <Button>
                  <UserPlus size={18} />
                  Create account
                </Button>
              </Link>
            ) : null}
          </Card>
        ) : (
          <Card className="p-4">
            <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
              <Select
                label="Type"
                value={type}
                onChange={(e) => setType(e.target.value as FeedbackType)}
              >
                {FEEDBACK_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {FEEDBACK_TYPE_LABELS[value]}
                  </option>
                ))}
              </Select>

              <Input
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Short summary"
              />

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-monster-muted">
                  Message
                </span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={5}
                  placeholder="Describe the issue or idea..."
                  className="rounded-xl border border-monster-border bg-monster-dark px-4 py-3 text-sm text-white placeholder:text-monster-muted/50 focus:border-monster-green focus:outline-none"
                />
              </label>

              <Select
                label="Priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as FeedbackPriority)}
              >
                {FEEDBACK_PRIORITIES.map((value) => (
                  <option key={value} value={value}>
                    {FEEDBACK_PRIORITY_LABELS[value]}
                  </option>
                ))}
              </Select>

              <div>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-monster-muted">
                    Screenshot (optional)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="feedback-screenshot"
                    onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
                  />
                  <label
                    htmlFor="feedback-screenshot"
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-monster-border bg-monster-dark px-4 py-3 text-sm text-monster-muted transition-colors hover:border-monster-green hover:text-white"
                  >
                    <ImagePlus size={18} className="text-monster-green" />
                    {screenshot ? screenshot.name : 'Upload screenshot'}
                  </label>
                </label>
              </div>

              {success ? <p className="text-sm text-monster-green">{success}</p> : null}
              {warning ? (
                <p className="flex items-start gap-2 text-sm text-yellow-400">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  {warning}
                </p>
              ) : null}
              {error ? <p className="text-sm text-red-400">{error}</p> : null}

              <Button type="submit" loading={submitting} disabled={!title.trim() || !message.trim()}>
                Send feedback
              </Button>
            </form>
          </Card>
        )}
      </div>
    </Layout>
  )
}

