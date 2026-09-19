const path = require('node:path');
const i18next = require('i18next');
const middleware = require('i18next-http-middleware');

const tr = require('../locales/tr/translation.json');
const en = require('../locales/en/translation.json');

if (!i18next.isInitialized) {
  i18next
    .use(middleware.LanguageDetector)
    .init({
      fallbackLng: 'tr',
      supportedLngs: ['tr', 'en'],
      preload: ['tr', 'en'],
      resources: {
        tr: { translation: tr },
        en: { translation: en },
      },
      detection: {
        order: ['header'],
        lookupHeader: 'accept-language',
      },
      interpolation: { escapeValue: false },
      initImmediate: false,
    });
}

module.exports = { i18next, i18nMiddleware: middleware.handle(i18next) };
