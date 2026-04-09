import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { designTokens } from "../generated/tokens.generated"

type Props = {
  title: string
  body: string
  useGeneratedDefaults: boolean
  background: string
  textColor: string
  accent: string
  radius: number
  padding: number
}

export default function TokenSection(props: Props) {
  const background = props.useGeneratedDefaults ? designTokens.colors.surface : props.background
  const textColor = props.useGeneratedDefaults ? designTokens.colors.text : props.textColor
  const accent = props.useGeneratedDefaults ? designTokens.colors.primary : props.accent
  const radius = props.useGeneratedDefaults ? designTokens.radius.lg : props.radius
  const padding = props.useGeneratedDefaults ? designTokens.spacing.lg : props.padding

  return (
    <section
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        padding,
        borderRadius: radius,
        background,
        color: textColor,
        border: `1px solid ${designTokens.colors.border}`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: designTokens.spacing.md
      }}
    >
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: 999,
          background: accent
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: designTokens.spacing.sm
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "clamp(28px, 5vw, 56px)",
            lineHeight: 0.95,
            letterSpacing: "-0.05em",
            fontFamily: designTokens.fonts.display
          }}
        >
          {props.title}
        </h2>

        <p
          style={{
            margin: 0,
            maxWidth: "36ch",
            fontSize: 16,
            lineHeight: 1.5,
            opacity: 0.82,
            fontFamily: designTokens.fonts.body
          }}
        >
          {props.body}
        </p>
      </div>
    </section>
  )
}

TokenSection.defaultProps = {
  title: "Generated Tokens",
  body: "This component reads defaults from a generated token file produced by the local build script.",
  useGeneratedDefaults: true,
  background: designTokens.colors.surface,
  textColor: designTokens.colors.text,
  accent: designTokens.colors.primary,
  radius: designTokens.radius.lg,
  padding: designTokens.spacing.lg
}

addPropertyControls(TokenSection, {
  title: { type: ControlType.String, title: "Title", defaultValue: "Generated Tokens" },
  body: {
    type: ControlType.String,
    title: "Body",
    defaultValue: "This component reads defaults from a generated token file produced by the local build script."
  },
  useGeneratedDefaults: {
    type: ControlType.Boolean,
    title: "Use Tokens",
    defaultValue: true
  },
  background: {
    type: ControlType.Color,
    title: "Background",
    defaultValue: designTokens.colors.surface,
    hidden: (props) => props.useGeneratedDefaults
  },
  textColor: {
    type: ControlType.Color,
    title: "Text",
    defaultValue: designTokens.colors.text,
    hidden: (props) => props.useGeneratedDefaults
  },
  accent: {
    type: ControlType.Color,
    title: "Accent",
    defaultValue: designTokens.colors.primary,
    hidden: (props) => props.useGeneratedDefaults
  },
  radius: {
    type: ControlType.Number,
    title: "Radius",
    defaultValue: designTokens.radius.lg,
    min: 0,
    max: 64,
    unit: "px",
    hidden: (props) => props.useGeneratedDefaults
  },
  padding: {
    type: ControlType.Number,
    title: "Padding",
    defaultValue: designTokens.spacing.lg,
    min: 0,
    max: 120,
    unit: "px",
    hidden: (props) => props.useGeneratedDefaults
  }
})
