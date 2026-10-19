import React, { useEffect, useRef, useState } from "react";
import { H } from "../ui/H.jsx";
import { Blocks, lead } from "../ui/Blocks.jsx";
import { ErrorCard, SourceLine } from "../ui/Status.jsx";
import { navigate, openTopic } from "../lib/router.js";
import { update, uid, useStore } from "../data/store.js";
import { analyze, sectionBlocks } from "../lib/sections.js";
import { useTopic } from "../lib/useTopic.js";
import { askAi, getAiStatus, getLabTest, searchTopics } from "../services/api.js";
import { matchLabTests } from "../content/labtests.js";
import { MEDLINEPLUS_SEARCH } from "../content/catalog.js";
import { formatMonth } from "../lib/visit.js";

// "My health history": the user records past diagnoses and tests (kept in this
// browser only). Each one is matched to a MedlinePlus page, which supplies all
// of the explanation. CareBridge never interprets the user's own results.

const MAX_NAME = 100;
const MAX_RESULT = 200;
const MAX_NOTE = 500;

const card = { background: "#FFFEFB", border: "1px solid #E2E8E0", borderRadius: "24px", padding: "24px" };
const mono = { fontFamily: "'DM Mono',monospace", fontSize: "11.5px", letterSpacing: ".06em", textTransform: "uppercase", color: "#3F6E6A" };
const input = { width: "100%", padding: "12px 14px", borderRadius: "14px", border: "1.5px solid #D5DED3", background: "#FAFBF8", fontSize: "16px" };
const darkBtn = { background: "#254D43", color: "#FAF9F6", border: "none", borderRadius: "999px", padding: "11px 18px", fontWeight: "600", cursor: "pointer", fontSize: "15px" };
const lightBtn = { background: "#FFFEFB", color: "#254D43", border: "1.5px solid #A8BFA8", borderRadius: "999px", padding: "9px 15px", fontWeight: "600", cursor: "pointer", fontSize: "14.5px" };

/** Question prompts for the next visit. These are conversation starters, not medical content. */
function questionsFor(entry, es) {
  const n = entry.name.replace(/\s*\(demo\)\s*$/i, "");
  if (entry.kind === "test") {
    return es
      ? [`¿Qué significan mis resultados de ${n} para mí?`, `¿Necesito repetir la prueba de ${n}? ¿Cuándo?`, `¿Algo pudo haber afectado mis resultados de ${n}?`, `¿Hay algo en estos resultados que deba vigilar?`]
      : [`What do my ${n} results mean for me?`, `Do I need to repeat the ${n} test? When?`, `Could anything have affected my ${n} results?`, `Is there anything in these results I should keep an eye on?`];
  }
  return es
    ? [`¿Cómo va mi ${n} desde la última cita?`, `¿Qué síntomas de ${n} debo informarle de inmediato?`, `¿Necesito algún cambio en mi plan de tratamiento para ${n}?`, `¿Hay pruebas que debo hacerme para dar seguimiento a ${n}?`]
    : [`How is my ${n} doing since my last visit?`, `Which symptoms of ${n} should I tell you about right away?`, `Do I need any changes to my treatment plan for ${n}?`, `Are there tests I should have to keep track of ${n}?`];
}

