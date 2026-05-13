import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LoginButton from "./LoginButton";

export default async function LoginPage() {
  const supabase = await createClient();

  // すでにログイン済みならトップページへリダイレクト
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-md">
        <h1 className="mb-2 text-center text-3xl font-bold text-gray-800">
          Stupomo
        </h1>
        <p className="mb-8 text-center text-sm text-gray-500">
          ポモドーロで学習時間を記録しよう
        </p>
        <LoginButton />
      </div>
    </div>
  );
}
