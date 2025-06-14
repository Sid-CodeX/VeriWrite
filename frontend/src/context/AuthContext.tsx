// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'teacher' | 'student';

export interface User {
  id: string; // This should ideally be _id if coming from MongoDB
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
  updateProfile: (updatedFields: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Get the base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for saved user and token on initial load
  useEffect(() => {
    const savedUser = localStorage.getItem('veriwrite_user');
    const token = localStorage.getItem('token'); // Get token from localStorage
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: UserRole) => {
    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      const newUser: User = {
        id: data.user._id, // Backend returns _id for MongoDB documents
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
      // In a real application, this would redirect to Google OAuth,
      // and then Google would redirect back to your server's callback,
      // which would then log in the user and return a token.
      // This is still a placeholder, as Google OAuth integration is complex.
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // For demo purposes - replace with actual Google OAuth flow
      const newUser: User = {
        id: Math.random().toString(36).substring(2, 9),
        name: "Google User",
        email: "google.user@example.com",
        role
      };
      setUser(newUser);
      localStorage.setItem('veriwrite_user', JSON.stringify(newUser));
      localStorage.setItem("token", "fake-google-token"); // Store a fake token for demo

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

      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signup failed"); // Backend now returns 'error' key
      }

      // --- NEW: Automatically log in the user after successful signup ---
      const newUser: User = {
        id: data.user._id, // Get _id from the backend response
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
      // Re-throw the error so the calling component can handle it if needed
      throw error;
    } finally {
      setIsLoading(false);
    }
  };


  const logout = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    try {
      if (token) {
        // Call backend logout to cleanup temp files
        const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`, // Send token for authentication
          },
        });

        if (!response.ok) {
          // Log the error but proceed with client-side logout anyway
          console.error("Backend logout failed:", await response.json());
        }
      }
    } catch (error) {
      console.error("Error during backend logout:", error);
    } finally {
      setUser(null);
      localStorage.removeItem("veriwrite_user");
      localStorage.removeItem("token");

      toast({
        title: "Logged out successfully",
      });

      navigate("/");
      setIsLoading(false);
    }
  };


  const updateProfile = async (updatedFields: Partial<User>) => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "No authentication token found. Please log in again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return Promise.reject(new Error("No token"));
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(updatedFields),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Profile update failed");
      }

      const updatedUser: User = {
        ...user!,
        name: data.user.name,
        email: data.user.email, // Ensure email is also updated if backend allows or keep existing
        role: data.user.role, // Ensure role is also updated or keep existing
        id: data.user._id, // Ensure id is consistent
      };
      setUser(updatedUser);
      localStorage.setItem('veriwrite_user', JSON.stringify(updatedUser));

      toast({
        title: "Profile updated successfully",
        description: "Your profile information has been updated.",
      });
    } catch (error) {
      toast({
        title: "Profile update failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      return Promise.reject(error);
    } finally {
      setIsLoading(false);
    }
  };


  const changePassword = async (currentPassword: string, newPassword: string) => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "No authentication token found. Please log in again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return Promise.reject(new Error("No token"));
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Password change failed");
      }

      toast({
        title: "Password changed successfully",
        description: "Your password has been updated.",
      });

      return Promise.resolve();
    } catch (error) {
      toast({
        title: "Password change failed",
        description: error instanceof Error ? error.message : "Invalid current password or unknown error",
        variant: "destructive",
      });
      return Promise.reject(error);
    } finally {
      setIsLoading(false);
    }
  };


  const resetPassword = async (email: string) => {
    setIsLoading(true);
    try {
      // NOTE: This assumes you will implement a backend route for "forgot password" flow.
      // E.g., POST /api/auth/forgot-password that sends an email with a reset link/token.
      // Your backend currently doesn't have a '/reset-password' route that takes just an email.
      // This will need a new backend endpoint.

      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, { // <--- Needs backend implementation
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Password reset request failed");
      }

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