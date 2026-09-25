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
    if (isDragOver) return 'border-foreground bg-muted ring-2 ring-primary/30'
    if (status === 'failed') return 'border-destructive/50 bg-destructive/5'
    if (file) return 'border-foreground/40 bg-muted'
    if (isBusy) return 'border-border-input/50 bg-muted/60'
    return 'border-border-input bg-card hover:bg-muted'
  }

  function getIcon() {
    if (status === 'failed') {
      return <AlertCircle className="h-6 w-6 text-destructive" />
    }
    if (file) {
      return <FileText className="h-6 w-6 text-foreground" />
    }
    return (
      <UploadCloud
        className={cn('h-6 w-6', isDragOver ? 'text-foreground' : 'text-muted-foreground')}
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
        'flex min-h-[168px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed px-6 text-center',
        'transition-[background-color,border-color] duration-150 ease-out',
        'has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-link',
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
      <span className="text-[14px] leading-5 font-medium text-foreground">{getPrimaryText()}</span>
      <span className="text-[14px] leading-5 text-muted-foreground">{getSubtext()}</span>
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
