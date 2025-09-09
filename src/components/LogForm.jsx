import { useState } from "react";
import axios from "axios"; // 서버와 데이터 주고 받기(API 요청)
import { TIME_SLOTS, MEAL_STATES, todayLocalISO, mmolToMgdl, shiftISO } from "../utils";

// 혈당 기록 입력 폼 컴포넌트: 폼에 혈당 수치를 입력하고 저장하면 서버에 기록을 남기고, 추가로 AI 코치 메세지를 받아온다.

export default function LogForm({ onSaved, setCoachMessage }) {
  const [valueMmol, setValueMmol] = useState("");       // mmol/L로 입력

  const [dateISO, setDateISO] = useState(todayLocalISO()); // 날짜 상태 // 기본값: 오늘

  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]); // 시간대(default: morning)
  const [mealState, setMealState] = useState(MEAL_STATES[0]); // Fasting | Post-meal

  const [showNote, setShowNote] = useState(false); // 메모 영역 보이기/숨기기 상태
  const [note, setNote] = useState(""); // 메모 내용

  // 폼 제출 버튼 클릭 시, 
  async function handleSubmit(e) {
    e.preventDefault(); // 폼 제출 시 새로고침 방지
    const mmol = Number(valueMmol);
    if (!mmol || mmol < 2 || mmol > 40) return; // 간단 범위 체크
    const mgdl = mmolToMgdl(mmol);

    // 1) 로그(사용자 입력값) 저장
    await axios.post("/api/logs", { 
      date: dateISO, // 선택한 날짜로 저장 
      timeSlot, value: mgdl, note: showNote ? note : "", mealState  });

    // 2) AI 코치 메시지 받아옴 - 혈당값과 시간대, 공복여부를 보낼 경우, 
    const { data } = await axios.post("/api/coach", { value: mgdl, timeSlot, mealState  });
    setCoachMessage?.(data.message);

    setValueMmol("");
    setNote("");
    onSaved?.();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow">
      <h2 className="text-xl font-semibold mb-3">Today’s blood sugar</h2>
      <div className="flex gap-3 items-end flex-wrap">
        {/* 날짜 + 위/아래 토글 */}
        <div>
          <label className="block text-sm">Date</label>
          <div className="flex items-center gap-1">
            <input
              type="date"
              className="border rounded px-3 py-2 w-44 bg-white dark:bg-gray-700 dark:text-gray-100"
              value={dateISO}
              onChange={(e)=>setDateISO(e.target.value)}
            />
            <div className="flex flex-col">
              <button
                type="button"
                title="다음 날"
                className="w-6 h-6 text-xs flex items-center justify-center border rounded-t bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600"
                onClick={()=>setDateISO(prev=>shiftISO(prev, +1))}
              >▲</button>
              <button
                type="button"
                title="이전 날"
                className="w-6 h-6 text-xs flex items-center justify-center border rounded-b bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600"
                onClick={()=>setDateISO(prev=>shiftISO(prev, -1))}
              >▼</button>
            </div>
          </div>
        </div>
        {/* 시간대 */}
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
        {/* 식전/식후 */}
        <div>
          <label className="block text-sm">Fasting / Post-meal</label>
          <select
            className="border rounded px-3 py-2 bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
            value={mealState}
            // onChange: select 박스에서 항목을 선택했을 때 실행되는 이벤트 핸들러
            onChange={(e)=>setMealState(e.target.value)} // e.target.value: 현재 선택된 값 // e.g. Post-meal or Fasting
          >
            {/* MEAL_STATES 배열의 항목을 option 태그로 만듬, React는 리스트를 렌더링할 때 각 항목에 고유한 key가 필요함 */}
            {MEAL_STATES.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>

        {/* 혈당 */}
        <div>
          <label className="block text-sm">Blood sugar (mmol/L)</label>
          <input
            type="number" step="0.1" min={2} max={40}
            className="border rounded px-3 py-2 w-44"
            placeholder="e.g.: 7.2"
            value={valueMmol}
            onChange={(e)=>setValueMmol(e.target.value)}
            required
          />
        </div>
        {/* 메모 토글 */}
        <button
          type="button"
          onClick={()=>setShowNote(v=>!v)}
          className="px-3 py-2 rounded border bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          {showNote ? "Hide memo" : "Memo add"}
        </button>
        
        {/* 저장 */}
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
