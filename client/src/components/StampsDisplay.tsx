/*
 * مكون عرض الأختام الثلاثية
 * تصميم بسيط ونظيف - أختام فضية وذهبية وماسية
 */

import { cn } from "@/lib/utils";
import type { Stamps } from "@/lib/data";

interface StampsDisplayProps {
  stamps: Stamps;
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
  className?: string;
}

export function StampsDisplay({ stamps, size = "md", showLabels = true, className }: StampsDisplayProps) {
  const sizeClasses = {
    sm: "w-10 h-10 text-lg",
    md: "w-14 h-14 text-2xl",
    lg: "w-20 h-20 text-4xl",
  };

  const stampData = [
    {
      key: "silver" as const,
      nameAr: "الختم الفضي",
      bgActive: "bg-gradient-to-br from-gray-300 to-gray-400",
      icon: "🥈",
    },
    {
      key: "gold" as const,
      nameAr: "الختم الذهبي",
      bgActive: "bg-gradient-to-br from-yellow-400 to-yellow-600",
      icon: "🥇",
    },
    {
      key: "diamond" as const,
      nameAr: "الختم الماسي",
      bgActive: "bg-gradient-to-br from-cyan-400 to-blue-500",
      icon: "💎",
    },
  ];

  return (
    <div className={cn("flex items-center justify-center gap-6", className)}>
      {stampData.map((stamp) => {
        const isActive = stamps[stamp.key];
        
        return (
          <div key={stamp.key} className="flex flex-col items-center gap-2">
            <div
              className={cn(
                "rounded-full flex items-center justify-center transition-all duration-300",
                sizeClasses[size],
                isActive ? stamp.bgActive : "bg-muted/50",
                isActive ? "shadow-lg" : "opacity-40 grayscale"
              )}
            >
              <span>{stamp.icon}</span>
            </div>
            {showLabels && (
              <span className={cn(
                "text-xs font-medium",
                isActive ? "text-foreground" : "text-muted-foreground/50"
              )}>
                {stamp.nameAr}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
