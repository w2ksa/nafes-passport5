# 🔥 إعداد Firebase - دليل سريع

## المشكلة: "خطأ في الاتصال بقاعدة البيانات"

إذا رأيت هذه الرسالة، اتبع الخطوات التالية:

## ✅ الحل السريع

### 1. افتح Firebase Console
https://console.firebase.google.com/project/nafes-passport

### 2. فعّل Firestore Database
1. اذهب إلى **Firestore Database** من القائمة الجانبية
2. إذا لم يكن مفعلاً، انقر على **Create database**
3. اختر **Start in test mode**
4. اختر موقع قاعدة البيانات (مثلاً: `us-central1`)
5. انقر **Enable**

### 3. احصل على معلومات Firebase
1. اذهب إلى **Project Settings** (⚙️) في أعلى الصفحة
2. انتقل إلى تبويب **General**
3. في قسم **Your apps**، انقر على أيقونة الويب `</>`
4. إذا لم يكن لديك تطبيق ويب:
   - انقر **Add app** → اختر **Web**
   - أدخل اسم التطبيق (مثلاً: `nafes-passport-web`)
   - انقر **Register app**
5. انسخ معلومات الإعداد (config)

### 4. أنشئ ملف `.env`
في المجلد الرئيسي للمشروع (`/Users/saudalzayed/Desktop/nafes-passport4`):

```bash
# أنشئ الملف
touch .env
```

أضف المحتوى التالي (استبدل بالقيم من Firebase):

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=nafes-passport.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=nafes-passport
VITE_FIREBASE_STORAGE_BUCKET=nafes-passport.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 5. أعد بناء المشروع
```bash
pnpm build
firebase deploy --only hosting
```

## 📝 ملاحظات مهمة

### قواعد الأمان
تأكد من أن قواعد Firestore تسمح بالقراءة:
- افتح: https://console.firebase.google.com/project/nafes-passport/firestore/rules
- يجب أن تكون القواعد مشابهة لهذا:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /students/{studentId} {
      allow read: if true;
      allow write: if request.time < timestamp.date(2026, 12, 31);
    }
  }
}
```

### التحقق من الاتصال
بعد إضافة ملف `.env` وإعادة النشر:
1. افتح الموقع: https://nafes-passport.web.app
2. يجب أن ترى رسالة "✅ متصل بقاعدة البيانات"

## 🆘 إذا استمرت المشكلة

1. **تحقق من ملف `.env`**:
   - تأكد من وجوده في المجلد الرئيسي
   - تأكد من أن جميع المتغيرات موجودة
   - تأكد من عدم وجود مسافات إضافية

2. **تحقق من Firestore**:
   - تأكد من تفعيل Firestore Database
   - تحقق من قواعد الأمان

3. **تحقق من Console**:
   - افتح Developer Tools (F12)
   - ابحث عن أخطاء في Console

## 📞 المساعدة

إذا استمرت المشكلة، راجع:
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - دليل تفصيلي
- [README_FIREBASE.md](./README_FIREBASE.md) - ملخص الإعداد

