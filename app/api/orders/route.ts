import { checkIpRateLimit, getClientIp } from "@/lib/auth";
import { createOrder } from "@/lib/orders";
import { isSameOriginRequest } from "@/lib/security";

export const dynamic = "force-dynamic";

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ message: "Invalid request origin." }, { status: 403 });
  }
  if (!(await checkIpRateLimit(await getClientIp()))) {
    return Response.json({ message: "Too many orders. Please try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid order details." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return Response.json({ message: "Invalid order details." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const customer = data.customer as Record<string, unknown> | undefined;
  if (!customer || !Array.isArray(data.items)) {
    return Response.json({ message: "Invalid order details." }, { status: 400 });
  }

  const items = data.items.map((entry: unknown) => {
    const item = entry as Record<string, unknown> | null;
    return {
      productId: Number(item?.productId),
      quantity: Number(item?.quantity),
    };
  });

  try {
    const order = await createOrder({
      customer: {
        name: stringValue(customer.name),
        phone: stringValue(customer.phone),
        email: stringValue(customer.email),
        address: stringValue(customer.address),
      },
      payment: stringValue(data.payment),
      notificationMethod: stringValue(data.notificationMethod) as "SMS" | "WhatsApp",
      items,
    });
    return Response.json({ order }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not place order.";
    return Response.json({ message }, { status: 400 });
  }
}
