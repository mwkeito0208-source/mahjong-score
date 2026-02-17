type OpponentStat = {
  name: string;
  sessions: number;
  balance: number;
  avgRank: number;
};

type Props = {
  data: OpponentStat[];
};

function getRankColor(rank: number): string {
  if (rank <= 2.0) return "text-green-600";
  if (rank <= 2.5) return "text-yellow-600";
  return "text-red-600";
}

export function OpponentsTab({ data }: Props) {
  const sorted = [...data].sort((a, b) => b.balance - a.balance);

  return (
    <div className="space-y-3">
      {sorted.map((opponent) => (
        <div
          key={opponent.name}
          className="rounded-xl bg-white p-4 shadow-md"
        >
          <div className="mb-2 flex items-start justify-between">
            <div>
              <div className="font-bold text-gray-800">{opponent.name}</div>
              <div className="text-sm text-gray-500">
                {opponent.sessions}回対戦
              </div>
            </div>
            <div
              className={`text-lg font-bold ${opponent.balance >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {opponent.balance >= 0 ? "+" : ""}
              {opponent.balance.toLocaleString()}pt
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">平均順位:</span>
            <span
              className={`font-medium ${getRankColor(opponent.avgRank)}`}
            >
              {opponent.avgRank.toFixed(1)}位
            </span>
            <span className="text-gray-300">|</span>
            <span
              className={
                opponent.balance >= 0 ? "text-green-600" : "text-red-600"
              }
            >
              {opponent.balance >= 0 ? "相性◎" : "相性△"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
