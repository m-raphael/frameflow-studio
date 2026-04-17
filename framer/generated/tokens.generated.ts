export const designTokens = {
  "themeName": "waaark-com",
  "fonts": {
    "display": "Inter",
    "body": "Inter"
  },
  "colors": {
    "background": "#0a0a0a",
    "surface": "#111111",
    "surface2": "#171717",
    "text": "#f5f5f0",
    "muted": "#b8b8b0",
    "primary": "#d6ff3f",
    "border": "rgba(255,255,255,0.08)"
  },
  "radius": {
    "sm": 4,
    "md": 10,
    "lg": 20
  },
  "spacing": {
    "xs": 4,
    "sm": 8,
    "md": 16,
    "lg": 24,
    "xl": 48,
    "xxl": 96
  },
  "motion": {
    "easePrimary": "power4.out",
    "durationFast": 0.4,
    "durationBase": 0.95,
    "durationSlow": 1.5
  },
  "siteStyle": {
    "textAlign": "left",
    "heroStyle": "text-only",
    "galleryStyle": "list",
    "animationTempo": "cinematic",
    "displayFontSize": "clamp(44px, 7.1vw, 100px)",
    "bodyFontSize": "16px",
    "letterSpacing": "-0.04em",
    "borderRadius": "0px",
    "hasMarquee": false,
    "hasMagneticCursor": true
  }
} as const;
