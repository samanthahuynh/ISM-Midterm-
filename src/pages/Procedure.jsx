import React, { useEffect, useState } from "react";
import { H } from "../ui/H.jsx";
import { Blocks, lead } from "../ui/Blocks.jsx";
import { ErrorCard, Loading, SourceLine } from "../ui/Status.jsx";
import { navigate } from "../lib/router.js";
import { useTopic } from "../lib/useTopic.js";
import { analyze } from "../lib/sections.js";
import { update, uid, useStore } from "../data/store.js";
import { PROCEDURES } from "../content/catalog.js";
import { PHASE_QUESTIONS, fillTopic } from "../content/questions.js";

// Logistics to confirm or bring. These are prompts, not medical instructions.
const CHECKLISTS = {
  before: {
    en: { title: "Confirm with your care team", list: ["Your arrival time and where to go", "Whether to stop or change any medicines or supplements", "Any eating or drinking instructions", "Whether you need someone to drive you home"] },
    es: { title: "Confirme con su equipo de salud", list: ["La hora de llegada y adónde ir", "Si debe dejar o cambiar algún medicamento o suplemento", "Si hay instrucciones sobre comer o beber", "Si necesita que alguien le lleve a casa"] },
  },
  day: {
    en: { title: "Things to bring", list: ["Photo ID and insurance card", "Your list of medicines and supplements", "Your question list from CareBridge", "Any written instructions from your care team"] },
    es: { title: "Qué llevar", list: ["Identificación con foto y tarjeta del seguro", "Su lista de medicamentos y suplementos", "Su lista de preguntas de CareBridge", "Las instrucciones escritas de su equipo de salud"] },
  },
  after: {
    en: { title: "Ask before you leave", list: ["Who to call with questions, including after hours", "Which symptoms mean you should call or get urgent care", "When you can return to your usual activities", "When your follow-up visit is"] },
    es: { title: "Pregunte antes de irse", list: ["A quién llamar con preguntas, incluso fuera del horario", "Qué síntomas significan que debe llamar o buscar atención urgente", "Cuándo puede volver a sus actividades normales", "Cuándo es su cita de seguimiento"] },
  },
};

