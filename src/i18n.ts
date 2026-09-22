import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en.json';
import taTranslation from './locales/ta.json';

const savedLanguage = localStorage.getItem('medshare_language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      ta: { translation: taTranslation },
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
  });

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('medshare_language', lng);
  document.documentElement.lang = lng;
});

export default i18n;
