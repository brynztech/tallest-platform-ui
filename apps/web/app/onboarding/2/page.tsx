'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@brynzit/ui/components/ui/button'
import { Input } from '@brynzit/ui/components/ui/input'
import { Label } from '@brynzit/ui/components/ui/label'
import { Progress } from '@brynzit/ui/components/ui/progress'
import { Textarea } from '@brynzit/ui/components/ui/textarea'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { useCandidateAuth } from '../../_components/candidate-auth-context'
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
  const { isLoggedIn } = useCandidateAuth()
  const [values, setValues] = useState<OnboardingProfile>({
    first_name: '',
    last_name: '',
    headline: '',
    skills: [],
    experience_summary: '',
  })
  const [skillInput, setSkillInput] = useState('')

  useEffect(() => {
    if (!isLoggedIn) router.replace('/signup')
  }, [isLoggedIn, router])

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
    <main className="mx-auto max-w-[560px] px-6 py-12">
      <div className="mb-8 space-y-2">
        <p className="text-sm text-muted-foreground">Step 2 of 3</p>
        <Progress value={66} className="h-2" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-normal text-foreground">Confirm your profile</h1>
        <p className="text-sm text-muted-foreground">
          Review what we parsed and make any corrections before setting your preferences.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="first_name">First name</Label>
            <Input
              id="first_name"
              value={values.first_name ?? ''}
              onChange={(event) => setValues({ ...values, first_name: event.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Last name</Label>
            <Input
              id="last_name"
              value={values.last_name ?? ''}
              onChange={(event) => setValues({ ...values, last_name: event.target.value })}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="headline">Headline</Label>
          <Input
            id="headline"
            placeholder="Senior Frontend Engineer"
            value={values.headline ?? ''}
            onChange={(event) => setValues({ ...values, headline: event.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="experience_summary">Experience summary</Label>
          <Textarea
            id="experience_summary"
            rows={4}
            placeholder="Summarize your recent work and strongest projects."
            value={values.experience_summary ?? ''}
            onChange={(event) => setValues({ ...values, experience_summary: event.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="skill">Skills</Label>
          <div className="flex gap-2">
            <Input
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
            <Button type="button" variant="outline" onClick={addSkill}>
              Add
            </Button>
          </div>
          {(values.skills?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1 pt-2">
              {values.skills?.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                  <button
                    type="button"
                    className="ml-1 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                    onClick={() => removeSkill(skill)}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Button type="submit" className="w-full">
          Save & continue
        </Button>
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
