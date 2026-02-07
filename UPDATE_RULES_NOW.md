# تحديث قواعد الأمان الآن 🔧

## ✅ تم تحديث الملف المحلي

في ملف `firestore.rules`، تم التغيير من:
```javascript
allow write: if request.time < timestamp.date(2026, 12, 31);
```

إلى:
```javascript
allow write: if request.time < timestamp.date(2030, 12, 31);
```

---

## 🌐 الخطوة التالية: نشر التحديث على Firebase

### الطريقة 1: من Firebase Console (الأسهل)

**الخطوات:**

1. افتح Firebase Console:
   ```
   https://console.firebase.google.com/project/nafes-passport5/firestore/rules
   ```

2. ستجد محرر النصوص، ابحث عن هذا السطر:
   ```javascript
   allow write: if request.time < timestamp.date(2026, 12, 31);
   ```

3. غيّره إلى:
   ```javascript
   allow write: if request.time < timestamp.date(2030, 12, 31);
   ```

4. اضغط **Publish** (نشر)

**تم! ✅** النظام الآن يعمل حتى 2030

---

### الطريقة 2: من Terminal (إذا حبيت)

```bash
cd /Users/saudalzayed/Desktop/all\ projects/nafes-passport5

# تسجيل الدخول
firebase login

# نشر القواعد
firebase deploy --only firestore:rules --project nafes-passport5
```

---

## ⚠️ ملاحظة

الملف المحلي (`firestore.rules`) محدّث بالفعل ✅

فقط تحتاج تنشر التحديث على Firebase باستخدام إحدى الطريقتين فوق.

---

## ✅ للتأكد من النجاح

بعد النشر، افتح Firebase Console وتحقق أن التاريخ تغير إلى 2030.

