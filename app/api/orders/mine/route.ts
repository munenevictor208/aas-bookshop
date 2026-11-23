import { checkIpRateLimit, getClientIp } from "@/lib/auth";
import { listCustomerOrders } from "@/lib/orders";
import { isSameOriginRequest } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ message: "Invalid request origin." }, { status: 403 });
  }
  if (!(await checkIpRateLimit(await getClientIp()))) {
    return Response.json({ message: "Too many requests." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ orders: [] });
  }

  const references =
    typeof body === "object" && body !== null && Array.isArray((body as { references?: unknown }).references)
      ? ((body as { references: unknown[] }).references as { orderNumber: string; phone: string }[])
      : [];

  return Response.json({ orders: await listCustomerOrders(references) });
}
