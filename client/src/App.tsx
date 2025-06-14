import { Switch, Route, useLocation } from "wouter";
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
import Updates from "@/pages/updates";
import Settings from "@/pages/settings";
import OrderDetail from "@/pages/order-detail";
import Profile from "@/pages/profile";
import Login from "@/pages/login";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { TenantProvider } from "@/context/tenant-context";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { useEffect } from "react";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    // Only redirect if we're not loading AND not authenticated
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Only render component if authenticated
  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

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
          <ProtectedRoute component={Dashboard} />
        </DashboardLayout>
      </Route>

      <Route path="/sales">
        <DashboardLayout>
          <ProtectedRoute component={Sales} />
        </DashboardLayout>
      </Route>

      <Route path="/traffic">
        <DashboardLayout>
          <ProtectedRoute component={Traffic} />
        </DashboardLayout>
      </Route>

      <Route path="/customers">
        <DashboardLayout>
          <ProtectedRoute component={Customers} />
        </DashboardLayout>
      </Route>

      <Route path="/products">
        <DashboardLayout>
          <ProtectedRoute component={Products} />
        </DashboardLayout>
      </Route>

      <Route path="/updates">
        <DashboardLayout>
          <ProtectedRoute component={Updates} />
        </DashboardLayout>
      </Route>

      <Route path="/settings">
        <DashboardLayout>
          <ProtectedRoute component={Settings} />
        </DashboardLayout>
      </Route>

      <Route path="/profile">
        <DashboardLayout>
          <ProtectedRoute component={Profile} />
        </DashboardLayout>
      </Route>

      <Route path="/orders/:id">
        <DashboardLayout>
          <ProtectedRoute component={OrderDetail} />
        </DashboardLayout>
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize Google Analytics when app loads
  useEffect(() => {
    // Initialize Google Analytics if measurement ID is present
    if (import.meta.env.VITE_GA_MEASUREMENT_ID) {
      initGA();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TenantProvider>
          <CurrencyProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </CurrencyProvider>
        </TenantProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
