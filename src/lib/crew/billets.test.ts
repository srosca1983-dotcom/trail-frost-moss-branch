import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canMoveBillet, canTradeBillet, listBilletChanges, watchFamily } from "./billets.ts";

describe("billet moves stay in department", () => {
  it("lets an AB/W trade watches with another AB/W", () => {
    assert.equal(watchFamily("07"), "ab-watch");
    assert.equal(watchFamily("09"), "ab-watch");
    assert.equal(canTradeBillet("07", "09"), true);
    assert.equal(canTradeBillet("09", "07"), true);
    assert.equal(canMoveBillet("07", "09"), true);
  });

  it("lets QMEDs trade 12–4 / 4–8 / 8–12", () => {
    assert.equal(canTradeBillet("16", "17"), true);
    assert.equal(canTradeBillet("17", "18"), true);
  });

  it("lets 2/M and 3/M trade", () => {
    assert.equal(canTradeBillet("02", "03"), true);
  });

  it("lets 3 A/E trade 8–12 with 12–4, not with 2 A/E", () => {
    assert.equal(canTradeBillet("13", "14"), true);
    assert.equal(canTradeBillet("12", "24"), true);
    assert.equal(canTradeBillet("12", "13"), false);
    assert.equal(canTradeBillet("12", "14"), false);
  });

  it("never offers engine to deck or steward to engine", () => {
    assert.equal(canMoveBillet("07", "16"), false);
    assert.equal(canTradeBillet("07", "16"), false);
    assert.equal(canMoveBillet("02", "12"), false);
    assert.equal(canMoveBillet("21", "15"), false);
    assert.equal(canMoveBillet("16", "09"), false);
  });

  it("does not treat AB trading with Master as a watch trade", () => {
    assert.equal(canTradeBillet("07", "00"), false);
    assert.equal(canTradeBillet("07", "01"), false);
    assert.equal(canTradeBillet("07", "04"), false);
  });

  it("can move an AB/W onto an empty AB/W watch, not onto AB Day, bosun, cadet, or QMED", () => {
    assert.equal(canMoveBillet("07", "08"), true);
    assert.equal(canMoveBillet("07", "09"), true);
    assert.equal(canMoveBillet("07", "06"), false);
    assert.equal(canMoveBillet("07", "04"), false);
    assert.equal(canMoveBillet("07", "16"), false);
    assert.equal(canMoveBillet("02", "06"), false);
    assert.equal(canMoveBillet("02", "00"), false);
    assert.equal(canMoveBillet("02", "25"), false);
  });

  it("lets an AB Day move onto the empty AB Day watch", () => {
    assert.equal(canMoveBillet("05", "06"), true);
    assert.equal(canTradeBillet("05", "06"), true);
  });

  it("lists trades first, then empty same-family slots, never engine or bosun", () => {
    const opts = listBilletChanges("07", [
      { id: "garcia", fullName: "Mark Garcia", billetCode: "08" },
      { id: "thomas", fullName: "Aldo Thomas", billetCode: "09" },
      { id: "newgen", fullName: "Allen Newgen", billetCode: "16" },
    ], "cooper");
    assert.ok(opts.some((o) => o.kind === "trade" && o.code === "08" && /Garcia/.test(o.label)));
    assert.ok(opts.some((o) => o.kind === "trade" && o.code === "09" && /Thomas/.test(o.label)));
    assert.equal(opts.some((o) => o.code === "06"), false);
    assert.equal(opts.some((o) => o.code === "16"), false);
    assert.equal(opts.some((o) => o.code === "12"), false);
    assert.equal(opts.some((o) => o.code === "21"), false);
    assert.equal(opts.some((o) => o.code === "25"), false);
    assert.equal(opts.some((o) => o.code === "02"), false);
    assert.equal(opts.some((o) => o.code === "04"), false);
    assert.ok(opts.every((o) => o.kind === "trade"));
  });

  it("offers a vacant same-family slot when that watch is empty", () => {
    const opts = listBilletChanges("07", [
      { id: "thomas", fullName: "Aldo Thomas", billetCode: "09" },
    ], "cooper");
    assert.ok(opts.some((o) => o.kind === "vacant" && o.code === "08" && /empty/.test(o.label)));
    assert.ok(opts.some((o) => o.kind === "trade" && o.code === "09"));
    const firstTrade = opts.find((o) => o.kind === "trade");
    const firstVacant = opts.find((o) => o.kind === "vacant");
    assert.ok(firstTrade && firstVacant);
    assert.ok(opts.indexOf(firstTrade) < opts.indexOf(firstVacant));
  });

  it("does not offer a trade onto a doubled-up job", () => {
    const opts = listBilletChanges("06", [
      { id: "said1", fullName: "Said One", billetCode: "05" },
      { id: "said2", fullName: "Said Two", billetCode: "05" },
    ], "mover");
    assert.equal(opts.some((o) => o.code === "05"), false);
  });

  it("does not let a rotary 2 A/E trade with a permanent on 2 A/E Day", () => {
    const opts = listBilletChanges("12", [
      { id: "khaleeli", fullName: "Cyrus E. Khaleeli", billetCode: "12", assignmentType: "RELIEF" },
      { id: "walkup", fullName: "Philip Walkup", billetCode: "24", assignmentType: "PERMANENT" },
    ], "khaleeli");
    assert.equal(opts.some((o) => o.code === "24"), false);
  });

  it("does not show Change watch on a permanent", () => {
    const opts = listBilletChanges("24", [
      { id: "walkup", fullName: "Philip Walkup", billetCode: "24", assignmentType: "PERMANENT" },
      { id: "khaleeli", fullName: "Cyrus E. Khaleeli", billetCode: "12", assignmentType: "RELIEF" },
    ], "walkup");
    assert.equal(opts.length, 0);
  });
});
