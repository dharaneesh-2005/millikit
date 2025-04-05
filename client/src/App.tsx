import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Contact from "@/pages/Contact";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import AdminDashboard from "@/pages/admin/Dashboard";
import ProductForm from "@/pages/admin/ProductForm";
// Using simplified Admin Login without Google Authenticator
import AdminLogin from "@/pages/admin/AdminLoginNew";
import AuthPage from "@/pages/auth-page";
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/hooks/use-auth";
import { AdminAuthProvider } from "@/hooks/use-admin-auth";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { ProtectedRoute } from "@/lib/protected-route";
import { Component, ErrorInfo, ReactNode } from "react";

// Error Boundary component to catch errors in the component tree
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode, fallback?: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { 
    hasError: false, 
    error: null 
  };
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { 
      hasError: true, 
      error 
    };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("React Error Boundary caught an error:", error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-4">
          <h1 className="text-2xl text-red-700 mb-4">Something went wrong</h1>
          <pre className="bg-white p-4 rounded-md shadow overflow-auto max-w-full max-h-96 text-sm">
            {this.state.error?.message || "Unknown error"}
          </pre>
          <button 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

function PublicRoutes() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/products" component={Products} />
        <Route path="/product/:slug" component={ProductDetail} />
        <Route path="/contact" component={Contact} />
        <Route path="/cart" component={Cart} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ErrorBoundary>
          <AuthProvider>
            <ErrorBoundary>
              <CartProvider>
                <ErrorBoundary>
                  <AdminAuthProvider>
                    <ErrorBoundary>
                      <div className="app-container">
                        <Switch>
                          {/* Admin Auth Route */}
                          <Route path="/admin/login">
                            <ErrorBoundary>
                              <AdminLogin />
                            </ErrorBoundary>
                          </Route>
                          
                          {/* Protected Admin Routes */}
                          <AdminProtectedRoute path="/admin">
                            <ErrorBoundary>
                              <AdminDashboard />
                            </ErrorBoundary>
                          </AdminProtectedRoute>
                          
                          <AdminProtectedRoute path="/admin/products/new">
                            <ErrorBoundary>
                              <ProductForm />
                            </ErrorBoundary>
                          </AdminProtectedRoute>
                          
                          <AdminProtectedRoute path="/admin/products/:id">
                            <ErrorBoundary>
                              <ProductForm />
                            </ErrorBoundary>
                          </AdminProtectedRoute>

                          {/* Public Checkout Route - no protection */}
                          <Route path="/checkout">
                            <ErrorBoundary>
                              <Checkout />
                            </ErrorBoundary>
                          </Route>
                          
                          {/* Public Routes - must be last to allow other routes to match first */}
                          <Route>
                            <ErrorBoundary>
                              <PublicRoutes />
                            </ErrorBoundary>
                          </Route>
                        </Switch>
                        <Toaster />
                      </div>
                    </ErrorBoundary>
                  </AdminAuthProvider>
                </ErrorBoundary>
              </CartProvider>
            </ErrorBoundary>
          </AuthProvider>
        </ErrorBoundary>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
