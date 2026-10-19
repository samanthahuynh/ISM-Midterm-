import React, { useEffect, useMemo, useState } from "react";
import { H } from "../ui/H.jsx";
import { Blocks, lead } from "../ui/Blocks.jsx";
import { ErrorCard, Loading, SourceLine } from "../ui/Status.jsx";
import { navigate } from "../lib/router.js";
import { useTopic } from "../lib/useTopic.js";
import { analyze, sectionBlocks } from "../lib/sections.js";
import { update, uid, useStore } from "../data/store.js";
import { askAi, getAiStatus } from "../services/api.js";
import { PROCEDURES, categoryFor, slugOf } from "../content/catalog.js";
import { TOPIC_QUESTIONS, fillTopic } from "../content/questions.js";

// Simplified wrist cross-section shown only for carpal tunnel syndrome.
// Labels name the structures MedlinePlus describes (ligament, median nerve, tendons, bones).
const DIAGRAMS = {
  carpaltunnelsyndrome: {
    en: { lig: "Ligament (roof of the tunnel)", nerve: "Median nerve", tendons: "Tendons", bones: "Wrist bones", note: "Simplified drawing of the carpal tunnel, not to scale." },
    es: { lig: "Ligamento (techo del túnel)", nerve: "Nervio mediano", tendons: "Tendones", bones: "Huesos de la muñeca", note: "Dibujo simplificado del túnel carpiano, no está a escala." },
  },
};

