import React from "react";

interface UnMuteIconProps {
  size?: number;
  color?: string;
}

const UnMuteIcon: React.FC<UnMuteIconProps> = ({
  size = 24,
  color = "currentColor",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 57"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M33.986 8.52655L21.179 18.5912H10.45C9.09512 18.5912 8 19.6863 8 21.0412V35.3039C8 36.6588 9.09512 37.7539 10.45 37.7539H21.179L33.986 47.8113C35.5983 49.075 37.9524 47.9307 37.9524 45.8831V10.4572C37.9524 8.40728 35.5913 7.26537 33.986 8.52894V8.52655Z"
        fill={color}
      />
      <path
        d="M44.9492 17.5846C44.2472 16.8826 43.11 16.8826 42.4103 17.5846C41.7083 18.2867 41.7083 19.4239 42.4103 20.1236C44.5607 22.274 45.7401 25.1313 45.7401 28.1688C45.7401 31.2062 44.5537 34.0704 42.4103 36.214C41.7083 36.9161 41.7083 38.0533 42.4103 38.753C42.7636 39.1063 43.2199 39.2795 43.6809 39.2795C44.1419 39.2795 44.6029 39.1063 44.9516 38.753C47.7784 35.9262 49.3368 32.1634 49.3368 28.1618C49.3368 24.1603 47.7783 20.3975 44.9516 17.5706L44.9492 17.5846Z"
        fill={color}
      />
      <path
        d="M47.4904 12.505C46.7884 13.2071 46.7884 14.3443 47.4904 15.044C54.7329 22.2865 54.7329 34.0638 47.4904 41.3063C46.7884 42.0083 46.7884 43.1455 47.4904 43.8452C47.8437 44.1986 48.3001 44.3717 48.761 44.3717C49.222 44.3717 49.683 44.1986 50.0317 43.8452C58.676 35.201 58.676 21.1425 50.0317 12.4982C49.3296 11.7962 48.1924 11.7962 47.4927 12.4982L47.4904 12.505Z"
        fill={color}
      />
    </svg>
  );
};

export default UnMuteIcon;
