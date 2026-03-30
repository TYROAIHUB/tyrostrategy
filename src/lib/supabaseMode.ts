/** Single source of truth for Supabase mode flag */
export const isSupabaseMode = import.meta.env.VITE_DATA_PROVIDER === "supabase";
