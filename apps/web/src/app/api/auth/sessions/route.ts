import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getInternalApiUrl } from "../../_lib/internal-api";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value ?? "";

  let apiRes: Response;
  try {
    apiRes = await fetch(`${getInternalApiUrl()}/auth/sessions`, {
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
    apiRes = await fetch(`${getInternalApiUrl()}/auth/sessions`, {
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
