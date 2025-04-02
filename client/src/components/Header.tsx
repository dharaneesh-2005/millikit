import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/contexts/CartContext";
import { useTranslation } from "@/contexts/LanguageContext";

export default function Header() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [location] = useLocation();
  const { cartItems } = useCart();
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);

  // Calculate total items in cart
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  // Check if current path matches (for active links)
  const isActivePath = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  // Handle scroll event for header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`fixed w-full top-0 z-50 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-transparent'} transition-all duration-300`}>
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-yellow-500">
              <span className="text-green-700">Milli</span>kit
            </span>
          </Link>
          
          <div className="hidden md:flex space-x-8">
            <Link href="/" 
              className={`${isActivePath('/') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'} transition-colors`}>
              {t('home')}
            </Link>
            <Link href="/products" 
              className={`${isActivePath('/products') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'} transition-colors`}>
              {t('products')}
            </Link>
            <Link href="/contact" 
              className={`${isActivePath('/contact') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'} transition-colors`}>
              {t('contact')}
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/cart" className="relative text-gray-700 hover:text-green-600 transition-colors">
              <i className="fas fa-shopping-cart text-xl"></i>
              {cartItemCount > 0 && (
                <span className="cart-count absolute -top-2 -right-2 bg-yellow-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {cartItemCount}
                </span>
              )}
            </Link>
            <button 
              className="md:hidden text-gray-700"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu">
              <i className={`fas ${showMobileMenu ? 'fa-times' : 'fa-bars'}`}></i>
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <div className={`md:hidden ${showMobileMenu ? 'block' : 'hidden'} py-4`}>
          <Link href="/" 
            className={`block py-2 ${isActivePath('/') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'} transition-colors`}
            onClick={() => setShowMobileMenu(false)}>
            {t('home')}
          </Link>
          <Link href="/products" 
            className={`block py-2 ${isActivePath('/products') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'} transition-colors`}
            onClick={() => setShowMobileMenu(false)}>
            {t('products')}
          </Link>
          <Link href="/contact" 
            className={`block py-2 ${isActivePath('/contact') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'} transition-colors`}
            onClick={() => setShowMobileMenu(false)}>
            {t('contact')}
          </Link>
        </div>
      </nav>
    </header>
  );
}
