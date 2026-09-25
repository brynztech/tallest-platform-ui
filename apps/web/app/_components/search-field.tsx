'use client'
import { ArrowRight } from 'lucide-react'

interface SearchFieldProps {
  id: string
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder: string
  /** Visible label above the pill. Without one the placeholder names the input for screen readers. */
  label?: string
}

export function SearchField({ id, value, onChange, onSubmit, placeholder, label }: SearchFieldProps) {
  return (
    <div className="w-full max-w-[640px]">
      {label && (
        <label htmlFor={id} className="mb-3 block text-center text-[16px] leading-6 font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="flex h-14 items-center rounded-full border border-border-input bg-muted pr-2 pl-6 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-link">
        <input
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSubmit()}
          placeholder={placeholder}
          aria-label={label ? undefined : placeholder}
          enterKeyHint="search"
          autoComplete="off"
          className="h-full min-w-0 flex-1 bg-transparent text-[16px] leading-6 font-medium text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={onSubmit}
          aria-label="Search"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card shadow-badge focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
        >
          <ArrowRight className="h-[18px] w-[18px] text-foreground" strokeWidth={1.8} />
        </button>
      </div>
    </div>
  )
}
