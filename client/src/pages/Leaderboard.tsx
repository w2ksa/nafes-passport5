/*
 * صفحة لوحة المتصدرين
 * تصميم بسيط ونظيف - أفضل 3 طلاب من كل صف
 */

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useStudents } from "@/hooks/useStudents";
import { StampsDisplay } from "@/components/StampsDisplay";
import { Trophy, Medal, Award, User, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export default function Leaderboard() {
  const { students, isLoading } = useStudents();

  // ترتيب الطلاب حسب النقاط
  const { grade6Top3, grade3Top3 } = useMemo(() => {
    const grade6 = students
      .filter(s => s.grade === 6)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 3);

    const grade3 = students
      .filter(s => s.grade === 3)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 3);

    return { grade6Top3: grade6, grade3Top3: grade3 };
  }, [students]);

  const getRankIcon = (position: number) => {
    switch (position) {
      case 0: return <Trophy className="w-6 h-6 text-[#eab308]" />;
      case 1: return <Medal className="w-6 h-6 text-[#94a3b8]" />;
      case 2: return <Award className="w-6 h-6 text-[#cd7f32]" />;
      default: return null;
    }
  };

  const getRankBg = (position: number) => {
    switch (position) {
      case 0: return "bg-gradient-to-l from-yellow-500/20 to-transparent border-yellow-500/50";
      case 1: return "bg-gradient-to-l from-gray-400/20 to-transparent border-gray-400/50";
      case 2: return "bg-gradient-to-l from-orange-600/20 to-transparent border-orange-600/50";
      default: return "bg-muted/20 border-muted";
    }
  };

  const LeaderboardSection = ({ 
    title, 
    students, 
    gradeLabel 
  }: { 
    title: string; 
    students: typeof grade6Top3; 
    gradeLabel: string;
  }) => (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-xl font-bold mb-6 text-center flex items-center justify-center gap-2">
        <Trophy className="w-5 h-5 text-[#eab308]" />
        {title}
      </h2>

      <div className="space-y-3">
        {students.map((student, index) => (
          <motion.div
            key={student.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Link
              href={`/student/${student.id}`}
              className={cn(
                "block rounded-xl p-4 border-2 transition-all duration-300 hover:scale-[1.02]",
                getRankBg(index)
              )}
            >
              <div className="flex items-center gap-4">
                {/* ترتيب */}
                <div className="flex flex-col items-center w-10">
                  {getRankIcon(index)}
                  <span className="text-xs text-muted-foreground mt-1">
                    #{index + 1}
                  </span>
                </div>

                {/* صورة الطالب */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-primary/30">
                  <User className="w-6 h-6 text-primary/60" />
                </div>

                {/* معلومات الطالب */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground truncate">
                    {student.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {gradeLabel}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg">{student.rank.icon}</span>
                    <span className="text-sm text-primary">{student.rank.nameAr}</span>
                  </div>
                </div>

                {/* النقاط */}
                <div className="text-center">
                  <p className={cn(
                    "text-2xl font-bold",
                    index === 0 ? "text-[#eab308]" :
                    index === 1 ? "text-[#94a3b8]" : "text-[#cd7f32]"
                  )}>
                    {student.totalPoints}
                  </p>
                  <p className="text-xs text-muted-foreground">نقطة</p>
                </div>
              </div>

              {/* الأختام */}
              <div className="mt-4 pt-4 border-t border-border/30">
                <StampsDisplay stamps={student.stamps} size="sm" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <Header />

      <main className="flex-1">
        {/* رأس الصفحة */}
        <section className="relative overflow-hidden py-12">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          
          <div className="container relative text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Trophy className="w-16 h-16 mx-auto mb-4 text-[#eab308]" />
              <h1 className="text-4xl font-bold mb-2 text-gradient-gold">
                لوحة المتصدرين
              </h1>
              <p className="text-lg text-muted-foreground">
                أفضل الطلاب في رحلة نافس
              </p>
            </motion.div>
          </div>
        </section>

        {/* قوائم المتصدرين */}
        <section className="py-8">
          <div className="container">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">جارٍ تحميل بيانات المتصدرين...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <LeaderboardSection
                    title="الصف السادس"
                    students={grade6Top3}
                    gradeLabel="الصف السادس الابتدائي"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <LeaderboardSection
                    title="الصف الثالث"
                    students={grade3Top3}
                    gradeLabel="الصف الثالث الابتدائي"
                  />
                </motion.div>
              </div>
            )}
          </div>
        </section>

        {/* قسم الأختام */}
        <section className="py-12 bg-card/30">
          <div className="container">
            <h2 className="text-2xl font-bold mb-8 text-center">
              🏆 جوائز التميز
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