export default function Topic({ ctx }) {
  const { t, lang, toast, prefs, route } = ctx;
  const es = lang === "es";
  const url = route.query.u;
  const titleParam = route.query.t || "";
  const topicState = useTopic(url, titleParam, lang);
  const savedTopics = useStore((s) => s.savedTopics);
  const questions = useStore((s) => s.questions);
  const [level, setLevel] = useState(prefs.level || "simple");
  const [tab, setTab] = useState(route.query.tab || "overview");
  const [openAcc, setOpenAcc] = useState({});
  const [selected, setSelected] = useState({});
  const [condQErr, setCondQErr] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [ai, setAi] = useState({ status: "idle" });

  useEffect(() => {
    getAiStatus().then((s) => setAiEnabled(Boolean(s.enabled)));
  }, []);

  const topic = topicState.status === "done" ? topicState.topic : null;

  // Remember recently viewed topics (title + link only).
  useEffect(() => {
    if (!topic) return;
    update((s) => ({
      ...s,
      recent: [{ url: topic.url, title: topic.title, groups: topic.groups, lang: topic.lang, viewedAt: new Date().toISOString() }, ...s.recent.filter((r) => slugOf(r.url) !== slugOf(topic.url))].slice(0, 10),
    }));
    setAi({ status: "idle" });
  }, [topic?.url]);

  const goUnderstand = () => navigate("/understand");
  const goQsTab = () => {
    setTab("qs");
    document.querySelector('[role="tablist"]')?.scrollIntoView({ behavior: prefs.reduceMotion ? "auto" : "smooth", block: "start" });
  };

  const a = useMemo(() => analyze(topic?.sections || []), [topic]);

  if (!topic) {
    return (
      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 24px 110px" }}>
        <nav aria-label="Breadcrumb" style={{ fontSize: "14.5px", color: "#55635E", display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
          <button onClick={goUnderstand} style={{ background: "none", border: "none", padding: "4px 0", color: "#3F6E6A", fontWeight: "600", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px" }}>{t.nav.understand}</button>
          <span aria-hidden="true">›</span>
          <span aria-current="page" style={{ color: "#27332F", fontWeight: "500" }}>{titleParam}</span>
        </nav>
        <h1 style={{ margin: "20px 0 24px", fontSize: "clamp(36px,4.6vw,60px)", lineHeight: "1.02", letterSpacing: "-.04em", fontWeight: "600", color: "#254D43" }}>{titleParam}</h1>
        {topicState.status === "error" ? (
          <ErrorCard message={topicState.message} onRetry={topicState.retry} fallbackHref={url} fallbackLabel={es ? "Abrir la página en MedlinePlus ↗" : "Open this page on MedlinePlus ↗"} />
        ) : (
          <Loading label={es ? "Cargando tema de MedlinePlus…" : "Loading MedlinePlus topic…"} height="260px" lines={5} />
        )}
      </main>
    );
  }

  const slug = slugOf(topic.url);
  const catObj = categoryFor(topic.groups);
  const cond = {
    name: topic.title,
    catLabel: catObj ? catObj[lang] || catObj.en : topic.groups[0] || "MedlinePlus",
    sub: topic.altTitles.length
      ? `${es ? "También llamado" : "Also called"}: ${topic.altTitles.join(", ")}`
      : es ? "Tema de salud de MedlinePlus (Biblioteca Nacional de Medicina de EE. UU.)" : "MedlinePlus health topic from the U.S. National Library of Medicine",
    good: es
      ? "La situación de cada persona es diferente. Use lo que lea aquí para preparar preguntas; su equipo de salud puede decirle cómo se aplica a usted."
      : "Everyone’s situation is different. Use what you read here to prepare questions; your care team can tell you how it applies to you.",
    next: es
      ? "Su equipo de salud hablará con usted sobre qué opciones son adecuadas para su situación. Lleve sus preguntas a la cita."
      : "Your care team will talk with you about which options fit your situation. Bring your questions to your visit.",
    steps: [a.intro, ...a.rest]
      .filter((s) => s.heading)
      .map((s, i) => ({ n: String(i + 1), h: s.heading, p: lead((s.blocks.find((b) => b.type === "p") || {}).text || "", 140) })),
    sources: [
      { org: es ? "MEDLINEPLUS · BIBLIOTECA NACIONAL DE MEDICINA" : "MEDLINEPLUS · NATIONAL LIBRARY OF MEDICINE", title: topic.title, url: topic.url },
      ...(topic.contributors || []).map((c) => ({ org: es ? "CONTRIBUYENTE SEGÚN MEDLINEPLUS" : "CONTRIBUTOR NAMED BY MEDLINEPLUS", title: c, url: topic.url })),
    ],
  };
  const whatIs = a.whatIs;
  const introRest = a.intro.blocks.filter((b) => !(b.type === "p" && b.text === whatIs));
  const showBody = level !== "simple" && introRest.length > 0;
  const isVisual = level === "visual";
  const isDetailed = level === "detailed";
  const diagSet = DIAGRAMS[slug];
  const hasDiagram = Boolean(diagSet);
  const diag = diagSet ? diagSet[lang] || diagSet.en : null;

  const langNote = topicState.langMissing
    ? es
      ? "Este tema no está disponible en MedlinePlus en español. Se muestra en inglés."
      : "This topic isn’t available in English on MedlinePlus. It’s shown in Spanish."
    : null;
  const esMissing = Boolean(langNote);

  const condLevels = [
    { id: "simple", label: es ? "Sencillo" : "Simple", desc: es ? "Lo esencial en palabras cotidianas" : "Key points in everyday words" },
    { id: "visual", label: "Visual", desc: es ? "Imágenes y tarjetas por partes" : "Pictures and part-by-part cards" },
    { id: "detailed", label: es ? "Detallado" : "Detailed", desc: es ? "El resumen completo de la fuente" : "The full source summary" },
  ].map((o) => {
    const on = level === o.id;
    return { ...o, on, onClick: () => setLevel(o.id), bg: on ? "#254D43" : "#FFFEFB", fg: on ? "#FAF9F6" : "#27332F", sh: on ? "0 10px 24px -14px rgba(37,77,67,.7)" : "none" };
  });

  const symptomSecs = a.pick("symptoms");
  const causeSecs = a.pick("causes").filter((s) => !s.tags.includes("symptoms"));
  const diagSecs = a.pick("diagnosis");
  const treatSecs = [...a.pick("treatment"), ...a.pick("prevention")].filter((s) => !diagSecs.includes(s));
  const hasSC = symptomSecs.length + causeSecs.length > 0;
  const hasDT = diagSecs.length + treatSecs.length > 0;
  const symptomBlocks = sectionBlocks(symptomSecs);
  const causeBlocks = sectionBlocks(causeSecs);

  const TABS = [
    { id: "overview", label: es ? "Resumen" : "Overview", show: true },
    { id: "sc", label: es ? "Síntomas y causas" : "Symptoms & causes", show: hasSC },
    { id: "dt", label: es ? "Diagnóstico y tratamiento" : "Diagnosis & treatment", show: hasDT },
    { id: "qs", label: t.c.qta, show: true },
    { id: "src", label: t.c.sources, show: true },
  ].filter((x) => x.show);
  const activeTab = TABS.some((x) => x.id === tab) ? tab : "overview";
  const condTabs = TABS.map((b) => {
    const on = activeTab === b.id;
    return { ...b, on, onClick: () => setTab(b.id), bd: on ? "#254D43" : "transparent", fw: on ? "700" : "500", fg: on ? "#254D43" : "#55635E" };
  });
  const tabOverview = activeTab === "overview";
  const tabSC = activeTab === "sc";
  const tabDT = activeTab === "dt";
  const tabQs = activeTab === "qs";
  const tabSrc = activeTab === "src";

  const acc = (secs, prefix) =>
    secs.map((s, i) => {
      const key = `${prefix}${i}`;
      const open = openAcc[key] ?? (secs.length === 1 || i === 0);
      return {
        n: String(i + 1),
        title: s.heading,
        open,
        rot: open ? "rotate(180deg)" : "none",
        onToggle: () => setOpenAcc((o) => ({ ...o, [key]: !open })),
        body: <Blocks blocks={s.blocks} size="16.5px" color="#3D4A45" />,
      };
    });
  const diagAcc = acc(diagSecs, "d");
  const treatAcc = acc(treatSecs, "t");

  const isSaved = savedTopics.some((s) => slugOf(s.url) === slug);
  const condSaved = isSaved;
  const saveBtnBg = isSaved ? "#EAF2EB" : "transparent";
  const saveFill = isSaved ? "currentColor" : "none";
  const saveLabel = isSaved ? (es ? "Guardado" : "Saved") : es ? "Guardar en el cuaderno" : "Save to Notebook";
  const toggleSaveCond = () => {
    update((s) => ({
      ...s,
      savedTopics: isSaved ? s.savedTopics.filter((x) => slugOf(x.url) !== slug) : [{ url: topic.url, title: topic.title, groups: topic.groups, lang: topic.lang, savedAt: new Date().toISOString() }, ...s.savedTopics],
    }));
    toast(isSaved ? (es ? "Quitado del cuaderno" : "Removed from Notebook") : es ? "Guardado en el cuaderno" : "Saved to Notebook");
  };

  const qTexts = TOPIC_QUESTIONS.map((q) => fillTopic(q[lang] || q.en, topic.title));
  const existing = new Set(questions.map((q) => q.text));
  const condQs = qTexts.map((text, i) => {
    const on = Boolean(selected[i]);
    return {
      text: existing.has(text) ? `${text} ${es ? "(ya en su lista)" : "(already in your list)"}` : text,
      on,
      onToggle: () => {
        setSelected((s) => ({ ...s, [i]: !s[i] }));
        setCondQErr(false);
      },
      bd: on ? "#254D43" : "#E2E8E0",
      bg: on ? "#EAF2EB" : "#FFFEFB",
    };
  });
  const selCount = Object.values(selected).filter(Boolean).length;
  const addSelLabel = selCount
    ? es ? `Agregar ${selCount} a Mi cita` : `Add ${selCount} to My Visit`
    : es ? "Agregar a Mi cita" : "Add to My Visit";
  const addCondQs = () => {
    const picked = qTexts.filter((_, i) => selected[i] && !existing.has(qTexts[i]));
    if (!selCount) {
      setCondQErr(true);
      return;
    }
    const now = new Date().toISOString();
    update((s) => ({ ...s, questions: [...s.questions, ...picked.map((text) => ({ id: uid(), text, priority: false, source: topic.title, createdAt: now }))] }));
    setSelected({});
    toast(picked.length ? (es ? `${picked.length} pregunta(s) agregada(s) a Mi cita` : `Added ${picked.length} question${picked.length === 1 ? "" : "s"} to My Visit`) : es ? "Ya estaban en su lista" : "Those are already in your list");
  };
  const selectAllCondQs = () => {
    setSelected(Object.fromEntries(qTexts.map((_, i) => [i, true])));
    setCondQErr(false);
  };

  const relatedProcs = PROCEDURES.filter((p) => p.related.includes(slug)).map((p) => ({ name: p.title[lang] || p.title.en, onOpen: () => navigate(`/procedure/${p.id}`) }));
  const noRelated = relatedProcs.length === 0;

  const simplify = async () => {
    setAi({ status: "loading" });
    try {
      const data = await askAi({ task: "simplify", url: topic.url, title: topic.title, lang: topic.lang });
      setAi({ status: "done", text: data.text });
    } catch (e) {
      setAi({ status: "error", message: e.message });
    }
  };
  const headings = [a.intro, ...a.rest].map((s) => s.heading).filter(Boolean);
  const simpleBox = (
    <span style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {ai.status === "done" ? (
        <>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "11px", letterSpacing: ".05em", color: "#7A3E2B" }}>
            {es ? "VERSIÓN SENCILLA CREADA CON IA, SOLO A PARTIR DEL TEXTO DE MEDLINEPLUS. PUEDE CONTENER ERRORES: CONFIRME CON SU EQUIPO DE SALUD." : "PLAIN-LANGUAGE VERSION WRITTEN BY AI FROM THE MEDLINEPLUS TEXT ONLY. IT CAN MAKE MISTAKES: CHECK WITH YOUR CARE TEAM."}
          </span>
          <span style={{ whiteSpace: "pre-line" }}>{ai.text}</span>
        </>
      ) : (
        <>
          <span>{lead(whatIs, 200)}</span>
          {headings.length > 1 && (
            <span style={{ fontSize: "15.5px", color: "#3D4A45" }}>
              {es ? "Esta guía responde: " : "This guide answers: "}
              {headings.join(" · ")}
            </span>
          )}
          {aiEnabled && (
            <span style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>
              <button onClick={simplify} disabled={ai.status === "loading"} style={{ background: "#254D43", color: "#FAF9F6", border: "none", borderRadius: "999px", padding: "10px 16px", fontWeight: "600", fontSize: "14.5px", cursor: "pointer", opacity: ai.status === "loading" ? 0.6 : 1 }}>
                {ai.status === "loading" ? (es ? "Preparando…" : "Simplifying…") : es ? "Explicar todo el tema con palabras sencillas (IA)" : "Explain the whole topic in simpler words (AI)"}
              </button>
              {ai.status === "error" && <span role="alert" style={{ color: "#8A3A22", fontSize: "14.5px" }}>{ai.message}</span>}
              <span style={{ fontSize: "13px", color: "#55635E" }}>{es ? "Solo se envía el nombre del tema. Nada de lo que usted escribe se comparte." : "Only the topic name is sent. Nothing you’ve typed is shared."}</span>
            </span>
          )}
        </>
      )}
    </span>
  );

  return (
<>
<main style={{maxWidth: "1280px", margin: "0 auto", padding: "32px 24px 110px", animation: "cbUp .35s ease"}}>
<nav aria-label="Breadcrumb" style={{fontSize: "14.5px", color: "#55635E", display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center"}}>
<button onClick={goUnderstand} style={{background: "none", border: "none", padding: "4px 0", color: "#3F6E6A", fontWeight: "600", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px"}}>{t.nav.understand}</button><span aria-hidden="true">›</span><span>{cond.catLabel}</span><span aria-hidden="true">›</span><span aria-current="page" style={{color: "#27332F", fontWeight: "500"}}>{cond.name}</span>
</nav>
<div style={{display: "flex", flexWrap: "wrap", gap: "24px", justifyContent: "space-between", alignItems: "flex-end", marginTop: "20px"}}>
<div style={{maxWidth: "760px"}}>
<h1 style={{margin: "0", fontSize: "clamp(36px,4.6vw,60px)", lineHeight: "1.02", letterSpacing: "-.04em", fontWeight: "600", color: "#254D43", textWrap: "balance"}}>{cond.name}</h1>
<p style={{margin: "12px 0 0", fontSize: "19px", color: "#3D4A45", textWrap: "pretty"}}>{cond.sub}</p>
</div>
<div style={{display: "flex", gap: "10px", flexWrap: "wrap"}}>
<H as="button" onClick={toggleSaveCond} aria-pressed={condSaved} style={{display: "inline-flex", alignItems: "center", gap: "8px", background: saveBtnBg, color: "#254D43", border: "1.5px solid #A8BFA8", borderRadius: "999px", padding: "12px 18px", fontWeight: "600", cursor: "pointer"}} hover={{background: "#EAF2EB"}}><svg width="18" height="18" viewBox="0 0 24 24" fill={saveFill} stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" aria-hidden="true"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>{saveLabel}</H>
<H as="button" onClick={goQsTab} style={{background: "#254D43", color: "#FAF9F6", border: "none", borderRadius: "999px", padding: "13px 20px", fontWeight: "600", cursor: "pointer"}} hover={{background: "#1B3B33"}}>{t.c.prepare}</H>
</div>
</div>

{(esMissing) && (<><div role="note" style={{marginTop: "20px", background: "#F7E7E0", borderRadius: "16px", padding: "14px 18px", color: "#5C2E20", fontSize: "15px"}}>{langNote}</div></>)}

<section aria-labelledby="lvl-h" style={{marginTop: "28px", background: "#EAF2EB", borderRadius: "24px", padding: "18px"}}>
<h2 id="lvl-h" style={{margin: "0 0 12px 6px", fontSize: "15px", fontWeight: "600", color: "#254D43"}}>{t.c.level}</h2>
<div role="radiogroup" aria-labelledby="lvl-h" style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,190px),1fr))", gap: "8px"}}>
{(condLevels).map((o, __i) => (<React.Fragment key={__i}>
<button role="radio" aria-checked={o.on} onClick={o.onClick} style={{textAlign: "left", padding: "14px 18px", borderRadius: "16px", border: "none", background: o.bg, color: o.fg, cursor: "pointer", transition: "background .2s", boxShadow: o.sh}}><span style={{display: "block", fontWeight: "700", fontSize: "17px"}}>{o.label}</span><span style={{display: "block", fontSize: "14px", opacity: ".85"}}>{o.desc}</span></button>
</React.Fragment>))}
</div>
</section>

<div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: "28px", marginTop: "28px", alignItems: "start"}}>
<div style={{gridColumn: ctx.narrow ? "auto" : "span 2", minWidth: "0", maxWidth: "100%"}}>
<div role="tablist" aria-label="Guide sections" style={{display: "flex", gap: "4px", overflowX: "auto", borderBottom: "1.5px solid #E2E8E0", paddingBottom: "0"}}>
{(condTabs).map((b, __i) => (<React.Fragment key={__i}>
<button role="tab" aria-selected={b.on} onClick={b.onClick} style={{flex: "none", background: "none", border: "none", borderBottom: `3px solid ${b.bd}`, marginBottom: "-1.5px", padding: "12px 16px", fontWeight: b.fw, color: b.fg, cursor: "pointer", fontSize: "16px"}}>{b.label}</button>
</React.Fragment>))}
</div>
<div role="tabpanel" style={{paddingTop: "28px", display: "flex", flexDirection: "column", gap: "22px"}}>

{(tabOverview) && (<>
<section style={{display: "flex", flexDirection: "column", gap: "12px"}}>
<h2 style={{margin: "0", fontSize: "26px", letterSpacing: "-.025em", fontWeight: "600"}}>{t.c.whatIs}</h2>
<p style={{margin: "0", fontSize: "19px", lineHeight: "1.6", maxWidth: "720px", textWrap: "pretty"}}>{whatIs}</p>
</section>
{(isVisual) && (<>
<section aria-label="Visual explanation" style={{background: "#FFFEFB", border: "1px solid #E2E8E0", borderRadius: "24px", padding: "24px", display: "flex", flexDirection: "column", gap: "18px"}}>
{(hasDiagram) && (<>
<figure style={{margin: "0", background: "#F4F7F2", borderRadius: "18px", padding: "24px 16px 18px"}}>
<div aria-hidden="true" style={{maxWidth: "420px", margin: "0 auto", border: "2.5px solid #A8BFA8", borderRadius: "120px 120px 60px 60px", background: "#FAFBF8", padding: "0 18px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px"}}>
<div style={{width: "86%", height: "14px", background: "#254D43", borderRadius: "0 0 10px 10px"}}></div>
<div style={{display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "8px", maxWidth: "260px"}}><span style={{width: "22px", height: "22px", borderRadius: "50%", background: "#C9D8C5"}}></span><span style={{width: "22px", height: "22px", borderRadius: "50%", background: "#C9D8C5"}}></span><span style={{width: "22px", height: "22px", borderRadius: "50%", background: "#C9D8C5"}}></span><span style={{width: "36px", height: "36px", borderRadius: "50%", background: "#E9B8A6", border: "3px solid #C97F67"}}></span><span style={{width: "22px", height: "22px", borderRadius: "50%", background: "#C9D8C5"}}></span><span style={{width: "22px", height: "22px", borderRadius: "50%", background: "#C9D8C5"}}></span><span style={{width: "22px", height: "22px", borderRadius: "50%", background: "#C9D8C5"}}></span><span style={{width: "22px", height: "22px", borderRadius: "50%", background: "#C9D8C5"}}></span><span style={{width: "22px", height: "22px", borderRadius: "50%", background: "#C9D8C5"}}></span><span style={{width: "22px", height: "22px", borderRadius: "50%", background: "#C9D8C5"}}></span></div>
<div style={{display: "flex", gap: "6px"}}><span style={{width: "44px", height: "26px", borderRadius: "12px", background: "#DDE4DB"}}></span><span style={{width: "44px", height: "26px", borderRadius: "12px", background: "#DDE4DB"}}></span><span style={{width: "44px", height: "26px", borderRadius: "12px", background: "#DDE4DB"}}></span><span style={{width: "44px", height: "26px", borderRadius: "12px", background: "#DDE4DB"}}></span></div>
</div>
<figcaption style={{display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "14px", marginTop: "16px", fontSize: "14px", color: "#3D4A45"}}>
<span style={{display: "flex", alignItems: "center", gap: "6px"}}><span style={{width: "18px", height: "8px", background: "#254D43", borderRadius: "3px"}}></span>{diag.lig}</span>
<span style={{display: "flex", alignItems: "center", gap: "6px"}}><span style={{width: "14px", height: "14px", borderRadius: "50%", background: "#E9B8A6", border: "2px solid #C97F67"}}></span>{diag.nerve}</span>
<span style={{display: "flex", alignItems: "center", gap: "6px"}}><span style={{width: "12px", height: "12px", borderRadius: "50%", background: "#C9D8C5"}}></span>{diag.tendons}</span>
<span style={{display: "flex", alignItems: "center", gap: "6px"}}><span style={{width: "18px", height: "10px", borderRadius: "5px", background: "#DDE4DB"}}></span>{diag.bones}</span>
</figcaption>
<p style={{margin: "10px 0 0", textAlign: "center", fontSize: "12.5px", color: "#55635E"}}>{diag.note}</p>
</figure>
</>)}



<ol style={{listStyle: "none", margin: "0", padding: "0", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,170px),1fr))", gap: "12px"}}>
{(cond.steps).map((st, __i) => (<React.Fragment key={__i}>
<li style={{background: "#F4F7F2", borderRadius: "16px", padding: "16px", display: "flex", flexDirection: "column", gap: "6px"}}><span style={{fontFamily: "'DM Mono',monospace", fontSize: "12px", color: "#3F6E6A"}}>{es ? "PARTE" : "PART"} {st.n}</span><span style={{fontWeight: "700", color: "#254D43"}}>{st.h}</span><span style={{fontSize: "15px", color: "#3D4A45"}}>{st.p}</span></li>
</React.Fragment>))}
</ol>
</section>
</>)}
<aside style={{background: "#EAF2EB", borderRadius: "22px", padding: "22px 24px"}}>
<div style={{fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".08em", textTransform: "uppercase", color: "#254D43", fontWeight: "500"}}>{t.c.simpleTerms}</div>
<div style={{margin: "8px 0 0", fontSize: "18px", lineHeight: "1.55", textWrap: "pretty"}}>{simpleBox}</div>
</aside>
{showBody && (<section style={{display: "flex", flexDirection: "column", gap: "12px"}}>
<h2 style={{margin: "0", fontSize: "26px", letterSpacing: "-.025em", fontWeight: "600"}}>{t.c.inside}</h2>
<Blocks blocks={introRest} size="18px" />
{(isDetailed) && (<><div style={{borderLeft: "3px solid #6A9C98", padding: "4px 0 4px 18px", maxWidth: "720px"}}><div style={{fontSize: "13px", fontWeight: "700", color: "#3F6E6A", textTransform: "uppercase", letterSpacing: ".06em"}}>{t.c.inDepth}</div><div style={{marginTop: "10px", display: "flex", flexDirection: "column", gap: "18px"}}>{a.rest.map((s, i) => <div key={i}><Blocks blocks={sectionBlocks([s], true)} size="17px" color="#3D4A45" /></div>)}</div></div></>)}
</section>)}
<aside style={{background: "#F7E7E0", borderRadius: "22px", padding: "22px 24px"}}>
<div style={{fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".08em", textTransform: "uppercase", color: "#7A3E2B", fontWeight: "500"}}>{t.c.good}</div>
<p style={{margin: "8px 0 0", fontSize: "17px", lineHeight: "1.55", textWrap: "pretty"}}>{cond.good}</p>
</aside>
<SourceLine org={topic.organization || "National Library of Medicine"} title={topic.title} url={topic.url} retrievedAt={topicState.retrievedAt} lang={lang} />
</>)}

{(tabSC) && (<>
<div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))", gap: "16px"}}>
<section style={{background: "#FFFEFB", border: "1px solid #E2E8E0", borderRadius: "24px", padding: "24px"}}>
<h2 style={{margin: "0 0 14px", fontSize: "22px", letterSpacing: "-.02em", fontWeight: "600"}}>{t.c.symptoms}</h2>
{symptomBlocks.length ? <Blocks blocks={symptomBlocks} dot="#E9B8A6" size="16.5px" /> : <p style={{margin: 0, color: "#55635E"}}>{es ? "Este tema de MedlinePlus no tiene una sección de síntomas." : "This MedlinePlus topic has no separate symptoms section."}</p>}


</section>
<section style={{background: "#FFFEFB", border: "1px solid #E2E8E0", borderRadius: "24px", padding: "24px"}}>
<h2 style={{margin: "0 0 14px", fontSize: "22px", letterSpacing: "-.02em", fontWeight: "600"}}>{t.c.causes}</h2>
{causeBlocks.length ? <Blocks blocks={causeBlocks} dot="#A8BFA8" size="16.5px" /> : <p style={{margin: 0, color: "#55635E"}}>{es ? "Este tema de MedlinePlus no tiene una sección de causas." : "This MedlinePlus topic has no separate causes section."}</p>}


</section>
</div>
<p style={{margin: "0", fontSize: "15px", color: "#55635E"}}>{es ? "Tener un factor de riesgo no significa que tenga o vaya a tener una afección. Solo un profesional de la salud puede evaluar sus síntomas." : "Having a risk factor doesn’t mean you have or will develop a condition. Only a clinician can evaluate your symptoms."}</p>
</>)}

