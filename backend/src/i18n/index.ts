import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize i18next
i18next
  .use(Backend)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: ['en', 'hi'],
    backend: {
      loadPath: join(__dirname, '{{lng}}.json')
    },
    interpolation: {
      escapeValue: false
    }
  });

export const t = (key: string, lng?: string) => {
  return i18next.t(key, { lng });
};

export const changeLanguage = (lng: string) => {
  return i18next.changeLanguage(lng);
};

export default i18next;
