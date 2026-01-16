# جواز نافس - ابتدائية أبها الأهلية 🚀

نظام إدارة الطلاب والأنشطة التعليمية مع نظام النقاط والرتب والأختام.

## 🌐 الروابط

- **الموقع المباشر:** https://nafes-passport.web.app
- **GitHub Repository:** https://nafes-passport5.web.app/
- **Firebase Console:** https://console.firebase.google.com/project/nafes-passport

## ✨ المميزات

- ✅ إدارة الطلاب (إضافة، تعديل، حذف)
- ✅ نظام النقاط والرتب
- ✅ نظام الأختام (فضي، ذهبي، ماسي)
- ✅ رفع الصور على Firebase Storage
- ✅ قاعدة بيانات Firestore
- ✅ واجهة مستخدم عربية جميلة
- ✅ متجاوب مع جميع الأجهزة

## 🛠️ التقنيات المستخدمة

- **Frontend:** React + TypeScript + Vite
- **UI:** Tailwind CSS + Radix UI
- **Database:** Firebase Firestore
- **Storage:** Firebase Storage
- **Hosting:** Firebase Hosting
- **Routing:** Wouter

## 📦 التثبيت والتشغيل

### المتطلبات

- Node.js 18+
- pnpm

### خطوات التثبيت

```bash
# تثبيت الحزم
pnpm install

# إعداد متغيرات البيئة
cp .env.example .env
# ثم أضف معلومات Firebase من Firebase Console

# تشغيل المشروع محلياً
pnpm dev

# بناء المشروع
pnpm build

# نشر على Firebase
firebase deploy --only hosting
```

## 🔥 إعداد Firebase

1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. أنشئ مشروع جديد أو استخدم المشروع الموجود
3. فعّل **Firestore Database** و **Storage**
4. انسخ معلومات الإعداد من Project Settings
5. أضفها في ملف `.env`

راجع [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) للتفاصيل الكاملة.


