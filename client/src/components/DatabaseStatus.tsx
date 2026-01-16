/*
 * مكون للتحقق من حالة الاتصال بقاعدة البيانات
 */

import { useEffect, useState } from "react";
import { checkDatabaseConnection } from "@/lib/firestoreService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export function DatabaseStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      setIsChecking(true);
      try {
        const connected = await checkDatabaseConnection();
        setIsConnected(connected);
      } catch (error) {
        console.error("خطأ في التحقق من الاتصال:", error);
        setIsConnected(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkConnection();
  }, []);

  if (isChecking) {
    return (
      <Alert className="mb-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>جارٍ التحقق من الاتصال...</AlertTitle>
        <AlertDescription>
          يرجى الانتظار بينما نتحقق من اتصال قاعدة البيانات
        </AlertDescription>
      </Alert>
    );
  }

  if (isConnected) {
    return (
      <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-950">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800 dark:text-green-200">
          متصل بقاعدة البيانات
        </AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-300">
          ✅ الاتصال بقاعدة بيانات Firebase Firestore يعمل بشكل صحيح
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <XCircle className="h-4 w-4" />
      <AlertTitle>خطأ في الاتصال بقاعدة البيانات</AlertTitle>
      <AlertDescription>
        ❌ لا يمكن الاتصال بقاعدة بيانات Firebase. يرجى التحقق من:
        <ul className="mt-2 list-disc list-inside space-y-1">
          <li>إعدادات Firebase في ملف .env (في المجلد الرئيسي)</li>
          <li>تفعيل Firestore Database في Firebase Console</li>
          <li>قواعد الأمان في Firebase Console (Firestore → Rules)</li>
          <li>اتصال الإنترنت</li>
        </ul>
        <div className="mt-3 p-3 bg-muted rounded-lg">
          <p className="text-sm font-semibold mb-1">💡 ملاحظة:</p>
          <p className="text-sm">
            التطبيق يعمل حالياً باستخدام البيانات المحلية. لإضافة قاعدة بيانات Firebase:
          </p>
          <ol className="text-sm mt-2 list-decimal list-inside space-y-1">
            <li>افتح <a href="https://console.firebase.google.com/project/nafes-passport/settings/general" target="_blank" rel="noopener noreferrer" className="text-primary underline">Firebase Console</a></li>
            <li>انسخ معلومات Firebase من Project Settings</li>
            <li>أنشئ ملف <code className="bg-background px-1 rounded">.env</code> في المجلد الرئيسي</li>
            <li>أضف المتغيرات المطلوبة (راجع README_FIREBASE.md)</li>
          </ol>
        </div>
      </AlertDescription>
    </Alert>
  );
}


