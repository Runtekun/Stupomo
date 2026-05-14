import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import SignupForm from "./SignupForm";

export default async function SignupPage() {
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
          アカウントを作成しよう
        </p>
        <SignupForm />
        <p className="mt-6 text-center text-xs text-gray-500">
          すでにアカウントをお持ちの方は{" "}
          <Link href="/login" className="text-gray-800 underline">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
