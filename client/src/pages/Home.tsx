import { useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import ProductCard from "@/components/ProductCard";
import { Product } from "@shared/schema";

export default function Home() {
  const { t } = useTranslation();
  const { addToCart } = useCart();
  
  // Fetch featured products
  const { data: featuredProducts, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
  });
  
  // Set page title
  useEffect(() => {
    document.title = "Millikit - Premium Millet Store";
  }, []);
  
  return (
    <>
      {/* Hero Section */}
      <section id="home" className="hero-gradient min-h-screen flex items-center pt-16">
        <div className="container mx-auto px-6 py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <h1 className="text-4xl md:text-6xl font-bold text-green-800 mb-6 text-shadow">
                {t('home')} {t('footer.tagline')}
              </h1>
              <p className="text-lg md:text-xl text-gray-700 mb-8">
                Premium quality millets for your healthy lifestyle. Organic, nutritious, and sustainably sourced.
              </p>
              <div className="flex space-x-4">
                <Link href="/products" className="bg-green-700 text-white px-8 py-3 rounded-full hover:bg-green-600 transition-colors transform hover:scale-105 duration-300">
                  {t('products')}
                </Link>
                <a href="#about" className="bg-white text-green-700 px-8 py-3 rounded-full hover:bg-gray-50 transition-colors">
                  Learn More
                </a>
              </div>
            </div>
            <div className="relative float-animation">
              <img 
                src="https://images.pexels.com/photos/7511774/pexels-photo-7511774.jpeg" 
                alt="Millet grains" 
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-green-800 mb-16">About Millikit</h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src="https://images.pexels.com/photos/7511753/pexels-photo-7511753.jpeg" 
                alt="About Millikit" 
                className="rounded-2xl shadow-lg"
              />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Our Story</h3>
              <p className="text-gray-600 mb-6">
                At Millikit, we believe in the power of traditional grains combined with modern nutrition. Our journey began with a simple mission: to bring the goodness of millets to every household.
              </p>
              <p className="text-gray-600 mb-6">
                We work directly with organic farmers to ensure the highest quality millets reach your table. Every grain is carefully selected and processed to preserve its nutritional value.
              </p>
              <Link href="/contact" className="text-green-600 hover:text-green-700 font-semibold flex items-center">
                Read More <i className="fas fa-arrow-right ml-2"></i>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-green-800 mb-16">Why Choose Millikit?</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-seedling text-3xl text-green-600"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">100% Organic</h3>
              <p className="text-gray-600">Carefully sourced from organic farms, ensuring the highest quality millets.</p>
            </div>
            {/* Feature 2 */}
            <div className="text-center">
              <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-heart text-3xl text-green-600"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Nutrient-Rich</h3>
              <p className="text-gray-600">Packed with essential nutrients, proteins, and minerals for your wellbeing.</p>
            </div>
            {/* Feature 3 */}
            <div className="text-center">
              <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-truck text-3xl text-green-600"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Fast Delivery</h3>
              <p className="text-gray-600">Quick and secure delivery right to your doorstep across the country.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Featured Products */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-green-800 mb-16">Featured Products</h2>
          
          {isLoading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {featuredProducts?.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link href="/products" className="inline-block bg-green-700 text-white px-8 py-3 rounded-full hover:bg-green-600 transition-colors">
              View All Products
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
