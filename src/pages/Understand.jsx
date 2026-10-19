import React, { useEffect, useRef, useState } from "react";
import { H } from "../ui/H.jsx";
import { ErrorCard, Loading } from "../ui/Status.jsx";
import { lead } from "../ui/Blocks.jsx";
import { openTopic } from "../lib/router.js";
import { update, useStore } from "../data/store.js";
import { askAi, getAiStatus, searchTopics } from "../services/api.js";
import { CATEGORIES, FEATURED_TOPICS, MEDLINEPLUS_SEARCH, TERM_SUGGESTIONS, categoryFor, tintFor } from "../content/catalog.js";

function TermDef({ entry, lang, aiEnabled }) {
  const es = lang === "es";
  const [ai, setAi] = useState({ status: "idle" });
  if (entry.status === "loading") return <span style={{ color: "#55635E" }}>{es ? "Buscando en MedlinePlus…" : "Looking it up on MedlinePlus…"}</span>;
  if (entry.status === "error") return <span style={{ color: "#8A3A22" }}>{entry.message}</span>;
  if (entry.status === "none")
    return (
      <span>
        {es ? "MedlinePlus no tiene un tema para esta palabra. " : "MedlinePlus has no topic for this word. "}
        <a href={MEDLINEPLUS_SEARCH(entry.term, lang)} target="_blank" rel="noopener noreferrer">
          {es ? "Buscar en el sitio ↗" : "Search the full site ↗"}
        </a>
      </span>
    );
  const explain = async () => {
    setAi({ status: "loading" });
    try {
      const data = await askAi({ task: "explain", term: entry.term, lang });
      setAi({ status: "done", text: data.text });
    } catch (e) {
      setAi({ status: "error", message: e.message });
    }
  };
  return (
    <span style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <span style={{ fontSize: "12.5px", fontFamily: "'DM Mono',monospace", color: "#3F6E6A" }}>
        {es ? "TEMA MÁS CERCANO EN MEDLINEPLUS: " : "CLOSEST MEDLINEPLUS TOPIC: "}
        <a href={entry.url} target="_blank" rel="noopener noreferrer">{entry.title} ↗</a>
      </span>
      <span>{lead(entry.lead, 260)}</span>
      {aiEnabled && ai.status === "idle" && (
        <button onClick={explain} style={{ alignSelf: "flex-start", background: "none", border: "1.5px solid #A8BFA8", borderRadius: "999px", padding: "6px 12px", fontWeight: "600", fontSize: "13.5px", cursor: "pointer", color: "#254D43" }}>
          {es ? "Explicar con palabras más sencillas (IA)" : "Explain in simpler words (AI)"}
        </button>
      )}
      {ai.status === "loading" && <span style={{ color: "#55635E", fontSize: "14px" }}>{es ? "Preparando explicación…" : "Writing a simpler explanation…"}</span>}
      {ai.status === "error" && <span style={{ color: "#8A3A22", fontSize: "14px" }}>{ai.message}</span>}
      {ai.status === "done" && (
        <span style={{ background: "#F4F7F2", borderRadius: "12px", padding: "10px 12px", fontSize: "14.5px", whiteSpace: "pre-line" }}>
          <span style={{ display: "block", fontFamily: "'DM Mono',monospace", fontSize: "11px", letterSpacing: ".05em", color: "#7A3E2B", marginBottom: "4px" }}>
            {es ? "IA · BASADO SOLO EN EL TEXTO DE MEDLINEPLUS · VERIFIQUE CON SU EQUIPO DE SALUD" : "AI · BASED ONLY ON THE MEDLINEPLUS TEXT · CHECK WITH YOUR CARE TEAM"}
          </span>
          {ai.text}
        </span>
      )}
    </span>
  );
}

