# Decide Motion Implementation

You are deciding how each interaction should be implemented in Framer.

## Input
- orchestrator/output/motion-map.json
- orchestrator/output/site-map.json
- orchestrator/output/design-tokens.json

## Output
For each interaction, choose exactly one:
- native-framer
- override
- gsap-code-component

## Rules
1. Prefer native-framer for simple opacity, move, scale, rotation, reveal, and basic hover states.
2. Prefer override for lightweight pointer, hover, classless behavior wrapping an existing Framer layer.
3. Prefer gsap-code-component for:
   - scroll scrub
   - pinning
   - snapping
   - timeline coordination
   - cursor-linked premium effects
   - SVG/path or multi-target choreography
4. Every interaction must include:
   - reason
   - reducedMotionFallback
   - mobileFallback
5. If uncertain, mark confidence low and explain why.

## Response format
Return JSON:
{
  "interactions": [
    {
      "id": "hero-title-reveal",
      "implementation": "gsap-code-component",
      "reason": "Scroll-linked reveal with scrub behavior",
      "reducedMotionFallback": "static visible state",
      "mobileFallback": "simple fade-in",
      "confidence": "high"
    }
  ]
}
