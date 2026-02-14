import Link from "next/link";
import type { SessionSummary } from "./SessionCard";

type Props = {
  session: SessionSummary;
  onClose: () => void;
};

const RANK_STYLES = [
  "bg-yellow-400 text-yellow-900",
  "bg-gray-300 text-gray-700",
  "bg-orange-300 text-orange-900",
  "bg-gray-200 text-gray-600",
  "bg-gray-200 text-gray-600",
];

export function SessionDetailModal({ session, onClose }: Props) {
  const sorted = [...session.results].sort((a, b) => b.money - a.money);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[80vh] w-full max-w-sm overflow-hidden rounded-2xl bg-white">
        {/* ヘッダー */}
        <div className="bg-green-900 p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold">{session.date}</div>
              <div className="text-xs opacity-80">{session.settings}</div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-white/20"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div
          className="overflow-y-auto p-4"
          style={{ maxHeight: "calc(80vh - 120px)" }}
        >
          <div className="mb-4">
            <div className="mb-2 text-sm text-gray-500">参加者</div>
            <div className="flex flex-wrap gap-2">
              {session.members.map((name) => (
                <span
                  key={name}
                  className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-700"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <div className="mb-2 text-sm text-gray-500">半荘数</div>
            <div className="font-bold text-gray-800">{session.rounds}半荘</div>
          </div>

          {/* 結果 */}
          <div>
            <div className="mb-2 text-sm text-gray-500">最終結果</div>
            <div className="space-y-2">
              {sorted.map((result, i) => (
                <div
                  key={result.name}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${RANK_STYLES[i] ?? RANK_STYLES[3]}`}
                    >
                      {i + 1}
                    </span>
                    <span className="font-medium text-gray-800">
                      {result.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-bold ${result.money >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {result.money >= 0 ? "+" : ""}
                      {result.money.toLocaleString()}円
                    </div>
                    <div className="text-xs text-gray-400">
                      ({result.score >= 0 ? "+" : ""}
                      {result.score})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="border-t border-gray-100 p-4">
          <Link
            href={`/session/${session.id}/score`}
            className="block w-full rounded-lg bg-gray-100 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            📋 詳細スコアを見る
          </Link>
        </div>
      </div>
    </div>
  );
}
