import { useState } from "react";
import axios from "axios";
import { useAuth } from "../auth/AuthContext";

export default function WeeklySummary(){
  const { user } = useAuth();
  const isGuest = user?.username === "guest";

  const [loading, setLoading] = useState(false); // 데이터를 불러오는 중인지 여부
  const [report, setReport] = useState(null);    // 받아온 주간 리포트 데이터 저장

  // 주간 요약 생성 요청
  async function generate(){
    setLoading(true); // 로딩 시작
    try{
      const { data } = await axios.get("/api/summary/weekly", {
        params: { username: user.username }
      }); // GET 요청 + 유저이름
      setReport(data); // 받아온 데이터를 상태에 저장
    } finally {
      setLoading(false); // 로딩 끝
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow">
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-semibold">Weekly Summary</h3>
        <button
          onClick={generate} // Generate 버튼 누르면 generate() 함수 실행
          disabled={loading || isGuest} // 게스트면 비활성화
          className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
        >
          {loading
            ? "Generating..."
            : isGuest
            ? "Unavailable"
            : "Generate"}
        </button>
      </div>

      {/* 조건부 렌더링: report가 있을 때만 요약 결과 표시 */}
      {report && (
        <div className="mt-3 space-y-2">
          <div className="text-sm opacity-70">
            7-day avg: <b>{report.avg} mg/dL</b>
          </div>

          {/* spike.delta가 존재할 경우만 spike 정보 표시 */}
          {report.spike?.delta > 0 && (
            <div className="text-sm opacity-70">
              Largest spike: +{report.spike.delta} mg/dL (around{" "}
              {report.spike.to?.date} {report.spike.to?.timeSlot})
            </div>
          )}

          {/* AI 요약 메시지 출력 */}
          <div className="p-3 rounded border bg-green-50 dark:bg-green-900/30">
            {report.message}
          </div>
        </div>
      )}
    </div>
  );
}
