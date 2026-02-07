/*
 * QueryProvider - React Query Provider للتخزين المؤقت الذكي
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

// إنشاء Query Client مع إعدادات محسنة
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Cache البيانات لمدة 5 دقائق
            gcTime: 1000 * 60 * 5,
            // اعتبار البيانات قديمة بعد دقيقة واحدة
            staleTime: 1000 * 60 * 1,
            // إعادة جلب البيانات عند focus النافذة
            refetchOnWindowFocus: true,
            // إعادة المحاولة مرة واحدة فقط عند الفشل
            retry: 1,
            // عرض البيانات المخزنة مؤقتاً أثناء إعادة الجلب
            refetchOnMount: "always",
        },
    },
});

interface QueryProviderProps {
    children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
