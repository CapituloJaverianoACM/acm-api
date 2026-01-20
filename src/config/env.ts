const APP_ENV = process.env.APP_ENV ?? "development";

const isProd = APP_ENV === "production";

export const MONGO_URL = isProd
  ? process.env.MONGO_URI_PROD!
  : process.env.MONGO_URI_DEV!;

export const SUPABASE_URL = isProd
  ? process.env.SUPABASE_URL_PROD!
  : process.env.SUPABASE_URL_DEV!;

export const SUPABASE_ANON_KEY = isProd
  ? process.env.SUPABASE_ANON_KEY_PROD!
  : process.env.SUPABASE_ANON_KEY_DEV!;

export const SUPABASE_SERVICE_KEY = isProd
  ? process.env.SUPABASE_SERVICE_KEY_PROD!
  : process.env.SUPABASE_SERVICE_KEY_DEV!;
