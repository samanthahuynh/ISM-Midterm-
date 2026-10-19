import React, { useCallback, useEffect, useRef, useState } from "react";
import { H } from "./ui/H.jsx";
import { update, useStore } from "./data/store.js";
import { activeProvider } from "./i18n/translation.js";
import { INFO } from "./content/info.js";
import { navigate, useRoute } from "./lib/router.js";
import Landing from "./pages/Landing.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Understand from "./pages/Understand.jsx";
import Topic from "./pages/Topic.jsx";
import Visit from "./pages/Visit.jsx";
import Procedures from "./pages/Procedures.jsx";
import Procedure from "./pages/Procedure.jsx";
import Notebook from "./pages/Notebook.jsx";

const SIZES = { sm: 1, md: 1.12, lg: 1.25 };

function useWide() {
  const query = "(min-width: 900px)";
  const [wide, setWide] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setWide(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}

export default function App() {
  const prefs = useStore((s) => s.prefs);
  const profile = useStore((s) => s.profile);
  const route = useRoute();
  const wide = useWide();
  const narrow = !wide;
  const lang = prefs.lang;
  const t = activeProvider.strings(lang);

  const [prefsOpen, setPrefsOpen] = useState(false);
  const [infoKey, setInfoKey] = useState(null);
  const [toast, setToast] = useState("");
  const prefsRef = useRef(null);
  const infoRef = useRef(null);
  const returnFocus = useRef(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }, []);

  const setPref = (k, v) => update((s) => ({ ...s, prefs: { ...s.prefs, [k]: v } }));

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Dialog focus management: focus the close button, Escape closes, restore focus after.
  useEffect(() => {
    if (prefsOpen) prefsRef.current?.focus();
    if (infoKey) infoRef.current?.focus();
    if (!prefsOpen && !infoKey) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setPrefsOpen(false);
        setInfoKey(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prefsOpen, infoKey]);

  useEffect(() => {
    if (!prefsOpen && !infoKey && returnFocus.current) {
      returnFocus.current.focus?.();
      returnFocus.current = null;
    }
  }, [prefsOpen, infoKey]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route.name, route.param]);

  const openPrefs = () => {
    returnFocus.current = document.activeElement;
    setPrefsOpen(true);
  };
  const closePrefs = () => setPrefsOpen(false);
  const openInfo = (key) => {
    returnFocus.current = document.activeElement;
    setInfoKey(key);
  };
  const closeInfo = () => setInfoKey(null);
  const stop = (e) => e.stopPropagation();
  const info = infoKey ? INFO[infoKey][lang] || INFO[infoKey].en : null;
  const hasInfo = Boolean(info);
  const hasToast = Boolean(toast);

  const goHome = () => navigate("/");
  const rmAttr = String(prefs.reduceMotion);
  const zoom = SIZES[prefs.textSize] || 1;
  const filt = prefs.highContrast ? "contrast(1.18) saturate(1.05)" : "none";
  const toastBottom = narrow ? "96px" : "28px";
  const footPad = narrow ? "120px" : "44px";

  const NAV = [
    { id: "home", path: "/home", label: t.nav.home, match: ["home"] },
    { id: "understand", path: "/understand", label: t.nav.understand, match: ["understand", "topic"] },
    { id: "visit", path: "/visit/1", label: t.nav.visit, match: ["visit"] },
    { id: "next", path: "/next", label: t.nav.next, match: ["next", "procedure"] },
    { id: "notebook", path: "/notebook", label: t.nav.notebook, match: ["notebook"] },
  ];
  const nav = NAV.map((n) => {
    const on = n.match.includes(route.name);
    return {
      label: n.label,
      cur: on ? "page" : undefined,
      onClick: () => navigate(n.path),
      bg: on ? "#EAF2EB" : "transparent",
      fg: on ? "#254D43" : "#3D4A45",
      fw: on ? "700" : "500",
      bar: on ? "#254D43" : "transparent",
    };
  });

  const langOpts = [
    { code: "en", label: "EN", full: "English" },
    { code: "es", label: "ES", full: "Español" },
  ].map((l) => {
    const on = lang === l.code;
    return {
      ...l,
      on,
      onClick: () => setPref("lang", l.code),
      bg: on ? "#254D43" : "transparent",
      fg: on ? "#FAF9F6" : "#3D4A45",
      bd: on ? "#254D43" : "#D5DED3",
      bg2: on ? "#EAF2EB" : "#FFFEFB",
    };
  });

  const sizeOpts = [
    { id: "sm", label: "Default", fs: "16px" },
    { id: "md", label: "Larger", fs: "20px" },
    { id: "lg", label: "Largest", fs: "24px" },
  ].map((o) => {
    const on = prefs.textSize === o.id;
    return { ...o, on, onClick: () => setPref("textSize", o.id), bd: on ? "#254D43" : "#D5DED3", bg: on ? "#EAF2EB" : "#FFFEFB" };
  });

  const toggles = [
    { key: "reduceMotion", label: "Reduce motion", desc: "Turn off animations and transitions." },
    { key: "highContrast", label: "Higher contrast", desc: "Make text and colors stand out more." },
  ].map((g) => {
    const on = Boolean(prefs[g.key]);
    return { ...g, on, onClick: () => setPref(g.key, !on), track: on ? "#254D43" : "#C9D3C7", knob: on ? "26px" : "4px" };
  });

  const levelOpts = [
    { id: "simple", label: "Simple", desc: "Key points in everyday words" },
    { id: "visual", label: "Visual", desc: "Pictures and step-by-step cards" },
    { id: "detailed", label: "Detailed", desc: "The full source summary" },
  ].map((o) => {
    const on = prefs.level === o.id;
    return { ...o, on, onClick: () => setPref("level", o.id), bd: on ? "#254D43" : "#D5DED3", bg: on ? "#EAF2EB" : "#FFFEFB" };
  });

  const footLinks = [
    { key: "about", en: "About", es: "Acerca de" },
    { key: "privacy", en: "Privacy", es: "Privacidad" },
    { key: "sources", en: "Sources", es: "Fuentes" },
    { key: "disclaimer", en: "Not medical advice", es: "No es consejo médico" },
  ].map((f) => ({ label: f[lang] || f.en, onClick: () => openInfo(f.key) }));

  const ctx = { lang, t, prefs, wide, narrow, toast: showToast, openInfo, openPrefs, setPref, route };

  const page = (() => {
    switch (route.name) {
      case "home":
        return <Dashboard ctx={ctx} />;
      case "understand":
        return <Understand ctx={ctx} />;
      case "topic":
        return <Topic ctx={ctx} key={route.query.u} />;
      case "visit":
        return <Visit ctx={ctx} />;
      case "next":
        return <Procedures ctx={ctx} />;
      case "procedure":
        return <Procedure ctx={ctx} key={route.param} />;
      case "notebook":
        return <Notebook ctx={ctx} />;
      default:
        return <Landing ctx={ctx} />;
    }
  })();

  const showDisclaimer = !prefs.disclaimerSeen;
  const profileName = profile?.displayName || (lang === "es" ? "Invitado" : "Guest");
  const profileInitials = profile?.initials || "·";
  const profileTag = profile?.demo ? "DEMO MODE" : lang === "es" ? "SOLO ESTE NAVEGADOR" : "THIS BROWSER ONLY";

  return (
<div data-root="" data-rm={rmAttr} style={{minHeight: "100vh", background: "#FAF9F6", color: "#27332F", fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: "17px", lineHeight: "1.55", zoom: zoom}}>
<H as="a" href="#main" data-noprint="" style={{position: "absolute", left: "-9999px", top: "8px", background: "#254D43", color: "#FAF9F6", padding: "10px 16px", borderRadius: "10px", zIndex: "100"}} focusStyle={{left: "12px"}}>Skip to main content</H>

<header data-noprint="" style={{position: "sticky", top: "0", zIndex: "40", background: "rgba(250,249,246,.9)", backdropFilter: "blur(14px)", borderBottom: "1px solid #E4E9E2", filter: filt}}>
<div style={{maxWidth: "1280px", margin: "0 auto", padding: "12px 24px", display: "flex", alignItems: "center", gap: "16px"}}>
<button onClick={goHome} aria-label="CareBridge home" style={{display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#254D43"}}>
<svg width="34" height="34" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="10" fill="#254D43"></rect><path d="M7.5 21.5 Q16 8 24.5 21.5" stroke="#A8BFA8" strokeWidth="2.6" fill="none" strokeLinecap="round"></path><circle cx="7.5" cy="21.5" r="2.8" fill="#E9B8A6"></circle><circle cx="24.5" cy="21.5" r="2.8" fill="#FAF9F6"></circle></svg>
<span style={{fontSize: "21px", fontWeight: "700", letterSpacing: "-.03em"}}>Care<span style={{fontWeight: "500", color: "#3F6E6A"}}>Bridge</span></span>
</button>
{(wide) && (<>
<nav aria-label="Primary" style={{display: "flex", gap: "2px", marginLeft: "12px"}}>
{(nav).map((n, __i) => (<React.Fragment key={__i}>
<H as="button" aria-current={n.cur} onClick={n.onClick} style={{padding: "9px 15px", borderRadius: "999px", border: "none", background: n.bg, color: n.fg, fontWeight: n.fw, fontSize: "15px", cursor: "pointer", transition: "background .2s"}} hover={{background: "#EAF2EB"}}>{n.label}</H>
</React.Fragment>))}
</nav>
</>)}
<div style={{marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px"}}>
<div role="group" aria-label="Language" style={{display: "flex", background: "#EEF2EC", borderRadius: "999px", padding: "3px"}}>
{(langOpts).map((l, __i) => (<React.Fragment key={__i}>
<button aria-pressed={l.on} onClick={l.onClick} style={{border: "none", borderRadius: "999px", padding: "6px 11px", fontSize: "13px", fontWeight: "600", cursor: "pointer", background: l.bg, color: l.fg}}>{l.label}</button>
</React.Fragment>))}
</div>
<H as="button" onClick={openPrefs} aria-haspopup="dialog" style={{display: "flex", alignItems: "center", gap: "7px", border: "1.5px solid #D5DED3", background: "#FFFEFB", borderRadius: "999px", padding: "7px 13px", fontSize: "14px", fontWeight: "600", cursor: "pointer", color: "#254D43"}} hover={{background: "#EAF2EB"}}>
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="4.5" r="1.8"></circle><path d="M5 8.5l7 1.5 7-1.5"></path><path d="M12 10v5"></path><path d="M9 21l3-6 3 6"></path></svg>
{(wide) && (<><span>{t.a11y}</span></>)}
</H>
{(wide) && (<>
<div title="Fictional demo profile" style={{display: "flex", alignItems: "center", gap: "8px", padding: "4px 12px 4px 4px", borderRadius: "999px", background: "#EAF2EB"}}>
<span aria-hidden="true" style={{width: "30px", height: "30px", borderRadius: "50%", background: "#E9B8A6", display: "grid", placeItems: "center", fontWeight: "700", fontSize: "13px", color: "#27332F"}}>{profileInitials}</span>
<span style={{fontSize: "13px", lineHeight: "1.15"}}><span style={{display: "block", fontWeight: "600"}}>{profileName}</span><span style={{fontFamily: "'DM Mono',monospace", fontSize: "10.5px", letterSpacing: ".06em", color: "#3F6E6A"}}>{profileTag}</span></span>
</div>
</>)}
</div>
</div>
</header>
{showDisclaimer && (<div data-noprint="" role="note" style={{background: "#F7E7E0", borderBottom: "1px solid #EBD3C8", filter: filt}}>
<div style={{maxWidth: "1280px", margin: "0 auto", padding: "12px 24px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap"}}>
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A3E2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex: "none"}}><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4M12 16h.01"></path></svg>
<p style={{margin: 0, color: "#5C2E20", fontSize: "15px", flex: "1 1 320px"}}>{t.disclaimerBar} <button onClick={() => openInfo("disclaimer")} style={{background: "none", border: "none", padding: 0, color: "#7A3E2B", fontWeight: "600", textDecoration: "underline", cursor: "pointer", fontSize: "15px"}}>{t.disclaimerMore}</button></p>
<H as="button" onClick={() => setPref("disclaimerSeen", true)} style={{background: "#FFFEFB", border: "none", borderRadius: "999px", padding: "9px 16px", fontWeight: "600", cursor: "pointer", color: "#7A3E2B", fontSize: "14px"}} hover={{background: "#FBF3EF"}}>{t.dismiss}</H>
</div>
</div>)}


{(prefsOpen) && (<>
<div data-noprint="" onClick={closePrefs} style={{position: "fixed", inset: "0", zIndex: "60", background: "rgba(39,51,47,.32)"}}></div>
<aside data-noprint="" role="dialog" aria-modal="true" aria-labelledby="prefs-title" style={{position: "fixed", top: "0", right: "0", bottom: "0", width: "min(440px,100vw)", zIndex: "61", background: "#FAF9F6", padding: "28px 28px 40px", overflow: "auto", boxShadow: "-20px 0 60px -20px rgba(37,77,67,.35)", display: "flex", flexDirection: "column", gap: "26px", animation: "cbUp .25s ease"}}>
<div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px"}}>
<h2 id="prefs-title" style={{margin: "0", fontSize: "26px", letterSpacing: "-.02em", color: "#254D43"}}>Accessibility &amp; preferences</h2>
<button ref={prefsRef} onClick={closePrefs} aria-label="Close preferences" style={{width: "44px", height: "44px", borderRadius: "50%", border: "1.5px solid #D5DED3", background: "#FFFEFB", cursor: "pointer", display: "grid", placeItems: "center"}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"></path></svg></button>
</div>
<p style={{margin: "-14px 0 0", color: "#55635E", fontSize: "15px"}}>Changes apply right away and are remembered in this browser.</p>
<fieldset style={{border: "none", padding: "0", margin: "0", display: "flex", flexDirection: "column", gap: "10px"}}>
<legend style={{fontWeight: "600", marginBottom: "10px"}}>Text size</legend>
<div style={{display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px"}}>
{(sizeOpts).map((o, __i) => (<React.Fragment key={__i}>
<button aria-pressed={o.on} onClick={o.onClick} style={{minHeight: "64px", borderRadius: "14px", border: `2px solid ${o.bd}`, background: o.bg, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px"}}><span style={{fontSize: o.fs, fontWeight: "700", lineHeight: "1"}}>Aa</span><span style={{fontSize: "12.5px", color: "#3D4A45"}}>{o.label}</span></button>
</React.Fragment>))}
</div>
</fieldset>
<div style={{display: "flex", flexDirection: "column", gap: "6px"}}>
{(toggles).map((g, __i) => (<React.Fragment key={__i}>
<div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "14px 16px", background: "#FFFEFB", border: "1px solid #E2E8E0", borderRadius: "16px"}}>
<span><span style={{display: "block", fontWeight: "600"}}>{g.label}</span><span style={{display: "block", fontSize: "14px", color: "#55635E"}}>{g.desc}</span></span>
<button role="switch" aria-checked={g.on} aria-label={g.label} onClick={g.onClick} style={{flex: "none", width: "54px", height: "32px", borderRadius: "999px", border: "none", background: g.track, cursor: "pointer", position: "relative", transition: "background .2s"}}><span style={{position: "absolute", top: "4px", left: g.knob, width: "24px", height: "24px", borderRadius: "50%", background: "#FFFEFB", boxShadow: "0 1px 3px rgba(0,0,0,.25)", transition: "left .2s"}}></span></button>
</div>
</React.Fragment>))}
</div>
<fieldset style={{border: "none", padding: "0", margin: "0"}}>
<legend style={{fontWeight: "600", marginBottom: "10px"}}>Language</legend>
<div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px"}}>
{(langOpts).map((l, __i) => (<React.Fragment key={__i}>
<button aria-pressed={l.on} onClick={l.onClick} style={{minHeight: "52px", borderRadius: "14px", border: `2px solid ${l.bd}`, background: l.bg2, fontWeight: "600", cursor: "pointer"}}>{l.full}</button>
</React.Fragment>))}
</div>
<p style={{fontSize: "13.5px", color: "#55635E", margin: "10px 0 0"}}>{lang === "es" ? "El español cubre la navegación, los títulos, los avisos y las preguntas sugeridas. Los temas de salud vienen de MedlinePlus en español (NLM). Las traducciones de CareBridge deben ser revisadas por traductores médicos calificados antes de usarse con pacientes." : "Spanish covers navigation, page titles, notices and suggested questions. Health topics load from MedlinePlus en español, published by NLM. CareBridge’s own translations must be reviewed by qualified medical translators before patient use."}</p>
</fieldset>
<fieldset style={{border: "none", padding: "0", margin: "0"}}>
<legend style={{fontWeight: "600", marginBottom: "10px"}}>Default reading level</legend>
<div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
{(levelOpts).map((o, __i) => (<React.Fragment key={__i}>
<button aria-pressed={o.on} onClick={o.onClick} style={{textAlign: "left", padding: "12px 16px", borderRadius: "14px", border: `2px solid ${o.bd}`, background: o.bg, cursor: "pointer"}}><span style={{fontWeight: "600"}}>{o.label}</span> <span style={{color: "#55635E", fontSize: "14px"}}>— {o.desc}</span></button>
</React.Fragment>))}
</div>
</fieldset>
</aside>
</>)}

{(hasInfo) && (<>
<div data-noprint="" onClick={closeInfo} style={{position: "fixed", inset: "0", zIndex: "70", background: "rgba(39,51,47,.35)", display: "grid", placeItems: "center", padding: "20px"}}>
<div role="dialog" aria-modal="true" aria-labelledby="info-title" onClick={stop} style={{maxWidth: "560px", width: "100%", background: "#FAF9F6", borderRadius: "24px", padding: "32px", boxShadow: "0 30px 80px -20px rgba(37,77,67,.4)", animation: "cbUp .25s ease"}}>
<div style={{fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".08em", textTransform: "uppercase", color: "#3F6E6A"}}>CareBridge</div>
<h2 id="info-title" style={{margin: "8px 0 14px", fontSize: "28px", letterSpacing: "-.02em", color: "#254D43"}}>{info.title}</h2>
<p style={{margin: "0", color: "#27332F", textWrap: "pretty"}}>{info.body}</p>
<button ref={infoRef} onClick={closeInfo} style={{marginTop: "24px", background: "#254D43", color: "#FAF9F6", border: "none", borderRadius: "999px", padding: "12px 22px", fontWeight: "600", cursor: "pointer"}}>Close</button>
</div>
</div>
</>)}

<div data-noprint="" role="status" aria-live="polite" style={{position: "fixed", left: "50%", bottom: toastBottom, transform: "translateX(-50%)", zIndex: "80", pointerEvents: "none"}}>
{(hasToast) && (<><div style={{display: "flex", alignItems: "center", gap: "10px", background: "#254D43", color: "#FAF9F6", padding: "13px 20px", borderRadius: "999px", boxShadow: "0 14px 40px -12px rgba(37,77,67,.6)", fontWeight: "500", fontSize: "15px", animation: "cbUp .25s ease", whiteSpace: "nowrap"}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A8BFA8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>{toast}</div></>)}
</div>

<div id="main" style={{filter: filt}}>
{page}
</div>

<footer data-noprint="" style={{background: "#EAF2EB", borderTop: "1px solid #DDE4DB", padding: `44px 24px ${footPad}`, filter: filt}}>
<div style={{maxWidth: "1280px", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "28px", justifyContent: "space-between", alignItems: "flex-start"}}>
<div style={{maxWidth: "420px"}}><div style={{display: "flex", alignItems: "center", gap: "10px"}}><svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="10" fill="#254D43"></rect><path d="M7.5 21.5 Q16 8 24.5 21.5" stroke="#A8BFA8" strokeWidth="2.6" fill="none" strokeLinecap="round"></path><circle cx="7.5" cy="21.5" r="2.8" fill="#E9B8A6"></circle><circle cx="24.5" cy="21.5" r="2.8" fill="#FAF9F6"></circle></svg><span style={{fontSize: "18px", fontWeight: "700", letterSpacing: "-.03em", color: "#254D43"}}>Care<span style={{fontWeight: "500", color: "#3F6E6A"}}>Bridge</span></span></div><p style={{margin: "12px 0 0", fontSize: "14.5px", color: "#3D4A45"}}>{lang === "es" ? "La salud explicada a su manera. Un prototipo de educación para pacientes y preparación de citas. No es consejo médico: en una emergencia, llame al 911." : "Healthcare explained your way. A prototype for patient education and visit preparation. Not medical advice — in an emergency, call 911."}</p></div>
<nav aria-label="Footer" style={{display: "flex", flexWrap: "wrap", gap: "6px"}}>
{(footLinks).map((f, __i) => (<React.Fragment key={__i}><H as="button" onClick={f.onClick} style={{background: "none", border: "none", padding: "8px 12px", fontWeight: "600", color: "#254D43", cursor: "pointer", borderRadius: "999px", fontSize: "15px"}} hover={{background: "#DCE8DC"}}>{f.label}</H></React.Fragment>))}
</nav>
</div>
</footer>

{(narrow) && (<>
<nav data-noprint="" aria-label="Primary" style={{position: "fixed", left: "0", right: "0", bottom: "0", zIndex: "45", background: "rgba(250,249,246,.96)", backdropFilter: "blur(12px)", borderTop: "1px solid #DDE4DB", display: "grid", gridTemplateColumns: "repeat(5,1fr)", padding: "6px 4px calc(6px + env(safe-area-inset-bottom))"}}>
{(nav).map((n, __i) => (<React.Fragment key={__i}>
<button aria-current={n.cur} onClick={n.onClick} style={{minHeight: "54px", border: "none", background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "5px", color: n.fg, fontSize: "12px", fontWeight: n.fw}}><span style={{width: "28px", height: "4px", borderRadius: "9px", background: n.bar}}></span>{n.label}</button>
</React.Fragment>))}
</nav>
</>)}
</div>
  );
}
