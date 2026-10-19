import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { fetchLabTest, isLoinc, labTextToSections, pickConnectEntry } from "../netlify/functions/_lib/labtests.mjs";

const feed = JSON.parse(readFileSync(new URL("./fixtures/connect-a1c.json", import.meta.url), "utf8"));

describe("MedlinePlus Connect lab test guides", () => {
  it("accepts only LOINC-shaped codes", () => {
    expect(isLoinc("4548-4")).toBe(true);
    expect(isLoinc("4548")).toBe(false);
    expect(isLoinc("4548-4; drop")).toBe(false);
  });

  it("prefers the MedlinePlus lab-test page and strips tracking", () => {
    const e = pickConnectEntry(feed);
    expect(e.url).toBe("https://medlineplus.gov/lab-tests/hemoglobin-a1c-hba1c-test");
    expect(pickConnectEntry({ feed: { entry: [{ title: { _value: "x" }, link: [{ href: "https://example.com/x" }] }] } })).toBeNull();
  });

  it("splits question headings, including ones glued to the previous sentence", () => {
    const { sections, altTitles } = labTextToSections(feed.feed.entry[0].summary._value);
    expect(sections.map((s) => s.heading)).toEqual([
      "What is a hemoglobin A1C (HbA1C) test?",
      "What is it used for?",
      "Why do I need an A1C test?",
      "What happens during an A1C test?",
      "What do the results mean?",
      "Is there anything else I need to know about an A1C test?",
    ]);
    expect(altTitles).toContain("glycated hemoglobin");
    const results = sections.find((s) => s.heading === "What do the results mean?");
    expect(results.blocks.find((b) => b.type === "list").items.map((i) => i.text)).toEqual([
      "Normal: A1C below 5.7%",
      "Prediabetes: A1C between 5.7% and 6.4%",
      "Diabetes: A1C of 6.5% or higher",
    ]);
    const used = sections.find((s) => s.heading === "What is it used for?");
    expect(used.blocks.at(-1)).toEqual({ type: "p", text: "The A1C test isn't used to diagnose type 1 diabetes but may be used for monitoring your blood glucose levels." });
    const text = JSON.stringify(sections);
    expect(text).not.toMatch(/Learn more about laboratory tests|American Diabetes Association|Other names/);
    expect(sections[0].blocks[2]).toEqual({ type: "list", ordered: false, items: [
      { text: "Glucose sticks to hemoglobin for as long as the red blood cells are alive.", children: [] },
      { text: "Red blood cells live about three months.", children: [] },
    ] });
  });

  it("fetchLabTest asks Connect for the right code and language", async () => {
    let called;
    const fake = async (url) => {
      called = new URL(url);
      return { ok: true, json: async () => feed };
    };
    const t = await fetchLabTest("4548-4", "es", fake);
    expect(called.searchParams.get("mainSearchCriteria.v.c")).toBe("4548-4");
    expect(called.searchParams.get("informationRecipient.languageCode.c")).toBe("es");
    expect(t.kind).toBe("labtest");
    expect(t.title).toBe("Hemoglobin A1C (HbA1c) Test");
  });
});
