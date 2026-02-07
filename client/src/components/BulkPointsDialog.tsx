/*
 * مكون النقاط الجماعية المحسّن
 * تحديث نقاط عدة طلاب في نفس الوقت
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Zap, Plus, Minus, Loader2, AlertTriangle, Users } from "lucide-react";
import { collection, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { toast } from "sonner";
import type { Student } from "@/lib/data";
import { calculateTotalPoints, getRankByPoints } from "@/lib/data";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [step, setStep] = useState<1 | 2>(1); // خطوة 1: اختيار الصف، خطوة 2: التفاصيل
  const [operation, setOperation] = useState<"add" | "subtract">("add");
  const [selectedFields, setSelectedFields] = useState<Set<FieldKey>>(new Set(["arabic"]));
  const [points, setPoints] = useState<number>(10);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [gradeFilter, setGradeFilter] = useState<3 | 6 | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // إعادة تعيين عند الإغلاق
  useEffect(() => {
    if (!open) {
      setStep(1);
      setGradeFilter(null);
      setSelectedStudents(new Set());
      setSelectedFields(new Set(["arabic"]));
      setPoints(10);
      setOperation("add");
    }
  }, [open]);

  // تصفية الطلاب حسب الصف
  const filteredStudents = gradeFilter 
    ? students.filter((s) => s.grade === gradeFilter)
    : [];

  // تحديد/إلغاء تحديد الكل
  const toggleAll = () => {
    setSelectedStudents((prev) => {
      if (prev.size === filteredStudents.length) {
        return new Set();
      } else {
        return new Set(filteredStudents.map((s) => s.id));
      }
    });
  };

  // تحديد/إلغاء تحديد طالب
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

  // تحديد/إلغاء تحديد مادة
  const toggleField = (field: FieldKey) => {
    setSelectedFields((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(field)) {
        if (newSet.size > 1) { // لا نسمح بإلغاء جميع المواد
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

  // تطبيق التحديث
  const handleApply = async () => {
    if (!db) {
      toast.error("قاعدة البيانات غير متاحة");
      return;
    }

    if (selectedStudents.size === 0) {
      toast.error("يرجى اختيار طالب واحد على الأقل");
      return;
    }

    if (points === 0) {
      toast.error("يرجى إدخال عدد النقاط");
      return;
    }

    try {
      setIsProcessing(true);
      
      const changeLogsPromises = [];
      const updatePromises = [];

      for (const studentId of selectedStudents) {
        const student = students.find((s) => s.id === studentId);
        if (!student) continue;

        // تحديث جميع المواد المحددة
        const updatedPoints = { ...student.points };
        const changes: any[] = [];

        selectedFields.forEach((field) => {
          const oldValue = updatedPoints[field] || 0;
          const newValue = operation === "add" 
            ? oldValue + points 
            : Math.max(0, oldValue - points);
          
          updatedPoints[field] = newValue;
          changes.push({
            field: `points.${field}`,
            oldValue,
            newValue,
          });
        });

        // حساب النقاط الكلية والرتبة
        const totalPoints = calculateTotalPoints(updatedPoints, student.grade);
        const newRank = getRankByPoints(totalPoints);

        changes.push({
          field: "totalPoints",
          oldValue: student.totalPoints,
          newValue: totalPoints,
        });

        // تحديث الطالب
        const studentRef = doc(db, "students", studentId);
        updatePromises.push(
          updateDoc(studentRef, {
            points: updatedPoints,
            totalPoints,
            rank: newRank,
            updatedAt: new Date().toISOString(),
          })
        );

        // تسجيل التغيير
        const changeLogRef = doc(collection(db, "change_logs"));
        changeLogsPromises.push(
          setDoc(changeLogRef, {
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

      await Promise.all([...updatePromises, ...changeLogsPromises]);

      const fieldsNames = Array.from(selectedFields).map(f => FIELDS_AR[f]).join(" و ");
      toast.success(
        `تم تحديث ${selectedStudents.size} طالب بنجاح!`,
        {
          description: `${operation === "add" ? "إضافة" : "خصم"} ${points} نقطة في: ${fieldsNames}`,
        }
      );

      setOpen(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("خطأ في التحديث الجماعي:", error);
      toast.error("فشل في تحديث النقاط");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-purple-600 hover:bg-purple-700">
          <Zap className="h-5 w-5" />
          <span className="text-base font-semibold">نقاط جماعية</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-5xl max-h-[95vh]">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold">تحديث النقاط الجماعي</DialogTitle>
          <DialogDescription className="text-lg">
            إضافة أو خصم نقاط لعدة طلاب في نفس الوقت
          </DialogDescription>
        </DialogHeader>

        {!db && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-base">
              قاعدة البيانات غير متاحة. النقاط الجماعية تعمل فقط مع Firebase.
            </AlertDescription>
          </Alert>
        )}

        {/* الخطوة 1: اختيار الصف */}
        {step === 1 && (
          <div className="space-y-6 py-6">
            <div className="text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-purple-600" />
              <h3 className="text-2xl font-bold mb-2">اختر الصف أولاً</h3>
              <p className="text-gray-600 text-lg">حدد الصف الذي تريد تحديث نقاطه</p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
              <Button
                size="lg"
                variant={gradeFilter === 3 ? "default" : "outline"}
                onClick={() => {
                  setGradeFilter(3);
                  setStep(2);
                }}
                className="h-32 text-2xl font-bold"
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">٣</div>
                  <div>الصف الثالث</div>
                  <div className="text-sm font-normal mt-1 opacity-70">
                    ({students.filter(s => s.grade === 3).length} طالب)
                  </div>
                </div>
              </Button>

              <Button
                size="lg"
                variant={gradeFilter === 6 ? "default" : "outline"}
                onClick={() => {
                  setGradeFilter(6);
                  setStep(2);
                }}
                className="h-32 text-2xl font-bold"
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">٦</div>
                  <div>الصف السادس</div>
                  <div className="text-sm font-normal mt-1 opacity-70">
                    ({students.filter(s => s.grade === 6).length} طالب)
                  </div>
                </div>
              </Button>
            </div>
          </div>
        )}

        {/* الخطوة 2: التفاصيل */}
        {step === 2 && gradeFilter && (
          <div className="space-y-6">
            {/* عرض الصف المختار */}
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-lg font-semibold text-blue-800">
                الصف المختار: {gradeFilter === 3 ? "الثالث" : "السادس"} 
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="mr-4 text-blue-600"
                >
                  تغيير الصف
                </Button>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-6">
              {/* العملية */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold">العملية</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="lg"
                    variant={operation === "add" ? "default" : "outline"}
                    onClick={() => setOperation("add")}
                    className="h-16 text-xl gap-2"
                  >
                    <Plus className="h-6 w-6" />
                    إضافة
                  </Button>
                  <Button
                    size="lg"
                    variant={operation === "subtract" ? "default" : "outline"}
                    onClick={() => setOperation("subtract")}
                    className="h-16 text-xl gap-2"
                  >
                    <Minus className="h-6 w-6" />
                    خصم
                  </Button>
                </div>
              </div>

              {/* عدد النقاط */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold">عدد النقاط</Label>
                <Input
                  type="number"
                  min="0"
                  value={points}
                  onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                  className="h-16 text-2xl font-bold text-center"
                  placeholder="10"
                />
              </div>
            </div>

            {/* المواد */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold">اختر المواد/الأنشطة (يمكن اختيار أكثر من واحدة)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(FIELDS_AR).map(([key, label]) => {
                  // إخفاء العلوم للصف الثالث
                  if (key === "science" && gradeFilter === 3) return null;
                  
                  const fieldKey = key as FieldKey;
                  const isSelected = selectedFields.has(fieldKey);
                  
                  return (
                    <Button
                      key={key}
                      size="lg"
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => toggleField(fieldKey)}
                      className="h-16 text-lg font-semibold"
                    >
                      <Checkbox
                        checked={isSelected}
                        className="ml-2 pointer-events-none"
                      />
                      {label}
                    </Button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* ملخص */}
            {selectedStudents.size > 0 && points > 0 && selectedFields.size > 0 && (
              <Alert className="bg-green-50 border-green-300">
                <AlertDescription className="text-xl font-bold text-green-800">
                  سيتم {operation === "add" ? "إضافة" : "خصم"}{" "}
                  <span className="text-2xl">{points}</span> نقطة في:{" "}
                  <span className="underline">
                    {Array.from(selectedFields).map(f => FIELDS_AR[f]).join(" و ")}
                  </span>
                  {" "}لـ <span className="text-2xl">{selectedStudents.size}</span> طالب
                </AlertDescription>
              </Alert>
            )}

            {/* قائمة الطلاب */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xl font-semibold">
                  اختر الطلاب ({selectedStudents.size}/{filteredStudents.length})
                </Label>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={toggleAll}
                  className="text-base font-semibold"
                >
                  {selectedStudents.size === filteredStudents.length ? "إلغاء الكل" : "تحديد الكل"}
                </Button>
              </div>

              <ScrollArea className="h-[350px] border-2 rounded-lg p-4">
                <div className="space-y-3">
                  {filteredStudents.map((student) => {
                    const isSelected = selectedStudents.has(student.id);
                    
                    return (
                      <div
                        key={student.id}
                        onClick={() => toggleStudent(student.id)}
                        className={`
                          flex items-center justify-between p-4 rounded-lg 
                          transition-all cursor-pointer border-2
                          ${isSelected 
                            ? "bg-blue-50 border-blue-500 shadow-md" 
                            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                          }
                        `}
                      >
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={isSelected}
                            className="h-6 w-6 pointer-events-none"
                          />
                          <div>
                            <p className="font-bold text-xl">{student.name}</p>
                            <div className="flex gap-4 mt-1 text-base text-gray-600">
                              {Array.from(selectedFields).map((field) => (
                                <span key={field}>
                                  {FIELDS_AR[field]}: <strong>{student.points[field] || 0}</strong>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-lg px-3 py-1 pointer-events-none">
                          {student.grade === 3 ? "الصف ٣" : "الصف ٦"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 2 && (
            <Button
              size="lg"
              variant="outline"
              onClick={() => setStep(1)}
              className="text-base"
            >
              رجوع
            </Button>
          )}
          <Button
            size="lg"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isProcessing}
            className="text-base"
          >
            إلغاء
          </Button>
          {step === 2 && (
            <Button
              size="lg"
              onClick={handleApply}
              disabled={isProcessing || selectedStudents.size === 0 || points === 0}
              className="gap-2 text-lg font-bold"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  تطبيق على {selectedStudents.size} طالب
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
