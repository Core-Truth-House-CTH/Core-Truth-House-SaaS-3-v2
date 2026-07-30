import React from "react";

/**
 * Architectural line-art house from approved screen 1.
 *
 * Drawn inline as SVG rather than shipped as a raster asset so it inherits the
 * approved palette and stays crisp at every width. Decorative only, so it is
 * hidden from assistive technology.
 */
export default function HouseIllustration({ style }) {
  return (
    <svg
      viewBox="0 0 260 150"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      style={{ width: "100%", height: "auto", ...style }}
    >
      <g
        fill="none"
        stroke="var(--cs-tuscany)"
        strokeWidth="0.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.75"
      >
        {/* roof */}
        <path d="M40 74 L130 20 L220 74" />
        <path d="M52 70 L130 30 L208 70" opacity="0.5" />
        {/* body */}
        <path d="M58 74 L58 132 L202 132 L202 74" />
        {/* columns */}
        <path d="M78 84 L78 132 M100 84 L100 132 M160 84 L160 132 M182 84 L182 132" opacity="0.55" />
        {/* portico */}
        <path d="M70 84 L190 84" />
        {/* door */}
        <path d="M118 132 L118 98 Q130 90 142 98 L142 132" />
        <circle cx="137" cy="115" r="1.6" />
        {/* windows */}
        <rect x="82" y="98" width="14" height="18" rx="1" opacity="0.6" />
        <rect x="164" y="98" width="14" height="18" rx="1" opacity="0.6" />
        {/* ground line */}
        <path d="M28 132 L232 132" opacity="0.4" />
        {/* blueprint ticks */}
        <path d="M28 140 L28 136 M232 140 L232 136 M28 138 L232 138" opacity="0.28" />
      </g>
    </svg>
  );
}
