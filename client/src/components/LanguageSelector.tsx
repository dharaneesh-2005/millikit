import { useState } from "react";
import { useTranslation } from "@/contexts/LanguageContext";

export default function LanguageSelector() {
  const { language, setLanguage } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ta" : "en");
  };

  return (
    <>
      {/* Desktop language selector */}
      <div className="language-selector hidden md:block">
        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value as "en" | "ta")}
          className="bg-white border rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <option value="en">English</option>
          <option value="ta">தமிழ்</option>
        </select>
      </div>

      {/* Mobile language toggle */}
      <div className="md:hidden absolute top-4 right-20 z-50">
        <button 
          onClick={toggleLanguage}
          className="text-gray-700 hover:text-green-600 transition-colors"
          aria-label="Toggle language"
        >
          <i className="fas fa-globe text-xl"></i>
          <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full text-[10px]">
            {language === "en" ? "EN" : "TA"}
          </span>
        </button>
      </div>
    </>
  );
}
