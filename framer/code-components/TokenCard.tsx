import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

type Props = {
  title: string
  body: string
  background: string
  textColor: string
  borderColor: string
  radius: number
  padding: number
}

export default function TokenCard(props: Props) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 12,
        padding: props.padding,
        borderRadius: props.radius,
        background: props.background,
        border: `1px solid ${props.borderColor}`,
        color: props.textColor
      }}
    >
      <div
        style={{
          fontSize: "clamp(24px, 4vw, 42px)",
          lineHeight: 1,
          letterSpacing: "-0.05em",
          fontWeight: 600
        }}
      >
        {props.title}
      </div>

      <div
        style={{
          maxWidth: "32ch",
          fontSize: 16,
          lineHeight: 1.5,
          opacity: 0.84
        }}
      >
        {props.body}
      </div>
    </div>
  )
}

addPropertyControls(TokenCard, {
  title: {
    type: ControlType.String,
    title: "Title",
    defaultValue: "Selected Work"
  },
  body: {
    type: ControlType.String,
    title: "Body",
    defaultValue: "Reusable card driven by shared design tokens and ready for Framer layout composition."
  },
  background: {
    type: ControlType.Color,
    title: "Background",
    defaultValue: "#111111"
  },
  textColor: {
    type: ControlType.Color,
    title: "Text",
    defaultValue: "#F5F5F0"
  },
  borderColor: {
    type: ControlType.Color,
    title: "Border",
    defaultValue: "rgba(255,255,255,0.08)"
  },
  radius: {
    type: ControlType.Number,
    title: "Radius",
    defaultValue: 24,
    min: 0,
    max: 64,
    unit: "px"
  },
  padding: {
    type: ControlType.Number,
    title: "Padding",
    defaultValue: 24,
    min: 0,
    max: 120,
    unit: "px"
  }
})
