import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/contexts/LanguageContext";
import logoPath from "@assets/LOGO-removebg-preview.png";

export default function Header() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [location] = useLocation();
  const { cartItems } = useCart();
  const { user, logoutMutation } = useAuth();
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
    <motion.header 
      className={`fixed w-full top-0 z-50 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Link href="/" className="flex items-center space-x-2">
              <motion.img 
                src={logoPath} 
                alt="Millikit Logo" 
                className="h-14 w-auto mr-2" 
                whileHover={{ rotate: [0, -5, 5, -5, 0], transition: { duration: 0.5 } }}
              />
            </Link>
          </motion.div>
          
          <div className="hidden md:flex space-x-8">
            {['/', '/products', '/contact'].map((path, index) => (
              <motion.div
                key={path}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + (index * 0.1), duration: 0.5 }}
              >
                <Link 
                  href={path === '/' ? path : path.substring(1)}
                  className={`${isActivePath(path === '/' ? path : path.substring(1)) ? 'text-green-600' : 'text-gray-700 hover:text-green-600'} transition-colors`}
                >
                  {path === '/' ? t('home') : path === '/products' ? t('products') : t('contact')}
                </Link>
              </motion.div>
            ))}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* User Authentication */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              whileHover={{ scale: 1.1 }}
              className="relative group"
            >
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="hidden md:inline-block text-sm text-gray-700">
                    {user.name || user.username}
                  </span>
                  <button
                    onClick={() => logoutMutation.mutate()}
                    className="text-gray-700 hover:text-green-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                    title={t('logout')}
                    disabled={logoutMutation.isPending}
                  >
                    {logoutMutation.isPending ? (
                      <i className="fas fa-spinner fa-spin text-lg"></i>
                    ) : (
                      <i className="fas fa-sign-out-alt text-lg"></i>
                    )}
                  </button>
                </div>
              ) : (
                <Link href="/auth" className="text-gray-700 hover:text-green-600 transition-colors flex items-center gap-1">
                  <i className="fas fa-user text-lg"></i>
                  <span className="hidden md:inline-block text-sm">
                    {t('login')} / {t('register')}
                  </span>
                </Link>
              )}
            </motion.div>
            
            {/* Admin Link */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              whileHover={{ scale: 1.1 }}
            >
              <Link href="/admin/login" className="text-gray-700 hover:text-green-600 transition-colors">
                <i className="fas fa-user-shield text-xl"></i>
              </Link>
            </motion.div>
            
            {/* Cart */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              whileHover={{ scale: 1.1 }}
            >
              <Link href="/cart" className="relative text-gray-700 hover:text-green-600 transition-colors">
                <i className="fas fa-shopping-cart text-xl"></i>
                <AnimatePresence>
                  {cartItemCount > 0 && (
                    <motion.span 
                      className="cart-count absolute -top-2 -right-2 bg-yellow-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                    >
                      {cartItemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>
            
            {/* Mobile Menu Toggle */}
            <motion.button 
              className="md:hidden text-gray-700"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              whileTap={{ scale: 0.9 }}
            >
              <i className={`fas ${showMobileMenu ? 'fa-times' : 'fa-bars'}`}></i>
            </motion.button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div 
              className="md:hidden py-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Main navigation links */}
              {['/', '/products', '/contact'].map((path, index) => (
                <motion.div
                  key={path}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.3 }}
                >
                  <Link 
                    href={path === '/' ? path : path.substring(1)}
                    className={`block py-2 ${isActivePath(path === '/' ? path : path.substring(1)) ? 'text-green-600' : 'text-gray-700 hover:text-green-600'} transition-colors`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {path === '/' ? t('home') : 
                      path === '/products' ? t('products') : 
                      t('contact')}
                  </Link>
                </motion.div>
              ))}
              
              {/* Auth/account links */}
              {user ? (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                  className="border-t mt-2 pt-2"
                >
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-700">
                      {user.name || user.username}
                    </span>
                    <button
                      onClick={() => {
                        logoutMutation.mutate();
                        setShowMobileMenu(false);
                      }}
                      className="text-red-600 hover:text-red-700 transition-colors"
                      disabled={logoutMutation.isPending}
                    >
                      {logoutMutation.isPending ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fas fa-sign-out-alt mr-2"></i>
                      )}
                      {t('logout')}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  <Link 
                    href="/auth"
                    className="block py-2 text-gray-700 hover:text-green-600 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <i className="fas fa-user mr-2"></i>
                    {t('login')} / {t('register')}
                  </Link>
                </motion.div>
              )}
              
              {/* Admin link */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <Link 
                  href="/admin/login"
                  className="block py-2 text-gray-700 hover:text-green-600 transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <i className="fas fa-user-shield mr-2"></i>
                  Admin
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  );
}
