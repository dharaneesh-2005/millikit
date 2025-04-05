import { useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import ProductCard from "@/components/ProductCard";
import { Product } from "@shared/schema";

export default function Home() {
  console.log("Home component rendering");
  
  const { t } = useTranslation();
  const { addToCart } = useCart();
  
  // Fetch featured products
  const { data: featuredProducts, isLoading, error } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
  });
  
  // Set page title
  useEffect(() => {
    document.title = "Millikit - Premium Millet Store";
    console.log("Home component mounted");
    
    return () => {
      console.log("Home component unmounted");
    };
  }, []);
  
  // Log any errors
  useEffect(() => {
    if (error) {
      console.error("Error fetching products:", error);
    }
    if (featuredProducts) {
      console.log("Featured products loaded:", featuredProducts.length);
    }
  }, [error, featuredProducts]);
  
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl text-red-600 mb-4">Error loading products</h2>
        <p className="text-gray-600 mb-4">{error.toString()}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <>
      {/* Simplified Hero Section */}
      <section id="home" className="bg-green-50 min-h-[50vh] flex items-center pt-16">
        <div className="container mx-auto px-6 py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <h1 className="text-4xl md:text-6xl font-bold text-green-800 mb-6">
                {t('home')} {t('footer.tagline')}
              </h1>
              <p className="text-lg md:text-xl text-gray-700 mb-8">
                Premium quality millets for your healthy lifestyle. Organic, nutritious, and sustainably sourced.
              </p>
              <div className="flex space-x-4">
                <Link href="/products" className="bg-green-700 text-white px-8 py-3 rounded-full hover:bg-green-600 transition-colors block">
                  {t('products')}
                </Link>
                <a href="#about" className="bg-white text-green-700 px-8 py-3 rounded-full hover:bg-gray-50 transition-colors block">
                  Learn More
                </a>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.pexels.com/photos/7511774/pexels-photo-7511774.jpeg" 
                alt="Millet grains" 
                className="rounded-2xl shadow-2xl"
              />
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
