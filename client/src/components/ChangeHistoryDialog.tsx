/*
 * مكون سجلات التغييرات
 * يعرض تاريخ جميع التعديلات على الطلاب
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { History, RotateCcw, Loader2, AlertTriangle } from "lucide-react";
import { collection, query, orderBy, limit, getDocs, doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { toast } from "sonner";
import type { Student } from "@/lib/data";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface ChangeLog {
  id: string;
  timestamp: string;
  action: "add" | "update" | "delete" | "bulk_update";
  studentId: string;
  studentName: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  snapshotBefore?: Student; // النسخة الكاملة قبل التعديل
}

interface ChangeHistoryDialogProps {
  onRestore?: (studentData: Student) => Promise<void>;
}

export function ChangeHistoryDialog({ onRestore }: ChangeHistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<ChangeLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);

  // جلب السجلات
  const loadLogs = async () => {
    if (!db) {
      toast.error("قاعدة البيانات غير متاحة");
      return;
    }

    try {
      setIsLoading(true);
      const logsRef = collection(db, "change_logs");
      const q = query(logsRef, orderBy("timestamp", "desc"), limit(100));
      const snapshot = await getDocs(q);

      const fetchedLogs: ChangeLog[] = [];
      snapshot.forEach((doc) => {
        fetchedLogs.push({ id: doc.id, ...doc.data() } as ChangeLog);
      });

      setLogs(fetchedLogs);
    } catch (error) {
      console.error("خطأ في جلب السجلات:", error);
      toast.error("فشل في جلب سجلات التغييرات");
    } finally {
      setIsLoading(false);
    }
  };

  // عند فتح الحوار
  useEffect(() => {
    if (open) {
      loadLogs();
    }
  }, [open]);

  // استعادة نسخة سابقة
  const handleRestore = async (log: ChangeLog) => {
    if (!log.snapshotBefore) {
      toast.error("لا توجد نسخة سابقة لهذا السجل");
      return;
    }

    if (!db) {
      toast.error("قاعدة البيانات غير متاحة");
      return;
    }

    try {
      setIsRestoring(log.id);

      // استعادة البيانات
      const studentRef = doc(db, "students", log.studentId);
      await setDoc(studentRef, log.snapshotBefore);

      // تسجيل عملية الاستعادة
      const restoreLogRef = doc(collection(db, "change_logs"));
      await setDoc(restoreLogRef, {
        timestamp: new Date().toISOString(),
        action: "restore",
        studentId: log.studentId,
        studentName: log.studentName,
        changes: [{
          field: "all",
          oldValue: "current",
          newValue: `restored from ${log.timestamp}`,
        }],
        restoredFrom: log.id,
      });

      toast.success(`تم استعادة بيانات ${log.studentName} بنجاح`);
      
      // تحديث القائمة
      await loadLogs();
      
      // إشعار الكومبوننت الأب
      if (onRestore) {
        await onRestore(log.snapshotBefore);
      }
    } catch (error) {
      console.error("خطأ في الاستعادة:", error);
      toast.error("فشل في استعادة البيانات");
    } finally {
      setIsRestoring(null);
    }
  };

  // تنسيق التاريخ
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // لون حسب نوع العملية
  const getActionBadge = (action: string) => {
    switch (action) {
      case "add":
        return <Badge className="bg-green-500">إضافة</Badge>;
      case "update":
        return <Badge className="bg-blue-500">تعديل</Badge>;
      case "delete":
        return <Badge className="bg-red-500">حذف</Badge>;
      case "bulk_update":
        return <Badge className="bg-purple-500">تحديث جماعي</Badge>;
      case "restore":
        return <Badge className="bg-yellow-500">استعادة</Badge>;
      default:
        return <Badge>{action}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <History className="h-4 w-4" />
          سجلات التغييرات
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">سجلات التغييرات</DialogTitle>
          <DialogDescription>
            عرض جميع التعديلات التي تمت على بيانات الطلاب مع إمكانية الاستعادة
          </DialogDescription>
        </DialogHeader>

        {!db && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              قاعدة البيانات غير متاحة. سجلات التغييرات تعمل فقط مع Firebase.
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            {logs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد سجلات حتى الآن</p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getActionBadge(log.action)}
                          <span className="font-medium">{log.studentName}</span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatDate(log.timestamp)}
                        </p>
                      </div>

                      {log.snapshotBefore && log.action !== "add" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestore(log)}
                          disabled={isRestoring === log.id}
                          className="gap-2"
                        >
                          {isRestoring === log.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              جاري الاستعادة...
                            </>
                          ) : (
                            <>
                              <RotateCcw className="h-4 w-4" />
                              استعادة
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {log.changes && log.changes.length > 0 && (
                      <div className="space-y-2 mt-3 border-t pt-3">
                        {log.changes.map((change, idx) => (
                          <div
                            key={idx}
                            className="text-sm bg-gray-100 rounded px-3 py-2"
                          >
                            <span className="font-medium text-gray-700">
                              {change.field}:
                            </span>{" "}
                            <span className="text-red-600 line-through">
                              {JSON.stringify(change.oldValue)}
                            </span>{" "}
                            →{" "}
                            <span className="text-green-600">
                              {JSON.stringify(change.newValue)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        )}

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-gray-500">
            عرض آخر {logs.length} سجل
          </p>
          <Button variant="outline" onClick={loadLogs} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري التحديث...
              </>
            ) : (
              "تحديث"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
