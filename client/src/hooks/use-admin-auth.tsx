import { createContext, ReactNode, useContext, useEffect, useState, useCallback } from "react";
import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import { adminApiRequest, getAdminQueryFn, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Type for admin user data
interface AdminUser {
  userId: number;
  username: string;
  isAdmin: boolean;
  lastVerified?: number; // Timestamp for verifying freshness of data
}

// Admin auth context type
interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logoutMutation: UseMutationResult<void, Error, void>;
  verifyAdminSession: () => Promise<boolean>;
}

// Create context
const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

// Security check interval (every 5 minutes)
const SECURITY_CHECK_INTERVAL = 5 * 60 * 1000; 

// Provider component
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem("adminAuthenticated") === "true";
  });
  const [securityAlertShown, setSecurityAlertShown] = useState(false);

  // Debug session state
  useEffect(() => {
    console.log("AdminAuthProvider initial state:", { 
      isAuthenticated,
      sessionId: sessionStorage.getItem("adminSessionId"),
      adminAuthenticated: sessionStorage.getItem("adminAuthenticated")
    });
  }, []);

  // Verify admin session function - callable from anywhere
  const verifyAdminSession = useCallback(async (): Promise<boolean> => {
    try {
      const sessionId = sessionStorage.getItem("adminSessionId");
      
      if (!sessionId) {
        return false;
      }
      
      const response = await adminApiRequest("GET", "/api/admin/session");
      const result = await response.json();
      
      if (!result.success || !result.authenticated || !result.isAdmin) {
        // Clear invalid session data
        sessionStorage.removeItem("adminAuthenticated");
        sessionStorage.removeItem("adminSessionId");
        setIsAuthenticated(false);
        return false;
      }
      
      // Session is valid
      return true;
    } catch (error) {
      console.error("Session verification error:", error);
      return false;
    }
  }, []);

  // Check if admin session is valid
  const {
    data,
    isLoading,
    refetch,
  } = useQuery<{ success: boolean; authenticated: boolean; isAdmin: boolean; userId: number; username: string } | null>({
    queryKey: ["/api/admin/session"],
    queryFn: getAdminQueryFn({ on401: "returnNull" }),
    enabled: true, // Always check session status
    retry: false,
    refetchOnWindowFocus: true,
    refetchInterval: SECURITY_CHECK_INTERVAL, // Recheck every 5 minutes for security
  });
  
  // Debug query result
  useEffect(() => {
    console.log("Admin session query result:", data);
  }, [data]);
  
  // Convert API response to AdminUser format with timestamp
  const adminUser: AdminUser | null = data && data.success && data.authenticated ? {
    userId: data.userId,
    username: data.username,
    isAdmin: data.isAdmin,
    lastVerified: Date.now()
  } : null;

  // Effect to update authentication state when data changes
  useEffect(() => {
    // Detect session mismatch (potential hijacking)
    const sessionId = sessionStorage.getItem("adminSessionId");
    const storedAuth = sessionStorage.getItem("adminAuthenticated") === "true";
    
    // Case 1: Server says we're not authenticated but client thinks we are
    if (data && (!data.authenticated || !data.success) && storedAuth) {
      console.warn("Security alert: Session authentication mismatch");
      
      if (!securityAlertShown) {
        toast({
          title: "Security Alert",
          description: "Your session authentication state is invalid. Logging you out for security.",
          variant: "destructive",
        });
        setSecurityAlertShown(true);
      }
      
      // Clear invalid session data
      sessionStorage.removeItem("adminAuthenticated");
      sessionStorage.removeItem("adminSessionId");
      setIsAuthenticated(false);
      
      // Redirect to login page
      setTimeout(() => {
        navigate("/admin/login");
      }, 1500);
      
      return;
    }
    
    // Case 2: Valid admin user
    if (adminUser && adminUser.isAdmin) {
      console.log("Setting authenticated = true from valid admin user");
      setIsAuthenticated(true);
      sessionStorage.setItem("adminAuthenticated", "true");
      return;
    }
    
    // Case 3: User is somehow authenticated but not admin (security issue)
    if (data && data.authenticated && !data.isAdmin && storedAuth) {
      console.warn("Security alert: Non-admin user detected with admin authentication");
      
      toast({
        title: "Security Alert",
        description: "You have been authenticated but lack admin privileges. Logging out for security.",
        variant: "destructive",
      });
      
      // Clear invalid session data
      sessionStorage.removeItem("adminAuthenticated");
      sessionStorage.removeItem("adminSessionId");
      setIsAuthenticated(false);
      
      // Redirect to home page
      setTimeout(() => {
        navigate("/");
      }, 1500);
    }
  }, [data, adminUser, isAuthenticated, navigate, toast, securityAlertShown]);

  // Periodic security check every 30 seconds
  useEffect(() => {
    // Only run if user is authenticated
    if (!isAuthenticated) return;
    
    const securityCheckTimer = setInterval(() => {
      // Verify session freshness
      if (adminUser && adminUser.lastVerified) {
        const timeSinceVerification = Date.now() - adminUser.lastVerified;
        
        // If it's been more than 10 minutes since our last verification, force refetch
        if (timeSinceVerification > 10 * 60 * 1000) {
          console.log("Security check: Session verification expired, refetching");
          refetch();
        }
      } else if (isAuthenticated) {
        // We're authenticated but don't have a lastVerified timestamp - suspicious
        console.warn("Security check: Missing verification timestamp");
        refetch();
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(securityCheckTimer);
  }, [isAuthenticated, adminUser, refetch]);

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await adminApiRequest("POST", "/api/admin/logout");
      } finally {
        // Always clear session storage regardless of API response
        sessionStorage.removeItem("adminAuthenticated");
        sessionStorage.removeItem("adminSessionId");
        setIsAuthenticated(false);
      }
    },
    onSuccess: () => {
      // Invalidate the admin session query
      queryClient.invalidateQueries({ queryKey: ["/api/admin/session"] });
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      
      // Redirect to login page
      navigate("/admin/login");
    },
    onError: (error: Error) => {
      console.error("Logout error:", error);
      
      // Still remove session data even if API request fails
      sessionStorage.removeItem("adminAuthenticated");
      sessionStorage.removeItem("adminSessionId");
      setIsAuthenticated(false);
      
      toast({
        title: "Logout Notice",
        description: "You have been logged out locally. Server notification failed.",
        variant: "destructive",
      });
      
      // Redirect to login page
      navigate("/admin/login");
    },
  });

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser: adminUser || null,
        isLoading,
        isAuthenticated,
        logoutMutation,
        verifyAdminSession
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

// Hook to use the admin auth context
export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  
  return context;
}