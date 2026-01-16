/*
 * مكون رفع ملفات Excel
 * قراءة بيانات الطلاب من ملف Excel
 */

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import type { Student } from "@/lib/data";
import { RANKS } from "@/lib/data";

interface ExcelUploaderProps {
  onDataLoaded: (students: Student[]) => void;
  isUnlocked: boolean;
}

export function ExcelUploader({ onDataLoaded, isUnlocked }: ExcelUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    success: boolean;
    message: string;
    count?: number;
  } | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setUploadStatus(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // معالجة البيانات وتحويلها إلى صيغة Student
      const students: Student[] = jsonData.map((row: any, index: number) => {
        const grade = parseInt(row.الصف || row.Grade || "6") as 3 | 6;
        const totalPoints = parseInt(row.النقاط_الكلية || row.Total_Points || "0");
        
        // تحديد الرتبة بناءً على النقاط
        const rank = RANKS.find(r => totalPoints >= r.minPoints && totalPoints <= r.maxPoints) || RANKS[0];

        // تحديد الأختام بناءً على النقاط
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

      if (students.length === 0) {
        toast.error("لم يتم العثور على بيانات في الملف");
        setUploadStatus({
          success: false,
          message: "لم يتم العثور على بيانات في الملف",
        });
        return;
      }

      onDataLoaded(students);
      setUploadStatus({
        success: true,
        message: `تم تحميل ${students.length} طالب بنجاح`,
        count: students.length,
      });
      toast.success(`تم تحميل ${students.length} طالب بنجاح`);
    } catch (error) {
      console.error("خطأ في قراءة الملف:", error);
      toast.error("حدث خطأ في قراءة الملف");
      setUploadStatus({
        success: false,
        message: "حدث خطأ في قراءة الملف. تأكد من صيغة الملف.",
      });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (!isUnlocked) {
    return null;
  }

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

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full gap-2"
            variant="outline"
          >
            <Upload className="w-4 h-4" />
            {isLoading ? "جاري التحميل..." : "اختر ملف Excel"}
          </Button>

          {/* تعليمات الملف */}
          <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/30 rounded">
            <p className="font-medium">الأعمدة المتوقعة:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>الاسم (Name)</li>
              <li>الصف (Grade): 3 أو 6</li>
              <li>اللغة_العربية (Arabic)</li>
              <li>الرياضيات (Math)</li>
              <li>العلوم (Science) - للصف السادس فقط</li>
              <li>الطابور_الصباحي (Morning_Assembly)</li>
              <li>اختبارات_نافس (Nafes_Exams)</li>
            </ul>
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
              <span className={`text-sm ${
                uploadStatus.success ? "text-green-200" : "text-red-200"
              }`}>
                {uploadStatus.message}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
