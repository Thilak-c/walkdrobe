"use client";
import React, { useId } from "react";

export default function LiquidChromeText({
  text = "Liquid Chrome",
  size = 150, // height of svg
  speed = 8, // seconds per wave loop
  intensity = 25, // displacement strength
  stops = ["#ffffff", "#f5f5f5", "#e5e5e5", "#cccccc", "#f0f0f0"],
  className = "w-full",
}) {
  const uid = useId().replace(/[:]/g, "");
  const gradId = `grad-${uid}`;
  const filterId = `filter-${uid}`;

  const offset = (i) => `${(i / (stops.length - 1)) * 100}%`;

  return (
    <div className={["relative bg-white", className].join(" ")} style={{ lineHeight: 0 }}>
      <svg
        viewBox={`0 0 1200 ${size}`}
        className="block w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* gradient inside the text */}
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            {stops.map((c, i) => (
              <stop key={i} offset={offset(i)} stopColor={c} />
            ))}
          </linearGradient>

          {/* turbulence filter to make it "move" */}
          <filter id={filterId} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="turbulence"
              baseFrequency="0.02"
              numOctaves="3"
              seed="2"
              result="turb"
            >
              {/* animate the turbulence to create ripple motion */}
              <animate
                attributeName="baseFrequency"
                dur={`${speed}s`}
                values="0.02;0.04;0.02"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="turb"
              scale={intensity}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>

        {/* text with animated liquid effect */}
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill={`url(#${gradId})`}
          filter={`url(#${filterId})`}
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 900,
            fontSize: `${size * 0.6}px`,
            letterSpacing: "-0.02em",
          }}
        >
          {text}
        </text>
      </svg>
    </div>
  );
}
