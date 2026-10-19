// GET /api/medlineplus?q=<keywords>&lang=en|es         -> search results
// GET /api/medlineplus?url=<topic url>&title=<title>    -> one topic, structured
//
// A thin proxy so the browser never calls NLM directly: it validates input,
// returns text-only JSON (no third-party HTML), and lets Netlify's CDN cache
// responses so we stay well within NLM's 85 requests/minute guideline.
import { fetchTopic, isTopicUrl, summaryToSections, wsearch } from "./_lib/medlineplus.mjs";
import { CDN_CACHE, NO_STORE, json } from "./_lib/http.mjs";

export const config = { path: "/api/medlineplus" };

const MAX_TERM = 100;

export default async (req) => {
  if (req.method !== "GET") return json({ error: "method_not_allowed" }, 405, NO_STORE);
  const params = new URL(req.url).searchParams;
  const lang = params.get("lang") === "es" ? "es" : "en";
  const q = (params.get("q") || "").trim();
  const url = (params.get("url") || "").trim();
  const title = (params.get("title") || "").trim();

  try {
    if (url) {
      if (!isTopicUrl(url) || !title || title.length > MAX_TERM) {
        return json({ error: "bad_request", message: "A MedlinePlus topic URL and title are required." }, 400, NO_STORE);
      }
      const topic = await fetchTopic(url, title);
      if (!topic) return json({ error: "not_found", message: "That topic wasn't found on MedlinePlus." }, 404, NO_STORE);
      return json({ topic, source: sourceInfo(topic.lang), retrievedAt: new Date().toISOString() }, 200, CDN_CACHE);
    }

    if (!q || q.length < 2 || q.length > MAX_TERM) {
      return json({ error: "bad_request", message: "Enter 2 to 100 characters to search." }, 400, NO_STORE);
    }
    const { count, docs } = await wsearch(q, lang, 20);
    // `lead` is the summary's first paragraph, shown as-is with attribution.
    const results = docs.map(({ summaryHtml, ...d }) => ({ ...d, lead: firstParagraph(summaryHtml) }));
    return json({ query: q, lang, count, results, source: sourceInfo(lang), retrievedAt: new Date().toISOString() }, 200, CDN_CACHE);
  } catch (err) {
    console.error("medlineplus proxy error", err?.message);
    return json({ error: "upstream_unavailable", message: "MedlinePlus couldn't be reached. Please try again." }, 502, NO_STORE);
  }
};

function sourceInfo(lang) {
  return lang === "es"
    ? { name: "MedlinePlus en español", publisher: "Biblioteca Nacional de Medicina de EE. UU.", url: "https://medlineplus.gov/spanish/" }
    : { name: "MedlinePlus", publisher: "U.S. National Library of Medicine", url: "https://medlineplus.gov/" };
}

function firstParagraph(html) {
  for (const section of summaryToSections(html)) {
    const p = section.blocks.find((b) => b.type === "p");
    if (p) return p.text;
  }
  return "";
}
