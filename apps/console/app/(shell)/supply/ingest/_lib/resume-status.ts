import type { components } from '@brynzit/api-client'

type CandidateProfile = components['schemas']['CandidateProfileResponse']

export function isResumeParsingComplete(candidate: CandidateProfile | null | undefined): boolean {
  return Boolean(
    candidate?.talent_pool?.extraction_method || candidate?.talent_pool?.resume_file_path,
  )
}