{(tabDT) && (<>
{diagAcc.length > 0 && (<section style={{display: "flex", flexDirection: "column", gap: "10px"}}>
<h2 style={{margin: "0 0 6px", fontSize: "24px", letterSpacing: "-.02em", fontWeight: "600"}}>{t.c.diag}</h2>
{(diagAcc).map((a, __i) => (<React.Fragment key={__i}>
<div style={{background: "#FFFEFB", border: "1px solid #E2E8E0", borderRadius: "18px", overflow: "hidden"}}>
<h3 style={{margin: "0"}}><H as="button" aria-expanded={a.open} onClick={a.onToggle} style={{width: "100%", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "18px 20px", background: "none", border: "none", cursor: "pointer", fontSize: "17px", fontWeight: "600", color: "#27332F"}} hover={{background: "#F7F9F5"}}><span style={{display: "flex", gap: "14px", alignItems: "center"}}><span style={{width: "30px", height: "30px", borderRadius: "50%", background: "#EAF2EB", color: "#254D43", display: "grid", placeItems: "center", fontSize: "14px", fontWeight: "700", flex: "none"}}>{a.n}</span>{a.title}</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3F6E6A" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{flex: "none", transform: a.rot, transition: "transform .2s"}}><path d="m6 9 6 6 6-6"></path></svg></H></h3>
{(a.open) && (<><div style={{padding: "0 20px 20px 64px"}}>{a.body}</div></>)}
</div>
</React.Fragment>))}
</section>)}
{treatAcc.length > 0 && (<section style={{display: "flex", flexDirection: "column", gap: "10px"}}>
<h2 style={{margin: "10px 0 6px", fontSize: "24px", letterSpacing: "-.02em", fontWeight: "600"}}>{t.c.treat}</h2>
{(treatAcc).map((a, __i) => (<React.Fragment key={__i}>
<div style={{background: "#FFFEFB", border: "1px solid #E2E8E0", borderRadius: "18px", overflow: "hidden"}}>
<h3 style={{margin: "0"}}><H as="button" aria-expanded={a.open} onClick={a.onToggle} style={{width: "100%", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "18px 20px", background: "none", border: "none", cursor: "pointer", fontSize: "17px", fontWeight: "600", color: "#27332F"}} hover={{background: "#F7F9F5"}}><span style={{display: "flex", gap: "14px", alignItems: "center"}}><span style={{width: "30px", height: "30px", borderRadius: "50%", background: "#F7E7E0", color: "#7A3E2B", display: "grid", placeItems: "center", fontSize: "14px", fontWeight: "700", flex: "none"}}>{a.n}</span>{a.title}</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3F6E6A" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{flex: "none", transform: a.rot, transition: "transform .2s"}}><path d="m6 9 6 6 6-6"></path></svg></H></h3>
{(a.open) && (<><div style={{padding: "0 20px 20px 64px"}}>{a.body}</div></>)}
</div>
</React.Fragment>))}
</section>)}
<aside style={{background: "#254D43", color: "#FAF9F6", borderRadius: "22px", padding: "22px 24px"}}>
<div style={{fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".08em", textTransform: "uppercase", color: "#A8BFA8", fontWeight: "500"}}>{t.c.next}</div>
<p style={{margin: "8px 0 0", fontSize: "17px", lineHeight: "1.55", textWrap: "pretty"}}>{cond.next}</p>
</aside>
</>)}

