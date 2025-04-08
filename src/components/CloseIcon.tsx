import React from "react";

interface CloseIconProps {
  size?: number;
  color?: string;
}

const CloseIcon: React.FC<CloseIconProps> = ({
  size = 24,
  color = "currentColor",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* First diagonal line (top-left to bottom-right) */}
      <line
        x1="10"
        y1="10"
        x2="22"
        y2="22"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      {/* Second diagonal line (top-right to bottom-left) */}
      <line
        x1="22"
        y1="10"
        x2="10"
        y2="22"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
};

export default CloseIcon;
