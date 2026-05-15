"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveStudyLog(startedAt: string, endedAt: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("study_logs").insert({
    user_id: user.id,
    duration_minutes: 25,
    mode: "work",
    started_at: startedAt,
    ended_at: endedAt,
  });

  const today = new Date().toISOString().split("T")[0];

  const { data: existing } = await supabase
    .from("daily_stats")
    .select("total_minutes")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  if (existing) {
    await supabase
      .from("daily_stats")
      .update({
        total_minutes: existing.total_minutes + 25,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("date", today);
  } else {
    await supabase.from("daily_stats").insert({
      user_id: user.id,
      date: today,
      total_minutes: 25,
    });
  }
}
