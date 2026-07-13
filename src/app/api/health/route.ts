import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "so-mais-uma-fase",
    time: new Date().toISOString()
  });
}
