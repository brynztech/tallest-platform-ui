/**
 * `Requisition.intake_details` is a loosely-typed JSONB blob (backend
 * schema: `Any`) that already carries the generated JD's green/red flags
 * and text — written by `ops/services/jd_generator.py::_matching_intake`.
 * These read it defensively rather than trusting a generated type for it.
 */
function record(intake: unknown): Record<string, unknown> {
  return intake && typeof intake === 'object' ? (intake as Record<string, unknown>) : {}
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

export function intakeGreenFlags(intake: unknown): string[] {
  return stringArray(record(intake).green_flags)
}

export function intakeRedFlags(intake: unknown): string[] {
  return stringArray(record(intake).red_flags)
}

export function hasGeneratedJd(intake: unknown): boolean {
  return Boolean(record(intake).generated_jd)
}

interface QuickFacts {
  location: string
  work_type: string
  experience: string
  equity: string
}

/** Written by jd_generator.py::_matching_intake as a flat `quick_facts` key. */
export function intakeQuickFacts(intake: unknown): QuickFacts {
  const facts = record(record(intake).quick_facts)
  const str = (key: string) => (typeof facts[key] === 'string' ? (facts[key] as string) : '')
  return {
    location: str('location'),
    work_type: str('work_type'),
    experience: str('experience'),
    equity: str('equity'),
  }
}
