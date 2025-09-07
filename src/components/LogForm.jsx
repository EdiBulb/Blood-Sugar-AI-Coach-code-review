import { useState } from "react";
import axios from "axios"; // 서버와 데이터 주고 받기(API 요청)
import { TIME_SLOTS, todayLocalISO } from "../utils";

// 혈당 기록 입력 폼 컴포넌트: 폼에 혈당 수치를 입력하고 저장하면 서버에 기록을 남기고, 추가로 AI 코치 메세지를 받아온다.

export default function LogForm({ onSaved, setCoachMessage }) {
  const [value, setValue] = useState(""); // 혈당 수치
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]); // 시간대(default: morning)
  const [showNote, setShowNote] = useState(false); // 메모 영역 보이기/숨기기 상태
  const [note, setNote] = useState(""); // 메모 내용
  const today = todayLocalISO();  // 오늘 날짜

  // 폼 제출 버튼 클릭 시, 
  async function handleSubmit(e) {
    e.preventDefault(); // 폼 제출 시 새로고침 방지
    const num = Number(value); // 입력된 값 숫자로 변환
    if (!num || num <= 0) return; // 값이 없거나 음수면 중단

    // 1) 로그(사용자 입력값) 저장
    await axios.post("/api/logs", { date: today, timeSlot, value: num, note: showNote ? note : "" });

    // 2) AI 코치 메시지 받아옴 - 혈당값과 시간대를 보낼 경우, 
    const { data } = await axios.post("/api/coach", { value: num, timeSlot });
    setCoachMessage?.(data.message);

    setValue("");
    setNote("");
    onSaved?.();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow">
      <h2 className="text-xl font-semibold mb-3">Today’s blood sugar</h2>
      <div className="flex gap-3 items-end flex-wrap">
        <div>
          <label className="block text-sm">Date</label>
          <input className="border rounded px-3 py-2 w-40 bg-gray-800" value={today} readOnly />
        </div>

        <div>
          <label className="block text-sm">Time</label>
            {/* 시간대 선택 드랍다운 */}
          <select 
            className="border rounded px-3 py-2 bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
            value={timeSlot} 
            onChange={(e) => setTimeSlot(e.target.value)} 
          >
            {TIME_SLOTS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm">Blood sugar (mg/dL)</label>
          <input
            type="number"
            min={50}
            max={400}
            className="border rounded px-3 py-2 w-40"
            placeholder="e.g. 145"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
          />
        </div>

        <button
          type="button"
          onClick={()=>setShowNote(v=>!v)}
          className="px-3 py-2 rounded border bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          {showNote ? "Hide memo" : "Memo add"}
        </button>
        
        <button className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:opacity-90">
          Save & Get Tip
        </button>
      </div>
      {/* 메모 입력창 - 조건부 렌더링 */}
      {showNote && (
        <div className="mt-3">
          <label className="block text-sm mb-1">Memo (Food/Exercise/Fasting etc)</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows={3}
            placeholder="예: Breakfast Oat Milk, 20mins walk, fasting Blood check"
            value={note}
            onChange={(e)=>setNote(e.target.value)}
          />
        </div>
      )}
    </form>
  );
}
