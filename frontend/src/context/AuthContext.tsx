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
  updateProfile: (updatedFields: Partial<User>) => Promise<void>; // Changed type to Partial<User>
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
      // Potentially, you could also verify the token with your backend here
      // to ensure it's still valid and get the latest user data.
      // For this example, we'll assume a valid token means valid user data.
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
        body: JSON.stringify({ email, password, role }), // Ensure backend expects 'role'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed"); // Backend sends 'error' key
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
        throw new Error(data.error || "Signup failed"); // Backend sends 'error' key
      }

      // Backend signup doesn't return user and token for direct login after signup,
      // so if you want to automatically log in the user, you'd need to modify your backend
      // to return the token and user object, or call the login function here.
      // For now, we'll just show success and let the user log in.
      // If you modify backend to return user & token, uncomment/adjust below:
      /*
      const newUser: User = {
        id: data.user._id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      };
      setUser(newUser);
      localStorage.setItem("veriwrite_user", JSON.stringify(newUser));
      localStorage.setItem("token", data.token);
      */

      toast({
        title: "Account created successfully",
        description: `You can now log in with your new account.`,
      });

      // You might want to redirect to login page instead if not auto-logging in
      // navigate("/login");
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


  const logout = async () => { // Made async to await backend logout call
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


  // Updated function to update user profile with actual API call
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
          "Authorization": `Bearer ${token}`, // Send the JWT token
        },
        body: JSON.stringify(updatedFields), // Send the fields to update (e.g., { name: "New Name" })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Profile update failed");
      }

      // Update the user state and local storage
      const updatedUser: User = {
        ...user!, // Use non-null assertion as we check for token above, implying user exists
        ...updatedFields,
        // The backend `profile` route should return the updated user, ensure `_id` is mapped to `id`
        // Assuming backend returns { message: "...", user: { _id, name, email, role } }
        name: data.user.name, // Take name from backend response
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

  // Updated function to change password with actual API call
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
          "Authorization": `Bearer ${token}`, // Send the JWT token
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Password change failed"); // Backend sends 'error' key
      }

      toast({
        title: "Password changed successfully",
        description: "Your password has been updated.",
      });

      // No need to update user state here as only password changed, not visible user data
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

  // New function to reset password (for forgot password flow - this still needs a backend route)
  const resetPassword = async (email: string) => {
    setIsLoading(true);
    try {
      // NOTE: This assumes you will implement a backend route for "forgot password" flow.
      // E.g., POST /api/auth/forgot-password that sends an email with a reset link/token.
      // Your backend currently doesn't have a '/reset-password' route that takes just an email.
      // This will need a new backend endpoint.

      // Example placeholder for a future backend route:
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