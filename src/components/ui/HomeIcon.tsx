import { forwardRef } from "react";

export const HomeIcon = forwardRef<SVGSVGElement, { size?: number | string; className?: string }>(
  ({ size = 24, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* House body - rounded pentagon shape */}
      <path
        d="M5 21.5h14a2 2 0 0 0 2-2v-8.2a1 1 0 0 0-.4-.8L13 4.2a1.5 1.5 0 0 0-2 0L3.4 10.5a1 1 0 0 0-.4.8v8.2a2 2 0 0 0 2 2Z"
        strokeWidth={1.8}
      />
      {/* Door handle line */}
      <path
        d="M9.5 16h5"
        strokeWidth={2}
      />
    </svg>
  )
);

HomeIcon.displayName = "HomeIcon";
