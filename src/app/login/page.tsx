import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import EmailLoginForm from "./EmailLoginForm";
import LoginButton from "./LoginButton";

export default async function LoginPage() {
  const supabase = await createClient();

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
        <EmailLoginForm />
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">または</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
        <LoginButton />
        <p className="mt-6 text-center text-xs text-gray-500">
          アカウントをお持ちでない方は{" "}
          <Link href="/signup" className="text-gray-800 underline">
            新規登録
          </Link>
        </p>
      </div>
    </div>
  );
}
