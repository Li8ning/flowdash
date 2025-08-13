import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from '../../public/locales/en/common.json';
import hiTranslation from '../../public/locales/hi/common.json';
import guTranslation from '../../public/locales/gu/common.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: ['en', 'hi', 'gu'],
    fallbackLng: 'en',
    detection: {
      order: ['cookie', 'localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['cookie'],
    },
    resources: {
      en: {
        common: enTranslation,
      },
      hi: {
        common: hiTranslation,
      },
      gu: {
        common: guTranslation,
      },
    },
    ns: ['common'],
    defaultNS: 'common',
    react: {
      useSuspense: false,
    },
  });

export default i18n;