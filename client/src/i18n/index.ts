import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import en from './locales/en.json';
import es from './locales/es.json';
import hi from './locales/hi.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import zh from './locales/zh.json';
import pt from './locales/pt.json';
import ru from './locales/ru.json';
import ar from './locales/ar.json';

const resources = {
    en: { translation: en },
    es: { translation: es },
    hi: { translation: hi },
    fr: { translation: fr },
    de: { translation: de },
    ja: { translation: ja },
    ko: { translation: ko },
    zh: { translation: zh },
    pt: { translation: pt },
    ru: { translation: ru },
    ar: { translation: ar },
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: localStorage.getItem('koda-language') || 'en',
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // React already escapes by default
        },
    });

export default i18n;