{(tabQs) && (<>
<aside style={{background: "#EAF2EB", borderRadius: "22px", padding: "22px 24px"}}>
<div style={{fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".08em", textTransform: "uppercase", color: "#254D43", fontWeight: "500"}}>{t.c.qta}</div>
<p style={{margin: "8px 0 0", fontSize: "17px"}}>{t.c.selectHint}</p>
</aside>
<fieldset style={{border: "none", margin: "0", padding: "0", display: "flex", flexDirection: "column", gap: "10px"}}>
<legend style={{fontSize: "24px", letterSpacing: "-.02em", fontWeight: "600", marginBottom: "12px"}}>{t.c.questions}</legend>
{(condQs).map((q, __i) => (<React.Fragment key={__i}>
<label style={{display: "flex", gap: "14px", alignItems: "flex-start", padding: "16px 18px", borderRadius: "18px", border: `2px solid ${q.bd}`, background: q.bg, cursor: "pointer", transition: "background .15s,border-color .15s"}}>
<input type="checkbox" checked={q.on} onChange={q.onToggle} style={{width: "22px", height: "22px", accentColor: "#254D43", flex: "none", margin: "2px 0 0"}} />
<span style={{fontSize: "17px"}}>{q.text}</span>
</label>
</React.Fragment>))}
</fieldset>
{(condQErr) && (<><p role="alert" style={{margin: "0", color: "#8A3A22", fontWeight: "500"}}>{es ? "Elija al menos una pregunta, o use “Elegir todas”." : "Select at least one question to add, or choose “Select all”."}</p></>)}
<div style={{display: "flex", flexWrap: "wrap", gap: "10px"}}>
<H as="button" onClick={addCondQs} style={{display: "inline-flex", alignItems: "center", gap: "8px", background: "#254D43", color: "#FAF9F6", border: "none", borderRadius: "999px", padding: "14px 22px", fontWeight: "600", cursor: "pointer"}} hover={{background: "#1B3B33"}}>{addSelLabel} →</H>
<H as="button" onClick={selectAllCondQs} style={{background: "transparent", color: "#254D43", border: "1.5px solid #A8BFA8", borderRadius: "999px", padding: "13px 20px", fontWeight: "600", cursor: "pointer"}} hover={{background: "#EAF2EB"}}>{es ? "Elegir todas" : "Select all"}</H>
</div>
</>)}

