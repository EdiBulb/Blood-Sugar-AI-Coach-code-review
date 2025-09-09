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
  value INTEGER NOT NULL,
  note TEXT,
  mealState TEXT            -- 'Fasting' | 'Post-meal'

);
`);

// profile 테이블 (개인 목표/습관)
db.exec(`
CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY CHECK (id=1),
  goals TEXT,
  diet TEXT,
  exercise TEXT,
  target_min INTEGER,
  target_max INTEGER
);
`);
db.prepare(`
INSERT OR IGNORE INTO profile (id, goals, diet, exercise, target_min, target_max)
VALUES (1, '', '', '', 80, 140);
`).run();


// ---- Logs API - 클라이어트가 보낸 기록 저장(POST)
app.post("/api/logs", (req, res) => { 
  const { date, timeSlot, value, note  ='', mealState = 'Fasting' } = req.body || {}; // 값 꺼냄

  // 유효성 검사
  if (!date || !timeSlot || typeof value !== "number") {
    return res.status(400).json({ error: "Invalid payload" });
  }
  // prepare: ?로 준비된 쿼리를 만들고 run으로 만든다.
  const stmt = db.prepare("INSERT INTO logs (date, timeSlot, value, note, mealState) VALUES (?, ?, ?, ?, ?)");
  // 실제 값을 바인딩 해서 INSERT 실행
  stmt.run(date, timeSlot, value, note, mealState);
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
    SELECT id, date, timeSlot, value, note, mealState
    FROM logs
    WHERE date BETWEEN ? AND ?
    ORDER BY date DESC, id DESC
  `);
  const items = stmt.all(from, to);
  return res.json({ items });
});

// Logs API - 삭제
// 클라이언트가 /api/logs 경로에 DELETE요청을 보내면 이 콜백 함수가 실행됨
app.delete("/api/logs", (req, res) => {
  const { ids } = req.body || {}; // req.body가 비어있으면 {}로 대체하여 오류 방지
  // 유효성 검사 - ids가 배열인지 혹은 빈 배열인지 
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "ids array required" });
  }
  const stmt = db.prepare(`DELETE FROM logs WHERE id IN (${ids.map(()=>"?").join(",")})`);
  const info = stmt.run(ids); // 위의 쿼리에 ids배열을 넘겨서 실행
  res.json({ ok: true, deleted: info.changes });
});


// ---- Profile API ----
app.get("/api/profile", (req,res)=>{
  const row = db.prepare("SELECT * FROM profile WHERE id=1").get();
  res.json(row);
});

app.put("/api/profile", (req,res)=>{
  const { goals='', diet='', exercise='', target_min=80, target_max=140 } = req.body || {};
  db.prepare(`
    UPDATE profile SET goals=?, diet=?, exercise=?, target_min=?, target_max=? WHERE id=1
  `).run(goals, diet, exercise, target_min, target_max);
  res.json({ ok:true });
});

// ---- Weekly summary (raw + AI) ----
app.get("/api/summary/weekly/raw", (req,res)=>{
  const today=new Date(); const past=new Date(today); past.setDate(today.getDate()-7);
  const from=past.toLocaleDateString("en-CA"), to=today.toLocaleDateString("en-CA");
  const items = db.prepare(`
    SELECT date,timeSlot,value,note, mealState FROM logs WHERE date BETWEEN ? AND ? ORDER BY date ASC
  `).all(from,to);

  const avg = items.length ? Math.round(items.reduce((s,r)=>s+r.value,0)/items.length) : 0;

  // 최대 스파이크(인접 증가폭)
  let spike = { delta:0, from:null, to:null };
  for (let i=1;i<items.length;i++){
    const d = items[i].value - items[i-1].value;
    if (d>spike.delta) spike = { delta:d, from:items[i-1], to:items[i] };
  }
  res.json({ avg, items, spike });
});
//환경변수 OPENAI_API_KEY에서 키를 읽어 OpenAI 클라이언트 생성.
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.get("/api/summary/weekly", async (req,res)=>{
  const profile = db.prepare("SELECT * FROM profile WHERE id=1").get() || {};
  const today=new Date(); const past=new Date(today); past.setDate(today.getDate()-7);
  const from=past.toLocaleDateString("en-CA"), to=today.toLocaleDateString("en-CA");
  const items = db.prepare(`
    SELECT date,timeSlot,value,note, mealState FROM logs WHERE date BETWEEN ? AND ? ORDER BY date ASC
  `).all(from,to);

  const avg = items.length ? Math.round(items.reduce((s,r)=>s+r.value,0)/items.length) : 0;
  let spike = { delta:0, from:null, to:null };
  for (let i=1;i<items.length;i++){
    const d = items[i].value - items[i-1].value;
    if (d>spike.delta) spike = { delta:d, from:items[i-1], to:items[i] };
  }

  const prompt = `
You are a supportive diabetes coach. Create a brief weekly report in Korean (3–5 sentences).
Data (last 7 days):
Average mg/dL: ${avg}
Largest spike: ${spike.delta} (from ${spike.from?.value ?? "-"} to ${spike.to?.value ?? "-"}), around ${spike.to?.date ?? "-"} ${spike.to?.timeSlot ?? "-"}.
Logs (JSON): ${JSON.stringify(items)}
User profile:
- Goals: ${profile.goals}
- Diet: ${profile.diet}
- Exercise: ${profile.exercise}
- Target range: ${profile.target_min}-${profile.target_max} mg/dL

Instructions:
- Hypothesize likely causes using notes (meal/exercise/fasting).
- Give 1–2 concrete tips tailored to the user's profile and target range.
- Avoid medical diagnosis; give general, safe lifestyle coaching.
- Keep it concise.
  `;

  try {
    const out = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role:"user", content: prompt }],
      temperature: 0.6,
    });
    const message = out.choices?.[0]?.message?.content?.trim() || "이번 주 보고를 생성하지 못했습니다.";
    res.json({ avg, spike, message });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error:"AI summary error" });
  }
});



// ---- AI Coach (일반 정보/동기부여용, 의료 자문 아님)


// 이 코드는 프론트엔드에서 유저가 혈당 수치(value)와 시간대(timeSlot)을 보내면 Open AI를 GPT를 활용해서 조언을 만들어주는 백엔드 API
// 누군가가 /api/coach라는 주소에 POST 요청을 보내면, 아래 함수를 실행해줘
// ---- Coach (personalized) ----
app.post("/api/coach", async (req,res)=>{
  const { value, timeSlot } = req.body || {};
  const profile = db.prepare("SELECT * FROM profile WHERE id=1").get() || {};
  const recent = db.prepare("SELECT date,timeSlot,value,note, mealState FROM logs ORDER BY id DESC LIMIT 3").all();

  const prompt = `
Act as a concise diabetes lifestyle coach in Korean (1–2 sentences).
Current reading: ${value} mg/dL at ${timeSlot} (${req.body.mealState || 'Fasting'}).
User profile: goals=${profile.goals}; diet=${profile.diet}; exercise=${profile.exercise}; target=${profile.target_min}-${profile.target_max}.
Recent logs: ${JSON.stringify(recent)}
Give one encouraging, practical tip aligned with target range and profile. No diagnosis.
  `;
  try {
    const out = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role:"user", content: prompt }],
      temperature: 0.7,
    });
    const message = out.choices?.[0]?.message?.content?.trim() || "좋은 습관을 꾸준히 이어가요!";
    res.json({ message });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error:"AI coach error" });
  }
});

// 서버를 PORT 번호로 실행시킴
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log("Server running on http://localhost:" + PORT));
