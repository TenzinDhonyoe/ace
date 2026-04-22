#!/usr/bin/env bun
// Eval runner: reads eval/cases/*/expected.json and compares against
// eval/cases/*/generated.config.json (produced by running the generator
// against the corresponding inputs/).
//
// Outputs pass/fail per case + a final summary. No CI gate — this is
// a quality check the builder runs manually before every CLAUDE.md edit.

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const CASES_DIR = new URL("./cases/", import.meta.url).pathname;

// Only run the harness when invoked directly (e.g. `bun run eval`). When this
// module is imported (e.g. by run.test.js for unit tests), skip the script body.
if (import.meta.main) {
  const filter = process.argv.find((a, i) => process.argv[i - 1] === "--case");

  let cases;
  try {
    cases = readdirSync(CASES_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    console.log("No eval/cases/ directory yet — add a case with `mkdir eval/cases/<name>/`.");
    process.exit(0);
  }

  if (filter) cases = cases.filter((c) => c === filter);
  if (cases.length === 0) {
    console.log("No eval cases to run.");
    process.exit(0);
  }

  let pass = 0, fail = 0, skipped = 0;

  for (const name of cases) {
    const dir = join(CASES_DIR, name);
    const expectedPath = join(dir, "expected.json");
    const generatedPath = join(dir, "generated.config.json");

    if (!existsSync(expectedPath)) {
      console.log(`⊘  ${name}: no expected.json — skipping`);
      skipped++;
      continue;
    }
    if (!existsSync(generatedPath)) {
      console.log(`⊘  ${name}: no generated.config.json (run the generator against inputs/ first)`);
      skipped++;
      continue;
    }

    const expected = JSON.parse(readFileSync(expectedPath, "utf8"));
    const generated = JSON.parse(readFileSync(generatedPath, "utf8"));
    const failures = check(generated, expected);

    if (failures.length === 0) {
      console.log(`✓  ${name}`);
      pass++;
    } else {
      console.log(`✗  ${name}`);
      for (const f of failures) console.log(`     ${f}`);
      fail++;
    }
  }

  console.log(`\n${pass} pass · ${fail} fail · ${skipped} skipped`);
  process.exit(evalExitCode({ pass, fail, skipped }));
}

// Decide the exit code after all cases run. Surface silent skips as failures.
// Exit codes:
//   0 — at least one case ran and all ran cases passed
//   1 — one or more ran cases failed
//   2 — nothing actually ran (every case skipped). False-green guard: a green
//       eval should mean "we checked something," not "we checked nothing."
//       Use 2 (distinct from 1) so CI can distinguish "broken" from "unconfigured."
export function evalExitCode({ pass, fail, skipped }) {
  if (fail > 0) return 1;
  if (pass === 0 && skipped > 0) return 2;
  return 0;
}

function check(generated, expected) {
  const failures = [];
  const sections = generated.sections || [];

  if (expected.minSections != null && sections.length < expected.minSections) {
    failures.push(`expected >= ${expected.minSections} sections, got ${sections.length}`);
  }
  if (expected.maxSections != null && sections.length > expected.maxSections) {
    failures.push(`expected <= ${expected.maxSections} sections, got ${sections.length}`);
  }
  if (expected.maxWidgetsPerSection != null) {
    for (const s of sections) {
      if (s.widgets && s.widgets.length > expected.maxWidgetsPerSection) {
        failures.push(`section "${s.id}" has ${s.widgets.length} widgets (max ${expected.maxWidgetsPerSection})`);
      }
    }
  }

  if (expected.widgetDistribution) {
    const count = {};
    for (const s of sections) {
      for (const w of s.widgets || []) count[w.type] = (count[w.type] || 0) + 1;
    }
    for (const [type, bounds] of Object.entries(expected.widgetDistribution)) {
      const n = count[type] || 0;
      if (bounds.min != null && n < bounds.min) failures.push(`${type}: expected >= ${bounds.min}, got ${n}`);
      if (bounds.max != null && n > bounds.max) failures.push(`${type}: expected <= ${bounds.max}, got ${n}`);
    }
  }

  if (expected.mustMention) {
    const blob = JSON.stringify(generated).toLowerCase();
    for (const term of expected.mustMention) {
      if (!blob.includes(term.toLowerCase())) failures.push(`must mention "${term}"`);
    }
  }

  return failures;
}
