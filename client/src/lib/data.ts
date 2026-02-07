/*
 * بيانات وأنواع نظام جواز نافس
 * تصميم المرصد الفضائي - ابتدائية أبها الأهلية
 */

// أنواع البيانات
export interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface Student {
  id: string;
  name: string;
  grade: 3 | 6;
  avatar?: string;
  points: StationPoints;
  totalPoints: number;
  rank: Rank;
  stamps: Stamps;
  viewCount: number;
  comments?: Comment[]; // تعليقات متعددة
}

export interface StationPoints {
  arabic: number;
  math: number;
  science?: number; // فقط للصف السادس
  morningAssembly: number;
  nafesExams: number;
}

export interface Stamps {
  silver: boolean;
  gold: boolean;
  diamond: boolean;
}

export interface Rank {
  id: number;
  nameAr: string;
  nameEn: string;
  minPoints: number;
  maxPoints: number;
  icon: string;
}

// محطات الصف السادس (100 نقطة)
export const GRADE_6_STATIONS = [
  { id: 'arabic', nameAr: 'اللغة العربية', maxPoints: 20, icon: '📚' },
  { id: 'math', nameAr: 'الرياضيات', maxPoints: 20, icon: '🔢' },
  { id: 'science', nameAr: 'العلوم', maxPoints: 20, icon: '🔬' },
  { id: 'morningAssembly', nameAr: 'الإذاعة والعرض', maxPoints: 20, icon: '🎤' },
  { id: 'nafesExams', nameAr: 'اختبارات نافس', maxPoints: 20, icon: '📝' },
];

// محطات الصف الثالث (100 نقطة)
export const GRADE_3_STATIONS = [
  { id: 'arabic', nameAr: 'اللغة العربية', maxPoints: 30, icon: '📚' },
  { id: 'math', nameAr: 'الرياضيات', maxPoints: 30, icon: '🔢' },
  { id: 'morningAssembly', nameAr: 'الإذاعة الصباحية', maxPoints: 20, icon: '🎤' },
  { id: 'nafesExams', nameAr: 'اختبارات نافس', maxPoints: 20, icon: '📝' },
];

// نظام الرتب (رحلة الفضاء)
export const RANKS: Rank[] = [
  { id: 1, nameAr: 'مستكشف صغير', nameEn: 'Junior Explorer', minPoints: 0, maxPoints: 10, icon: '🌍' },
  { id: 2, nameAr: 'باحث مبتدئ', nameEn: 'Beginner Researcher', minPoints: 11, maxPoints: 25, icon: '🔭' },
  { id: 3, nameAr: 'مفكر', nameEn: 'Thinker', minPoints: 26, maxPoints: 40, icon: '💭' },
  { id: 4, nameAr: 'محلل', nameEn: 'Analyst', minPoints: 41, maxPoints: 55, icon: '📊' },
  { id: 5, nameAr: 'مبتكر', nameEn: 'Innovator', minPoints: 56, maxPoints: 70, icon: '💡' },
  { id: 6, nameAr: 'قائد', nameEn: 'Leader', minPoints: 71, maxPoints: 85, icon: '🚀' },
  { id: 7, nameAr: 'عالم فضاء', nameEn: 'Space Scientist', minPoints: 86, maxPoints: 95, icon: '🛸' },
  { id: 8, nameAr: 'خبير نافس', nameEn: 'Nafes Expert', minPoints: 96, maxPoints: 100, icon: '⭐' },
];

// الحصول على الرتبة بناءً على النقاط
export function getRankByPoints(points: number): Rank {
  return RANKS.find(rank => points >= rank.minPoints && points <= rank.maxPoints) || RANKS[0];
}

// حساب إجمالي النقاط
export function calculateTotalPoints(points: StationPoints, grade: 3 | 6): number {
  if (grade === 6) {
    return points.arabic + points.math + (points.science || 0) + points.morningAssembly + points.nafesExams;
  }
  return points.arabic + points.math + points.morningAssembly + points.nafesExams;
}

