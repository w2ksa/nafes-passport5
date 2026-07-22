/**
 * سكريبت لاختبار الدخول المتزامن للنظام
 * يحاكي عدة أجهزة تدخل في نفس الوقت
 */

import axios from 'axios';

const WEBSITE_URL = 'https://nafes-passport.web.app';

// ألوان للطباعة
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// محاكاة جهاز واحد
async function simulateDevice(deviceId, action) {
  const startTime = Date.now();
  
  try {
    console.log(`${colors.cyan}[جهاز ${deviceId}]${colors.reset} بدء الاختبار: ${action}`);
    
    // طلب للصفحة الرئيسية
    const response = await axios.get(WEBSITE_URL, {
      headers: {
        'User-Agent': `TestDevice-${deviceId}`,
        'Accept': 'text/html',
      },
      timeout: 10000, // 10 ثواني
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log(
        `${colors.green}✓ [جهاز ${deviceId}]${colors.reset} نجح - ` +
        `الحالة: ${response.status} - ` +
        `الوقت: ${duration}ms - ` +
        `الحجم: ${(response.data.length / 1024).toFixed(2)}KB`
      );
      return {
        deviceId,
        success: true,
        duration,
        status: response.status,
        size: response.data.length,
      };
    } else {
      console.log(
        `${colors.yellow}⚠ [جهاز ${deviceId}]${colors.reset} استجابة غير متوقعة - ` +
        `الحالة: ${response.status}`
      );
      return {
        deviceId,
        success: false,
        duration,
        status: response.status,
      };
    }
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(
      `${colors.red}✗ [جهاز ${deviceId}]${colors.reset} فشل - ` +
      `${error.message} - ` +
      `الوقت: ${duration}ms`
    );
    return {
      deviceId,
      success: false,
      duration,
      error: error.message,
    };
  }
}

// اختبار الدخول المتزامن
async function testConcurrentAccess(numberOfDevices) {
  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}  اختبار الدخول المتزامن لنظام جواز نافس${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}\n`);
  
  console.log(`${colors.yellow}⚡ عدد الأجهزة المحاكاة: ${numberOfDevices}${colors.reset}`);
  console.log(`${colors.yellow}🌐 الموقع المستهدف: ${WEBSITE_URL}${colors.reset}\n`);
  
  const testStartTime = Date.now();
  
  // إنشاء مصفوفة من الأجهزة
  const devices = Array.from({ length: numberOfDevices }, (_, i) => i + 1);
  
  // تنفيذ الطلبات في نفس الوقت
  console.log(`${colors.cyan}🚀 بدء الاختبار...${colors.reset}\n`);
  
  const results = await Promise.all(
    devices.map(deviceId => simulateDevice(deviceId, 'GET /'))
  );
  
  const testEndTime = Date.now();
  const totalDuration = testEndTime - testStartTime;
  
  // تحليل النتائج
  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}  ملخص النتائج${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}\n`);
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  const minDuration = Math.min(...results.map(r => r.duration));
  const maxDuration = Math.max(...results.map(r => r.duration));
  
  console.log(`${colors.green}✓ نجح: ${successful}/${numberOfDevices}${colors.reset}`);
  console.log(`${colors.red}✗ فشل: ${failed}/${numberOfDevices}${colors.reset}`);
  console.log(`${colors.cyan}⏱ الوقت الكلي: ${totalDuration}ms${colors.reset}`);
  console.log(`${colors.cyan}⏱ متوسط وقت الاستجابة: ${avgDuration.toFixed(2)}ms${colors.reset}`);
  console.log(`${colors.cyan}⏱ أسرع استجابة: ${minDuration}ms${colors.reset}`);
  console.log(`${colors.cyan}⏱ أبطأ استجابة: ${maxDuration}ms${colors.reset}`);
  
  const successRate = (successful / numberOfDevices) * 100;
  console.log(`\n${colors.bright}📊 معدل النجاح: ${successRate.toFixed(1)}%${colors.reset}`);
  
  if (successRate === 100) {
    console.log(`${colors.green}${colors.bright}\n✅ ممتاز! النظام يتحمل الضغط بشكل ممتاز${colors.reset}\n`);
  } else if (successRate >= 80) {
    console.log(`${colors.yellow}${colors.bright}\n⚠️ جيد - ولكن يحتاج تحسين${colors.reset}\n`);
  } else {
    console.log(`${colors.red}${colors.bright}\n❌ النظام يحتاج تحسينات كبيرة${colors.reset}\n`);
  }
  
  return {
    total: numberOfDevices,
    successful,
    failed,
    successRate,
    totalDuration,
    avgDuration,
    minDuration,
    maxDuration,
  };
}

// اختبار قراءة ملفات ثابتة
async function testStaticFiles() {
  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}  اختبار الملفات الثابتة${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}\n`);
  
  const files = [
    '/images/school-logo.jpg',
    '/images/achievement-stamps.png',
    '/images/rocket-journey.png',
  ];
  
  const results = [];
  
  for (const file of files) {
    const url = `${WEBSITE_URL}${file}`;
    const startTime = Date.now();
    
    try {
      const response = await axios.head(url, { timeout: 5000 });
      const duration = Date.now() - startTime;
      
      console.log(
        `${colors.green}✓${colors.reset} ${file} - ` +
        `${response.status} - ${duration}ms`
      );
      
      results.push({ file, success: true, duration, status: response.status });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.log(
        `${colors.red}✗${colors.reset} ${file} - ` +
        `${error.message} - ${duration}ms`
      );
      
      results.push({ file, success: false, duration, error: error.message });
    }
  }
  
  const allSuccess = results.every(r => r.success);
  console.log(
    allSuccess
      ? `\n${colors.green}✅ جميع الملفات متاحة${colors.reset}\n`
      : `\n${colors.red}❌ بعض الملفات غير متاحة${colors.reset}\n`
  );
  
  return results;
}

// تشغيل الاختبارات
async function runTests() {
  console.clear();
  
  // اختبار 1: 5 أجهزة
  await testConcurrentAccess(5);
  
  // انتظار ثانيتين
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // اختبار 2: 10 أجهزة
  await testConcurrentAccess(10);
  
  // انتظار ثانيتين
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // اختبار 3: 20 جهاز
  await testConcurrentAccess(20);
  
  // اختبار الملفات الثابتة
  await testStaticFiles();
  
  console.log(`${colors.bright}${colors.green}\n✅ اكتملت جميع الاختبارات${colors.reset}\n`);
}

// تشغيل الاختبارات
runTests().catch(error => {
  console.error(`${colors.red}خطأ في تشغيل الاختبارات:${colors.reset}`, error);
  process.exit(1);
});
