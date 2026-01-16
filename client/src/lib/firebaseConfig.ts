/*
 * إعدادات Firebase
 * يجب إضافة متغيرات البيئة في ملف .env
 */

import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// إعدادات Firebase من متغيرات البيئة
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "nafes-passport",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "nafes-passport.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abc123",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// التحقق من وجود جميع المتغيرات المطلوبة
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const missingVars = requiredEnvVars.filter(
  (varName) => !import.meta.env[varName]
);

const hasValidConfig = missingVars.length === 0;

if (!hasValidConfig) {
  console.warn(
    `⚠️ متغيرات Firebase المفقودة: ${missingVars.join(', ')}\n` +
    `يرجى إضافة هذه المتغيرات في ملف .env\n` +
    `التطبيق سيعمل بدون قاعدة بيانات حتى يتم إضافة المتغيرات`
  );
}

// تهيئة Firebase بشكل آمن
let app: any = null;
let db: any = null;
let auth: any = null;

try {
  if (hasValidConfig) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log('✅ Firebase تم تهيئته بنجاح');
  } else {
    // إنشاء كائنات وهمية لتجنب الأخطاء
    console.warn('⚠️ Firebase غير مهيأ - سيتم استخدام البيانات المحلية');
    console.warn('⚠️ المتغيرات المفقودة:', missingVars.join(', '));
  }
} catch (error) {
  console.error('❌ خطأ في تهيئة Firebase:', error);
  // في حالة الخطأ، نستخدم null
  db = null;
  auth = null;
  app = null;
}

// الاتصال بمحاكي Firebase في بيئة التطوير (اختياري)
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true' && db && auth) {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099');
    console.log('✅ متصل بمحاكي Firebase');
  } catch (error) {
    console.log('ℹ️ محاكي Firebase غير متاح');
  }
}

export { db, auth };
export default app;


