/** 환경 변수 접근을 한 곳에서 관리한다. 키가 없어도 앱은 동작해야 한다. */

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  rawgApiKey: process.env.RAWG_API_KEY ?? "",
  steamApiKey: process.env.STEAM_API_KEY ?? "",
};

export const hasSupabase = Boolean(env.supabaseUrl && env.supabaseAnonKey);
export const hasSupabaseAdmin = Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
export const hasRawg = Boolean(env.rawgApiKey);
