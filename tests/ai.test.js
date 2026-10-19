import { describe, expect, it } from "vitest";
import { screenTerm } from "../netlify/functions/ai.mjs";

describe("screenTerm (no patient data reaches the AI)", () => {
  it("accepts short medical words in English or Spanish", () => {
    expect(screenTerm("  biopsy ")).toBe("biopsy");
    expect(screenTerm("nerve conduction study")).toBe("nerve conduction study");
    expect(screenTerm("túnel carpiano")).toBe("túnel carpiano");
  });
  it("rejects anything that could carry identifying details", () => {
    expect(screenTerm("maya@example.com")).toBeNull();
    expect(screenTerm("born 04/12/1990")).toBeNull();
    expect(screenTerm("555-123-4567")).toBeNull();
    expect(screenTerm("my name is Maya Rodriguez and my knee hurts")).toBeNull();
    expect(screenTerm("a".repeat(61))).toBeNull();
    expect(screenTerm(42)).toBeNull();
  });
});

describe("/api/ai route guards", () => {
  const post = (body, headers = {}) =>
    new Request("https://carebridge.example/api/ai", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });

  it("is off unless AI_ENABLED and a key are set", async () => {
    const { default: handler } = await import("../netlify/functions/ai.mjs");
    delete process.env.AI_ENABLED;
    const res = await handler(post({ task: "explain", term: "biopsy" }), {});
    expect(res.status).toBe(503);
  });

  it("rejects cross-site requests and free text before calling anything", async () => {
    const { default: handler } = await import("../netlify/functions/ai.mjs");
    process.env.AI_ENABLED = "true";
    process.env.ANTHROPIC_API_KEY = "test-key-not-real";
    try {
      expect((await handler(post({ task: "explain", term: "biopsy" }, { Origin: "https://evil.example" }), {})).status).toBe(403);
      expect((await handler(post({ task: "explain", term: "I'm Maya, born 1990, my knee hurts" }), {})).status).toBe(400);
      expect((await handler(post({ task: "simplify", url: "https://example.com/x.html", title: "X" }), {})).status).toBe(400);
      expect((await handler(post({ task: "simplify", loinc: "4548-4; my A1C was 9%" }), {})).status).toBe(400);
      expect((await handler(post({ task: "organize", questions: ["anything"] }), {})).status).toBe(400);
    } finally {
      delete process.env.AI_ENABLED;
      delete process.env.ANTHROPIC_API_KEY;
    }
  });
});