export default function Understand({ ctx }) {
  const { t, lang, toast, route } = ctx;
  const es = lang === "es";
  const savedTopics = useStore((s) => s.savedTopics);
  const [search, setSearchValue] = useState("");
  const [cat, setCat] = useState("all");
  const [state, setState] = useState({ status: "idle", results: [] });
  const [termQ, setTermQ] = useState("");
  const [termErr, setTermErr] = useState("");
  const [lookedUp, setLookedUp] = useState([]);
  const [aiEnabled, setAiEnabled] = useState(false);
  const reqRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    getAiStatus().then((s) => setAiEnabled(Boolean(s.enabled)));
  }, []);

  useEffect(() => {
    if (route.query.focus === "terms") document.getElementById("terms")?.scrollIntoView();
  }, [route.query.focus]);

  const runSearch = (q) => {
    reqRef.current?.abort();
    const query = q.trim();
    if (query.length < 2) {
      setState({ status: "idle", results: [] });
      return;
    }
    const ac = new AbortController();
    reqRef.current = ac;
    setState((s) => ({ ...s, status: "loading" }));
    searchTopics(query, lang, { signal: ac.signal })
      .then((data) => setState({ status: "done", results: data.results, count: data.count, query }))
      .catch((e) => {
        if (ac.signal.aborted) return;
        setState({ status: "error", results: [], message: e.message, query });
      });
  };

  // Re-run the current search when the language changes.
  useEffect(() => {
    if (search.trim().length >= 2) runSearch(search);
    return () => reqRef.current?.abort();
  }, [lang]);

  const setSearch = (e) => {
    const v = e.target.value;
    setSearchValue(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => runSearch(v), 450);
  };
  const clearSearch = () => {
    setSearchValue("");
    setCat("all");
    runSearch("");
    document.getElementById("lib-search")?.focus();
  };

  const cats = CATEGORIES.map((c) => {
    const on = cat === c.id;
    return { label: c[lang] || c.en, on, onClick: () => setCat(c.id), bd: on ? "#254D43" : "#D5DED3", bg: on ? "#254D43" : "#FFFEFB", fg: on ? "#FAF9F6" : "#27332F" };
  });
  const catDef = CATEGORIES.find((c) => c.id === cat);

  const isSaved = (url) => savedTopics.some((s) => s.url === url);
  const toggleSave = (item) => {
    const saved = isSaved(item.url);
    update((s) => ({
      ...s,
      savedTopics: saved ? s.savedTopics.filter((x) => x.url !== item.url) : [{ url: item.url, title: item.title, groups: item.groups, lang: item.lang, savedAt: new Date().toISOString() }, ...s.savedTopics],
    }));
    toast(saved ? (es ? "Quitado del cuaderno" : "Removed from Notebook") : es ? "Guardado en el cuaderno" : "Saved to Notebook");
  };

  const searching = search.trim().length >= 2;
  let items;
  if (searching) {
    items = state.results
      .filter((r) => cat === "all" || r.groups.some((g) => catDef.groups.includes(g)))
      .map((r) => ({ url: r.url, title: r.title, groups: r.groups, lang, sub: lead(r.lead || r.snippet, 180) }));
  } else {
    items = FEATURED_TOPICS.filter((f) => cat === "all" || f.cat === cat).map((f) => {
      const c = CATEGORIES.find((x) => x.id === f.cat);
      return { url: f.url[lang], title: f.title[lang], groups: c.groups, lang, sub: es ? "Tema de salud de MedlinePlus en español." : "MedlinePlus health topic from the National Library of Medicine." };
    });
  }

  const library = items.map((it) => {
    const saved = isSaved(it.url);
    const c = categoryFor(it.groups);
    return {
      name: it.title,
      sub: it.sub,
      cat: c ? c[lang] || c.en : it.groups[0] || "MedlinePlus",
      tint: tintFor(it.url),
      onOpen: () => openTopic(it.url, it.title),
      onSave: () => toggleSave(it),
      saved,
      saveLabel: saved ? (es ? `Quitar ${it.title} del cuaderno` : `Remove ${it.title} from Notebook`) : es ? `Guardar ${it.title}` : `Save ${it.title}`,
      saveFill: saved ? "currentColor" : "none",
    };
  });

  const loading = searching && state.status === "loading";
  const failed = searching && state.status === "error";
  const hasResults = !loading && !failed && library.length > 0;
  const noResults = searching && state.status === "done" && library.length === 0;
  const resultLabel = !searching
    ? es ? "Temas destacados. Busque para ver más de 1,000 temas de MedlinePlus." : "Featured topics. Search to see 1,000+ MedlinePlus topics."
    : loading
      ? es ? "Buscando en MedlinePlus…" : "Searching MedlinePlus…"
      : failed
        ? ""
        : es ? `${library.length} tema(s) de MedlinePlus para “${state.query}”` : `${library.length} MedlinePlus topic${library.length === 1 ? "" : "s"} for “${state.query}”`;

  const lookupTerm = async (raw) => {
    const term = (raw ?? termQ).trim();
    if (term.length < 2) {
      setTermErr(es ? "Escriba una palabra para buscar." : "Type a word to look up.");
      return;
    }
    setTermErr("");
    setTermQ("");
    const id = `${term}-${Date.now()}`;
    setLookedUp((l) => [{ id, term, status: "loading" }, ...l.filter((x) => x.term.toLowerCase() !== term.toLowerCase())].slice(0, 8));
    try {
      const data = await searchTopics(term, lang);
      const top = data.results[0];
      setLookedUp((l) => l.map((x) => (x.id === id ? (top ? { ...x, status: "done", title: top.title, url: top.url, lead: top.lead || top.snippet } : { ...x, status: "none" }) : x)));
    } catch (e) {
      setLookedUp((l) => l.map((x) => (x.id === id ? { ...x, status: "error", message: e.message } : x)));
    }
  };
  const terms = lookedUp.map((x) => ({ term: x.term, def: <TermDef entry={x} lang={lang} aiEnabled={aiEnabled} /> }));

  return (
<>
<main style={{maxWidth: "1280px", margin: "0 auto", padding: "44px 24px 110px", animation: "cbUp .35s ease"}}>
<div style={{fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".08em", textTransform: "uppercase", color: "#3F6E6A"}}>{t.und.eyebrow}</div>
<h1 style={{margin: "10px 0 0", fontSize: "clamp(36px,4.6vw,60px)", lineHeight: "1.02", letterSpacing: "-.04em", fontWeight: "600", color: "#254D43", maxWidth: "820px", textWrap: "balance"}}>{t.und.title}</h1>
<div style={{marginTop: "30px", position: "relative", maxWidth: "720px"}}>
<label htmlFor="lib-search" style={{position: "absolute", left: "-9999px"}}>{t.und.search}</label>
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3F6E6A" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)"}}><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
<H as="input" id="lib-search" type="search" value={search} onChange={setSearch} placeholder={t.und.search} style={{width: "100%", padding: "19px 22px 19px 56px", borderRadius: "999px", border: "1.5px solid #D5DED3", background: "#FFFEFB", fontSize: "18px", outline: "none", boxShadow: "0 10px 30px -22px rgba(37,77,67,.4)"}} focusStyle={{borderColor: "#254D43"}} />
</div>
<div role="group" aria-label="Filter by category" style={{display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "20px"}}>
{(cats).map((c, __i) => (<React.Fragment key={__i}>
<button aria-pressed={c.on} onClick={c.onClick} style={{borderRadius: "999px", padding: "10px 16px", fontSize: "15px", fontWeight: "500", cursor: "pointer", border: `1.5px solid ${c.bd}`, background: c.bg, color: c.fg, transition: "background .2s"}}>{c.label}</button>
</React.Fragment>))}
</div>
<p aria-live="polite" style={{margin: "22px 0 0", color: "#55635E", fontSize: "15px"}}>{resultLabel}</p>
{loading && <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,290px),1fr))", gap: "18px", marginTop: "14px"}}><Loading /><Loading /><Loading /></div>}
{failed && <div style={{marginTop: "14px"}}><ErrorCard message={state.message} onRetry={() => runSearch(search)} fallbackHref={MEDLINEPLUS_SEARCH(search, lang)} /></div>}
{(hasResults) && (<>
<div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,290px),1fr))", gap: "18px", marginTop: "14px"}}>
{(library).map((c, __i) => (<React.Fragment key={__i}>
<H as="article" style={{background: "#FFFEFB", border: "1px solid #E2E8E0", borderRadius: "26px", overflow: "hidden", display: "flex", flexDirection: "column", transition: "transform .25s,box-shadow .25s"}} hover={{transform: "translateY(-3px)", boxShadow: "0 22px 44px -26px rgba(37,77,67,.4)"}}>
<div style={{height: "116px", background: c.tint, position: "relative", overflow: "hidden"}}><span style={{position: "absolute", width: "150px", height: "150px", borderRadius: "50%", background: "rgba(255,254,251,.35)", right: "-30px", top: "-40px"}}></span><span style={{position: "absolute", width: "70px", height: "70px", borderRadius: "50%", background: "rgba(37,77,67,.08)", left: "24px", bottom: "-20px"}}></span><span style={{position: "absolute", left: "20px", top: "18px", fontFamily: "'DM Mono',monospace", fontSize: "11.5px", letterSpacing: ".06em", color: "#254D43", background: "rgba(255,254,251,.7)", padding: "4px 9px", borderRadius: "999px"}}>{c.cat}</span></div>
<div style={{padding: "22px 22px 20px", display: "flex", flexDirection: "column", gap: "8px", flex: "1"}}>
<h2 style={{margin: "0", fontSize: "21px", fontWeight: "600", letterSpacing: "-.02em", color: "#254D43"}}>{c.name}</h2>
<p style={{margin: "0", color: "#3D4A45", fontSize: "15.5px", textWrap: "pretty"}}>{c.sub}</p>
<div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginTop: "auto", paddingTop: "12px"}}>
<H as="button" onClick={c.onOpen} style={{background: "#254D43", color: "#FAF9F6", border: "none", borderRadius: "999px", padding: "10px 18px", fontWeight: "600", fontSize: "15px", cursor: "pointer"}} hover={{background: "#1B3B33"}}>{es ? "Leer guía" : "Read guide"}</H>
<H as="button" onClick={c.onSave} aria-pressed={c.saved} aria-label={c.saveLabel} title={c.saveLabel} style={{width: "44px", height: "44px", borderRadius: "50%", border: "1.5px solid #D5DED3", background: "#FFFEFB", cursor: "pointer", display: "grid", placeItems: "center", color: "#254D43"}} hover={{background: "#EAF2EB"}}><svg width="18" height="18" viewBox="0 0 24 24" fill={c.saveFill} stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" aria-hidden="true"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg></H>
</div>
</div>
</H>
</React.Fragment>))}
</div>
{searching && <p style={{margin: "14px 0 0"}}><span style={{fontSize: "13.5px", color: "#55635E"}}>{es ? "Resultados de MedlinePlus en español, Biblioteca Nacional de Medicina de EE. UU." : "Results from MedlinePlus, U.S. National Library of Medicine."}</span></p>}
</>)}
{(noResults) && (<>
<div style={{marginTop: "14px", background: "#F4F7F2", borderRadius: "24px", padding: "40px", textAlign: "center"}}>
<p style={{margin: "0", fontSize: "19px", fontWeight: "600", color: "#254D43"}}>{es ? `No hay temas para “${search}”.` : `No topics match “${search}”.`}</p>
<p style={{margin: "6px 0 18px", color: "#55635E"}}>{es ? "Pruebe otra palabra, revise la ortografía o elija otra categoría." : "Try a different word, check the spelling, or choose another category."}</p>
<button onClick={clearSearch} style={{background: "#254D43", color: "#FAF9F6", border: "none", borderRadius: "999px", padding: "12px 20px", fontWeight: "600", cursor: "pointer"}}>Clear search</button>
</div>
</>)}
<section id="terms" aria-labelledby="terms-h" style={{marginTop: "64px"}}>
<h2 id="terms-h" style={{margin: "0", fontSize: "30px", letterSpacing: "-.03em", fontWeight: "600"}}>{es ? "Términos médicos, en palabras sencillas" : "Medical terms, in plain words"}</h2>
<p style={{margin: "8px 0 0", color: "#55635E", maxWidth: "720px"}}>{es ? "Busque una palabra que escuchó en una cita. CareBridge muestra el tema más cercano de MedlinePlus; nunca escribe sus propias definiciones." : "Look up a word you heard at an appointment. CareBridge shows the closest MedlinePlus topic and never writes its own definitions."}</p>
<form onSubmit={(e) => { e.preventDefault(); lookupTerm(); }} style={{display: "flex", gap: "8px", marginTop: "18px", maxWidth: "560px"}}>
<label htmlFor="term-q" style={{position: "absolute", left: "-9999px"}}>{es ? "Palabra médica" : "Medical word"}</label>
<input id="term-q" type="text" value={termQ} onChange={(e) => setTermQ(e.target.value)} maxLength={60} placeholder={es ? "p. ej. biopsia" : "e.g. biopsy"} aria-describedby="term-err" style={{flex: "1", minWidth: "0", padding: "13px 14px", borderRadius: "12px", border: "1.5px solid #D5DED3", background: "#FAFBF8"}} />
<button type="submit" style={{background: "#254D43", color: "#FAF9F6", border: "none", borderRadius: "12px", padding: "0 18px", fontWeight: "600", cursor: "pointer"}}>{es ? "Buscar" : "Look up"}</button>
</form>
{termErr && <span id="term-err" role="alert" style={{display: "block", marginTop: "6px", color: "#8A3A22", fontSize: "14.5px"}}>{termErr}</span>}
<div style={{display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "14px"}}>
{TERM_SUGGESTIONS[lang].map((w) => <H as="button" key={w} onClick={() => lookupTerm(w)} style={{background: "#FFFEFB", border: "1.5px solid #DDE4DB", borderRadius: "999px", padding: "8px 14px", fontWeight: "500", fontSize: "14.5px", cursor: "pointer"}} hover={{background: "#EAF2EB", borderColor: "#A8BFA8"}}>{w}</H>)}
</div>
<dl aria-live="polite" style={{display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,300px),1fr))", gap: "12px", margin: "20px 0 0"}}>
{terms.map((g, __i) => (<React.Fragment key={__i}>
<div style={{background: "#FFFEFB", border: "1px solid #E2E8E0", borderRadius: "18px", padding: "18px"}}><dt style={{fontWeight: "700", color: "#254D43"}}>{g.term}</dt><dd style={{margin: "6px 0 0", fontSize: "15px", color: "#3D4A45"}}>{g.def}</dd></div>
</React.Fragment>))}
</dl>
</section>
</main>
</>
  );
}