export default function History({ ctx }) {
  const { lang, toast } = ctx;
  const es = lang === "es";
  const history = useStore((s) => s.history || []);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [editing, setEditing] = useState(null); // entry being edited, or null for a new one
  const formRef = useRef(null);

  useEffect(() => {
    getAiStatus().then((s) => setAiEnabled(Boolean(s.enabled)));
  }, []);

  const startEdit = (entry) => {
    setEditing(entry);
    formRef.current?.scrollIntoView({ behavior: ctx.prefs.reduceMotion ? "auto" : "smooth", block: "start" });
  };
  const remove = (entry) => {
    update((s) => ({ ...s, history: s.history.filter((h) => h.id !== entry.id) }));
    toast(es ? "Eliminado de su historial" : "Removed from your history");
  };

  const conditions = history.filter((h) => h.kind === "condition");
  const tests = history.filter((h) => h.kind === "test");

  return (
    <main style={{ maxWidth: "1180px", margin: "0 auto", padding: "44px 24px 110px", animation: "cbUp .35s ease" }}>
      <div style={mono}>{es ? "Mi historial de salud" : "My health history"}</div>
      <h1 style={{ margin: "10px 0 0", fontSize: "clamp(34px,4.6vw,58px)", lineHeight: "1.04", letterSpacing: "-.04em", fontWeight: "600", color: "#254D43", textWrap: "balance" }}>
        {es ? "Sus diagnósticos y pruebas, explicados." : "Your diagnoses and tests, explained."}
      </h1>
      <p style={{ margin: "14px 0 0", fontSize: "19px", color: "#3D4A45", maxWidth: "760px", textWrap: "pretty" }}>
        {es
          ? "Agregue diagnósticos y pruebas que ya le hicieron. CareBridge le muestra lo que MedlinePlus dice sobre cada uno y le ayuda a convertirlo en preguntas para su próxima cita."
          : "Add diagnoses you’ve been given and tests you’ve had. CareBridge shows what MedlinePlus says about each one and helps you turn it into questions for your next appointment."}
      </p>
      <div role="note" style={{ marginTop: "20px", display: "flex", gap: "12px", alignItems: "flex-start", background: "#F7E7E0", borderRadius: "18px", padding: "16px 18px", maxWidth: "860px", fontSize: "15px", color: "#5C2E20" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8A3A22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none", marginTop: "1px" }}>
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 8v4M12 16h.01"></path>
        </svg>
        <span>
          {es ? (
            <>
              <strong>CareBridge no diagnostica ni interpreta sus resultados.</strong> Muestra información general de MedlinePlus. Solo su equipo de salud puede decirle qué significan sus resultados para usted. Lo que escriba se guarda solo en este navegador y nunca se envía a la IA.
            </>
          ) : (
            <>
              <strong>CareBridge doesn’t diagnose or interpret your results.</strong> It shows general information from MedlinePlus. Only your care team can tell you what your results mean for you. What you type is saved only in this browser and is never sent to AI.
            </>
          )}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: "24px", marginTop: "32px", alignItems: "start" }}>
        <div ref={formRef} style={{ scrollMarginTop: "90px" }}>
          <EntryForm key={editing?.id || "new"} lang={lang} editing={editing} onDone={() => setEditing(null)} toast={toast} />
        </div>
        <div style={{ gridColumn: ctx.narrow ? "auto" : "span 2", minWidth: 0, display: "flex", flexDirection: "column", gap: "28px" }}>
          {history.length === 0 && (
            <div style={{ background: "#F4F7F2", borderRadius: "24px", padding: "36px", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "19px", fontWeight: "600", color: "#254D43" }}>{es ? "Su historial está vacío." : "Your history is empty."}</p>
              <p style={{ margin: "6px 0 0", color: "#55635E" }}>{es ? "Agregue un diagnóstico o una prueba con el formulario." : "Add a diagnosis or a test with the form."}</p>
            </div>
          )}
          {[
            { list: conditions, title: es ? "Diagnósticos" : "Diagnoses", id: "dx" },
            { list: tests, title: es ? "Pruebas y resultados" : "Tests and results", id: "tests" },
          ]
            .filter((g) => g.list.length)
            .map((g) => (
              <section key={g.id} aria-labelledby={`h-${g.id}`} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h2 id={`h-${g.id}`} style={{ margin: 0, fontSize: "26px", letterSpacing: "-.025em", fontWeight: "600" }}>
                  {g.title} <span style={{ fontSize: "16px", color: "#55635E", fontWeight: "500" }}>· {g.list.length}</span>
                </h2>
                {g.list.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} ctx={ctx} aiEnabled={aiEnabled} onEdit={() => startEdit(entry)} onRemove={() => remove(entry)} />
                ))}
              </section>
            ))}
        </div>
      </div>
    </main>
  );
}

