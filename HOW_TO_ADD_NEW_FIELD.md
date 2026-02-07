# دليل إضافة خانة/حقل جديد 📝

دليل خطوة بخطوة لإضافة خانة جديدة في نظام جواز نافس

---

## 🎯 مثال: إضافة خانة "اللغة الإنجليزية"

سنضيف خانة جديدة للغة الإنجليزية لطلاب الصف السادس.

---

## 📋 الخطوات

### الخطوة 1: تحديث Interface (البنية)

**الملف:** `client/src/lib/data.ts`

**ابحث عن:**
```typescript
export interface StationPoints {
  arabic: number;
  math: number;
  science?: number;
  morningAssembly: number;
  nafesExams: number;
}
```

**غيّر إلى:**
```typescript
export interface StationPoints {
  arabic: number;
  math: number;
  science?: number;
  morningAssembly: number;
  nafesExams: number;
  english?: number;  // ✨ الخانة الجديدة (اختيارية للصف السادس)
}
```

**الوقت:** 30 ثانية

---

### الخطوة 2: القيم الافتراضية عند إضافة طالب

**الملف:** `client/src/pages/AdminDashboard.tsx`

**ابحث عن دالة `handleAddStudent`، السطر ~165:**

```typescript
const points: StationPoints = grade === 6
  ? { arabic: 0, math: 0, science: 0, morningAssembly: 0, nafesExams: 0 }
  : { arabic: 0, math: 0, morningAssembly: 0, nafesExams: 0 };
```

**غيّر إلى:**
```typescript
const points: StationPoints = grade === 6
  ? { 
      arabic: 0, 
      math: 0, 
      science: 0, 
      morningAssembly: 0, 
      nafesExams: 0,
      english: 0  // ✨ الخانة الجديدة
    }
  : { 
      arabic: 0, 
      math: 0, 
      morningAssembly: 0, 
      nafesExams: 0,
      english: 0  // ✨ للصف الثالث أيضاً (اختياري)
    };
```

**الوقت:** 1 دقيقة

---

### الخطوة 3: إضافة Input في نموذج التعديل

**الملف:** `client/src/pages/AdminDashboard.tsx`

**ابحث عن قسم تعديل النقاط في Dialog، أضف بعد "nafesExams":**

```typescript
{/* اللغة الإنجليزية - جديد */}
<div className="space-y-2">
  <Label>اللغة الإنجليزية</Label>
  <Input
    type="number"
    min="0"
    value={editingPoints?.english || 0}
    onChange={(e) => setEditingPoints({
      ...editingPoints!,
      english: parseInt(e.target.value) || 0
    })}
  />
</div>
```

**الوقت:** 2 دقيقة

---

### الخطوة 4: عرض الخانة في بطاقة الطالب

**الملف:** `client/src/components/StudentCard.tsx`

أضف في عرض النقاط:

```typescript
{/* اللغة الإنجليزية */}
{student.points.english !== undefined && (
  <div className="flex justify-between items-center py-2 border-b">
    <span className="text-sm text-gray-600">اللغة الإنجليزية</span>
    <span className="font-semibold text-blue-600">
      {student.points.english || 0}
    </span>
  </div>
)}
```

**الوقت:** 2 دقيقة

---

### الخطوة 5: إضافة في BulkPointsDialog

**الملف:** `client/src/components/BulkPointsDialog.tsx`

**ابحث عن Select للمواد (~70):**

```typescript
<SelectContent>
  <SelectItem value="arabic">اللغة العربية</SelectItem>
  <SelectItem value="math">الرياضيات</SelectItem>
  <SelectItem value="science">العلوم</SelectItem>
  <SelectItem value="morningAssembly">الطابور الصباحي</SelectItem>
  <SelectItem value="nafesExams">اختبارات نافس</SelectItem>
  <SelectItem value="english">اللغة الإنجليزية</SelectItem> {/* ✨ جديد */}
</SelectContent>
```

**وفي دالة `getFieldName` (~120):**

