// Common lab tests, each mapped to its LOINC code (the standard code labs use).
// The server sends only the code to MedlinePlus Connect, which returns the
// MedlinePlus lab test guide. Codes were checked against Connect on 2026-10-19.
// Names here are labels for search only; every explanation comes from MedlinePlus.

export const LAB_TESTS = [
  { loinc: "4548-4", en: "Hemoglobin A1C (HbA1c)", es: "Hemoglobina A1c (HbA1c)", aka: ["a1c", "hba1c", "glycated hemoglobin", "glucosilada"] },
  { loinc: "58410-2", en: "Complete blood count (CBC)", es: "Conteo sanguíneo completo (CSC)", aka: ["cbc", "blood count", "hemograma", "biometría hemática"] },
  { loinc: "718-7", en: "Hemoglobin", es: "Hemoglobina", aka: ["hgb", "hb"] },
  { loinc: "51990-0", en: "Basic metabolic panel (BMP)", es: "Panel metabólico básico", aka: ["bmp", "chem 7", "electrolytes", "electrolitos"] },
  { loinc: "24323-8", en: "Comprehensive metabolic panel (CMP)", es: "Panel metabólico completo", aka: ["cmp", "chem 14", "metabolic panel"] },
  { loinc: "57698-3", en: "Cholesterol / lipid panel", es: "Colesterol / perfil de lípidos", aka: ["lipid", "cholesterol", "ldl", "hdl", "triglycerides", "colesterol", "triglicéridos", "lípidos"] },
  { loinc: "1558-6", en: "Blood glucose (fasting)", es: "Glucosa en sangre (en ayunas)", aka: ["glucose", "blood sugar", "fasting", "glucosa", "azúcar"] },
  { loinc: "3016-3", en: "TSH (thyroid-stimulating hormone)", es: "TSH (hormona estimulante de la tiroides)", aka: ["tsh", "thyroid", "tiroides"] },
  { loinc: "62292-8", en: "Vitamin D", es: "Vitamina D", aka: ["vitamin d", "25-hydroxy", "vitamina d"] },
  { loinc: "2132-9", en: "Vitamin B12", es: "Vitamina B12", aka: ["b12", "cobalamin", "vitamina b"] },
  { loinc: "2276-4", en: "Ferritin", es: "Ferritina", aka: ["ferritin", "iron stores", "hierro"] },
  { loinc: "2160-0", en: "Creatinine", es: "Creatinina", aka: ["creatinine", "kidney", "riñón"] },
  { loinc: "33914-3", en: "eGFR (kidney filtration rate)", es: "TFGe (filtración renal)", aka: ["egfr", "gfr", "kidney function", "función renal"] },
  { loinc: "24325-3", en: "Liver function tests", es: "Pruebas de función hepática", aka: ["liver", "alt", "ast", "hepatic", "hígado"] },
  { loinc: "1988-5", en: "C-reactive protein (CRP)", es: "Proteína C reactiva (PCR)", aka: ["crp", "inflammation", "inflamación"] },
  { loinc: "2857-1", en: "PSA (prostate-specific antigen)", es: "PSA (antígeno prostático específico)", aka: ["psa", "prostate", "próstata"] },
  { loinc: "24356-8", en: "Urinalysis", es: "Análisis de orina", aka: ["urine", "ua", "orina"] },
];

const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Catalog tests whose name or aliases contain the query. */
export function matchLabTests(query, lang) {
  const q = norm(query.trim());
  if (q.length < 2) return [];
  return LAB_TESTS.filter((t) => [t.en, t.es, ...t.aka].some((n) => norm(n).includes(q))).map((t) => ({ ...t, label: t[lang] || t.en }));
}

export const labTestByCode = (code) => LAB_TESTS.find((t) => t.loinc === code);
