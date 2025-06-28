import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api'; 

// User role types
export type UserRole = 'teacher' | 'student';

// User object shape
export interface User {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
}

// Context value shape
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

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component to wrap the app
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const navigate = useNavigate();
    const { toast } = useToast();

    // Decode JWT token to extract payload
    const parseJwt = (token: string) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error("Error parsing JWT:", e);
            return null;
        }
    };

    // Global handler for session expiry (used by interceptor)
    const triggerSessionExpired = useCallback((message: string) => {
        setUser(null);
        localStorage.removeItem("veriwrite_user");
        localStorage.removeItem("token");
        toast({
            title: "Session Expired",
            description: message,
            variant: "destructive",
        });
        navigate("/auth");
    }, [navigate, toast]);

    // Expose logout handler to global scope for interceptor usage
    useEffect(() => {
        (window as any).triggerSessionExpired = triggerSessionExpired;
        return () => {
            delete (window as any).triggerSessionExpired;
        };
    }, [triggerSessionExpired]);

    // On initial load, validate saved user/token from localStorage
    useEffect(() => {
        const savedUser = localStorage.getItem('veriwrite_user');
        const token = localStorage.getItem('token');

        if (savedUser && token) {
            const decodedToken = parseJwt(token);
            if (decodedToken && decodedToken.exp * 1000 > Date.now()) {
                setUser(JSON.parse(savedUser));
            } else {
                triggerSessionExpired("Your session has expired. Please log in again.");
            }
        }
        setIsLoading(false);
    }, [triggerSessionExpired]);

    // Standard email/password login
    const login = async (email: string, password: string, role: UserRole) => {
        try {
            setIsLoading(true);
            const response = await fetch(`${api.defaults.baseURL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, role }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Login failed");

            const newUser: User = {
                _id: data.user._id,
                name: data.user.name,
                email: data.user.email,
                role: data.user.role,
            };

            setUser(newUser);
            localStorage.setItem("veriwrite_user", JSON.stringify(newUser));
            localStorage.setItem("token", data.token);

            toast({ title: "Login successful", description: `Welcome back, ${newUser.name}!` });
            navigate(role === "teacher" ? "/classroom" : "/student-dashboard");
        } catch (error) {
            toast({
                title: "Login failed",
                description: error instanceof Error ? error.message : "Unknown error",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Placeholder Google login logic (mocked)
    const googleLogin = async (role: UserRole) => {
        try {
            setIsLoading(true);
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulated delay

            const newUser: User = {
                _id: Math.random().toString(36).substring(2, 9),
                name: "Google User",
                email: "google.user@example.com",
                role
            };

            setUser(newUser);
            localStorage.setItem('veriwrite_user', JSON.stringify(newUser));
            localStorage.setItem("token", "fake-google-token");

            toast({ title: "Google login successful", description: `Welcome, ${newUser.name}!` });
            navigate(role === 'teacher' ? '/classroom' : '/student-dashboard');
        } catch {
            toast({
                title: "Google login failed",
                description: "Could not authenticate with Google",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Register new user and auto-login
    const signup = async (name: string, email: string, password: string, role: UserRole) => {
        try {
            setIsLoading(true);
            const response = await fetch(`${api.defaults.baseURL}/api/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, role }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Signup failed");

            const newUser: User = {
                _id: data.user._id,
                name: data.user.name,
                email: data.user.email,
                role: data.user.role,
            };

            setUser(newUser);
            localStorage.setItem("veriwrite_user", JSON.stringify(newUser));
            localStorage.setItem("token", data.token);

            toast({
                title: "Account created",
                description: `Welcome to VeriWrite, ${name}!`,
            });

            navigate(role === "teacher" ? "/classroom" : "/student-dashboard");
        } catch (error) {
            toast({
                title: "Signup failed",
                description: error instanceof Error ? error.message : "Unknown error",
                variant: "destructive",
            });
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Logout and clean up local/session data
    const logout = async () => {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        try {
            if (token) {
                await fetch(`${api.defaults.baseURL}/api/auth/logout`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                });
            }
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setUser(null);
            localStorage.removeItem("veriwrite_user");
            localStorage.removeItem("token");

            toast({ title: "Logged out successfully" });
            navigate("/");
            setIsLoading(false);
        }
    };

    // Update user profile info
    const updateProfile = async (updatedFields: Partial<User>) => {
        setIsLoading(true);
        try {
            const response = await api.put(`/api/auth/profile`, updatedFields);
            const data = response.data;

            const updatedUser: User = {
                ...user!,
                name: data.user.name,
                email: data.user.email,
                role: data.user.role,
                _id: data.user._id,
            };

            setUser(updatedUser);
            localStorage.setItem('veriwrite_user', JSON.stringify(updatedUser));

            toast({
                title: "Profile updated",
                description: "Your profile has been saved.",
            });
        } catch (error: any) {
            toast({
                title: "Update failed",
                description: error.response?.data?.error || error.message || "Unknown error",
                variant: "destructive",
            });
            return Promise.reject(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Change user password
    const changePassword = async (currentPassword: string, newPassword: string) => {
        setIsLoading(true);
        try {
            const response = await api.put(`/api/auth/change-password`, { currentPassword, newPassword });
            if (response.status !== 200) throw new Error("Password change failed");

            toast({
                title: "Password changed",
                description: "Your password has been updated.",
            });
            return Promise.resolve();
        } catch (error: any) {
            toast({
                title: "Password change failed",
                description: error.response?.data?.error || error.message,
                variant: "destructive",
            });
            return Promise.reject(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Placeholder for password reset feature
    const resetPassword = async (email: string) => {
        setIsLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            toast({
                title: "Feature not available",
                description: "Password reset will be added in future versions.",
            });
            return Promise.resolve();
        } catch (error) {
            toast({
                title: "Unexpected error",
                description: "An error occurred in resetPassword placeholder.",
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

// Hook to access auth context safely
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
