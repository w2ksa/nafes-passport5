/*
 * صفحة لوحة تحكم المشرف/المعلم
 * تصميم المرصد الفضائي - إدارة الطلاب والنقاط
 */

import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DatabaseStatus } from "@/components/DatabaseStatus";
import {
  GRADE_3_STATIONS,
  GRADE_6_STATIONS,
  EDIT_CODE,
  verifyEditCode,
  getRankByPoints,
  calculateTotalPoints,
  type Student,
  type StationPoints,
  type Comment
} from "@/lib/data";
import {
  getAllStudents,
  addStudent,
  updateStudent,
  deleteStudent,
} from "@/lib/firestoreService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  UserPlus,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Save,
  X,
  AlertTriangle,
  Search,
  Plus,
  MessageSquare
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ExcelUploader } from "@/components/ExcelUploader";
import { ChangeHistoryDialog } from "@/components/ChangeHistoryDialog";
import { BulkPointsDialog } from "@/components/BulkPointsDialog";
import { nanoid } from "nanoid";
import { collection, doc, setDoc, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

export default function AdminDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [editCode, setEditCode] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUnlockDialogOpen, setIsUnlockDialogOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingPoints, setEditingPoints] = useState<StationPoints | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [newCommentAuthor, setNewCommentAuthor] = useState("");

  // فتح شاشة الرمز تلقائياً عند دخول الصفحة
  useEffect(() => {
    if (!isUnlocked) {
      setIsUnlockDialogOpen(true);
    }
  }, [isUnlocked]);

  // دالة مساعدة لتسجيل التغييرات
  const logChange = async (
    action: "add" | "update" | "delete",
    studentId: string,
    studentName: string,
    changes: { field: string; oldValue: any; newValue: any }[],
    snapshotBefore?: Student
  ) => {
    if (!db) return; // لا نسجل إذا لم يكن Firebase مهيأ

    try {
      // تنظيف snapshot من undefined (Firestore لا يقبلها)
      const cleanSnapshot = snapshotBefore 
        ? JSON.parse(JSON.stringify(snapshotBefore, (key, value) => 
            value === undefined ? null : value
          ))
        : null;

      const changeLogRef = doc(collection(db, "change_logs"));
      await setDoc(changeLogRef, {
        timestamp: new Date().toISOString(),
        action,
        studentId,
        studentName,
        changes,
        snapshotBefore: cleanSnapshot,
      });
    } catch (error) {
      console.error("خطأ في تسجيل التغيير:", error);
      // لا نرمي خطأ هنا لأن هذا ليس عملاً حرجاً
    }
  };

  // جلب الطلاب من قاعدة البيانات مع Realtime Updates
  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // استخدام onSnapshot للتحديثات الفورية
    const studentsRef = collection(db, "students");
    const q = query(studentsRef, orderBy("totalPoints", "desc"));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedStudents: Student[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          fetchedStudents.push({
            id: doc.id,
            name: data.name || "",
            grade: data.grade || 6,
            avatar: data.avatar,
            points: data.points || {},
            totalPoints: data.totalPoints || 0,
            rank: data.rank || {},
            stamps: data.stamps || { silver: false, gold: false, diamond: false },
            viewCount: data.viewCount || 0,
            comments: data.comments || [],
          } as Student);
        });
        setStudents(fetchedStudents);
        setIsLoading(false);
      },
      (error) => {
        console.error("خطأ في الاستماع:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // نموذج إضافة طالب جديد
  const [newStudent, setNewStudent] = useState({
    name: "",
    grade: "6" as "3" | "6",
  });

  // البحث والفلترة
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState<"all" | 3 | 6>("all");

  // تصفية الطلاب حسب البحث والصف
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.includes(searchQuery);
    const matchesGrade = gradeFilter === "all" || student.grade === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  // التحقق من كود التحرير
  const handleUnlock = () => {
    if (verifyEditCode(editCode)) {
      setIsUnlocked(true);
      setIsUnlockDialogOpen(false);
      setEditCode("");
      toast.success("تم فتح صلاحيات التحرير بنجاح");
    } else {
      toast.error("كود التحرير غير صحيح");
    }
  };

  // إضافة طالب جديد
  const handleAddStudent = async () => {
    if (!newStudent.name.trim()) {
      toast.error("يرجى إدخال اسم الطالب");
      return;
    }

    try {
      const grade = parseInt(newStudent.grade) as 3 | 6;
      const points: StationPoints = grade === 6
        ? { arabic: 0, math: 0, science: 0, morningAssembly: 0, nafesExams: 0 }
        : { arabic: 0, math: 0, morningAssembly: 0, nafesExams: 0 };

      const studentData: Omit<Student, "id"> = {
        name: newStudent.name,
        grade: grade,
        points,
        totalPoints: 0,
        rank: { id: 1, nameAr: 'مستكشف صغير', nameEn: 'Junior Explorer', minPoints: 0, maxPoints: 10, icon: '🌍' },
        stamps: { silver: false, gold: false, diamond: false },
        viewCount: 0,
      };

      const newId = await addStudent(studentData);

      // إضافة الطالب الجديد إلى القائمة المحلية
      const newStudentWithId: Student = { ...studentData, id: newId };
      setStudents([...students, newStudentWithId]);
      
      // تسجيل التغيير
      await logChange("add", newId, newStudent.name, [
        { field: "name", oldValue: null, newValue: newStudent.name },
        { field: "grade", oldValue: null, newValue: grade },
      ]);
      
      setNewStudent({ name: "", grade: "6" });
      setIsAddDialogOpen(false);
      toast.success("تم إضافة الطالب بنجاح");
    } catch (error) {
      console.error("خطأ في إضافة الطالب:", error);
      toast.error("فشل في إضافة الطالب");
    }
  };

  // حذف طالب
  const handleDeleteStudent = async (id: string) => {
    try {
      const student = students.find(s => s.id === id);
      if (!student) return;

      await deleteStudent(id);
      
      // تسجيل التغيير قبل الحذف
      await logChange("delete", id, student.name, [
        { field: "all", oldValue: "exists", newValue: "deleted" }
      ], student);
      
      setStudents(students.filter(s => s.id !== id));
      toast.success("تم حذف الطالب بنجاح");
    } catch (error) {
      console.error("خطأ في حذف الطالب:", error);
      toast.error("فشل في حذف الطالب");
    }
  };

  // تحديث نقاط الطالب
  const handleUpdatePoints = async (studentId: string, newPoints: StationPoints) => {
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      const totalPoints = calculateTotalPoints(newPoints, student.grade);
      const newRank = getRankByPoints(totalPoints);

      // تحديث في قاعدة البيانات
      await updateStudent(studentId, {
        points: newPoints,
        totalPoints,
        rank: newRank,
      });

      // تسجيل التغيير
      const changes: { field: string; oldValue: any; newValue: any }[] = [];
      Object.keys(newPoints).forEach((key) => {
        const oldValue = student.points[key as keyof StationPoints];
        const newValue = newPoints[key as keyof StationPoints];
        if (oldValue !== newValue) {
          changes.push({ field: `points.${key}`, oldValue, newValue });
        }
      });
      if (student.totalPoints !== totalPoints) {
        changes.push({ field: "totalPoints", oldValue: student.totalPoints, newValue: totalPoints });
      }
      
      await logChange("update", studentId, student.name, changes, student);

      // تحديث في القائمة المحلية
      setStudents(students.map(s => {
        if (s.id !== studentId) return s;
        return {
          ...s,
          points: newPoints,
          totalPoints,
          rank: newRank,
        };
      }));

      // تحديث selectedStudent إذا كان موجوداً
      if (selectedStudent && selectedStudent.id === studentId) {
        setSelectedStudent({
          ...selectedStudent,
          points: newPoints,
          totalPoints,
          rank: newRank,
        });
      }
    } catch (error) {
      console.error("خطأ في تحديث النقاط:", error);
      toast.error("فشل في تحديث النقاط");
      throw error;
    }
  };

  // تحديث الأختام
  const handleUpdateStamps = async (studentId: string, stampType: 'silver' | 'gold' | 'diamond', value: boolean) => {
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      const updatedStamps = { ...student.stamps, [stampType]: value };

      // تحديث في قاعدة البيانات
      await updateStudent(studentId, { stamps: updatedStamps });

      // تحديث في القائمة المحلية
      setStudents(students.map(s => {
        if (s.id !== studentId) return s;
        return { ...s, stamps: updatedStamps };
      }));
    } catch (error) {
      console.error("خطأ في تحديث الأختام:", error);
      toast.error("فشل في تحديث الأختام");
    }
  };

  // تحديث بيانات الطالب (بما في ذلك التعليقات)
  const handleUpdateStudent = async (studentId: string, updates: Partial<Student>) => {
    try {
      // تحديث في قاعدة البيانات
      await updateStudent(studentId, updates);

      // تحديث في القائمة المحلية
      setStudents(students.map(s => {
        if (s.id !== studentId) return s;
        return { ...s, ...updates };
      }));
    } catch (error) {
      console.error("خطأ في تحديث بيانات الطالب:", error);
      toast.error("فشل في تحديث بيانات الطالب");
      throw error;
    }
  };

  // إضافة تعليق جديد
  const handleAddComment = async (studentId: string) => {
    if (!newCommentText.trim() || !newCommentAuthor.trim()) {
      toast.error("يرجى ملء جميع حقول التعليق");
      return;
    }

    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const newComment: Comment = {
      id: nanoid(),
      text: newCommentText.trim(),
      author: newCommentAuthor.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedComments = [...(student.comments || []), newComment];

    try {
      await updateStudent(studentId, { comments: updatedComments });
      setStudents(students.map(s => s.id === studentId ? { ...s, comments: updatedComments } : s));

      // Update selected student if it's the same one
      if (selectedStudent && selectedStudent.id === studentId) {
        setSelectedStudent({ ...selectedStudent, comments: updatedComments });
      }

      setNewCommentText("");
      setNewCommentAuthor("");
      toast.success("تم إضافة التعليق بنجاح");
    } catch (error) {
      console.error("خطأ في إضافة التعليق:", error);
      toast.error("فشل في إضافة التعليق");
    }
  };

  // حذف تعليق
  const handleDeleteComment = async (studentId: string, commentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const updatedComments = student.comments?.filter(c => c.id !== commentId) || [];

    try {
      await updateStudent(studentId, { comments: updatedComments });
      setStudents(students.map(s => s.id === studentId ? { ...s, comments: updatedComments } : s));

      // Update selected student if it's the same one
      if (selectedStudent && selectedStudent.id === studentId) {
        setSelectedStudent({ ...selectedStudent, comments: updatedComments });
      }

      toast.success("تم حذف التعليق بنجاح");
    } catch (error) {
      console.error("خطأ في حذف التعليق:", error);
      toast.error("فشل في حذف التعليق");
    }
  };


  // إذا لم يكن مفتوح، عرض شاشة الرمز فقط
  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Dialog open={isUnlockDialogOpen} onOpenChange={setIsUnlockDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-center">
                  <Lock className="w-12 h-12 mx-auto mb-3 text-yellow-600" />
                  لوحة التحكم محمية
                </DialogTitle>
                <DialogDescription className="text-center text-base">
                  أدخل كود التحرير للوصول إلى لوحة التحكم
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-3">
                  <Label htmlFor="edit-code-input" className="text-lg font-semibold">
                    كود التحرير
                  </Label>
                  <Input
                    id="edit-code-input"
                    type="password"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleUnlock();
                      }
                    }}
                    placeholder="أدخل الكود..."
                    autoFocus
                    className="w-full text-xl h-14 text-center font-bold"
                  />
                </div>
                <Button onClick={handleUnlock} className="w-full h-14 text-lg font-bold gap-2">
                  <Unlock className="w-5 h-5" />
                  فتح لوحة التحكم
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* حالة الاتصال بقاعدة البيانات */}
        <section className="py-4">
          <div className="container">
            <DatabaseStatus />
          </div>
        </section>

        {/* رأس الصفحة */}
        <section className="relative overflow-hidden py-8 border-b border-border/50">
          <div className="absolute inset-0 stars-bg opacity-30" />

          <div className="container relative">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gradient-teal flex items-center gap-2">
                  <Settings className="w-8 h-8" />
                  لوحة التحكم
                </h1>
                <p className="text-muted-foreground mt-1">
                  إدارة الطلاب والنقاط والأختام
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* حالة لوحة التحكم */}
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border-2 border-green-500 rounded-lg">
                  <Unlock className="w-5 h-5 text-green-600" />
                  <span className="text-base font-semibold text-green-700">مفتوحة</span>
                </div>

                {/* زر الخروج */}
                <Button 
                  variant="outline" 
                  size="lg"
                  className="gap-2 border-red-500 text-red-600 hover:bg-red-50 font-semibold"
                  onClick={() => {
                    setIsUnlocked(false);
                    setEditCode("");
                    toast.info("تم الخروج من لوحة التحكم");
                  }}
                >
                  <Lock className="w-5 h-5" />
                  خروج
                </Button>

                {/* الأزرار الجديدة */}
                {isUnlocked && (
                  <div className="flex gap-2 flex-wrap">
                    {/* سجلات التغييرات */}
                    <ChangeHistoryDialog 
                      onRestore={async () => {
                        // إعادة تحميل الطلاب بعد الاستعادة
                        const fetchedStudents = await getAllStudents();
                        setStudents(fetchedStudents);
                      }}
                    />

                    {/* النقاط الجماعية */}
                    <BulkPointsDialog 
                      students={students}
                      onUpdate={async () => {
                        // إعادة تحميل الطلاب بعد التحديث
                        const fetchedStudents = await getAllStudents();
                        setStudents(fetchedStudents);
                      }}
                    />
                  </div>
                )}

                {/* زر إضافة طالب */}
                {isUnlocked && (
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <UserPlus className="w-4 h-4" />
                        إضافة طالب
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>إضافة طالب جديد</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>اسم الطالب</Label>
                          <Input
                            value={newStudent.name}
                            onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                            placeholder="أدخل اسم الطالب..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>الصف</Label>
                          <Select
                            value={newStudent.grade}
                            onValueChange={(value) => setNewStudent({ ...newStudent, grade: value as "3" | "6" })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="6">الصف السادس</SelectItem>
                              <SelectItem value="3">الصف الثالث</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleAddStudent} className="w-full">
                          <Save className="w-4 h-4 ml-2" />
                          حفظ
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* رفع ملفات Excel */}
        {isUnlocked && (
          <section className="py-8">
            <div className="container">
              <ExcelUploader isUnlocked={isUnlocked} onDataLoaded={setStudents} />
            </div>
          </section>
        )}


        {/* جدول الطلاب */}
        <section className="py-8">
          <div className="container">
            {isLoading ? (
              <div className="glass-card rounded-xl p-8 text-center">
                <p className="text-muted-foreground">جارٍ تحميل بيانات الطلاب...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="glass-card rounded-xl p-8 text-center">
                <p className="text-muted-foreground">لا يوجد طلاب في قاعدة البيانات</p>
              </div>
            ) : (
              <>
                {/* البحث والفلترة */}
                <div className="glass-card rounded-xl p-4 mb-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* خانة البحث */}
                    <div className="relative flex-1">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="ابحث عن طالب بالاسم..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                    {/* فلتر الصف */}
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
                    {/* عدد النتائج */}
                    <div className="flex items-center text-sm text-muted-foreground">
                      {filteredStudents.length} من {students.length} طالب
                    </div>
                  </div>
                </div>

                {/* الجدول */}
                {filteredStudents.length === 0 ? (
                  <div className="glass-card rounded-xl p-8 text-center">
                    <p className="text-muted-foreground">لا توجد نتائج مطابقة للبحث</p>
                  </div>
                ) : (
                  <div className="glass-card rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/30">
                          <tr>
                            <th className="text-right p-4 font-bold">الطالب</th>
                            <th className="text-center p-4 font-bold">الصف</th>
                            <th className="text-center p-4 font-bold">النقاط</th>
                            <th className="text-center p-4 font-bold">الرتبة</th>
                            <th className="text-center p-4 font-bold">الأختام</th>
                            {isUnlocked && <th className="text-center p-4 font-bold">إجراءات</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((student, index) => (
                            <motion.tr
                              key={student.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.05 }}
                              className="border-t border-border/50 hover:bg-muted/20"
                            >
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={student.avatar || "/images/student-avatar-placeholder.png"}
                                    alt={student.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                  <span className="font-medium">{student.name}</span>
                                </div>
                              </td>
                              <td className="text-center p-4">
                                <span className="bg-primary/20 text-primary px-2 py-1 rounded text-sm">
                                  {student.grade === 6 ? "السادس" : "الثالث"}
                                </span>
                              </td>
                              <td className="text-center p-4">
                                <span className="text-xl font-bold text-primary">
                                  {student.totalPoints}
                                </span>
                              </td>
                              <td className="text-center p-4">
                                <div className="flex items-center justify-center gap-2">
                                  <span className="text-xl">{student.rank.icon}</span>
                                  <span className="text-sm">{student.rank.nameAr}</span>
                                </div>
                              </td>
                              <td className="text-center p-4">
                                <div className="flex items-center justify-center gap-1">
                                  <span className={cn("text-lg", student.stamps.silver ? "" : "grayscale opacity-30")}>🥈</span>
                                  <span className={cn("text-lg", student.stamps.gold ? "" : "grayscale opacity-30")}>🥇</span>
                                  <span className={cn("text-lg", student.stamps.diamond ? "" : "grayscale opacity-30")}>💎</span>
                                </div>
                              </td>
                              {isUnlocked && (
                                <td className="text-center p-4">
                                  <div className="flex items-center justify-center gap-2">
                                    <Dialog
                                      open={editingStudentId === student.id}
                                      onOpenChange={(open) => {
                                        if (open) {
                                          // الحصول على أحدث بيانات الطالب من القائمة المحلية
                                          const currentStudent = students.find(s => s.id === student.id) || student;
                                          // إنشاء نسخة جديدة من الطالب لتجنب التحديثات غير المرغوبة
                                          const studentCopy = JSON.parse(JSON.stringify(currentStudent));
                                          setEditingStudentId(student.id);
                                          setSelectedStudent(studentCopy);
                                          setEditingPoints(JSON.parse(JSON.stringify(studentCopy.points)));
                                        } else {
                                          setEditingStudentId(null);
                                          setSelectedStudent(null);
                                          setEditingPoints(null);
                                        }
                                      }}
                                    >
                                      <DialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            // الحصول على أحدث بيانات الطالب من القائمة المحلية
                                            const currentStudent = students.find(s => s.id === student.id) || student;
                                            // إنشاء نسخة جديدة من الطالب لتجنب التحديثات غير المرغوبة
                                            const studentCopy = JSON.parse(JSON.stringify(currentStudent));
                                            setEditingStudentId(student.id);
                                            setSelectedStudent(studentCopy);
                                            setEditingPoints(JSON.parse(JSON.stringify(studentCopy.points)));
                                          }}
                                        >
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                          <DialogTitle>تعديل بيانات {selectedStudent?.name || student.name}</DialogTitle>
                                        </DialogHeader>
                                        {selectedStudent && editingStudentId === student.id && (
                                          <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
                                            {/* تعديل النقاط */}
                                            <div>
                                              <h4 className="font-bold mb-4">النقاط</h4>
                                              <div className="grid grid-cols-2 gap-4">
                                                {(selectedStudent.grade === 6 ? GRADE_6_STATIONS : GRADE_3_STATIONS).map(station => (
                                                  <div key={station.id} className="space-y-2">
                                                    <Label>{station.icon} {station.nameAr}</Label>
                                                    <Input
                                                      type="number"
                                                      min={0}
                                                      max={station.maxPoints}
                                                      value={(editingPoints as any)?.[station.id] ?? 0}
                                                      onChange={(e) => {
                                                        if (editingPoints) {
                                                          const value = parseInt(e.target.value) || 0;
                                                          // احترام الحد الأقصى
                                                          const cappedValue = Math.min(value, station.maxPoints);
                                                          setEditingPoints({
                                                            ...editingPoints,
                                                            [station.id]: cappedValue
                                                          });
                                                          // تحذير إذا تم التقليص
                                                          if (value > station.maxPoints) {
                                                            toast.warning(`الحد الأقصى لـ ${station.nameAr} هو ${station.maxPoints}`);
                                                          }
                                                        }
                                                      }}
                                                    />
                                                    <p className="text-xs text-muted-foreground">الحد الأقصى: {station.maxPoints}</p>
                                                  </div>
                                                ))}
                                              </div>
                                              <Button
                                                onClick={async () => {
                                                  if (selectedStudent && editingPoints) {
                                                    // التحقق من صحة النقاط قبل الحفظ
                                                    const validation = validatePoints(editingPoints, selectedStudent.grade);
                                                    if (!validation.isValid) {
                                                      toast.error("خطأ في النقاط: " + validation.errors.join(", "));
                                                      return;
                                                    }
                                                    
                                                    try {
                                                      await handleUpdatePoints(selectedStudent.id, editingPoints);
                                                      toast.success("تم حفظ النقاط بنجاح");
                                                    } catch (error) {
                                                      // Error already handled in handleUpdatePoints
                                                    }
                                                  }
                                                }}
                                                className="w-full mt-4"
                                                disabled={!isUnlocked}
                                              >
                                                <Save className="w-4 h-4 ml-2" />
                                                حفظ النقاط
                                              </Button>
                                            </div>

                                            {/* تعديل الأختام */}
                                            <div>
                                              <h4 className="font-bold mb-4">الأختام</h4>
                                              <div className="flex gap-4">
                                                {[
                                                  { key: 'silver', label: 'فضي', icon: '🥈' },
                                                  { key: 'gold', label: 'ذهبي', icon: '🥇' },
                                                  { key: 'diamond', label: 'ماسي', icon: '💎' },
                                                ].map(stamp => (
                                                  <label key={stamp.key} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                      type="checkbox"
                                                      checked={(selectedStudent.stamps as any)[stamp.key]}
                                                      onChange={(e) => handleUpdateStamps(selectedStudent.id, stamp.key as any, e.target.checked)}
                                                      className="w-4 h-4"
                                                    />
                                                    <span>{stamp.icon}</span>
                                                    <span>{stamp.label}</span>
                                                  </label>
                                                ))}
                                              </div>
                                            </div>

                                            {/* التعليقات */}
                                            <div>
                                              <h4 className="font-bold mb-4 flex items-center gap-2">
                                                <MessageSquare className="w-5 h-5" />
                                                التعليقات
                                              </h4>

                                              {/* قائمة التعليقات الموجودة */}
                                              <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
                                                {selectedStudent.comments && selectedStudent.comments.length > 0 ? (
                                                  selectedStudent.comments.map(comment => (
                                                    <div key={comment.id} className="bg-muted/30 rounded-lg p-3 border border-border/50">
                                                      <p className="text-sm leading-relaxed whitespace-pre-wrap mb-2">{comment.text}</p>
                                                      <div className="flex justify-between items-center">
                                                        <div className="flex flex-col text-xs text-muted-foreground">
                                                          <span className="font-semibold text-primary">{comment.author}</span>
                                                          <span>{new Date(comment.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                                        </div>
                                                        <Button
                                                          size="sm"
                                                          variant="ghost"
                                                          className="text-destructive hover:text-destructive h-8 w-8 p-0"
                                                          onClick={() => handleDeleteComment(selectedStudent.id, comment.id)}
                                                          disabled={!isUnlocked}
                                                        >
                                                          <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                      </div>
                                                    </div>
                                                  ))
                                                ) : (
                                                  <p className="text-sm text-muted-foreground text-center py-6 bg-muted/20 rounded-lg">
                                                    لا توجد تعليقات
                                                  </p>
                                                )}
                                              </div>

                                              {/* إضافة تعليق جديد */}
                                              <div className="border-t border-border/50 pt-4 space-y-3">
                                                <div className="space-y-2">
                                                  <Label>تعليق جديد</Label>
                                                  <Textarea
                                                    placeholder="اكتب تعليق جديد..."
                                                    value={newCommentText}
                                                    onChange={(e) => setNewCommentText(e.target.value)}
                                                    maxLength={500}
                                                    className="min-h-[80px]"
                                                    disabled={!isUnlocked}
                                                  />
                                                  <p className="text-xs text-muted-foreground">
                                                    {newCommentText.length}/500 حرف
                                                  </p>
                                                </div>
                                                <div className="space-y-2">
                                                  <Label>اسم المشرف</Label>
                                                  <Input
                                                    placeholder="اسم المشرف..."
                                                    value={newCommentAuthor}
                                                    onChange={(e) => setNewCommentAuthor(e.target.value)}
                                                    maxLength={50}
                                                    disabled={!isUnlocked}
                                                  />
                                                </div>
                                                <Button
                                                  onClick={() => handleAddComment(selectedStudent.id)}
                                                  className="w-full"
                                                  disabled={!newCommentText.trim() || !newCommentAuthor.trim() || !isUnlocked}
                                                >
                                                  <Plus className="w-4 h-4 ml-2" />
                                                  إضافة تعليق
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </DialogContent>
                                    </Dialog>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => handleDeleteStudent(student.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              )}
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
