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
  const unselected = memberHistory.filter(
    (m) => !selectedMembers.includes(m)
  );

  return (
    <div className="mb-4 rounded-xl bg-white p-4 shadow-md">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold text-gray-700">
          👥 メンバー選択
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({selectedMembers.length}/3〜5人)
          </span>
        </h3>
        <button
          onClick={onShowAdd}
          className="text-sm font-medium text-green-600 hover:text-green-700"
        >
          + 新規追加
        </button>
      </div>

      {/* 選択済みメンバー */}
      {selectedMembers.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2 border-b border-gray-100 pb-3">
          {selectedMembers.map((name) => (
            <div
              key={name}
              className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-800"
            >
              <span>{name}</span>
              <button
                onClick={() => onToggle(name)}
                className="ml-1 text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* メンバー履歴 */}
      <div className="flex flex-wrap gap-2">
        {unselected.map((name) => (
          <button
            key={name}
            onClick={() => onToggle(name)}
            disabled={selectedMembers.length >= 5}
            className={`rounded-lg px-3 py-2 text-sm transition-all ${
              selectedMembers.length >= 5
                ? "cursor-not-allowed bg-gray-100 text-gray-400"
                : "bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700"
            }`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
