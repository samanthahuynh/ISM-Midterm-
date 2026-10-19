// Helpers shared by the dashboard and the My Visit flow.

export const CONCERN_PROMPTS = [
  { id: "when", label: "When did this start, and has it changed?", ph: "e.g. About three months ago, slowly getting more frequent" },
  { id: "worse", label: "What makes it better or worse?", ph: "e.g. Worse when typing; better after shaking out my hand" },
  { id: "tried", label: "What have you already tried?", ph: "e.g. Short breaks at work" },
  { id: "daily", label: "How is it affecting your daily life?", ph: "e.g. Hard to hold my phone or cook" },
  { id: "worry", label: "What worries you most?", ph: "e.g. Whether I'll need surgery" },
];

export const CONCERN_PROMPTS_ES = {
  when: "¿Cuándo empezó y ha cambiado?",
  worse: "¿Qué lo mejora o lo empeora?",
  tried: "¿Qué ha intentado hasta ahora?",
  daily: "¿Cómo afecta su vida diaria?",
  worry: "¿Qué es lo que más le preocupa?",
};

export function visitProgress(appt, questions) {
  const steps = [
    Boolean(appt.date && appt.reason?.trim()),
    Object.values(appt.concerns || {}).some((v) => v?.trim()) || (appt.timeline || []).length > 0,
    questions.length > 0,
    Boolean(appt.sheetReady),
  ];
  return { steps, pct: Math.round((steps.filter(Boolean).length / steps.length) * 100) };
}

export function formatDate(iso, lang, opts = { weekday: "long", month: "long", day: "numeric" }) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(lang === "es" ? "es-US" : "en-US", opts);
}

export function formatTime(hhmm, lang) {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(lang === "es" ? "es-US" : "en-US", { hour: "numeric", minute: "2-digit" });
}

export function formatMonth(ym, lang) {
  if (!ym) return "";
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(lang === "es" ? "es-US" : "en-US", { month: "short", year: "numeric" }).toUpperCase();
}

/** Priority questions first, keeping the user's order otherwise. */
export const orderedQuestions = (qs) => [...qs.filter((q) => q.priority), ...qs.filter((q) => !q.priority)];
