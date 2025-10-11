# UI Structure & Conventions

## App Router layout
- `app/layout.tsx` – global layout, font, theme
- `app/page.tsx` – main chat screen
- `app/api/.../route.ts` – API handlers

## Components (suggested)
- `components/ThreadTray.tsx`
- `components/ThreadItem.tsx`
- `components/Transcript.tsx`
- `components/MessageBubble.tsx`
- `components/ModelSelector.tsx`
- `components/ChatComposer.tsx`

## Data flow
- Fetch threads/messages via client fetch (SWR) or server components + hydrate
- SSE on send: append `user` message immediately, stream `assistant` bubble

## Selectors (must keep)
- See `docs/ui/selectors.md`; do not change `data-testid` strings.

## Accessibility
- Roles/labels per `docs/ui/selectors.md` (log, alert, nav, main)
