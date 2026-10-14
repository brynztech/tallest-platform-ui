'use client'

import { useState } from 'react'

interface ResumeDropzoneProps {
  file: File | null
  status: 'idle' | 'uploading' | 'processing' | 'failed'
  disabled?: boolean
  onChange: (file: File | null) => void
}

export function ResumeDropzone({ file, status, disabled, onChange }: ResumeDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const isBusy = status === 'uploading' || status === 'processing'

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
    <div className={`field${status === 'failed' ? ' invalid' : ''}`}>
      <label
        className={`file-drop${file ? ' has' : ''}${isDragOver ? ' over' : ''}`}
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
        <span className="grid gap-0.5">
          <span>{getPrimaryText()}</span>
          <span className="fd-t">{getSubtext()}</span>
        </span>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          disabled={disabled}
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  )
}
