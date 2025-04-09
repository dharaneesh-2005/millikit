import { useState, useEffect } from "react";
import { useTranslation } from "@/contexts/LanguageContext";

export default function LanguageSelector() {
  const { language, setLanguage } = useTranslation();
  const [isLoaded, setIsLoaded] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    // Set component as loaded after initial render
    setIsLoaded(true);
  }, []);

  const toggleLanguage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent multiple rapid clicks
    if (animating) return;
    
    setAnimating(true);
    const newLanguage = language === "en" ? "ta" : "en";
    
    // Apply animation class first
    const langBadge = document.querySelector('.lang-badge');
    if (langBadge) {
      langBadge.classList.add('lang-change');
    }
    
    // Change language after a small delay for animation to take effect
    setTimeout(() => {
      setLanguage(newLanguage);
      // Store in localStorage (even though context already does this, for redundancy)
      localStorage.setItem("language", newLanguage);
      
      // Remove animation class and reset state
      setTimeout(() => {
        if (langBadge) {
          langBadge.classList.remove('lang-change');
        }
        setAnimating(false);
      }, 300);
    }, 100);
  };

  // Handle select change for desktop
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value as "en" | "ta";
    setLanguage(newLanguage);
  };

  return (
    <>
      {/* Desktop language selector */}
      <div className={`language-selector hidden md:block ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
        <select 
          value={language}
          onChange={handleSelectChange}
          className="bg-white border rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          disabled={animating}
        >
          <option value="en">English</option>
          <option value="ta">தமிழ்</option>
        </select>
      </div>

      {/* Mobile language toggle */}
      <div className={`md:hidden fixed top-4 right-32 z-50 ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
        <button 
          onClick={toggleLanguage}
          className="text-gray-700 hover:text-green-600 transition-colors p-2"
          aria-label="Toggle language"
          disabled={animating}
        >
          <i className="fas fa-globe text-xl"></i>
          <span className="lang-badge absolute -top-1 -right-1 bg-yellow-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full text-[10px]">
            {language === "en" ? "EN" : "TA"}
          </span>
        </button>
      </div>
    </>
  );
}
