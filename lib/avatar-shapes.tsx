"use client";

import React from "react";

export type AvatarShapeId =
  | "circle"
  | "scallop"
  | "squircle"
  | "oval"
  | "sunburst";

export interface AvatarShapeDef {
  id: AvatarShapeId;
  label: string;
  clipPathCss?: string;
  svgPath?: string;
}

export const AVATAR_SHAPES: AvatarShapeDef[] = [
  {
    id: "circle",
    label: "Circle",
    clipPathCss: "circle(50% at 50% 50%)",
  },
  {
    id: "scallop",
    label: "Flower",
    svgPath:
      "M 0.5000 0.0000 C 0.5900 0.0000, 0.6420 0.0739, 0.7200 0.1189 C 0.7980 0.1640, 0.8880 0.1720, 0.9330 0.2500 C 0.9780 0.3280, 0.9400 0.4100, 0.9400 0.5000 C 0.9400 0.5900, 0.9780 0.6720, 0.9330 0.7500 C 0.8880 0.8280, 0.7980 0.8360, 0.7200 0.8811 C 0.6420 0.9261, 0.5900 1.0000, 0.5000 1.0000 C 0.4100 1.0000, 0.3580 0.9261, 0.2800 0.8811 C 0.2020 0.8360, 0.1120 0.8280, 0.0670 0.7500 C 0.0220 0.6720, 0.0600 0.5900, 0.0600 0.5000 C 0.0600 0.4100, 0.0220 0.3280, 0.0670 0.2500 C 0.1120 0.1720, 0.2020 0.1640, 0.2800 0.1189 C 0.3580 0.0739, 0.4100 -0.0000, 0.5000 0.0000 Z",
  },
  {
    id: "squircle",
    label: "Squircle",
    clipPathCss: "inset(0% round 24%)",
  },
  {
    id: "oval",
    label: "Oval",
    clipPathCss: "ellipse(44% 50% at 50% 50%)",
  },
  {
    id: "sunburst",
    label: "Badge",
    svgPath:
      "M 0.5000 0.0000 C 0.5473 0.0000, 0.5734 0.0434, 0.6191 0.0557 C 0.6648 0.0679, 0.7090 0.0433, 0.7500 0.0670 C 0.7910 0.0906, 0.7918 0.1413, 0.8253 0.1747 C 0.8587 0.2082, 0.9094 0.2090, 0.9330 0.2500 C 0.9567 0.2910, 0.9321 0.3352, 0.9443 0.3809 C 0.9566 0.4266, 1.0000 0.4527, 1.0000 0.5000 C 1.0000 0.5473, 0.9566 0.5734, 0.9443 0.6191 C 0.9321 0.6648, 0.9567 0.7090, 0.9330 0.7500 C 0.9094 0.7910, 0.8587 0.7918, 0.8253 0.8253 C 0.7918 0.8587, 0.7910 0.9094, 0.7500 0.9330 C 0.7090 0.9567, 0.6648 0.9321, 0.6191 0.9443 C 0.5734 0.9566, 0.5473 1.0000, 0.5000 1.0000 C 0.4527 1.0000, 0.4266 0.9566, 0.3809 0.9443 C 0.3352 0.9321, 0.2910 0.9567, 0.2500 0.9330 C 0.2090 0.9094, 0.2082 0.8587, 0.1747 0.8253 C 0.1413 0.7918, 0.0906 0.7910, 0.0670 0.7500 C 0.0433 0.7090, 0.0679 0.6648, 0.0557 0.6191 C 0.0434 0.5734, 0.0000 0.5473, 0.0000 0.5000 C -0.0000 0.4527, 0.0434 0.4266, 0.0557 0.3809 C 0.0679 0.3352, 0.0433 0.2910, 0.0670 0.2500 C 0.0906 0.2090, 0.1413 0.2082, 0.1747 0.1747 C 0.2082 0.1413, 0.2090 0.0906, 0.2500 0.0670 C 0.2910 0.0433, 0.3352 0.0679, 0.3809 0.0557 C 0.4266 0.0434, 0.4527 -0.0000, 0.5000 0.0000 Z",
  },
];

export function getAvatarClipStyle(shape: AvatarShapeId = "circle"): React.CSSProperties {
  if (shape === "circle") {
    return {
      clipPath: "circle(50% at 50% 50%)",
      WebkitClipPath: "circle(50% at 50% 50%)",
      borderRadius: "9999px",
    };
  }
  if (shape === "squircle") {
    return {
      clipPath: "inset(0% round 24%)",
      WebkitClipPath: "inset(0% round 24%)",
      borderRadius: "24%",
    };
  }
  if (shape === "oval") {
    return {
      clipPath: "ellipse(44% 50% at 50% 50%)",
      WebkitClipPath: "ellipse(44% 50% at 50% 50%)",
      borderRadius: "44% / 50%",
    };
  }
  return {
    clipPath: `url(#avatar-shape-${shape})`,
    WebkitClipPath: `url(#avatar-shape-${shape})`,
  };
}

export function AvatarShapeDefs() {
  return (
    <svg
      className="absolute w-0 h-0 pointer-events-none opacity-0 -z-50"
      aria-hidden="true"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        {AVATAR_SHAPES.map((shape) => {
          if (!shape.svgPath) return null;
          return (
            <clipPath
              key={shape.id}
              id={`avatar-shape-${shape.id}`}
              clipPathUnits="objectBoundingBox"
            >
              <path d={shape.svgPath} />
            </clipPath>
          );
        })}
      </defs>
    </svg>
  );
}
