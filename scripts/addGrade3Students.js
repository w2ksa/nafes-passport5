/*
 * سكريبت لإضافة طلاب الصف الثالث
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// قراءة متغيرات البيئة
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

// قائمة الطلاب - الصف الثالث
const students = [
  "باسل محمد سعيد القحطاني",
  "بدر ماجد علي العسيري",
  "تميم طارق حسن القحطاني",
  "تميم مبارك بن فهد القحطاني",
  "جاسر احمد ابن صالح عسيري",
  "حمود عبدالرحمن جرمان الاسمري",
  "رويد عبدالله سعيد محروس",
  "زياد عبدالله محمد الشهراني",
  "سلمان محمد ناصر آل احمد",
  "عبدالاله احمد حسن الهيزعي",
  "عز محمد مرعي القرني",
  "علي احمد ماطر آل شواف",
  "علي محمد علي الشديدي",
  "علي منصور عامر القرني",
  "عمر احمد ماطر آل شواف",
  "مؤيد عبدالرحمن علي الشهري",
  "مراد سعيد عبدالرحمن عسيري",
  "مشعل عبدالله يحي الشهراني",
  "معاذ ظافر عايض القحطاني",
  "نواف ماجد حمود الحسام",
  "هشام محمد منصور العسيري",
  "هيثم محمد ابراهيم آل مطاعن",
  "يحيى جبران يحي آل جحدل",
  "يزن أمين بن ابراهيم علوان",
  "يزيد يحيى سعد عسيري",
  "أسامه مهند سعيد عسيري",
  "بتال علي سابر الاسمري",
  "حسين علي حسين آل عدينان",
  "خالد سعد محمد عسيري",
  "رائد احمد علي القحطاني",
  "راكان عبدالله احمد الشهري",
  "زايد عبدالله مبارك الشهراني",
  "زياد محمد حسين القحطاني",
  "سعود تركي علي الاسمري",
  "سعيد علي ابن يحي بن شبعان",
  "سعيد محمد حسن قحطاني",
  "سلمان مريع سعد هباش",
  "سند ناصر محمد علاي",
  "سيف ناصر محمد علاي",
  "عبدالرحمن علي بن عوض الوادعي",
  "عبدالله محمد ابن عبدالله آل ناجي",
  "عبدالملك فارس ابن عبدالله سرحان",
  "عزام محمد علي عسيري",
  "محمد أنس محمد مجدوع",
  "محمد عادل محمد عسيري",
  "محمد عبدالعزيز محمد أبوسبعه",
  "مشهور مسفر سعيد آل كعبان",
  "نايف غازي عوض القحطاني",
  "وسام حافظ احمد العسكري",
  "أوس يحي عايض عسيري",
  "اياس فائع علي عسيري",
  "باسل جبران حسن القحطاني",
  "حمزه عبدالله حسن الوادعي",
  "خالد سلطان محمد العمري",
  "خالد عبدالرحمن أحمد عبدلي",
  "خالد علي محمد عياشي",
  "سعد مصطفى سعد القحطاني",
  "سلمان عبدالله حسين بالحارث",
  "سند خالد احمد الخالدي",
  "صقر عوض محمد القحطاني",
  "عادل علي سعد الشهراني",
  "عبدالعزيز محمد جربوع الشهراني",
  "فهد عبدالرحمن علي الزهراني",
  "فيصل سعود لاحق مسرد",
  "كرم خالد راتب الزرير",
  "محمد راشد علي آل هتيله",
  "محمد عامر راضي الدغامين",
  "محمد علي احمد عسيري",
  "مهند محمد عبده السيد",
  "هادي حسين هادي الوادعي",
  "يزيد بن محمد بن سعد العمري"
];

async function addStudents() {
  try {
    console.log("🔥 تهيئة Firebase...");
    
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.error("❌ معلومات Firebase غير مكتملة في ملف .env");
      process.exit(1);
    }
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log(`📋 جاري إضافة ${students.length} طالب من الصف الثالث...\n`);

    let addedCount = 0;
    let errorCount = 0;

    for (const studentName of students) {
      try {
        const studentData = {
          name: studentName.trim(),
          grade: 3,
          points: {
            arabic: 0,
            math: 0,
            morningAssembly: 0,
            nafesExams: 0,
          },
          totalPoints: 0,
          rank: {
            id: 1,
            nameAr: "مستكشف صغير",
            nameEn: "Junior Explorer",
            minPoints: 0,
            maxPoints: 10,
            icon: "🌍",
          },
          stamps: {
            silver: false,
            gold: false,
            diamond: false,
          },
          viewCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await addDoc(collection(db, "students"), studentData);
        addedCount++;
        console.log(`✅ [${addedCount}/${students.length}] ${studentName}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ خطأ في إضافة ${studentName}:`, error.message);
      }
    }

    console.log(`\n✅ تم إضافة ${addedCount} طالب بنجاح!`);
    if (errorCount > 0) {
      console.log(`⚠️  فشل في إضافة ${errorCount} طالب`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ خطأ:", error.message);
    if (error.code === "permission-denied") {
      console.error("⚠️  خطأ في الصلاحيات - تحقق من قواعد Firestore");
    }
    process.exit(1);
  }
}

addStudents();
