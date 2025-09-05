import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from "recharts";

export default function TrendChart({ range, onRangeChange, data }) { // range: week, or month / 
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow">
      <div className="flex items-center mb-3">
        <h3 className="text-lg font-semibold">Trend ({range})</h3>
        <div className="ml-auto flex gap-2">
          <button
            className={`px-3 py-1 rounded ${range === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
            onClick={() => onRangeChange('week')}
          >Week</button>
          <button
            className={`px-3 py-1 rounded ${range === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
            onClick={() => onRangeChange('month')}
          >Month</button>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
