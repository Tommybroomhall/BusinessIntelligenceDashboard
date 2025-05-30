import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [, navigate] = useLocation();

  // Check if the user is authenticated
  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Ensure cookies (including JWT) are sent
      });

      if (!response.ok) {
        // If unauthorized, clear any stored user data
        if (response.status === 401) {
          localStorage.removeItem('user');
          localStorage.removeItem('tenant');
        }
        throw new Error(`Authentication failed: ${response.status}`);
      }

      return response.json();
    },
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (unauthorized) errors
      if (error?.message?.includes('401')) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    enabled: true, // Enable by default to check auth status on load
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (renamed from cacheTime)
  });

  // Handle authentication state changes using useEffect (modern React Query pattern)
  useEffect(() => {
    console.log('Auth state update:', {
      hasData: !!data,
      hasUser: !!(data?.user),
      hasError: !!error,
      isLoading,
      errorMessage: error?.message
    });

    if (data && data.user) {
      console.log('Auth check successful:', data);
      setUser(data.user);
      // Store in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(data.user));

      // Store tenant data if available
      if (data.tenant) {
        localStorage.setItem('tenant', JSON.stringify(data.tenant));
      }
    } else if (error) {
      console.log('Auth check failed:', error);
      // Clear user state on authentication failure
      setUser(null);
      // Clear stored data if it's an auth error
      if (error?.message?.includes('401')) {
        localStorage.removeItem('user');
        localStorage.removeItem('tenant');
      }
    }
  }, [data, error, isLoading]);

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login with:', email);
      // Make a real API call to authenticate
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Important for cookies (JWT will be set as an HTTP-only cookie)
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      console.log('Login successful:', data);

      // Store user in local storage as a backup
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);

      // Also store tenant data
      if (data.tenant) {
        localStorage.setItem('tenant', JSON.stringify(data.tenant));
      }

      // Refetch user data to ensure state is updated
      await refetch();

      // Return data to the login component
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call the logout API to clear the JWT cookie on the server
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Ensure cookies are sent with the request
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and state regardless of API success
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');
      setUser(null);
      navigate('/login');
    }
  };

  // Calculate authentication status properly
  // Use data directly from React Query if available, otherwise fall back to user state
  const currentUser = data?.user || user;
  const storedUser = localStorage.getItem('user');

  // Consider authenticated if:
  // 1. We have current user data (from query or state) OR
  // 2. We're still loading and have stored user data
  const isAuthenticated = !!currentUser || (isLoading && !!storedUser);

  // Debug logging (can be removed in production)
  // console.log('Auth calculation:', {
  //   isLoading,
  //   hasQueryData: !!data?.user,
  //   hasUser: !!user,
  //   hasCurrentUser: !!currentUser,
  //   hasStoredUser: !!storedUser,
  //   isAuthenticated
  // });

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        isAuthenticated,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
