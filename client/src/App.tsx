import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { QueryProvider } from "./components/QueryProvider";
import { Loader2 } from "lucide-react";

// Eager loading للصفحات المهمة (Home)
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

// Lazy loading للصفحات الأقل استخداماً
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">جارٍ التحميل...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/student/:id" component={StudentDashboard} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}

export default App;
