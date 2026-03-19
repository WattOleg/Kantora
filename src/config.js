const envGasUrl = import.meta.env.VITE_APPS_SCRIPT_URL;
const isProd = import.meta.env.PROD;

// In production we always use same-origin proxy to avoid browser CORS with Google Apps Script.
export const APPS_SCRIPT_URL = isProd ? '/api/gas' : (envGasUrl || '/api/gas');
export const DEFAULT_CURRENCY = 'USD';

