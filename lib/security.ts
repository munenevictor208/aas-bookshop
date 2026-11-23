export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    const originUrl = new URL(origin);
    if (originUrl.protocol !== "http:" && originUrl.protocol !== "https:") {
      return false;
    }
    const trustProxy = process.env.TRUST_PROXY_HEADERS === "1";
    const host = trustProxy
      ? request.headers.get("x-forwarded-host") ?? new URL(request.url).host
      : new URL(request.url).host;
    return originUrl.host === host;
  } catch {
    return false;
  }
}
