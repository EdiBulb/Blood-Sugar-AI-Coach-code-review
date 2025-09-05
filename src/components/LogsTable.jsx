import { statusClass } from "../utils";

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
          </tr>
        </thead>
        <tbody>
          {logs.map((row, i) => (
            <tr key={i} className="border-b last:border-none">
              <td className="py-2 pr-4">{row.date}</td>
              <td className="py-2 pr-4">{row.timeSlot}</td>
              <td className={`py-2 pr-4 font-semibold ${statusClass(row.value)}`}>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
