import { useEffect, useState } from "react";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

export function AdminProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if admin is authenticated
    const checkAuthentication = () => {
      const adminAuth = sessionStorage.getItem("adminAuthenticated");
      setIsAuthenticated(adminAuth === "true");
    };

    checkAuthentication();
  }, []);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect to="/admin/login" />;
  }

  // Render the protected component if authenticated
  return <Component />;
}