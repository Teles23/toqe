import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const INTERNAL_API =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000/api/v1";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value ?? "";
  const body = await req.json().catch(() => ({}));

  let apiRes: Response;
  try {
    apiRes = await fetch(`${INTERNAL_API}/auth/2fa/setup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json(
      { message: "Serviço indisponível." },
      { status: 503 },
    );
  }

  const data = await apiRes.json().catch(() => ({}));
  return NextResponse.json(data, { status: apiRes.status });
}
