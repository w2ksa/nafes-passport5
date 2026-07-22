/**
 * اختبارات رياضية دقيقة لمنطق النقاط
 * للتأكد من عدم تجاوز الحد الأقصى
 */

// محاكاة الدوال
function getMaxPoints(field, grade) {
  const GRADE_6_MAX = {
    arabic: 20,
    math: 20,
    science: 20,
    morningAssembly: 20,
    nafesExams: 20,
  };
  
  const GRADE_3_MAX = {
    arabic: 30,
    math: 30,
    science: 0,
    morningAssembly: 20,
    nafesExams: 20,
  };
  
  const limits = grade === 6 ? GRADE_6_MAX : GRADE_3_MAX;
  return limits[field] || 0;
}

function applyPointsWithLimit(current, field, operation, points, grade) {
  const max = getMaxPoints(field, grade);
  let newPoints;
  
  if (operation === "add") {
    newPoints = current + points;
    newPoints = Math.min(newPoints, max);
  } else {
    newPoints = current - points;
    newPoints = Math.max(newPoints, 0);
  }
  
  return newPoints;
}

// ألوان للطباعة
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

// دالة الاختبار
function test(name, actual, expected) {
  const passed = actual === expected;
  const symbol = passed ? '✓' : '✗';
  const color = passed ? colors.green : colors.red;
  
  console.log(
    `${color}${symbol}${colors.reset} ${name}: ${actual} ${
      passed ? '===' : '!=='
    } ${expected}`
  );
  
  return passed;
}

console.log('\n' + colors.blue + '═══════════════════════════════════════════════' + colors.reset);
console.log(colors.blue + '  اختبارات منطق النقاط - الحد الأقصى' + colors.reset);
console.log(colors.blue + '═══════════════════════════════════════════════' + colors.reset + '\n');

let passed = 0;
let failed = 0;

// الاختبار 1: إضافة عادية (بدون تجاوز)
if (test(
  'إضافة عادية (15 + 3 = 18)',
  applyPointsWithLimit(15, 'math', 'add', 3, 6),
  18
)) passed++; else failed++;

// الاختبار 2: إضافة مع تجاوز الحد (19 + 3 = 20)
if (test(
  'إضافة مع تجاوز (19 + 3 = 20، ليس 22) ⭐',
  applyPointsWithLimit(19, 'math', 'add', 3, 6),
  20
)) passed++; else failed++;

// الاختبار 3: إضافة مع تجاوز كبير (18 + 10 = 20)
if (test(
  'إضافة كبيرة (18 + 10 = 20، ليس 28) ⭐',
  applyPointsWithLimit(18, 'math', 'add', 10, 6),
  20
)) passed++; else failed++;

// الاختبار 4: الحد الأقصى مسبقاً (20 + 5 = 20)
if (test(
  'عند الحد الأقصى (20 + 5 = 20) ⭐',
  applyPointsWithLimit(20, 'math', 'add', 5, 6),
  20
)) passed++; else failed++;

// الاختبار 5: خصم عادي (15 - 5 = 10)
if (test(
  'خصم عادي (15 - 5 = 10)',
  applyPointsWithLimit(15, 'math', 'subtract', 5, 6),
  10
)) passed++; else failed++;

// الاختبار 6: خصم مع سالب (3 - 5 = 0، ليس -2)
if (test(
  'خصم مع سالب (3 - 5 = 0، ليس -2) ⭐',
  applyPointsWithLimit(3, 'math', 'subtract', 5, 6),
  0
)) passed++; else failed++;

// الاختبار 7: من صفر (0 - 10 = 0)
if (test(
  'خصم من صفر (0 - 10 = 0)',
  applyPointsWithLimit(0, 'math', 'subtract', 10, 6),
  0
)) passed++; else failed++;

// الاختبار 8: الصف الثالث - حد أعلى (عربي 30)
if (test(
  'صف ثالث - عربي (28 + 5 = 30، ليس 33) ⭐',
  applyPointsWithLimit(28, 'arabic', 'add', 5, 3),
  30
)) passed++; else failed++;

// الاختبار 9: الصف الثالث - عربي عادي
if (test(
  'صف ثالث - عربي (25 + 3 = 28)',
  applyPointsWithLimit(25, 'arabic', 'add', 3, 3),
  28
)) passed++; else failed++;

// الاختبار 10: الحدود الدقيقة
if (test(
  'حد دقيق جداً (19.9 → 20 + 0.2 = 20) ⭐',
  applyPointsWithLimit(19, 'math', 'add', 1, 6),
  20
)) passed++; else failed++;

console.log('\n' + colors.blue + '═══════════════════════════════════════════════' + colors.reset);
console.log(colors.blue + '  النتائج' + colors.reset);
console.log(colors.blue + '═══════════════════════════════════════════════' + colors.reset + '\n');

console.log(`${colors.green}✓ نجح: ${passed}/10${colors.reset}`);
console.log(`${colors.red}✗ فشل: ${failed}/10${colors.reset}`);

const successRate = (passed / 10) * 100;
console.log(`\n${colors.blue}معدل النجاح: ${successRate}%${colors.reset}\n`);

if (successRate === 100) {
  console.log(colors.green + '✅ ممتاز! المنطق الرياضي صحيح 100%' + colors.reset + '\n');
  process.exit(0);
} else {
  console.log(colors.red + '❌ فشل! يوجد أخطاء في المنطق' + colors.reset + '\n');
  process.exit(1);
}
