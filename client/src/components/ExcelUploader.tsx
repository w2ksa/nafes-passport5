/*
 * مكون رفع ملفات Excel
 * قراءة بيانات الطلاب من ملف Excel مع تقرير الفروقات في الأسماء
 */

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, AlertCircle, CheckCircle, UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import type { Student } from "@/lib/data";
import { RANKS } from "@/lib/data";

interface ExcelUploaderProps {
  students: Student[];
  onDataLoaded: (students: Student[]) => void;
  isUnlocked: boolean;
}

interface NameDiff {
  newNames: string[];      // موجود بالإكسل، غير موجود بالقاعدة
  removedNames: string[];  // موجود بالقاعدة، غير موجود بالإكسل
}

export function ExcelUploader({ students, onDataLoaded, isUnlocked }: ExcelUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    success: boolean;
    message: string;
    count?: number;
  } | null>(null);
  const [nameDiff, setNameDiff] = useState<NameDiff | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setUploadStatus(null);
    setNameDiff(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // معالجة البيانات وتحويلها إلى صيغة Student
      const parsedStudents: Student[] = jsonData.map((row: any, index: number) => {
        const grade = parseInt(row.الصف || row.Grade || "6") as 3 | 6;
        const totalPoints = parseInt(row.النقاط_الكلية || row.Total_Points || "0");
        const rank = RANKS.find(r => totalPoints >= r.minPoints && totalPoints <= r.maxPoints) || RANKS[0];
        const stamps = {
          silver: totalPoints >= 70,
          gold: totalPoints >= 85,
          diamond: totalPoints >= 95,
        };

        return {
          id: (index + 1).toString(),
          name: row.الاسم || row.Name || `طالب ${index + 1}`,
          grade,
          points: grade === 6
            ? {
                arabic: parseInt(row.اللغة_العربية || row.Arabic || "0"),
                math: parseInt(row.الرياضيات || row.Math || "0"),
                science: parseInt(row.العلوم || row.Science || "0"),
                morningAssembly: parseInt(row.الطابور_الصباحي || row.Morning_Assembly || "0"),
                nafesExams: parseInt(row.اختبارات_نافس || row.Nafes_Exams || "0"),
              }
            : {
                arabic: parseInt(row.اللغة_العربية || row.Arabic || "0"),
                math: parseInt(row.الرياضيات || row.Math || "0"),
                morningAssembly: parseInt(row.الطابور_الصباحي || row.Morning_Assembly || "0"),
                nafesExams: parseInt(row.اختبارات_نافس || row.Nafes_Exams || "0"),
              },
          totalPoints,
          rank,
          stamps,
          viewCount: 0,
        };
      });

      if (parsedStudents.length === 0) {
        toast.error("لم يتم العثور على بيانات في الملف");
        setUploadStatus({ success: false, message: "لم يتم العثور على بيانات في الملف" });
        return;
      }

      // ===== مقارنة الأسماء =====
      const excelNames = parsedStudents.map(s => s.name.trim());
      const dbNames = students.map(s => s.name.trim());

      const newNames = excelNames.filter(n => !dbNames.includes(n));
      const removedNames = dbNames.filter(n => !excelNames.includes(n));

      setNameDiff({ newNames, removedNames });

      // إشعار بالفروقات
      if (newNames.length > 0) {
        toast.warning(`${newNames.length} اسم موجود بالإكسل غير موجود بالقاعدة`, { duration: 5000 });
      }
      if (removedNames.length > 0) {
        toast.warning(`${removedNames.length} اسم موجود بالقاعدة غير موجود بالإكسل`, { duration: 5000 });
      }

      onDataLoaded(parsedStudents);
      setUploadStatus({
        success: true,
        message: `تم تحميل ${parsedStudents.length} طالب من الإكسل`,
        count: parsedStudents.length,
      });

      if (newNames.length === 0 && removedNames.length === 0) {
        toast.success(`الأسماء متطابقة تماماً ✅`);
      }

    } catch (error) {
      console.error("خطأ في قراءة الملف:", error);
      toast.error("حدث خطأ في قراءة الملف");
      setUploadStatus({ success: false, message: "حدث خطأ في قراءة الملف. تأكد من صيغة الملف." });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!isUnlocked) return null;

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold">استيراد بيانات من Excel</h3>
            <p className="text-sm text-muted-foreground mt-1">
              قم برفع ملف Excel يحتوي على بيانات الطلاب
            </p>
          </div>
          <Upload className="w-6 h-6 text-muted-foreground" />
        </div>

        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex gap-3">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex-1 gap-2"
              variant="outline"
            >
              <Upload className="w-4 h-4" />
              {isLoading ? "جاري التحميل..." : "رفع التعديلات (إكسل)"}
            </Button>
            <Button
              onClick={() => {
                if (!students || students.length === 0) {
                  toast.error("لا يوجد طلاب لتصديرهم");
                  return;
                }
                const data = students.map(s => ({
                  "الاسم": s.name,
                  "الصف": s.grade,
                  "النقاط_الكلية": s.totalPoints,
                  "اللغة_العربية": s.points.arabic ?? 0,
                  "الرياضيات": s.points.math ?? 0,
                  "العلوم": s.grade === 6 ? (s.points.science ?? 0) : 0,
                  "الطابور_الصباحي": s.points.morningAssembly ?? 0,
                  "اختبارات_نافس": s.points.nafesExams ?? 0
                }));
                const ws = XLSX.utils.json_to_sheet(data);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "الطلاب");
                XLSX.writeFile(wb, "بيانات_الطلاب.xlsx");
                toast.success("تم تصدير ملف الإكسل بنجاح");
              }}
              disabled={isLoading}
              className="flex-[0.5] gap-2"
              variant="default"
            >
              استخراج البيانات للإكسل
            </Button>
          </div>

          <div className="text-xs text-muted-foreground mt-2 p-3 bg-muted/30 rounded border border-border">
            <p><strong>خطوات الاستخدام:</strong></p>
            <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>انقر على <strong>استخراج البيانات للإكسل</strong> لتحميل قائمة الطلاب الحالية.</li>
              <li>افتح الملف وقم بتعديل الدرجات والنقاط كما تريد، ثم احفظ الملف.</li>
              <li>انقر على <strong>رفع التعديلات (إكسل)</strong> لرفع الملف المعدل إلى المنظومة وحفظه.</li>
            </ol>
          </div>

          {/* حالة التحميل */}
          {uploadStatus && (
            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              uploadStatus.success
                ? "bg-green-500/10 border border-green-500/30"
                : "bg-red-500/10 border border-red-500/30"
            }`}>
              {uploadStatus.success ? (
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              )}
              <span className={`text-sm ${uploadStatus.success ? "text-green-200" : "text-red-200"}`}>
                {uploadStatus.message}
              </span>
            </div>
          )}

          {/* تقرير الفروقات في الأسماء */}
          {nameDiff && (nameDiff.newNames.length > 0 || nameDiff.removedNames.length > 0) && (
            <div className="space-y-3 mt-2">

              {/* أسماء جديدة بالإكسل */}
              {nameDiff.newNames.length > 0 && (
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <UserPlus className="w-4 h-4 text-orange-400 shrink-0" />
                    <span className="text-sm font-semibold text-orange-300">
                      {nameDiff.newNames.length} اسم بالإكسل غير موجود بالقاعدة
                    </span>
                  </div>
                  <p className="text-xs text-orange-200/70 mb-2">
                    هذي الأسماء موجودة بالإكسل لكن مو مسجلة في النظام — لن تُحدَّث درجاتهم
                  </p>
                  <ul className="space-y-1">
                    {nameDiff.newNames.map((name, i) => (
                      <li key={i} className="text-xs text-orange-200 flex items-center gap-1">
                        <span className="text-orange-400">+</span> {name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* أسماء في القاعدة غير موجودة بالإكسل */}
              {nameDiff.removedNames.length > 0 && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <UserMinus className="w-4 h-4 text-yellow-400 shrink-0" />
                    <span className="text-sm font-semibold text-yellow-300">
                      {nameDiff.removedNames.length} اسم بالقاعدة غير موجود بالإكسل
                    </span>
                  </div>
                  <p className="text-xs text-yellow-200/70 mb-2">
                    هذي الأسماء في النظام لكن مو موجودة بالإكسل — لن تُحدَّث درجاتهم
                  </p>
                  <ul className="space-y-1">
                    {nameDiff.removedNames.map((name, i) => (
                      <li key={i} className="text-xs text-yellow-200 flex items-center gap-1">
                        <span className="text-yellow-400">−</span> {name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* كل الأسماء متطابقة */}
          {nameDiff && nameDiff.newNames.length === 0 && nameDiff.removedNames.length === 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
              <span className="text-sm text-green-300">جميع الأسماء متطابقة مع القاعدة ✅</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
