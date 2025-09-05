import express from "express"; // express: Node.js에서 서버를 쉽게 만들게 해주는 프레임워크
import cors from "cors"; // 브라우저에서 다른 도메인/포트의 API를 호출할 수 있게 해주는 CORS 허용 미들웨어
import Database from "better-sqlite3"; // better-sqlite3: 디스크에 파일로 저장되는 SQLite 데이터베이스를 동기식 API로 다루는 패키지
import OpenAI from "openai";


const app = express(); // 서버 앱 인스턴스 생성
app.use(cors()); //모든 출처에서 오는 요청을 허용(개발 편의). 배포 시엔 cors({ origin: "https://내-프론트-도메인" })처럼 제한하는 게 좋음
app.use(express.json()); // 들어오는 JSON body을 자동으로 파싱해 req.body에 넣어줌

// ---- SQLite (파일 생성됨)
const db = new Database("./data.db"); // 파일 생성 및 연결
// SQL 실행, logs 테이블 없으면 생성
db.exec(`
CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,        -- YYYY-MM-DD (local)
  timeSlot TEXT NOT NULL,    -- Morning|Noon|Evening
  value INTEGER NOT NULL
);
`);

// ---- Logs API - 클라이어트가 보낸 기록 저장(POST)
app.post("/api/logs", (req, res) => { 
  const { date, timeSlot, value } = req.body || {}; // 값 꺼냄

  // 유효성 검사
  if (!date || !timeSlot || typeof value !== "number") {
    return res.status(400).json({ error: "Invalid payload" });
  }
  // prepare: ?로 준비된 쿼리를 만들고 run으로 만든다.
  const stmt = db.prepare("INSERT INTO logs (date, timeSlot, value) VALUES (?, ?, ?)");
  // 실제 값을 바인딩 해서 INSERT 실행
  stmt.run(date, timeSlot, value);
  return res.json({ ok: true }); //성공 시, ok:true 반환
});

// ---- Logs API - 조회(GET) : 최근 일주일 또는 30일 데이터를 조회
app.get("/api/logs", (req, res) => {
  const { range = "week" } = req.query;
  const today = new Date();
  const past = new Date(today);
  past.setDate(today.getDate() - (range === "week" ? 7 : 30));

  // 로컬 YYYY-MM-DD
  const from = past.toLocaleDateString("en-CA");
  const to = today.toLocaleDateString("en-CA");

  // prepare: ?로 준비된 쿼리를 만들고 run으로 만든다.
  const stmt = db.prepare(`
    SELECT date, timeSlot, value
    FROM logs
    WHERE date BETWEEN ? AND ?
    ORDER BY date DESC, id DESC
  `);
  const items = stmt.all(from, to);
  return res.json({ items });
});

// ---- AI Coach (일반 정보/동기부여용, 의료 자문 아님)
//환경변수 OPENAI_API_KEY에서 키를 읽어 OpenAI 클라이언트 생성.
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 이 코드는 프론트엔드에서 유저가 혈당 수치(value)와 시간대(timeSlot)을 보내면 Open AI를 GPT를 활용해서 조언을 만들어주는 백엔드 API
// 누군가가 /api/coach라는 주소에 POST 요청을 보내면, 아래 함수를 실행해줘
app.post("/api/coach", async (req, res) => {
  const { value, timeSlot } = req.body || {};
  // 유효성 검사
  if (typeof value !== "number" || !timeSlot) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const prompt = `
You are a supportive diabetes coach.
Blood sugar: ${value} mg/dL, time: ${timeSlot}.
Reply in 1–2 short sentences with encouragement and a practical, non-clinical tip.
Avoid medical diagnosis; general wellness suggestions only.
`;

  try {
    // GPT에게 요청 보내기
    const out = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 모델명
      messages: [{ role: "user", content: prompt }], // 메세지 내용
      temperature: 0.7, // 창의성 정도
    });
    // GPT 답변 저장
    const message = out.choices?.[0]?.message?.content?.trim() || "Keep up the good habits!";
    // 클라이언트에게 응답 보내기
    res.json({ message });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "AI service error" });
  }
});

// 서버를 PORT 번호로 실행시킴
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log("Server running on http://localhost:" + PORT));
