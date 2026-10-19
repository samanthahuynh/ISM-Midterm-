# Translation plan

**Status: English and Spanish prepared content. Machine translation is planned, not active.**

## Today

- **Interface text** (navigation, buttons, notices, question suggestions) comes
  from prepared strings in `src/i18n/strings.js` and the `en`/`es` objects in
  `src/content/*.js`.
- **Health topics in Spanish** come from **MedlinePlus en español**
  (`db=healthTopicsSpanish`), which NLM writes and reviews. CareBridge does not
  translate medical content itself. When a topic has no Spanish page, the page
  shows the English version and says so.
- Spanish UI strings were written for this prototype and **have not had a
  professional medical translation review**. The Accessibility panel says this.

## Adding Google Cloud Translation later

The code already has a provider interface (`src/i18n/translation.js`):

```js
provider.strings(lang)                  // prepared UI strings
provider.translate(text, { from, to })  // -> { text, reviewed, provider }
```

Steps:

1. Implement `netlify/functions/translate.mjs` (it returns `501` today). Call
   the Cloud Translation API from the server with `GOOGLE_TRANSLATE_API_KEY`,
   restricted to that API. Use a glossary for medical terms.
2. Switch `activeProvider` to `googleProvider`.
3. Show every machine-translated string with a "Machine translated, not yet
   reviewed" label until a reviewer approves it (`reviewed: true`).
4. Only translate CareBridge's own text. Do **not** machine-translate
   MedlinePlus content when NLM already has a reviewed version.
5. Never send user-entered notes to the translation service.

## Medical translation review

Before any translated text is called final:

- A qualified medical translator (ideally ATA-certified, with healthcare
  experience) reviews it.
- A bilingual clinician checks the meaning of anything health-related.
- Record who reviewed what and when, and store `reviewed: true` only for
  approved strings.
