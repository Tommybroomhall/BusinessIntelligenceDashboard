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
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [, navigate] = useLocation();
  
  // Check if the user is authenticated
  const { data, isLoading } = useQuery({ 
    queryKey: ['/api/auth/me'],
    retry: false,
    enabled: false // We'll handle authentication differently in this demo
  });
  
  useEffect(() => {
    // For demo purposes, we'll simulate authentication check
    const checkAuth = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };
    
    checkAuth();
  }, []);
  
  const login = async (email: string, password: string) => {
    // In a real app, this would make an API call to authenticate
    // For demo, we'll simulate a successful login
    
    const mockUser = {
      id: "user-1",
      name: "Jane Smith",
      email: email,
      role: "Admin"
    };
    
    // Store user in local storage
    localStorage.setItem('user', JSON.stringify(mockUser));
    setUser(mockUser);
  };
  
  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
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
