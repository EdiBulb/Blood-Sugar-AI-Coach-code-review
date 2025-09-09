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
import { mgdlToMmol } from "./utils";

// 페이지 조립
// 앱의 메인 화면
export default function App() {
  const [logs, setLogs] = useState([]); // 서버에서 가져온 혈당 기록
  const [range, setRange] = useState("week"); // 'week' | 'month'
  
  const [chartFasting, setChartFasting] = useState([]); // 공복 상태의 혈당 데이터(차트용)
  const [chartPost, setChartPost] = useState([]); // 식후 상태의 혈당 데이터(차트용)
  
  const [chartData, setChartData] = useState([]); // 차트용 데이터(label, value)
  const [coachMessage, setCoachMessage] = useState(""); // AI 코치 메시지

  const [profileOpen, setProfileOpen] = useState(false); // 프로필 패널 상태

  const [showLogs, setShowLogs] = useState(true); //  Recent Logs 토글

  async function fetchLogs() {
    const { data } = await axios.get(`/api/logs?range=${range}`);
    setLogs(data.items);

    // 차트용 라벨/값 구성 (날짜 오름차순)
    // sorted: 오름차순된 전체 데이터 
    const sorted = [...data.items].sort((a, b) => a.date.localeCompare(b.date));

    // 공복 기록과 식후 기록을 나누어 데이터 필터링
    const fasting = sorted.filter(r=> (r.mealState||'Fasting') === 'Fasting'); // mealState가 비었거나 명시적으로 Fasting인 데이터만 가져옴
    const post    = sorted.filter(r=> r.mealState === 'Post-meal');

    setChartFasting(
      fasting.map(r => ({ label: r.date.slice(5), value: mgdlToMmol(r.value) })) // mmol로 변환 / // slice(5): MM-DD e.g. label: "09-05"
    );
    setChartPost(
      post.map(r => ({ label: r.date.slice(5), value: mgdlToMmol(r.value) }))    // mmol로 변환
    );
  }

  // range(week, month)가 바뀔 때마다 fetchLogs 실행 -> 차트 데이터 갱신
  useEffect(() => { fetchLogs(); }, [range]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="py-4 border-b bg-white/70 dark:bg-gray-800/50 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 flex items-center">
          <h1 className="text-2xl font-bold">Blood Sugar AI Coach</h1>
          <span className="ml-3 text-xs opacity-60">MVP • Done &gt; Perfect</span>
          {/* range 토글 우측에 배치 */}
          <div className="ml-auto flex gap-2">
            <button
              className={`px-3 py-1 rounded ${range==='week'?'bg-blue-600 text-white':'bg-gray-200 dark:bg-gray-700'}`}
              onClick={()=>setRange('week')}
            >Week</button>
            <button
              className={`px-3 py-1 rounded ${range==='month'?'bg-blue-600 text-white':'bg-gray-200 dark:bg-gray-700'}`}
              onClick={()=>setRange('month')}
            >Month</button>
          </div>
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

        
        <div className="grid md:grid-cols-2 gap-6">
          <TrendChart title="Fasting Trend (week/month)" data={chartFasting} />
          <TrendChart title="Post-meal Trend (week/month)" data={chartPost} />
        </div>

        {/* Recent Logs + 토글 버튼 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow">
          <div className="flex items-center">
            <h3 className="text-lg font-semibold">Recent Logs</h3>
            <button
              onClick={()=>setShowLogs(v=>!v)}
              className="ml-auto px-3 py-1 rounded bg-gray-200 dark:bg-gray-700"
            >
              {showLogs ? "Hide" : "Open"}
            </button>
          </div>
          {showLogs && (
            <div className="mt-3">
              <LogsTable logs={logs} onChanged={fetchLogs}/>
            </div>
          )}
        </div>

      </main>

      {/* 우측 슬라이드 패널 + 프로필 에디터 + weekly summary*/}
      <SidePanel open={profileOpen} onClose={()=>setProfileOpen(false)} title="My Goals & Lifestyle">
        <div className="space-y-4">
          <ProfileEditor />
          {/* 주간 요약 생성 */}
          <WeeklySummary />
          
        </div>
        
      </SidePanel>

      <footer className="py-6 text-center opacity-60">
        Built for 6-week challenge • v1
      </footer>
    </div>
  );
}
