/*
 * مكون بطاقة المحطة الأكاديمية
 * تصميم المرصد الفضائي - بطاقات بإطارات معدنية
 */

import { cn } from "@/lib/utils";
import { CircularProgress } from "./CircularProgress";

interface StationCardProps {
  id: string;
  nameAr: string;
  icon: string;
  points: number;
  maxPoints: number;
  className?: string;
}

export function StationCard({
  nameAr,
  icon,
  points,
  maxPoints,
  className,
}: StationCardProps) {
  const percentage = (points / maxPoints) * 100;
  
  // تحديد اللون بناءً على النسبة
  const getColor = () => {
    if (percentage >= 90) return "gold";
    if (percentage >= 70) return "teal";
    if (percentage >= 50) return "blue";
    return "silver";
  };

  return (
    <div
      className={cn(
        "glass-card metallic-border rounded-xl p-6 transition-all duration-300",
        "hover:scale-[1.02] hover:glow-teal",
        className
      )}
    >
      <div className="flex flex-col items-center gap-4">
        {/* أيقونة المحطة */}
        <div className="text-4xl animate-float">{icon}</div>
        
        {/* اسم المحطة */}
        <h3 className="text-lg font-bold text-foreground text-center">
          {nameAr}
        </h3>
        
        {/* مؤشر التقدم الدائري */}
        <CircularProgress
          value={points}
          max={maxPoints}
          size={100}
          strokeWidth={6}
          color={getColor()}
          label={`من ${maxPoints}`}
        />
        
        {/* شريط التقدم الأفقي */}
        <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000",
              percentage >= 90 ? "bg-[#eab308]" :
              percentage >= 70 ? "bg-[#14b8a6]" :
              percentage >= 50 ? "bg-[#3b82f6]" : "bg-[#94a3b8]"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
