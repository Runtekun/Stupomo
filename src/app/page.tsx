import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-md text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Stupomo</h1>
        <p className="text-sm text-gray-500 mb-8">ログイン中: {user.email}</p>
        <div className="flex flex-col gap-3 mb-4">
          <Link
            href="/timer"
            className="flex w-full items-center justify-center rounded-lg bg-indigo-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-600"
          >
            タイマーを開始する
          </Link>
          <Link
            href="/records"
            className="flex w-full items-center justify-center rounded-lg border border-indigo-200 bg-white px-4 py-3 text-sm font-medium text-indigo-500 transition hover:bg-indigo-50"
          >
            学習履歴を見る
          </Link>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}
