# QA Report

## Project
- Reference: Unknown
- Build target: Unknown
- Build mode: Unknown
- Date: 2026-04-17T05:03:37.993Z
- Generator: orchestrator/scripts/build-qa.mjs

## Summary
- Total checks: 28
- Passing: 27
- Failing: 1 (0 critical · 0 medium · 1 minor)
- Verdict: **Pass**

## Breakpoints to verify manually
- [ ] Desktop 1440px — layout, spacing, typography scale
- [ ] Tablet 768px — layout reflow, motion still appropriate
- [ ] Mobile 390px — touch targets, reduced-motion fallback active, no overflow

## Parity checklist (manual)
- [ ] Layout parity with reference
- [ ] Typography parity — fonts, weights, sizes, letter-spacing
- [ ] Color parity — background, text, accent, border
- [ ] Motion parity — entry, hover, scroll, cursor, transition
- [ ] Hover / cursor behavior parity
- [ ] Scroll behavior parity
- [ ] Asset replacement complete
- [ ] Reduced-motion fallback verified in OS accessibility mode
- [ ] Accessibility quick check — focus order, contrast, alt text

## Automated checks

### Required files
- [x] Site map — `orchestrator/output/site-map.json`
- [x] Design tokens — `orchestrator/output/design-tokens.json`
- [x] Motion map — `orchestrator/output/motion-map.json`
- [x] Generated tokens (JSON) — `framer/generated/tokens.generated.json`
- [x] Generated tokens (TS) — `framer/generated/tokens.generated.ts`
- [x] Section manifest — `framer/generated/sections/_manifest.json`
- [x] Motion decisions — `framer/generated/motion/motion-decisions.generated.json`
- [x] Override manifest — `framer/generated/motion/override-manifest.generated.json`
- [x] GSAP manifest — `framer/generated/motion/gsap-manifest.generated.json`
- [x] Placements manifest — `framer/generated/placements.json`

### Design tokens
- [x] Theme name present
- [x] Display font set
- [x] Body font set
- [x] Background color set
- [x] Primary color set
- [x] Spacing scale complete
- [x] Radius scale complete
- [x] Motion timing complete

### Generated sections (4 total)
- [x] At least one section generated
- [x] All section TSX files exist on disk

### Motion (1 interactions · 1 GSAP · 0 override · 0 native)
- [x] At least one motion interaction defined
- [x] All GSAP component files exist on disk
- [x] All override files exist on disk
- [x] Reduced-motion fallbacks defined for all GSAP components
- [x] Mobile fallbacks defined for all GSAP components

### Placements (0 of 4 ready)
- [x] Placements manifest has entries
- [ ] At least one placement is ready to insert — `0 of 4 ready`
- [x] All placements have a source file

## Findings

### Critical
- None

### Medium
- None

### Minor
- At least one placement is ready to insert: `0 of 4 ready`

## Fix list
1. At least one placement is ready to insert (`0 of 4 ready`)

## Final decision
- [x] Pass
- [ ] Pass with fixes
- [ ] Rework needed
