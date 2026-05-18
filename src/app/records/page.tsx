import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import StudyRecords from "./StudyRecords";

export default async function RecordsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: dailyStats } = await supabase
    .from("daily_stats")
    .select("id, date, total_minutes")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(135deg, #f0f4ff 0%, #e8edf8 40%, #ede8f5 100%)",
      }}
    >
      <div className="mx-auto max-w-lg px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">学習履歴</h1>
          <Link
            href="/timer"
            className="text-sm text-indigo-500 hover:text-indigo-600"
          >
            ← タイマーに戻る
          </Link>
        </div>
        <StudyRecords dailyStats={dailyStats ?? []} userId={user.id} />
      </div>
    </div>
  );
}
