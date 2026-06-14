import { useRef, useState } from 'react'

import { Download, Lock, Upload } from 'lucide-react'

import type { Can } from '../../types/can'

import { downloadCollectionBackup, parseCollectionBackup } from '../../lib/backup'

import { Button } from '../ui/Button'

import { Card } from '../ui/Card'



interface BackupControlsProps {

  cans: Can[]

  userId: string

  onImport: (cans: Can[], mode: 'merge' | 'replace') => Promise<void>

  canExportBackup: boolean

  canImportBackup: boolean

  onExportComplete?: () => void

  onLockedAction?: () => void

  compact?: boolean

}



export function BackupControls({

  cans,

  userId,

  onImport,

  canExportBackup,

  canImportBackup,

  onExportComplete,

  onLockedAction,

  compact = false,

}: BackupControlsProps) {

  const inputRef = useRef<HTMLInputElement>(null)

  const [importing, setImporting] = useState(false)

  const [message, setMessage] = useState<string | null>(null)



  const handleExport = () => {

    if (!canExportBackup) {

      onLockedAction?.()

      return

    }

    downloadCollectionBackup(cans, { userId })

    onExportComplete?.()

    setMessage('Backup downloaded.')

  }



  const handleImport = async (file: File, mode: 'merge' | 'replace') => {

    if (!canImportBackup) return

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



  const handleImportClick = () => {

    if (!canImportBackup) {

      onLockedAction?.()

      return

    }

    inputRef.current?.click()

  }



  return (

    <Card>

      {!compact ? (

        <>

          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-monster-muted">

            Backup actions

          </p>

          <p className="mb-3 text-xs text-monster-muted">

            Export or import your full collection as JSON.

          </p>

        </>

      ) : null}

      <div className="flex flex-col gap-2">

        <Button variant="secondary" fullWidth onClick={handleExport}>

          {canExportBackup ? <Download size={18} /> : <Lock size={18} />}

          Export JSON

        </Button>

        <input

          ref={inputRef}

          type="file"

          accept="application/json,.json"

          className="hidden"

          disabled={!canImportBackup}

          onChange={(e) => {

            if (!canImportBackup) return

            const file = e.target.files?.[0]

            if (!file) return

            const replace = confirm(

              'Replace entire collection with import?\n\nOK = Replace\nCancel = Merge with existing',

            )

            handleImport(file, replace ? 'replace' : 'merge')

          }}

        />

        <Button variant="secondary" fullWidth loading={importing} onClick={handleImportClick}>

          {canImportBackup ? <Upload size={18} /> : <Lock size={18} />}

          Import JSON

        </Button>

      </div>

      {message ? <p className="mt-2 text-xs text-monster-muted">{message}</p> : null}

    </Card>

  )

}


