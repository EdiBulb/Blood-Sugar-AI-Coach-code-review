import { useEffect, useState } from "react";
import axios from "axios";
import LogForm from "./components/LogForm";
import CoachCard from "./components/CoachCard";
import LogsTable from "./components/LogsTable";
import TrendChart from "./components/TrendChart";
import WeeklySummary from "./components/WeeklySummary";

import ProfileFab from "./components/ProfileFab";
import SidePanel from "./components/SidePanel";
import ProfileEditor from "./components/ProfileEditor";

// 페이지 조립
// 앱의 메인 화면
export default function App() {
  const [logs, setLogs] = useState([]); // 서버에서 가져온 혈당 기록
  const [range, setRange] = useState("week"); // 'week' | 'month'
  const [chartData, setChartData] = useState([]); // 차트용 데이터(label, value)
  const [coachMessage, setCoachMessage] = useState(""); // AI 코치 메시지

  const [profileOpen, setProfileOpen] = useState(false); // 프로필 패널 상태


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
      
      {/* 우측 상단 고정 프로필 버튼: 클릭 시, profileOpen 상태가 true이면 패널이 열리고 false면 닫힌다 */}
      <ProfileFab
        isOpen={profileOpen}
        onClick={() => setProfileOpen(true)}
        onClose={() => setProfileOpen(false)}
      />
      
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <LogForm onSaved={fetchLogs} setCoachMessage={setCoachMessage} />
        <CoachCard message={coachMessage} />

        {/* 주간 요약 생성 */}
        <WeeklySummary />
        <div className="grid md:grid-cols-2 gap-6">
          <TrendChart range={range} onRangeChange={setRange} data={chartData} />
          <LogsTable logs={logs} />
        </div>
      </main>

      {/* ⬇️ 우측 슬라이드 패널 + 프로필 에디터 */}
      <SidePanel open={profileOpen} onClose={()=>setProfileOpen(false)} title="My Goals & Lifestyle">
        <ProfileEditor />
      </SidePanel>

      <footer className="py-6 text-center opacity-60">
        Built for 6-week challenge • v1
      </footer>
    </div>
  );
}
