// Curated entry points into MedlinePlus. These hold only titles, links and
// categories; every word of medical content is loaded live from MedlinePlus.
// URLs were checked against medlineplus.gov topic index pages (Oct 2026).

const mp = (slug) => ({ en: `https://medlineplus.gov/${slug}.html`, es: `https://medlineplus.gov/spanish/${slug}.html` });

// Category chips map to MedlinePlus "groupName" values (English / Spanish).
export const CATEGORIES = [
  { id: "all", en: "All", es: "Todos", groups: [] },
  { id: "bones", en: "Bones & joints", es: "Huesos y articulaciones", groups: ["Bones, Joints and Muscles", "Huesos, articulaciones y músculos"] },
  { id: "brain", en: "Brain & nerves", es: "Cerebro y nervios", groups: ["Brain and Nerves", "Cerebro y nervios"] },
  { id: "heart", en: "Heart & circulation", es: "Corazón y circulación", groups: ["Heart and Circulation", "Blood, Heart and Circulation", "Corazón y circulación", "Sangre, corazón y circulación"] },
  { id: "lungs", en: "Lungs & breathing", es: "Pulmones y respiración", groups: ["Lungs and Breathing", "Pulmones y respiración"] },
  { id: "digestive", en: "Digestive system", es: "Aparato digestivo", groups: ["Digestive System", "Aparato digestivo", "Sistema digestivo"] },
  { id: "endocrine", en: "Hormones & diabetes", es: "Hormonas y diabetes", groups: ["Endocrine System", "Diabetes Mellitus", "Sistema endocrino", "Diabetes"] },
  { id: "mental", en: "Mental health", es: "Salud mental", groups: ["Mental Health and Behavior", "Salud mental y conducta"] },
];

export const TINTS = ["#DCE8DC", "#F3DCD2", "#E2ECEA", "#EFE9D8", "#E6E1EE", "#DDE8EE", "#F1E3D3", "#E4EBDD"];

export function categoryFor(groups = []) {
  const c = CATEGORIES.find((cat) => cat.id !== "all" && cat.groups.some((g) => groups.includes(g)));
  return c || null;
}

export function tintFor(key = "") {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
}

export const FEATURED_TOPICS = [
  { slug: "carpaltunnelsyndrome", title: { en: "Carpal Tunnel Syndrome", es: "Síndrome del túnel carpiano" }, cat: "bones", url: mp("carpaltunnelsyndrome") },
  { slug: "highbloodpressure", title: { en: "High Blood Pressure", es: "Presión arterial alta" }, cat: "heart", url: mp("highbloodpressure") },
  { slug: "diabetestype2", title: { en: "Diabetes Type 2", es: "Diabetes tipo 2" }, cat: "endocrine", url: mp("diabetestype2") },
  { slug: "asthma", title: { en: "Asthma", es: "Asma" }, cat: "lungs", url: mp("asthma") },
  { slug: "migraine", title: { en: "Migraine", es: "Migraña" }, cat: "brain", url: mp("migraine") },
  { slug: "osteoarthritis", title: { en: "Osteoarthritis", es: "Osteoartritis" }, cat: "bones", url: mp("osteoarthritis") },
  { slug: "gerd", title: { en: "GERD", es: "Reflujo gastroesofágico" }, cat: "digestive", url: mp("gerd") },
  { slug: "depression", title: { en: "Depression", es: "Depresión" }, cat: "mental", url: mp("depression") },
];

// Procedure & recovery guides, each backed by a MedlinePlus topic.
export const PROCEDURES = [
  { id: "colonoscopy", title: { en: "Colonoscopy", es: "Colonoscopia" }, kind: { en: "TEST · SCOPE", es: "PRUEBA · ENDOSCOPIA" }, url: mp("colonoscopy"), related: [] },
  { id: "kneereplacement", title: { en: "Knee Replacement", es: "Reemplazo de rodilla" }, kind: { en: "SURGERY", es: "CIRUGÍA" }, url: mp("kneereplacement"), related: ["osteoarthritis"] },
  { id: "hipreplacement", title: { en: "Hip Replacement", es: "Reemplazo de cadera" }, kind: { en: "SURGERY", es: "CIRUGÍA" }, url: mp("hipreplacement"), related: ["osteoarthritis"] },
  { id: "mriscans", title: { en: "MRI Scans", es: "Resonancia magnética" }, kind: { en: "IMAGING", es: "IMÁGENES" }, url: mp("mriscans"), related: [] },
  { id: "biopsy", title: { en: "Biopsy", es: "Biopsia" }, kind: { en: "TEST", es: "PRUEBA" }, url: mp("biopsy"), related: [] },
  { id: "endoscopy", title: { en: "Endoscopy", es: "Endoscopia" }, kind: { en: "TEST · SCOPE", es: "PRUEBA · ENDOSCOPIA" }, url: mp("endoscopy"), related: [] },
  { id: "anesthesia", title: { en: "Anesthesia", es: "Anestesia" }, kind: { en: "CARE DURING PROCEDURES", es: "ATENCIÓN DURANTE PROCEDIMIENTOS" }, url: mp("anesthesia"), related: [] },
  { id: "aftersurgery", title: { en: "After Surgery", es: "Después de una cirugía" }, kind: { en: "RECOVERY", es: "RECUPERACIÓN" }, url: mp("aftersurgery"), related: [] },
];

export const slugOf = (url) => (url || "").split("/").pop().replace(/\.html$/, "");

// Words patients often hear. Each is looked up live on MedlinePlus; CareBridge
// never writes its own definitions.
export const TERM_SUGGESTIONS = {
  en: ["Biopsy", "Anesthesia", "Endoscopy", "MRI", "Inflammation", "Hypertension"],
  es: ["Biopsia", "Anestesia", "Endoscopia", "Resonancia magnética", "Inflamación", "Hipertensión"],
};

export const MEDLINEPLUS_SEARCH = (term, lang) =>
  `https://vsearch.nlm.nih.gov/vivisimo/cgi-bin/query-meta?v%3Aproject=${lang === "es" ? "medlineplus-spanish" : "medlineplus"}&query=${encodeURIComponent(term)}`;
