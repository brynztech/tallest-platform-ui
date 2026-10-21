'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCandidateAuth } from '../../_components/candidate-auth-context'
import { RemovableChip } from '../../_components/removable-chip'
import type { CandidateProfile } from '../../_lib/candidate-types'

type OnboardingProfile = {
  first_name?: string
  last_name?: string
  email?: string
  headline?: string
  skills?: string[]
  experience_summary?: string
}

export default function OnboardingProfilePage() {
  const router = useRouter()
  const { isLoggedIn, isReady } = useCandidateAuth()
  const [values, setValues] = useState<OnboardingProfile>({
    first_name: '',
    last_name: '',
    headline: '',
    skills: [],
    experience_summary: '',
  })
  const [skillInput, setSkillInput] = useState('')

  useEffect(() => {
    if (isReady && !isLoggedIn) router.replace('/signup')
  }, [isReady, isLoggedIn, router])

  useEffect(() => {
    const signupProfile = readJson<OnboardingProfile>('candidate_onboarding_profile')
    const snapshot = readJson<Partial<CandidateProfile>>('candidate_profile_snapshot')
    setValues({
      first_name: signupProfile?.first_name ?? '',
      last_name: signupProfile?.last_name ?? '',
      email: signupProfile?.email ?? '',
      headline: snapshot?.headline ?? '',
      skills: snapshot?.skills ?? [],
      experience_summary: '',
    })
  }, [])

  function addSkill() {
    const skill = skillInput.trim()
    if (!skill) return
    setValues((current) => ({
      ...current,
      skills: Array.from(new Set([...(current.skills ?? []), skill])),
    }))
    setSkillInput('')
  }

  function removeSkill(skill: string) {
    setValues((current) => ({
      ...current,
      skills: (current.skills ?? []).filter((item) => item !== skill),
    }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    localStorage.setItem('candidate_onboarding_profile', JSON.stringify(values))
    router.push('/onboarding/3')
  }

  if (!isLoggedIn) return null

  return (
    <main className="wrap page narrow">
      <div className="page-head">
        <div className="steps" aria-label="Step 2 of 3"><i className="on" /><i className="on" /><i /></div>
        <h1 className="d2">Confirm your <em>profile</em></h1>
        <p className="lede">Review what we parsed and make any corrections before setting your preferences.</p>
      </div>

      <form onSubmit={handleSubmit} className="panel">
        <div className="row2">
          <div className="field">
            <label htmlFor="first_name">First name</label>
            <input
              id="first_name"
              value={values.first_name ?? ''}
              onChange={(event) => setValues({ ...values, first_name: event.target.value })}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="last_name">Last name</label>
            <input
              id="last_name"
              value={values.last_name ?? ''}
              onChange={(event) => setValues({ ...values, last_name: event.target.value })}
              required
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="headline">Headline</label>
          <input
            id="headline"
            placeholder="Senior Frontend Engineer"
            value={values.headline ?? ''}
            onChange={(event) => setValues({ ...values, headline: event.target.value })}
          />
        </div>

        <div className="field">
          <label htmlFor="experience_summary">Experience summary</label>
          <textarea
            id="experience_summary"
            rows={4}
            placeholder="Summarize your recent work and strongest projects."
            value={values.experience_summary ?? ''}
            onChange={(event) => setValues({ ...values, experience_summary: event.target.value })}
          />
        </div>

        <div className="field">
          <label htmlFor="skill">Skills</label>
          <div className="flex gap-2">
            <input
              id="skill"
              value={skillInput}
              onChange={(event) => setSkillInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addSkill()
                }
              }}
              placeholder="TypeScript"
            />
            <button type="button" className="btn btn-ghost" onClick={addSkill}>
              Add
            </button>
          </div>
          {(values.skills?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {values.skills?.map((skill) => (
                <RemovableChip
                  key={skill}
                  label={skill}
                  removeLabel={`Remove ${skill}`}
                  onRemove={() => removeSkill(skill)}
                />
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-primary btn-block">
          Save & continue
        </button>
      </form>
    </main>
  )
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}
