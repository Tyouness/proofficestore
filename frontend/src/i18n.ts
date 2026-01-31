import {getRequestConfig} from 'next-intl/server';
import {locales} from './config/i18n';

export default getRequestConfig(async ({requestLocale}) => {
  // Valider et résoudre la locale depuis le segment d'URL
  let locale = await requestLocale;

  // Assurer que la locale est valide
  if (!locale || !locales.includes(locale as any)) {
    locale = 'fr';
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
