import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const baseUrl = process.env.OPENFOODFACTS_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 },
    );
  }

  const isStaging = baseUrl.includes(".net");
  const stagingAuth = process.env.OPENFOODFACTS_STAGING_AUTH
    ? Buffer.from(process.env.OPENFOODFACTS_STAGING_AUTH).toString("base64")
    : null;

  const { code } = await params;
  if (!/^\d{1,14}$/.test(code)) {
    return NextResponse.json({ error: "Invalid barcode" }, { status: 400 });
  }

  const url = `${baseUrl}/api/v2/product/${code}?fields=code,product_name,product_name_en,product_name_fi,nutriments`;
  const headers: Record<string, string> = {
    "User-Agent": "Nutripare/1.0 (nutripare@gmail.com)",
  };
  if (isStaging && stagingAuth) {
    headers["Authorization"] = `Basic ${stagingAuth}`;
  }

  try {
    let res = await fetch(url, { headers, next: { revalidate: 3600 } });
    if (res.status === 429) {
      // Wait for the upstream rate limit to clear, then retry once.
      // The cache won't help here since the first fetch already missed it.
      const retryAfterRaw = parseInt(res.headers.get("Retry-After") ?? "", 10);
      const retryAfter = Number.isFinite(retryAfterRaw) ? retryAfterRaw : 2;
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      res = await fetch(url, { headers, next: { revalidate: 3600 } });
    }
    if (!res.ok) {
      console.error(
        `[product/${code}] upstream ${res.status} ${res.statusText}`,
      );
      return NextResponse.json(
        { error: "Upstream error", upstream: res.status },
        { status: res.status === 429 ? 429 : 502 },
      );
    }
    const data = await res.json();
    if (data.status === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 502 },
    );
  }
}
