/*
 * مكون بطاقة الطالب
 * تصميم بسيط ونظيف لعرض معلومات الطالب
 */

import { Link } from "wouter";
import { cn } from "@/lib/utils";
import type { Student } from "@/lib/data";
import { Eye, ChevronLeft, User } from "lucide-react";

interface StudentCardProps {
  student: Student;
  showLink?: boolean;
  className?: string;
}

export function StudentCard({ student, showLink = true, className }: StudentCardProps) {
  const content = (
    <div className="flex items-start gap-4">
      {/* صورة الطالب */}
      <div className="relative shrink-0">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-primary/30">
          <User className="w-7 h-7 text-primary/60" />
        </div>
        <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
          {student.grade === 6 ? "٦" : "٣"}
        </div>
      </div>

      {/* معلومات الطالب */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-foreground truncate">{student.name}</h3>
          {showLink && (
            <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
        </div>
        
        <p className="text-sm text-muted-foreground mt-1">
          الصف {student.grade === 6 ? "السادس" : "الثالث"} الابتدائي
        </p>

        {/* الرتبة والنقاط */}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xl">{student.rank.icon}</span>
          <div>
            <p className="text-sm font-medium text-primary">{student.rank.nameAr}</p>
            <p className="text-xs text-muted-foreground">{student.totalPoints} نقطة</p>
          </div>
        </div>
      </div>
    </div>
  );

  const stampsAndViews = (
    <>
      {/* الأختام */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-lg",
            student.stamps.silver 
              ? "bg-gradient-to-br from-gray-300 to-gray-400" 
              : "bg-muted/50 opacity-40 grayscale"
          )}>
            🥈
          </div>
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-lg",
            student.stamps.gold 
              ? "bg-gradient-to-br from-yellow-400 to-yellow-600" 
              : "bg-muted/50 opacity-40 grayscale"
          )}>
            🥇
          </div>
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-lg",
            student.stamps.diamond 
              ? "bg-gradient-to-br from-cyan-400 to-blue-500" 
              : "bg-muted/50 opacity-40 grayscale"
          )}>
            💎
          </div>
        </div>

        {/* عدد المشاهدات */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Eye className="w-3 h-3" />
          <span>{student.viewCount}</span>
        </div>
      </div>
    </>
  );

  if (showLink) {
    return (
      <Link
        href={`/student/${student.id}`}
        className={cn(
          "glass-card rounded-xl p-5 transition-all duration-300 block",
          "hover:scale-[1.02] hover:shadow-lg cursor-pointer group",
          className
        )}
      >
        {content}
        {stampsAndViews}
      </Link>
    );
  }

  return (
    <div
      className={cn(
        "glass-card rounded-xl p-5",
        className
      )}
    >
      {content}
      {stampsAndViews}
    </div>
  );
}
