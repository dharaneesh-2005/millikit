import { Link } from "wouter";
import { useCart } from "@/contexts/CartContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { t } = useTranslation();
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCart(product.id, 1);
  };
  
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 product-card">
      <Link href={`/product/${product.slug}`}>
        <div className="relative">
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-48 object-cover product-image"
          />
          {product.badge && (
            <span className="absolute top-2 left-2 bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {product.badge}
            </span>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{product.name}</h3>
          <p className="text-gray-600 mb-4">{product.shortDescription}</p>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-xl font-bold text-green-600">₹{product.price}</span>
              {product.comparePrice && (
                <span className="text-gray-500 line-through text-sm ml-2">₹{product.comparePrice}</span>
              )}
            </div>
            
            <button 
              onClick={handleAddToCart} 
              className="bg-green-700 text-white px-3 py-1 rounded-full hover:bg-green-600 transition-colors text-sm"
            >
              {t('addToCart')}
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}
