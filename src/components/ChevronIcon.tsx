import React from "react";

interface ChevronProps {
  direction: "left" | "right";
  size?: number;
  color?: string;
}

const ChevronIcon: React.FC<ChevronProps> = ({
  direction,
  size = 24,
  color = "currentColor",
}) => {
  // Using centered coordinates for better alignment
  const points =
    direction === "left"
      ? "19,8 11,16 19,24" // Left-pointing chevron (adjusted for centering)
      : "13,8 21,16 13,24"; // Right-pointing chevron

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polyline
        points={points}
        stroke={color}
        strokeWidth="4"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
};

export default ChevronIcon;
