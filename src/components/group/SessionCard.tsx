export type SessionResult = {
  name: string;
  score: number;
  money: number;
};

export type SessionSummary = {
  id: number;
  date: string;
  members: string[];
  rounds: number;
  results: SessionResult[];
  settings: string;
};

type Props = {
  session: SessionSummary;
  onClick: () => void;
};

export function SessionCard({ session, onClick }: Props) {
  return (
    <div
      className="cursor-pointer rounded-xl bg-white p-4 shadow-md transition-shadow hover:shadow-lg"
      onClick={onClick}
    >
      <div className="mb-2 flex items-start justify-between">
        <div>
          <div className="font-bold text-gray-800">{session.date}</div>
          <div className="text-xs text-gray-500">
            {session.settings} • {session.rounds}半荘
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">参加者</div>
          <div className="text-sm text-gray-600">
            {session.members.slice(0, 2).join(", ")}
            {session.members.length > 2 ? "..." : ""}
          </div>
        </div>
      </div>

      {/* 結果サマリー */}
      <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
        {session.results.map((result) => (
          <div key={result.name} className="flex-1 text-center">
            <div className="truncate text-xs text-gray-500">{result.name}</div>
            <div
              className={`text-sm font-bold ${result.money >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {result.money >= 0 ? "+" : ""}
              {result.money.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
