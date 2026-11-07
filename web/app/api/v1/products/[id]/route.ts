import { NextResponse, type NextRequest } from "next/server";
import { checkApiKey } from "@/lib/apiAuth";
import { fetchApiProduct, updateApiProduct, deleteApiProduct, type UpdateProductInput } from "@/lib/apiProducts";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const authError = checkApiKey(request);
  if (authError) return authError;

  const { id } = await params;
  const product = await fetchApiProduct(id);
  if (!product) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const authError = checkApiKey(request);
  if (authError) return authError;

  const { id } = await params;
  let body: UpdateProductInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido no corpo da requisição." }, { status: 400 });
  }

  const result = await updateApiProduct(id, body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ product: result.data });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authError = checkApiKey(request);
  if (authError) return authError;

  const { id } = await params;
  const result = await deleteApiProduct(id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
