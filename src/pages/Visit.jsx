import React, { useEffect, useState } from "react";
import { H } from "../ui/H.jsx";
import { navigate } from "../lib/router.js";
import { update, uid, useStore } from "../data/store.js";
import { QUESTION_BANK, Q_CATEGORIES } from "../content/questions.js";
import { CONCERN_PROMPTS, CONCERN_PROMPTS_ES, formatDate, formatMonth, formatTime, orderedQuestions, visitProgress } from "../lib/visit.js";

const MAX_Q = 300;

export default function Visit({ ctx }) {
  const { t, lang, toast, wide, route } = ctx;
  const es = lang === "es";
  const visit = useStore((s) => s.appointment);
  const questions = useStore((s) => s.questions);
  const profile = useStore((s) => s.profile);
  const healthHistory = useStore((s) => s.history || []);
  const step = Math.min(4, Math.max(1, Number(route.param) || 1));
  const [errors, setErrors] = useState({});
  const [tlDate, setTlDateV] = useState("");
  const [tlLabel, setTlLabelV] = useState("");
  const [tlErr, setTlErr] = useState(false);
  const [qCat, setQCat] = useState("understand");
  const [newQ, setNewQV] = useState("");
  const [qError, setQError] = useState("");
  const [editId, setEditId] = useState(null);
  const [editText, setEditTextV] = useState("");

  const setAppt = (patch) => update((s) => ({ ...s, appointment: { ...s.appointment, ...patch } }));
  const setQuestions = (fn) => update((s) => ({ ...s, questions: fn(s.questions) }));

  useEffect(() => {
    if (step === 4 && !visit.sheetReady) setAppt({ sheetReady: true });
  }, [step]);

  // --- step 1: details ---
  const field = (k) => (e) => {
    setAppt({ [k]: e.target.value });
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };
  const setV = { date: field("date"), time: field("time"), type: field("type"), specialty: field("specialty"), clinician: field("clinician"), reason: field("reason") };
  const errDate = Boolean(errors.date);
  const errReason = Boolean(errors.reason);
  const dateBd = errDate ? "#8A3A22" : "#D5DED3";
  const reasonBd = errReason ? "#8A3A22" : "#D5DED3";
  const validateStep1 = () => {
    const er = {};
    if (!visit.date) er.date = es ? "Agregue la fecha de su cita." : "Add the date of your appointment.";
    if (!visit.reason?.trim()) er.reason = es ? "Escriba el motivo de la cita con sus propias palabras." : "Add the reason for your visit in your own words.";
    setErrors(er);
    if (er.date) document.getElementById("v-date")?.focus();
    else if (er.reason) document.getElementById("v-reason")?.focus();
    return !er.date && !er.reason;
  };

  // --- step 2: concerns + timeline ---
  const prompts = CONCERN_PROMPTS.map((p, i) => ({
    ...p,
    id: `c-${p.id}`,
    n: String(i + 1),
    label: es ? CONCERN_PROMPTS_ES[p.id] : p.label,
    value: visit.concerns?.[p.id] || "",
    onChange: (e) => setAppt({ concerns: { ...visit.concerns, [p.id]: e.target.value } }),
  }));
  const timelineItems = [...(visit.timeline || [])]
    .sort((x, y) => x.month.localeCompare(y.month))
    .map((e) => ({
      dateLabel: formatMonth(e.month, lang),
      label: e.label,
      delLabel: `${es ? "Quitar" : "Remove"}: ${e.label}`,
      onDel: () => setAppt({ timeline: visit.timeline.filter((x) => x.id !== e.id) }),
    }));
  const hasTimeline = timelineItems.length > 0;
  const sheetHistory = healthHistory.map((h) => ({
    dateLabel: h.when ? formatMonth(h.when, lang) : "—",
    text: `${h.kind === "test" ? (es ? "Prueba" : "Test") : es ? "Diagnóstico" : "Diagnosis"}: ${h.name}${h.result ? ` — ${h.result}` : ""}`,
  }));
  const noTimeline = !hasTimeline;
  const setTlDate = (e) => setTlDateV(e.target.value);
  const setTlLabel = (e) => setTlLabelV(e.target.value);
  const addTl = () => {
    if (!tlDate || !tlLabel.trim()) {
      setTlErr(true);
      return;
    }
    setAppt({ timeline: [...(visit.timeline || []), { id: uid(), month: tlDate, label: tlLabel.trim().slice(0, 200) }] });
    setTlDateV("");
    setTlLabelV("");
    setTlErr(false);
  };
  const tlKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTl();
    }
  };

  // --- step 3: question builder ---
  const qCats = Q_CATEGORIES.map((c) => {
    const on = qCat === c.id;
    return { label: c[lang] || c.en, on, onClick: () => setQCat(c.id), bg: on ? "#254D43" : "#FFFEFB", fg: on ? "#FAF9F6" : "#27332F" };
  });
  const texts = new Set(questions.map((q) => q.text));
  const suggested = QUESTION_BANK[qCat].map((q) => {
    const text = q[lang] || q.en;
    const added = texts.has(text);
    return {
      text,
      added,
      mark: added ? "✓" : "+",
      bd: added ? "#254D43" : "transparent",
      bg: added ? "#FFFEFB" : "#F7FAF6",
      dotBg: added ? "#254D43" : "#DCE8DC",
      dotFg: added ? "#FAF9F6" : "#254D43",
      onToggle: () =>
        added
          ? setQuestions((qs) => qs.filter((x) => x.text !== text))
          : setQuestions((qs) => [...qs, { id: uid(), text, priority: false, source: es ? "Generador de preguntas" : "Question builder", createdAt: new Date().toISOString() }]),
    };
  });
  const hasQs = questions.length > 0;
  const noQs = !hasQs;
  const qCountLabel = es ? `${questions.length} pregunta(s) · ★ = prioridad` : `${questions.length} question${questions.length === 1 ? "" : "s"} · ★ = priority`;
  const move = (i, d) =>
    setQuestions((qs) => {
      const next = [...qs];
      const j = i + d;
      if (j < 0 || j >= next.length) return qs;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const qRows = questions.map((q, i) => ({
    n: String(i + 1),
    text: q.text,
    priority: q.priority,
    source: q.source,
    hasSource: Boolean(q.source),
    isEditing: editId === q.id,
    notEditing: editId !== q.id,
    first: i === 0,
    last: i === questions.length - 1,
    upOp: i === 0 ? "0.35" : "1",
    downOp: i === questions.length - 1 ? "0.35" : "1",
    bd: q.priority ? "#E9B8A6" : "#E2E8E0",
    bg: q.priority ? "#FBF3EF" : "#FFFEFB",
    starFill: q.priority ? "#E9B8A6" : "none",
    starStroke: q.priority ? "#C97F67" : "#6A9C98",
    prioLabel: q.priority ? (es ? "Quitar prioridad" : "Remove priority") : es ? "Marcar como prioridad" : "Mark as priority",
    onPrio: () => setQuestions((qs) => qs.map((x) => (x.id === q.id ? { ...x, priority: !x.priority } : x))),
    onUp: () => move(i, -1),
    onDown: () => move(i, 1),
    onEdit: () => {
      setEditId(q.id);
      setEditTextV(q.text);
    },
    onDel: () => {
      setQuestions((qs) => qs.filter((x) => x.id !== q.id));
      toast(es ? "Pregunta eliminada" : "Question deleted");
    },
  }));
  const setEditText = (e) => setEditTextV(e.target.value);
  const saveEdit = () => {
    const v = editText.trim();
    if (!v) return;
    setQuestions((qs) => qs.map((x) => (x.id === editId ? { ...x, text: v.slice(0, MAX_Q) } : x)));
    setEditId(null);
  };
  const cancelEdit = () => setEditId(null);
  const editKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    }
    if (e.key === "Escape") cancelEdit();
  };
  const setNewQ = (e) => {
    setNewQV(e.target.value);
    if (qError) setQError("");
  };
  const addCustom = () => {
    const v = newQ.trim();
    if (v.length < 3) {
      setQError(es ? "Escriba su pregunta primero." : "Write your question first.");
      return;
    }
    if (v.length > MAX_Q) {
      setQError(es ? `Use ${MAX_Q} caracteres o menos.` : `Keep it under ${MAX_Q} characters.`);
      return;
    }
    if (texts.has(v)) {
      setQError(es ? "Esa pregunta ya está en su lista." : "That question is already in your list.");
      return;
    }
    setQuestions((qs) => [...qs, { id: uid(), text: v, priority: false, source: es ? "Mi pregunta" : "My question", createdAt: new Date().toISOString() }]);
    setNewQV("");
  };
  const newQKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustom();
    }
  };
  const hasQErr = Boolean(qError);
  const saveQList = () => {
    if (!questions.length) {
      toast(es ? "Agregue preguntas primero" : "Add some questions first");
      return;
    }
    update((s) => ({
      ...s,
      questionLists: [{ id: uid(), title: `${es ? "Preguntas para" : "Questions for"} ${visit.date ? formatDate(visit.date, lang, { month: "short", day: "numeric" }) : es ? "mi cita" : "my visit"}`, questions: orderedQuestions(s.questions).map(({ text, priority }) => ({ text, priority })), createdAt: new Date().toISOString() }, ...s.questionLists],
    }));
    toast(es ? "Lista guardada en el cuaderno" : "List saved to Notebook");
  };

  // --- step 4: sheet ---
  const todayLabel = new Date().toLocaleDateString(lang === "es" ? "es-US" : "en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
  const sheetWho = profile?.demo ? (es ? "PACIENTE DE DEMOSTRACIÓN" : "DEMO PATIENT") : "";
  const typeLabel = visit.type;
  const sheetDetails = [
    { k: es ? "Fecha" : "Date", v: visit.date ? formatDate(visit.date, lang, { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "—" },
    { k: es ? "Hora" : "Time", v: formatTime(visit.time, lang) || "—" },
    { k: es ? "Tipo" : "Type", v: typeLabel || "—" },
    { k: es ? "Especialidad" : "Specialty", v: visit.specialty || "—" },
    { k: es ? "Profesional" : "Clinician", v: visit.clinician || "—" },
  ];
  const visitReason = visit.reason?.trim() || (es ? "No se agregó." : "Not added yet.");
  const sheetConcerns = prompts.filter((p) => p.value.trim()).map((p) => ({ label: p.label, value: p.value }));
  const hasConcerns = sheetConcerns.length > 0;
  const noConcerns = !hasConcerns;
  const sheetQs = orderedQuestions(questions).map((q) => ({ text: q.text, star: q.priority ? "★ " : "", fw: q.priority ? "700" : "500" }));
  const goStep2 = () => navigate("/visit/2");
  const printSheet = () => window.print();
  const saveSheet = () => {
    update((s) => ({
      ...s,
      visitSheets: [{ id: uid(), title: `${es ? "Hoja de la cita" : "Visit sheet"} · ${visit.date ? formatDate(visit.date, lang, { month: "short", day: "numeric" }) : todayLabel}`, snapshot: { appointment: s.appointment, questions: orderedQuestions(s.questions) }, createdAt: new Date().toISOString() }, ...s.visitSheets],
    }));
    toast(es ? "Hoja guardada en el cuaderno" : "Visit sheet saved to Notebook");
  };

  // --- stepper ---
  const { steps: done } = visitProgress(visit, questions);
  const LABELS = es ? ["Detalles", "Lo que pasa", "Preguntas", "Hoja de la cita"] : ["Details", "What’s going on", "Questions", "Visit sheet"];
  const stepper = LABELS.map((label, i) => {
    const n = i + 1;
    const cur = n === step;
    const complete = done[i] && !cur;
    return {
      label,
      cur: cur ? "step" : undefined,
      mark: complete ? "✓" : String(n),
      bar: cur || complete ? "#254D43" : "#DDE4DB",
      cBg: cur ? "#254D43" : complete ? "#A8BFA8" : "#EEF2EC",
      cFg: cur ? "#FAF9F6" : "#254D43",
      fw: cur ? "700" : "500",
      fg: cur ? "#254D43" : "#55635E",
      onClick: () => (n > 1 && step === 1 && !validateStep1() ? null : navigate(`/visit/${n}`)),
    };
  });
  const hasPrev = step > 1;
  const hasNext = step < 4;
  const nextLabel = es ? ["", "Siguiente: lo que pasa", "Siguiente: preguntas", "Ver la hoja de la cita"][step] : ["", "Next: what’s going on", "Next: questions", "See my visit sheet"][step];
  const prevStep = () => navigate(`/visit/${step - 1}`);
  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    navigate(`/visit/${step + 1}`);
  };

  const step1 = step === 1;
  const step2 = step === 2;
  const step3 = step === 3;
  const step4 = step === 4;

  return (
<>
<main data-printwrap="" style={{maxWidth: "1120px", margin: "0 auto", padding: "40px 24px 110px", animation: "cbUp .35s ease"}}>
<div data-noprint="">
<div style={{fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".08em", textTransform: "uppercase", color: "#3F6E6A"}}>{t.visit.eyebrow}</div>
<h1 style={{margin: "10px 0 0", fontSize: "clamp(34px,4.4vw,56px)", lineHeight: "1.02", letterSpacing: "-.04em", fontWeight: "600", color: "#254D43"}}>{t.visit.title}</h1>
<ol aria-label="Preparation progress" style={{listStyle: "none", margin: "30px 0 0", padding: "0", display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: "8px"}}>
{(stepper).map((s, __i) => (<React.Fragment key={__i}>
<li style={{display: "flex", flexDirection: "column", gap: "10px"}}><div style={{height: "6px", borderRadius: "9px", background: s.bar, transition: "background .3s"}}></div>
<button onClick={s.onClick} aria-current={s.cur} style={{display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", padding: "4px 0", cursor: "pointer", textAlign: "left"}}><span style={{width: "30px", height: "30px", borderRadius: "50%", flex: "none", display: "grid", placeItems: "center", fontSize: "14px", fontWeight: "700", background: s.cBg, color: s.cFg}}>{s.mark}</span>{(wide) && (<><span style={{fontSize: "15px", fontWeight: s.fw, color: s.fg}}>{s.label}</span></>)}</button></li>
</React.Fragment>))}
</ol>
</div>

{(step1) && (<>
<section aria-labelledby="s1h" style={{marginTop: "30px", background: "#FFFEFB", border: "1px solid #E2E8E0", borderRadius: "28px", padding: "clamp(22px,4vw,40px)"}}>
<h2 id="s1h" style={{margin: "0", fontSize: "28px", letterSpacing: "-.025em", fontWeight: "600"}}>Appointment details</h2>
<p style={{margin: "6px 0 24px", color: "#55635E"}}>{es ? "Solo lo básico. Los campos con * se necesitan para la hoja de la cita. Se guarda solo en este navegador: no escriba su nombre completo ni otros datos que lo identifiquen." : "Just the basics. Fields marked * are needed for your visit sheet. Saved only in this browser, so please leave out your full name and other identifying details."}</p>
<div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))", gap: "18px"}}>
<div style={{display: "flex", flexDirection: "column", gap: "6px"}}><label htmlFor="v-date" style={{fontWeight: "600"}}>Appointment date *</label><input id="v-date" type="date" value={visit.date} onChange={setV.date} aria-invalid={errDate} aria-describedby="v-date-err" style={{padding: "14px 16px", borderRadius: "14px", border: `1.5px solid ${dateBd}`, background: "#FAFBF8", fontSize: "17px"}} />{(errDate) && (<><span id="v-date-err" role="alert" style={{color: "#8A3A22", fontSize: "14.5px"}}>{errors.date}</span></>)}</div>
<div style={{display: "flex", flexDirection: "column", gap: "6px"}}><label htmlFor="v-time" style={{fontWeight: "600"}}>Time</label><input id="v-time" type="time" value={visit.time} onChange={setV.time} style={{padding: "14px 16px", borderRadius: "14px", border: "1.5px solid #D5DED3", background: "#FAFBF8", fontSize: "17px"}} /></div>
<div style={{display: "flex", flexDirection: "column", gap: "6px"}}><label htmlFor="v-type" style={{fontWeight: "600"}}>Appointment type</label><select id="v-type" value={visit.type} onChange={setV.type} style={{padding: "14px 16px", borderRadius: "14px", border: "1.5px solid #D5DED3", background: "#FAFBF8", fontSize: "17px"}}><option>New patient</option><option>Follow-up</option><option>Annual checkup</option><option>Telehealth</option><option>Test or procedure consult</option></select></div>
<div style={{display: "flex", flexDirection: "column", gap: "6px"}}><label htmlFor="v-spec" style={{fontWeight: "600"}}>Specialty</label><select id="v-spec" value={visit.specialty} onChange={setV.specialty} style={{padding: "14px 16px", borderRadius: "14px", border: "1.5px solid #D5DED3", background: "#FAFBF8", fontSize: "17px"}}><option>Primary care</option><option>Orthopedics / Hand</option><option>Neurology</option><option>Cardiology</option><option>Gastroenterology</option><option>Endocrinology</option><option>Other</option></select></div>
<div style={{display: "flex", flexDirection: "column", gap: "6px"}}><label htmlFor="v-clin" style={{fontWeight: "600"}}>Clinician (optional)</label><input id="v-clin" type="text" value={visit.clinician} onChange={setV.clinician} placeholder="e.g. Dr. Lena Ortiz" style={{padding: "14px 16px", borderRadius: "14px", border: "1.5px solid #D5DED3", background: "#FAFBF8", fontSize: "17px"}} /></div>
</div>
<div style={{display: "flex", flexDirection: "column", gap: "6px", marginTop: "18px"}}><label htmlFor="v-reason" style={{fontWeight: "600"}}>Reason for visit *</label><textarea id="v-reason" rows="3" value={visit.reason} onChange={setV.reason} aria-invalid={errReason} aria-describedby="v-reason-err" placeholder="In your own words — e.g. Numbness and tingling in my right hand" style={{padding: "14px 16px", borderRadius: "14px", border: `1.5px solid ${reasonBd}`, background: "#FAFBF8", fontSize: "17px", resize: "vertical"}}></textarea>{(errReason) && (<><span id="v-reason-err" role="alert" style={{color: "#8A3A22", fontSize: "14.5px"}}>{errors.reason}</span></>)}</div>
</section>
</>)}

{(step2) && (<>
<section aria-labelledby="s2h" style={{marginTop: "30px", display: "flex", flexDirection: "column", gap: "18px"}}>
<div style={{background: "#FFFEFB", border: "1px solid #E2E8E0", borderRadius: "28px", padding: "clamp(22px,4vw,40px)"}}>
<h2 id="s2h" style={{margin: "0", fontSize: "28px", letterSpacing: "-.025em", fontWeight: "600"}}>What’s been going on?</h2>
<p style={{margin: "6px 0 24px", color: "#55635E"}}>Answer in your own words — short notes are fine. Skip anything you’re not sure about.</p>
<div style={{display: "flex", flexDirection: "column", gap: "20px"}}>
{(prompts).map((p, __i) => (<React.Fragment key={__i}>
<div style={{display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: "16px", alignItems: "start"}}><span style={{width: "34px", height: "34px", borderRadius: "50%", background: "#EAF2EB", color: "#254D43", display: "grid", placeItems: "center", fontWeight: "700", fontSize: "15px"}}>{p.n}</span><div style={{display: "flex", flexDirection: "column", gap: "6px"}}><label htmlFor={p.id} style={{fontWeight: "600", fontSize: "17.5px"}}>{p.label}</label><textarea id={p.id} rows="2" value={p.value} onChange={p.onChange} placeholder={p.ph} style={{padding: "13px 16px", borderRadius: "14px", border: "1.5px solid #D5DED3", background: "#FAFBF8", fontSize: "16.5px", resize: "vertical"}}></textarea></div></div>
</React.Fragment>))}
</div>
</div>
<div style={{background: "#FFFEFB", border: "1px solid #E2E8E0", borderRadius: "28px", padding: "clamp(22px,4vw,40px)"}}>
<div style={{display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", alignItems: "baseline"}}><h3 style={{margin: "0", fontSize: "22px", letterSpacing: "-.02em", fontWeight: "600"}}>Symptom timeline <span style={{fontWeight: "400", color: "#55635E", fontSize: "16px"}}>(optional)</span></h3></div>
<p style={{margin: "6px 0 20px", color: "#55635E", fontSize: "15.5px"}}>Note when things happened. CareBridge doesn’t analyze symptoms — this is just to help you tell your story.</p>
{(hasTimeline) && (<>
<div style={{overflowX: "auto", paddingBottom: "6px"}}>
<ol style={{listStyle: "none", margin: "0", padding: "0", display: "flex", minWidth: "min-content", position: "relative"}}>
{(timelineItems).map((e, __i) => (<React.Fragment key={__i}>
<li style={{flex: "1 0 180px", display: "flex", flexDirection: "column", gap: "10px", position: "relative", paddingRight: "16px"}}>
<div style={{display: "flex", alignItems: "center"}}><span style={{width: "18px", height: "18px", borderRadius: "50%", background: "#E9B8A6", border: "3px solid #FAF9F6", boxShadow: "0 0 0 2px #C97F67", flex: "none"}}></span><span style={{height: "2px", background: "#C9D8C5", flex: "1"}}></span></div>
<span style={{fontFamily: "'DM Mono',monospace", fontSize: "12.5px", color: "#3F6E6A"}}>{e.dateLabel}</span>
<span style={{fontSize: "15.5px", fontWeight: "500"}}>{e.label}</span>
<button onClick={e.onDel} aria-label={e.delLabel} style={{alignSelf: "flex-start", background: "none", border: "none", color: "#8A3A22", fontSize: "13.5px", cursor: "pointer", padding: "4px 0", textDecoration: "underline"}}>Remove</button>
</li>
</React.Fragment>))}
</ol>
</div>
</>)}
{(noTimeline) && (<><p style={{margin: "0 0 16px", background: "#F4F7F2", borderRadius: "14px", padding: "14px 16px", color: "#55635E", fontSize: "15px"}}>No events yet. Add the first one below.</p></>)}
<div style={{display: "grid", gridTemplateColumns: "minmax(150px,200px) minmax(0,1fr) auto", gap: "10px", marginTop: "16px", alignItems: "end"}}>
<div style={{display: "flex", flexDirection: "column", gap: "6px"}}><label htmlFor="tl-date" style={{fontWeight: "600", fontSize: "15px"}}>When</label><input id="tl-date" type="month" value={tlDate} onChange={setTlDate} style={{padding: "12px 14px", borderRadius: "12px", border: "1.5px solid #D5DED3", background: "#FAFBF8"}} /></div>
<div style={{display: "flex", flexDirection: "column", gap: "6px"}}><label htmlFor="tl-label" style={{fontWeight: "600", fontSize: "15px"}}>What happened</label><input id="tl-label" type="text" value={tlLabel} onChange={setTlLabel} onKeyDown={tlKey} placeholder="e.g. Started waking up with numb fingers" style={{padding: "12px 14px", borderRadius: "12px", border: "1.5px solid #D5DED3", background: "#FAFBF8"}} /></div>
<button onClick={addTl} style={{background: "#254D43", color: "#FAF9F6", border: "none", borderRadius: "12px", padding: "13px 18px", fontWeight: "600", cursor: "pointer", height: "48px"}}>Add</button>
</div>
{(tlErr) && (<><p role="alert" style={{margin: "8px 0 0", color: "#8A3A22", fontSize: "14.5px"}}>Add both a month and a short description.</p></>)}
</div>
</section>
</>)}

{(step3) && (<>
<section aria-labelledby="s3h" style={{marginTop: "30px"}}>
<div style={{display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "12px", alignItems: "flex-end", marginBottom: "18px"}}>
<div><h2 id="s3h" style={{margin: "0", fontSize: "28px", letterSpacing: "-.025em", fontWeight: "600"}}>Question builder</h2><p style={{margin: "6px 0 0", color: "#55635E"}}>Pick suggestions, write your own, then put the most important first.</p></div>
<H as="button" onClick={saveQList} style={{background: "transparent", color: "#254D43", border: "1.5px solid #A8BFA8", borderRadius: "999px", padding: "11px 18px", fontWeight: "600", cursor: "pointer"}} hover={{background: "#EAF2EB"}}>Save list to Notebook</H>
</div>
<div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,400px),1fr))", gap: "18px", alignItems: "start"}}>
<div style={{background: "#EAF2EB", borderRadius: "28px", padding: "22px"}}>
<div role="group" aria-label="Question categories" style={{display: "flex", flexWrap: "wrap", gap: "6px"}}>
{(qCats).map((c, __i) => (<React.Fragment key={__i}>
<button aria-pressed={c.on} onClick={c.onClick} style={{borderRadius: "999px", padding: "9px 14px", fontSize: "14.5px", fontWeight: "500", cursor: "pointer", border: "none", background: c.bg, color: c.fg}}>{c.label}</button>
</React.Fragment>))}
</div>
<div style={{display: "flex", flexDirection: "column", gap: "10px", marginTop: "18px"}}>
{(suggested).map((g, __i) => (<React.Fragment key={__i}>
<H as="button" onClick={g.onToggle} aria-pressed={g.added} style={{textAlign: "left", display: "flex", gap: "14px", alignItems: "flex-start", padding: "16px 18px", borderRadius: "18px", border: `2px solid ${g.bd}`, background: g.bg, cursor: "pointer", transition: "transform .15s,background .15s", fontSize: "16.5px"}} hover={{transform: "translateY(-1px)"}}><span style={{width: "26px", height: "26px", borderRadius: "50%", flex: "none", display: "grid", placeItems: "center", background: g.dotBg, color: g.dotFg, fontWeight: "700", fontSize: "15px"}}>{g.mark}</span><span style={{flex: "1"}}>{g.text}</span></H>
</React.Fragment>))}
</div>
<p style={{margin: "16px 4px 0", fontSize: "14px", color: "#3D4A45"}}>General-purpose questions to support your conversation — not medical advice.</p>
</div>
<div style={{background: "#FFFEFB", border: "1px solid #E2E8E0", borderRadius: "28px", padding: "22px"}}>
<div style={{display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px"}}><h3 style={{margin: "0", fontSize: "21px", fontWeight: "600"}}>My questions</h3><span style={{fontSize: "14px", color: "#55635E"}}>{qCountLabel}</span></div>
{(hasQs) && (<>
<ol style={{listStyle: "none", margin: "14px 0 0", padding: "0", display: "flex", flexDirection: "column", gap: "8px"}}>
{(qRows).map((q, __i) => (<React.Fragment key={__i}>
<li style={{border: `1.5px solid ${q.bd}`, background: q.bg, borderRadius: "16px", padding: "12px 12px 12px 14px", display: "flex", flexDirection: "column", gap: "8px"}}>
<div style={{display: "flex", gap: "10px", alignItems: "flex-start"}}>
<span style={{fontFamily: "'DM Mono',monospace", fontSize: "13px", color: "#3F6E6A", paddingTop: "3px", flex: "none", minWidth: "18px"}}>{q.n}</span>
{(q.notEditing) && (<><span style={{flex: "1", fontSize: "16px"}}>{q.text}</span></>)}
{(q.isEditing) && (<><span style={{flex: "1", display: "flex", flexDirection: "column", gap: "8px"}}><label htmlFor="edit-q" style={{position: "absolute", left: "-9999px"}}>Edit question</label><textarea id="edit-q" rows="2" value={editText} onChange={setEditText} onKeyDown={editKey} style={{padding: "10px 12px", borderRadius: "10px", border: "1.5px solid #254D43", fontSize: "16px", resize: "vertical"}}></textarea><span style={{display: "flex", gap: "8px"}}><button onClick={saveEdit} style={{background: "#254D43", color: "#FAF9F6", border: "none", borderRadius: "999px", padding: "8px 14px", fontWeight: "600", cursor: "pointer", fontSize: "14px"}}>Save</button><button onClick={cancelEdit} style={{background: "none", border: "1.5px solid #D5DED3", borderRadius: "999px", padding: "7px 14px", cursor: "pointer", fontSize: "14px"}}>Cancel</button></span></span></>)}
</div>
<div style={{display: "flex", alignItems: "center", gap: "2px", paddingLeft: "28px", flexWrap: "wrap"}}>
{(q.hasSource) && (<><span style={{fontSize: "12px", fontFamily: "'DM Mono',monospace", color: "#55635E", marginRight: "auto", paddingRight: "8px"}}>{q.source}</span></>)}
<H as="button" onClick={q.onPrio} aria-pressed={q.priority} aria-label={q.prioLabel} title={q.prioLabel} style={{width: "36px", height: "36px", borderRadius: "10px", border: "none", background: "none", cursor: "pointer", display: "grid", placeItems: "center", marginLeft: "auto"}} hover={{background: "#F7E7E0"}}><svg width="18" height="18" viewBox="0 0 24 24" fill={q.starFill} stroke={q.starStroke} strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></H>
<H as="button" onClick={q.onUp} disabled={q.first} aria-label="Move question up" title="Move up" style={{width: "36px", height: "36px", borderRadius: "10px", border: "none", background: "none", cursor: "pointer", display: "grid", placeItems: "center", opacity: q.upOp}} hover={{background: "#EAF2EB"}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#254D43" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m18 15-6-6-6 6"></path></svg></H>
<H as="button" onClick={q.onDown} disabled={q.last} aria-label="Move question down" title="Move down" style={{width: "36px", height: "36px", borderRadius: "10px", border: "none", background: "none", cursor: "pointer", display: "grid", placeItems: "center", opacity: q.downOp}} hover={{background: "#EAF2EB"}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#254D43" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></H>
<H as="button" onClick={q.onEdit} aria-label="Edit question" title="Edit" style={{width: "36px", height: "36px", borderRadius: "10px", border: "none", background: "none", cursor: "pointer", display: "grid", placeItems: "center"}} hover={{background: "#EAF2EB"}}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#254D43" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg></H>
<H as="button" onClick={q.onDel} aria-label="Delete question" title="Delete" style={{width: "36px", height: "36px", borderRadius: "10px", border: "none", background: "none", cursor: "pointer", display: "grid", placeItems: "center"}} hover={{background: "#F7E7E0"}}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8A3A22" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg></H>
</div>
</li>
</React.Fragment>))}
</ol>
</>)}
{(noQs) && (<><div style={{marginTop: "14px", background: "#F4F7F2", borderRadius: "16px", padding: "22px", textAlign: "center", color: "#55635E"}}>Your list is empty. Tap a suggestion or write your own below.</div></>)}
<div style={{marginTop: "16px", display: "flex", flexDirection: "column", gap: "6px"}}>
<label htmlFor="new-q" style={{fontWeight: "600", fontSize: "15px"}}>Write your own question</label>
<div style={{display: "flex", gap: "8px"}}><input id="new-q" type="text" value={newQ} onChange={setNewQ} onKeyDown={newQKey} placeholder="e.g. Can I keep playing piano?" aria-describedby="new-q-err" style={{flex: "1", minWidth: "0", padding: "13px 14px", borderRadius: "12px", border: "1.5px solid #D5DED3", background: "#FAFBF8"}} /><button onClick={addCustom} style={{background: "#254D43", color: "#FAF9F6", border: "none", borderRadius: "12px", padding: "0 18px", fontWeight: "600", cursor: "pointer"}}>Add</button></div>
{(hasQErr) && (<><span id="new-q-err" role="alert" style={{color: "#8A3A22", fontSize: "14.5px"}}>{qError}</span></>)}
</div>
</div>
</div>
</section>
</>)}

{(step4) && (<>
<div data-noprint="" style={{marginTop: "30px", display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "space-between", alignItems: "center"}}>
<p style={{margin: "0", color: "#55635E", maxWidth: "520px"}}>Your visit sheet is ready. Choose <strong>Save as PDF</strong> in the print dialog to download it.</p>
<div style={{display: "flex", gap: "10px", flexWrap: "wrap"}}><H as="button" onClick={saveSheet} style={{background: "transparent", color: "#254D43", border: "1.5px solid #A8BFA8", borderRadius: "999px", padding: "12px 18px", fontWeight: "600", cursor: "pointer"}} hover={{background: "#EAF2EB"}}>Save to Notebook</H><H as="button" onClick={printSheet} style={{display: "inline-flex", alignItems: "center", gap: "8px", background: "#254D43", color: "#FAF9F6", border: "none", borderRadius: "999px", padding: "13px 20px", fontWeight: "600", cursor: "pointer"}} hover={{background: "#1B3B33"}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect width="12" height="8" x="6" y="14"></rect></svg>Download PDF</H></div>
</div>
<article data-sheet="" aria-label="Appointment preparation sheet" style={{marginTop: "20px", background: "#FFFEFB", border: "1px solid #E2E8E0", borderRadius: "24px", padding: "clamp(24px,5vw,56px)", boxShadow: "0 30px 60px -40px rgba(37,77,67,.45)", color: "#27332F"}}>
<header style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap", borderBottom: "2px solid #254D43", paddingBottom: "18px"}}>
<div style={{display: "flex", alignItems: "center", gap: "10px"}}><svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="10" fill="#254D43"></rect><path d="M7.5 21.5 Q16 8 24.5 21.5" stroke="#A8BFA8" strokeWidth="2.6" fill="none" strokeLinecap="round"></path><circle cx="7.5" cy="21.5" r="2.8" fill="#E9B8A6"></circle><circle cx="24.5" cy="21.5" r="2.8" fill="#FAF9F6"></circle></svg><span style={{fontSize: "19px", fontWeight: "700", letterSpacing: "-.03em", color: "#254D43"}}>Care<span style={{fontWeight: "500", color: "#3F6E6A"}}>Bridge</span></span></div>
<div style={{textAlign: "right"}}><div style={{fontSize: "24px", fontWeight: "600", letterSpacing: "-.02em", color: "#254D43"}}>Appointment preparation sheet</div><div style={{fontFamily: "'DM Mono',monospace", fontSize: "12px", color: "#55635E", marginTop: "4px"}}>PREPARED {todayLabel} {sheetWho && `· ${sheetWho}`}</div></div>
</header>
<section style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: "16px", marginTop: "22px"}}>
{(sheetDetails).map((d, __i) => (<React.Fragment key={__i}><div><div style={{fontFamily: "'DM Mono',monospace", fontSize: "11.5px", letterSpacing: ".06em", color: "#3F6E6A", textTransform: "uppercase"}}>{d.k}</div><div style={{fontWeight: "600", marginTop: "3px"}}>{d.v}</div></div></React.Fragment>))}
</section>
<section style={{marginTop: "28px"}}><h2 style={{margin: "0 0 10px", fontSize: "19px", fontWeight: "700", color: "#254D43"}}>Reason for visit</h2><p style={{margin: "0"}}>{visitReason}</p></section>
<section style={{marginTop: "24px"}}><h2 style={{margin: "0 0 10px", fontSize: "19px", fontWeight: "700", color: "#254D43"}}>My concerns, in my words</h2>
{(hasConcerns) && (<><dl style={{margin: "0", display: "flex", flexDirection: "column", gap: "12px"}}>{(sheetConcerns).map((c, __i) => (<React.Fragment key={__i}><div><dt style={{fontSize: "14.5px", color: "#55635E"}}>{c.label}</dt><dd style={{margin: "2px 0 0"}}>{c.value}</dd></div></React.Fragment>))}</dl></>)}
{(noConcerns) && (<><p style={{margin: "0", color: "#55635E"}}>No concerns entered. <button data-noprint="" onClick={goStep2} style={{background: "none", border: "none", color: "#3F6E6A", textDecoration: "underline", cursor: "pointer", padding: "0", fontWeight: "600"}}>Add them in step 2</button></p></>)}
</section>
{(hasTimeline) && (<><section style={{marginTop: "24px"}}><h2 style={{margin: "0 0 10px", fontSize: "19px", fontWeight: "700", color: "#254D43"}}>Symptom notes</h2><ul style={{margin: "0", padding: "0", listStyle: "none", display: "flex", flexDirection: "column", gap: "6px"}}>{(timelineItems).map((e, __i) => (<React.Fragment key={__i}><li style={{display: "flex", gap: "14px"}}><span style={{fontFamily: "'DM Mono',monospace", fontSize: "13px", color: "#3F6E6A", minWidth: "84px", paddingTop: "2px"}}>{e.dateLabel}</span><span>{e.label}</span></li></React.Fragment>))}</ul></section></>)}
{(sheetHistory.length > 0) && (<><section style={{marginTop: "24px"}}><h2 style={{margin: "0 0 10px", fontSize: "19px", fontWeight: "700", color: "#254D43"}}>{es ? "Mi historial (escrito por mí)" : "My history (in my words)"}</h2><ul style={{margin: "0", padding: "0", listStyle: "none", display: "flex", flexDirection: "column", gap: "6px"}}>{(sheetHistory).map((h, __i) => (<React.Fragment key={__i}><li style={{display: "flex", gap: "14px"}}><span style={{fontFamily: "'DM Mono',monospace", fontSize: "13px", color: "#3F6E6A", minWidth: "84px", paddingTop: "2px"}}>{h.dateLabel}</span><span>{h.text}</span></li></React.Fragment>))}</ul></section></>)}
<section style={{marginTop: "24px"}}><h2 style={{margin: "0 0 10px", fontSize: "19px", fontWeight: "700", color: "#254D43"}}>My questions <span style={{fontWeight: "400", fontSize: "14px", color: "#55635E"}}>— ★ priority first</span></h2>
{(hasQs) && (<><ol style={{margin: "0", padding: "0", listStyle: "none", display: "flex", flexDirection: "column", gap: "10px"}}>{(sheetQs).map((q, __i) => (<React.Fragment key={__i}><li style={{display: "flex", gap: "12px", alignItems: "flex-start", breakInside: "avoid"}}><span style={{width: "18px", height: "18px", border: "1.5px solid #6A9C98", borderRadius: "4px", flex: "none", marginTop: "3px"}}></span><span style={{flex: "1"}}><span style={{fontWeight: q.fw}}>{q.star}{q.text}</span><span style={{display: "block", borderBottom: "1px dashed #C9D3C7", height: "26px"}}></span></span></li></React.Fragment>))}</ol></>)}
{(noQs) && (<><p style={{margin: "0", color: "#55635E"}}>No questions yet.</p></>)}
</section>
<section style={{marginTop: "28px", breakInside: "avoid"}}><h2 style={{margin: "0 0 10px", fontSize: "19px", fontWeight: "700", color: "#254D43"}}>Notes during my visit</h2><div style={{display: "flex", flexDirection: "column"}}><span style={{borderBottom: "1px solid #DDE4DB", height: "34px"}}></span><span style={{borderBottom: "1px solid #DDE4DB", height: "34px"}}></span><span style={{borderBottom: "1px solid #DDE4DB", height: "34px"}}></span><span style={{borderBottom: "1px solid #DDE4DB", height: "34px"}}></span><span style={{borderBottom: "1px solid #DDE4DB", height: "34px"}}></span><span style={{borderBottom: "1px solid #DDE4DB", height: "34px"}}></span></div></section>
<footer style={{marginTop: "28px", paddingTop: "14px", borderTop: "1px solid #E2E8E0", fontSize: "12.5px", color: "#55635E"}}>Prepared by the patient with CareBridge (demo). This sheet contains patient-entered notes for discussion and is not a medical record or medical advice. In an emergency, call 911.</footer>
</article>
</>)}

<div data-noprint="" style={{display: "flex", justifyContent: "space-between", gap: "12px", marginTop: "24px"}}>
{(hasPrev) && (<><H as="button" onClick={prevStep} style={{background: "transparent", color: "#254D43", border: "1.5px solid #A8BFA8", borderRadius: "999px", padding: "13px 22px", fontWeight: "600", cursor: "pointer"}} hover={{background: "#EAF2EB"}}>← Back</H></>)}
{(hasNext) && (<><H as="button" onClick={nextStep} style={{marginLeft: "auto", background: "#254D43", color: "#FAF9F6", border: "none", borderRadius: "999px", padding: "14px 26px", fontWeight: "600", cursor: "pointer"}} hover={{background: "#1B3B33"}}>{nextLabel} →</H></>)}
</div>
</main>
</>
  );
}
