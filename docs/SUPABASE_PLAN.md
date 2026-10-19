# Supabase plan (authentication + storage)

**Status: planned, not active.** The prototype keeps all data in the browser's
`localStorage` and starts with a fictional demo profile ("Maya R."). Nothing is
sent to a database.

## Why wait

Storing appointments, symptoms and questions on a server turns CareBridge into
a system that holds health information. Before that happens the team should:

1. Finish the privacy review in [PRIVACY_SECURITY.md](PRIVACY_SECURITY.md)
   (what is collected, retention, deletion, who can access it).
2. Decide whether CareBridge would be a HIPAA covered entity or business
   associate. If yes, a Business Associate Agreement and a Supabase plan that
   supports HIPAA workloads are required. **This prototype makes no HIPAA claim.**
3. Keep using fictional data for demos and testing.

## Design

### Auth

- Supabase Auth with email magic link (no passwords to manage). Optional
  passkeys later.
- The browser uses only `VITE_SUPABASE_URL` and the **publishable anon key**.
  The service role key never goes in frontend code or in `VITE_*` variables.
- A guest mode stays available: the current local-only storage.

### Tables

See [`supabase/schema.sql`](../supabase/schema.sql).

| Table | Holds | Maps to local state |
|---|---|---|
| `profiles` | display name, preferences | `profile`, `prefs` |
| `appointments` | date, time, type, specialty, clinician, reason, concerns, timeline | `appointment` |
| `questions` | the current question list, with priority and order | `questions` |
| `question_lists` | saved snapshots of question lists | `questionLists` |
| `notebook_entries` | saved topics and procedures, visit sheets, visit notes, care-team notes, health history | `savedTopics`, `savedProcedures`, `visitSheets`, `visitNotes`, `careNotes`, `history` |

Every table has `user_id` and row level security that allows only
`auth.uid() = user_id`. Text columns have length limits that match the UI.

### Data minimization

- Ask for a display name only. No legal name, date of birth, address, insurance
  or record numbers.
- Saved topics store only the MedlinePlus URL and title. Health content is
  always fetched fresh from MedlinePlus, never copied into the database.
- "Delete my stored information" (Notebook page) becomes: delete all rows for
  the user, then sign out. Account deletion cascades through `on delete cascade`.

### Code changes when it's time

The app already reads and writes through one adapter with this contract
(`src/data/store.js`):

```js
adapter.load()  -> Promise<state>
adapter.save(state) -> Promise<boolean>
adapter.clear() -> Promise<void>
```

Steps:

1. `npm install @supabase/supabase-js` and add `src/data/supabaseAdapter.js`
   that implements `load/save/clear` by reading and upserting the tables above.
2. In `src/main.jsx`, call `initStore(supabaseAdapter)` when a user is signed in,
   and keep `initStore(localAdapter)` for guests.
3. Offer a one-time "copy my local notebook to my account" step on first sign-in.
4. Add `https://<project>.supabase.co` to `connect-src` in the CSP in
   `netlify.toml`.
5. Run Supabase's security advisor and confirm RLS is on for every table.
