import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const INTERNAL_API =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000/api/v1";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ barCodigo: string }> },
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value ?? "";
  const { barCodigo } = await params;

  const formData = await req.formData();

  let apiRes: Response;
  try {
    apiRes = await fetch(`${INTERNAL_API}/barbearias/${barCodigo}/logo`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-tenant-id": barCodigo,
      },
      body: formData,
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
