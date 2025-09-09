// 아침/점심/저녁
export const TIME_SLOTS = ["Morning", "Noon", "Evening"];
export const MEAL_STATES = ["Fasting","Post-meal"]; // 식전/식후

export const MGDL_PER_MMOL = 18;
export const mgdlToMmol = (mg) => mg / MGDL_PER_MMOL;
export const mmolToMgdl = (mmol) => Math.round(mmol * MGDL_PER_MMOL);

// 뉴질랜드(로컬) 날짜 YYYY-MM-DD (UTC 오프셋 오류 방지)
export function todayLocalISO() {
  return new Date().toLocaleDateString("en-CA"); // e.g., 2025-08-31
}

// ISO 날짜(YYYY-MM-DD)에 일수 가감
export function shiftISO(isoDate, deltaDays) {
  const [y, m, d] = isoDate.split("-").map(Number); // 2025-09-06 -> [2025, 9, 6]
  const dt = new Date(y, m - 1, d); // Date 생성자는 month가 0부터 시작하므로 -1 함
  dt.setDate(dt.getDate() + deltaDays); // 현재 날짜에서 deltaDays 만큼 더하거나 뺌, 양수-> 미래, 음수-> 과거 e.g. deltaDays=3 -> 3일뒤로 이동
  return dt.toLocaleDateString("en-CA"); // YYYY-MM-DD
}


/**
 * mmol/L 기준 소수점 임계
 * Fasting:
 *   <3.9 저혈당
 *   3.9–5.5 정상
 *   5.6–6.9 경계(공복고혈당)
 *   ≥7.0 고위험
 * Post-meal (2h):
 *   <3.9 저혈당 (예외적으로 표기)
 *   <7.8 정상
 *   7.8–11.0 경계(내당능장애)
 *   ≥11.1 고위험
 */

// 값에 따른 색상 (원하면 기준 수정)
export function statusClassByMmolFromMg(mgdl, mealState){
  const mmol = mgdlToMmol(mgdl);
  if (mealState === "Fasting"){
    if (mmol < 3.9) return "text-red-600";
    if (mmol <= 5.5) return "text-green-600";
    if (mmol <= 6.9) return "text-yellow-600";
    return "text-red-600";
  } else {
    if (mmol < 3.9) return "text-red-600";
    if (mmol < 7.8) return "text-green-600";
    if (mmol <= 11.0) return "text-yellow-600";
    return "text-red-600";
  }
}