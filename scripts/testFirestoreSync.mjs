/**
 * اختبار التزامن في Firestore
 * محاكاة عدة مستخدمين يحدثون البيانات في نفس الوقت
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

// إعدادات Firebase (من ملف .env)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "nafes-passport5",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.VITE_FIREBASE_APP_ID || "",
};

// ألوان للطباعة
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log(`${colors.green}✓ تم الاتصال بـ Firebase Firestore${colors.reset}\n`);

// اختبار القراءة المتزامنة
async function testConcurrentReads(numberOfReaders) {
  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}  اختبار القراءة المتزامنة من Firestore${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}\n`);
  
  console.log(`${colors.yellow}📖 عدد القراء المتزامنين: ${numberOfReaders}${colors.reset}\n`);
  
  const startTime = Date.now();
  
  // محاكاة عدة مستخدمين يقرؤون البيانات في نفس الوقت
  const readers = Array.from({ length: numberOfReaders }, (_, i) => i + 1);
  
  const readResults = await Promise.all(
    readers.map(async (readerId) => {
      const readerStartTime = Date.now();
      
      try {
        console.log(`${colors.cyan}[قارئ ${readerId}]${colors.reset} بدء القراءة...`);
        
        const studentsRef = collection(db, 'students');
        const q = query(studentsRef, orderBy('totalPoints', 'desc'));
        const snapshot = await getDocs(q);
        
        const duration = Date.now() - readerStartTime;
        const count = snapshot.size;
        
        console.log(
          `${colors.green}✓ [قارئ ${readerId}]${colors.reset} نجح - ` +
          `عدد الطلاب: ${count} - الوقت: ${duration}ms`
        );
        
        return {
          readerId,
          success: true,
          duration,
          count,
        };
      } catch (error) {
        const duration = Date.now() - readerStartTime;
        
        console.log(
          `${colors.red}✗ [قارئ ${readerId}]${colors.reset} فشل - ` +
          `${error.message} - الوقت: ${duration}ms`
        );
        
        return {
          readerId,
          success: false,
          duration,
          error: error.message,
        };
      }
    })
  );
  
  const totalDuration = Date.now() - startTime;
  
  // تحليل النتائج
  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}  ملخص نتائج القراءة${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}\n`);
  
  const successful = readResults.filter(r => r.success).length;
  const failed = readResults.filter(r => !r.success).length;
  const avgDuration = readResults.reduce((sum, r) => sum + r.duration, 0) / readResults.length;
  
  console.log(`${colors.green}✓ نجح: ${successful}/${numberOfReaders}${colors.reset}`);
  console.log(`${colors.red}✗ فشل: ${failed}/${numberOfReaders}${colors.reset}`);
  console.log(`${colors.cyan}⏱ الوقت الكلي: ${totalDuration}ms${colors.reset}`);
  console.log(`${colors.cyan}⏱ متوسط وقت القراءة: ${avgDuration.toFixed(2)}ms${colors.reset}`);
  
  if (successful > 0) {
    const avgCount = readResults
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.count, 0) / successful;
    console.log(`${colors.cyan}📊 متوسط عدد الطلاب المقروءة: ${avgCount.toFixed(0)}${colors.reset}`);
  }
  
  const successRate = (successful / numberOfReaders) * 100;
  console.log(`\n${colors.bright}📊 معدل النجاح: ${successRate.toFixed(1)}%${colors.reset}`);
  
  if (successRate === 100) {
    console.log(`${colors.green}${colors.bright}\n✅ ممتاز! القراءة المتزامنة تعمل بشكل ممتاز${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}${colors.bright}\n⚠️ يوجد مشاكل في القراءة المتزامنة${colors.reset}\n`);
  }
  
  return readResults;
}

// اختبار الكتابة المتزامنة
async function testConcurrentWrites(numberOfWriters) {
  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}  اختبار الكتابة المتزامنة في Firestore${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}\n`);
  
  console.log(`${colors.yellow}✍️  عدد الكتاب المتزامنين: ${numberOfWriters}${colors.reset}\n`);
  
  const testCollectionId = `test_sync_${Date.now()}`;
  const startTime = Date.now();
  
  // محاكاة عدة مستخدمين يكتبون البيانات في نفس الوقت
  const writers = Array.from({ length: numberOfWriters }, (_, i) => i + 1);
  
  const writeResults = await Promise.all(
    writers.map(async (writerId) => {
      const writerStartTime = Date.now();
      
      try {
        console.log(`${colors.cyan}[كاتب ${writerId}]${colors.reset} بدء الكتابة...`);
        
        const testDocRef = doc(db, 'test_concurrent', `${testCollectionId}_writer_${writerId}`);
        
        await setDoc(testDocRef, {
          writerId,
          timestamp: serverTimestamp(),
          data: `Test data from writer ${writerId}`,
          testId: testCollectionId,
        });
        
        const duration = Date.now() - writerStartTime;
        
        console.log(
          `${colors.green}✓ [كاتب ${writerId}]${colors.reset} نجح - ` +
          `الوقت: ${duration}ms`
        );
        
        return {
          writerId,
          success: true,
          duration,
        };
      } catch (error) {
        const duration = Date.now() - writerStartTime;
        
        console.log(
          `${colors.red}✗ [كاتب ${writerId}]${colors.reset} فشل - ` +
          `${error.message} - الوقت: ${duration}ms`
        );
        
        return {
          writerId,
          success: false,
          duration,
          error: error.message,
        };
      }
    })
  );
  
  const totalDuration = Date.now() - startTime;
  
  // التحقق من البيانات المكتوبة
  console.log(`\n${colors.magenta}🔍 التحقق من البيانات المكتوبة...${colors.reset}\n`);
  
  const testCollectionRef = collection(db, 'test_concurrent');
  const snapshot = await getDocs(testCollectionRef);
  
  let writtenDocs = 0;
  snapshot.forEach((doc) => {
    if (doc.data().testId === testCollectionId) {
      writtenDocs++;
    }
  });
  
  // تحليل النتائج
  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}  ملخص نتائج الكتابة${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}\n`);
  
  const successful = writeResults.filter(r => r.success).length;
  const failed = writeResults.filter(r => !r.success).length;
  const avgDuration = writeResults.reduce((sum, r) => sum + r.duration, 0) / writeResults.length;
  
  console.log(`${colors.green}✓ نجح: ${successful}/${numberOfWriters}${colors.reset}`);
  console.log(`${colors.red}✗ فشل: ${failed}/${numberOfWriters}${colors.reset}`);
  console.log(`${colors.cyan}⏱ الوقت الكلي: ${totalDuration}ms${colors.reset}`);
  console.log(`${colors.cyan}⏱ متوسط وقت الكتابة: ${avgDuration.toFixed(2)}ms${colors.reset}`);
  console.log(`${colors.cyan}📝 عدد المستندات المكتوبة: ${writtenDocs}/${numberOfWriters}${colors.reset}`);
  
  const successRate = (successful / numberOfWriters) * 100;
  console.log(`\n${colors.bright}📊 معدل النجاح: ${successRate.toFixed(1)}%${colors.reset}`);
  
  if (successRate === 100 && writtenDocs === numberOfWriters) {
    console.log(`${colors.green}${colors.bright}\n✅ ممتاز! الكتابة المتزامنة تعمل بشكل ممتاز${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}${colors.bright}\n⚠️ يوجد مشاكل في الكتابة المتزامنة${colors.reset}\n`);
  }
  
  return { writeResults, writtenDocs };
}

// اختبار Real-time Listeners
async function testRealtimeListeners() {
  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}  اختبار Real-time Listeners${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}\n`);
  
  console.log(`${colors.yellow}👂 إنشاء 3 مستمعين (listeners) في نفس الوقت...${colors.reset}\n`);
  
  const listeners = [];
  const receivedUpdates = [[], [], []];
  
  // إنشاء 3 مستمعين
  for (let i = 0; i < 3; i++) {
    const studentsRef = collection(db, 'students');
    const q = query(studentsRef, orderBy('totalPoints', 'desc'));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        receivedUpdates[i].push({
          timestamp: Date.now(),
          count: snapshot.size,
        });
        console.log(
          `${colors.green}📡 [مستمع ${i + 1}]${colors.reset} استلم تحديث - ` +
          `عدد الطلاب: ${snapshot.size}`
        );
      },
      (error) => {
        console.log(
          `${colors.red}✗ [مستمع ${i + 1}]${colors.reset} خطأ - ${error.message}`
        );
      }
    );
    
    listeners.push(unsubscribe);
  }
  
  // انتظار التحديثات الأولية
  console.log(`\n${colors.cyan}⏳ انتظار التحديثات الأولية...${colors.reset}`);
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // إلغاء الاشتراك
  listeners.forEach(unsubscribe => unsubscribe());
  
  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}  ملخص نتائج Real-time Listeners${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}\n`);
  
  receivedUpdates.forEach((updates, i) => {
    console.log(
      `${colors.green}✓ [مستمع ${i + 1}]${colors.reset} استلم ${updates.length} تحديث`
    );
  });
  
  const allReceived = receivedUpdates.every(updates => updates.length > 0);
  
  if (allReceived) {
    console.log(`${colors.green}${colors.bright}\n✅ جميع المستمعين يعملون بشكل صحيح${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}${colors.bright}\n⚠️ بعض المستمعين لم يستلموا تحديثات${colors.reset}\n`);
  }
  
  return receivedUpdates;
}

// اختبار شامل
async function runAllTests() {
  console.clear();
  
  console.log(`${colors.bright}${colors.magenta}╔═══════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}║                                                   ║${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}║   اختبار التزامن في Firestore - جواز نافس       ║${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}║                                                   ║${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}╚═══════════════════════════════════════════════════╝${colors.reset}\n`);
  
  try {
    // اختبار 1: القراءة المتزامنة (5 قراء)
    await testConcurrentReads(5);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // اختبار 2: القراءة المتزامنة (10 قراء)
    await testConcurrentReads(10);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // اختبار 3: الكتابة المتزامنة (5 كتاب)
    await testConcurrentWrites(5);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // اختبار 4: Real-time Listeners
    await testRealtimeListeners();
    
    console.log(`${colors.bright}${colors.green}\n✅ اكتملت جميع الاختبارات بنجاح${colors.reset}\n`);
    
    // إغلاق الاتصال
    process.exit(0);
  } catch (error) {
    console.error(`${colors.red}\n❌ خطأ في تشغيل الاختبارات:${colors.reset}`, error);
    process.exit(1);
  }
}

// تشغيل الاختبارات
runAllTests();
