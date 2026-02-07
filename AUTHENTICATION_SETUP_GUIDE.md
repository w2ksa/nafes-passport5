# دليل إضافة نظام تسجيل الدخول 🔐

دليل خطوة بخطوة لإضافة Authentication للمعلمين

---

## 🎯 الهدف

إضافة نظام تسجيل دخول بسيط حتى:
- ✅ فقط المعلمين المصرح لهم يقدرون يضيفون/يعدلون الطلاب
- ✅ الطلاب يقدرون يشوفون نقاطهم بدون تسجيل دخول
- ✅ أمان أعلى للنظام

---

## 📋 المراحل

### المرحلة 1: تفعيل Authentication في Firebase
### المرحلة 2: تحديث قواعد الأمان
### المرحلة 3: إضافة صفحة تسجيل الدخول
### المرحلة 4: إنشاء حسابات المعلمين
### المرحلة 5: الاختبار

---

## 🚀 المرحلة 1: تفعيل Authentication في Firebase

### الخطوة 1: افتح Firebase Console

اذهب إلى:
```
https://console.firebase.google.com/project/nafes-passport5
```

### الخطوة 2: فعّل Authentication

1. من القائمة اليسرى، اضغط على **Authentication**
2. اضغط على **Get Started** (أو **البدء**)
3. اختر طريقة تسجيل الدخول: **Email/Password**
4. فعّل المفتاح (Toggle) الأزرق
5. اضغط **Save** (حفظ)

**تم! ✅** Authentication مفعّل

---

## 🔒 المرحلة 2: تحديث قواعد الأمان

### الخطوة 1: افتح ملف firestore.rules

في مجلد المشروع، افتح ملف:
```
firestore.rules
```

### الخطوة 2: غيّر القواعد

**القواعد القديمة:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /students/{studentId} {
      allow read: if true;
      allow write: if request.time < timestamp.date(2026, 12, 31);
    }
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**القواعد الجديدة (مع تسجيل الدخول):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // قاعدة بيانات الطلاب
    match /students/{studentId} {
      // القراءة للجميع (الطلاب يشوفون نقاطهم)
      allow read: if true;
      
      // الكتابة فقط للمعلمين المسجلين
      allow write: if request.auth != null;
    }
    
    // منع الوصول لأي شيء آخر
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### الخطوة 3: انشر التحديث

افتح Terminal وشغّل:
```bash
cd /path/to/nafes-passport5
firebase deploy --only firestore:rules
```

**تم! ✅** القواعد محدّثة

---

## 💻 المرحلة 3: إضافة صفحة تسجيل الدخول

### الخطوة 1: إنشاء صفحة Login

سأنشئ لك الملفات اللازمة:

**ملف 1:** `client/src/pages/Login.tsx`

```typescript
import { useState } from "react";
import { useLocation } from "wouter";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, LogIn, GraduationCap } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("تم تسجيل الدخول بنجاح!");
      setLocation("/admin");
    } catch (error: any) {
      console.error("خطأ في تسجيل الدخول:", error);
      
      let errorMessage = "فشل تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.";
      
      if (error.code === "auth/user-not-found") {
        errorMessage = "البريد الإلكتروني غير موجود";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "كلمة المرور غير صحيحة";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "البريد الإلكتروني غير صحيح";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "محاولات كثيرة. حاول مرة أخرى لاحقاً";
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">تسجيل دخول المعلمين</CardTitle>
          <CardDescription>جواز نافس - ابتدائية أبها الأهلية</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="teacher@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                dir="ltr"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                dir="ltr"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                <>
                  <LogIn className="ml-2 h-4 w-4" />
                  تسجيل الدخول
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="text-sm"
            >
              العودة للصفحة الرئيسية
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### الخطوة 2: تحديث AdminDashboard

في ملف `client/src/pages/AdminDashboard.tsx`، أضف في البداية:

```typescript
import { useEffect } from "react";
import { useLocation } from "wouter";
import { auth } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

// داخل الكومبوننت، أضف:
const [, setLocation] = useLocation();
const [isAuthenticated, setIsAuthenticated] = useState(false);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      setIsAuthenticated(true);
    } else {
      setLocation("/login");
    }
  });

  return () => unsubscribe();
}, [setLocation]);

if (!isAuthenticated) {
  return null; // أو صفحة تحميل
}
```

### الخطوة 3: إضافة Route للـ Login

في ملف `client/src/App.tsx`، أضف:

```typescript
import Login from "@/pages/Login";

