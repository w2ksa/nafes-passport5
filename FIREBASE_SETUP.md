# دليل إعداد Firebase

## الخطوات المطلوبة

### 1. إنشاء مشروع Firebase

1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. انقر على "Add project" أو "إضافة مشروع"
3. أدخل اسم المشروع (مثلاً: `nafes-passport`)
4. اتبع الخطوات لإكمال إنشاء المشروع

### 2. إعداد قاعدة بيانات Firestore

1. في Firebase Console، اذهب إلى **Firestore Database**
2. انقر على **Create database**
3. اختر **Start in test mode** (للبداية السريعة)
   - ⚠️ **مهم**: يجب تحديث قواعد الأمان خلال 30 يوم
4. اختر موقع قاعدة البيانات (مثلاً: `us-central1` أو `europe-west`)
5. انقر على **Enable**

### 3. الحصول على معلومات الإعداد

1. في Firebase Console، اذهب إلى **Project Settings** (⚙️)
2. انتقل إلى تبويب **General**
3. في قسم **Your apps**، انقر على أيقونة الويب `</>`
4. إذا لم يكن لديك تطبيق ويب، انقر على **Add app** واختر **Web**
5. انسخ معلومات الإعداد (config)

### 4. إعداد متغيرات البيئة

1. أنشئ ملف `.env` في المجلد الرئيسي للمشروع
2. انسخ محتوى `.env.example` إلى `.env`
3. املأ القيم من Firebase Console:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### 5. نشر قواعد الأمان

1. تأكد من تثبيت Firebase CLI:
```bash
npm install -g firebase-tools
```

2. سجل الدخول إلى Firebase:
```bash
firebase login
```

3. اربط المشروع:
```bash
firebase use --add
```
اختر مشروعك من القائمة

4. نشر قواعد Firestore:
```bash
firebase deploy --only firestore:rules
```

### 6. إعداد Firebase Hosting (الدومين المجاني)

1. في Firebase Console، اذهب إلى **Hosting**
2. انقر على **Get started**
3. اتبع التعليمات لتثبيت Firebase CLI (إذا لم تكن مثبتة)

4. بناء المشروع:
```bash
pnpm build
```

5. نشر المشروع:
```bash
firebase deploy --only hosting
```

6. ستحصل على دومين مجاني مثل:
   - `https://your-project-id.web.app`
   - `https://your-project-id.firebaseapp.com`

### 7. التحقق من الاتصال

1. شغّل المشروع محلياً:
```bash
pnpm dev
```

2. افتح لوحة التحكم (Admin Dashboard)
3. يجب أن ترى رسالة "✅ متصل بقاعدة البيانات" في أعلى الصفحة

### 8. تحديث قواعد الأمان (مهم!)

بعد 30 يوم من استخدام test mode، يجب تحديث قواعد الأمان:

1. في Firebase Console، اذهب إلى **Firestore Database** > **Rules**
2. استبدل القواعد الحالية بقواعد أكثر أماناً:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /students/{studentId} {
      // السماح بالقراءة للجميع
      allow read: if true;
      
      // السماح بالكتابة فقط للمستخدمين المصرح لهم
      // يمكنك إضافة نظام مصادقة هنا
      allow write: if request.auth != null;
    }
  }
}
```

3. انقر على **Publish**

## استكشاف الأخطاء

### المشكلة: "خطأ في الاتصال بقاعدة البيانات"

**الحلول:**
1. تأكد من إضافة جميع متغيرات البيئة في ملف `.env`
2. تأكد من أن قاعدة البيانات Firestore مفعّلة
3. تحقق من قواعد الأمان في Firebase Console
4. تأكد من اتصال الإنترنت

### المشكلة: "Permission denied"

**الحل:**
- تحقق من قواعد الأمان في Firestore
- تأكد من نشر القواعد باستخدام `firebase deploy --only firestore:rules`

### المشكلة: "Firebase app not initialized"

**الحل:**
- تأكد من وجود ملف `.env` مع جميع المتغيرات المطلوبة
- أعد تشغيل خادم التطوير بعد إضافة `.env`

## روابط مفيدة

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)

## ملاحظات

- الدومين المجاني من Firebase متاح دائماً
- يمكنك ربط دومين مخصص لاحقاً
- قاعدة البيانات Firestore مجانية حتى 1 GB تخزين و 50K قراءة/كتابة يومياً


