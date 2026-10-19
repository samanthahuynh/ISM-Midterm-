// Sort MedlinePlus summary sections into the guide's tabs and phases by their
// headings (MedlinePlus headings are questions like "How is X diagnosed?").

const RULES = {
  symptoms: /symptom|signs?\b|síntoma|señales/i,
  causes: /cause|causa|risk|riesgo|more likely|más probabilidades|who gets|quién/i,
  diagnosis: /diagnos|test(s|ed)? for|pruebas? (para|de)/i,
  treatment: /treat|tratamiento|tratar|manage|manejar|therap|terapia/i,
  prevention: /prevent|prevenir|prevención/i,
  before: /prepar|before|antes/i,
  during: /how (is|are|do|does|will)\b.*\b(done|performed|work|happen)|during|what happens|cómo se (hace|hacen|realiza|realizan)|durante|qué (pasa|sucede|ocurre)/i,
  after: /after|recover|después|recupera/i,
};

export function classify(heading = "") {
  return Object.keys(RULES).filter((k) => RULES[k].test(heading));
}

/** Split a topic into the intro (first section) and the rest, tagged. */
export function analyze(sections = []) {
  const [intro, ...rest] = sections;
  const tagged = rest.map((s) => ({ ...s, tags: classify(s.heading || "") }));
  const pick = (tag) => tagged.filter((s) => s.tags.includes(tag));
  const firstP = sections.flatMap((s) => s.blocks).find((b) => b.type === "p");
  return {
    intro: intro || { heading: null, blocks: [] },
    rest: tagged,
    whatIs: firstP?.text || "",
    pick,
  };
}

/** Flatten sections into blocks, adding headings when there's more than one. */
export function sectionBlocks(list, withHeadings = list.length > 1) {
  return list.flatMap((s) => [...(withHeadings && s.heading ? [{ type: "h", text: s.heading }] : []), ...s.blocks]);
}
