'use client'

import { ImportDropzone } from './_components/import-dropzone'

export default function ImportsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">CSV Import</h1>
      </div>
      <p className="max-w-prose text-sm text-muted-foreground">
        Upload a CSV of leads to import them into the pipeline. The system will process the file
        asynchronously — no need to keep this page open.
      </p>
      <ImportDropzone />
    </div>
  )
}
