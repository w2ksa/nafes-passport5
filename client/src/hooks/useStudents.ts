/*
 * Hook لجلب بيانات الطلاب من قاعدة البيانات
 */

import { useState, useEffect } from "react";
import { getAllStudents, getStudentById, incrementViewCount } from "@/lib/firestoreService";
import type { Student } from "@/lib/data";

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedStudents = await getAllStudents();
        setStudents(fetchedStudents);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("فشل في جلب بيانات الطلاب");
        setError(error);
        console.error("خطأ في جلب الطلاب:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadStudents();
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


