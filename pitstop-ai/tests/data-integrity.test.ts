import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { catalogue } from "./helpers";

describe("real-data integrity", () => {
  it("has brands and models", () => {
    expect(catalogue.brands.length).toBeGreaterThan(5);
    expect(catalogue.models.length).toBeGreaterThan(40);
  });

  it("every model has unique id, real source URLs and a dated retrieval", () => {
    const ids = new Set<string>();
    for (const m of catalogue.models) {
      expect(ids.has(m.id)).toBe(false);
      ids.add(m.id);
      expect(m.sources.length).toBeGreaterThan(0);
      for (const s of m.sources) {
        expect(s.url).toMatch(/^https?:\/\//);
        expect(s.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it("every cited fact points at a source that exists on that model", () => {
    const check = (node: unknown, ids: Set<string>, where: string) => {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) return node.forEach((n) => check(n, ids, where));
      const o = node as Record<string, unknown>;
      if ("v" in o && "s" in o) expect(ids.has(o.s as string), `${where}: ${String(o.s)}`).toBe(true);
      Object.values(o).forEach((v) => check(v, ids, where));
    };
    for (const m of catalogue.models) check({ d: m.dimensions, s: m.safety, p: m.price, o: m.options, w: m.warranty, st: m.seats }, new Set(m.sources.map((s) => s.id)), m.id);
  });

  it("photos exist locally and carry attribution and an honest match label", () => {
    for (const m of catalogue.models) {
      for (const img of m.images) {
        expect(existsSync(join(process.cwd(), "public", img.localPath)), img.localPath).toBe(true);
        expect(existsSync(join(process.cwd(), "public", img.thumbPath)), img.thumbPath).toBe(true);
        expect(img.author.length).toBeGreaterThan(0);
        expect(img.license).toMatch(/CC|public domain|PD/i);
        expect(img.filePageUrl).toMatch(/commons\.wikimedia\.org/);
        expect(["exact", "same-model-other-market", "same-model-other-generation"]).toContain(img.match);
      }
    }
  });

  it("prices are plausible rupee amounts and ranges are ordered", () => {
    for (const m of catalogue.models) {
      expect(m.price.minInr.v).toBeGreaterThan(200000);
      if (m.price.maxInr) expect(m.price.maxInr.v).toBeGreaterThanOrEqual(m.price.minInr.v);
    }
  });

  it("EV options have an ev block and others do not", () => {
    for (const m of catalogue.models) for (const o of m.options) expect(Boolean(o.ev)).toBe(o.fuel === "ev");
  });
});