function EntryForm({ lang, editing, onDone, toast }) {
  const es = lang === "es";
  const [kind, setKind] = useState(editing?.kind || "condition");
  const [name, setName] = useState(editing?.name || "");
  const [match, setMatch] = useState(editing?.match || null);
  const [when, setWhen] = useState(editing?.when || "");
  const [result, setResult] = useState(editing?.result || "");
  const [note, setNote] = useState(editing?.note || "");
  const [error, setError] = useState("");
  const [search, setSearch] = useState({ status: "idle", results: [] });

  const q = name.trim();
  const labHits = kind === "test" && !match ? matchLabTests(q, lang).slice(0, 4) : [];

  // Debounced MedlinePlus search for a match. Only the name typed here is sent.
  useEffect(() => {
    if (match || q.length < 2) {
      setSearch({ status: "idle", results: [] });
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setSearch((s) => ({ ...s, status: "loading" }));
      try {
        const data = await searchTopics(q, lang, { signal: ctrl.signal });
        setSearch({ status: "done", results: data.results.slice(0, 4) });
      } catch (e) {
        if (e.name !== "AbortError" && !ctrl.signal.aborted) setSearch({ status: "error", results: [], message: e.message });
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q, lang, match]);

  const pickTopic = (r) => setMatch({ type: "topic", url: r.url, title: r.title });
  const pickLab = (t) => setMatch({ type: "loinc", code: t.loinc, title: t.label });

  const save = () => {
    const clean = q.slice(0, MAX_NAME);
    if (clean.length < 2) {
      setError(es ? "Escriba el nombre del diagnóstico o de la prueba." : "Enter the name of the diagnosis or test.");
      return;
    }
    const entry = {
      id: editing?.id || uid(),
      kind,
      name: clean,
      match,
      when,
      result: kind === "test" ? result.trim().slice(0, MAX_RESULT) : "",
      note: note.trim().slice(0, MAX_NOTE),
      createdAt: editing?.createdAt || new Date().toISOString(),
    };
    update((s) => ({ ...s, history: editing ? s.history.map((h) => (h.id === entry.id ? entry : h)) : [entry, ...(s.history || [])] }));
    toast(editing ? (es ? "Cambios guardados" : "Changes saved") : es ? "Agregado a su historial" : "Added to your history");
    onDone();
    if (!editing) {
      setName("");
      setMatch(null);
      setWhen("");
      setResult("");
      setNote("");
    }
    setError("");
  };

  const kinds = [
    { id: "condition", label: es ? "Diagnóstico" : "Diagnosis" },
    { id: "test", label: es ? "Prueba o resultado" : "Test or result" },
  ];

  return (
    <div style={{ ...card, display: "flex", flexDirection: "column", gap: "16px", background: "#EAF2EB", border: "none" }}>
      <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "600", letterSpacing: "-.02em", color: "#254D43" }}>
        {editing ? (es ? "Editar" : "Edit entry") : es ? "Agregar a mi historial" : "Add to my history"}
      </h2>
      <div role="radiogroup" aria-label={es ? "Tipo" : "Type"} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", background: "#FFFEFB", borderRadius: "16px", padding: "5px" }}>
        {kinds.map((k) => {
          const on = kind === k.id;
          return (
            <button key={k.id} role="radio" aria-checked={on} onClick={() => { setKind(k.id); setMatch(null); }} style={{ border: "none", borderRadius: "12px", padding: "10px 8px", fontWeight: "600", fontSize: "15px", cursor: "pointer", background: on ? "#254D43" : "transparent", color: on ? "#FAF9F6" : "#3D4A45" }}>
              {k.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label htmlFor="h-name" style={{ fontWeight: "600" }}>
          {kind === "test" ? (es ? "Nombre de la prueba" : "Test name") : es ? "Diagnóstico o afección" : "Diagnosis or condition"}
        </label>
        <input
          id="h-name"
          value={name}
          maxLength={MAX_NAME}
          autoComplete="off"
          onChange={(e) => { setName(e.target.value); setMatch(null); setError(""); }}
          placeholder={kind === "test" ? (es ? "p. ej., A1C, colesterol, resonancia" : "e.g. A1C, cholesterol, MRI") : es ? "p. ej., asma, presión arterial alta" : "e.g. asthma, high blood pressure"}
          style={input}
        />
        {error && <span role="alert" style={{ color: "#8A3A22", fontSize: "14.5px" }}>{error}</span>}
      </div>

      {match ? (
        <div style={{ display: "flex", gap: "10px", alignItems: "center", background: "#FFFEFB", borderRadius: "14px", padding: "10px 12px" }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: "14.5px" }}>
            <span style={{ ...mono, display: "block" }}>{es ? "Vinculado a MedlinePlus" : "Matched to MedlinePlus"}</span>
            <strong style={{ color: "#254D43" }}>{match.title}</strong>
          </span>
          <button onClick={() => setMatch(null)} style={{ ...lightBtn, padding: "6px 12px", fontSize: "13.5px" }}>{es ? "Cambiar" : "Change"}</button>
        </div>
      ) : (
        q.length >= 2 && (
          <div aria-live="polite" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "14px", color: "#3D4A45" }}>{es ? "Elija la coincidencia de MedlinePlus que corresponda:" : "Pick the MedlinePlus match that fits:"}</span>
            {labHits.map((t) => (
              <MatchButton key={t.loinc} onClick={() => pickLab(t)} title={t.label} kindLabel={es ? "Guía de prueba de laboratorio" : "Lab test guide"} />
            ))}
            {search.status === "loading" && <span style={{ fontSize: "14px", color: "#55635E" }}>{es ? "Buscando en MedlinePlus…" : "Searching MedlinePlus…"}</span>}
            {search.status === "error" && <span style={{ fontSize: "14px", color: "#8A3A22" }}>{search.message}</span>}
            {search.results.map((r) => (
              <MatchButton key={r.url} onClick={() => pickTopic(r)} title={r.title} kindLabel={es ? "Tema de salud" : "Health topic"} />
            ))}
            {search.status === "done" && !search.results.length && !labHits.length && (
              <span style={{ fontSize: "14px", color: "#55635E" }}>{es ? "No hay coincidencias. Puede guardarlo de todos modos." : "No matches. You can still save it."}</span>
            )}
          </div>
        )
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label htmlFor="h-when" style={{ fontWeight: "600" }}>{es ? "¿Cuándo? (opcional)" : "When? (optional)"}</label>
        <input id="h-when" type="month" value={when} onChange={(e) => setWhen(e.target.value)} style={input} />
      </div>

      {kind === "test" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="h-result" style={{ fontWeight: "600" }}>{es ? "Mi resultado, tal como aparece en mi informe (opcional)" : "My result, as written on my report (optional)"}</label>
          <input id="h-result" value={result} maxLength={MAX_RESULT} onChange={(e) => setResult(e.target.value)} placeholder={es ? "p. ej., 5.4 %" : "e.g. 5.4%"} style={input} />
          <span style={{ fontSize: "13.5px", color: "#55635E" }}>
            {es ? "CareBridge no revisa ni interpreta este valor. Se guarda para que lo lleve a su cita." : "CareBridge doesn’t check or interpret this. It’s kept so you can bring it to your visit."}
          </span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label htmlFor="h-note" style={{ fontWeight: "600" }}>{es ? "Mis notas (opcional)" : "My notes (optional)"}</label>
        <textarea id="h-note" rows="3" value={note} maxLength={MAX_NOTE} onChange={(e) => setNote(e.target.value)} placeholder={es ? "Lo que le dijeron o lo que quiere recordar" : "What you were told, or what you want to remember"} style={{ ...input, resize: "vertical" }}></textarea>
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <H as="button" onClick={save} style={darkBtn} hover={{ background: "#1B3B33" }}>
          {editing ? (es ? "Guardar cambios" : "Save changes") : es ? "Agregar" : "Add to history"}
        </H>
        {editing && (
          <button onClick={onDone} style={lightBtn}>{es ? "Cancelar" : "Cancel"}</button>
        )}
      </div>
      <span style={{ fontSize: "13px", color: "#55635E" }}>
        {es ? "Para buscar coincidencias, solo se envía a MedlinePlus el nombre que escribe arriba, sin datos que lo identifiquen." : "To find matches, only the name you type above is sent to MedlinePlus, with nothing that identifies you."}
      </span>
    </div>
  );
}

function MatchButton({ onClick, title, kindLabel }) {
  return (
    <H as="button" onClick={onClick} style={{ textAlign: "left", display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center", background: "#FFFEFB", border: "1.5px solid #D5DED3", borderRadius: "14px", padding: "10px 12px", cursor: "pointer" }} hover={{ borderColor: "#254D43" }}>
      <span style={{ fontWeight: "600", color: "#254D43" }}>{title}</span>
      <span style={{ ...mono, fontSize: "10.5px", flex: "none" }}>{kindLabel}</span>
    </H>
  );
}

/** Load the MedlinePlus explanation for an entry's match (topic URL or LOINC code). */
function useExplanation(match, lang) {
  const topicUrl = match?.type === "topic" ? match.url : null;
  const topic = useTopic(topicUrl, match?.title || "", lang);
  const [lab, setLab] = useState({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const code = match?.type === "loinc" ? match.code : null;

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    setLab({ status: "loading" });
    getLabTest(code, lang)
      .then((d) => !cancelled && setLab({ status: "done", ...d }))
      .catch((e) => !cancelled && setLab({ status: "error", message: e.message }));
    return () => {
      cancelled = true;
    };
  }, [code, lang, attempt]);

  if (!match) return { status: "none" };
  if (code) return { ...lab, retry: () => setAttempt((n) => n + 1) };
  return topic;
}

function EntryCard({ entry, ctx, aiEnabled, onEdit, onRemove }) {
  const { lang, toast } = ctx;
  const es = lang === "es";
  const questions = useStore((s) => s.questions);
  const exp = useExplanation(entry.match, lang);
  const [ai, setAi] = useState({ status: "idle" });
  const [confirm, setConfirm] = useState(false);

  const topic = exp.status === "done" ? exp.topic : null;
  const a = topic ? analyze(topic.sections) : null;
  const isTest = entry.kind === "test";

  // Pick the parts that answer this kind of entry, by MedlinePlus section heading.
  const parts = [];
  if (a) {
    if (isTest) {
      const used = a.pick("usedfor").slice(0, 1);
      const results = a.pick("results");
      if (used.length) parts.push({ label: es ? "Para qué se usa" : "What it’s used for", blocks: sectionBlocks(used, false) });
      if (results.length) parts.push({ label: es ? "Qué pueden significar los resultados, en general" : "What results can mean, in general", blocks: sectionBlocks(results, false), results: true });
    } else {
      const sym = a.pick("symptoms");
      if (sym.length) parts.push({ label: es ? "Síntomas que menciona MedlinePlus" : "Symptoms MedlinePlus lists", blocks: sectionBlocks(sym, false) });
    }
  }
  const missingLabel = isTest
    ? es ? "MedlinePlus no explica los resultados en esta página. Pregúntele a su equipo de salud." : "This MedlinePlus page doesn’t explain results. Ask your care team."
    : es ? "Esta página de MedlinePlus no incluye una lista de síntomas." : "This MedlinePlus page doesn’t list symptoms.";

  const qs = questionsFor(entry, es);
  const hasQ = (text) => questions.some((x) => x.text === text);
  const addQ = (text) => {
    if (hasQ(text)) return;
    update((s) => ({ ...s, questions: [...s.questions, { id: uid(), text, priority: false, source: entry.name, historyId: entry.id, createdAt: new Date().toISOString() }] }));
    toast(es ? "Agregada a Mi cita" : "Added to My Visit");
  };

  const simplify = async () => {
    setAi({ status: "loading" });
    try {
      // Only the MedlinePlus page reference is sent; never the user's name for it, result or notes.
      const payload = entry.match.type === "loinc" ? { task: "simplify", loinc: entry.match.code, lang } : { task: "simplify", url: topic.url, title: topic.title, lang: topic.lang };
      const data = await askAi(payload);
      setAi({ status: "done", text: data.text });
    } catch (e) {
      setAi({ status: "error", message: e.message });
    }
  };

  const meta = [isTest ? (es ? "Prueba" : "Test") : es ? "Diagnóstico" : "Diagnosis", entry.when ? formatMonth(entry.when, lang) : null].filter(Boolean).join(" · ");

  return (
    <article style={{ ...card, display: "flex", flexDirection: "column", gap: "16px" }}>
      <header style={{ display: "flex", gap: "12px", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <span style={mono}>{meta}</span>
          <h3 style={{ margin: "4px 0 0", fontSize: "23px", fontWeight: "600", letterSpacing: "-.02em", color: "#254D43" }}>{entry.name}</h3>
          {entry.match && entry.match.title.toLowerCase() !== entry.name.toLowerCase() && (
            <span style={{ fontSize: "14px", color: "#55635E" }}>
              {es ? "MedlinePlus: " : "MedlinePlus: "}
              {topic?.title || entry.match.title}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onEdit} style={{ ...lightBtn, padding: "7px 13px", fontSize: "13.5px" }}>{es ? "Editar" : "Edit"}</button>
          {!confirm ? (
            <H as="button" onClick={() => setConfirm(true)} aria-label={`${es ? "Quitar" : "Remove"} ${entry.name}`} style={{ background: "none", border: "1.5px solid #E6D3CB", color: "#8A3A22", borderRadius: "999px", padding: "7px 13px", fontWeight: "600", fontSize: "13.5px", cursor: "pointer" }} hover={{ background: "#FBF3EF" }}>
              {es ? "Quitar" : "Remove"}
            </H>
          ) : (
            <button onClick={onRemove} style={{ background: "#8A3A22", color: "#FFFEFB", border: "none", borderRadius: "999px", padding: "7px 13px", fontWeight: "600", fontSize: "13.5px", cursor: "pointer" }}>
              {es ? "Sí, quitar" : "Yes, remove"}
            </button>
          )}
        </div>
      </header>

      {(entry.result || entry.note) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: "10px" }}>
          {entry.result && (
            <div style={{ background: "#F4F7F2", borderRadius: "14px", padding: "12px 14px" }}>
              <span style={{ ...mono, display: "block" }}>{es ? "Mi resultado, como lo escribí" : "My result, as I wrote it"}</span>
              <span style={{ fontSize: "16px", fontWeight: "600" }}>{entry.result}</span>
              <span style={{ display: "block", fontSize: "12.5px", color: "#55635E", marginTop: "4px" }}>{es ? "No revisado por CareBridge" : "Not checked by CareBridge"}</span>
            </div>
          )}
          {entry.note && (
            <div style={{ background: "#F4F7F2", borderRadius: "14px", padding: "12px 14px" }}>
              <span style={{ ...mono, display: "block" }}>{es ? "Mis notas" : "My notes"}</span>
              <span style={{ fontSize: "15.5px", whiteSpace: "pre-line" }}>{entry.note}</span>
            </div>
          )}
        </div>
      )}

      {exp.status === "none" && (
        <div style={{ background: "#F4F7F2", borderRadius: "16px", padding: "14px 16px", fontSize: "15px" }}>
          {es ? "Aún no está vinculado a MedlinePlus. " : "Not matched to MedlinePlus yet. "}
          <button onClick={onEdit} style={{ background: "none", border: "none", padding: 0, color: "#3F6E6A", fontWeight: "600", textDecoration: "underline", cursor: "pointer", fontSize: "15px" }}>{es ? "Buscar una coincidencia" : "Find a match"}</button>
          {" · "}
          <a href={MEDLINEPLUS_SEARCH(entry.name.replace(/\s*\(demo\)\s*$/i, ""), lang)} target="_blank" rel="noopener noreferrer">{es ? "Buscar en MedlinePlus ↗" : "Search MedlinePlus ↗"}</a>
        </div>
      )}
      {exp.status === "loading" && (
        <div role="status" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <span style={{ position: "absolute", left: "-9999px" }}>{es ? "Cargando" : "Loading"}</span>
          {[70, 92, 80].map((w, i) => <span key={i} aria-hidden="true" style={{ height: "14px", width: `${w}%`, borderRadius: "8px", background: "#EEF2EC", animation: "cbPulse 1.4s ease-in-out infinite" }}></span>)}
        </div>
      )}
      {exp.status === "error" && (
        <ErrorCard
          title={es ? "No pudimos cargar la explicación." : "We couldn’t load the explanation."}
          message={exp.message}
          onRetry={exp.retry}
          fallbackHref={MEDLINEPLUS_SEARCH(entry.match?.title || entry.name, lang)}
          fallbackLabel={es ? "Buscar en MedlinePlus ↗" : "Search MedlinePlus ↗"}
        />
      )}

      {topic && (
        <>
          {exp.langMissing && (
            <p style={{ margin: 0, fontSize: "14px", color: "#55635E" }}>{es ? "MedlinePlus no tiene esta página en español; se muestra en inglés." : "MedlinePlus doesn’t have this page in English; showing the Spanish page."}</p>
          )}
          <div>
            <span style={{ ...mono, display: "block", marginBottom: "6px" }}>{isTest ? (es ? "Qué mide" : "What it checks") : es ? "Qué es" : "What it is"}</span>
            <p style={{ margin: 0, fontSize: "17px", lineHeight: "1.6", textWrap: "pretty" }}>{lead(a.whatIs, 320)}</p>
          </div>
          {parts.map((p) => (
            <div key={p.label} style={{ background: p.results ? "#FBF3EF" : "#F4F7F2", borderRadius: "18px", padding: "16px 18px" }}>
              <span style={{ ...mono, display: "block", marginBottom: "8px", color: p.results ? "#8A3A22" : "#3F6E6A" }}>{p.label}</span>
              <Blocks blocks={p.blocks} size="16px" gap="10px" />
              {p.results && (
                <p style={{ margin: "12px 0 0", fontSize: "14.5px", fontWeight: "600", color: "#5C2E20" }}>
                  {es ? "Esto es información general. Los rangos varían según el laboratorio y la persona; su equipo de salud le dirá qué significa su resultado." : "This is general information. Ranges vary by lab and by person; your care team will tell you what your result means."}
                </p>
              )}
            </div>
          ))}
          {!parts.length && <p style={{ margin: 0, fontSize: "15px", color: "#55635E" }}>{missingLabel}</p>}

          {ai.status === "done" ? (
            <div style={{ background: "#EAF2EB", borderRadius: "18px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ ...mono, fontSize: "11px" }}>
                {es ? "Versión sencilla creada con IA a partir del texto de MedlinePlus. Puede contener errores: confirme con su equipo de salud." : "Plain-language version written by AI from the MedlinePlus text only. It can make mistakes: check with your care team."}
              </span>
              <span style={{ whiteSpace: "pre-line", fontSize: "16px" }}>{ai.text}</span>
            </div>
          ) : (
            aiEnabled && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>
                <button onClick={simplify} disabled={ai.status === "loading"} style={{ ...lightBtn, opacity: ai.status === "loading" ? 0.6 : 1 }}>
                  {ai.status === "loading" ? (es ? "Preparando…" : "Simplifying…") : es ? "Explicar con palabras más sencillas (IA)" : "Explain in simpler words (AI)"}
                </button>
                {ai.status === "error" && <span role="alert" style={{ color: "#8A3A22", fontSize: "14.5px" }}>{ai.message}</span>}
                <span style={{ fontSize: "12.5px", color: "#55635E" }}>{es ? "Solo se envía la página de MedlinePlus, nunca su resultado ni sus notas." : "Only the MedlinePlus page is sent, never your result or notes."}</span>
              </div>
            )
          )}

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {topic.kind !== "labtest" && (
              <button onClick={() => openTopic(topic.url, topic.title)} style={darkBtn}>{es ? "Leer la guía completa" : "Read the full guide"}</button>
            )}
            <button onClick={() => navigate("/understand", { focus: "terms" })} style={lightBtn}>{isTest ? (es ? "Buscar una palabra de mi informe" : "Look up a word from my report") : es ? "Buscar una palabra médica" : "Look up a medical word"}</button>
          </div>
          <SourceLine org={topic.kind === "labtest" ? (es ? "MedlinePlus pruebas de laboratorio" : "MedlinePlus Lab Tests") : topic.organization || "MedlinePlus"} url={topic.url} title={topic.title} retrievedAt={exp.retrievedAt} lang={lang} />
        </>
      )}

      <details style={{ background: "#FAFBF8", border: "1px solid #E2E8E0", borderRadius: "16px", padding: "12px 16px" }}>
        <summary style={{ cursor: "pointer", fontWeight: "600", color: "#254D43" }}>{es ? "Preguntas para mi próxima cita" : "Questions for my next appointment"}</summary>
        <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
          {qs.map((text) => {
            const added = hasQ(text);
            return (
              <li key={text} style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "15.5px" }}>{text}</span>
                <button onClick={() => addQ(text)} disabled={added} aria-label={`${added ? (es ? "Agregada" : "Added") : es ? "Agregar" : "Add"}: ${text}`} style={{ ...lightBtn, flex: "none", padding: "6px 12px", fontSize: "13.5px", background: added ? "#EAF2EB" : "#FFFEFB", cursor: added ? "default" : "pointer" }}>
                  {added ? (es ? "✓ Agregada" : "✓ Added") : es ? "+ Agregar" : "+ Add"}
                </button>
              </li>
            );
          })}
        </ul>
        <button onClick={() => navigate("/visit/3")} style={{ marginTop: "12px", background: "none", border: "none", padding: 0, color: "#3F6E6A", fontWeight: "600", textDecoration: "underline", cursor: "pointer", fontSize: "14.5px" }}>
          {es ? "Ver mi lista de preguntas →" : "See my question list →"}
        </button>
      </details>
    </article>
  );
}
