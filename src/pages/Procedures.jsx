import React, { useEffect, useState } from "react";
import { H } from "../ui/H.jsx";
import { lead } from "../ui/Blocks.jsx";
import { navigate } from "../lib/router.js";
import { update, useStore } from "../data/store.js";
import { getTopic } from "../services/api.js";
import { PROCEDURES, tintFor } from "../content/catalog.js";

export default function Procedures({ ctx }) {
  const { t, lang, toast } = ctx;
  const es = lang === "es";
  const saved = useStore((s) => s.savedProcedures);
  const [leads, setLeads] = useState({});

  // Each card shows the first sentence(s) of its MedlinePlus summary.
  useEffect(() => {
    let cancelled = false;
    setLeads({});
    PROCEDURES.forEach((p) => {
      getTopic(p.url[lang], p.title[lang])
        .then((d) => {
          const first = d.topic.sections.flatMap((s) => s.blocks).find((b) => b.type === "p");
          if (!cancelled) setLeads((l) => ({ ...l, [p.id]: lead(first?.text || "", 170) }));
        })
        .catch(() => !cancelled && setLeads((l) => ({ ...l, [p.id]: null })));
    });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const procList = PROCEDURES.map((p) => {
    const isSaved = saved.some((x) => x.id === p.id);
    const name = p.title[lang] || p.title.en;
    const l = leads[p.id];
    return {
      name,
      kind: p.kind[lang] || p.kind.en,
      initial: name[0],
      tint: tintFor(p.id),
      short: l === undefined ? (es ? "Cargando resumen de MedlinePlus…" : "Loading MedlinePlus summary…") : l || (es ? "Guía de MedlinePlus." : "MedlinePlus guide."),
      saved: isSaved,
      saveLabel: isSaved ? (es ? `Quitar ${name} del cuaderno` : `Remove ${name} from Notebook`) : es ? `Guardar ${name}` : `Save ${name}`,
      saveFill: isSaved ? "currentColor" : "none",
      onOpen: () => navigate(`/procedure/${p.id}`),
      onSave: () => {
        update((s) => ({ ...s, savedProcedures: isSaved ? s.savedProcedures.filter((x) => x.id !== p.id) : [{ id: p.id, savedAt: new Date().toISOString() }, ...s.savedProcedures] }));
        toast(isSaved ? (es ? "Quitado del cuaderno" : "Removed from Notebook") : es ? "Guardado en el cuaderno" : "Saved to Notebook");
      },
    };
  });

  return (
<>
<main style={{maxWidth: "1280px", margin: "0 auto", padding: "44px 24px 110px", animation: "cbUp .35s ease"}}>
<div style={{fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".08em", textTransform: "uppercase", color: "#3F6E6A"}}>{t.next.eyebrow}</div>
<h1 style={{margin: "10px 0 0", fontSize: "clamp(36px,4.6vw,60px)", lineHeight: "1.02", letterSpacing: "-.04em", fontWeight: "600", color: "#254D43"}}>{t.next.title}</h1>
<p style={{margin: "12px 0 0", fontSize: "19px", color: "#3D4A45", maxWidth: "680px"}}>{es ? "Guías generales de MedlinePlus sobre procedimientos comunes: para qué sirven, qué suele pasar y qué preguntar a su equipo." : "General MedlinePlus guides to common procedures: what they’re for, what usually happens, and what to ask your team."}</p>
<div role="note" style={{marginTop: "24px", display: "flex", gap: "14px", alignItems: "flex-start", background: "#F7E7E0", borderRadius: "20px", padding: "18px 20px", maxWidth: "900px"}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7A3E2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex: "none", marginTop: "2px"}}><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4M12 16h.01"></path></svg><p style={{margin: "0", color: "#5C2E20", fontSize: "15.5px"}}>{es ? <><strong>Educación general, no sus instrucciones.</strong> Siga siempre las instrucciones personalizadas de su propio equipo de salud. Si tiene preguntas sobre su atención, comuníquese con ellos. En una emergencia, llame al 911.</> : <><strong>General education, not your instructions.</strong> Always follow the individualized instructions from your own care team. For questions about your care, contact your treating team. In an emergency, call 911.</>}</p></div>
<div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,290px),1fr))", gap: "18px", marginTop: "28px"}}>
{(procList).map((p, __i) => (<React.Fragment key={__i}>
<H as="article" style={{background: "#FFFEFB", border: "1px solid #E2E8E0", borderRadius: "26px", padding: "24px", display: "flex", flexDirection: "column", gap: "10px", minHeight: "260px", transition: "transform .25s,box-shadow .25s"}} hover={{transform: "translateY(-3px)", boxShadow: "0 22px 44px -26px rgba(37,77,67,.4)"}}>
<div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}><span style={{width: "48px", height: "48px", borderRadius: "15px", background: p.tint, display: "grid", placeItems: "center", fontWeight: "700", color: "#254D43"}}>{p.initial}</span><span style={{fontFamily: "'DM Mono',monospace", fontSize: "11.5px", color: "#55635E", letterSpacing: ".05em"}}>{p.kind}</span></div>
<h2 style={{margin: "8px 0 0", fontSize: "22px", fontWeight: "600", letterSpacing: "-.02em", color: "#254D43"}}>{p.name}</h2>
<p style={{margin: "0", color: "#3D4A45", fontSize: "15.5px", textWrap: "pretty"}}>{p.short}</p>
<div style={{display: "flex", gap: "8px", alignItems: "center", marginTop: "auto", paddingTop: "10px"}}>
<H as="button" onClick={p.onOpen} style={{background: "#254D43", color: "#FAF9F6", border: "none", borderRadius: "999px", padding: "10px 18px", fontWeight: "600", fontSize: "15px", cursor: "pointer"}} hover={{background: "#1B3B33"}}>{es ? "Abrir guía" : "Open guide"}</H>
<H as="button" onClick={p.onSave} aria-pressed={p.saved} aria-label={p.saveLabel} title={p.saveLabel} style={{marginLeft: "auto", width: "44px", height: "44px", borderRadius: "50%", border: "1.5px solid #D5DED3", background: "#FFFEFB", cursor: "pointer", display: "grid", placeItems: "center", color: "#254D43"}} hover={{background: "#EAF2EB"}}><svg width="18" height="18" viewBox="0 0 24 24" fill={p.saveFill} stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" aria-hidden="true"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg></H>
</div>
</H>
</React.Fragment>))}
</div>
</main>
</>
  );
}
