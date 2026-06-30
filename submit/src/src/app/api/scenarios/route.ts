// 시나리오 영속 저장 API — database/scenarios.json 파일에 읽기/쓰기.
// 이 라우트 덕분에 생성한 시나리오가 새로고침해도 남고, src 폴더를 통째로
// 복사하면 database/ 안의 데이터도 함께 따라간다(서버가 없으면 클라이언트가
// localStorage로 폴백 — scenarioStore.ts 참고).
import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DB_DIR = path.join(process.cwd(), "database");
const DB_FILE = path.join(DB_DIR, "scenarios.json");

async function ensureDb() {
  await fs.mkdir(DB_DIR, { recursive: true });
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.writeFile(DB_FILE, "[]", "utf8");
  }
}

export async function GET() {
  try {
    await ensureDb();
    const raw = await fs.readFile(DB_FILE, "utf8");
    const data = JSON.parse(raw || "[]");
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch {
    return NextResponse.json([]);
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const arr = Array.isArray(body) ? body : [];
    await ensureDb();
    await fs.writeFile(DB_FILE, JSON.stringify(arr, null, 2), "utf8");
    return NextResponse.json({ ok: true, count: arr.length });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
