// Data layer.
//
// The app talks to a small repository API (load/save of one versioned state
// document). Today it's backed by localStorage with fictional demo data.
// The state is shaped like the planned Supabase tables (docs/SUPABASE_PLAN.md)
// so a SupabaseAdapter can implement the same load/save contract later.

import { useSyncExternalStore } from "react";
import { demoState } from "./demo.js";

const KEY = "carebridge:v1";
export const SCHEMA_VERSION = 1;

export function emptyState() {
  return {
    version: SCHEMA_VERSION,
    prefs: { lang: "en", textSize: "md", reduceMotion: false, highContrast: false, level: "simple", disclaimerSeen: false },
    profile: null, // { displayName, initials, demo: true }
    appointment: { date: "", time: "", type: "New patient", specialty: "Primary care", clinician: "", reason: "", concerns: {}, timeline: [], sheetReady: false },
    questions: [], // { id, text, priority, source, createdAt }
    savedTopics: [], // { url, title, cat, lang, savedAt }
    savedProcedures: [], // { id, savedAt }
    recent: [], // { url, title, cat, lang, viewedAt }
    questionLists: [], // { id, title, questions: [{text, priority}], createdAt }
    visitSheets: [], // { id, title, snapshot, createdAt }
    visitNotes: [], // { id, text, createdAt }
    careNotes: {}, // procedureId -> text
    // Past diagnoses and tests the user chooses to record. Stays in this browser;
    // only the MedlinePlus match (URL or LOINC code) is ever used to fetch content.
    history: [], // { id, kind: "condition"|"test", name, match: {type:"topic", url, title} | {type:"loinc", code, title} | null, when: "YYYY-MM", result, note, createdAt }
  };
}

/** Local-only adapter. Same async contract a Supabase adapter would implement. */
export const localAdapter = {
  async load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return demoState(emptyState());
      const parsed = JSON.parse(raw);
      if (parsed?.version !== SCHEMA_VERSION) return demoState(emptyState());
      return { ...emptyState(), ...parsed, prefs: { ...emptyState().prefs, ...parsed.prefs } };
    } catch {
      return demoState(emptyState());
    }
  },
  async save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch {
      return false; // storage full or blocked (private mode): the app keeps working in memory
    }
  },
  async clear() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  },
};

// --- tiny store with React binding ---
let state = emptyState();
let ready = false;
const listeners = new Set();
let adapter = localAdapter;
let saveFailed = false;

export async function initStore(a = localAdapter) {
  adapter = a;
  state = await adapter.load();
  ready = true;
  emit();
}

function emit() {
  for (const l of listeners) l();
}

export function getState() {
  return state;
}

export function isReady() {
  return ready;
}

export function update(fn) {
  const next = typeof fn === "function" ? fn(state) : { ...state, ...fn };
  if (next === state) return;
  state = next;
  emit();
  adapter.save(state).then((ok) => {
    saveFailed = !ok;
  });
}

export function storageAvailable() {
  return !saveFailed;
}

/** Delete everything and start blank (no demo data). */
export async function resetAll() {
  await adapter.clear();
  const prefs = { ...emptyState().prefs, lang: state.prefs.lang, disclaimerSeen: true };
  state = { ...emptyState(), prefs };
  emit();
  await adapter.save(state);
}

export function useStore(selector = (s) => s) {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => selector(state),
  );
}

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
