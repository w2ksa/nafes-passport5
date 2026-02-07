/*
 * مكون النقاط الجماعية - متطابق مع تصميم النظام الأساسي
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Zap, Plus, Minus, Loader2, AlertTriangle } from "lucide-react";
import { collection, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { toast } from "sonner";
import type { Student } from "@/lib/data";
import { calculateTotalPoints, getRankByPoints } from "@/lib/data";
import { applyPointsWithLimit, getMaxPoints } from "@/lib/pointsLimits";
import { cn } from "@/lib/utils";

interface BulkPointsDialogProps {
  students: Student[];
  onUpdate?: () => void;
}

type FieldKey = "arabic" | "math" | "science" | "morningAssembly" | "nafesExams";

const FIELDS_AR: Record<FieldKey, string> = {
  arabic: "اللغة العربية",
  math: "الرياضيات",
  science: "العلوم",
  morningAssembly: "الطابور الصباحي",
  nafesExams: "اختبارات نافس",
};

export function BulkPointsDialog({ students, onUpdate }: BulkPointsDialogProps) {
  const [open, setOpen] = useState(false);
  const [operation, setOperation] = useState<"add" | "subtract">("add");
  const [selectedFields, setSelectedFields] = useState<Set<FieldKey>>(new Set(["arabic"]));
  const [points, setPoints] = useState<number>(10);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [gradeFilter, setGradeFilter] = useState<3 | 6 | "all">("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // إعادة تعيين
  useEffect(() => {
    if (!open) {
      setOperation("add");
      setSelectedFields(new Set(["arabic"]));
      setPoints(10);
      setSelectedStudents(new Set());
      setGradeFilter("all");
      setShowConfirm(false);
    }
  }, [open]);

  // تصفية الطلاب
  const filteredStudents = students.filter((s) => {
    if (gradeFilter === "all") return true;
    return s.grade === gradeFilter;
  });

  // تحديد/إلغاء تحديد الكل
  const toggleAll = () => {
    setSelectedStudents((prev) => {
      if (prev.size === filteredStudents.length) {
        return new Set();
      }
      return new Set(filteredStudents.map((s) => s.id));
    });
  };

  // تحديد طالب
  const toggleStudent = (id: string) => {
    setSelectedStudents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // تحديد مادة
  const toggleField = (field: FieldKey) => {
    setSelectedFields((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(field)) {
        if (newSet.size > 1) {
          newSet.delete(field);
        } else {
          toast.error("يجب اختيار مادة واحدة على الأقل");
        }
      } else {
        newSet.add(field);
      }
      return newSet;
    });
  };

  // التطبيق
  const handleApply = async () => {
    setShowConfirm(false);
    
    if (!db) {
      toast.error("قاعدة البيانات غير متاحة");
      return;
    }

    try {
      setIsProcessing(true);
      
      let cappedCount = 0;
      const updatePromises = [];
      const logPromises = [];

      for (const studentId of selectedStudents) {
        const student = students.find((s) => s.id === studentId);
        if (!student) continue;

        const updatedPoints = { ...student.points };
        const changes: any[] = [];

        selectedFields.forEach((field) => {
          const oldValue = updatedPoints[field] || 0;
          const newValue = applyPointsWithLimit(
            oldValue,
            field,
            operation,
            points,
            student.grade
          );
          
          if (operation === "add" && newValue < oldValue + points) {
            cappedCount++;
          }
          
          updatedPoints[field] = newValue;
          changes.push({
            field: `points.${field}`,
            oldValue,
            newValue,
          });
        });

        const totalPoints = calculateTotalPoints(updatedPoints, student.grade);
        const newRank = getRankByPoints(totalPoints);

        const studentRef = doc(db, "students", studentId);
        updatePromises.push(
          updateDoc(studentRef, {
            points: updatedPoints,
            totalPoints,
            rank: newRank,
            updatedAt: new Date().toISOString(),
          })
        );

        const logRef = doc(collection(db, "change_logs"));
        logPromises.push(
          setDoc(logRef, {
            timestamp: new Date().toISOString(),
            action: "bulk_update",
            studentId: student.id,
            studentName: student.name,
            changes,
            snapshotBefore: student,
            bulkOperation: {
              operation,
              fields: Array.from(selectedFields),
              points,
              affectedStudents: selectedStudents.size,
            },
          })
        );
      }

      await Promise.all([...updatePromises, ...logPromises]);

      const fieldsNames = Array.from(selectedFields).map(f => FIELDS_AR[f]).join(" و ");
      
      if (cappedCount > 0) {
        toast.success(
          `تم تحديث ${selectedStudents.size} طالب بنجاح`,
          {
            description: `تنبيه: تم تطبيق الحد الأقصى لـ ${cappedCount} حالة`,
            duration: 5000,
          }
        );
      } else {
        toast.success(
          `تم تحديث ${selectedStudents.size} طالب بنجاح`,
          {
            description: `${operation === "add" ? "إضافة" : "خصم"} ${points} نقطة في: ${fieldsNames}`,
          }
        );
      }

      setOpen(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("❌ خطأ في التحديث الجماعي:", error);
      console.error("التفاصيل:", {
        error,
        selectedStudents: Array.from(selectedStudents),
        selectedFields: Array.from(selectedFields),
        points,
        operation,
      });
      toast.error(`فشل في تحديث النقاط: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Zap className="w-4 h-4" />
          نقاط جماعية
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>تحديث النقاط الجماعي</DialogTitle>
          <DialogDescription>
            إضافة أو خصم نقاط لعدة طلاب في نفس الوقت
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* العملية والنقاط */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>العملية</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={operation === "add" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOperation("add")}
                  className="gap-1"
                >
                  <Plus className="w-4 h-4" />
                  إضافة
                </Button>
                <Button
                  variant={operation === "subtract" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOperation("subtract")}
                  className="gap-1"
                >
                  <Minus className="w-4 h-4" />
                  خصم
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>عدد النقاط</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={points}
                onChange={(e) => setPoints(Math.min(parseInt(e.target.value) || 0, 100))}
                placeholder="10"
              />
            </div>
          </div>

          {/* المواد */}
          <div className="space-y-2">
            <Label>المواد (يمكن اختيار أكثر من واحدة)</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(FIELDS_AR).map(([key, label]) => {
                const fieldKey = key as FieldKey;
                const isSelected = selectedFields.has(fieldKey);
                
                return (
                  <Button
                    key={key}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleField(fieldKey)}
                    className="gap-2 justify-start"
                  >
                    <Checkbox checked={isSelected} className="pointer-events-none" />
                    <span className="truncate">{label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* تصفية الصف */}
          <div className="space-y-2">
            <Label>تصفية حسب الصف</Label>
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

          {/* قائمة الطلاب */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>اختر الطلاب ({selectedStudents.size}/{filteredStudents.length})</Label>
              <Button variant="outline" size="sm" onClick={toggleAll}>
                {selectedStudents.size === filteredStudents.length ? "إلغاء الكل" : "تحديد الكل"}
              </Button>
            </div>

            <ScrollArea className="h-[300px] border rounded-lg p-3">
              <div className="space-y-2">
                {filteredStudents.map((student) => {
                  const isSelected = selectedStudents.has(student.id);
                  
                  return (
                    <div
                      key={student.id}
                      onClick={() => toggleStudent(student.id)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors border",
                        isSelected
                          ? "bg-primary/5 border-primary"
                          : "bg-muted/30 border-border hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Checkbox
                          checked={isSelected}
                          className="pointer-events-none"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground truncate">{student.name}</p>
                          <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                            {Array.from(selectedFields).map((field) => {
                              const current = student.points[field] || 0;
                              const max = getMaxPoints(field, student.grade);
                              return (
                                <span key={field}>
                                  {FIELDS_AR[field]}: {current}/{max}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {student.grade === 3 ? "٣" : "٦"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* ملخص */}
          {selectedStudents.size > 0 && points > 0 && (
            <div className="glass-card rounded-lg p-4 border-primary/20">
              <p className="text-sm text-center text-muted-foreground">
                سيتم {operation === "add" ? "إضافة" : "خصم"}{" "}
                <strong className="text-foreground">{points}</strong> نقطة في{" "}
                <strong className="text-foreground">
                  {Array.from(selectedFields).map(f => FIELDS_AR[f]).join(" و ")}
                </strong>{" "}
                لـ <strong className="text-foreground">{selectedStudents.size}</strong> طالب
              </p>
            </div>
          )}
        </div>

        {/* شاشة التأكيد - overlay بسيط */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowConfirm(false)}>
            <div className="bg-background rounded-lg p-6 max-w-md w-full space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
                <h3 className="text-lg font-bold mb-2">تأكيد التحديث</h3>
                <p className="text-sm text-muted-foreground">هل أنت متأكد من هذا الإجراء؟</p>
              </div>
              
              <div className="glass-card rounded-lg p-4 space-y-1 text-center border">
                <p className="font-bold">
                  {operation === "add" ? "➕ إضافة" : "➖ خصم"}{" "}
                  <span className="text-primary text-lg">{points}</span> نقطة
                </p>
                <p className="text-sm text-muted-foreground">
                  في: {Array.from(selectedFields).map(f => FIELDS_AR[f]).join(" و ")}
                </p>
                <p className="text-sm">
                  لـ <span className="font-bold">{selectedStudents.size}</span> طالب
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleApply}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "تأكيد"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* الأزرار */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isProcessing}
            className="flex-1"
          >
            إلغاء
          </Button>
          <Button
            onClick={() => {
              if (selectedStudents.size === 0) {
                toast.error("يرجى اختيار طالب واحد على الأقل");
                return;
              }
              if (points === 0) {
                toast.error("يرجى إدخال عدد النقاط");
                return;
              }
              if (points > 50) {
                toast.warning(`تحذير: الرقم ${points} كبير جداً!`);
              }
              setShowConfirm(true);
            }}
            disabled={isProcessing}
            className="flex-1"
          >
            <Zap className="w-4 h-4 ml-2" />
            تطبيق على {selectedStudents.size} طالب
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
