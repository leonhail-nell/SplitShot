import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/mobileAuth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ user });
}
