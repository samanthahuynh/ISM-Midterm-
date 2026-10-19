// Translation provider interface.
//
// Today CareBridge uses prepared strings (strings.js) and MedlinePlus's own
// Spanish edition. Later, a machine-translation provider (Google Cloud
// Translation, called through the server route /api/translate so the key
// never reaches the browser) can be added behind the same interface.
//
// Every provider returns { text, reviewed } so the UI can label anything that
// has not been reviewed by a qualified medical translator.

import { STRINGS } from "./strings.js";

export const SUPPORTED_LANGS = ["en", "es"];

/** Prepared, human-written strings. Always `reviewed: false` until sign-off is recorded. */
export const preparedProvider = {
  id: "prepared",
  strings(lang) {
    return STRINGS[lang] || STRINGS.en;
  },
  async translate(text) {
    return { text, reviewed: false, provider: "prepared" };
  },
};

/**
 * PLANNED: Google Cloud Translation via /api/translate (currently returns 501).
 * Not used by the app yet. Kept here so wiring it up is a one-line change in
 * activeProvider below, after a medical translation review workflow exists.
 */
export const googleProvider = {
  id: "google",
  strings(lang) {
    return STRINGS[lang] || STRINGS.en;
  },
  async translate(text, { from = "en", to = "es" } = {}) {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, from, to }),
    });
    if (!res.ok) throw new Error("Machine translation is not enabled.");
    const data = await res.json();
    return { text: data.text, reviewed: false, provider: "google" };
  },
};

export const activeProvider = preparedProvider;
