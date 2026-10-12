import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { itemId, parseComments } from "./parser";

describe("parseComments", () => {
  it("finds single-line TODO, FIXME, HACK, and XXX comments", () => {
    const source = [
      "const x = 1; // TODO: wire this up",
      "# FIXME broken on windows",
      "/* HACK: temporary workaround */",
      "-- XXX investigate later",
    ].join("\n");

    const found = parseComments(source);
    assert.equal(found.length, 4);
    assert.deepEqual(
      found.map((item) => item.kind),
      ["TODO", "FIXME", "HACK", "XXX"],
    );
    assert.equal(found[0].text, "wire this up");
    assert.equal(found[0].line, 1);
    assert.equal(found[1].text, "broken on windows");
    assert.equal(found[2].text, "temporary workaround");
    assert.equal(found[3].line, 4);
  });

  it("is case-insensitive and accepts missing separators", () => {
    const found = parseComments("todo ship it\nFixme\nhack\nxxx:");
    assert.deepEqual(
      found.map((item) => ({ kind: item.kind, text: item.text })),
      [
        { kind: "TODO", text: "ship it" },
        { kind: "FIXME", text: "" },
        { kind: "HACK", text: "" },
        { kind: "XXX", text: "" },
      ],
    );
  });

  it("does not match keywords inside other words", () => {
    const found = parseComments("const todone = 1;\nconst prefixxxx = 2;\nconst hacker = 3;");
    assert.equal(found.length, 0);
  });

  it("records 1-based line numbers and the column of the keyword", () => {
    const found = parseComments("alpha\n    // TODO: later");
    assert.equal(found.length, 1);
    assert.equal(found[0].line, 2);
    assert.ok(found[0].column >= 0);
    assert.match("    // TODO: later".slice(found[0].column), /^TODO/i);
  });

  it("builds a stable item id", () => {
    assert.equal(itemId("file:///a.ts", 12, "TODO", "later"), "file:///a.ts:12:TODO:later");
  });
});
