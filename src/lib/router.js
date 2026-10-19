// Minimal hash router: works on any static host (Netlify, GitHub Pages) with no
// server rewrites, and keeps the back button working.
import { useSyncExternalStore } from "react";

export function parseRoute(hash = window.location.hash) {
  const raw = hash.replace(/^#/, "") || "/";
  const [path, qs = ""] = raw.split("?");
  const parts = path.split("/").filter(Boolean);
  const query = Object.fromEntries(new URLSearchParams(qs));
  const name = parts[0] || "landing";
  return { name, param: parts[1] || "", query, path: raw };
}

export function navigate(path, query) {
  const qs = query ? `?${new URLSearchParams(query)}` : "";
  window.location.hash = `#${path}${qs}`;
}

let current = typeof window !== "undefined" ? parseRoute() : { name: "landing", param: "", query: {} };
const subscribe = (cb) => {
  const on = () => {
    current = parseRoute();
    cb();
  };
  window.addEventListener("hashchange", on);
  return () => window.removeEventListener("hashchange", on);
};

export function useRoute() {
  return useSyncExternalStore(subscribe, () => current);
}

export const topicHref = (url, title) => `#/topic?${new URLSearchParams({ u: url, t: title })}`;
export const openTopic = (url, title) => navigate("/topic", { u: url, t: title });