// في الـ Routes:
<Route path="/login" component={Login} />
```

---

## 👥 المرحلة 4: إنشاء حسابات المعلمين

### الطريقة 1: من Firebase Console (الأسهل)

1. اذهب إلى Firebase Console
2. اختر **Authentication**
3. اضغط **Add User** (إضافة مستخدم)
4. أدخل:
   - البريد الإلكتروني: `teacher1@school.edu`
   - كلمة المرور: `School@2026`
5. اضغط **Add User**

كرر للمعلمين الآخرين.

---

### الطريقة 2: سكريبت تلقائي

سأنشئ لك سكريبت لإضافة معلمين بشكل جماعي:

**ملف:** `scripts/addTeachers.mjs`

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDr-5HPGkhnR1wt5h15EFu0p41fEluL4lM",
  authDomain: "nafes-passport5.firebaseapp.com",
  projectId: "nafes-passport5",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// قائمة المعلمين
const teachers = [
  { email: "teacher1@school.edu", password: "School@2026", name: "المعلم الأول" },
  { email: "teacher2@school.edu", password: "School@2026", name: "المعلم الثاني" },
  { email: "admin@school.edu", password: "Admin@2026", name: "المدير" },
];

async function addTeachers() {
  console.log('🚀 بدء إضافة المعلمين...\n');
  
  for (const teacher of teachers) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        teacher.email,
        teacher.password
      );
      console.log(`✅ تم إضافة: ${teacher.name} (${teacher.email})`);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️  موجود مسبقاً: ${teacher.name} (${teacher.email})`);
      } else {
        console.error(`❌ خطأ في إضافة ${teacher.name}:`, error.message);
      }
    }
  }
  
  console.log('\n✅ اكتمل إضافة المعلمين!');
  process.exit(0);
}

addTeachers();
```

**لتشغيل السكريبت:**
```bash
node scripts/addTeachers.mjs
```

---

## 🧪 المرحلة 5: الاختبار

### اختبار 1: تسجيل الدخول

1. افتح الموقع: https://nafes-passport5.web.app/login
2. أدخل:
   - البريد: `teacher1@school.edu`
   - كلمة المرور: `School@2026`
3. اضغط تسجيل الدخول

**النتيجة المتوقعة:** ✅ تنتقل للوحة التحكم

---

### اختبار 2: الحماية

1. افتح نافذة تصفح خفي (Incognito)
2. حاول الدخول لـ `/admin` مباشرة
3. **النتيجة المتوقعة:** ✅ يحولك لصفحة تسجيل الدخول

---

### اختبار 3: الكتابة بدون تسجيل

1. بدون تسجيل دخول، حاول تعديل طالب
2. **النتيجة المتوقعة:** ❌ خطأ "Permission Denied"

---

## 📊 ملخص التغييرات

| الملف | التغيير |
|------|---------|
| `firestore.rules` | تحديث القواعد للمصادقة |
| `pages/Login.tsx` | صفحة تسجيل دخول جديدة |
| `pages/AdminDashboard.tsx` | إضافة حماية بالمصادقة |
| `App.tsx` | إضافة Route لـ /login |
| `scripts/addTeachers.mjs` | سكريبت لإضافة المعلمين |

---

## 🎓 بيانات تسجيل الدخول الافتراضية

بعد إضافة المعلمين، استخدم:

| البريد الإلكتروني | كلمة المرور | الدور |
|-------------------|-------------|-------|
| teacher1@school.edu | School@2026 | معلم |
| teacher2@school.edu | School@2026 | معلم |
| admin@school.edu | Admin@2026 | مدير |

**⚠️ مهم:** غيّر كلمات المرور بعد أول تسجيل دخول!

---

## ✅ الخلاصة

بعد تطبيق هذه الخطوات:

- ✅ فقط المعلمين المسجلين يقدرون يعدلون البيانات
- ✅ الطلاب يقدرون يشوفون نقاطهم بدون تسجيل دخول
- ✅ أمان أعلى للنظام
- ✅ ما تحتاج تحديث القواعد كل سنة

---

**الوقت المتوقع:** 1-2 ساعة  
**الصعوبة:** ⭐⭐⭐ (متوسط)  
**الفائدة:** ⭐⭐⭐⭐⭐ (أمان عالي)
