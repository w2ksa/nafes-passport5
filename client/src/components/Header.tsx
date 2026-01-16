/*
 * مكون رأس الصفحة
 * تصميم المرصد الفضائي - شعار المدرسة والملاحة
 */

import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, Users, Trophy, Settings } from "lucide-react";

export function Header() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "الرئيسية", icon: Home },
    { href: "/leaderboard", label: "المتصدرون", icon: Trophy },
    { href: "/admin", label: "لوحة التحكم", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        {/* الشعار والعنوان */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-[#14b8a6] flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 overflow-hidden p-1">
            <img
              src="/images/school-logo.jpg"
              alt="شعار ابتدائية أبها الأهلية"
              className="w-full h-full object-contain rounded-md"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gradient-teal">جواز نافس</span>
            <span className="text-xs text-muted-foreground">ابتدائية أبها الأهلية</span>
          </div>
        </Link>

        {/* الملاحة */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300",
                  isActive
                    ? "bg-primary/20 text-primary glow-teal"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
