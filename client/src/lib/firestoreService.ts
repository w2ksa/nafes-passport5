/*
 * خدمة قاعدة البيانات Firestore
 * إدارة عمليات CRUD للطلاب
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  type DocumentData,
  type QuerySnapshot,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import type { Student, StationPoints, Stamps, Rank } from "./data";
import { getRankByPoints, calculateTotalPoints, SAMPLE_STUDENTS } from "./data";

const STUDENTS_COLLECTION = "students";

// تحويل بيانات Firestore إلى كائن Student
function firestoreToStudent(docData: DocumentData, id: string): Student {
  const data = docData;
  return {
    id,
    name: data.name || "",
    grade: data.grade || 6,
    avatar: data.avatar,
    points: data.points || {
      arabic: 0,
      math: 0,
      science: 0,
      morningAssembly: 0,
      nafesExams: 0,
    },
    totalPoints: data.totalPoints || 0,
    rank: data.rank || {
      id: 1,
      nameAr: "مستكشف صغير",
      nameEn: "Junior Explorer",
      minPoints: 0,
      maxPoints: 10,
      icon: "🌍",
    },
    stamps: data.stamps || {
      silver: false,
      gold: false,
      diamond: false,
    },
    viewCount: data.viewCount || 0,
    comments: data.comments || [],
  };
}

// تحويل كائن Student إلى بيانات Firestore
function studentToFirestore(student: Student): DocumentData {
  return {
    name: student.name,
    grade: student.grade,
    avatar: student.avatar || null,
    points: student.points,
    totalPoints: student.totalPoints,
    rank: student.rank,
    stamps: student.stamps,
    viewCount: student.viewCount,
    comments: student.comments || [],
    updatedAt: new Date().toISOString(),
  };
}

// جلب جميع الطلاب
export async function getAllStudents(): Promise<Student[]> {
  // إذا لم يكن Firebase مهيأ، استخدم البيانات المحلية
  if (!db) {
    console.warn("⚠️ Firebase غير متاح - استخدام البيانات المحلية");
    return [...SAMPLE_STUDENTS];
  }

  try {
    const studentsRef = collection(db, STUDENTS_COLLECTION);
    const q = query(studentsRef, orderBy("totalPoints", "desc"));
    const querySnapshot: QuerySnapshot = await getDocs(q);

    const students: Student[] = [];
    querySnapshot.forEach((doc) => {
      const student = firestoreToStudent(doc.data(), doc.id);
      students.push(student);
    });

    // إذا لم يكن هناك طلاب في قاعدة البيانات، استخدم البيانات المحلية
    if (students.length === 0) {
      console.warn("⚠️ لا توجد بيانات في قاعدة البيانات - استخدام البيانات المحلية");
      return [...SAMPLE_STUDENTS];
    }

    return students;
  } catch (error) {
    console.error("❌ خطأ في جلب الطلاب:", error);
    console.warn("⚠️ استخدام البيانات المحلية كبديل");
    return [...SAMPLE_STUDENTS];
  }
}

// جلب طالب واحد
export async function getStudentById(id: string): Promise<Student | null> {
  // إذا لم يكن Firebase مهيأ، استخدم البيانات المحلية
  if (!db) {
    console.warn("⚠️ Firebase غير متاح - استخدام البيانات المحلية");
    return SAMPLE_STUDENTS.find(s => s.id === id) || null;
  }

  try {
    const studentRef = doc(db, STUDENTS_COLLECTION, id);
    const studentSnap = await getDoc(studentRef);

    if (studentSnap.exists()) {
      return firestoreToStudent(studentSnap.data(), studentSnap.id);
    }

    // إذا لم يوجد في قاعدة البيانات، ابحث في البيانات المحلية
    return SAMPLE_STUDENTS.find(s => s.id === id) || null;
  } catch (error) {
    console.error(`❌ خطأ في جلب الطالب ${id}:`, error);
    console.warn("⚠️ استخدام البيانات المحلية كبديل");
    return SAMPLE_STUDENTS.find(s => s.id === id) || null;
  }
}

// إضافة طالب جديد
export async function addStudent(student: Omit<Student, "id">): Promise<string> {
  if (!db) {
    throw new Error("Firebase غير مهيأ - لا يمكن إضافة طالب");
  }

  try {
    // حساب النقاط الإجمالية والرتبة
    const totalPoints = calculateTotalPoints(student.points, student.grade);
    const rank = getRankByPoints(totalPoints);

    const studentData: Student = {
      ...student,
      id: "", // سيتم إنشاء ID تلقائياً من Firestore
      totalPoints,
      rank,
    };

    const studentsRef = collection(db, STUDENTS_COLLECTION);
    const newStudentRef = doc(studentsRef);
    const firestoreData = studentToFirestore(studentData);

    await setDoc(newStudentRef, {
      ...firestoreData,
      createdAt: new Date().toISOString(),
    });

    return newStudentRef.id;
  } catch (error) {
    console.error("❌ خطأ في إضافة الطالب:", error);
    throw error;
  }
}

// تحديث طالب
export async function updateStudent(
  id: string,
  updates: Partial<Student>
): Promise<void> {
  if (!db) {
    throw new Error("Firebase غير مهيأ - لا يمكن تحديث الطالب");
  }

  try {
    const studentRef = doc(db, STUDENTS_COLLECTION, id);

    // إذا تم تحديث النقاط، احسب النقاط الإجمالية والرتبة
    // (فقط إذا لم تكن محسوبة مسبقاً)
    if (updates.points && (updates.totalPoints === undefined || updates.rank === undefined)) {
      const currentStudent = await getStudentById(id);
      if (currentStudent) {
        const totalPoints = calculateTotalPoints(
          updates.points!,
          currentStudent.grade
        );
        const rank = getRankByPoints(totalPoints);
        updates.totalPoints = totalPoints;
        updates.rank = rank;
      }
    }

    const firestoreData: any = {};
    if (updates.name !== undefined) firestoreData.name = updates.name;
    if (updates.grade !== undefined) firestoreData.grade = updates.grade;
    if (updates.avatar !== undefined) firestoreData.avatar = updates.avatar;
    if (updates.points !== undefined) firestoreData.points = updates.points;
    if (updates.totalPoints !== undefined)
      firestoreData.totalPoints = updates.totalPoints;
    if (updates.rank !== undefined) firestoreData.rank = updates.rank;
    if (updates.stamps !== undefined) firestoreData.stamps = updates.stamps;
    if (updates.viewCount !== undefined)
      firestoreData.viewCount = updates.viewCount;
    if (updates.comments !== undefined) firestoreData.comments = updates.comments;

    firestoreData.updatedAt = new Date().toISOString();

    await updateDoc(studentRef, firestoreData);
  } catch (error) {
    console.error(`❌ خطأ في تحديث الطالب ${id}:`, error);
    throw error;
  }
}

// حذف طالب
export async function deleteStudent(id: string): Promise<void> {
  if (!db) {
    throw new Error("Firebase غير مهيأ - لا يمكن حذف الطالب");
  }

  try {
    const studentRef = doc(db, STUDENTS_COLLECTION, id);
    await deleteDoc(studentRef);
  } catch (error) {
    console.error(`❌ خطأ في حذف الطالب ${id}:`, error);
    throw error;
  }
}

// تحديث عدد المشاهدات
export async function incrementViewCount(id: string): Promise<void> {
  if (!db) {
    return; // لا شيء إذا لم يكن Firebase مهيأ
  }

  try {
    const student = await getStudentById(id);
    if (student) {
      await updateStudent(id, {
        viewCount: student.viewCount + 1,
      });
    }
  } catch (error) {
    console.error(`❌ خطأ في تحديث عدد المشاهدات للطالب ${id}:`, error);
    // لا نرمي الخطأ هنا لأن هذا ليس عملاً حرجاً
  }
}

// التحقق من اتصال قاعدة البيانات
export async function checkDatabaseConnection(): Promise<boolean> {
  if (!db) {
    console.warn("⚠️ Firebase غير مهيأ - لا يمكن التحقق من الاتصال");
    return false;
  }

  try {
    const studentsRef = collection(db, STUDENTS_COLLECTION);
    await getDocs(studentsRef);
    return true;
  } catch (error: any) {
    console.error("❌ خطأ في الاتصال بقاعدة البيانات:", error);

    // إذا كان الخطأ متعلقاً بالإذن، قد يكون بسبب قواعد الأمان
    if (error?.code === 'permission-denied') {
      console.error("⚠️ خطأ في الصلاحيات - تحقق من قواعد Firestore في Firebase Console");
    }

    return false;
  }
}


