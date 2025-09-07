import { statusClass } from "../utils";

// LogsTable 컴포넌트는 logs라는 데이터를 받아서 그 데이터를 table형식으로 화면에 보여주는 역할임
export default function LogsTable({ logs = [] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow overflow-auto">
      <h3 className="text-lg font-semibold mb-3">Recent Logs</h3>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2 pr-4">Date</th>
            <th className="py-2 pr-4">Time</th>
            <th className="py-2 pr-4">Value</th>
            <th className="py-2 pr-4">Memo</th>
          </tr>
        </thead>
        <tbody>
          {/* logs 데이터 출력 */}
          {logs.map((row, i) => (
            <tr key={i} className="border-b last:border-none">
              <td className="py-2 pr-4">{row.date}</td>
              <td className="py-2 pr-4">{row.timeSlot}</td>
              <td className={`py-2 pr-4 font-semibold ${statusClass(row.value)}`}>{row.value}</td>
              <td className="py-2 pr-4 whitespace-pre-wrap">{row.note || "-"}</td> 

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
