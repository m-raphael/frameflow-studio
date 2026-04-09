# Frameflow

## Purpose
Frameflow reproduces high-end reference websites into Framer-ready structures, code components, overrides, and deployment-ready repos.

## Core workflow
1. Analyze the reference URL, screenshots, or video.
2. Output structured specs before writing UI code.
3. Build Framer-ready code components and overrides.
4. Validate against the reference at desktop and mobile breakpoints.
5. Prepare clean GitHub-ready output.

## Rules
- Structure first, motion second, polish last.
- Use Framer-native capabilities first.
- Use code components for advanced interactions.
- Use GSAP only when Framer-native motion is not sufficient.
- Every advanced interaction must include a reduced-motion fallback.
- Never mix generated output with experimental scratch files.

## Required outputs
- orchestrator/output/site-map.json
- orchestrator/output/design-tokens.json
- orchestrator/output/motion-map.json
- orchestrator/output/qa-report.md

## Code standards
- React 18 compatible only.
- TypeScript for code components and overrides.
- Keep components small and isolated by effect.
- One interaction family per component where possible.

## Motion classification
- load
- hover
- scroll
- cursor
- transition
- svg-path
