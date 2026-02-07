/*
 * حدود النقاط والخوارزميات الرياضية
 * لضمان عدم تجاوز الحد الأقصى لأي مادة
 */

import type { StationPoints } from "./data";

// الحدود القصوى للصف السادس
export const GRADE_6_MAX_POINTS = {
  arabic: 20,
  math: 20,
  science: 20,
  morningAssembly: 20,
  nafesExams: 20,
} as const;

// الحدود القصوى للصف الثالث
export const GRADE_3_MAX_POINTS = {
  arabic: 30,
  math: 30,
  science: 0, // لا يوجد علوم في الصف الثالث
  morningAssembly: 20,
  nafesExams: 20,
} as const;

/**
 * الحصول على الحد الأقصى لمادة معينة حسب الصف
 */
export function getMaxPoints(
  field: keyof StationPoints,
  grade: 3 | 6
): number {
  const limits = grade === 6 ? GRADE_6_MAX_POINTS : GRADE_3_MAX_POINTS;
  return limits[field] || 0;
}

/**
 * تطبيق النقاط مع احترام الحد الأقصى
 * 
 * @param currentPoints - النقاط الحالية
 * @param field - المادة
 * @param operation - العملية (add/subtract)
 * @param points - عدد النقاط المراد إضافتها/خصمها
 * @param grade - الصف
 * @returns النقاط الجديدة (مع احترام الحد الأقصى)
 * 
 * @example
 * // الصف السادس، رياضيات (max: 20)
 * // الطالب عنده 19 نقطة، نضيف 3
 * applyPointsWithLimit(19, 'math', 'add', 3, 6)
 * // النتيجة: 20 (وليس 22)
 * 
 * @example
 * // الصف الثالث، عربي (max: 30)
 * // الطالب عنده 28 نقطة، نضيف 5
 * applyPointsWithLimit(28, 'arabic', 'add', 5, 3)
 * // النتيجة: 30 (وليس 33)
 */
export function applyPointsWithLimit(
  currentPoints: number,
  field: keyof StationPoints,
  operation: "add" | "subtract",
  points: number,
  grade: 3 | 6
): number {
  const maxPoints = getMaxPoints(field, grade);
  
  let newPoints: number;
  
  if (operation === "add") {
    // إضافة النقاط
    newPoints = currentPoints + points;
    // احترام الحد الأقصى
    newPoints = Math.min(newPoints, maxPoints);
  } else {
    // خصم النقاط
    newPoints = currentPoints - points;
    // لا نسمح بالسالب
    newPoints = Math.max(newPoints, 0);
  }
  
  return newPoints;
}

/**
 * حساب النقاط المضافة فعلياً (مع احترام الحدود)
 * 
 * @returns { actualPoints, wasCapped, maxReached }
 * - actualPoints: النقاط التي ستُضاف فعلياً
 * - wasCapped: هل تم تقليص النقاط بسبب الحد الأقصى
 * - maxReached: الحد الأقصى الذي تم الوصول إليه
 */
export function calculateActualPoints(
  currentPoints: number,
  field: keyof StationPoints,
  operation: "add" | "subtract",
  requestedPoints: number,
  grade: 3 | 6
): {
  actualPoints: number;
  wasCapped: boolean;
  maxReached: number;
  difference: number;
} {
  const maxPoints = getMaxPoints(field, grade);
  const newPoints = applyPointsWithLimit(currentPoints, field, operation, requestedPoints, grade);
  
  const actualAdded = newPoints - currentPoints;
  const wasCapped = operation === "add" && actualAdded < requestedPoints;
  
  return {
    actualPoints: newPoints,
    wasCapped,
    maxReached: maxPoints,
    difference: actualAdded,
  };
}

/**
 * التحقق من صحة النقاط
 */
export function validatePoints(
  points: StationPoints,
  grade: 3 | 6
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const limits = grade === 6 ? GRADE_6_MAX_POINTS : GRADE_3_MAX_POINTS;
  
  Object.entries(points).forEach(([field, value]) => {
    const key = field as keyof StationPoints;
    const max = limits[key];
    
    if (value > max) {
      errors.push(`${field}: ${value} يتجاوز الحد الأقصى ${max}`);
    }
    
    if (value < 0) {
      errors.push(`${field}: ${value} لا يمكن أن يكون سالباً`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
