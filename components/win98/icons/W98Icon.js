import React from "react";

// Logical name -> bundled Win98 PNG in /public/win98/icons/.
export default function W98Icon({ name, size = 32, style }) {
  return (
    <img
      src={`/win98/icons/${name}.png`}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
      style={{ imageRendering: "pixelated", display: "block", ...style }}
    />
  );
}
