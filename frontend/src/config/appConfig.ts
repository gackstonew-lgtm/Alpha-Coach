/**
 * Global Application Branding & Configuration
 * Single source of truth for product name and module branding.
 */

export const APP_NAME: string = (import.meta.env.VITE_APP_NAME as string) || 'Arcade Fx';
export const BOT_NAME: string = 'MT5 Bot';
export const BOT_ASSISTANT_NAME: string = 'Bot Assistant';
export const APP_TAGLINE: string = 'Professional MT5 Bot Management & Forex Intelligence OS';
export const APP_DOMAIN: string = 'arcadefx.live';

export default {
  APP_NAME,
  BOT_NAME,
  BOT_ASSISTANT_NAME,
  APP_TAGLINE,
  APP_DOMAIN
};
