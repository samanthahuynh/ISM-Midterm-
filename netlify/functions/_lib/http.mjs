// Small helpers shared by the Netlify functions.

export function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}

/** Cache successful public, non-personal responses at Netlify's CDN. */
export const CDN_CACHE = {
  "Cache-Control": "public, max-age=300",
  "Netlify-CDN-Cache-Control": "public, durable, s-maxage=86400, stale-while-revalidate=604800",
};

export const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Best-effort, in-memory fixed-window rate limiter. It only protects a single
 * warm function instance; for real abuse protection put the AI route behind
 * auth (Supabase) and/or a shared store. Documented in docs/AI_PLAN.md.
 */
const windows = new Map();
export function rateLimited(key, limit, windowMs = 60 * 60 * 1000) {
  const now = Date.now();
  const w = windows.get(key);
  if (!w || now - w.start > windowMs) {
    windows.set(key, { start: now, count: 1 });
    return false;
  }
  w.count += 1;
  return w.count > limit;
}

export function clientIp(req, context) {
  return context?.ip || req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export function sameOrigin(req) {
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin GETs and server-to-server calls omit it
  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch {
    return false;
  }
}