export default function Procedure({ ctx }) {
  const { t, lang, toast, route } = ctx;
  const es = lang === "es";
  const def = PROCEDURES.find((p) => p.id === route.param);
  const topicState = useTopic(def?.url.en, def?.title.en || "", lang);
  const saved = useStore((s) => s.savedProcedures);
  const careNotes = useStore((s) => s.careNotes);
  const questions = useStore((s) => s.questions);
  const [phaseId, setPhaseId] = useState("before");
  const [openAcc, setOpenAcc] = useState({});
  const [procDraft, setProcDraftV] = useState(careNotes[route.param] || "");

  useEffect(() => setProcDraftV(careNotes[route.param] || ""), [route.param]);

  const goNext = () => navigate("/next");
  const goBuilder = () => navigate("/visit/3");
  const name = def ? def.title[lang] || def.title.en : es ? "Guía" : "Guide";
  const topic = topicState.status === "done" ? topicState.topic : null;

  if (!def || !topic) {
    return (
      <main style={{ maxWidth: "1180px", margin: "0 auto", padding: "32px 24px 110px" }}>
        <nav aria-label="Breadcrumb" style={{ fontSize: "14.5px", color: "#55635E", display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={goNext} style={{ background: "none", border: "none", padding: "4px 0", color: "#3F6E6A", fontWeight: "600", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px" }}>{t.nav.next}</button>
          <span aria-hidden="true">›</span>
          <span aria-current="page" style={{ color: "#27332F", fontWeight: "500" }}>{name}</span>
        </nav>
        <h1 style={{ margin: "20px 0 24px", fontSize: "clamp(34px,4.4vw,56px)", lineHeight: "1.03", letterSpacing: "-.04em", fontWeight: "600", color: "#254D43" }}>{name}</h1>
        {!def ? (
          <ErrorCard title={es ? "No encontramos esa guía." : "We couldn’t find that guide."} onRetry={goNext} />
        ) : topicState.status === "error" ? (
          <ErrorCard message={topicState.message} onRetry={topicState.retry} fallbackHref={def.url[lang]} fallbackLabel={es ? "Abrir en MedlinePlus ↗" : "Open on MedlinePlus ↗"} />
        ) : (
          <Loading label={es ? "Cargando guía…" : "Loading guide…"} height="260px" lines={5} />
        )}
      </main>
    );
  }

  const a = analyze(topic.sections);
  const all = [a.intro, ...a.rest];
  const PH = [
    { id: "before", n: es ? "ANTES" : "BEFORE", label: es ? "Prepararse" : "Getting ready", tag: "before" },
    { id: "day", n: es ? "EL DÍA" : "DAY OF", label: es ? "Qué pasa" : "What happens", tag: "during" },
    { id: "after", n: es ? "DESPUÉS" : "AFTER", label: es ? "Recuperación" : "Recovery", tag: "after" },
  ];
  // Assign each section to at most one phase (first match wins).
  const used = new Set();
  const bySection = {};
  for (const p of PH) {
    bySection[p.id] = a.rest.filter((s) => s.tags.includes(p.tag) && !used.has(s));
    bySection[p.id].forEach((s) => used.add(s));
  }
  const phases = PH.map((ph) => {
    const on = phaseId === ph.id;
    return { ...ph, on, onClick: () => setPhaseId(ph.id), bg: on ? "#254D43" : "transparent", fg: on ? "#FAF9F6" : "#254D43", sh: on ? "0 10px 24px -14px rgba(37,77,67,.7)" : "none" };
  });
  const secs = bySection[phaseId];
  const isAfter = phaseId === "after";

  // Each numbered step is one MedlinePlus paragraph or list item. Section headings and
  // lead-ins ("To prepare, you will need to:") are unnumbered subheadings above their steps.
  const cardsRaw = [];
  secs.forEach((s, si) => {
    if (si > 0) cardsRaw.push({ sub: s.heading });
    s.blocks.forEach((b, bi) => {
      const leadIn = b.type === "p" && /:\s*$/.test(b.text) && s.blocks[bi + 1]?.type === "list";
      if (leadIn) cardsRaw.push({ sub: b.text });
      else if (b.type === "p") cardsRaw.push({ p: b.text });
      else b.items.forEach((it) => cardsRaw.push({ p: it.text, kids: it.children }));
    });
  });
  let stepNo = 0;
  const lastStep = cardsRaw.findLastIndex((c) => !c.sub);
  const phaseCards = cardsRaw.map((c, i) => (c.sub ? c : { ...c, n: String(++stepNo), line: i >= lastStep ? "transparent" : "#C9D8C5" }));
  const check = CHECKLISTS[phaseId][lang] || CHECKLISTS[phaseId].en;
  const phase = {
    intro: secs.length
      ? secs[0].heading
      : es
        ? `El resumen de MedlinePlus sobre ${name.toLowerCase()} no describe esta etapa por separado. Su equipo de salud le dará instrucciones para ella; vea las preguntas frecuentes abajo para el resumen completo.`
        : `MedlinePlus’ summary of ${name.toLowerCase()} doesn’t cover this stage separately. Your care team will give you instructions for it; see the questions below for the full summary.`,
    listTitle: check.title,
    list: check.list,
  };
  const listBg = isAfter ? "#F7E7E0" : "#EAF2EB";
  const listFg = isAfter ? "#7A3E2B" : "#254D43";

  const texts = new Set(questions.map((q) => q.text));
  const phaseQs = PHASE_QUESTIONS[phaseId].map((q) => {
    const text = fillTopic(q[lang] || q.en, name.toLowerCase());
    const added = texts.has(text);
    return {
      text,
      added,
      label: added ? (es ? "Agregada ✓" : "Added ✓") : es ? "+ Agregar" : "+ Add",
      bd: added ? "#A8BFA8" : "#254D43",
      bg: added ? "#EAF2EB" : "#FFFEFB",
      fg: "#254D43",
      onAdd: () => {
        update((s) => ({ ...s, questions: [...s.questions, { id: uid(), text, priority: false, source: name, createdAt: new Date().toISOString() }] }));
        toast(es ? "Agregada a Mi cita" : "Added to My Visit");
      },
    };
  });

  const faqSecs = all.filter((s) => !used.has(s) && (s.heading || s.blocks.length));
  const faqAcc = faqSecs.map((s, i) => {
    const open = openAcc[i] ?? i === 0;
    return {
      title: s.heading || (es ? "Resumen" : "Overview"),
      open,
      rot: open ? "rotate(180deg)" : "none",
      onToggle: () => setOpenAcc((o) => ({ ...o, [i]: !open })),
      body: <Blocks blocks={s.blocks} size="16.5px" color="#3D4A45" />,
    };
  });

  const procSaved = saved.some((x) => x.id === def.id);
  const procSaveBg = procSaved ? "#EAF2EB" : "transparent";
  const procSaveFill = procSaved ? "currentColor" : "none";
  const procSaveLabel = procSaved ? (es ? "Guardado" : "Saved") : es ? "Guardar guía" : "Save guide";
  const toggleSaveProc = () => {
    update((s) => ({ ...s, savedProcedures: procSaved ? s.savedProcedures.filter((x) => x.id !== def.id) : [{ id: def.id, savedAt: new Date().toISOString() }, ...s.savedProcedures] }));
    toast(procSaved ? (es ? "Quitado del cuaderno" : "Removed from Notebook") : es ? "Guardado en el cuaderno" : "Saved to Notebook");
  };
  const setProcDraft = (e) => setProcDraftV(e.target.value);
  const saveProcNote = () => {
    update((s) => ({ ...s, careNotes: { ...s.careNotes, [def.id]: procDraft.slice(0, 4000) } }));
    toast(es ? "Nota guardada en este navegador" : "Note saved in this browser");
  };

  const proc = {
    name: topic.title,
    short: lead(a.whatIs, 220),
    sources: [
      { org: "MEDLINEPLUS · NLM", title: topic.title, url: topic.url },
      ...(topic.contributors || []).map((c) => ({ org: es ? "CONTRIBUYENTE" : "CONTRIBUTOR", title: c, url: topic.url })),
    ],
  };
  const langNote = topicState.langMissing ? (es ? "Esta guía no está disponible en MedlinePlus en español. Se muestra en inglés." : "This guide isn’t available in English on MedlinePlus. It’s shown in Spanish.") : null;

  return (
<>
<main style={{maxWidth: "1180px", margin: "0 auto", padding: "32px 24px 110px", animation: "cbUp .35s ease"}}>
<nav aria-label="Breadcrumb" style={{fontSize: "14.5px", color: "#55635E", display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center"}}><button onClick={goNext} style={{background: "none", border: "none", padding: "4px 0", color: "#3F6E6A", fontWeight: "600", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px"}}>{t.nav.next}</button><span aria-hidden="true">›</span><span aria-current="page" style={{color: "#27332F", fontWeight: "500"}}>{proc.name}</span></nav>
<div style={{display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "space-between", alignItems: "flex-end", marginTop: "20px"}}>
<div style={{maxWidth: "760px"}}><h1 style={{margin: "0", fontSize: "clamp(34px,4.4vw,56px)", lineHeight: "1.03", letterSpacing: "-.04em", fontWeight: "600", color: "#254D43"}}>{proc.name}</h1><p style={{margin: "12px 0 0", fontSize: "19px", color: "#3D4A45", textWrap: "pretty"}}>{proc.short}</p></div>
<H as="button" onClick={toggleSaveProc} aria-pressed={procSaved} style={{display: "inline-flex", alignItems: "center", gap: "8px", background: procSaveBg, color: "#254D43", border: "1.5px solid #A8BFA8", borderRadius: "999px", padding: "12px 18px", fontWeight: "600", cursor: "pointer"}} hover={{background: "#EAF2EB"}}><svg width="18" height="18" viewBox="0 0 24 24" fill={procSaveFill} stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" aria-hidden="true"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>{procSaveLabel}</H>
</div>
<div role="note" style={{marginTop: "22px", display: "flex", gap: "14px", alignItems: "flex-start", background: "#F7E7E0", borderRadius: "20px", padding: "18px 20px"}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7A3E2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex: "none", marginTop: "2px"}}><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4M12 16h.01"></path></svg><p style={{margin: "0", color: "#5C2E20", fontSize: "15.5px"}}>{es ? <><strong>Esta guía es educación general.</strong> No reemplaza las instrucciones personalizadas de preparación o de alta de su profesional de salud. Comuníquese con su equipo con preguntas específicas. En una emergencia, llame al 911.</> : <><strong>This guide is general education.</strong> It does not replace the individualized preparation or discharge instructions from your clinician. Contact your treating team with specific questions. For emergencies, call 911.</>}</p></div>
{langNote && <div role="note" style={{marginTop: "14px", background: "#F7E7E0", borderRadius: "16px", padding: "14px 18px", color: "#5C2E20", fontSize: "15px"}}>{langNote}</div>}

<div role="tablist" aria-label="Procedure phases" style={{display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "0", marginTop: "28px", background: "#EAF2EB", borderRadius: "22px", padding: "6px"}}>
{(phases).map((ph, __i) => (<React.Fragment key={__i}>
<button role="tab" aria-selected={ph.on} onClick={ph.onClick} style={{border: "none", borderRadius: "17px", padding: "14px 6px", minWidth: "0", overflowWrap: "anywhere", hyphens: "auto", cursor: "pointer", background: ph.bg, color: ph.fg, boxShadow: ph.sh, textAlign: "center", transition: "background .2s"}}><span style={{display: "block", fontFamily: "'DM Mono',monospace", fontSize: "11.5px", letterSpacing: ".06em", opacity: ".8"}}>{ph.n}</span><span style={{display: "block", fontWeight: "700", fontSize: "17px"}}>{ph.label}</span></button>
</React.Fragment>))}
</div>

<div role="tabpanel" style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap: "24px", marginTop: "26px", alignItems: "start"}}>
<div style={{gridColumn: ctx.narrow ? "auto" : "span 2", minWidth: "0", display: "flex", flexDirection: "column", gap: "20px"}}>
<p style={{margin: "0", fontSize: "19px", lineHeight: "1.6", textWrap: "pretty"}}>{phase.intro}</p>
<ol style={{listStyle: "none", margin: "0", padding: "0", display: "flex", flexDirection: "column", gap: "0"}}>
{(phaseCards).map((c, __i) => (<React.Fragment key={__i}>
{c.sub ? <li style={{margin: "6px 0 12px", fontSize: "17px", fontWeight: "600", color: "#254D43"}}>{c.sub}</li> : <li style={{display: "grid", gridTemplateColumns: "44px minmax(0,1fr)", gap: "16px"}}>
<div style={{display: "flex", flexDirection: "column", alignItems: "center"}}><span style={{width: "40px", height: "40px", borderRadius: "50%", background: "#254D43", color: "#FAF9F6", display: "grid", placeItems: "center", fontWeight: "700", flex: "none"}}>{c.n}</span><span style={{width: "2px", flex: "1", background: c.line, minHeight: "16px"}}></span></div>
<div style={{background: "#FFFEFB", border: "1px solid #E2E8E0", borderRadius: "20px", padding: "18px 20px", marginBottom: "14px"}}>{c.h && <h3 style={{margin: "0", fontSize: "18.5px", fontWeight: "600", color: "#254D43"}}>{c.h}</h3>}{c.p && <p style={{margin: c.h ? "6px 0 0" : "0", color: "#3D4A45", fontSize: "16.5px", textWrap: "pretty"}}>{c.p}</p>}{c.kids?.length > 0 && <div style={{marginTop: "10px"}}><Blocks blocks={c.kids} size="15.5px" color="#3D4A45" /></div>}</div>
</li>}
</React.Fragment>))}
</ol>









<section style={{background: listBg, borderRadius: "22px", padding: "22px 24px"}}>
<div style={{fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".08em", textTransform: "uppercase", color: listFg, fontWeight: "500"}}>{phase.listTitle}</div>
<ul style={{margin: "12px 0 0", padding: "0", listStyle: "none", display: "flex", flexDirection: "column", gap: "10px"}}>{(phase.list).map((x, __i) => (<React.Fragment key={__i}><li style={{display: "flex", gap: "12px", fontSize: "16.5px"}}><span style={{width: "8px", height: "8px", borderRadius: "50%", background: listFg, flex: "none", marginTop: "9px"}}></span>{x}</li></React.Fragment>))}</ul>
{(isAfter) && (<><p style={{margin: "14px 0 0", fontWeight: "600", color: "#5C2E20"}}>{es ? "Si los síntomas son graves o ponen en peligro la vida, llame al 911 o vaya a la sala de emergencias más cercana." : "If symptoms feel severe or life-threatening, call 911 or go to the nearest emergency department."}</p></>)}
</section>
<section>
<h3 style={{margin: "0 0 4px", fontSize: "21px", fontWeight: "600"}}>{es ? "Preguntas para su equipo de salud" : "Questions to ask your healthcare team"}</h3>
<p style={{margin: "0 0 12px", color: "#55635E", fontSize: "15px"}}>{es ? "Agregue cualquiera a su lista de Mi cita." : "Add any of these to your My Visit question list."}</p>
<div style={{display: "flex", flexDirection: "column", gap: "8px"}}>{(phaseQs).map((q, __i) => (<React.Fragment key={__i}><div style={{display: "flex", gap: "12px", alignItems: "center", justifyContent: "space-between", background: "#FFFEFB", border: "1px solid #E2E8E0", borderRadius: "16px", padding: "12px 12px 12px 18px"}}><span style={{fontSize: "16.5px"}}>{q.text}</span><button onClick={q.onAdd} disabled={q.added} style={{flex: "none", borderRadius: "999px", padding: "9px 14px", fontWeight: "600", fontSize: "14px", cursor: "pointer", border: `1.5px solid ${q.bd}`, background: q.bg, color: q.fg}}>{q.label}</button></div></React.Fragment>))}</div>
</section>
<section>
<h3 style={{margin: "0 0 12px", fontSize: "21px", fontWeight: "600"}}>{es ? "El resumen de MedlinePlus" : "The MedlinePlus summary"}</h3>
<div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
{(faqAcc).map((a, __i) => (<React.Fragment key={__i}>
<div style={{background: "#FFFEFB", border: "1px solid #E2E8E0", borderRadius: "18px", overflow: "hidden"}}><h4 style={{margin: "0"}}><H as="button" aria-expanded={a.open} onClick={a.onToggle} style={{width: "100%", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "17px 20px", background: "none", border: "none", cursor: "pointer", fontSize: "17px", fontWeight: "600", color: "#27332F"}} hover={{background: "#F7F9F5"}}>{a.title}<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3F6E6A" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{flex: "none", transform: a.rot, transition: "transform .2s"}}><path d="m6 9 6 6 6-6"></path></svg></H></h4>{(a.open) && (<><div style={{padding: "0 20px 18px"}}>{a.body}</div></>)}</div>
</React.Fragment>))}
</div>
</section>
<SourceLine org={topic.organization || "National Library of Medicine"} title={topic.title} url={topic.url} retrievedAt={topicState.retrievedAt} lang={lang} />
</div>
<aside style={{display: "flex", flexDirection: "column", gap: "16px", position: "sticky", top: "96px", minWidth: "0"}}>
<div style={{background: "#FFFEFB", border: "1px solid #E2E8E0", borderRadius: "24px", padding: "22px"}}>
<h2 style={{margin: "0", fontSize: "18px", fontWeight: "600"}}><label htmlFor="proc-notes">{es ? "Instrucciones de mi equipo de salud" : "Instructions from my care team"}</label></h2>
<p style={{margin: "6px 0 12px", fontSize: "14px", color: "#55635E"}}>{es ? "Anote lo que le dice su propio profesional de salud. Se guarda solo en este navegador." : "Write down what your own clinician tells you. Saved only in this browser."}</p>
<textarea id="proc-notes" rows="7" value={procDraft} onChange={setProcDraft} placeholder={es ? "Escriba aquí las instrucciones de su equipo" : "Type your care team’s instructions here"} maxLength={4000} style={{width: "100%", padding: "12px 14px", borderRadius: "14px", border: "1.5px solid #D5DED3", background: "#FAFBF8", fontSize: "16px", resize: "vertical"}}></textarea>
<H as="button" onClick={saveProcNote} style={{marginTop: "10px", width: "100%", background: "#254D43", color: "#FAF9F6", border: "none", borderRadius: "999px", padding: "12px", fontWeight: "600", cursor: "pointer"}} hover={{background: "#1B3B33"}}>{es ? "Guardar nota" : "Save note"}</H>
</div>
<div style={{background: "#254D43", color: "#FAF9F6", borderRadius: "24px", padding: "22px"}}>
<div style={{fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".08em", color: "#A8BFA8"}}>{es ? "¿QUÉ SIGUE?" : "WHAT HAPPENS NEXT?"}</div>
<p style={{margin: "8px 0 14px", fontSize: "16.5px"}}>{es ? "Lleve sus preguntas a su próxima cita para que no se le olvide nada." : "Bring your questions to your next appointment so nothing gets missed."}</p>
<button onClick={goBuilder} style={{width: "100%", background: "#FAF9F6", color: "#254D43", border: "none", borderRadius: "999px", padding: "12px", fontWeight: "600", cursor: "pointer"}}>{es ? "Abrir el generador de preguntas" : "Open question builder"}</button>
</div>
<div style={{background: "#FFFEFB", border: "1px solid #E2E8E0", borderRadius: "24px", padding: "22px"}}>
<h2 style={{margin: "0 0 10px", fontSize: "16px", fontWeight: "600"}}>{t.c.sources}</h2>
<ul style={{listStyle: "none", margin: "0", padding: "0", display: "flex", flexDirection: "column", gap: "8px"}}>{(proc.sources).map((r, __i) => (<React.Fragment key={__i}><li style={{fontSize: "14.5px"}}><span style={{display: "block", fontFamily: "'DM Mono',monospace", fontSize: "11.5px", color: "#3F6E6A"}}>{r.org}</span><a href={r.url} target="_blank" rel="noopener noreferrer">{r.title} ↗</a></li></React.Fragment>))}</ul>
</div>
</aside>
</div>
</main>
</>
  );
}
