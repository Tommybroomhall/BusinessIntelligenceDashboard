import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import DashboardLayout from "@/layouts/dashboard-layout";
import Dashboard from "@/pages/dashboard";
import Sales from "@/pages/sales";
import Traffic from "@/pages/traffic";
import Customers from "@/pages/customers";
import Products from "@/pages/Products";
import Settings from "@/pages/settings";
import Login from "@/pages/login";
import { AuthProvider } from "@/context/auth-context";
import { TenantProvider } from "@/context/tenant-context";
import { useEffect } from "react";
import { initVercelAnalytics, initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  // This is a simplified version - in a real app, we'd check auth state
  // and redirect if not authenticated
  return <Component />;
}

function Router() {
  // Track page views when routes change
  useAnalytics();

  return (
    <Switch>
      <Route path="/login" component={Login} />

      <Route path="/">
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      </Route>

      <Route path="/sales">
        <DashboardLayout>
          <Sales />
        </DashboardLayout>
      </Route>

      <Route path="/traffic">
        <DashboardLayout>
          <Traffic />
        </DashboardLayout>
      </Route>

      <Route path="/customers">
        <DashboardLayout>
          <Customers />
        </DashboardLayout>
      </Route>

      <Route path="/products">
        <DashboardLayout>
          <Products />
        </DashboardLayout>
      </Route>

      <Route path="/settings">
        <DashboardLayout>
          <Settings />
        </DashboardLayout>
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize Vercel Analytics and Google Analytics when app loads
  useEffect(() => {
    // Initialize Vercel Analytics
    initVercelAnalytics();

    // Initialize Google Analytics if measurement ID is present
    if (import.meta.env.VITE_GA_MEASUREMENT_ID) {
      initGA();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TenantProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </TenantProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
