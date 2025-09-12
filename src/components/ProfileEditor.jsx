import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../auth/AuthContext";

export default function ProfileEditor(){
  const { user } = useAuth();
  const isGuest = user?.username === "guest";

  const [form, setForm] = useState({  // form: 사용자의 입력 데이터를 저장하는 객체
    goals:'', 
    diet:'', 
    exercise:'', 
    target_min:80, 
    target_max:140 
  });
  const [saved, setSaved] = useState(false); // saved: 저장 여부

  // useEffect로 초기 데이터 불러오기
  useEffect(()=>{
    (async ()=>{
      const { data } = await axios.get("/api/profile", {
        params: { username: user.username }
      });
      if (data) setForm(data); // 컴포넌트가 처음 렌더링될 때, /api/profile에서 데이터를 불러와서 form을 초기화함
    })();
  },[]); // 빈 []은 useEffect가 처음 한 번만 실행되도록 설정

  // 커스텀 set(k,v)함수
  function set(k,v){ setForm(prev => ({ ...prev, [k]:v })); }

  async function save(){
    await axios.put("/api/profile", {
      username: user.username,
      goals: form.goals, 
      diet: form.diet, 
      exercise: form.exercise,
      target_min: Number(form.target_min), 
      target_max: Number(form.target_max)
    });
    setSaved(true); 
    setTimeout(()=>setSaved(false), 1500); // 1.5초 후 다시 꺼줌
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow">
      <h3 className="text-lg font-semibold mb-3">
        My Goals & Lifestyle{" "}
        {isGuest && <span className="text-red-500 text-sm">(Read-only)</span>}
      </h3>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Goals (자유 서술)</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows={3}
            value={form.goals}
            onChange={(e)=>set('goals', e.target.value)}
            disabled={isGuest}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Diet (식습관)</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows={3}
            value={form.diet}
            onChange={(e)=>set('diet', e.target.value)}
            disabled={isGuest}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Exercise (운동 습관)</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows={3}
            value={form.exercise}
            onChange={(e)=>set('exercise', e.target.value)}
            disabled={isGuest}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Target range (mg/dL)</label>
          <div className="flex gap-2">
            <input
              type="number"
              className="border rounded px-3 py-2 w-28"
              value={form.target_min}
              onChange={(e)=>set('target_min', e.target.value)}
              disabled={isGuest}
            />
            <span className="self-center">~</span>
            <input
              type="number"
              className="border rounded px-3 py-2 w-28"
              value={form.target_max}
              onChange={(e)=>set('target_max', e.target.value)}
              disabled={isGuest}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={save}
          className="px-4 py-2 rounded bg-blue-600 text-white"
          disabled={isGuest}
        >
          Save
        </button>
        {saved && (
          <span className="text-green-600 text-sm self-center">Saved ✅</span>
        )}
      </div>
    </div>
  );
}
