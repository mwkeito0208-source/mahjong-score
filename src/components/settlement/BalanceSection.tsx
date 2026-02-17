type Props = {
  title: string;
  icon: string;
  members: string[];
  balances: number[];
  subtitle?: string;
  extra?: (index: number) => React.ReactNode;
  action?: React.ReactNode;
};

function formatYen(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toLocaleString()}pt`;
}

export function BalanceSection({
  title,
  icon,
  members,
  balances,
  subtitle,
  extra,
  action,
}: Props) {
  return (
    <div className="mb-4 rounded-xl bg-white p-4 shadow-md">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-bold text-gray-700">
          {icon} {title}
          {subtitle && (
            <span className="text-xs font-normal text-gray-500">
              {subtitle}
            </span>
          )}
        </h3>
        {action}
      </div>
      <div className="space-y-2">
        {members.map((name, i) => (
          <div
            key={name}
            className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0"
          >
            <div className="flex items-center gap-2">
              <span className="text-gray-700">{name}</span>
              {extra?.(i)}
            </div>
            <span
              className={`font-bold ${balances[i] >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatYen(balances[i])}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
