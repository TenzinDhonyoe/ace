import { describe, it, expect } from "bun:test";
import { evalExitCode } from "./run.js";

describe("evalExitCode", () => {
  it("returns 0 when cases ran and all passed", () => {
    expect(evalExitCode({ pass: 3, fail: 0, skipped: 0 })).toBe(0);
  });

  it("returns 0 when some ran and passed, others skipped", () => {
    expect(evalExitCode({ pass: 1, fail: 0, skipped: 4 })).toBe(0);
  });

  it("returns 1 when any case failed", () => {
    expect(evalExitCode({ pass: 2, fail: 1, skipped: 0 })).toBe(1);
  });

  it("returns 1 when failures dominate even with skips", () => {
    expect(evalExitCode({ pass: 0, fail: 1, skipped: 3 })).toBe(1);
  });

  it("returns 2 when every case skipped (false-green guard)", () => {
    expect(evalExitCode({ pass: 0, fail: 0, skipped: 5 })).toBe(2);
  });

  it("returns 0 when there are no cases at all (empty repo / filtered out)", () => {
    // Not a false green — caller already handled the empty-cases path before
    // calling us. This branch is defensive only.
    expect(evalExitCode({ pass: 0, fail: 0, skipped: 0 })).toBe(0);
  });
});
