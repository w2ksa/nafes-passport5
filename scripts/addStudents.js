/*
 * سكريبت لإضافة طلاب الصف السادس
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

// قائمة الطلاب - الصف السادس
const students = [
  "احمد عبدالكريم احمد علي",
  "البراء محمد أحمد عسيري",
  "بتال سعود سعيد الاسمري",
  "جسار طارق حسن القحطاني",
  "خالد بن وليد يحيى القحطاني",
  "خالد سعد عبدالرحمن العمري",
  "دويل محمد دويل بالحامض",
  "سعيد سفر سعيد الشهراني",
  "ظافر محمد ظافر الشهري",
  "عبدالعزيز سعيد يحي آل شويل",
  "عبدالله محمد بن عبدالله العمري",
  "علي محمد علي آل عليه",
  "علي محمد منصور مدخلي",
  "فارس فايز عبدالله الشهري",
  "فارس محمد ظافر الشهري",
  "فيصل صالح خلوفه الاحمري",
  "مشعل محمد مهدي القحطاني",
  "مؤيد سعيد سعد الغامدي",
  "وسام يعن الله سعيد الشهري",
  "ابراهيم احمد ابراهيم عسيري",
  "احمد ابراهيم احمد عسيري",
  "أحمد عبدالله سعد العمري",
  "آسر محمد بن علي آل نازح",
  "المثنى محمد شعشوع الاسمري",
  "بتال سعيد عوضه آل واكد",  // تم تصحيح "عوظه" إلى "عوضه"
  "تركي عبدالله بن سعد القحطاني",
  "تميم حذيفه محمد السليمي",
  "تميم عبدالله ظافر آل هيال",
  "سلطان موسى بن يحي بن حيان",
  "صقر محمد جابر الشهري",
  "طلال فهد ابراهيم عسيري",
  "عبدالمجيد محمد علي العمري",
  "عمر بن عبدالعزيز ابن عبدالله القحطاني",
  "فيصل ابن ماجد بن علي بن احمد العسيري",
  "محمد سعيد عبدالله القحطاني",
  "محمد عبدالله بن سعد القحطاني",
  "مشعل خالد بن عبدالله عسيري",
  "نادر عبدالعزيز علي القرني",
  "نواف عبدالله ابن متعب آل هادي",
  "يامن علي عبدالله الالمعي",
  "إبراهيم زهير محمد آل عاص",
  "اسماعيل محمد اسماعيل حمدان",
  "أنس محمد يحي آل عمار",
  "جبران عبدالله مبارك الشهراني",
  "خالد عبدالله بن مسفر الزهيري",
  "خالد علي محمد الشهري",
  "خالد فيصل علي القحطاني",
  "خالد يحي محمد آل شويل",
  "عبدالرحمن ظافر بن عبدالرحمن آل مضحي",
  "عبدالرحمن فهد عثمان الشهراني",
  "عبدالعزيز زكريا محمد عريبي",
  "عبدالله أحمد محمد عسيري",
  "عبدالله بن علي بن عبدالله علي القاسمي عسيري",
  "فارس حسين سعد القحطاني",
  "فهد علي يحي الشهراني",
  "فواز ظافر بن عبدالرحمن آل مضحي",
  "فيصل مريع سعد هباش",
  "محمد أحمد محمد عسيري",
  "محمد أيمن ابراهيم آل مطاعن",
  "محمد طاهر محمد الشهري",
  "مشاري سعيد مانع الأحمري",
  "مهند زياد بن محمد العسكري",
  "نادر سالم مهدي آل معمر",
  "يزن بشير بن يحي الفقيه"
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

    console.log(`📋 جاري إضافة ${students.length} طالب من الصف السادس...\n`);

    let addedCount = 0;
    let errorCount = 0;

    for (const studentName of students) {
      try {
        const studentData = {
          name: studentName.trim(),
          grade: 6,
          points: {
            arabic: 0,
            math: 0,
            science: 0,
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

