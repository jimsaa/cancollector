import { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import type { Can } from '../../types/can'
import { downloadCollectionBackup, parseCollectionBackup } from '../../lib/backup'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

interface BackupControlsProps {
  cans: Can[]
  userId: string
  onImport: (cans: Can[], mode: 'merge' | 'replace') => Promise<void>
}

export function BackupControls({ cans, userId, onImport }: BackupControlsProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleImport = async (file: File, mode: 'merge' | 'replace') => {
    setImporting(true)
    setMessage(null)
    try {
      const text = await file.text()
      const items = parseCollectionBackup(text, userId)
      await onImport(items, mode)
      setMessage(`Imported ${items.length} cans (${mode}).`)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <Card>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-monster-muted">
        Backup
      </p>
      <p className="mb-3 text-xs text-monster-muted">
        Export or import your full collection as JSON.
      </p>
      <div className="flex flex-col gap-2">
        <Button variant="secondary" fullWidth onClick={() => downloadCollectionBackup(cans)}>
          <Download size={18} />
          Export JSON
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const replace = confirm(
              'Replace entire collection with import?\n\nOK = Replace\nCancel = Merge with existing',
            )
            handleImport(file, replace ? 'replace' : 'merge')
          }}
        />
        <Button
          variant="secondary"
          fullWidth
          loading={importing}
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={18} />
          Import JSON
        </Button>
      </div>
      {message ? <p className="mt-2 text-xs text-monster-muted">{message}</p> : null}
    </Card>
  )
}
