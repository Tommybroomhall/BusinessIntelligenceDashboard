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
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/tenant'],
    queryFn: async () => {
      const response = await fetch('/api/tenant', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch tenant');
      }
      
      const tenantData = await response.json();
      
      // Map _id to id for interface compatibility
      return {
        ...tenantData,
        id: tenantData._id || tenantData.id
      };
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update state when data changes (modern React Query pattern)
  useEffect(() => {
    if (data) {
      console.log('🏢 Tenant data loaded:', data);
      setTenantState(data);
      localStorage.setItem('tenant', JSON.stringify(data));
    } else if (error) {
      console.error('Error loading tenant:', error);
      // Fallback to localStorage
      const storedTenant = localStorage.getItem('tenant');
      if (storedTenant) {
        try {
          const parsedTenant = JSON.parse(storedTenant);
          setTenantState(parsedTenant);
          console.log('🏢 Using stored tenant data:', parsedTenant);
        } catch (e) {
          console.error('Failed to parse stored tenant data:', e);
        }
      }
    }
  }, [data, error]);

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