{(tabSrc) && (<>
<section>
<h2 style={{margin: "0 0 6px", fontSize: "24px", letterSpacing: "-.02em", fontWeight: "600"}}>{t.c.sources}</h2>
<p style={{margin: "0 0 16px", color: "#55635E", fontSize: "15px"}}>{es ? "CareBridge muestra el resumen de MedlinePlus tal como lo publica la Biblioteca Nacional de Medicina, sin cambiar el contenido médico. Las versiones sencillas hechas con IA están identificadas." : "CareBridge shows the MedlinePlus summary as published by the National Library of Medicine, without changing the medical content. AI plain-language versions are always labeled."}</p>
<ul style={{listStyle: "none", margin: "0", padding: "0", display: "flex", flexDirection: "column", gap: "10px"}}>
{(cond.sources).map((r, __i) => (<React.Fragment key={__i}>
<li style={{background: "#FFFEFB", border: "1px solid #E2E8E0", borderRadius: "18px", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "2px"}}><span style={{fontFamily: "'DM Mono',monospace", fontSize: "12px", color: "#3F6E6A", letterSpacing: ".04em"}}>{r.org}</span><a href={r.url} target="_blank" rel="noopener noreferrer" style={{fontWeight: "600", fontSize: "17px"}}>{r.title} ↗</a></li>
</React.Fragment>))}
</ul>
</section>
</>)}
</div>
</div>

