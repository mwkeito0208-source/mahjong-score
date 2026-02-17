type MonthlyStat = {
  month: string;
  sessions: number;
  balance: number;
};

type Props = {
  data: MonthlyStat[];
};

export function MonthlyTab({ data }: Props) {
  return (
    <div className="space-y-3">
      {data.map((month) => (
        <div key={month.month} className="rounded-xl bg-white p-4 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-gray-800">{month.month}</div>
              <div className="text-sm text-gray-500">
                {month.sessions}セッション
              </div>
            </div>
            <div
              className={`text-xl font-bold ${month.balance >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {month.balance >= 0 ? "+" : ""}
              {month.balance.toLocaleString()}pt
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
