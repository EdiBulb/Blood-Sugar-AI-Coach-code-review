// 아침/점심/저녁
export const TIME_SLOTS = ["Morning", "Noon", "Evening"];

// 뉴질랜드(로컬) 날짜 YYYY-MM-DD (UTC 오프셋 오류 방지)
export function todayLocalISO() {
  return new Date().toLocaleDateString("en-CA"); // e.g., 2025-08-31
}

// 값에 따른 색상 (원하면 기준 수정)
export function statusClass(value) {
  if (value < 70) return "text-red-600";         // 저혈당
  if (value <= 140) return "text-green-600";     // 정상
  if (value <= 180) return "text-yellow-600";    // 경계
  return "text-red-600";                         // 고혈당
}
