import { useEffect, useState } from "react";
import axios from "axios";
import LogForm from "./components/LogForm";
import CoachCard from "./components/CoachCard";
import LogsTable from "./components/LogsTable";
import TrendChart from "./components/TrendChart";

// 페이지 조립
// 앱의 메인 화면
export default function App() {
  const [logs, setLogs] = useState([]); // 서버에서 가져온 혈당 기록
  const [range, setRange] = useState("week"); // 'week' | 'month'
  const [chartData, setChartData] = useState([]); // 차트용 데이터(label, value)
  const [coachMessage, setCoachMessage] = useState(""); // AI 코치 메시지

  async function fetchLogs() {
    const { data } = await axios.get(`/api/logs?range=${range}`);
    setLogs(data.items);

    // 차트용 라벨/값 구성 (날짜 오름차순)
    const sorted = [...data.items].sort((a, b) => a.date.localeCompare(b.date));
    const mapped = sorted.map((row) => ({
      label: row.date.slice(5), // MM-DD
      value: row.value,
    }));
    setChartData(mapped);
  }

  // range가 바뀔 때마다 fetchLogs 실행 -> 차트 데이터 갱신
  useEffect(() => { fetchLogs(); }, [range]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="py-4 border-b bg-white/70 dark:bg-gray-800/50 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 flex items-center">
          <h1 className="text-2xl font-bold">Blood Sugar AI Coach</h1>
          <span className="ml-3 text-xs opacity-60">MVP • Done &gt; Perfect</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <LogForm onSaved={fetchLogs} setCoachMessage={setCoachMessage} />
        <CoachCard message={coachMessage} />
        <div className="grid md:grid-cols-2 gap-6">
          <TrendChart range={range} onRangeChange={setRange} data={chartData} />
          <LogsTable logs={logs} />
        </div>
      </main>

      <footer className="py-6 text-center opacity-60">
        Built for 6-week challenge • v1
      </footer>
    </div>
  );
}
