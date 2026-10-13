import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** 환경 변수가 둘 다 설정되어 있으면 true */
export const isSupabaseConfigured = Boolean(url && anonKey);

let browserClient: SupabaseClient | null = null;

/** 브라우저(클라이언트 컴포넌트)용 Supabase 클라이언트. 한 번만 생성해 재사용합니다. */
export function getSupabase(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
  }
  if (!browserClient) {
    browserClient = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
  }
  return browserClient;
}

/** 서버 컴포넌트용 클라이언트. 요청마다 새로 만들어 상태를 공유하지 않습니다. */
export function createServerSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}
