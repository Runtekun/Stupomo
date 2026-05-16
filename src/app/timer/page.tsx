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

  return <PomodoroTimer />;
}
