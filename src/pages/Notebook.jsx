import React, { useState } from "react";
import { H } from "../ui/H.jsx";
import { navigate, openTopic } from "../lib/router.js";
import { resetAll, update, uid, useStore } from "../data/store.js";
import { PROCEDURES, categoryFor } from "../content/catalog.js";

const fmt = (iso, lang) => new Date(iso).toLocaleDateString(lang === "es" ? "es-US" : "en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase();

export default function Notebook({ ctx }) {
  const { t, lang, toast, route } = ctx;
  const es = lang === "es";
  const s = useStore();
  const [tab, setTab] = useState(route.query.tab || "topics");
  const [noteDraft, setNoteDraftV] = useState("");
  const [noteErr, setNoteErr] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const remove = (key, id, field = "id") => {
    update((st) => ({ ...st, [key]: st[key].filter((x) => x[field] !== id) }));
    toast(es ? "Eliminado" : "Removed");
  };

  const sections = {
    topics: {
      label: es ? "Temas" : "Health topics",
      items: s.savedTopics.map((x) => {
        const c = categoryFor(x.groups || []);
        return {
          meta: `${c ? (c[lang] || c.en).toUpperCase() : "MEDLINEPLUS"} · ${fmt(x.savedAt, lang)}`,
          title: x.title,
          openLabel: es ? "Leer" : "Read",
          onOpen: () => openTopic(x.url, x.title),
          delLabel: `${es ? "Quitar" : "Remove"} ${x.title}`,
          onDel: () => remove("savedTopics", x.url, "url"),
        };
      }),
      empty: { title: es ? "Aún no hay temas guardados." : "No saved topics yet.", body: es ? "Guarde un tema de la biblioteca para encontrarlo aquí." : "Save a topic from the library to find it here.", cta: es ? "Ir a la biblioteca" : "Browse the library", action: () => navigate("/understand") },
    },
    procedures: {
      label: es ? "Guías" : "Procedure guides",
      items: s.savedProcedures
        .map((x) => ({ x, p: PROCEDURES.find((p) => p.id === x.id) }))
        .filter(({ p }) => p)
        .map(({ x, p }) => ({
          meta: `${p.kind[lang] || p.kind.en} · ${fmt(x.savedAt, lang)}`,
          title: p.title[lang] || p.title.en,
          openLabel: es ? "Abrir" : "Open",
          onOpen: () => navigate(`/procedure/${p.id}`),
          delLabel: `${es ? "Quitar" : "Remove"} ${p.title[lang]}`,
          onDel: () => remove("savedProcedures", x.id),
        })),
      empty: { title: es ? "Aún no hay guías guardadas." : "No saved guides yet.", body: es ? "Guarde una guía de procedimientos para verla aquí." : "Save a procedure guide to keep it here.", cta: es ? "Ver guías" : "See guides", action: () => navigate("/next") },
    },
    lists: {
      label: es ? "Listas de preguntas" : "Question lists",
      items: s.questionLists.map((x) => ({
        meta: `${x.questions.length} ${es ? "PREGUNTAS" : "QUESTIONS"} · ${fmt(x.createdAt, lang)}`,
        title: x.title,
        note: x.questions.slice(0, 3).map((q) => `${q.priority ? "★ " : "• "}${q.text}`).join("\n"),
        openLabel: es ? "Usar esta lista" : "Use this list",
        onOpen: () => {
          update((st) => ({ ...st, questions: x.questions.map((q) => ({ id: uid(), text: q.text, priority: q.priority, source: x.title, createdAt: new Date().toISOString() })) }));
          toast(es ? "Lista cargada en Mi cita" : "List loaded into My Visit");
          navigate("/visit/3");
        },
        delLabel: `${es ? "Quitar" : "Remove"} ${x.title}`,
        onDel: () => remove("questionLists", x.id),
      })),
      empty: { title: es ? "Aún no hay listas guardadas." : "No saved question lists yet.", body: es ? "En el generador de preguntas, elija “Guardar lista en el cuaderno”." : "In the question builder, choose “Save list to Notebook”.", cta: es ? "Abrir el generador" : "Open the builder", action: () => navigate("/visit/3") },
    },
    sheets: {
      label: es ? "Hojas de cita" : "Visit sheets",
      items: s.visitSheets.map((x) => ({
        meta: fmt(x.createdAt, lang),
        title: x.title,
        note: `${x.snapshot.appointment.reason || ""}\n${x.snapshot.questions.length} ${es ? "preguntas" : "questions"}`.trim(),
        openLabel: es ? "Restaurar y ver" : "Restore & view",
        onOpen: () => {
          update((st) => ({ ...st, appointment: { ...x.snapshot.appointment }, questions: x.snapshot.questions.map((q) => ({ ...q })) }));
          navigate("/visit/4");
        },
        delLabel: `${es ? "Quitar" : "Remove"} ${x.title}`,
        onDel: () => remove("visitSheets", x.id),
      })),
      empty: { title: es ? "Aún no hay hojas guardadas." : "No saved visit sheets yet.", body: es ? "Prepare su cita y guarde la hoja aquí." : "Prepare for your visit and save the sheet here.", cta: es ? "Ir a Mi cita" : "Go to My Visit", action: () => navigate("/visit/1") },
    },
    care: {
      label: es ? "Instrucciones del equipo" : "Care team notes",
      items: Object.entries(s.careNotes)
        .filter(([, v]) => v?.trim())
        .map(([id, v]) => {
          const p = PROCEDURES.find((x) => x.id === id);
          return {
            meta: es ? "INSTRUCCIONES DE MI EQUIPO" : "FROM MY CARE TEAM",
            title: p ? p.title[lang] || p.title.en : id,
            note: v,
            openLabel: es ? "Editar" : "Edit",
            onOpen: () => navigate(`/procedure/${id}`),
            delLabel: es ? "Borrar nota" : "Delete note",
            onDel: () => {
              update((st) => {
                const { [id]: _drop, ...rest } = st.careNotes;
                return { ...st, careNotes: rest };
              });
              toast(es ? "Eliminado" : "Removed");
            },
          };
        }),
      empty: { title: es ? "Aún no hay instrucciones guardadas." : "No care team notes yet.", body: es ? "Anote las instrucciones de su equipo en cualquier guía de procedimientos." : "Write down your care team’s instructions on any procedure guide.", cta: es ? "Ver guías" : "See guides", action: () => navigate("/next") },
    },
    history: {
      label: es ? "Historial de salud" : "Health history",
      items: (s.history || []).map((h) => ({
        meta: [h.kind === "test" ? (es ? "PRUEBA" : "TEST") : es ? "DIAGNÓSTICO" : "DIAGNOSIS", h.match ? "MEDLINEPLUS" : null].filter(Boolean).join(" · "),
        title: h.name,
        note: h.result || h.note || "",
        openLabel: es ? "Ver explicación" : "See explanation",
        onOpen: () => navigate("/history"),
        delLabel: `${es ? "Quitar" : "Remove"} ${h.name}`,
        onDel: () => remove("history", h.id),
      })),
      empty: { title: es ? "Su historial está vacío." : "Your health history is empty.", body: es ? "Agregue diagnósticos y pruebas pasadas para ver qué significan." : "Add past diagnoses and tests to see what they mean.", cta: es ? "Abrir mi historial" : "Open my health history", action: () => navigate("/history") },
    },
    notes: { label: es ? "Notas de la cita" : "Visit notes", items: s.visitNotes },
  };

  const activeTab = sections[tab] ? tab : "topics";
  const nbTabs = Object.entries(sections).map(([id, sec]) => {
    const on = activeTab === id;
    return { label: sec.label, count: String(sec.items.length), on, onClick: () => setTab(id), bd: on ? "#254D43" : "#D5DED3", bg: on ? "#254D43" : "#FFFEFB", fg: on ? "#FAF9F6" : "#27332F", cBg: on ? "rgba(250,249,246,.18)" : "#EEF2EC" };
  });
  const nbNotesTab = activeTab === "notes";
  const nbItemsTab = !nbNotesTab;
  const cur = sections[activeTab];
  const nbItems = nbItemsTab ? cur.items.map((it) => ({ ...it, hasNote: Boolean(it.note), note: it.note })) : [];
  const nbHasItems = nbItems.length > 0;
  const nbEmpty = nbItemsTab && !nbHasItems;
  const nbEmptyTitle = cur.empty?.title;
  const nbEmptyBody = cur.empty?.body;
  const nbEmptyCta = cur.empty?.cta;
  const nbEmptyAction = cur.empty?.action;

  const setNoteDraft = (e) => {
    setNoteDraftV(e.target.value);
    setNoteErr(false);
  };
  const addNote = () => {
    const v = noteDraft.trim();
    if (!v) {
      setNoteErr(true);
      return;
    }
    update((st) => ({ ...st, visitNotes: [{ id: uid(), text: v.slice(0, 4000), createdAt: new Date().toISOString() }, ...st.visitNotes] }));
    setNoteDraftV("");
    toast(es ? "Nota guardada" : "Note saved");
  };
  const notesList = s.visitNotes.map((n) => ({ date: fmt(n.createdAt, lang), text: n.text, onDel: () => remove("visitNotes", n.id) }));
  const noNotes = notesList.length === 0;

  const notConfirming = !confirmDel;
  const askDelete = () => setConfirmDel(true);
  const cancelDelete = () => setConfirmDel(false);
  const deleteAll = async () => {
    await resetAll();
    try {
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
    setConfirmDel(false);
    toast(es ? "Se borró todo de este navegador" : "Everything was deleted from this browser");
  };

  return (
<>
<main style={{maxWidth: "1180px", margin: "0 auto", padding: "44px 24px 110px", animation: "cbUp .35s ease"}}>
<div style={{fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".08em", textTransform: "uppercase", color: "#3F6E6A"}}>{t.nb.eyebrow}</div>
<h1 style={{margin: "10px 0 0", fontSize: "clamp(36px,4.6vw,60px)", lineHeight: "1.02", letterSpacing: "-.04em", fontWeight: "600", color: "#254D43"}}>{t.nb.title}</h1>
<div role="note" style={{marginTop: "20px", display: "flex", gap: "12px", alignItems: "flex-start", background: "#EAF2EB", borderRadius: "18px", padding: "16px 18px", maxWidth: "860px", fontSize: "15px"}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#254D43" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex: "none", marginTop: "1px"}}><rect width="18" height="11" x="3" y="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg><span>{es ? <>Almacenamiento de demostración: su cuaderno se guarda solo en este navegador y en este dispositivo. <strong>No</strong> es un expediente médico seguro; no escriba información de salud personal real.</> : <>Demo storage: your notebook is saved only in this browser on this device. It is <strong>not</strong> a secure medical record, so please don’t enter real personal health information.</>}</span></div>
<div role="tablist" aria-label="Notebook sections" style={{display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "28px"}}>
{(nbTabs).map((b, __i) => (<React.Fragment key={__i}>
<button role="tab" aria-selected={b.on} onClick={b.onClick} style={{display: "flex", alignItems: "center", gap: "8px", borderRadius: "999px", padding: "10px 16px", fontSize: "15px", fontWeight: "600", cursor: "pointer", border: `1.5px solid ${b.bd}`, background: b.bg, color: b.fg}}>{b.label}<span style={{fontSize: "12.5px", minWidth: "22px", padding: "1px 7px", borderRadius: "999px", background: b.cBg}}>{b.count}</span></button>
</React.Fragment>))}
</div>
<div role="tabpanel" style={{marginTop: "22px"}}>
{(nbItemsTab) && (<>
{(nbHasItems) && (<>
<div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,300px),1fr))", gap: "14px"}}>
{(nbItems).map((it, __i) => (<React.Fragment key={__i}>
<div style={{background: "#FFFEFB", border: "1px solid #E2E8E0", borderRadius: "22px", padding: "20px", display: "flex", flexDirection: "column", gap: "8px"}}>
<span style={{fontFamily: "'DM Mono',monospace", fontSize: "11.5px", letterSpacing: ".05em", color: "#3F6E6A"}}>{it.meta}</span>
<span style={{fontSize: "19px", fontWeight: "600", letterSpacing: "-.015em", color: "#254D43"}}>{it.title}</span>
{(it.hasNote) && (<><span style={{fontSize: "14.5px", color: "#3D4A45", background: "#F4F7F2", borderRadius: "10px", padding: "8px 10px", whiteSpace: "pre-line"}}>{it.note}</span></>)}
<div style={{display: "flex", gap: "8px", marginTop: "auto", paddingTop: "8px"}}><button onClick={it.onOpen} style={{background: "#254D43", color: "#FAF9F6", border: "none", borderRadius: "999px", padding: "9px 16px", fontWeight: "600", fontSize: "14.5px", cursor: "pointer"}}>{it.openLabel}</button><H as="button" onClick={it.onDel} aria-label={it.delLabel} style={{background: "none", border: "1.5px solid #E6D3CB", color: "#8A3A22", borderRadius: "999px", padding: "8px 14px", fontWeight: "600", fontSize: "14.5px", cursor: "pointer"}} hover={{background: "#FBF3EF"}}>{es ? "Quitar" : "Remove"}</H></div>
</div>
</React.Fragment>))}
</div>
</>)}
{(nbEmpty) && (<>
<div style={{background: "#F4F7F2", borderRadius: "24px", padding: "40px", textAlign: "center"}}><p style={{margin: "0", fontSize: "19px", fontWeight: "600", color: "#254D43"}}>{nbEmptyTitle}</p><p style={{margin: "6px 0 18px", color: "#55635E"}}>{nbEmptyBody}</p><button onClick={nbEmptyAction} style={{background: "#254D43", color: "#FAF9F6", border: "none", borderRadius: "999px", padding: "12px 20px", fontWeight: "600", cursor: "pointer"}}>{nbEmptyCta}</button></div>
</>)}
</>)}
{(nbNotesTab) && (<>
<div style={{background: "#FFFEFB", border: "1px solid #E2E8E0", borderRadius: "22px", padding: "20px", display: "flex", flexDirection: "column", gap: "8px", maxWidth: "760px"}}>
<label htmlFor="nb-note" style={{fontWeight: "600"}}>{es ? "Agregar una nota de la cita" : "Add a visit note"}</label>
<textarea id="nb-note" rows="3" value={noteDraft} onChange={setNoteDraft} placeholder={es ? "¿Qué dijo su profesional de salud? ¿Cuáles son los próximos pasos?" : "What did your clinician say? What are the next steps?"} maxLength={4000} style={{padding: "12px 14px", borderRadius: "14px", border: "1.5px solid #D5DED3", background: "#FAFBF8", fontSize: "16px", resize: "vertical"}}></textarea>
{(noteErr) && (<><span role="alert" style={{color: "#8A3A22", fontSize: "14.5px"}}>{es ? "Escriba algo antes de guardar." : "Write something before saving."}</span></>)}
<button onClick={addNote} style={{alignSelf: "flex-start", background: "#254D43", color: "#FAF9F6", border: "none", borderRadius: "999px", padding: "11px 18px", fontWeight: "600", cursor: "pointer"}}>{es ? "Guardar nota" : "Save note"}</button>
</div>
<div style={{display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px", maxWidth: "760px"}}>
{(notesList).map((n, __i) => (<React.Fragment key={__i}><div style={{background: "#FFFEFB", border: "1px solid #E2E8E0", borderRadius: "18px", padding: "16px 18px", display: "flex", gap: "14px", alignItems: "flex-start"}}><div style={{flex: "1"}}><span style={{fontFamily: "'DM Mono',monospace", fontSize: "12px", color: "#3F6E6A"}}>{n.date}</span><p style={{margin: "4px 0 0"}}>{n.text}</p></div><button onClick={n.onDel} aria-label="Delete note" style={{background: "none", border: "none", color: "#8A3A22", cursor: "pointer", padding: "6px", textDecoration: "underline", fontSize: "14px"}}>{es ? "Borrar" : "Delete"}</button></div></React.Fragment>))}
{(noNotes) && (<><p style={{margin: "0", color: "#55635E"}}>{es ? "Aún no hay notas." : "No visit notes yet."}</p></>)}
</div>
</>)}
</div>
<section aria-labelledby="del-h" style={{marginTop: "56px", borderTop: "1px solid #E2E8E0", paddingTop: "28px", maxWidth: "760px"}}>
<h2 id="del-h" style={{margin: "0", fontSize: "20px", fontWeight: "600"}}>{es ? "Borrar mi información guardada" : "Delete my stored information"}</h2>
<p style={{margin: "6px 0 14px", color: "#55635E", fontSize: "15.5px"}}>{es ? "Borra de este navegador todas las guías, preguntas, detalles de citas, notas y preferencias guardadas. No se puede deshacer." : "Removes all saved guides, questions, visit details, notes and preferences from this browser. This can’t be undone."}</p>
{(notConfirming) && (<><H as="button" onClick={askDelete} style={{background: "none", border: "1.5px solid #C97F67", color: "#8A3A22", borderRadius: "999px", padding: "11px 18px", fontWeight: "600", cursor: "pointer"}} hover={{background: "#FBF3EF"}}>{es ? "Borrar todos los datos…" : "Delete all data…"}</H></>)}
{(confirmDel) && (<><div role="alertdialog" aria-label="Confirm delete" style={{display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", background: "#F7E7E0", borderRadius: "16px", padding: "14px 16px"}}><span style={{fontWeight: "600", color: "#5C2E20", marginRight: "auto"}}>{es ? "¿Borrar todo lo que guardó CareBridge?" : "Delete everything stored by CareBridge?"}</span><button onClick={cancelDelete} style={{background: "#FFFEFB", border: "none", borderRadius: "999px", padding: "10px 16px", fontWeight: "600", cursor: "pointer"}}>{es ? "Cancelar" : "Cancel"}</button><button onClick={deleteAll} style={{background: "#8A3A22", color: "#FFFEFB", border: "none", borderRadius: "999px", padding: "10px 16px", fontWeight: "600", cursor: "pointer"}}>{es ? "Sí, borrar" : "Yes, delete"}</button></div></>)}
</section>
</main>
</>
  );
}
