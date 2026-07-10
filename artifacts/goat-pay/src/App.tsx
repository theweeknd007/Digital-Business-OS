import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import { AppLayout } from "./components/layout/AppLayout";

import LoginPage from "./pages/login";
import Dashboard from "./pages/dashboard";
import Products from "./pages/products";
import Sales from "./pages/sales";
import Wallet from "./pages/wallet";
import Withdrawals from "./pages/withdrawals";
import Affiliates from "./pages/affiliates";
import Settings from "./pages/settings";
import NotificationsPage from "./pages/notifications";
import AdminPage from "./pages/admin";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        if ((error as { status?: number })?.status === 401) return false;
        return failureCount < 2;
      },
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [loading, user, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "hsl(135,20%,2%)" }}>
        <div className="flex flex-col items-center gap-3">
          <img src="/goat-logo.png" alt="GOAT-PAY" className="w-12 h-12 object-contain animate-pulse" />
          <div className="w-5 h-5 border-2 rounded-full animate-spin"
            style={{ borderColor: "#00e676", borderTopColor: "transparent" }} />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/login" />
      </Route>
      <Route path="/login" component={LoginPage} />
      <Route>
        <ProtectedRoute>
          <AppLayout>
            <Switch>
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/products" component={Products} />
              <Route path="/sales" component={Sales} />
              <Route path="/wallet" component={Wallet} />
              <Route path="/withdrawals" component={Withdrawals} />
              <Route path="/affiliates" component={Affiliates} />
              <Route path="/settings" component={Settings} />
              <Route path="/notifications" component={NotificationsPage} />
              <Route path="/admin" component={AdminPage} />
              <Route component={NotFound} />
            </Switch>
          </AppLayout>
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationsProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
              <Toaster />
            </TooltipProvider>
          </QueryClientProvider>
        </NotificationsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
