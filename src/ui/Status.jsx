import { H } from "./H.jsx";

/** Loading placeholder in the template's card style. */
export function Loading({ label = "Loading…", height = "180px", lines = 3 }) {
  return (
    <div role="status" aria-live="polite" style={{ background: "#FFFEFB", border: "1px solid #E2E8E0", borderRadius: "24px", padding: "24px", minHeight: height, display: "flex", flexDirection: "column", gap: "12px" }}>
      <span style={{ position: "absolute", left: "-9999px" }}>{label}</span>
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} aria-hidden="true" style={{ height: i === 0 ? "22px" : "14px", width: i === 0 ? "45%" : `${90 - i * 12}%`, borderRadius: "8px", background: "#EEF2EC", animation: "cbPulse 1.4s ease-in-out infinite" }}></span>
      ))}
    </div>
  );
}

/** Error card with retry and an external fallback link. */
export function ErrorCard({ title = "We couldn’t load this right now.", message, onRetry, fallbackHref, fallbackLabel = "Open MedlinePlus instead ↗" }) {
  return (
    <div role="alert" style={{ background: "#F7E7E0", borderRadius: "24px", padding: "28px", display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start" }}>
      <p style={{ margin: 0, fontSize: "19px", fontWeight: "600", color: "#5C2E20" }}>{title}</p>
      {message && <p style={{ margin: 0, color: "#5C2E20" }}>{message}</p>}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "8px" }}>
        {onRetry && (
          <H as="button" onClick={onRetry} style={{ background: "#254D43", color: "#FAF9F6", border: "none", borderRadius: "999px", padding: "11px 18px", fontWeight: "600", cursor: "pointer" }} hover={{ background: "#1B3B33" }}>
            Try again
          </H>
        )}
        {fallbackHref && (
          <a href={fallbackHref} target="_blank" rel="noopener noreferrer" style={{ alignSelf: "center", fontWeight: "600" }}>
            {fallbackLabel}
          </a>
        )}
      </div>
    </div>
  );
}

export function SourceLine({ org, url, title, retrievedAt, lang = "en" }) {
  const date = retrievedAt ? new Date(retrievedAt).toLocaleDateString(lang === "es" ? "es-US" : "en-US", { year: "numeric", month: "short", day: "numeric" }) : null;
  return (
    <p style={{ margin: 0, fontSize: "13.5px", color: "#55635E", display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "11.5px", letterSpacing: ".05em", color: "#3F6E6A" }}>{lang === "es" ? "FUENTE" : "SOURCE"}</span>
      <a href={url} target="_blank" rel="noopener noreferrer">
        {title ? `${title} · ${org}` : org} ↗
      </a>
      {date && <span>· {lang === "es" ? "consultado" : "retrieved"} {date}</span>}
    </p>
  );
}
