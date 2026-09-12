import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertSafeDeskName } from "./desk-drop.ts";

describe("desk drop names", () => {
  it("allows a packet name and blocks path tricks", () => {
    assert.equal(assertSafeDeskName("Yousuf Mohamed DOCS.pdf"), "Yousuf Mohamed DOCS.pdf");
    assert.throws(() => assertSafeDeskName("../secret.pdf"));
    assert.throws(() => assertSafeDeskName("notes.docx"));
  });
});
