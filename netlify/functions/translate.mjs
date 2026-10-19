// POST /api/translate — PLANNED, NOT ACTIVE.
//
// Placeholder for Google Cloud Translation so the frontend's TranslationProvider
// interface (src/i18n/translation.js) has a server-side home. It deliberately
// returns 501 until a medical translation review workflow exists: machine
// translation of health content must be reviewed by qualified medical
// translators before patients see it. See docs/TRANSLATION_PLAN.md.
import { NO_STORE, json } from "./_lib/http.mjs";

export const config = { path: "/api/translate" };

export default async () =>
  json(
    {
      error: "not_implemented",
      message: "Machine translation is not enabled in this prototype. Prepared English and Spanish content is used instead.",
    },
    501,
    NO_STORE,
  );
