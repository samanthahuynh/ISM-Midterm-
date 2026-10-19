import React from "react";
import { H } from "../ui/H.jsx";
import { navigate } from "../lib/router.js";

export default function Landing({ ctx }) {
  const { openPrefs } = ctx;
  const goDash = () => navigate("/home");
  const scrollHow = () => document.getElementById("how")?.scrollIntoView({ behavior: ctx.prefs.reduceMotion ? "auto" : "smooth" });

  const pillars = [
    { n: "1", tag: "UNDERSTAND", tint: "#DCE8DC", title: "Understand your health", desc: "Read trusted MedlinePlus health topics in simple, visual, or detailed form, in English or Spanish.", cta: "Explore the library", path: "/understand" },
    { n: "2", tag: "PREPARE", tint: "#F3DCD2", title: "Prepare for your visit", desc: "Organize what you want to say, build a question list, and print a one-page sheet to bring along.", cta: "Start preparing", path: "/visit/1" },
    { n: "3", tag: "NEXT STEPS", tint: "#E2ECEA", title: "Know what comes next", desc: "Read general guides to common tests and procedures, and keep your care team’s instructions in one place.", cta: "See procedure guides", path: "/next" },
  ].map((p) => ({ ...p, onClick: () => navigate(p.path) }));

  const journey = [
    { n: "1", bg: "#A8BFA8", title: "Learn the basics", desc: "Look up a condition or a word you heard, explained at the level that works for you." },
    { n: "2", bg: "#E9B8A6", title: "Write it down", desc: "Note what’s been going on in your own words. CareBridge doesn’t analyze it." },
    { n: "3", bg: "#DCE8DC", title: "Ask your questions", desc: "Bring a prioritized question list so the most important things get covered." },
    { n: "4", bg: "#F3DCD2", title: "Follow your plan", desc: "Save your care team’s instructions next to trusted background information." },
  ];

  const accessFeatures = [
    { tag: "READING LEVEL", bg: "#EAF2EB", title: "Simple, visual, or detailed", desc: "Switch how deep each explanation goes." },
    { tag: "LANGUAGE", bg: "#F7E7E0", title: "English & Spanish", desc: "Health topics from MedlinePlus en español." },
    { tag: "VISION", bg: "#E2ECEA", title: "Larger text & contrast", desc: "Adjust text size, contrast, and motion." },
    { tag: "PRIVACY", bg: "#EFE9D8", title: "Your notes stay with you", desc: "Saved only in your browser. Never sent to AI." },
  ];

  return (
<>
<main>
<section style={{maxWidth: "1280px", margin: "0 auto", padding: "56px 24px 80px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,440px),1fr))", gap: "56px", alignItems: "center"}}>
<div style={{animation: "cbUp .5s ease"}}>
<div style={{display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".08em", textTransform: "uppercase", color: "#3F6E6A", background: "#EAF2EB", padding: "7px 12px", borderRadius: "999px"}}><span style={{width: "7px", height: "7px", borderRadius: "50%", background: "#6A9C98"}}></span>Patient education · Visit preparation</div>
<h1 style={{fontSize: "clamp(46px,6.6vw,88px)", lineHeight: ".98", letterSpacing: "-.045em", fontWeight: "600", margin: "24px 0 0", color: "#254D43", textWrap: "balance"}}>Healthcare explained <span style={{fontStyle: "italic", fontWeight: "500", color: "#6A9C98"}}>your way.</span></h1>
<p style={{fontSize: "clamp(19px,1.6vw,22px)", lineHeight: "1.5", color: "#3D4A45", maxWidth: "520px", margin: "26px 0 0", textWrap: "pretty"}}>Understand your health, prepare for appointments, and take the next step with confidence.</p>
<div style={{display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "34px"}}>
<H as="button" onClick={goDash} style={{display: "inline-flex", alignItems: "center", gap: "10px", background: "#254D43", color: "#FAF9F6", border: "none", borderRadius: "999px", padding: "16px 26px", fontSize: "17px", fontWeight: "600", cursor: "pointer", transition: "background .2s,transform .2s"}} hover={{background: "#1B3B33", transform: "translateY(-1px)"}}>Explore CareBridge<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"></path></svg></H>
<H as="button" onClick={scrollHow} style={{background: "transparent", color: "#254D43", border: "1.5px solid #A8BFA8", borderRadius: "999px", padding: "15px 24px", fontSize: "17px", fontWeight: "600", cursor: "pointer", transition: "background .2s"}} hover={{background: "#EAF2EB"}}>How It Works</H>
</div>
<p style={{margin: "26px 0 0", fontSize: "14.5px", color: "#55635E", display: "flex", alignItems: "center", gap: "8px"}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3F6E6A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>Supports — never replaces — your healthcare team.</p>
</div>
<div aria-hidden="true" style={{position: "relative", background: "#EAF2EB", borderRadius: "36px", padding: "44px 28px 64px", minHeight: "520px", overflow: "hidden"}}>
<div style={{position: "absolute", width: "380px", height: "380px", borderRadius: "50%", background: "#DCE8DC", right: "-120px", top: "-120px"}}></div>
<div style={{position: "absolute", width: "180px", height: "180px", borderRadius: "50%", background: "#F3DCD2", left: "-60px", bottom: "-60px"}}></div>
<div style={{position: "relative", maxWidth: "420px", margin: "0 auto", background: "#FFFEFB", borderRadius: "24px", padding: "24px", boxShadow: "0 30px 60px -30px rgba(37,77,67,.45)", border: "1px solid #E2E8E0"}}>
<div style={{fontFamily: "'DM Mono',monospace", fontSize: "11px", letterSpacing: ".06em", color: "#55635E"}}>UNDERSTAND › BONES &amp; JOINTS</div>
<div style={{fontSize: "24px", fontWeight: "600", letterSpacing: "-.02em", color: "#254D43", marginTop: "8px"}}>Carpal tunnel syndrome</div>
<div style={{display: "flex", gap: "4px", background: "#F1F4EF", borderRadius: "12px", padding: "4px", marginTop: "16px"}}>
<span style={{flex: "1", textAlign: "center", padding: "8px", borderRadius: "9px", background: "#254D43", color: "#FAF9F6", fontSize: "13px", fontWeight: "600"}}>Simple</span>
<span style={{flex: "1", textAlign: "center", padding: "8px", fontSize: "13px", color: "#3D4A45"}}>Visual</span>
<span style={{flex: "1", textAlign: "center", padding: "8px", fontSize: "13px", color: "#3D4A45"}}>Detailed</span>
</div>
<div style={{marginTop: "16px", background: "#EAF2EB", borderRadius: "16px", padding: "16px"}}>
<div style={{fontFamily: "'DM Mono',monospace", fontSize: "11px", letterSpacing: ".08em", color: "#254D43", fontWeight: "500"}}>IN SIMPLE TERMS</div>
<div style={{fontSize: "15px", lineHeight: "1.5", marginTop: "6px"}}>A nerve in your wrist gets squeezed, which can make your fingers feel numb or tingly.</div>
</div>
<div style={{display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "6px", marginTop: "18px", height: "78px", background: "#F6F8F4", borderRadius: "16px", padding: "12px"}}>
<div style={{width: "70%", height: "54px", borderRadius: "30px 30px 14px 14px", border: "2px solid #A8BFA8", borderTop: "7px solid #254D43", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", padding: "0 10px"}}>
<span style={{width: "10px", height: "10px", borderRadius: "50%", background: "#C9D8C5"}}></span><span style={{width: "10px", height: "10px", borderRadius: "50%", background: "#C9D8C5"}}></span><span style={{width: "16px", height: "16px", borderRadius: "50%", background: "#E9B8A6", border: "2px solid #C97F67"}}></span><span style={{width: "10px", height: "10px", borderRadius: "50%", background: "#C9D8C5"}}></span><span style={{width: "10px", height: "10px", borderRadius: "50%", background: "#C9D8C5"}}></span>
</div>
</div>
</div>
<div style={{position: "absolute", left: "18px", bottom: "22px", width: "250px", background: "#FFFEFB", borderRadius: "18px", padding: "14px 16px", boxShadow: "0 20px 40px -20px rgba(37,77,67,.5)", border: "1px solid #E2E8E0"}}>
<div style={{fontSize: "12px", fontWeight: "600", color: "#3F6E6A"}}>My questions · 3</div>
<div style={{display: "flex", gap: "8px", alignItems: "flex-start", marginTop: "8px", fontSize: "13px", lineHeight: "1.35"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="#E9B8A6" stroke="#C97F67" strokeWidth="1.5" style={{flex: "none", marginTop: "2px"}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>What should I expect during recovery?</div>
<div style={{display: "flex", gap: "8px", alignItems: "flex-start", marginTop: "6px", fontSize: "13px", lineHeight: "1.35", color: "#55635E"}}><span style={{width: "14px", flex: "none"}}></span>Do I need a nerve test?</div>
</div>
<div style={{position: "absolute", right: "18px", top: "18px", background: "#254D43", color: "#FAF9F6", borderRadius: "16px", padding: "12px 14px", width: "170px", boxShadow: "0 20px 40px -20px rgba(37,77,67,.6)"}}>
<div style={{fontSize: "11px", fontFamily: "'DM Mono',monospace", letterSpacing: ".06em", color: "#A8BFA8"}}>VISIT · NOV 4</div>
<div style={{fontSize: "13px", marginTop: "4px"}}>Prep 75% ready</div>
<div style={{height: "5px", background: "rgba(255,255,255,.18)", borderRadius: "9px", marginTop: "8px"}}><div style={{width: "75%", height: "100%", background: "#E9B8A6", borderRadius: "9px"}}></div></div>
</div>
</div>
</section>

<section aria-labelledby="pillars-h" style={{maxWidth: "1280px", margin: "0 auto", padding: "24px 24px 96px"}}>
<div style={{display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "20px", marginBottom: "36px"}}>
<h2 id="pillars-h" style={{margin: "0", fontSize: "clamp(32px,3.8vw,48px)", lineHeight: "1.05", letterSpacing: "-.035em", fontWeight: "600", color: "#27332F", maxWidth: "640px", textWrap: "balance"}}>Three ways CareBridge helps you feel ready.</h2>
<p style={{margin: "0", maxWidth: "380px", color: "#55635E", textWrap: "pretty"}}>From the first question you have to the last instruction you’re given — in language that makes sense to you.</p>
</div>
<div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: "20px"}}>
{(pillars).map((p, __i) => (<React.Fragment key={__i}>
<H as="button" onClick={p.onClick} style={{textAlign: "left", background: "#FFFEFB", border: "1px solid #E2E8E0", borderRadius: "28px", padding: "32px", cursor: "pointer", display: "flex", flexDirection: "column", gap: "14px", minHeight: "300px", boxShadow: "0 1px 2px rgba(37,77,67,.04)", transition: "transform .25s,box-shadow .25s"}} hover={{transform: "translateY(-3px)", boxShadow: "0 24px 50px -28px rgba(37,77,67,.35)"}}>
<div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}><span style={{width: "56px", height: "56px", borderRadius: "18px", background: p.tint, display: "grid", placeItems: "center", fontSize: "22px", fontWeight: "700", color: "#254D43"}}>{p.n}</span><span style={{fontFamily: "'DM Mono',monospace", fontSize: "12px", color: "#55635E", letterSpacing: ".06em"}}>{p.tag}</span></div>
<span style={{fontSize: "26px", fontWeight: "600", letterSpacing: "-.025em", color: "#254D43", marginTop: "auto"}}>{p.title}</span>
<span style={{color: "#3D4A45", textWrap: "pretty"}}>{p.desc}</span>
<span style={{display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: "600", color: "#3F6E6A", fontSize: "15px"}}>{p.cta} →</span>
</H>
</React.Fragment>))}
</div>
</section>

<section id="how" aria-labelledby="how-h" style={{padding: "0 24px 96px"}}>
<div style={{maxWidth: "1280px", margin: "0 auto", background: "#254D43", color: "#FAF9F6", borderRadius: "40px", padding: "clamp(36px,5vw,72px)"}}>
<div style={{fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".08em", textTransform: "uppercase", color: "#A8BFA8"}}>How CareBridge works</div>
<h2 id="how-h" style={{margin: "14px 0 0", fontSize: "clamp(32px,3.8vw,48px)", lineHeight: "1.05", letterSpacing: "-.035em", fontWeight: "600", maxWidth: "680px", textWrap: "balance"}}>A calmer path from “I’m not sure” to “I’m ready.”</h2>
<ol style={{listStyle: "none", padding: "0", margin: "48px 0 0", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: "28px"}}>
{(journey).map((j, __i) => (<React.Fragment key={__i}>
<li style={{display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid rgba(168,191,168,.4)", paddingTop: "22px"}}>
<span style={{width: "44px", height: "44px", borderRadius: "50%", background: j.bg, color: "#254D43", display: "grid", placeItems: "center", fontWeight: "700"}}>{j.n}</span>
<span style={{fontSize: "21px", fontWeight: "600", letterSpacing: "-.015em"}}>{j.title}</span>
<span style={{color: "#D7E2D6", fontSize: "16px", textWrap: "pretty"}}>{j.desc}</span>
</li>
</React.Fragment>))}
</ol>
</div>
</section>

<section aria-labelledby="access-h" style={{maxWidth: "1280px", margin: "0 auto", padding: "0 24px 96px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))", gap: "48px", alignItems: "start"}}>
<div>
<div style={{fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".08em", textTransform: "uppercase", color: "#3F6E6A"}}>Accessible by design</div>
<h2 id="access-h" style={{margin: "14px 0 0", fontSize: "clamp(32px,3.8vw,48px)", lineHeight: "1.05", letterSpacing: "-.035em", fontWeight: "600", textWrap: "balance"}}>Built for every kind of learner.</h2>
<p style={{margin: "20px 0 0", color: "#3D4A45", maxWidth: "480px", textWrap: "pretty"}}>People understand health information differently — by reading level, language, how they learn best, and how much they’ve navigated healthcare before. CareBridge adapts to you, not the other way around.</p>
<H as="button" onClick={openPrefs} style={{marginTop: "28px", background: "transparent", color: "#254D43", border: "1.5px solid #A8BFA8", borderRadius: "999px", padding: "13px 22px", fontWeight: "600", cursor: "pointer"}} hover={{background: "#EAF2EB"}}>Try accessibility settings</H>
</div>
<div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,230px),1fr))", gap: "14px"}}>
{(accessFeatures).map((f, __i) => (<React.Fragment key={__i}>
<div style={{background: f.bg, borderRadius: "24px", padding: "24px", display: "flex", flexDirection: "column", gap: "8px", minHeight: "170px"}}>
<span style={{fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".06em", color: "#254D43"}}>{f.tag}</span>
<span style={{fontSize: "20px", fontWeight: "600", letterSpacing: "-.015em", color: "#254D43", marginTop: "auto"}}>{f.title}</span>
<span style={{fontSize: "15px", color: "#3D4A45"}}>{f.desc}</span>
</div>
</React.Fragment>))}
</div>
</section>

<section style={{maxWidth: "1280px", margin: "0 auto", padding: "0 24px 104px"}}>
<div style={{borderTop: "1px solid #DDE4DB", paddingTop: "56px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))", gap: "32px", alignItems: "end"}}>
<p style={{margin: "0", fontSize: "clamp(24px,2.6vw,34px)", lineHeight: "1.25", letterSpacing: "-.02em", fontWeight: "500", color: "#254D43", textWrap: "pretty"}}>CareBridge does not replace healthcare professionals. It helps patients understand their health, prepare for conversations, and participate more confidently in their care.</p>
<div style={{display: "flex", justifyContent: "flex-end"}}><H as="button" onClick={goDash} style={{background: "#254D43", color: "#FAF9F6", border: "none", borderRadius: "999px", padding: "16px 26px", fontSize: "17px", fontWeight: "600", cursor: "pointer"}} hover={{background: "#1B3B33"}}>Open the demo dashboard</H></div>
</div>
</section>
</main>
</>
  );
}
