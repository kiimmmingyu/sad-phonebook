import PhoneBook from "./components/PhoneBook";
import { createServerSupabase } from "@/lib/supabase";
import type { Contact } from "@/lib/types";

// 항상 최신 데이터를 서버에서 읽어 첫 화면에 바로 보여줍니다.
export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = createServerSupabase();

  if (!supabase) {
    return <PhoneBook initial={[]} configured={false} />;
  }

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("name", { ascending: true });

  return (
    <PhoneBook
      initial={(data ?? []) as Contact[]}
      configured
      loadError={error?.message ?? null}
    />
  );
}
