"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface DailyStat {
  id: string;
  date: string;
  total_minutes: number;
}

interface Session {
  id: string;
  started_at: string;
  ended_at: string;
  duration_minutes: number;
}

interface Props {
  dailyStats: DailyStat[];
  userId: string;
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split("-");
  return `${year}年${month}月${day}日`;
}

export default function StudyRecords({ dailyStats, userId }: Props) {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Record<string, Session[]>>({});
  const [loading, setLoading] = useState<string | null>(null);

  const handleToggle = async (date: string) => {
    if (expandedDate === date) {
      setExpandedDate(null);
      return;
    }

    setExpandedDate(date);

    if (sessions[date]) return;

    setLoading(date);
    const supabase = createClient();
    const { data } = await supabase
      .from("study_logs")
      .select("id, started_at, ended_at, duration_minutes")
      .eq("user_id", userId)
      .gte("started_at", `${date}T00:00:00`)
      .lte("started_at", `${date}T23:59:59`)
      .order("started_at", { ascending: true });

    setSessions((prev) => ({ ...prev, [date]: data ?? [] }));
    setLoading(null);
  };

  if (dailyStats.length === 0) {
    return (
      <p className="text-center text-sm text-gray-400">
        まだ学習記録がありません
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {dailyStats.map((stat) => (
        <div
          key={stat.id}
          className="overflow-hidden rounded-xl bg-white shadow-sm"
        >
          <button
            onClick={() => handleToggle(stat.date)}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-gray-50"
          >
            <span className="font-medium text-gray-900">
              {formatDate(stat.date)}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-indigo-500">
                {stat.total_minutes}分
              </span>
              <span className="text-xs text-gray-400">
                {expandedDate === stat.date ? "▲" : "▼"}
              </span>
            </div>
          </button>

          {expandedDate === stat.date && (
            <div className="border-t border-gray-100 px-5 py-3">
              {loading === stat.date ? (
                <p className="text-sm text-gray-400">読み込み中...</p>
              ) : (sessions[stat.date] ?? []).length === 0 ? (
                <p className="text-sm text-gray-400">記録がありません</p>
              ) : (
                <ul className="space-y-2">
                  {(sessions[stat.date] ?? []).map((session) => (
                    <li
                      key={session.id}
                      className="flex items-center justify-between text-sm text-gray-600"
                    >
                      <span>
                        {formatTime(session.started_at)} 〜{" "}
                        {formatTime(session.ended_at)}
                      </span>
                      <span className="text-gray-400">
                        {session.duration_minutes}分
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
