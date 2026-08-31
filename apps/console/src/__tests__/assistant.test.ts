import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { ALL_CAPABILITIES, ROLE_CAPABILITIES } from '@brynzit/identity'
import { isTurnLive } from '../../app/(shell)/assistant/_lib/assistant-data'
import {
  STARTERS,
  STARTER_TITLE_MAX,
  startersFor,
} from '../../app/(shell)/assistant/_lib/starters'

describe('assistant.view capability', () => {
  it('is granted to every console role (§7: all four roles)', () => {
    expect(ALL_CAPABILITIES).toContain('assistant.view')
    for (const role of Object.keys(ROLE_CAPABILITIES) as (keyof typeof ROLE_CAPABILITIES)[]) {
      expect(ROLE_CAPABILITIES[role]).toContain('assistant.view')
    }
  })

  it('gates the floating widget itself — there is no route to gate anymore', () => {
    // The assistant moved from a routed page (gated in route-capabilities.ts,
    // like every other gated route) to a globally-mounted floating widget, so
    // the capability check has to live inline in the widget instead. This is
    // that drift-prevention assertion's equivalent for a non-route surface.
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../app/(shell)/assistant/_components/assistant-widget.tsx'),
      'utf-8',
    )
    expect(src).toContain('useCan')
    expect(src).toContain("can('assistant.view')")
  })
})

describe('isTurnLive', () => {
  it('locks the composer for pending and running turns', () => {
    expect(isTurnLive('pending')).toBe(true)
    expect(isTurnLive('running')).toBe(true)
  })

  it('releases the composer for terminal statuses and no turn yet', () => {
    expect(isTurnLive('done')).toBe(false)
    expect(isTurnLive('error')).toBe(false)
    expect(isTurnLive('cancelled')).toBe(false)
    expect(isTurnLive(null)).toBe(false)
    expect(isTurnLive(undefined)).toBe(false)
  })
})

describe('starter prompts', () => {
  it('offers four, each with a prompt that is actually sent', () => {
    expect(STARTERS).toHaveLength(4)
    for (const starter of STARTERS) {
      expect(starter.title.length).toBeGreaterThan(0)
      expect(starter.prompt.length).toBeGreaterThan(0)
    }
  })

  it('never suggests something the read-only assistant cannot do', () => {
    // A starter that leads to "I can't do that" advertises a capability the
    // assistant does not have. Mutations are deferred by contract.
    const forbidden = /\b(add|create|update|advance|approve|reject|delete|send|assign|change|move)\b/i
    for (const starter of STARTERS) {
      expect(starter.prompt, starter.title).not.toMatch(forbidden)
      expect(starter.title, starter.title).not.toMatch(forbidden)
    }
  })
})

describe('assistant shell', () => {
  const widget = fs.readFileSync(
    path.resolve(__dirname, '../../app/(shell)/assistant/_components/assistant-widget.tsx'),
    'utf-8',
  )

  it('is modal only when expanded — docked, the console stays usable behind it', () => {
    // Radix renders the backdrop and traps focus only while modal, so this one
    // flag is what makes the docked panel non-blocking.
    expect(widget).toContain('modal={expanded}')
    expect(widget).not.toContain('modal={true}')
  })

  it('keeps one mounted chat across expand, so the conversation survives', () => {
    // Two separately-rendered trees would remount and drop the conversation.
    expect(widget.match(/<AssistantChat/g) ?? []).toHaveLength(1)
  })

  it('uses the BrynzIT product name and never names a model or provider', () => {
    expect(widget).toContain('BrynzIT Assistant')
    expect(widget).not.toMatch(/RamAIn|Claude|GPT|Groq|OpenAI/i)
  })
})

describe('starter labels fit one line (DESIGN_SYSTEM.md fixed-width rule)', () => {
  it.each(STARTERS.map((s) => s.title))('%s fits the panel budget', (title) => {
    // A wrapped label makes the two-across grid ragged and shoves the composer
    // around. Shorten the label, never the layout — the long form lives in the
    // prompt, which is what actually gets sent.
    expect(title.length).toBeLessThanOrEqual(STARTER_TITLE_MAX)
  })

  it('keeps the full question in the prompt, so shortening a label costs nothing', () => {
    const summary = STARTERS.find((s) => s.title === 'How am I doing?')
    expect(summary?.prompt).toContain('status summary')
  })
})

describe('startersFor', () => {
  it('shows two side by side in the docked panel, not a stack of four', () => {
    expect(startersFor(false)).toHaveLength(2)
  })

  it('shows all four once there is room to expand', () => {
    expect(startersFor(true)).toHaveLength(4)
  })

  it('the panel pair is drawn from the same list, not a separate copy', () => {
    expect(STARTERS.slice(0, 2)).toEqual(startersFor(false))
  })
})
