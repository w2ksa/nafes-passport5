/*
 * سكريبت لحذف جميع البيانات من Firestore
 * استخدم بحذر - هذا سيحذف جميع الطلاب!
 * 
 * الاستخدام: node scripts/deleteAllData.js
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// قراءة متغيرات البيئة من ملف .env
function loadEnv() {
  try {
    const envPath = resolve(__dirname, "..", ".env");
    const envContent = readFileSync(envPath, "utf-8");
    const env = {};
    
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join("=").trim();
        }
      }
    });
    
    return env;
  } catch (error) {
    console.error("❌ خطأ في قراءة ملف .env:", error.message);
    console.log("⚠️  تأكد من وجود ملف .env في المجلد الرئيسي");
    process.exit(1);
  }
}

const env = loadEnv();

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

async function deleteAllStudents() {
  try {
    console.log("🔥 تهيئة Firebase...");
    
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.error("❌ معلومات Firebase غير مكتملة في ملف .env");
      process.exit(1);
    }
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log("📋 جلب جميع الطلاب...");
    const studentsRef = collection(db, "students");
    const snapshot = await getDocs(studentsRef);

    if (snapshot.empty) {
      console.log("✅ لا توجد بيانات للحذف");
      return;
    }

    console.log(`📊 تم العثور على ${snapshot.size} طالب`);
    console.log("🗑️  بدء حذف البيانات...\n");

    let deletedCount = 0;
    for (const docSnapshot of snapshot.docs) {
      const studentDoc = doc(db, "students", docSnapshot.id);
      const studentName = docSnapshot.data().name || docSnapshot.id;
      await deleteDoc(studentDoc);
      deletedCount++;
      console.log(`✅ [${deletedCount}/${snapshot.size}] تم حذف: ${studentName}`);
    }

    console.log(`\n✅ تم حذف جميع البيانات بنجاح! (${deletedCount} طالب)`);
    process.exit(0);
  } catch (error) {
    console.error("\n❌ خطأ في حذف البيانات:", error.message);
    if (error.code === "permission-denied") {
      console.error("⚠️  خطأ في الصلاحيات - تحقق من قواعد Firestore");
    }
    process.exit(1);
  }
}

// تأكيد قبل الحذف
console.log("⚠️  تحذير: هذا السكريبت سيحذف جميع الطلاب من قاعدة البيانات!");
console.log("اضغط Ctrl+C للإلغاء، أو انتظر 3 ثوانٍ للمتابعة...\n");

setTimeout(() => {
  deleteAllStudents();
}, 3000);

