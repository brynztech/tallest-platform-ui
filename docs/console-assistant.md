# Console Assistant

Status: implemented on `frontend-dev` · Last updated: 2026-08-31

Floating chat widget over the read-only assistant API — see
`../talent-platform/docs/console-assistant.md` for the backend half
(endpoints, agent loop, tools, streaming, tests).

## UI

`apps/console/app/(shell)/assistant/`:

- `_components/assistant-widget.tsx` — the shell: a floating bottom-right
  button (which becomes ✕ while open) opening a **docked panel** that can
  **expand** to a full working view. Mounted once in `(shell)/layout.tsx`, so
  it is reachable from every console page. There is **no `/assistant` route**;
  the assistant deliberately has no page of its own (deviation from principles
  §7, which placed it at a route). The `assistant.view` capability is therefore
  checked inline here rather than in `_lib/route-capabilities.ts` — that file
  governs routes, and there is no route to govern.

  **`modal` tracks `expanded`, and that one flag carries the whole behavioural
  difference.** Docked it is false: no backdrop, no focus trap, the console
  stays interactive so you can read a requisition while asking about it.
  Expanded it is true and Radix supplies both. Two consequences worth knowing:
  Radix renders `Dialog.Overlay` *only* while modal (so a separate "show a
  backdrop" prop would be dead code — one was written and reverted), and
  toggling `modal` swaps Radix's modal/non-modal Content, which are different
  component types, so **the chat subtree really does remount on expand**. The
  conversation id and draft therefore live in the widget, above that boundary
  — otherwise expanding mid-chat silently starts a new one.

  Header is icon-only: new chat · history · expand · close. New chat and
  history are hidden when expanded, where the sidebar already carries both.
- `_components/assistant-chat.tsx` — timeline + composer, plus the
  History/New toolbar. The conversation is created **lazily on the first
  send**, not on open, so browsing the widget never mints empty history rows.
  A persona switch resets to a fresh chat and shows that persona's own history
  (scope is captured once at creation, per §3). Polls `GET .../events` only
  while the latest turn is `pending`/`running`, at 300ms so streamed tokens
  read as typing; stops dead when terminal. Send becomes Stop while live.
  Auto-scrolls as text arrives.
- `_components/assistant-history.tsx` — past chats for the acting user
  (preview + relative timestamp) with a debounced search box. One component,
  two homes: a swap-in list in the docked panel, the permanent left sidebar
  when expanded. Selecting one loads its transcript.
- `_components/assistant-markdown.tsx` — `react-markdown` + `remark-gfm` for
  `assistant_message` bodies **only** (§7): real heading hierarchy, styled
  tables (which scroll rather than stretch the bubble), lists, code and
  blockquotes. Two hard rules: no raw HTML (react-markdown's default —
  `rehype-raw` is deliberately absent) and console-relative links only,
  enforced by `urlTransform`; a rejected href renders as plain text, so a
  hallucinated external URL is never clickable — this also neutralises GFM
  autolink-literals. `img` is disallowed — it would fetch an external URL from
  model-authored markup.

  **Rendering was never the reason replies looked flat.** The model was
  emitting no markup at all; the fix is the backend system prompt's Formatting
  section (see `../talent-platform/docs/console-assistant.md`). This component
  only has to render well what the model now emits.
- `_lib/activity.ts` — pure projection (§7 "project before rendering"):
  folds adjacent `tool_call`/`tool_result` runs into one `<details>` block
  with humanized one-line labels ("Checked your 3 roles", "Read the pipeline —
  2 of 12 candidates"), pairs results to calls by `call_id` (never by tool
  name), drops orphans silently, and surfaces truncation. Raw JSON never
  reaches the timeline. Native `<details>` because this repo has no
  Collapsible primitive — the same "native over a new dependency" precedent as
  `title` over a Tooltip lib.
- `_lib/starters.ts` — the four opening suggestions, deliberately limited to
  what the read-only tools can actually answer. A starter that leads to "I
  can't do that" advertises a capability the assistant does not have; a test
  asserts none of them use mutation verbs.
- `_lib/assistant-data.ts` — native `fetch` against `/api/v1/assistant/*`
  (same convention as `_lib/assignments.ts`; no generated client covers this
  router). `partial` carries the in-flight streamed text and is always the
  full text so far, never a fragment to append. `fetchConversations` takes a
  `search` term.

### Gotcha worth remembering

Radix's `ScrollArea` viewport wraps its children in a `display: table` div,
which lets them size to content — so `truncate` silently does nothing inside
one. Both scroll areas here force it back with
`[&_[data-slot=scroll-area-viewport]>div]:!block`. Long chat titles ran off the
sidebar edge until this was added.

## Not built, deliberately

The reference design carried an attachment button, "Ask first / Auto-run"
mode pills, and a model selector. None were built: attachments are ruled out by
§6 (nothing to index), the mode pills imply the assistant can execute things
when it is read-only by contract, and naming a model breaks §10 rule 8. The
model-selector corner shows the **scope badge** instead — the one thing in that
position that genuinely matters, since it says whose data you are looking at.

## Dependencies

`react-markdown` (^10.1.0) — the repo's first markdown renderer, added for
this feature exactly as principles §7 anticipated. `remark-gfm` (^4.0.1) for
tables, which is the shape most pipeline answers want.

## Capability

`assistant.view` — in `packages/identity/src/{types,capabilities}.ts`, granted
to all four roles (admin via `ALL_CAPABILITIES`). Not in
`route-capabilities.ts`, since the widget is not a route; see the widget note
above.

## Gap: no mock handler

`packages/mocks/src/handlers/` has no assistant handler, so
`NEXT_PUBLIC_API_MOCKING=enabled` runs will fail to load the widget's data.
Add `packages/mocks/src/handlers/assistant.ts` (in-memory conversation/turn/
event store) if a mocked dev/demo run is needed.

## Tests

`apps/console/src/__tests__/`, written as `.ts` (new `.tsx` files fail to
transform under this app's Vitest — `CLAUDE.md` gotcha 3):

- `assistant.test.ts` — `assistant.view` on every role; `isTurnLive()` truth
  table; a source assertion that the widget gates itself inline (the
  non-route equivalent of the `route-capabilities` drift check).
- `assistant-activity.test.ts` — the projection: folding, `call_id` pairing
  with out-of-order results, orphan dropping, truncation wording,
  pluralisation, scoping errors relayed as their message, the guarantee that
  no tool name or JSON reaches a label, and history timestamp formatting
  (time today / weekday this week / date beyond, and no "Invalid Date").

Verified live against the real backend with Playwright: streamed text paints
progressively (5 distinct growth steps, 29 → 609 chars); no literal `**` or
`##` survives to the screen; a multi-role question renders 30 `<strong>`
elements and a real `<table>`; a tool-using question produces one collapsed
`<details>` reading "Summed up your 1 role" with no JSON in the timeline;
history lists past chats with preview/timestamp/count, loading one restores
its transcript, and "New" returns to the empty state. Zero Radix
`aria-describedby` warnings (the dialog's `DialogDescription` doubles as its
accessible description).

Run: `pnpm --filter @brynzit/console test`
