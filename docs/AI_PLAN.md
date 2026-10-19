# Claude API plan

**Status: built, off by default.** The route `netlify/functions/ai.mjs` works,
but it returns `503 ai_disabled` until `AI_ENABLED=true` and `ANTHROPIC_API_KEY`
are set in Netlify. With AI off, every page still works and the AI buttons are
hidden.

## What it does today

| Task | Where | What is sent to Claude |
|---|---|---|
| `simplify` | Topic page, Simple level: "Explain the whole topic in simpler words (AI)" | The MedlinePlus topic text, which **the server fetches itself** from the topic URL. The browser only sends the URL and title. |
| `simplify` (lab test) | Health history, a test card: "Explain in simpler words (AI)" | The MedlinePlus lab test guide, which the server fetches from MedlinePlus Connect using only the test's LOINC code. The user's result, notes and the name they typed are never sent. |
| `explain` | Understand page, medical words: "Explain in simpler words" | The word the user typed (screened: letters only, ≤ 5 words, ≤ 60 characters) plus the top MedlinePlus result text for that word. |

Both answers appear with a label saying the text was written by AI from the
MedlinePlus text only, can make mistakes, and should be checked with the care
team. The MedlinePlus source link is always shown next to it.

## Guardrails

- **Grounded in an approved source.** Claude gets the MedlinePlus text in a
  `<source>` block and is told to use only that text. If the source doesn't
  define the word, it must answer `NO_SOURCE_DEFINITION`. The route then returns `404`, and the app
  shows an error message instead of an answer.
- **No diagnosis or personal advice.** The system prompt forbids diagnosing,
  recommending treatments or doses, and saying what the reader should do.
- **No patient data.** Nothing the user writes about themselves (concerns,
  timeline, notes, questions) is ever sent. The only user-typed text is a short
  medical word that passes a strict letters-only filter.
- **Prompt injection.** The source is labeled as data, and user text never
  enters the system prompt.
- **Refusals and failures.** A refusal returns `422`, a cut-off answer returns
  `502`, and rate limits and auth errors map to clear messages. The original
  MedlinePlus text is always still on the page.
- **Keys.** `ANTHROPIC_API_KEY` is read only in the Netlify function. It is
  never in `VITE_*` variables or the browser bundle.
- **Same-origin only.** `POST /api/ai` rejects requests whose `Origin` doesn't
  match the site.

## Cost controls

- `CLAUDE_MODEL` defaults to `claude-opus-5-5`. Set it to `claude-haiku-5-5`
  for a much cheaper class demo.
- `effort: "low"` and `max_tokens: 4000`. Outputs are short plain text.
- Answers are cached per topic, language and task, in the function instance
  and in the browser session, so repeat clicks are free.
- `AI_HOURLY_LIMIT` (default 20) caps requests per IP per hour. This limit
  lives in memory per function instance, so it is best effort. For a public
  launch, move it to a shared store (Netlify Blobs or Supabase).
- Also set a monthly spend limit in the Anthropic Console.

## Planned, not built

- **Organize my questions** (group the user's questions by theme). This would
  send the user's own free text to an AI service, which this prototype rules
  out. Ordering stays local: priority first, then drag/arrow reordering. Revisit
  only after the privacy review, with an explicit opt-in and a de-identification
  check.
- **Evaluation set.** Before turning AI on for real users, have clinicians
  review around 50 sample outputs (simplify and explain, English and Spanish)
  for accuracy against the source, reading level, and any advice-giving.
