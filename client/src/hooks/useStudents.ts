/*
 * Hook لجلب بيانات الطلاب من قاعدة البيانات
 * مع Realtime Updates (التحديث التلقائي الفوري)
 */

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, type DocumentData, type QuerySnapshot } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { getAllStudents, getStudentById, incrementViewCount } from "@/lib/firestoreService";
import type { Student } from "@/lib/data";
import { SAMPLE_STUDENTS } from "@/lib/data";

// تحويل بيانات Firestore إلى كائن Student
function firestoreToStudent(docData: DocumentData, id: string): Student {
  const data = docData;
  return {
    id,
    name: data.name || "",
    grade: data.grade || 6,
    avatar: data.avatar,
    points: data.points || { arabic: 0, math: 0, science: 0, morningAssembly: 0, nafesExams: 0 },
    totalPoints: data.totalPoints || 0,
    rank: data.rank || { id: 1, nameAr: "مستكشف صغير", nameEn: "Junior Explorer", minPoints: 0, maxPoints: 10, icon: "🌍" },
    stamps: data.stamps || { silver: false, gold: false, diamond: false },
    viewCount: data.viewCount || 0,
    comments: data.comments || [],
  };
}

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // إذا لم يكن Firebase مهيأ، استخدم البيانات المحلية
    if (!db) {
      console.warn("⚠️ Firebase غير متاح - استخدام البيانات المحلية");
      setStudents(SAMPLE_STUDENTS);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // استخدام onSnapshot للاستماع للتحديثات في الوقت الفعلي
    const studentsRef = collection(db, "students");
    const q = query(studentsRef, orderBy("totalPoints", "desc"));
    
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot: QuerySnapshot) => {
        const fetchedStudents: Student[] = [];
        querySnapshot.forEach((doc) => {
          const student = firestoreToStudent(doc.data(), doc.id);
          fetchedStudents.push(student);
        });
        
        // إذا لم يكن هناك بيانات، استخدم البيانات المحلية
        if (fetchedStudents.length === 0) {
          console.warn("⚠️ لا توجد بيانات - استخدام البيانات المحلية");
          setStudents(SAMPLE_STUDENTS);
        } else {
          setStudents(fetchedStudents);
        }
        
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error("خطأ في الاستماع للتحديثات:", err);
        const error = err instanceof Error ? err : new Error("فشل في الاتصال بقاعدة البيانات");
        setError(error);
        // Fallback إلى البيانات المحلية
        setStudents(SAMPLE_STUDENTS);
        setIsLoading(false);
      }
    );

    // تنظيف عند إلغاء تحميل المكون
    return () => unsubscribe();
  }, []);

  return { students, isLoading, error, setStudents };
}

export function useStudent(id: string | undefined) {
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    const loadStudent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedStudent = await getStudentById(id);
        if (fetchedStudent) {
          setStudent(fetchedStudent);
          // زيادة عدد المشاهدات
          await incrementViewCount(id);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("فشل في جلب بيانات الطالب");
        setError(error);
        console.error("خطأ في جلب الطالب:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadStudent();
  }, [id]);

  return { student, isLoading, error };
}


