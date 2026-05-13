import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GoogleログインのOAuthコールバックを処理するRoute Handler
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    // 認証コードをセッションと交換する
    await supabase.auth.exchangeCodeForSession(code);
  }

  // ログイン成功後はトップページへリダイレクト
  return NextResponse.redirect(`${origin}/`);
}
