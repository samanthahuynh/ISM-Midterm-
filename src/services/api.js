// Browser-side clients for CareBridge's own server routes. The browser never
// calls MedlinePlus or Anthropic directly and never holds an API key.

const topicCache = new Map();

async function getJson(url, options) {
  let res;
  try {
    res = await fetch(url, options);
  } catch {
    throw new ApiError("offline", "You seem to be offline. Check your connection and try again.");
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON (e.g. the route isn't deployed) */
  }
  if (!res.ok) {
    throw new ApiError(data?.error || `http_${res.status}`, data?.message || "Something went wrong. Please try again.", res.status);
  }
  if (!data) throw new ApiError("bad_response", "Something went wrong. Please try again.");
  return data;
}

export class ApiError extends Error {
  constructor(code, message, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function searchTopics(q, lang, { signal } = {}) {
  const params = new URLSearchParams({ q, lang });
  return getJson(`/api/medlineplus?${params}`, { signal });
}

export async function getTopic(url, title) {
  const key = url;
  if (topicCache.has(key)) return topicCache.get(key);
  const p = getJson(`/api/medlineplus?${new URLSearchParams({ url, title })}`).catch((e) => {
    topicCache.delete(key);
    throw e;
  });
  topicCache.set(key, p);
  return p;
}

/** A MedlinePlus lab test guide, by LOINC code. */
export async function getLabTest(loinc, lang) {
  const key = `loinc:${loinc}:${lang}`;
  if (topicCache.has(key)) return topicCache.get(key);
  const p = getJson(`/api/medlineplus?${new URLSearchParams({ loinc, lang })}`).catch((e) => {
    topicCache.delete(key);
    throw e;
  });
  topicCache.set(key, p);
  return p;
}

let aiStatus;
export function getAiStatus() {
  aiStatus ||= getJson("/api/ai").catch(() => ({ enabled: false }));
  return aiStatus;
}

const AI_CACHE_KEY = "carebridge:ai-cache";
function readAiCache() {
  try {
    return JSON.parse(sessionStorage.getItem(AI_CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

/**
 * Ask the server to simplify a MedlinePlus topic or explain a term.
 * Only a topic URL/title or a short term is sent: never anything the user typed
 * about themselves.
 */
export async function askAi(payload) {
  const key = JSON.stringify(payload);
  const cache = readAiCache();
  if (cache[key]) return cache[key];
  const data = await getJson("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  try {
    sessionStorage.setItem(AI_CACHE_KEY, JSON.stringify({ ...cache, [key]: data }));
  } catch {
    /* ignore */
  }
  return data;
}
