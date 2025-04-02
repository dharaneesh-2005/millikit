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
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

function PublicRoutes() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/products" component={Products} />
        <Route path="/product/:slug" component={ProductDetail} />
        <Route path="/contact" component={Contact} />
        <Route path="/cart" component={Cart} />
        <Route path="/checkout" component={Checkout} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <LanguageProvider>
      <CartProvider>
        <Switch>
          {/* Admin Routes */}
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/products/new" component={ProductForm} />
          <Route path="/admin/products/:id" component={ProductForm} />
          
          {/* Public Routes - must be last to allow other routes to match first */}
          <Route component={PublicRoutes} />
        </Switch>
        <Toaster />
      </CartProvider>
    </LanguageProvider>
  );
}

export default App;
