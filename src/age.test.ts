import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ageForLine, formatAge, parseBlamePorcelain } from "./age";

describe("formatAge", () => {
  const now = Date.parse("2026-10-12T12:00:00.000Z");

  it("formats short and long ages", () => {
    assert.equal(formatAge(now - 10_000, now), "just now");
    assert.equal(formatAge(now - 5 * 60_000, now), "5m ago");
    assert.equal(formatAge(now - 3 * 60 * 60_000, now), "3h ago");
    assert.equal(formatAge(now - 2 * 24 * 60 * 60_000, now), "2d ago");
    assert.equal(formatAge(now - 40 * 24 * 60 * 60_000, now), "1mo ago");
    assert.equal(formatAge(now - 400 * 24 * 60 * 60_000, now), "1y ago");
  });
});

describe("parseBlamePorcelain", () => {
  it("maps final line numbers to author-time", () => {
    const porcelain = [
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa 1 3 1",
      "author Ada",
      "author-time 1700000000",
      "\t// TODO: old",
      "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb 2 4 1",
      "author-time 1700001000",
      "\t// FIXME: newer",
    ].join("\n");

    const ages = new Map<number, number>();
    parseBlamePorcelain(porcelain, ages);
    assert.equal(ages.get(3), 1_700_000_000 * 1000);
    assert.equal(ages.get(4), 1_700_001_000 * 1000);
  });
});

describe("ageForLine", () => {
  it("falls back to file mtime when a line is missing", () => {
    const ages = new Map<number, number>([[0, 42]]);
    assert.equal(ageForLine(ages, 10, 99), 42);
    assert.equal(ageForLine(new Map(), 10, 99), 99);
  });
});
