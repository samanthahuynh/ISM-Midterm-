import React, { useState } from "react";
import { H } from "../ui/H.jsx";
import { navigate, openTopic } from "../lib/router.js";
import { useStore } from "../data/store.js";
import { TIPS } from "../content/questions.js";
import { categoryFor, tintFor } from "../content/catalog.js";
import { formatDate, formatTime, orderedQuestions, visitProgress } from "../lib/visit.js";

const ICONS = {
  book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5",
  clipboard: "M9 2h6v4H9zM16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 12h6M9 16h4",
  chat: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zM9 9h6M9 13h3",
  steps: "M4 17h4v-4h4V9h4V5h4",
};

export default function Dashboard({ ctx }) {
  const { t, lang } = ctx;
  const appt = useStore((s) => s.appointment);
  const questions = useStore((s) => s.questions);
  const recent = useStore((s) => s.recent);
  const [tipIdx, setTipIdx] = useState(() => new Date().getDate() % TIPS.length);
  const es = lang === "es";

  const goVisit = () => navigate("/visit/1");
  const goSummary = () => navigate("/visit/4");
  const goBuilder = () => navigate("/visit/3");
  const goUnderstand = () => navigate("/understand");

  const { pct } = visitProgress(appt, questions);
  const apptDate = appt.date ? formatDate(appt.date, lang) : es ? "Sin cita guardada" : "No appointment saved yet";
  const apptLine = appt.date
    ? [formatTime(appt.time, lang), appt.specialty, appt.clinician].filter(Boolean).join(" · ")
    : es ? "Agregue la fecha en Mi cita para empezar." : "Add the date in My Visit to get started.";
  const prepPctNum = String(pct);
  const prepPct = `${pct}%`;
  const prepPctLabel = `${pct}%`;

  const tipObj = TIPS[tipIdx];
  const tip = tipObj[lang] || tipObj.en;
  const nextTip = () => setTipIdx((i) => (i + 1) % TIPS.length);

  const dashCards = [
    { title: es ? "Entender un tema de salud" : "Understand a health topic", desc: es ? "Busque en MedlinePlus y elija cómo se explica." : "Search MedlinePlus and choose how it’s explained.", icon: ICONS.book, path: "/understand", dark: true },
    { title: es ? "Prepararme para mi cita" : "Prepare for my visit", desc: es ? `Preparación al ${pct}%.` : `Your visit prep is ${pct}% done.`, icon: ICONS.clipboard, path: "/visit/1" },
    { title: es ? "Crear mis preguntas" : "Build my questions", desc: es ? `${questions.length} pregunta(s) guardada(s).` : `${questions.length} question${questions.length === 1 ? "" : "s"} saved so far.`, icon: ICONS.chat, path: "/visit/3" },
    { title: es ? "Guías de procedimientos" : "Procedure guides", desc: es ? "Qué esperar antes, durante y después." : "What to expect before, during and after.", icon: ICONS.steps, path: "/next" },
  ].map((c) => ({
    ...c,
    onClick: () => navigate(c.path),
    bg: c.dark ? "#254D43" : "#FFFEFB",
    bd: c.dark ? "#254D43" : "#E2E8E0",
    iconBg: c.dark ? "rgba(250,249,246,.14)" : "#EAF2EB",
    iconFg: c.dark ? "#FAF9F6" : "#254D43",
    fg: c.dark ? "#FAF9F6" : "#254D43",
    sub: c.dark ? "#D7E2D6" : "#3D4A45",
  }));

  const dashQs = orderedQuestions(questions)
    .slice(0, 4)
    .map((q) => ({ text: q.text, starFill: q.priority ? "#E9B8A6" : "none", starStroke: q.priority ? "#C97F67" : "#A8BFA8" }));
  const hasQs = dashQs.length > 0;
  const noQs = !hasQs;

  const recentList = recent.slice(0, 4).map((r) => {
    const cat = categoryFor(r.groups || []);
    return {
      name: r.title,
      cat: cat ? cat[lang] || cat.en : "MedlinePlus",
      tint: tintFor(r.url),
      onOpen: () => openTopic(r.url, r.title),
    };
  });
  const hasRecent = recentList.length > 0;
  const noRecent = !hasRecent;

  const quick = [
    { label: es ? "Buscar una palabra médica" : "Look up a medical word", onClick: () => navigate("/understand", { focus: "terms" }) },
    { label: es ? "Hoja de la cita" : "Visit sheet", onClick: goSummary },
    { label: es ? "Notas de la cita" : "Visit notes", onClick: () => navigate("/notebook", { tab: "notes" }) },
    { label: es ? "Ajustes de accesibilidad" : "Accessibility settings", onClick: ctx.openPrefs },
    { label: es ? "Cómo usamos sus datos" : "How we use your data", onClick: () => ctx.openInfo("privacy") },
  ];

  return (
<>
<main style={{maxWidth: "1280px", margin: "0 auto", padding: "44px 24px 110px", animation: "cbUp .35s ease"}}>
<div style={{display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "space-between", alignItems: "flex-end"}}>
<div>
<div style={{display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap"}}><span style={{fontSize: "17px", color: "#3F6E6A", fontWeight: "500"}}>{t.dash.hello}</span><span style={{fontFamily: "'DM Mono',monospace", fontSize: "11px", letterSpacing: ".06em", background: "#F6E3DB", color: "#7A3E2B", padding: "4px 9px", borderRadius: "999px"}}>DEMO DATA · FICTIONAL PROFILE</span></div>
<h1 style={{margin: "10px 0 0", fontSize: "clamp(36px,4.6vw,60px)", lineHeight: "1.02", letterSpacing: "-.04em", fontWeight: "600", color: "#254D43", textWrap: "balance"}}>{t.dash.title}</h1>
<p style={{margin: "12px 0 0", color: "#55635E", fontSize: "18px"}}>{t.dash.sub}</p>
</div>
</div>
<div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,250px),1fr))", gap: "16px", marginTop: "36px"}}>
{(dashCards).map((c, __i) => (<React.Fragment key={__i}>
<H as="button" onClick={c.onClick} style={{textAlign: "left", background: c.bg, border: `1px solid ${c.bd}`, borderRadius: "26px", padding: "24px", cursor: "pointer", display: "flex", flexDirection: "column", gap: "10px", minHeight: "210px", transition: "transform .25s,box-shadow .25s"}} hover={{transform: "translateY(-3px)", boxShadow: "0 22px 44px -26px rgba(37,77,67,.4)"}}>
<span style={{width: "48px", height: "48px", borderRadius: "15px", background: c.iconBg, display: "grid", placeItems: "center", color: c.iconFg}}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={c.icon}></path></svg></span>
<span style={{fontSize: "21px", fontWeight: "600", letterSpacing: "-.02em", color: c.fg, marginTop: "auto", lineHeight: "1.2"}}>{c.title}</span>
<span style={{fontSize: "15px", color: c.sub}}>{c.desc}</span>
</H>
</React.Fragment>))}
</div>

<div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,360px),1fr))", gap: "16px", marginTop: "16px"}}>
<div style={{background: "#FFFEFB", border: "1px solid #E2E8E0", borderRadius: "26px", padding: "26px", display: "flex", flexDirection: "column", gap: "14px"}}>
<div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}><h2 style={{margin: "0", fontSize: "15px", fontWeight: "600", color: "#3F6E6A", display: "flex", alignItems: "center", gap: "8px"}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path></svg>Upcoming appointment</h2><span style={{fontFamily: "'DM Mono',monospace", fontSize: "11px", color: "#55635E"}}>DEMO</span></div>
<div><div style={{fontSize: "26px", fontWeight: "600", letterSpacing: "-.025em", color: "#254D43", lineHeight: "1.15"}}>{apptDate}</div><div style={{color: "#3D4A45", marginTop: "4px"}}>{apptLine}</div></div>
<div><div style={{display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#3D4A45"}}><span>Visit preparation</span><span style={{fontWeight: "600"}}>{prepPctLabel}</span></div><div role="progressbar" aria-label="Visit preparation progress" aria-valuenow={prepPctNum} aria-valuemin="0" aria-valuemax="100" style={{height: "8px", background: "#EAF2EB", borderRadius: "9px", marginTop: "8px", overflow: "hidden"}}><div style={{height: "100%", width: prepPct, background: "#6A9C98", borderRadius: "9px", transition: "width .4s"}}></div></div></div>
<div style={{display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "auto"}}><H as="button" onClick={goVisit} style={{background: "#254D43", color: "#FAF9F6", border: "none", borderRadius: "999px", padding: "12px 20px", fontWeight: "600", cursor: "pointer"}} hover={{background: "#1B3B33"}}>Continue preparing</H><H as="button" onClick={goSummary} style={{background: "transparent", color: "#254D43", border: "1.5px solid #A8BFA8", borderRadius: "999px", padding: "11px 18px", fontWeight: "600", cursor: "pointer"}} hover={{background: "#EAF2EB"}}>View visit sheet</H></div>
</div>
<div style={{background: "#F7E7E0", borderRadius: "26px", padding: "26px", display: "flex", flexDirection: "column", gap: "12px"}}>
<h2 style={{margin: "0", fontSize: "15px", fontWeight: "600", color: "#7A3E2B", display: "flex", alignItems: "center", gap: "8px"}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path><path d="M9 18h6M10 22h4"></path></svg>Today’s communication tip</h2>
<p style={{margin: "0", fontSize: "21px", lineHeight: "1.4", letterSpacing: "-.01em", color: "#27332F", fontWeight: "500", textWrap: "pretty"}}>{tip}</p>
<H as="button" onClick={nextTip} style={{marginTop: "auto", alignSelf: "flex-start", background: "#FFFEFB", border: "none", borderRadius: "999px", padding: "10px 16px", fontWeight: "600", cursor: "pointer", color: "#7A3E2B"}} hover={{background: "#FBF3EF"}}>Another tip</H>
</div>
</div>

<div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,360px),1fr))", gap: "16px", marginTop: "16px"}}>
<div style={{background: "#FFFEFB", border: "1px solid #E2E8E0", borderRadius: "26px", padding: "26px"}}>
<div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px"}}><h2 style={{margin: "0", fontSize: "19px", fontWeight: "600", letterSpacing: "-.015em"}}>Saved questions</h2><button onClick={goBuilder} style={{background: "none", border: "none", color: "#3F6E6A", fontWeight: "600", cursor: "pointer", padding: "6px"}}>Open builder →</button></div>
{(hasQs) && (<>
<ul style={{listStyle: "none", margin: "14px 0 0", padding: "0", display: "flex", flexDirection: "column"}}>
{(dashQs).map((q, __i) => (<React.Fragment key={__i}>
<li style={{display: "flex", gap: "10px", padding: "11px 0", borderTop: "1px solid #EEF1EC", fontSize: "15.5px"}}><svg width="16" height="16" viewBox="0 0 24 24" fill={q.starFill} stroke={q.starStroke} strokeWidth="1.6" aria-hidden="true" style={{flex: "none", marginTop: "3px"}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>{q.text}</li>
</React.Fragment>))}
</ul>
</>)}
{(noQs) && (<><p style={{margin: "14px 0 0", color: "#55635E", fontSize: "15px", background: "#F4F7F2", padding: "16px", borderRadius: "14px"}}>No questions yet. Browse a condition guide or the question builder to add some.</p></>)}
</div>
<div style={{background: "#FFFEFB", border: "1px solid #E2E8E0", borderRadius: "26px", padding: "26px"}}>
<div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px"}}><h2 style={{margin: "0", fontSize: "19px", fontWeight: "600", letterSpacing: "-.015em"}}>Recently viewed</h2><button onClick={goUnderstand} style={{background: "none", border: "none", color: "#3F6E6A", fontWeight: "600", cursor: "pointer", padding: "6px"}}>Library →</button></div>
{(hasRecent) && (<>
<ul style={{listStyle: "none", margin: "14px 0 0", padding: "0", display: "flex", flexDirection: "column", gap: "8px"}}>
{(recentList).map((r, __i) => (<React.Fragment key={__i}>
<li><H as="button" onClick={r.onOpen} style={{width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "16px", border: "1px solid #EEF1EC", background: "#FAFBF8", cursor: "pointer"}} hover={{background: "#EAF2EB"}}><span style={{width: "38px", height: "38px", borderRadius: "12px", background: r.tint, flex: "none"}}></span><span style={{flex: "1"}}><span style={{display: "block", fontWeight: "600"}}>{r.name}</span><span style={{display: "block", fontSize: "13.5px", color: "#55635E"}}>{r.cat}</span></span><span aria-hidden="true" style={{color: "#3F6E6A"}}>→</span></H></li>
</React.Fragment>))}
</ul>
</>)}
{(noRecent) && (<><p style={{margin: "14px 0 0", color: "#55635E", fontSize: "15px", background: "#F4F7F2", padding: "16px", borderRadius: "14px"}}>Topics you open will show up here.</p></>)}
</div>
</div>

<div style={{marginTop: "28px", display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center"}}>
<span style={{fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".08em", color: "#55635E", marginRight: "6px"}}>QUICK ACCESS</span>
{(quick).map((k, __i) => (<React.Fragment key={__i}>
<H as="button" onClick={k.onClick} style={{background: "#FFFEFB", border: "1.5px solid #DDE4DB", borderRadius: "999px", padding: "10px 16px", fontWeight: "500", fontSize: "15px", cursor: "pointer"}} hover={{background: "#EAF2EB", borderColor: "#A8BFA8"}}>{k.label}</H>
</React.Fragment>))}
</div>
</main>
</>
  );
}
