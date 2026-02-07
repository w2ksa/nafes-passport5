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
import { applyPointsWithLimit, calculateActualPoints, getMaxPoints } from "@/lib/pointsLimits";
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
  const [showConfirmation, setShowConfirmation] = useState(false);

  // إعادة تعيين عند الإغلاق
  useEffect(() => {
    if (!open) {
      setStep(1);
      setGradeFilter(null);
      setSelectedStudents(new Set());
      setSelectedFields(new Set(["arabic"]));
      setPoints(10);
      setOperation("add");
      setShowConfirmation(false);
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

  // عرض شاشة التأكيد
  const handleClickApply = () => {
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

    // تحذير للأرقام الكبيرة
    if (points > 50) {
      toast.warning(`تحذير: الرقم ${points} كبير جداً! تأكد من صحته.`, {
        duration: 4000,
      });
    }

    // عرض شاشة التأكيد
    setShowConfirmation(true);
  };

  // تطبيق التحديث الفعلي
  const handleConfirmApply = async () => {
    setShowConfirmation(false);

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

        let cappedCount = 0;
        const cappedDetails: string[] = [];

        selectedFields.forEach((field) => {
          const oldValue = updatedPoints[field] || 0;
          
          // تطبيق النقاط مع احترام الحد الأقصى
          const result = calculateActualPoints(
            oldValue,
            field,
            operation,
            points,
            student.grade
          );
          
          updatedPoints[field] = result.actualPoints;
          
          // تسجيل إذا تم التقليص
          if (result.wasCapped) {
            cappedCount++;
            cappedDetails.push(
              `${student.name}: ${FIELDS_AR[field]} (${oldValue} → ${result.actualPoints}، الحد الأقصى: ${result.maxReached})`
            );
          }
          
          changes.push({
            field: `points.${field}`,
            oldValue,
            newValue: result.actualPoints,
            wasCapped: result.wasCapped,
            maxPoints: result.maxReached,
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
      
      // رسالة النجاح
      if (cappedCount > 0) {
        toast.success(
          `تم تحديث ${selectedStudents.size} طالب بنجاح!`,
          {
            description: `تنبيه: تم تطبيق الحد الأقصى لـ ${cappedCount} حالة. راجع سجلات التغييرات للتفاصيل.`,
            duration: 6000,
          }
        );
        console.log("الحالات التي تم تقليصها:", cappedDetails);
      } else {
        toast.success(
          `تم تحديث ${selectedStudents.size} طالب بنجاح!`,
          {
            description: `${operation === "add" ? "إضافة" : "خصم"} ${points} نقطة في: ${fieldsNames}`,
          }
        );
      }

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

      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-3xl font-black text-gray-900">تحديث النقاط الجماعي</DialogTitle>
          <DialogDescription className="text-lg text-gray-600">
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
                <Label className="text-xl font-black text-gray-900">١. اختر العملية</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    size="lg"
                    variant={operation === "add" ? "default" : "outline"}
                    onClick={() => setOperation("add")}
                    className={`h-20 text-xl font-bold gap-2 ${
                      operation === "add" 
                        ? "bg-green-600 hover:bg-green-700" 
                        : "border-2"
                    }`}
                  >
                    <Plus className="h-7 w-7" />
                    <span>إضافة</span>
                  </Button>
                  <Button
                    size="lg"
                    variant={operation === "subtract" ? "default" : "outline"}
                    onClick={() => setOperation("subtract")}
                    className={`h-20 text-xl font-bold gap-2 ${
                      operation === "subtract" 
                        ? "bg-red-600 hover:bg-red-700" 
                        : "border-2"
                    }`}
                  >
                    <Minus className="h-7 w-7" />
                    <span>خصم</span>
                  </Button>
                </div>
              </div>

              {/* عدد النقاط */}
              <div className="space-y-3">
                <Label className="text-xl font-black text-gray-900">٢. عدد النقاط</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={points}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setPoints(Math.min(val, 100)); // حد أقصى 100
                  }}
                  className="h-20 text-4xl font-black text-center border-2"
                  placeholder="10"
                />
              </div>
            </div>

            {/* المواد */}
            <div className="space-y-3">
              <Label className="text-xl font-black text-gray-900">
                ٣. اختر المواد/الأنشطة
                <span className="text-base font-normal text-gray-600 mr-2">(يمكن أكثر من واحدة)</span>
              </Label>
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
                      className={`h-16 text-lg font-bold gap-2 border-2 ${
                        isSelected ? "shadow-md" : ""
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        className="h-5 w-5 pointer-events-none"
                      />
                      <span className="truncate">{label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* ملخص */}
            {selectedStudents.size > 0 && points > 0 && selectedFields.size > 0 && (
              <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 shadow-md">
                <AlertDescription className="text-center space-y-2 py-2">
                  <div className="text-2xl font-black text-green-800">
                    {operation === "add" ? "➕ إضافة" : "➖ خصم"}{" "}
                    <span className="text-4xl text-green-700">{points}</span> نقطة
                  </div>
                  <div className="text-xl font-bold text-gray-700">
                    في: {Array.from(selectedFields).map(f => FIELDS_AR[f]).join(" و ")}
                  </div>
                  <div className="text-xl font-bold text-green-800">
                    لـ <span className="text-3xl">{selectedStudents.size}</span> طالب
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* قائمة الطلاب */}
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Label className="text-xl font-black text-gray-900">
                  ٤. اختر الطلاب 
                  <span className="text-2xl font-black text-blue-600 mr-2">
                    ({selectedStudents.size}/{filteredStudents.length})
                  </span>
                </Label>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={toggleAll}
                  className="text-lg font-bold border-2 h-12"
                >
                  {selectedStudents.size === filteredStudents.length ? "❌ إلغاء الكل" : "✅ تحديد الكل"}
                </Button>
              </div>

              <ScrollArea className="h-[350px] border-2 rounded-lg p-4 bg-white">
                <div className="space-y-3">
                  {filteredStudents.map((student) => {
                    const isSelected = selectedStudents.has(student.id);
                    
                    return (
                      <div
                        key={student.id}
                        onClick={() => toggleStudent(student.id)}
                        className={`
                          flex items-center justify-between p-5 rounded-xl 
                          transition-all cursor-pointer border-2
                          ${isSelected 
                            ? "bg-blue-50 border-blue-600 shadow-lg scale-[1.02]" 
                            : "bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                          }
                        `}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <Checkbox
                            checked={isSelected}
                            className="h-7 w-7 pointer-events-none shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            {/* اسم الطالب - أسود غامق */}
                            <p className="font-black text-2xl text-gray-900 truncate">
                              {student.name}
                            </p>
                            {/* النقاط الحالية */}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                              {Array.from(selectedFields).map((field) => {
                                const currentPoints = student.points[field] || 0;
                                const maxPoints = getMaxPoints(field, student.grade);
                                
                                return (
                                  <span key={field} className="text-base text-gray-700 whitespace-nowrap">
                                    {FIELDS_AR[field]}: <strong className="text-blue-700 text-lg">{currentPoints}</strong>
                                    <span className="text-xs text-gray-500 mr-1">/{maxPoints}</span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        {/* Badge بيضاء */}
                        <Badge 
                          variant="outline" 
                          className="text-lg px-4 py-2 pointer-events-none shrink-0 bg-white border-2 font-bold"
                        >
                          {student.grade === 3 ? "٣" : "٦"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        {/* شاشة التأكيد النهائية */}
        {showConfirmation && step === 2 && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-6 animate-in fade-in zoom-in duration-200">
              <div className="text-center">
                <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
                <h3 className="text-2xl font-bold mb-2">تأكيد التحديث</h3>
                <p className="text-gray-600 text-lg">هل أنت متأكد من هذا الإجراء؟</p>
              </div>

              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 space-y-2">
                <p className="text-xl font-bold text-center">
                  {operation === "add" ? "➕ إضافة" : "➖ خصم"}{" "}
                  <span className="text-3xl text-blue-600">{points}</span> نقطة
                </p>
                <p className="text-lg text-center">
                  في: <strong>{Array.from(selectedFields).map(f => FIELDS_AR[f]).join(" و ")}</strong>
                </p>
                <p className="text-lg text-center">
                  لـ <span className="text-2xl font-bold text-blue-600">{selectedStudents.size}</span> طالب
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 text-lg font-semibold h-14"
                >
                  إلغاء
                </Button>
                <Button
                  size="lg"
                  onClick={handleConfirmApply}
                  className="flex-1 text-lg font-bold h-14 bg-green-600 hover:bg-green-700"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "✓ تأكيد التطبيق"
                  )}
                </Button>
              </div>
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
              onClick={handleClickApply}
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
