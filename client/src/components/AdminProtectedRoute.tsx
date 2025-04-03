import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Loader2, ShieldAlert, AlertTriangle } from "lucide-react";
import { Redirect, Route, RouteProps } from "wouter";
import { ReactNode, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface AdminProtectedRouteProps extends RouteProps {
  children: ReactNode;
}

/**
 * A route that requires admin authentication
 * Redirects to login page if not authenticated
 * Implements multiple security checks to prevent unauthorized access
 */
export function AdminProtectedRoute({ children, ...rest }: AdminProtectedRouteProps) {
  const { isAuthenticated, isLoading, adminUser, logoutMutation } = useAdminAuth();
  const { toast } = useToast();
  const [securityCheckPassed, setSecurityCheckPassed] = useState<boolean | null>(null);
  const [securityCheckInProgress, setSecurityCheckInProgress] = useState(true);
  
  // Perform additional security validations
  useEffect(() => {
    const validateSecurityContext = async () => {
      try {
        // 1. Check if we have a valid session ID in storage
        const sessionId = sessionStorage.getItem("adminSessionId");
        const isAdminAuth = sessionStorage.getItem("adminAuthenticated") === "true";
        
        if (!sessionId || !isAdminAuth) {
          setSecurityCheckPassed(false);
          setSecurityCheckInProgress(false);
          return;
        }
        
        // 2. Check if the admin user object matches expected structure
        if (adminUser) {
          // Ensure we have required admin properties
          if (typeof adminUser.isAdmin !== 'boolean' || 
              typeof adminUser.userId !== 'number' || 
              typeof adminUser.username !== 'string') {
            console.error("Invalid admin user data structure:", adminUser);
            setSecurityCheckPassed(false);
            setSecurityCheckInProgress(false);
            
            // Log out to clear potentially corrupted session
            await logoutMutation.mutateAsync();
            return;
          }
          
          // 3. Verify admin has required privileges
          if (!adminUser.isAdmin) {
            console.warn("User logged in but lacks admin privileges");
            setSecurityCheckPassed(false);
            setSecurityCheckInProgress(false);
            return;
          }
        }
        
        // If we reach here and authentication is confirmed, mark as passed
        if (!isLoading && isAuthenticated && adminUser) {
          setSecurityCheckPassed(true);
        } else if (!isLoading) {
          setSecurityCheckPassed(false);
        }
        
        setSecurityCheckInProgress(false);
      } catch (error) {
        console.error("Security check error:", error);
        setSecurityCheckPassed(false);
        setSecurityCheckInProgress(false);
        
        toast({
          title: "Security Alert",
          description: "A security validation failed. Please try logging in again.",
          variant: "destructive"
        });
      }
    };
    
    validateSecurityContext();
  }, [isAuthenticated, isLoading, adminUser, logoutMutation, toast]);
  
  // For debugging only
  console.log("AdminProtectedRoute:", { 
    isAuthenticated, 
    isLoading, 
    adminUser, 
    sessionStorageAuth: sessionStorage.getItem("adminAuthenticated"),
    path: rest.path,
    securityCheckPassed,
    securityCheckInProgress
  });
  
  return (
    <Route
      {...rest}
      component={() => {
        // Show loading spinner while checking authentication or security
        if (isLoading || securityCheckInProgress) {
          return (
            <div className="flex flex-col justify-center items-center h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-green-600 mb-4" />
              <p className="text-green-800">Verifying security credentials...</p>
            </div>
          );
        }
        
        // Check if security validations passed
        if (securityCheckPassed === false) {
          // Display security alert briefly before redirecting
          setTimeout(() => {
            // Clear any potentially compromised session data
            sessionStorage.removeItem("adminSessionId");
            sessionStorage.removeItem("adminAuthenticated");
            window.location.href = "/admin/login";
          }, 2000);
          
          return (
            <div className="flex flex-col justify-center items-center h-screen bg-red-50">
              <ShieldAlert className="h-16 w-16 text-red-600 mb-4" />
              <h2 className="text-xl font-bold text-red-800 mb-2">Security Alert</h2>
              <p className="text-red-700 mb-6">Unauthorized access detected</p>
              <AlertTriangle className="h-6 w-6 text-red-600 animate-pulse" />
              <p className="text-sm text-red-700 mt-2">Redirecting to secure login...</p>
            </div>
          );
        }
        
        // Additional admin validation - ensure admin field is properly set
        if (adminUser && !adminUser.isAdmin) {
          return <Redirect to="/" />;
        }
        
        // All checks passed, render protected content
        return <>{children}</>;
      }}
    />
  );
}