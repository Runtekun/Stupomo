import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PomodoroTimer from "./PomodoroTimer";

export default async function TimerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("daily_stats")
    .select("total_minutes")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();
  const todayMinutes = data?.total_minutes ?? 0;

  return <PomodoroTimer todayMinutes={todayMinutes} />;
}
