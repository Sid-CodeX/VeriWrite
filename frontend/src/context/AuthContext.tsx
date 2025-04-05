
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
  updateProfile: (updatedUser: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }
  
      const newUser: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      };
  
      setUser(newUser);
      localStorage.setItem("veriwrite_user", JSON.stringify(newUser));
      localStorage.setItem("token", data.token); // Store JWT token
  
      toast({
        title: "Login successful",
        description: `Welcome back, ${newUser.name}!`,
      });
  
      navigate(role === "teacher" ? "/classroom" : "/student-dashboard");
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
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, role }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }
  
      const newUser: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      };
  
      setUser(newUser);
      localStorage.setItem("veriwrite_user", JSON.stringify(newUser));
      localStorage.setItem("token", data.token); // Store JWT token
  
      toast({
        title: "Account created successfully",
        description: `Welcome to VeriWrite, ${name}!`,
      });
  
      navigate(role === "teacher" ? "/classroom" : "/student-dashboard");
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
  localStorage.removeItem("veriwrite_user");
  localStorage.removeItem("token"); // Remove token

  toast({
    title: "Logged out successfully",
  });

  navigate("/");
};


  // New function to update user profile
  const updateProfile = async (updatedUser: Partial<User>) => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      if (user) {
        const newUser = { ...user, ...updatedUser };
        setUser(newUser);
        localStorage.setItem('veriwrite_user', JSON.stringify(newUser));
        
        toast({
          title: "Profile updated successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Profile update failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // New function to change password
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setIsLoading(true);
      // Simulate API call - in a real app, this would verify the current password
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // For demo purposes, we'll just show a success message
      toast({
        title: "Password changed successfully",
        description: "Your password has been updated.",
      });
      
      return Promise.resolve();
    } catch (error) {
      toast({
        title: "Password change failed",
        description: error instanceof Error ? error.message : "Invalid current password",
        variant: "destructive",
      });
      return Promise.reject(error);
    } finally {
      setIsLoading(false);
    }
  };

  // New function to reset password (for forgot password flow)
  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // For demo purposes, we'll just show a success message
      toast({
        title: "Password reset email sent",
        description: `Instructions to reset your password have been sent to ${email}`,
      });
      
      return Promise.resolve();
    } catch (error) {
      toast({
        title: "Password reset failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      return Promise.reject(error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    login,
    googleLogin,
    signup,
    logout,
    isAuthenticated: !!user,
    updateProfile,
    changePassword,
    resetPassword,
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
