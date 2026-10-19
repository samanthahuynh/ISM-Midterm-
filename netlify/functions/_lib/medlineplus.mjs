// MedlinePlus Web Service client + parser (server-side only).
// Docs: https://medlineplus.gov/about/developers/webservices/
// NLM asks callers to stay under 85 requests/minute per IP; responses are
// cached at the Netlify CDN (see the functions) to keep us well below that.

export const WSEARCH_URL = "https://wsearch.nlm.nih.gov/ws/query";
const TOPIC_URL_RE = /^https:\/\/medlineplus\.gov\/(spanish\/)?[a-z0-9_-]+\.html$/;

export function dbFor(lang) {
  return lang === "es" ? "healthTopicsSpanish" : "healthTopics";
}

export function isTopicUrl(url) {
  return typeof url === "string" && TOPIC_URL_RE.test(url);
}

export function langOfUrl(url) {
  return url.includes("medlineplus.gov/spanish/") ? "es" : "en";
}

/** English <-> Spanish topic URLs share the same slug on MedlinePlus. */
export function counterpartUrl(url, lang) {
  const slug = url.split("/").pop();
  return lang === "es" ? `https://medlineplus.gov/spanish/${slug}` : `https://medlineplus.gov/${slug}`;
}

const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…", eacute: "é", aacute: "á", iacute: "í", oacute: "ó", uacute: "ú", ntilde: "ñ", uuml: "ü", iexcl: "¡", iquest: "¿", Eacute: "É", Aacute: "Á", Iacute: "Í", Oacute: "Ó", Uacute: "Ú", Ntilde: "Ñ", reg: "®", copy: "©", deg: "°" };

export function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") {
      const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return NAMED[e] ?? m;
  });
}

const clean = (s) => s.replace(/\s+/g, " ").trim();
const stripTags = (html) => clean(decodeEntities(html.replace(/<[^>]*>/g, " ")));

/** Parse the XML returned by wsearch into plain documents. */
export function parseSearchXml(xml) {
  const count = Number((xml.match(/<count>(\d+)<\/count>/) || [])[1] || 0);
  const docs = [];
  const docRe = /<document[^>]*\burl="([^"]+)"[^>]*>([\s\S]*?)<\/document>/g;
  let m;
  while ((m = docRe.exec(xml))) {
    const fields = {};
    const cRe = /<content name="([^"]+)">([\s\S]*?)<\/content>/g;
    let c;
    while ((c = cRe.exec(m[2]))) {
      // Content is XML-escaped HTML; unescape once to get the HTML, then drop
      // the search-highlight <span class="qtN"> wrappers.
      const html = decodeEntities(c[2]).replace(/<\/?span[^>]*>/gi, "");
      (fields[c[1]] ||= []).push(html);
    }
    docs.push({
      url: decodeEntities(m[1]),
      title: stripTags((fields.title || [""])[0]),
      altTitles: (fields.altTitle || []).map(stripTags).filter(Boolean),
      groups: (fields.groupName || []).map(stripTags).filter(Boolean),
      organization: stripTags((fields.organizationName || [""])[0]),
      snippet: stripTags((fields.snippet || [""])[0]).replace(/\s*\.\.\.\s*$/, "…"),
      summaryHtml: (fields.FullSummary || [""])[0],
    });
  }
  return { count, docs };
}

/**
 * Turn a FullSummary HTML fragment into structured, text-only sections so the
 * browser never renders third-party HTML. Top-level bare text is a heading
 * (MedlinePlus writes headings like "What causes X?" as loose text).
 *   sections: [{ heading: string|null, blocks: [{type:"p", text} | {type:"list", ordered, items:[{text, children}]}] }]
 */
