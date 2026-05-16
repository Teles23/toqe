import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const INTERNAL_API =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000/api/v1";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value ?? "";

  let apiRes: Response;
  try {
    apiRes = await fetch(`${INTERNAL_API}/auth/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
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

export async function DELETE() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value ?? "";

  let apiRes: Response;
  try {
    apiRes = await fetch(`${INTERNAL_API}/auth/sessions`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
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
