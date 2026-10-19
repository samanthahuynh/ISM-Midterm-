// Renders MedlinePlus content (already reduced to text-only blocks by the
// server) in the template's type styles. No third-party HTML is injected.

function List({ list, dot = "#A8BFA8", size = "16.5px", depth = 0 }) {
  const Tag = list.ordered ? "ol" : "ul";
  return (
    <Tag style={{ listStyle: "none", margin: depth ? "8px 0 0" : 0, padding: 0, display: "flex", flexDirection: "column", gap: depth ? "6px" : "10px" }}>
      {list.items.map((it, i) => (
        <li key={i} style={{ display: "flex", gap: "12px", fontSize: depth ? "15.5px" : size }}>
          <span style={{ width: depth ? "7px" : "10px", height: depth ? "7px" : "10px", borderRadius: "50%", background: depth ? "transparent" : dot, border: depth ? `1.5px solid ${dot}` : "none", flex: "none", marginTop: depth ? "9px" : "8px" }}></span>
          <span style={{ flex: 1, minWidth: 0 }}>
            {it.text}
            {it.children.map((c, j) => (
              <List key={j} list={c} dot={dot} size={size} depth={depth + 1} />
            ))}
          </span>
        </li>
      ))}
    </Tag>
  );
}

export function Blocks({ blocks, dot, size = "17px", color = "#27332F", gap = "14px" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap, maxWidth: "720px" }}>
      {blocks.map((b, i) =>
        b.type === "h" ? (
          <h3 key={i} style={{ margin: i ? "8px 0 0" : 0, fontSize: "17px", fontWeight: "600", color: "#254D43", letterSpacing: "-.01em" }}>
            {b.text}
          </h3>
        ) : b.type === "p" ? (
          <p key={i} style={{ margin: 0, fontSize: size, lineHeight: "1.6", color, textWrap: "pretty" }}>
            {b.text}
          </p>
        ) : (
          <List key={i} list={b} dot={dot} />
        ),
      )}
    </div>
  );
}

/** First sentence(s) of a paragraph, up to roughly `max` characters. */
export function lead(text = "", max = 220) {
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
  let out = "";
  for (const s of sentences) {
    if (out && (out + s).length > max) break;
    out += s;
  }
  return out.trim();
}
