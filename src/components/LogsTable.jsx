import { useMemo, useState } from "react";
import axios from "axios";
import { mgdlToMmol, statusClassByMmolFromMg } from "../utils";

export default function LogsTable({ logs = [], onChanged }){
  // 삭제 모드 & 선택 상태
  const [selectMode, setSelectMode] = useState(false); // 삭제 모드 활성화 여부
  const [selected, setSelected] = useState(new Set()); // id Set

  const rows = useMemo(()=> logs.map(r => ({
    ...r,
    mmol: mgdlToMmol(r.value)
  })), [logs]);

  function toggleSelected(id){
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // 삭제 버튼 핸들러
  async function onDeleteButton(){
    if (!selectMode){
      // 1) 일반 모드 → 삭제 모드 진입
      setSelectMode(true);
      setSelected(new Set());
      return;
    }
    // 2) 삭제 모드 상태
    if (selected.size > 0){
      // 실제 삭제
      const ids = Array.from(selected);
      await axios.delete("/api/logs", { data: { ids } });
      setSelected(new Set());
      setSelectMode(false);
      onChanged?.(); // 새로고침
    } else {
      // 선택 없음 → 완료(삭제 모드 해제)
      setSelectMode(false);
    }
  }

  // 버튼 라벨 규칙
  const deleteLabel = !selectMode ? "Delete" : (selected.size > 0 ? "Delete" : "Done");

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow overflow-auto">
      <div className="flex items-center mb-3">
        <h3 className="text-lg font-semibold">Recent Logs</h3>
        <button
          onClick={onDeleteButton}
          className="ml-auto px-3 py-1 rounded bg-red-600 text-white"
        >
          {deleteLabel}
        </button>
      </div>

      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            {selectMode && <th className="py-2 pr-2 w-8"></th>}
            <th className="py-2 pr-4">Date</th>
            <th className="py-2 pr-4">Time</th>
            <th className="py-2 pr-4">Meal</th>
            <th className="py-2 pr-4">Value (mmol/L)</th>
            <th className="py-2 pr-4">Memo</th>
          </tr>
        </thead>
        {/* 테이블 바디 - 데이터 렌더링 */}
        <tbody>
          {rows.map((row)=>(
            <tr key={row.id} className="border-b last:border-none align-top">
              {selectMode && (
                <td className="py-2 pr-2">
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={()=>toggleSelected(row.id)}
                  />
                </td>
              )}
              <td className="py-2 pr-4">{row.date}</td>
              <td className="py-2 pr-4">{row.timeSlot}</td>
              <td className="py-2 pr-4">{row.mealState || "-"}</td>
              <td className={`py-2 pr-4 font-semibold ${statusClassByMmolFromMg(row.value, row.mealState || 'Fasting')}`}>
                {row.mmol.toFixed(1)}
              </td>
              <td className="py-2 pr-4 whitespace-pre-wrap">{row.note || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