export function summaryToSections(html) {
  const tokens = html.match(/<\/?[a-zA-Z][^>]*>|[^<]+/g) || [];
  const sections = [{ heading: null, blocks: [] }];
  const cur = () => sections[sections.length - 1];
  let para = null; // open paragraph text
  const listStack = []; // open lists: {type, ordered, items}
  let headingBuf = "";

  const flushHeading = () => {
    const h = clean(headingBuf);
    headingBuf = "";
    if (!h) return;
    if (!cur().heading && cur().blocks.length === 0) cur().heading = h;
    else sections.push({ heading: h, blocks: [] });
  };
  const currentItem = () => {
    const list = listStack[listStack.length - 1];
    return list && list.items[list.items.length - 1];
  };
  const addText = (text) => {
    if (para) para.text += text;
    else if (listStack.length) {
      let item = currentItem();
      if (!item || item.closed) {
        if (!clean(text)) return;
        item = { text: "", children: [] };
        listStack[listStack.length - 1].items.push(item);
      }
      item.text += text;
    } else headingBuf += text;
  };

  for (const tok of tokens) {
    if (tok[0] !== "<") {
      addText(decodeEntities(tok));
      continue;
    }
    const close = tok[1] === "/";
    const tag = (tok.match(/^<\/?([a-zA-Z0-9]+)/) || [])[1]?.toLowerCase();
    if (tag === "p") {
      if (!close) {
        flushHeading();
        if (!listStack.length) para = { type: "p", text: "" };
      } else if (para) {
        para.text = clean(para.text);
        if (para.text) cur().blocks.push(para);
        para = null;
      }
    } else if (tag === "ul" || tag === "ol") {
      if (!close) {
        flushHeading();
        const list = { type: "list", ordered: tag === "ol", items: [] };
        const parentItem = currentItem();
        if (listStack.length) {
          // Nested list: attach to the last item (MedlinePlus sometimes puts the
          // nested <ul> as a sibling of the <li> rather than inside it).
          if (parentItem) parentItem.children.push(list);
          else listStack[listStack.length - 1].items.push({ text: "", children: [list] });
        } else cur().blocks.push(list);
        listStack.push(list);
      } else if (listStack.length) {
        listStack.pop();
      }
    } else if (tag === "li") {
      const list = listStack[listStack.length - 1];
      if (!list) continue;
      if (!close) list.items.push({ text: "", children: [] });
      else {
        const item = currentItem();
        if (item) item.closed = true;
      }
    } else if (tag === "br") {
      addText(" ");
    }
    // Any other tag (a, em, strong, span...) is dropped; its text is kept.
  }
  flushHeading();
  if (para && clean(para.text)) cur().blocks.push({ type: "p", text: clean(para.text) });

  const tidyList = (list) => ({
    type: "list",
    ordered: list.ordered,
    items: list.items
      .map((it) => ({ text: clean(it.text), children: it.children.map(tidyList) }))
      .filter((it) => it.text || it.children.length),
  });
  return sections
    .map((s) => ({ heading: s.heading, blocks: s.blocks.map((b) => (b.type === "list" ? tidyList(b) : b)) }))
    .filter((s) => s.heading || s.blocks.length);
}

export async function wsearch(term, lang, retmax = 20, fetchImpl = fetch) {
  const params = new URLSearchParams({ db: dbFor(lang), term, retmax: String(retmax) });
  const res = await fetchImpl(`${WSEARCH_URL}?${params}`, {
    headers: { Accept: "application/xml", "User-Agent": "CareBridge-prototype (education project)" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`MedlinePlus responded ${res.status}`);
  return parseSearchXml(await res.text());
}

/** Plain-text version of a topic's summary, used to ground the AI route. */
export function sectionsToText(sections) {
  const listText = (list, depth = 0) =>
    list.items
      .map((it) => `${"  ".repeat(depth)}- ${it.text}\n${it.children.map((c) => listText(c, depth + 1)).join("")}`)
      .join("");
  return sections
    .map((s) => [s.heading ? `## ${s.heading}` : "", ...s.blocks.map((b) => (b.type === "p" ? b.text : listText(b)))].filter(Boolean).join("\n"))
    .join("\n\n");
}

/**
 * Fetch one health topic by its MedlinePlus URL. The Web Service has no
 * get-by-id call, so we search by title and match the URL exactly.
 */
export async function fetchTopic(url, title, fetchImpl = fetch) {
  const lang = langOfUrl(url);
  const terms = [title, title.replace(/[^\p{L}\p{N}\s]/gu, " ")].map(clean).filter(Boolean);
  for (const term of [...new Set(terms)]) {
    const { docs } = await wsearch(term, lang, 25, fetchImpl);
    const doc = docs.find((d) => d.url === url);
    if (doc) {
      const { summaryHtml, ...rest } = doc;
      const { sections, contributors } = splitContributors(summaryToSections(summaryHtml));
      return { ...rest, lang, sections, contributors };
    }
  }
  return null;
}

/**
 * MedlinePlus ends some summaries with the contributing agency, e.g.
 * "NIH: National Institute of Diabetes and Digestive and Kidney Diseases".
 * Pull those lines out so they show as attribution, not body text.
 */
export function splitContributors(sections) {
  const contributors = [];
  const isCredit = (b) => b.type === "p" && b.text.length < 160 && /^(NIH|CDC|FDA|AHRQ|HHS|NLM|CMS|NCI|VA|USDA)\b[^:]{0,20}:/.test(b.text);
  const out = sections.map((s) => ({ ...s, blocks: s.blocks.filter((b) => (isCredit(b) ? (contributors.push(b.text), false) : true)) }));
  return { sections: out.filter((s) => s.heading || s.blocks.length), contributors };
}
