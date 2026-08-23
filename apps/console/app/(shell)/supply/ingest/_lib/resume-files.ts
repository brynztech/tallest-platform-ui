/**
 * Which uploaded files the resume parser accepts.
 *
 * Folder selection (`webkitdirectory`) hands back EVERY file under the folder,
 * recursively — `.DS_Store`, images, spreadsheets, nested subfolders — so the
 * caller must filter before uploading. The dropzone's `accept` map only guards
 * the drag/browse path, hence this shared list: one definition for both.
 */

export const RESUME_EXTENSIONS = ['.pdf', '.doc', '.docx'] as const

/** Mirrors the dropzone `accept` map and the backend's suffix check. */
export const RESUME_ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
} as const

export function isSupportedResume(file: File): boolean {
  const name = file.name.toLowerCase()
  // Extension, not MIME: browsers report inconsistent types for .doc/.docx,
  // and the backend keys off the suffix too.
  return RESUME_EXTENSIONS.some((extension) => name.endsWith(extension))
}

export interface FolderSelection {
  /** Files the parser can handle, in stable name order. */
  accepted: File[]
  /** How many files were ignored (unsupported type or macOS metadata). */
  skippedCount: number
}

/**
 * Split a folder's contents into what we can parse and a count of what we
 * ignored, so the UI can say "12 resumes found, 3 other files skipped" rather
 * than silently dropping them.
 */
export function selectResumesFromFolder(files: File[]): FolderSelection {
  const accepted = files
    .filter((file) => !file.name.startsWith('.') && isSupportedResume(file))
    .sort((a, b) => a.name.localeCompare(b.name))
  return { accepted, skippedCount: files.length - accepted.length }
}
