'use client'

import { useState } from 'react'
import { UploadCloud, FileText, AlertCircle } from 'lucide-react'
import { cn } from '@brynzit/ui/lib/utils'

interface ResumeDropzoneProps {
  file: File | null
  status: 'idle' | 'uploading' | 'processing' | 'failed'
  disabled?: boolean
  onChange: (file: File | null) => void
}

export function ResumeDropzone({ file, status, disabled, onChange }: ResumeDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const isBusy = status === 'uploading' || status === 'processing'

  function getStateClass() {
    if (isDragOver) return 'border-primary bg-primary/5 ring-2 ring-primary/30'
    if (status === 'failed') return 'border-destructive/50 bg-destructive/5'
    if (file) return 'border-primary/40 bg-primary/5'
    if (isBusy) return 'border-border/50 bg-muted/30'
    return 'border-border/70 bg-card hover:bg-muted/50 hover:border-border'
  }

  function getIcon() {
    if (status === 'failed') {
      return <AlertCircle className="h-8 w-8 text-destructive" />
    }
    if (file) {
      return <FileText className="h-8 w-8 text-primary" />
    }
    return (
      <UploadCloud
        className={cn('h-8 w-8', isDragOver ? 'text-primary' : 'text-muted-foreground')}
      />
    )
  }

  function getPrimaryText() {
    if (status === 'failed') return 'Upload failed — try again'
    if (file) return file.name
    if (isDragOver) return 'Drop it here'
    return 'Drop your resume here, or click to upload'
  }

  function getSubtext() {
    if (isBusy) return 'Reading your resume…'
    return 'PDF, DOC, DOCX up to mock limit'
  }

  return (
    <label
      className={cn(
        'flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 text-center',
        'transition-[color,box-shadow,background-color] duration-150 ease-out',
        getStateClass(),
      )}
      onDragEnter={() => !disabled && setIsDragOver(true)}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragOver(false)
        if (disabled) return
        const dropped = e.dataTransfer.files[0]
        if (dropped) onChange(dropped)
      }}
    >
      {getIcon()}
      <span className="text-sm font-medium text-foreground">{getPrimaryText()}</span>
      <span className="text-xs text-muted-foreground">{getSubtext()}</span>
      <input
        type="file"
        accept=".pdf,.doc,.docx"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </label>
  )
}
