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
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Ensure cookies (including JWT) are sent
      });
      
      if (!response.ok) {
        throw new Error('Authentication failed');
      }
      
      return response.json();
    },
    retry: false,
    enabled: true, // Enable by default to check auth status on load
    onSuccess: (data) => {
      console.log('Auth check successful:', data);
      if (data && data.user) {
        setUser(data.user);
        // Also store in localStorage as backup
        localStorage.setItem('user', JSON.stringify(data.user));

        // Store tenant data if available
        if (data.tenant) {
          localStorage.setItem('tenant', JSON.stringify(data.tenant));
        }
      }
    },
    onError: (error) => {
      console.log('Auth check failed:', error);
      // On error, try to use localStorage as fallback
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        console.log('Using stored user from localStorage');
        setUser(JSON.parse(storedUser));
      }
    }
  });

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

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
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
