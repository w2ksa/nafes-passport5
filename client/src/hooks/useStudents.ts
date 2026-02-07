/*
 * Hook لجلب بيانات الطلاب من قاعدة البيانات
 * مع React Query للتخزين المؤقت وتحسين الأداء
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, limit, where } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { getAllStudents, getStudentById, incrementViewCount } from "@/lib/firestoreService";
import type { Student } from "@/lib/data";
import { SAMPLE_STUDENTS } from "@/lib/data";

// مفاتيح الـ Query Keys
export const studentsQueryKeys = {
  all: ['students'] as const,
  lists: () => [...studentsQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...studentsQueryKeys.lists(), filters] as const,
  details: () => [...studentsQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentsQueryKeys.details(), id] as const,
  top: (grade: number, count: number) => [...studentsQueryKeys.all, 'top', grade, count] as const,
};

/**
 * Hook لجلب جميع الطلاب (للصفحات العامة)
 * يستخدم React Query للتخزين المؤقت
 * one-time fetch بدلاً من realtime listeners
 */
export function useStudents() {
  const { data: students = [], isLoading, error, refetch } = useQuery({
    queryKey: studentsQueryKeys.lists(),
    queryFn: async () => {
      const fetchedStudents = await getAllStudents();
      return fetchedStudents;
    },
    // Cache لمدة 5 دقائق
    gcTime: 1000 * 60 * 5,
    // اعتبار البيانات قديمة بعد دقيقة
    staleTime: 1000 * 60 * 1,
  });

  return {
    students,
    isLoading,
    error,
    refetch, // للتحديث اليدوي إذا لزم الأمر
    setStudents: () => { } // للتوافق مع الكود القديم
  };
}

/**
 * Hook لجلب الطلاب مع Realtime Updates (للوحة التحكم فقط)
 * يستخدم onSnapshot للتحديثات الفورية
 */
export function useStudentsRealtime() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!db) {
      console.warn("⚠️ Firebase غير متاح - استخدام البيانات المحلية");
      setStudents(SAMPLE_STUDENTS);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const studentsRef = collection(db, "students");
    const q = query(studentsRef, orderBy("totalPoints", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedStudents: Student[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedStudents.push({
            id: doc.id,
            name: data.name || "",
            grade: data.grade || 6,
            avatar: data.avatar,
            points: data.points || { arabic: 0, math: 0, science: 0, morningAssembly: 0, nafesExams: 0 },
            totalPoints: data.totalPoints || 0,
            rank: data.rank || { id: 1, nameAr: "مستكشف صغير", nameEn: "Junior Explorer", minPoints: 0, maxPoints: 10, icon: "🌍" },
            stamps: data.stamps || { silver: false, gold: false, diamond: false },
            viewCount: data.viewCount || 0,
            comments: data.comments || [],
          } as Student);
        });

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
        setStudents(SAMPLE_STUDENTS);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { students, isLoading, error, setStudents };
}

/**
 * Hook لجلب Top N طلاب لصف معين
 * مثالي لصفحة Leaderboard
 */
export function useTopStudents(grade: 3 | 6, topCount: number = 3) {
  return useQuery({
    queryKey: studentsQueryKeys.top(grade, topCount),
    queryFn: async () => {
      if (!db) {
        const gradeStudents = SAMPLE_STUDENTS
          .filter(s => s.grade === grade)
          .sort((a, b) => b.totalPoints - a.totalPoints)
          .slice(0, topCount);
        return gradeStudents;
      }

      const studentsRef = collection(db, "students");
      const q = query(
        studentsRef,
        where("grade", "==", grade),
        orderBy("totalPoints", "desc"),
        limit(topCount)
      );

      const snapshot = await import("firebase/firestore").then(m => m.getDocs(q));
      const students: Student[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        students.push({
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

      return students;
    },
    gcTime: 1000 * 60 * 5,
    staleTime: 1000 * 60 * 2, // 2 دقائق للـ leaderboard
  });
}

/**
 * Hook لجلب بيانات طالب واحد
 */
export function useStudent(id: string | undefined) {
  const queryClient = useQueryClient();

  const { data: student, isLoading, error } = useQuery({
    queryKey: studentsQueryKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null;

      const fetchedStudent = await getStudentById(id);

      // زيادة عدد المشاهدات في الخلفية
      if (fetchedStudent) {
        incrementViewCount(id).catch(err => {
          console.warn("فشل في تحديث viewCount:", err);
        });
      }

      return fetchedStudent;
    },
    enabled: !!id,
    gcTime: 1000 * 60 * 5,
    staleTime: 1000 * 60 * 1,
  });

  return { student: student || null, isLoading, error };
}
