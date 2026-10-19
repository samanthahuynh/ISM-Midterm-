// MedlinePlus Connect client for lab test guides (server-side only).
// Docs: https://medlineplus.gov/medlineplus-connect/web-service/
//
// Connect takes a standard code (here LOINC, the code labs use for tests) and
// returns the matching MedlinePlus pages. Lab-test pages come back as plain
// text with question headings ("What do the results mean?"); health-topic
// pages come back as HTML. Both are reduced to the same text-only sections
// the rest of the app uses.

import { decodeEntities, splitContributors, summaryToSections } from "./medlineplus.mjs";

export const CONNECT_URL = "https://connect.medlineplus.gov/service";
const LOINC_OID = "2.16.840.1.113883.6.1";
const LOINC_RE = /^\d{1,7}-\d$/;
const LAB_PATH_RE = /^https:\/\/medlineplus\.gov\/(lab-tests|spanish\/pruebas-de-laboratorio)\/[a-z0-9-]+\/?$/;
const TOPIC_PATH_RE = /^https:\/\/medlineplus\.gov\/(spanish\/)?[a-z0-9_-]+\.html$/;

export const isLoinc = (code) => typeof code === "string" && LOINC_RE.test(code);

const STOP_LINE = /^(References|Referencias)$/;
const SKIP_LINE = /^(Learn more about laboratory tests|Más información sobre (las )?pruebas de laboratorio)/i;
const OTHER_NAMES = /^(Other names|Otros nombres):\s*/i;

/**
 * Parse a lab-test summary (plain text) into sections.
 * MedlinePlus writes headings as questions on their own line ("…test?\n"),
 * sometimes glued to the end of the previous paragraph ("…hemoglobinWhat is it
 * used for?"). A run of lines after a blank line that follows a line ending in
 * ":" is a list.
 */
export function labTextToSections(text) {
  const sections = [{ heading: null, blocks: [] }];
  const altTitles = [];
  const cur = () => sections[sections.length - 1];
  const addHeading = (h) => sections.push({ heading: h, blocks: [] });
  let listMode = false;
  let prevLine = "";
  let blankBefore = false;

  const pushText = (t) => {
    const line = t.replace(/\s+/g, " ").trim();
    if (!line || SKIP_LINE.test(line)) return;
    if (OTHER_NAMES.test(line)) {
      altTitles.push(...line.replace(OTHER_NAMES, "").split(/,\s*/).filter(Boolean));
      return;
    }
    const blocks = cur().blocks;
    const last = blocks[blocks.length - 1];
    if (listMode) {
      if (last?.type === "list") last.items.push({ text: line, children: [] });
      else blocks.push({ type: "list", ordered: false, items: [{ text: line, children: [] }] });
    } else {
      blocks.push({ type: "p", text: line });
    }
  };

  const lines = decodeEntities(text).replace(/\r/g, "").split("\n");
  for (const raw of lines) {
    let line = raw.replace(/\u00a0/g, " ").trim();
    if (!line) {
      blankBefore = true;
      continue;
    }
    // "…prediabetes.References" ends the content.
    const ref = line.match(/^(.*?)(References|Referencias)$/);
    if (ref && (ref[1] === "" || /[.)\]]$/.test(ref[1]))) {
      if (ref[1]) pushText(ref[1]);
      break;
    }
    if (STOP_LINE.test(line)) break;
    // A blank line starts a list only when the line before it introduced one ("…such as:").
    if (blankBefore) listMode = /:$/.test(prevLine);
    blankBefore = false;

    if (/\?$/.test(line)) {
      // A heading glued to the previous sentence: split at the first place a
      // letter or punctuation runs straight into a question word or "¿".
      const glued = line.match(/^(.*?[a-z0-9.)%\]”"'])((?:What|Why|Will|Are|Is|How|Do|Does|Can|Should|When|Who|¿)[^.!?]*\?)$/);
      if (glued && glued[2].length <= 140) {
        pushText(glued[1]);
        listMode = false;
        addHeading(glued[2]);
        prevLine = glued[2];
        blankBefore = false;
        continue;
      }
      if (line.length <= 140 && !/[.!]\s/.test(line)) {
        listMode = false;
        addHeading(line);
        prevLine = line;
        blankBefore = false;
        continue;
      }
    }

    pushText(line);
    prevLine = line;
  }

  return { sections: sections.filter((s, i) => i === 0 ? s.blocks.length : s.blocks.length || s.heading), altTitles };
}

const stripTracking = (href) => href.replace(/[?#].*$/, "").replace(/\/$/, "");

/** Pick the best MedlinePlus page from a Connect feed: a lab-test guide first, then a health topic. */
export function pickConnectEntry(feed) {
  const entries = (feed?.feed?.entry || []).map((e) => ({
    title: decodeEntities(e.title?._value || "").trim(),
    url: stripTracking((e.link || [])[0]?.href || ""),
    summary: e.summary?._value || "",
  }));
  return entries.find((e) => LAB_PATH_RE.test(e.url)) || entries.find((e) => TOPIC_PATH_RE.test(e.url)) || null;
}

export async function fetchLabTest(loinc, lang, fetchImpl = fetch) {
  const params = new URLSearchParams({
    "mainSearchCriteria.v.cs": LOINC_OID,
    "mainSearchCriteria.v.c": loinc,
    knowledgeResponseType: "application/json",
    "informationRecipient.languageCode.c": lang === "es" ? "es" : "en",
  });
  const res = await fetchImpl(`${CONNECT_URL}?${params}`, { signal: AbortSignal.timeout(8000), headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`connect ${res.status}`);
  const entry = pickConnectEntry(await res.json());
  if (!entry) return null;

  const isLab = LAB_PATH_RE.test(entry.url);
  let sections;
  let altTitles = [];
  if (isLab && !/<p[\s>]/i.test(entry.summary)) {
    ({ sections, altTitles } = labTextToSections(entry.summary));
  } else {
    sections = summaryToSections(entry.summary);
  }
  const split = splitContributors(sections);
  return {
    url: entry.url,
    title: entry.title,
    lang: entry.url.includes("/spanish/") ? "es" : "en",
    kind: isLab ? "labtest" : "topic",
    altTitles,
    sections: split.sections,
    contributors: split.contributors,
  };
}
