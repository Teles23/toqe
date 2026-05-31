import { NextRequest, NextResponse } from "next/server";
import { getInternalApiUrl } from "../../_lib/internal-api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { message: "E-mail não informado" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(
      `${getInternalApiUrl()}/auth/check-email?email=${encodeURIComponent(email)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );

    if (!res.ok) {
      return NextResponse.json({ exists: false }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Serviço indisponível" },
      { status: 503 },
    );
  }
}
