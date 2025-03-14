
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  googleLogin: (role: UserRole) => Promise<void>;
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for saved user on initial load
  useEffect(() => {
    const savedUser = localStorage.getItem('veriwrite_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: UserRole) => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // For demo purposes - in a real app, this would validate against a backend
      if (email && password) {
        const newUser: User = {
          id: Math.random().toString(36).substring(2, 9),
          name: email.split('@')[0],
          email,
          role
        };
        setUser(newUser);
        localStorage.setItem('veriwrite_user', JSON.stringify(newUser));
        
        toast({
          title: "Login successful",
          description: `Welcome back, ${newUser.name}!`,
        });
        
        navigate(role === 'teacher' ? '/classroom' : '/student-dashboard');
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (role: UserRole) => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // For demo purposes
      const newUser: User = {
        id: Math.random().toString(36).substring(2, 9),
        name: "Google User",
        email: "google.user@example.com",
        role
      };
      setUser(newUser);
      localStorage.setItem('veriwrite_user', JSON.stringify(newUser));
      
      toast({
        title: "Google login successful",
        description: `Welcome, ${newUser.name}!`,
      });
      
      navigate(role === 'teacher' ? '/classroom' : '/student-dashboard');
    } catch (error) {
      toast({
        title: "Google login failed",
        description: "Could not authenticate with Google",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, role: UserRole) => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // For demo purposes
      const newUser: User = {
        id: Math.random().toString(36).substring(2, 9),
        name,
        email,
        role
      };
      setUser(newUser);
      localStorage.setItem('veriwrite_user', JSON.stringify(newUser));
      
      toast({
        title: "Account created successfully",
        description: `Welcome to VeriWrite, ${name}!`,
      });
      
      navigate(role === 'teacher' ? '/classroom' : '/student-dashboard');
    } catch (error) {
      toast({
        title: "Signup failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('veriwrite_user');
    toast({
      title: "Logged out successfully",
    });
    navigate('/');
  };

  const value = {
    user,
    isLoading,
    login,
    googleLogin,
    signup,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
