'use client'
import { useEffect, useRef, useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

interface LocationFieldProps {
  id: string
  /** The chosen place, or '' for none. Only listed places are ever passed to onChange. */
  value: string
  onChange: (value: string) => void
  label?: string
}

/** A search box for the places a candidate may pick (backend `GET /public/locations`).
 *  Typing never changes the value: only choosing a listed place does, so a made-up
 *  location cannot reach the profile. Leaving the box restores the last choice. */
export function LocationField({ id, value, onChange, label = 'Location' }: LocationFieldProps) {
  const [text, setText] = useState(value)
  const [options, setOptions] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => setText(value), [value])

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/public/locations?q=${encodeURIComponent(text === value ? '' : text)}`, {
          signal: controller.signal,
        })
        if (res.ok) {
          setOptions(((await res.json()) as { items: string[] }).items)
          setActive(0)
        }
      } catch {
        /* aborted or offline: keep the last list */
      }
    }, 150)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [open, text, value])

  function choose(next: string) {
    onChange(next)
    setText(next)
    setOpen(false)
  }

  return (
    <div
      className="field combo"
      ref={root}
      onBlur={e => {
        if (!root.current?.contains(e.relatedTarget as Node | null)) {
          setOpen(false)
          setText(value)
        }
      }}
    >
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder="Search for your city"
        value={text}
        onFocus={() => setOpen(true)}
        onChange={e => {
          setText(e.target.value)
          setOpen(true)
        }}
        onKeyDown={e => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActive(i => Math.min(i + 1, options.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive(i => Math.max(i - 1, 0))
          } else if (e.key === 'Enter' && open && options[active]) {
            e.preventDefault()
            choose(options[active])
          } else if (e.key === 'Escape') {
            setOpen(false)
            setText(value)
          }
        }}
      />
      {open && (
        <ul className="combo-list" id={`${id}-list`} role="listbox">
          {options.length === 0 ? (
            <li className="combo-empty">No match. Pick &ldquo;Remote / other&rdquo; if your city is not listed.</li>
          ) : (
            options.map((option, i) => (
              <li
                key={option}
                role="option"
                aria-selected={i === active}
                className={i === active ? 'on' : undefined}
                // mousedown, not click: the input's blur would close the list first.
                onMouseDown={e => {
                  e.preventDefault()
                  choose(option)
                }}
              >
                {option}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
