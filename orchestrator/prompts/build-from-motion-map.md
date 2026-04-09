# Build From Motion Map

You are generating Framer-ready implementation files from structured specs.

## Input files
- orchestrator/output/site-map.json
- orchestrator/output/design-tokens.json
- orchestrator/output/motion-map.json

## Tasks
1. Create Framer code components for reusable UI sections.
2. Create Framer overrides for lightweight hover/cursor behaviors.
3. Use native Framer capabilities where possible.
4. Use GSAP only for advanced timeline, scrub, pin, or cursor-linked effects.
5. Add reduced-motion fallbacks for all animated behaviors.

## Output targets
- framer/code-components/*.tsx
- framer/overrides/*.ts
- framer/custom-code/*.html

## Rules
- React 18 compatible only.
- Spread existing props in overrides.
- Keep one responsibility per component or override.
- Preserve Framer usability for designers.
