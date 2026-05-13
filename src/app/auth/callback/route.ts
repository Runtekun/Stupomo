import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GoogleログインのOAuthコールバックを処理するRoute Handler
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    console.log("[callback] exchange result:", { user: data?.user?.email, error: error?.message });
  } else {
    console.log("[callback] no code in request");
  }

  // ログイン成功後はトップページへリダイレクト（Hostヘッダーを使ってDockerのポートずれを回避）
  const host = request.headers.get("host") ?? "localhost:3001";
  const protocol = host.includes("localhost") ? "http" : "https";
  return NextResponse.redirect(`${protocol}://${host}/`);
}
