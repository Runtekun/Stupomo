"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
    >
      ログアウト
    </button>
  );
}
