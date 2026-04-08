# FrameFlow orchestration rules

## Modes
1. ANALYZE
- Input: URL, screenshots, optional video
- Output:
  - orchestrator/output/site-map.json
  - orchestrator/output/design-tokens.json
  - orchestrator/output/motion-map.json
- Never write Framer code in this mode

2. BUILD
- Read the JSON specs
- Write:
  - framer/code-components/*.tsx
  - framer/overrides/*.ts
  - framer/custom-code/*.html
- Prefer Framer-native layout first
- Use code components for advanced interactions

3. QA
- Compare built output with reference screenshots
- Output:
  - orchestrator/output/qa-report.md
  - orchestrator/output/fixes.json

## Motion rules
- Classify each effect as: load, hover, scroll, cursor, transition, svg-path
- Rebuild structure first, motion second, decoration last
- Add reduced-motion fallback for every animated component
- If an effect cannot be matched natively, isolate it in a code component
