import { NextResponse, type NextRequest } from "next/server";
import { checkApiKey } from "@/lib/apiAuth";
import { listApiProducts, createApiProduct, type CreateProductInput } from "@/lib/apiProducts";

export async function GET(request: NextRequest) {
  const authError = checkApiKey(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const products = await listApiProducts({
    categorySlug: searchParams.get("category") ?? undefined,
    status: status === "active" || status === "paused" ? status : "all",
    search: searchParams.get("search") ?? undefined,
  });

  return NextResponse.json({ products });
}

export async function POST(request: NextRequest) {
  const authError = checkApiKey(request);
  if (authError) return authError;

  let body: CreateProductInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido no corpo da requisição." }, { status: 400 });
  }

  const result = await createApiProduct(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ product: result.data }, { status: 201 });
}
