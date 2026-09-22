import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'pill' | 'compact' | 'light';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'pill', className = '' }) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('ta') ? 'ta' : 'en';

  const toggleLanguage = (lang: 'en' | 'ta') => {
    if (currentLang !== lang) {
      i18n.changeLanguage(lang);
    }
  };

  return (
    <div
      className={`inline-flex items-center rounded-xl p-1 border shadow-xs transition-all ${
        variant === 'light'
          ? 'bg-white/15 border-white/20 text-white'
          : 'bg-slate-100/90 border-slate-200 text-slate-700'
      } ${className}`}
      title="Switch Language / மொழியை மாற்றுக"
      role="group"
      aria-label="Language Selector"
    >
      <div className="flex items-center gap-1 px-1.5 opacity-70">
        <Globe className="w-3.5 h-3.5" />
      </div>

      <button
        type="button"
        onClick={() => toggleLanguage('en')}
        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
          currentLang === 'en'
            ? 'bg-white text-blue-700 shadow-xs font-extrabold'
            : variant === 'light'
            ? 'text-white/80 hover:text-white'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        English
      </button>

      <button
        type="button"
        onClick={() => toggleLanguage('ta')}
        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
          currentLang === 'ta'
            ? 'bg-white text-emerald-700 shadow-xs font-extrabold'
            : variant === 'light'
            ? 'text-white/80 hover:text-white'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        தமிழ்
      </button>
    </div>
  );
};

export default LanguageSwitcher;
