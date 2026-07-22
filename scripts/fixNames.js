import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    console.error("❌ خطأ في قراءة .env:", error.message);
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

// قائمة التصحيحات الإملائية - القديم والجديد
const corrections = {
  // ===== مشكلة "يا من" ← "يامن" =====
  "يا من علي عبدالله الالمعي":         "يامن علي عبدالله الالمعي",

  // ===== مشكلة "ال" ← "آل" في أسماء العائلات (الصف السادس) =====
  "تميم عبدالله ظافر ال هيال":         "تميم عبدالله ظافر آل هيال",
  "ابراهيم زهير محمد ال عاص":          "إبراهيم زهير محمد آل عاص",
  "أنس محمد يحي ال عمار":              "أنس محمد يحي آل عمار",
  "خالد يحي محمد ال شويل":             "خالد يحي محمد آل شويل",

  // ===== مشكلة "ال" ← "آل" في أسماء العائلات (الصف الثالث) =====
  "علي احمد ماطر ال شواف":             "علي احمد ماطر آل شواف",
  "عمر احمد ماطر ال شواف":             "عمر احمد ماطر آل شواف",

  // ===== تصحيحات جديدة =====
  "مزيد سعيد سعد الغامدي":               "مؤيد سعيد سعد الغامدي",
  "فيصل مربع سعد هباش":                  "فيصل مريع سعد هباش",
  "سلمان مربع سعد هباش":                 "سلمان مريع سعد هباش",
  "بتال سعيد عوظه آل واكد":              "بتال سعيد عوضه آل واكد",
  // احتياطي: في حال خُزّن بدون آل
  "بتال سعيد عوظه واكد":                 "بتال سعيد عوضه آل واكد",

  // ===== تصحيحات قديمة (حروف فارسية أو أخطاء أخرى) =====
  "مند ناصر محمد علاي":                "مهند ناصر محمد علاي",
  "سعيد محمد حسن قحطانی":             "سعيد محمد حسن قحطاني",
  "کرم خالد راتب الزرير":              "كرم خالد راتب الزرير",
  "معاد ظافر عايض القحطاني":           "معاذ ظافر عايض القحطاني",
  "اسر محمد بن علي آل نازح":           "آسر محمد بن علي آل نازح",
  "ابراهیم زهير محمد ال عاص":          "إبراهيم زهير محمد آل عاص",
  "ابراهیم زهير محمد آل عاص":          "إبراهيم زهير محمد آل عاص",
};

async function fixNames() {
  try {
    console.log("🔥 جاري الاتصال بـ Firebase...");
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.error("❌ معلومات Firebase غير مكتملة في .env");
      process.exit(1);
    }

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log("📋 جاري جلب الطلاب من Firestore...\n");
    const studentsSnapshot = await getDocs(collection(db, "students"));

    console.log(`📊 عدد الطلاب الكلي: ${studentsSnapshot.size}\n`);

    let correctedCount = 0;
    let checkedCount = 0;

    for (const studentDoc of studentsSnapshot.docs) {
      const studentData = studentDoc.data();
      const currentName = studentData.name?.trim();
      checkedCount++;

      if (corrections[currentName]) {
        const newName = corrections[currentName];
        console.log(`✏️  تصحيح: "${currentName}"`);
        console.log(`   ←     "${newName}"`);

        await updateDoc(doc(db, "students", studentDoc.id), {
          name: newName,
          updatedAt: new Date().toISOString(),
        });

        correctedCount++;
        console.log(`   ✅ تم التصحيح\n`);
      }
    }

    console.log(`\n${"=".repeat(50)}`);
    console.log(`✅ انتهى! تم فحص ${checkedCount} طالب`);
    console.log(`📝 تم تصحيح ${correctedCount} اسم`);
    if (correctedCount === 0) {
      console.log(`ℹ️  لا توجد أخطاء بحاجة للتصحيح`);
    }
    process.exit(0);
  } catch (err) {
    console.error("\n❌ خطأ:", err.message);
    process.exit(1);
  }
}

fixNames();
