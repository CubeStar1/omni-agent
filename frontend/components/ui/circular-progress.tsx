"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CircularProgressProps extends React.SVGProps<SVGSVGElement> {
  value: number;
  strokeWidth?: number;
}

const CircularProgress = React.forwardRef<
  SVGSVGElement,
  CircularProgressProps
>(({ className, value, strokeWidth = 10, ...props }, ref) => {
  const radius = 50 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg
      ref={ref}
      viewBox="0 0 100 100"
      className={cn("w-full h-full transform -rotate-90", className)}
      {...props}
    >

      <circle
        className="text-muted/80"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="transparent"
        r={radius}
        cx="50"
        cy="50"
      />
      <circle
        className="transition-all duration-500 ease-out"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="butt"
        fill="transparent"
        r={radius}
        cx="50"
        cy="50"
      />
    </svg>
  );
});
CircularProgress.displayName = "CircularProgress";

export { CircularProgress };
