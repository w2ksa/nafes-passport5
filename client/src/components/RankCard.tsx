/*
 * مكون بطاقة الرتبة
 * تصميم بسيط ونظيف - خريطة الرتب الثمانية
 */

import { cn } from "@/lib/utils";
import { RANKS, type Rank } from "@/lib/data";
import { Check } from "lucide-react";

interface RankCardProps {
  currentRank: Rank;
  totalPoints: number;
  className?: string;
}

export function RankCard({ currentRank, totalPoints, className }: RankCardProps) {
  // حساب التقدم نحو الرتبة التالية
  const nextRank = RANKS.find(r => r.id === currentRank.id + 1);
  const progressToNext = nextRank
    ? ((totalPoints - currentRank.minPoints) / (nextRank.minPoints - currentRank.minPoints)) * 100
    : 100;

  return (
    <div className={cn("glass-card rounded-2xl p-6", className)}>
      <h3 className="text-xl font-bold text-center mb-6">
        🚀 رحلة الفضاء - نظام الرتب
      </h3>

      {/* قائمة الرتب */}
      <div className="space-y-3">
        {RANKS.slice().reverse().map((rank) => {
          const isCurrentRank = rank.id === currentRank.id;
          const isPassed = rank.id < currentRank.id;
          const isFuture = rank.id > currentRank.id;

          return (
            <div
              key={rank.id}
              className={cn(
                "flex items-center gap-4 p-3 rounded-xl transition-all",
                isCurrentRank && "bg-primary/20 border-2 border-primary",
                isPassed && "bg-green-500/10 border border-green-500/30",
                isFuture && "bg-muted/30 opacity-60"
              )}
            >
              {/* أيقونة الحالة */}
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                isCurrentRank && "bg-primary text-primary-foreground",
                isPassed && "bg-green-500 text-white",
                isFuture && "bg-muted"
              )}>
                {isPassed ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-xl">{rank.icon}</span>
                )}
              </div>

              {/* معلومات الرتبة */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-bold",
                  isCurrentRank && "text-primary",
                  isPassed && "text-green-500",
                  isFuture && "text-muted-foreground"
                )}>
                  {rank.nameAr}
                </p>
                <p className="text-xs text-muted-foreground">
                  {rank.minPoints} - {rank.maxPoints} نقطة
                </p>
              </div>

              {/* علامة الرتبة الحالية */}
              {isCurrentRank && (
                <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                  أنت هنا
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* شريط التقدم للرتبة التالية */}
      {nextRank && (
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">التقدم نحو: {nextRank.nameAr}</span>
            <span className="text-primary font-bold">{Math.round(progressToNext)}%</span>
          </div>
          <div className="w-full bg-muted/30 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-primary to-[#14b8a6] rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(progressToNext, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            تحتاج {nextRank.minPoints - totalPoints} نقطة للوصول
          </p>
        </div>
      )}

      {!nextRank && (
        <div className="mt-6 pt-4 border-t border-border text-center">
          <span className="text-3xl">🎉</span>
          <p className="text-primary font-bold mt-2">مبروك! وصلت لأعلى رتبة</p>
        </div>
      )}
    </div>
  );
}
