import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  counterpartUrl,
  fetchTopic,
  isTopicUrl,
  parseSearchXml,
  sectionsToText,
  splitContributors,
  summaryToSections,
} from "../netlify/functions/_lib/medlineplus.mjs";

const xml = readFileSync(new URL("./fixtures/search-en.xml", import.meta.url), "utf8");

describe("parseSearchXml", () => {
  const { count, docs } = parseSearchXml(xml);
  it("reads count and documents", () => {
    expect(count).toBe(9);
    expect(docs).toHaveLength(2);
  });
  it("strips highlight spans and decodes entities", () => {
    expect(docs[0].title).toBe("Carpal Tunnel Syndrome");
    expect(docs[0].groups).toEqual(["Bones, Joints and Muscles", "Brain and Nerves"]);
    expect(docs[0].altTitles).toEqual(["Median nerve entrapment"]);
    expect(docs[0].snippet).toMatch(/^What is carpal tunnel syndrome\?.*…$/);
  });
});

describe("summaryToSections", () => {
  const [carpal, amyloid] = parseSearchXml(xml).docs;
  const sections = summaryToSections(carpal.summaryHtml);

  it("turns loose top-level text into headings", () => {
    expect(sections.map((s) => s.heading)).toEqual([
      "What is carpal tunnel syndrome?",
      "What causes carpal tunnel syndrome?",
      "What are the treatments for carpal tunnel syndrome?",
    ]);
  });
  it("keeps nested lists inside and beside list items", () => {
    const causes = sections[1].blocks[1];
    expect(causes.type).toBe("list");
    expect(causes.items[1].text).toBe("Health conditions, for example:");
    expect(causes.items[1].children[0].items.map((i) => i.text)).toEqual(["Diabetes.", "Rheumatoid arthritis."]);
    const treat = sections[2].blocks[1];
    expect(treat.items.map((i) => i.text)).toEqual(["Rest.", "Medicines:", "Surgery to make more space."]);
    expect(treat.items[1].children[0].items[0].text).toBe("Over-the-counter pain relievers");
  });
  it("drops empty paragraphs", () => {
    expect(sections[1].blocks).toHaveLength(2);
  });
  it("handles summaries without headings", () => {
    const s = summaryToSections(amyloid.summaryHtml);
    expect(s).toHaveLength(1);
    expect(s[0].heading).toBeNull();
    expect(s[0].blocks[0].text).toBe("Amyloidosis occurs when abnormal proteins build up.");
  });
  it("produces plain text for grounding", () => {
    const text = sectionsToText(sections);
    expect(text).toContain("## What causes carpal tunnel syndrome?");
    expect(text).toContain("  - Diabetes.");
    expect(text).not.toMatch(/<|&lt;/);
  });
});

describe("splitContributors", () => {
  it("moves agency credit lines into attribution", () => {
    const { sections, contributors } = splitContributors([
      { heading: "After", blocks: [{ type: "p", text: "You may feel cramping." }, { type: "p", text: "NIH: National Institute of Diabetes and Digestive and Kidney Diseases" }] },
    ]);
    expect(contributors).toEqual(["NIH: National Institute of Diabetes and Digestive and Kidney Diseases"]);
    expect(sections[0].blocks).toHaveLength(1);
  });
});

describe("topic urls", () => {
  it("accepts only MedlinePlus health topic pages", () => {
    expect(isTopicUrl("https://medlineplus.gov/carpaltunnelsyndrome.html")).toBe(true);
    expect(isTopicUrl("https://medlineplus.gov/spanish/carpaltunnelsyndrome.html")).toBe(true);
    expect(isTopicUrl("https://evil.example/carpal.html")).toBe(false);
    expect(isTopicUrl("https://medlineplus.gov/../x.html")).toBe(false);
  });
  it("maps English and Spanish counterparts", () => {
    expect(counterpartUrl("https://medlineplus.gov/asthma.html", "es")).toBe("https://medlineplus.gov/spanish/asthma.html");
    expect(counterpartUrl("https://medlineplus.gov/spanish/asthma.html", "en")).toBe("https://medlineplus.gov/asthma.html");
  });
});

describe("fetchTopic", () => {
  it("matches the requested URL among search results", async () => {
    const fakeFetch = async () => new Response(xml, { status: 200 });
    const topic = await fetchTopic("https://medlineplus.gov/amyloidosis.html", "Amyloidosis", fakeFetch);
    expect(topic.title).toBe("Amyloidosis");
    expect(topic.lang).toBe("en");
    expect(topic.summaryHtml).toBeUndefined();
  });
  it("returns null when the topic isn't in the results", async () => {
    const fakeFetch = async () => new Response(xml, { status: 200 });
    expect(await fetchTopic("https://medlineplus.gov/asthma.html", "Asthma", fakeFetch)).toBeNull();
  });
});