<aside style={{display: "flex", flexDirection: "column", gap: "16px", position: "sticky", top: "96px", minWidth: "0"}}>
<div style={{background: "#254D43", color: "#FAF9F6", borderRadius: "24px", padding: "24px"}}>
<div style={{fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".08em", color: "#A8BFA8"}}>{es ? "MI CITA" : "MY VISIT"}</div>
<p style={{margin: "8px 0 16px", fontSize: "19px", fontWeight: "500", lineHeight: "1.35"}}>{es ? "Convierta lo que aprendió en preguntas para su médico." : "Turn what you’ve learned into questions for your doctor."}</p>
<H as="button" onClick={goQsTab} style={{width: "100%", background: "#FAF9F6", color: "#254D43", border: "none", borderRadius: "999px", padding: "13px", fontWeight: "600", cursor: "pointer"}} hover={{background: "#EAF2EB"}}>{t.c.prepare}</H>
</div>
<div style={{background: "#FFFEFB", border: "1px solid #E2E8E0", borderRadius: "24px", padding: "22px"}}>
<h2 style={{margin: "0 0 12px", fontSize: "17px", fontWeight: "600"}}>{t.c.related}</h2>
{(relatedProcs).map((r, __i) => (<React.Fragment key={__i}><H as="button" onClick={r.onOpen} style={{width: "100%", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", padding: "12px 14px", borderRadius: "14px", border: "1px solid #EEF1EC", background: "#FAFBF8", cursor: "pointer", marginBottom: "8px", fontWeight: "600", color: "#254D43"}} hover={{background: "#EAF2EB"}}>{r.name}<span aria-hidden="true">→</span></H></React.Fragment>))}
{(noRelated) && (<><p style={{margin: "0", color: "#55635E", fontSize: "15px"}}>{es ? "Aún no hay guías relacionadas." : "No related procedure guides yet."}</p></>)}
</div>
<p style={{margin: "0", fontSize: "14px", color: "#55635E", padding: "0 6px"}}>{t.c.disclaimer} {es ? "En una emergencia, llame al 911." : "In an emergency, call 911."}</p>
</aside>
</div>
</main>
</>
  );
}
