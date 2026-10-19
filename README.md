# CareBridge

**Healthcare explained your way.** CareBridge is a student prototype that helps
patients understand health topics and prepare for appointments.

> **CareBridge does not diagnose anything and is not medical advice.** It shows
> health information from MedlinePlus (U.S. National Library of Medicine) and
> organizes only the information a user chooses to enter. In an emergency, call
> 911. This prototype has **not** been assessed for HIPAA compliance. Use
> fictional data.

## What works

| Area | What it does | Source |
|---|---|---|
| **Understand** (library) | Live keyword search of MedlinePlus health topics, category filters, featured topics, and a medical word lookup | MedlinePlus Web Service |
| **Topic pages** | Simple, Visual or Detailed views of the MedlinePlus summary, questions to ask, sources tab, save to Notebook | MedlinePlus (English and Spanish editions) |
| **My Visit** | 4 steps: appointment details, concerns in the user's own words, a question builder with priority and ordering, and a printable visit sheet (save as PDF) | User's own entries plus question prompts adapted from AHRQ and NIA |
| **Next Steps** | Procedure guides split into Before / Day of / After from MedlinePlus, logistics checklists, and a box for the user's own care-team instructions | MedlinePlus |
| **My health history** | Add past diagnoses and tests (saved in the browser only). Each one is matched to MedlinePlus to show what it is, the symptoms MedlinePlus lists, what a test checks and what results can mean **in general**, plus ready-made questions for the next visit. CareBridge never interprets a user's own result | MedlinePlus health topics + MedlinePlus Connect lab test guides |
| **Notebook** | Saved topics, guides, question lists, visit sheets and notes, plus "Delete all data" | Browser storage |
| **Accessibility** | Text size, reduce motion, higher contrast, reading level, English/Spanish | — |
| **AI (optional, off by default)** | "Explain in simpler words" for a medical word and a whole topic, grounded only in MedlinePlus text | Claude API, server side |

Every health fact on screen comes from MedlinePlus with a source link and the
date it was retrieved. CareBridge doesn't write its own medical content or
recovery timelines. If MedlinePlus doesn't cover a stage of a procedure, the
page says so and points the user to their care team.

## Use it on an iPhone

CareBridge works in Safari on iPhone and can be added to the Home Screen like an
app. Open the Netlify URL in Safari, tap **Share**, then **Add to Home Screen**.
It opens full screen with the CareBridge icon. There's no App Store version. A
native app would need Apple developer enrollment and review, which this
prototype doesn't require.

Every page was checked at iPhone SE, iPhone 14/15 and Pro Max widths (375, 390
and 430 px) in English and Spanish.

## Project layout

```
src/                     React app (Vite). UI ported from the CareBridge design template
  pages/                 Landing, Dashboard, Understand, Topic, Visit, Procedures, Procedure, Notebook
  content/               Featured topics, procedures, lab tests (LOINC codes), question prompts, About/Privacy/Sources text (en/es)
  data/store.js          Local storage adapter (same contract a Supabase adapter will use)
  data/demo.js           Fictional demo profile "Maya R."
  i18n/                  Prepared English/Spanish strings + translation provider interface
  services/api.js        Calls to the app's own /api routes (never to third parties directly)
netlify/functions/
  medlineplus.mjs        GET /api/medlineplus  MedlinePlus search, topic and lab-test proxy (no key needed)
  ai.mjs                 /api/ai               Optional Claude route (key stays on the server)
  translate.mjs          /api/translate        Placeholder for Google Cloud Translation (returns 501)
supabase/schema.sql      Planned tables with row level security (not active)
docs/                    AI, Supabase, translation and privacy/security plans
tests/                   Vitest tests for the MedlinePlus parser and AI guards
```

## Run it locally

Requires Node 20 or newer.

```bash
npm install
npm run dev           # app + /api routes at http://localhost:5173
npm test              # unit tests
npm run build         # production build into dist/
```

