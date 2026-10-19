import { useEffect, useState } from "react";
import { getTopic } from "../services/api.js";
import { FEATURED_TOPICS, PROCEDURES, slugOf } from "../content/catalog.js";

const counterpart = (url, lang) => {
  const slug = url.split("/").pop();
  return lang === "es" ? `https://medlineplus.gov/spanish/${slug}` : `https://medlineplus.gov/${slug}`;
};

/** Title in the requested language when the topic is in our catalog. */
function titleFor(url, fallback, lang) {
  const slug = slugOf(url);
  const hit = FEATURED_TOPICS.find((f) => f.slug === slug) || PROCEDURES.find((p) => slugOf(p.url.en) === slug);
  return hit?.title?.[lang] || fallback;
}

/**
 * Load a MedlinePlus topic in the user's language. If MedlinePlus has no page
 * in that language, fall back to the original and flag it (`langMissing`).
 */
export function useTopic(url, title, lang) {
  const [state, setState] = useState({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!url) {
      setState({ status: "error", message: "No topic selected." });
      return;
    }
    let cancelled = false;
    setState((s) => (s.status === "done" ? { ...s, refreshing: true } : { status: "loading" }));
    const wanted = counterpart(url, lang);
    const wantedTitle = titleFor(url, title, lang);
    (async () => {
      try {
        const data = await getTopic(wanted, wantedTitle).catch(async (e) => {
          if (wanted === url || e.code !== "not_found") throw e;
          const d = await getTopic(url, title);
          return { ...d, langMissing: true };
        });
        if (!cancelled) setState({ status: "done", ...data });
      } catch (e) {
        if (!cancelled) setState({ status: "error", message: e.message, code: e.code });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, title, lang, attempt]);

  return { ...state, retry: () => setAttempt((n) => n + 1) };
}
