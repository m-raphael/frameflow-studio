import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { designTokens } from "../tokens.generated"

/**
 * Generated from site-map-agency.json
 * Page: home
 * Section: studio-story
 * Kind: story
 */
type Props = {
  title: string
  notes: string
  background: string
  textColor: string
}

export default function HomeStudioStorySection(props: Props) {
  return (
    <section
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: designTokens.spacing.md,
        padding: designTokens.spacing.xl,
        borderRadius: designTokens.radius.lg,
        background: props.background,
        color: props.textColor,
        border: `1px solid ${designTokens.colors.border}`
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          fontSize: 12,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          opacity: 0.7
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: designTokens.colors.primary
          }}
        />
        story
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: designTokens.spacing.sm }}>
        <h2
          style={{
            margin: 0,
            fontFamily: designTokens.fonts.display,
            fontSize: "clamp(32px, 6vw, 72px)",
            lineHeight: 0.95,
            letterSpacing: "-0.05em"
          }}
        >
          {props.title}
        </h2>

        <p
          style={{
            margin: 0,
            maxWidth: "42ch",
            fontFamily: designTokens.fonts.body,
            fontSize: 16,
            lineHeight: 1.6,
            opacity: 0.82
          }}
        >
          {props.notes}
        </p>
      </div>
    </section>
  )
}

HomeStudioStorySection.defaultProps = {
  title: "Studio Story",
  notes: "Motion supports narrative pacing",
  background: designTokens.colors.surface,
  textColor: designTokens.colors.text
}

addPropertyControls(HomeStudioStorySection, {
  title: {
    type: ControlType.String,
    title: "Title",
    defaultValue: "Studio Story"
  },
  notes: {
    type: ControlType.String,
    title: "Notes",
    defaultValue: "Motion supports narrative pacing"
  },
  background: {
    type: ControlType.Color,
    title: "Background",
    defaultValue: designTokens.colors.surface
  },
  textColor: {
    type: ControlType.Color,
    title: "Text",
    defaultValue: designTokens.colors.text
  }
})