// بيانات تجريبية للطلاب
export const SAMPLE_STUDENTS: Student[] = [
  // طلاب الصف السادس
  {
    id: '1',
    name: 'أحمد محمد العسيري',
    grade: 6,
    points: { arabic: 18, math: 19, science: 17, morningAssembly: 18, nafesExams: 20 },
    totalPoints: 92,
    rank: getRankByPoints(92),
    stamps: { silver: true, gold: true, diamond: false },
    viewCount: 15,
  },
  {
    id: '2',
    name: 'خالد عبدالله الشهري',
    grade: 6,
    points: { arabic: 20, math: 20, science: 20, morningAssembly: 20, nafesExams: 18 },
    totalPoints: 98,
    rank: getRankByPoints(98),
    stamps: { silver: true, gold: true, diamond: true },
    viewCount: 22,
  },
  {
    id: '3',
    name: 'فهد سعيد القحطاني',
    grade: 6,
    points: { arabic: 15, math: 17, science: 14, morningAssembly: 16, nafesExams: 15 },
    totalPoints: 77,
    rank: getRankByPoints(77),
    stamps: { silver: true, gold: false, diamond: false },
    viewCount: 8,
  },
  {
    id: '4',
    name: 'عمر ياسر الغامدي',
    grade: 6,
    points: { arabic: 12, math: 14, science: 11, morningAssembly: 13, nafesExams: 12 },
    totalPoints: 62,
    rank: getRankByPoints(62),
    stamps: { silver: false, gold: false, diamond: false },
    viewCount: 5,
  },
  {
    id: '5',
    name: 'سلطان ناصر الزهراني',
    grade: 6,
    points: { arabic: 16, math: 18, science: 15, morningAssembly: 17, nafesExams: 19 },
    totalPoints: 85,
    rank: getRankByPoints(85),
    stamps: { silver: true, gold: true, diamond: false },
    viewCount: 12,
  },
  // طلاب الصف الثالث
  {
    id: '6',
    name: 'محمد علي الأسمري',
    grade: 3,
    points: { arabic: 28, math: 27, morningAssembly: 18, nafesExams: 19 },
    totalPoints: 92,
    rank: getRankByPoints(92),
    stamps: { silver: true, gold: true, diamond: false },
    viewCount: 18,
  },
  {
    id: '7',
    name: 'يوسف أحمد المالكي',
    grade: 3,
    points: { arabic: 30, math: 30, morningAssembly: 20, nafesExams: 20 },
    totalPoints: 100,
    rank: getRankByPoints(100),
    stamps: { silver: true, gold: true, diamond: true },
    viewCount: 30,
  },
  {
    id: '8',
    name: 'عبدالرحمن سعد الدوسري',
    grade: 3,
    points: { arabic: 22, math: 24, morningAssembly: 15, nafesExams: 16 },
    totalPoints: 77,
    rank: getRankByPoints(77),
    stamps: { silver: true, gold: false, diamond: false },
    viewCount: 9,
  },
  {
    id: '9',
    name: 'تركي فيصل العتيبي',
    grade: 3,
    points: { arabic: 18, math: 20, morningAssembly: 12, nafesExams: 14 },
    totalPoints: 64,
    rank: getRankByPoints(64),
    stamps: { silver: false, gold: false, diamond: false },
    viewCount: 6,
  },
  {
    id: '10',
    name: 'راشد محمد الحربي',
    grade: 3,
    points: { arabic: 25, math: 26, morningAssembly: 17, nafesExams: 18 },
    totalPoints: 86,
    rank: getRankByPoints(86),
    stamps: { silver: true, gold: true, diamond: false },
    viewCount: 14,
  },
];

// كود التحرير السري (محمي في .env)
export const EDIT_CODE = import.meta.env.VITE_EDIT_CODE || '';

// التحقق من كود التحرير
export function verifyEditCode(code: string): boolean {
  return code === EDIT_CODE;
}
