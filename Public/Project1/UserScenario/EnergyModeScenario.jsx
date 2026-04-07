/**
 * EnergyModeScenario
 *
 * Interactive scenario diagram for the four energy modes.
 * Hover over a mode tab to highlight its user journey in the diagram.
 *
 * SETUP:
 *   1. Place all five SVG files in your /public folder (or adjust `svgBasePath`):
 *        User_Scenario_1.svg           ← base / default state
 *        User_Scenario_-_Fullspeed.svg
 *        User_Scenario_-_Hybrid.svg
 *        User_Scenario_-_SmartNav.svg
 *        User_Scenario_-_Eco.svg
 *
 *   2. Import and drop the component anywhere in your portfolio:
 *        import EnergyModeScenario from './EnergyModeScenario'
 *        <EnergyModeScenario />
 *
 *   Optional props:
 *        svgBasePath  — prefix for all SVG paths (default: "/")
 *        className    — extra class on the root wrapper
 */

import { useState } from "react"

const MODES = [
  {
    id: "fullspeed",
    label: "Full Speed",
    labelZh: "全速",
    color: "#C95023",
    colorLight: "#FAECE7",
    colorText: "#993C1D",
    file: "User_Scenario_-_Fullspeed.svg",
    trigger: '"We\'re going to miss the port window."',
    triggerZh: "「我们要误港了。」",
  },
  {
    id: "hybrid",
    label: "Hybrid",
    labelZh: "混合",
    color: "#D0882B",
    colorLight: "#FAEEDA",
    colorText: "#854F0B",
    file: "User_Scenario_-_Hybrid.svg",
    trigger: '"Just another day at sea."',
    triggerZh: "「今天就是普通的一天。」",
  },
  {
    id: "smartcruise",
    label: "Smart Cruise",
    labelZh: "智能巡航",
    color: "#2968B6",
    colorLight: "#E6F1FB",
    colorText: "#185FA5",
    file: "User_Scenario_-_SmartNav.svg",
    trigger: '"Long haul. Battery\'s full. Smooth sailing."',
    triggerZh: "「长途航行，电量充足，前方平稳。」",
  },
  {
    id: "eco",
    label: "Eco Mode",
    labelZh: "节能模式",
    color: "#7CC237",
    colorLight: "#EAF3DE",
    colorText: "#3B6D11",
    file: "User_Scenario_-_Eco.svg",
    trigger: '"We\'re early — and heading into a restricted zone."',
    triggerZh: "「我们提前了，而且快进排放控制区了。」",
  },
]

export default function EnergyModeScenario({
  svgBasePath = "/",
  className = "",
}) {
  const [hovered, setHovered] = useState(null)

  const base = `${svgBasePath}User_Scenario_1.svg`
  const active = hovered
    ? `${svgBasePath}${MODES.find((m) => m.id === hovered)?.file}`
    : null
  const activeMode = MODES.find((m) => m.id === hovered)

  return (
    <div
      className={`energy-scenario-root ${className}`}
      style={{
        fontFamily:
          '"DM Sans", "Helvetica Neue", Arial, sans-serif',
        width: "100%",
      }}
    >
      {/* ── Mode tabs ── */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        {MODES.map((mode) => {
          const isActive = hovered === mode.id
          return (
            <button
              key={mode.id}
              onMouseEnter={() => setHovered(mode.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "10px 16px",
                border: `1.5px solid ${isActive ? mode.color : "#D1D0C8"}`,
                borderRadius: "10px",
                background: isActive ? mode.colorLight : "transparent",
                cursor: "pointer",
                transition: "all 0.2s ease",
                textAlign: "left",
                minWidth: "130px",
                flex: "1 1 130px",
              }}
            >
              {/* Color dot */}
              <span
                style={{
                  display: "inline-block",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: mode.color,
                  marginBottom: "6px",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? mode.colorText : "#3d3d3a",
                  lineHeight: 1.2,
                  marginBottom: "2px",
                  letterSpacing: "-0.01em",
                }}
              >
                {mode.label}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  color: isActive ? mode.colorText : "#888780",
                  opacity: isActive ? 0.85 : 1,
                  lineHeight: 1.3,
                }}
              >
                {mode.labelZh}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Trigger quote strip ── */}
      <div
        style={{
          height: "44px",
          display: "flex",
          alignItems: "center",
          padding: "0 4px",
          marginBottom: "12px",
          transition: "opacity 0.25s ease",
          opacity: activeMode ? 1 : 0,
        }}
      >
        {activeMode && (
          <div
            style={{
              borderLeft: `3px solid ${activeMode.color}`,
              paddingLeft: "12px",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontStyle: "italic",
                color: activeMode.colorText,
                fontWeight: 500,
                lineHeight: 1.3,
              }}
            >
              {activeMode.trigger}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: activeMode.colorText,
                opacity: 0.75,
                marginTop: "2px",
              }}
            >
              {activeMode.triggerZh}
            </div>
          </div>
        )}
      </div>

      {/* ── Diagram ── */}
      <div
        style={{
          position: "relative",
          width: "100%",
          borderRadius: "12px",
          overflow: "hidden",
          background: "#fff",
          border: "0.5px solid #D1D0C8",
          // Maintain 4439:2824 aspect ratio
          aspectRatio: "4439 / 2824",
        }}
      >
        {/* Base SVG — always visible */}
        <img
          src={base}
          alt="Energy mode scenario overview"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
          }}
          draggable={false}
        />

        {/* Highlighted SVG — fades in on hover */}
        {MODES.map((mode) => (
          <img
            key={mode.id}
            src={`${svgBasePath}${mode.file}`}
            alt={`${mode.label} scenario highlighted`}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
              opacity: hovered === mode.id ? 1 : 0,
              transition: "opacity 0.28s ease",
              pointerEvents: "none",
            }}
            draggable={false}
          />
        ))}

        {/* Hover zones — invisible overlays mapped to each mode's
            approximate region on the 4439x2824 canvas.
            Percentages: y_start / 2824, height / 2824  */}
        {MODES.map((mode, i) => {
          // Each mode card sits roughly in a 730px vertical band,
          // starting ~490px from top (Full Speed) and spaced ~610px apart.
          const topPct = ((490 + i * 610) / 2824) * 100
          const heightPct = (610 / 2824) * 100
          return (
            <div
              key={mode.id}
              onMouseEnter={() => setHovered(mode.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: "absolute",
                left: 0,
                top: `${topPct}%`,
                width: "100%",
                height: `${heightPct}%`,
                cursor: "pointer",
                zIndex: 10,
              }}
              aria-label={`Hover to highlight ${mode.label} scenario`}
            />
          )
        })}
      </div>

      {/* ── Legend ── */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          marginTop: "14px",
          flexWrap: "wrap",
        }}
      >
        {[
          { label: "Captain 船长", color: "#185FA5", bg: "#E6F1FB" },
          { label: "Chief Operator 值班驾驶", color: "#854F0B", bg: "#FAEEDA" },
          { label: "Chief Engineer 轮机长", color: "#444441", bg: "#F1EFE8" },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              color: "#5F5E5A",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: item.color,
                border: `1.5px solid ${item.color}`,
                flexShrink: 0,
              }}
            />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}
