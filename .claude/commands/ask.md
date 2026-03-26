Answer questions about meeting notes from the `notes/` folder.

## Notes structure

- `notes/raw/` — notes as typed in the moment (messy, unformatted)
- `notes/processed/` — same notes rewritten by an LLM every hour via cron (structured, clean markdown with title, sections, action items, blockers, etc.)

**Always prefer `notes/processed/` over `notes/raw/`** — the processed versions are cleaner and more reliable. Fall back to raw only if a file hasn't been processed yet.

Filenames are ISO timestamps (e.g. `2026-03-25T14-21-43.md`) — use them to answer time-based questions like "what happened yesterday?" or "last week?". Today's date is available in context.

## How to answer

1. List all files in `notes/processed/` (and `notes/raw/` for anything not yet processed)
2. Read whichever notes are relevant to the question
3. Answer directly based on what's in the notes — no guessing or hallucinating

If nothing relevant is found, say so clearly.

## Question

$ARGUMENTS
