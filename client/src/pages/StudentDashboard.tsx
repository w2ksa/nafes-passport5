/*
 * صفحة لوحة تحكم الطالب
 * تصميم بسيط ونظيف لعرض تفاصيل الطالب
 */

import { useParams, Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StationCard } from "@/components/StationCard";
import { RankCard } from "@/components/RankCard";
import { StampsDisplay } from "@/components/StampsDisplay";
import { CircularProgress } from "@/components/CircularProgress";
import { GRADE_3_STATIONS, GRADE_6_STATIONS } from "@/lib/data";
import { useStudent } from "@/hooks/useStudents";
import { Button } from "@/components/ui/button";
import { ArrowRight, Eye, Trophy, Target, User, Loader2, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function StudentDashboard() {
  const params = useParams<{ id: string }>();
  const { student, isLoading } = useStudent(params.id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background" dir="rtl">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">جارٍ تحميل بيانات الطالب...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex flex-col bg-background" dir="rtl">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl text-muted-foreground mb-4">الطالب غير موجود</p>
            <Link href="/">
              <Button>العودة للرئيسية</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const stations = student.grade === 6 ? GRADE_6_STATIONS : GRADE_3_STATIONS;
  const maxPoints = 100;

  // الحصول على نقاط المحطة
  const getStationPoints = (stationId: string): number => {
    const pointsMap: Record<string, number> = {
      arabic: student.points.arabic,
      math: student.points.math,
      science: student.points.science || 0,
      morningAssembly: student.points.morningAssembly,
      nafesExams: student.points.nafesExams,
    };
    return pointsMap[stationId] || 0;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <Header />

      <main className="flex-1">
        {/* رأس الصفحة */}
        <section className="relative overflow-hidden py-8 border-b border-border/30">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />

          <div className="container relative">
            {/* زر العودة */}
            <Link href="/">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowRight className="w-4 h-4 ml-2" />
                العودة
              </Button>
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col md:flex-row items-center gap-6"
            >
              {/* صورة الطالب */}
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-4 border-primary/30">
                  <User className="w-14 h-14 text-primary/60" />
                </div>
                <div className="absolute -bottom-2 -left-2 bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm font-bold">
                  {student.grade === 6 ? "٦" : "٣"}
                </div>
              </div>

              {/* معلومات الطالب */}
              <div className="text-center md:text-right flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {student.name}
                </h1>
                <p className="text-lg text-muted-foreground mb-4">
                  الصف {student.grade === 6 ? "السادس" : "الثالث"} الابتدائي
                </p>

                {/* الرتبة الحالية */}
                <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                  <span className="text-4xl">{student.rank.icon}</span>
                  <div>
                    <p className="text-xl font-bold text-primary">{student.rank.nameAr}</p>
                    <p className="text-sm text-muted-foreground">{student.rank.nameEn}</p>
                  </div>
                </div>

                {/* عدد المشاهدات */}
                <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  <span>{student.viewCount} مشاهدة</span>
                </div>
              </div>

              {/* مؤشر النقاط الإجمالي */}
              <div className="glass-card rounded-2xl p-6">
                <CircularProgress
                  value={student.totalPoints}
                  max={maxPoints}
                  size={140}
                  strokeWidth={10}
                  color={student.totalPoints >= 90 ? "gold" : student.totalPoints >= 70 ? "teal" : "blue"}
                  label="نقطة"
                />
                <p className="text-center text-sm text-muted-foreground mt-2">
                  الإجمالي من {maxPoints}
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* التعليقات */}
        <section className="py-8">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="glass-card rounded-xl p-6 border-2 border-border/50"
            >
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold">التعليقات</h2>
              </div>

              {student.comments && student.comments.length > 0 ? (
                <div className="space-y-4">
                  {student.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-gradient-to-br from-primary/5 to-transparent rounded-lg p-4 border border-primary/20"
                    >
                      <p className="text-foreground leading-relaxed whitespace-pre-wrap mb-3">
                        {comment.text}
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-primary">{comment.author}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8 italic">
                  لا توجد تعليقات حالياً
                </p>
              )}
            </motion.div>
          </div>
        </section>

        {/* الأختام */}
        <section className="py-8 bg-card/30">
          <div className="container">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#eab308]" />
              الأختام المكتسبة
            </h2>
            <div className="glass-card rounded-xl p-6">
              <StampsDisplay stamps={student.stamps} size="lg" />
            </div>
          </div>
        </section>

        {/* المحطات الأكاديمية */}
        <section className="py-8">
          <div className="container">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#14b8a6]" />
              المحطات الأكاديمية
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {stations.map((station, index) => (
                <motion.div
                  key={station.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <StationCard
                    id={station.id}
                    nameAr={station.nameAr}
                    icon={station.icon}
                    points={getStationPoints(station.id)}
                    maxPoints={station.maxPoints}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* خريطة الرتب */}
        <section className="py-8 bg-card/30">
          <div className="container">
            <div className="max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <RankCard
                  currentRank={student.rank}
                  totalPoints={student.totalPoints}
                />
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
