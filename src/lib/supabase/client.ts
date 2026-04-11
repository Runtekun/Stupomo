import { createBrowserClient } from "@supabase/ssr";

// クライアントコンポーネント用のSupabaseクライアント
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
