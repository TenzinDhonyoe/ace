# inputs/

Drop your lecture PDFs in this directory, then run `/ace-review` inside Claude Code.

## Optional: exam-structure.md

If you want to steer the generator, add a short `exam-structure.md` here:

```markdown
# Exam structure

## Course
BME804 — Biomedical MEMS

## Format
- Multiple choice (~30 Qs)
- Short concept questions

## Sections to cover
1. Microactuators (electrostatic, piezoelectric, electromagnetic, thermal/SMA)
2. Biosensors & lab-on-a-chip
3. Microsensors
4. System integration
```

If you don't provide this, the skill will either ask once or infer sections from your PDFs.

## What the skill does

1. Reads every PDF in this folder
2. Builds an outline of topics, equations, figures, vocabulary
3. Writes `../output/site.config.json`
4. Renders `../output/index.html` — a deployable study site
