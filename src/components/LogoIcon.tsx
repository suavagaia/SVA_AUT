export function LogoIcon({ size = 32 }: { size?: number }) {
  const id = `logo-grad-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="0.5"
        y="0.5"
        width="35"
        height="35"
        rx="8"
        fill="#060E1F"
        stroke="#10B981"
        strokeOpacity="0.4"
      />
      <path
        d="M10 18L15.5 24L26 12"
        stroke={`url(#${id})`}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id={id} x1="10" y1="18" x2="26" y2="12" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981" />
          <stop offset="1" stopColor="#34D399" />
        </linearGradient>
      </defs>
    </svg>
  );
}
