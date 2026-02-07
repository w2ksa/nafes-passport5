/*
 * مكون النقاط الجماعية
 * تحديث نقاط عدة طلاب في نفس الوقت
 */

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Zap, Plus, Minus, Loader2, AlertTriangle } from "lucide-react";
import { collection, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { toast } from "sonner";
import type { Student } from "@/lib/data";
import { calculateTotalPoints, getRankByPoints } from "@/lib/data";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BulkPointsDialogProps {
  students: Student[];
  onUpdate?: () => void;
}

export function BulkPointsDialog({ students, onUpdate }: BulkPointsDialogProps) {
  const [open, setOpen] = useState(false);
  const [operation, setOperation] = useState<"add" | "subtract">("add");
  const [field, setField] = useState<"arabic" | "math" | "science" | "morningAssembly" | "nafesExams">("arabic");
  const [points, setPoints] = useState<number>(0);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [gradeFilter, setGradeFilter] = useState<"all" | 3 | 6>("all");
  const [isProcessing, setIsProcessing] = useState(false);

  // تصفية الطلاب حسب الصف
  const filteredStudents = students.filter((student) => {
    if (gradeFilter === "all") return true;
    return student.grade === gradeFilter;
  });

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
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
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

        // حساب النقاط الجديدة
        const oldPoints = student.points[field] || 0;
        const newPoints = operation === "add" 
          ? oldPoints + points 
          : Math.max(0, oldPoints - points); // لا نسمح بالسالب

        // تحديث النقاط
        const updatedPoints = {
          ...student.points,
          [field]: newPoints,
        };

        // حساب النقاط الكلية والرتبة الجديدة
        const totalPoints = calculateTotalPoints(updatedPoints, student.grade);
        const newRank = getRankByPoints(totalPoints);

        // تحديث الطالب في Firestore
        const studentRef = doc(db, "students", studentId);
        const updateData = {
          points: updatedPoints,
          totalPoints,
          rank: newRank,
          updatedAt: new Date().toISOString(),
        };

        updatePromises.push(updateDoc(studentRef, updateData));

        // تسجيل التغيير
        const changeLogRef = doc(collection(db, "change_logs"));
        const changeLog = {
          timestamp: new Date().toISOString(),
          action: "bulk_update",
          studentId: student.id,
          studentName: student.name,
          changes: [
            {
              field: `points.${field}`,
              oldValue: oldPoints,
              newValue: newPoints,
            },
            {
              field: "totalPoints",
              oldValue: student.totalPoints,
              newValue: totalPoints,
            },
          ],
          snapshotBefore: student,
          bulkOperation: {
            operation,
            field,
            points,
            affectedStudents: selectedStudents.size,
          },
        };

        changeLogsPromises.push(setDoc(changeLogRef, changeLog));
      }

      // تنفيذ جميع التحديثات
      await Promise.all([...updatePromises, ...changeLogsPromises]);

      toast.success(
        `تم تحديث ${selectedStudents.size} طالب بنجاح!`,
        {
          description: `${operation === "add" ? "إضافة" : "خصم"} ${points} نقطة في ${getFieldName(field)}`,
        }
      );

      // إعادة تعيين النموذج
      setSelectedStudents(new Set());
      setPoints(0);
      setOpen(false);

      // إشعار الكومبوننت الأب
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("خطأ في التحديث الجماعي:", error);
      toast.error("فشل في تحديث النقاط");
    } finally {
      setIsProcessing(false);
    }
  };

  // الحصول على اسم الحقل بالعربي
  const getFieldName = (field: string) => {
    switch (field) {
      case "arabic":
        return "اللغة العربية";
      case "math":
        return "الرياضيات";
      case "science":
        return "العلوم";
      case "morningAssembly":
        return "الطابور الصباحي";
      case "nafesExams":
        return "اختبارات نافس";
      default:
        return field;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-purple-600 hover:bg-purple-700">
          <Zap className="h-4 w-4" />
          نقاط جماعية
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">تحديث النقاط الجماعي</DialogTitle>
          <DialogDescription>
            إضافة أو خصم نقاط لعدة طلاب في نفس الوقت
          </DialogDescription>
        </DialogHeader>

        {!db && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              قاعدة البيانات غير متاحة. النقاط الجماعية تعمل فقط مع Firebase.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* العملية */}
          <div className="space-y-2">
            <Label>العملية</Label>
            <Select value={operation} onValueChange={(v) => setOperation(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-green-600" />
                    إضافة نقاط
                  </div>
                </SelectItem>
                <SelectItem value="subtract">
                  <div className="flex items-center gap-2">
                    <Minus className="h-4 w-4 text-red-600" />
                    خصم نقاط
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* الحقل */}
          <div className="space-y-2">
            <Label>المادة/النشاط</Label>
            <Select value={field} onValueChange={(v) => setField(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="arabic">اللغة العربية</SelectItem>
                <SelectItem value="math">الرياضيات</SelectItem>
                <SelectItem value="science">العلوم</SelectItem>
                <SelectItem value="morningAssembly">الطابور الصباحي</SelectItem>
                <SelectItem value="nafesExams">اختبارات نافس</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* عدد النقاط */}
          <div className="space-y-2">
            <Label>عدد النقاط</Label>
            <Input
              type="number"
              min="0"
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
              placeholder="مثال: 10"
            />
          </div>

          {/* تصفية الصف */}
          <div className="space-y-2">
            <Label>تصفية حسب الصف</Label>
            <Select value={gradeFilter.toString()} onValueChange={(v) => setGradeFilter(v === "all" ? "all" : parseInt(v) as 3 | 6)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الصفوف</SelectItem>
                <SelectItem value="3">الصف الثالث</SelectItem>
                <SelectItem value="6">الصف السادس</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ملخص */}
        {selectedStudents.size > 0 && points > 0 && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-800">
              سيتم {operation === "add" ? "إضافة" : "خصم"}{" "}
              <strong>{points}</strong> نقطة في{" "}
              <strong>{getFieldName(field)}</strong> لـ{" "}
              <strong>{selectedStudents.size}</strong> طالب
            </AlertDescription>
          </Alert>
        )}

        {/* قائمة الطلاب */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>اختر الطلاب ({selectedStudents.size}/{filteredStudents.length})</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAll}
            >
              {selectedStudents.size === filteredStudents.length ? "إلغاء الكل" : "تحديد الكل"}
            </Button>
          </div>

          <ScrollArea className="h-[300px] border rounded-lg p-4">
            <div className="space-y-2">
              {filteredStudents.map((student) => (
                <label
                  key={student.id}
                  htmlFor={`student-${student.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={`student-${student.id}`}
                      checked={selectedStudents.has(student.id)}
                      onCheckedChange={() => toggleStudent(student.id)}
                    />
                    <div className="pointer-events-none">
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-gray-500">
                        الصف {student.grade} • النقاط الحالية: {student.points[field] || 0}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="pointer-events-none">
                    {student.grade === 3 ? "٣" : "٦"}
                  </Badge>
                </label>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isProcessing}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleApply}
            disabled={isProcessing || selectedStudents.size === 0 || points === 0}
            className="gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري التحديث...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                تطبيق على {selectedStudents.size} طالب
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
