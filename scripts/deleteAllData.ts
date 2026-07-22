/*
 * سكريبت لحذف جميع البيانات من Firestore
 * استخدم بحذر - هذا سيحذف جميع الطلاب!
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// تحميل متغيرات البيئة
dotenv.config({ path: resolve(__dirname, "..", ".env") });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

async function deleteAllStudents() {
  try {
    console.log("🔥 تهيئة Firebase...");
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
    console.log("🗑️  بدء حذف البيانات...");

    const deletePromises = snapshot.docs.map(async (docSnapshot) => {
      const studentDoc = doc(db, "students", docSnapshot.id);
      await deleteDoc(studentDoc);
      console.log(`✅ تم حذف: ${docSnapshot.data().name || docSnapshot.id}`);
    });

    await Promise.all(deletePromises);

    console.log(`\n✅ تم حذف جميع البيانات بنجاح! (${snapshot.size} طالب)`);
  } catch (error) {
    console.error("❌ خطأ في حذف البيانات:", error);
    process.exit(1);
  }
}

deleteAllStudents();

