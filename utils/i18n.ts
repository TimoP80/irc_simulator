import en from '../locales/en.json';

const translations: { [key: string]: any } = {
  en,
};

export const getTranslatedContent = (lang: string = 'en') => {
  return translations[lang] || translations.en;
};