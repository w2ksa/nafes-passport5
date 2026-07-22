/*
 * مكون شريط التقدم الدائري
 * تصميم المرصد الفضائي - مؤشرات كعدادات السرعة
 */

import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showValue?: boolean;
  label?: string;
  color?: "teal" | "gold" | "blue" | "silver";
}

export function CircularProgress({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  className,
  showValue = true,
  label,
  color = "teal",
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((value / max) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;

  const colorClasses = {
    teal: "stroke-[#14b8a6]",
    gold: "stroke-[#eab308]",
    blue: "stroke-[#3b82f6]",
    silver: "stroke-[#94a3b8]",
  };

  const glowClasses = {
    teal: "drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]",
    gold: "drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]",
    blue: "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]",
    silver: "drop-shadow-[0_0_8px_rgba(148,163,184,0.5)]",
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className={cn("progress-ring", glowClasses[color])}
      >
        {/* خلفية الدائرة */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* شريط التقدم */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(colorClasses[color], "transition-all duration-1000 ease-out")}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{value}</span>
          {label && <span className="text-xs text-muted-foreground mt-1">{label}</span>}
        </div>
      )}
    </div>
  );
}
