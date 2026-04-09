# Analyze Reference

You are analyzing a reference website to reproduce it in Framer.

## Input
- Reference type: URL, screenshot, video, or mixed
- Goal: reproduce layout, visual hierarchy, motion behavior, and interaction logic
- Constraint: output structured data before generating Framer code

## Tasks
1. Infer the page structure and write a site map.
2. Identify typography hierarchy, spacing rhythm, and color system.
3. Identify every meaningful interaction:
   - load
   - hover
   - scroll
   - cursor
   - transition
   - svg-path
4. Separate:
   - native Framer-friendly behaviors
   - code-component behaviors
   - override-friendly behaviors
5. Flag uncertain parts clearly instead of guessing.

## Required output files
- orchestrator/output/site-map.json
- orchestrator/output/design-tokens.json
- orchestrator/output/motion-map.json

## Rules
- Structure first, motion second, polish last.
- Do not generate implementation code in this step.
- Name sections clearly and consistently.
- Include desktop and mobile notes when they differ.
