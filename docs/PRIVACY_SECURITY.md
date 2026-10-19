# Privacy and security notes

CareBridge is a student prototype for patient education and visit
preparation. **It has not been assessed for HIPAA compliance, and it should not
be described as HIPAA compliant.** Use fictional data when demoing it.

## What the app does with data

| Data | Where it lives | Sent anywhere? |
|---|---|---|
| Appointment details, concerns, timeline, questions, notes | The browser's `localStorage`, on that device only | No |
| Saved topics and procedures | `localStorage` (URL and title only) | No |
| Health history: diagnoses, tests, results and notes the user types | `localStorage` only | No. Only the name typed in the search box goes to MedlinePlus to find a match, and only the matched page's URL or lab code is used afterwards |
| Search words typed in the library | Sent to CareBridge's `/api/medlineplus`, which forwards them to the NLM search service | Yes, to NLM, with no identity attached |
| A medical word for "Explain in simpler words" (if AI is on) | `/api/ai` → Anthropic | Yes, only the screened word |
| Topic URL for "Explain the whole topic in simpler words" (if AI is on) | `/api/ai`. The server fetches the MedlinePlus text and sends it to Anthropic | Yes, no user text |

"Delete all data" on the Notebook page clears local storage and session
storage, which includes the AI answer cache.

The app does not diagnose anything. It shows MedlinePlus content and organizes
only the information the user chooses to enter.

## Security measures in place

- **No secrets in the frontend.** API keys are read only inside Netlify
  Functions. `.env` is git-ignored, and only `.env.example` is committed.
- **Content Security Policy** in `netlify.toml`: scripts only from the site
  itself, `connect-src 'self'`, no framing (`frame-ancestors 'none'`), plus HSTS,
  `nosniff`, a strict referrer policy and a locked-down Permissions-Policy.
- **No third-party HTML.** MedlinePlus summaries are parsed on the server into
  plain text blocks. React renders text only, and the app never uses
  `dangerouslySetInnerHTML`.
- **Input validation** on every function: length limits, allowed MedlinePlus
  URL pattern, and the letters-only term filter for AI.
- **Rate limits.** The AI route is limited per IP. MedlinePlus responses are
  cached by Netlify's CDN for a day, which keeps traffic under NLM's guideline of
  85 requests per minute.
- **Same-origin check** on the AI POST route.

## Results are never interpreted

The health history shows what MedlinePlus says a test checks and what results can
mean in general, next to the user's own result exactly as they typed it, labeled
"Not checked by CareBridge". The app never compares a value to a range, flags
anything as normal or abnormal, or sends the value anywhere.

## Known limits (prototype)

- `localStorage` is not encrypted, and anyone using the same browser profile can
  read it. The app tells users not to enter real personal health information.
- Rate limits are per function instance, not global.
- There are no accounts yet. See [SUPABASE_PLAN.md](SUPABASE_PLAN.md) for what
  has to happen before server storage.

## Before any real-patient use

- A privacy and security assessment, a HIPAA applicability decision, and BAAs
  with any vendor that would handle PHI.
- A clinical content review of every non-MedlinePlus string (question
  suggestions, checklists, tips).
- An accessibility audit (WCAG 2.2 AA) with assistive-technology users.
