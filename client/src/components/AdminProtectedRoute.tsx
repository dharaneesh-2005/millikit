import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, RouteProps } from "wouter";
import { ReactNode } from "react";

interface AdminProtectedRouteProps extends RouteProps {
  children: ReactNode;
}

/**
 * A route that requires admin authentication
 * Redirects to login page if not authenticated
 */
export function AdminProtectedRoute({ children, ...rest }: AdminProtectedRouteProps) {
  const { isAuthenticated, isLoading, adminUser } = useAdminAuth();
  
  return (
    <Route
      {...rest}
      component={() => {
        // Show loading spinner while checking authentication
        if (isLoading) {
          return (
            <div className="flex justify-center items-center h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          );
        }
        
        // Redirect to login if not authenticated
        if (!isAuthenticated || !adminUser) {
          return <Redirect to="/admin/login" />;
        }
        
        // Redirect to home if authenticated but not admin
        if (!adminUser.isAdmin) {
          return <Redirect to="/" />;
        }
        
        // Render the protected content
        return <>{children}</>;
      }}
    />
  );
}