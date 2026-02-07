/*
 * الصفحة الرئيسية - جواز نافس
 * تصميم بسيط ونظيف بدون صور معقدة
 */

import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StudentCard } from "@/components/StudentCard";
import { StudentCardSkeletonGrid } from "@/components/StudentCardSkeleton";
import { RANKS } from "@/lib/data";
import { useStudents } from "@/hooks/useStudents";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Users, Star, Trophy, GraduationCap, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn, normalizeArabic } from "@/lib/utils";

export default function Home() {
  const { students, isLoading, setStudents } = useStudents();
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState<"all" | 3 | 6>("all");

  // تصفية الطلاب
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = searchQuery === "" ||
        normalizeArabic(student.name).includes(normalizeArabic(searchQuery));
      const matchesGrade = gradeFilter === "all" || student.grade === gradeFilter;
      return matchesSearch && matchesGrade;
    });
  }, [students, searchQuery, gradeFilter]);

  // إحصائيات
  const stats = useMemo(() => {
    const grade6 = students.filter(s => s.grade === 6);
    const grade3 = students.filter(s => s.grade === 3);
    const avgPoints = students.length > 0
      ? Math.round(students.reduce((sum, s) => sum + s.totalPoints, 0) / students.length)
      : 0;
    return {
      total: students.length,
      grade6: grade6.length,
      grade3: grade3.length,
      avgPoints,
    };
  }, [students]);

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <Header />

      <main className="flex-1">
        {/* قسم الترحيب */}
        <section className="relative overflow-hidden py-16 border-b border-border/30">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />

          <div className="container relative text-center">
            {/* شعار المدرسة */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <img
                src="/images/school-logo.jpg"
                alt="شعار ابتدائية أبها الأهلية"
                className="w-32 h-32 mx-auto rounded-2xl bg-white p-2 shadow-lg object-contain"
              />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold mb-3 text-gradient-teal"
            >
              جواز نافس
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-muted-foreground mb-2"
            >
              ابتدائية أبها الأهلية
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-lg text-muted-foreground/80"
            >
              رحلتك نحو النجوم تبدأ من هنا 🚀
            </motion.p>

            {/* بطاقات الإحصائيات */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 max-w-3xl mx-auto"
            >
              <div className="glass-card rounded-xl p-4 text-center">
                <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">إجمالي الطلاب</p>
              </div>
              <div className="glass-card rounded-xl p-4 text-center">
                <GraduationCap className="w-6 h-6 mx-auto mb-2 text-[#14b8a6]" />
                <p className="text-2xl font-bold text-foreground">{stats.grade6}</p>
                <p className="text-xs text-muted-foreground">الصف السادس</p>
              </div>
              <div className="glass-card rounded-xl p-4 text-center">
                <Star className="w-6 h-6 mx-auto mb-2 text-[#eab308]" />
                <p className="text-2xl font-bold text-foreground">{stats.grade3}</p>
                <p className="text-xs text-muted-foreground">الصف الثالث</p>
              </div>
              <div className="glass-card rounded-xl p-4 text-center">
                <Trophy className="w-6 h-6 mx-auto mb-2 text-[#f97316]" />
                <p className="text-2xl font-bold text-foreground">{stats.avgPoints}</p>
                <p className="text-xs text-muted-foreground">متوسط النقاط</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* قسم الطلاب */}
        <section className="py-10">
          <div className="container">
            <h2 className="text-2xl font-bold mb-6">الطلاب ({filteredStudents.length})</h2>

            {/* البحث والفلترة */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن طالب..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <div className="flex gap-2">
                {[
                  { value: "all" as const, label: "الكل" },
                  { value: 6 as const, label: "الصف السادس" },
                  { value: 3 as const, label: "الصف الثالث" },
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={gradeFilter === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGradeFilter(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* شبكة الطلاب */}
            {isLoading ? (
              <StudentCardSkeletonGrid count={6} />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredStudents.map((student, index) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <StudentCard student={student} />
                    </motion.div>
                  ))}
                </div>

                {filteredStudents.length === 0 && !isLoading && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">لا يوجد طلاب مطابقين للبحث</p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* قسم نظام الرتب - بسيط */}
        <section className="py-10 bg-card/30">
          <div className="container">
            <h2 className="text-2xl font-bold mb-8 text-center">
              🚀 رحلة الفضاء - نظام الرتب
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {RANKS.map((rank, index) => (
                <motion.div
                  key={rank.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="glass-card rounded-xl p-4 text-center hover:scale-105 transition-transform"
                >
                  <span className="text-3xl block mb-2">{rank.icon}</span>
                  <p className="font-bold text-sm text-foreground mb-1">{rank.nameAr}</p>
                  <p className="text-xs text-muted-foreground">{rank.minPoints} - {rank.maxPoints}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* قسم الأختام - بسيط */}
        <section className="py-10">
          <div className="container">
            <h2 className="text-2xl font-bold mb-8 text-center">
              🏆 الأختام الثلاثية
            </h2>

            <div className="flex justify-center gap-6 flex-wrap">
              {[
                { name: 'الختم الفضي', icon: '🥈', color: 'from-gray-400 to-gray-500', desc: 'للأداء المتميز' },
                { name: 'الختم الذهبي', icon: '🥇', color: 'from-yellow-400 to-yellow-600', desc: 'للأداء الممتاز' },
                { name: 'الختم الماسي', icon: '💎', color: 'from-cyan-400 to-blue-500', desc: 'للأداء الاستثنائي' },
              ].map((stamp, index) => (
                <motion.div
                  key={stamp.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="glass-card rounded-2xl p-6 text-center w-40"
                >
                  <div className={cn(
                    "w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3",
                    "bg-gradient-to-br",
                    stamp.color
                  )}>
                    <span className="text-3xl">{stamp.icon}</span>
                  </div>
                  <p className="font-bold text-foreground mb-1">{stamp.name}</p>
                  <p className="text-xs text-muted-foreground">{stamp.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
