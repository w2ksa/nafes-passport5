import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * تطبيع النص العربي للبحث التقريبي
 * يحول الأحرف المتشابهة إلى نفس الحرف
 */
export function normalizeArabic(text: string): string {
  if (!text) return "";
  
  return text
    .toLowerCase()
    // تطبيع الهمزات
    .replace(/[أإآ]/g, "ا")
    // تطبيع التاء المربوطة والهاء
    .replace(/ة/g, "ه")
    // تطبيع الألف المقصورة
    .replace(/ى/g, "ي")
    // إزالة التشكيل
    .replace(/[ًٌٍَُِّْ]/g, "");
}
