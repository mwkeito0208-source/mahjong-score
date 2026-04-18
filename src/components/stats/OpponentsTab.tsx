import { Card, Badge } from "@/components/ui";

type OpponentStat = {
  name: string;
  sessions: number;
  balance: number;
  avgRank: number;
};

type Props = {
  data: OpponentStat[];
};

function rankTone(rank: number): "positive" | "neutral" | "negative" {
  if (rank <= 2.0) return "positive";
  if (rank <= 2.5) return "neutral";
  return "negative";
}

export function OpponentsTab({ data }: Props) {
  const sorted = [...data].sort((a, b) => b.balance - a.balance);

  if (sorted.length === 0) {
    return (
      <Card padding="lg" className="text-center">
        <p className="text-sm text-[var(--ink-muted)]">対戦相手のデータがありません</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((opponent) => {
        const tone = rankTone(opponent.avgRank);
        const toneClass =
          tone === "positive"
            ? "text-[var(--positive)]"
            : tone === "negative"
              ? "text-[var(--negative)]"
              : "text-[var(--ink-muted)]";
        return (
          <Card key={opponent.name} padding="md">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-serif-jp text-base font-bold text-[var(--ink)]">
                  {opponent.name}
                </div>
                <div className="mt-0.5 text-xs text-[var(--ink-muted)]">
                  {opponent.sessions}回対戦
                </div>
              </div>
              <div className={`num-mono tabular text-base font-bold ${
                opponent.balance >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
              }`}>
                {opponent.balance >= 0 ? "+" : ""}
                {opponent.balance.toLocaleString()}
                <span className="ml-0.5 text-[10px] text-[var(--ink-subtle)]">pt</span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-[var(--ink-subtle)]">平均順位</span>
              <span className={`num-mono tabular font-medium ${toneClass}`}>
                {opponent.avgRank.toFixed(2)}位
              </span>
              <Badge tone={opponent.balance >= 0 ? "positive" : "negative"} size="sm">
                {opponent.balance >= 0 ? "相性◎" : "相性△"}
              </Badge>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
