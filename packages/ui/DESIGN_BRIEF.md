# Brynzit Design Brief

## Reference Sites

### Public Candidate Site (apps/web)
- contrario.ai — editorial typography, clean sections, strong CTA hierarchy
- workatastartup.com — candidate-first job discovery, readable job cards

### Internal Console (apps/console)
- Linear — keyboard-first, dense queue layouts, minimal chrome
- Attio — clean CRM tables, side-panel detail without page navigation

## Brand

**Name:** Brynzit
**Tone:** Professional but human — fast, no fluff
**Accent color:** oklch(0.546 0.215 261.3) — Tailwind blue-600 equivalent

## Token Intent

- `--primary`: Brynzit blue — CTAs, active states, focus rings
- `--destructive`: Red — Reject, Delete, Remove only (never for warnings)
- `--chart-2`: Amber — quota warnings, failed async states, snooze-wake badges

## Two-App Split

| Concern | apps/web | apps/console |
|---------|----------|--------------|
| Theme default | Light | Dark |
| Border radius | 0.5rem | 0.375rem |
| Type scale | Display + Heading large | Body + Label compact |
| Font weights | 400 + 600 | 400 + 500 |
