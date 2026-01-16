/*
 * مكون تذييل الصفحة
 * حقوق النشر والمطورين
 */

export function Footer() {
  return (
    <footer className="w-full border-t border-border/50 bg-background/50 backdrop-blur-sm mt-auto">
      <div className="container py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* حقوق النشر */}
          <div className="text-center md:text-right">
            <p className="text-sm text-muted-foreground">
              جميع الحقوق محفوظة © 2026
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              ابتدائية أبها الأهلية
            </p>
          </div>

          {/* المطورون */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">فكرة:</span>
              <span className="text-foreground font-medium">د. عصام عاشور</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">إنشاء:</span>
              <span className="text-foreground font-medium">سعود آل زايد</span>
            </div>
          </div>

          {/* شعار صغير */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            <span className="text-xs text-muted-foreground">رحلة نافس</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
