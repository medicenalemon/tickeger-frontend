const i18next = require('i18next');
const middleware = require('i18next-http-middleware');

// Load translations directly via require (no filesystem writes needed in serverless)
const esTranslation = require('./locales/es/translation.json');
const enTranslation = require('./locales/en/translation.json');

i18next
  .use(middleware.LanguageDetector)
  .init({
    preload: ['es', 'en'],
    fallbackLng: 'es',
    resources: {
      es: {
        translation: esTranslation
      },
      en: {
        translation: enTranslation
      }
    }
  });

module.exports = {
  i18next,
  middleware
};
