import { Card, Button } from "@/components/ui";

type Props = {
  memberHistory: string[];
  selectedMembers: string[];
  onToggle: (name: string) => void;
  onShowAdd: () => void;
};

export function MemberSelector({
  memberHistory,
  selectedMembers,
  onToggle,
  onShowAdd,
}: Props) {
  const unselected = memberHistory.filter((m) => !selectedMembers.includes(m));
  const atMax = selectedMembers.length >= 5;

  return (
    <Card padding="md">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif-jp text-base font-bold text-[var(--ink)]">メンバー</h3>
          <p className="mt-0.5 text-xs text-[var(--ink-subtle)]">
            3〜5人・
            <span className={selectedMembers.length >= 3 ? "text-[var(--positive)]" : "text-[var(--ink-muted)]"}>
              {selectedMembers.length}人選択中
            </span>
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onShowAdd}>
          ＋ 新規
        </Button>
      </div>

      {selectedMembers.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-b border-[var(--line)] pb-3">
          {selectedMembers.map((name, i) => (
            <span
              key={name}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)] bg-[var(--surface)] pl-3 pr-1 py-1 text-sm text-[var(--ink)]"
            >
              <span className="num-mono text-[11px] text-[var(--accent)]">{i + 1}</span>
              <span className="font-medium">{name}</span>
              <button
                onClick={() => onToggle(name)}
                className="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[var(--ink-subtle)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
                aria-label="外す"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {unselected.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {unselected.map((name) => (
            <button
              key={name}
              onClick={() => onToggle(name)}
              disabled={atMax}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                atMax
                  ? "cursor-not-allowed border-[var(--line)] bg-transparent text-[var(--ink-subtle)]"
                  : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)] hover:border-[var(--ink-subtle)] hover:text-[var(--ink)]"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      ) : selectedMembers.length === 0 ? (
        <p className="mt-3 text-xs text-[var(--ink-subtle)]">
          「＋ 新規」からメンバーを追加してください。
        </p>
      ) : null}
    </Card>
  );
}
