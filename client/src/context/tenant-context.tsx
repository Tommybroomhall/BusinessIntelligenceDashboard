import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

interface Tenant {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  logoUrl?: string;
}

interface TenantContextType {
  tenant: Tenant | null;
  isLoading: boolean;
  setTenant: (tenant: Tenant) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenantState] = useState<Tenant | null>(null);

  // Fetch tenant data
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/tenant'],
    retry: false,
    enabled: false, // We'll enable it manually
    onSuccess: (data) => {
      if (data) {
        setTenantState(data);
        localStorage.setItem('tenant', JSON.stringify(data));
      }
    },
    onError: () => {
      // On error, try to use localStorage as fallback
      const storedTenant = localStorage.getItem('tenant');
      if (storedTenant) {
        setTenantState(JSON.parse(storedTenant));
      }
    }
  });

  useEffect(() => {
    // Try to fetch the tenant from the API
    const loadTenant = async () => {
      try {
        await refetch();
      } catch (error) {
        console.error('Error loading tenant:', error);
        // Fallback to localStorage
        const storedTenant = localStorage.getItem('tenant');
        if (storedTenant) {
          setTenantState(JSON.parse(storedTenant));
        }
      }
    };

    loadTenant();
  }, [refetch]);

  const setTenant = (newTenant: Tenant) => {
    localStorage.setItem('tenant', JSON.stringify(newTenant));
    setTenantState(newTenant);
  };

  return (
    <TenantContext.Provider
      value={{
        tenant,
        isLoading,
        setTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
