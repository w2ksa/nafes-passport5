/*
 * Student Card Skeleton - مؤشر تحميل لبطاقة الطالب
 * يُعرض أثناء جلب البيانات
 */

import { cn } from "@/lib/utils";

export function StudentCardSkeleton() {
    return (
        <div className="glass-card rounded-xl p-4 animate-pulse">
            {/* صورة الطالب */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                </div>
            </div>

            {/* النقاط والرتبة */}
            <div className="space-y-3">
                <div className="h-8 bg-muted rounded" />
                <div className="h-6 bg-muted rounded w-2/3" />

                {/* الأختام */}
                <div className="flex gap-2 pt-3 border-t border-border/30">
                    <div className="w-6 h-6 bg-muted rounded-full" />
                    <div className="w-6 h-6 bg-muted rounded-full" />
                    <div className="w-6 h-6 bg-muted rounded-full" />
                </div>
            </div>
        </div>
    );
}

export function StudentCardSkeletonGrid({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <StudentCardSkeleton key={i} />
            ))}
        </div>
    );
}