```typescript
const getFieldName = (field: string) => {
  switch (field) {
    case "arabic": return "اللغة العربية";
    case "math": return "الرياضيات";
    case "science": return "العلوم";
    case "morningAssembly": return "الطابور الصباحي";
    case "nafesExams": return "اختبارات نافس";
    case "english": return "اللغة الإنجليزية";  // ✨ جديد
    default: return field;
  }
};
```

**الوقت:** 2 دقيقة

---

### الخطوة 6: تحديث دالة calculateTotalPoints

**الملف:** `client/src/lib/data.ts`

**ابحث عن دالة `calculateTotalPoints`:**

```typescript
export function calculateTotalPoints(points: StationPoints, grade: 3 | 6): number {
  let total = 0;
  
  total += points.arabic || 0;
  total += points.math || 0;
  total += points.morningAssembly || 0;
  total += points.nafesExams || 0;
  total += points.english || 0;  // ✨ أضف الخانة الجديدة
  
  if (grade === 6 && points.science) {
    total += points.science;
  }
  
  return total;
}
```

**الوقت:** 1 دقيقة

---

### الخطوة 7: الاختبار

```bash
# 1. شغّل المشروع
pnpm dev

# 2. افتح لوحة التحكم
# 3. أضف طالب جديد
# 4. تأكد من ظهور خانة "اللغة الإنجليزية"
# 5. جرّب تعديل النقاط
# 6. تأكد من حفظ البيانات
```

**الوقت:** 5 دقائق

---

## ⚠️ هل تحتاج تعديل Firebase Rules؟

### ❌ لا تحتاج إذا:

- ✅ الخانة الجديدة في مجموعة `students` (موجودة)
- ✅ الصلاحيات نفسها (قراءة وكتابة عادية)

**السبب:** القواعد الحالية تسمح بالقراءة/الكتابة لجميع حقول `students`

---

### ✅ تحتاج تعديل إذا:

- إضافة **مجموعة جديدة** (Collection)
  - مثال: `teachers`, `activities`, `grades`
  
- تغيير **الصلاحيات** للحقل الجديد
  - مثال: فقط المدير يقدر يعدل الخانة الجديدة

---

## 📊 مثال: إضافة مجموعة جديدة

إذا تبي تضيف مجموعة `activities` (أنشطة):

### في Firebase Rules:

```javascript
// في firestore.rules، أضف:
match /activities/{activityId} {
  allow read: if true;
  allow write: if request.time < timestamp.date(2030, 12, 31);
}
```

### في الكود:

```typescript
// ملف جديد: activities.ts
export interface Activity {
  id: string;
  name: string;
  date: string;
  points: number;
}

// دوال جديدة في firestoreService.ts
export async function getAllActivities() {
  const activitiesRef = collection(db, "activities");
  // ...
}
```

---

## 🎓 ملخص:

```
╔════════════════════════════════════════════════════╗
║                                                    ║
║   لإضافة خانة جديدة (في students):               ║
║   ✅ عدّل الكود (data.ts)                         ║
║   ✅ عدّل الواجهة (UI components)                 ║
║   ❌ لا تعدل Firebase Rules                       ║
║                                                    ║
║   لإضافة مجموعة جديدة (Collection):               ║
║   ✅ عدّل الكود                                    ║
║   ✅ عدّل الواجهة                                  ║
║   ✅ أضف قواعد في Firebase Rules                  ║
║                                                    ║
╚════════════════════════════════════════════════════╝
```

---

## 💡 نصيحة:

**Firebase Rules:**
- فقط للأمان والصلاحيات
- نادراً ما تحتاج تعديلها
- آخر مرة عدلناها: اليوم (2026 → 2030)

**إضافة خانات:**
- تعديلات في الكود فقط
- سهلة وسريعة
- لا تحتاج Firebase Rules

---

**فهمت؟** إذا تبي تضيف خانة معينة الحين، قلّي وأضيفها لك! 🚀