`npm run dev` serves the Netlify functions through Vite, so search and topic
pages call the real MedlinePlus service. You can also run `npx netlify dev`
(port 8888) to use the Netlify CLI.

To try the AI features locally, copy `.env.example` to `.env` and set
`AI_ENABLED=true` and `ANTHROPIC_API_KEY=...`. `.env` is git-ignored.

## Deploy: GitHub, then Netlify

1. **Push to GitHub.**
   ```bash
   git init && git add . && git commit -m "CareBridge prototype"
   git branch -M main
   git remote add origin https://github.com/<you>/carebridge.git
   git push -u origin main
   ```
   Check that `.env` is **not** in the commit (`git status` should not list it).
2. **Create the Netlify site.** In Netlify, choose *Add new site → Import an
   existing project → GitHub*, and pick the repo. `netlify.toml` already sets
   the build command (`npm run build`), the publish folder (`dist`), the
   functions folder and Node 22, so there's nothing to fill in.
3. **Environment variables** (*Site configuration → Environment variables*).
   None are needed for the MedlinePlus features. For AI:

   | Variable | Value |
   |---|---|
   | `AI_ENABLED` | `true` to turn AI on (anything else keeps it off) |
   | `ANTHROPIC_API_KEY` | Your key from console.anthropic.com. Mark it as a secret. |
   | `CLAUDE_MODEL` | Optional. Default `claude-opus-5-5`. Use `claude-haiku-5-5` to spend less. |
   | `AI_HOURLY_LIMIT` | Optional. Requests per IP per hour (default 20). |

   Never put a secret in a variable whose name starts with `VITE_`, because
   those are copied into the browser bundle.
4. **Deploy.** Every push to `main` redeploys. Pull requests get preview URLs.

## Cost

- Netlify's free tier covers the site and functions for a class project.
- MedlinePlus is free, needs no key, and Netlify's CDN caches responses for a
  day.
- Claude is pay-per-use and off by default. Answers are cached, requests are
  rate-limited, and you can set a monthly spend limit in the Anthropic Console.

## Integration status

| Integration | Status | Details |
|---|---|---|
| MedlinePlus Connect (lab tests) | **Live** | [`netlify/functions/_lib/labtests.mjs`](netlify/functions/_lib/labtests.mjs) |
| MedlinePlus Web Service | **Live** | [`netlify/functions/medlineplus.mjs`](netlify/functions/medlineplus.mjs) |
| Claude API | **Built, off by default** | [docs/AI_PLAN.md](docs/AI_PLAN.md) |
| Supabase | **Planned.** Uses local storage + fictional data today | [docs/SUPABASE_PLAN.md](docs/SUPABASE_PLAN.md), [supabase/schema.sql](supabase/schema.sql) |
| Translation | **Prepared EN/ES content + MedlinePlus en español.** Google Cloud Translation planned | [docs/TRANSLATION_PLAN.md](docs/TRANSLATION_PLAN.md) |
| Privacy & security | CSP, server-only keys, no PHI to AI, no HIPAA claim | [docs/PRIVACY_SECURITY.md](docs/PRIVACY_SECURITY.md) |

## Content sources

- [MedlinePlus](https://medlineplus.gov/) and [MedlinePlus en español](https://medlineplus.gov/spanish/),
  U.S. National Library of Medicine. Accessed through the
  [MedlinePlus Web Service](https://medlineplus.gov/about/developers/webservices/).
  Lab test guides come from [MedlinePlus Lab Tests](https://medlineplus.gov/lab-tests/) through
  [MedlinePlus Connect](https://medlineplus.gov/medlineplus-connect/web-service/).
  CareBridge is not affiliated with or endorsed by NLM.
- Question prompts adapted from AHRQ's *Questions Are the Answer* and the
  National Institute on Aging's guidance on talking with your doctor.

Spanish interface text was written for this prototype and has not had a
professional medical translation review.
