import { NextResponse } from 'next/server';

const baseUrl = process.env.OPENFOODFACTS_BASE_URL;
const isStaging = baseUrl?.includes('.net') ?? false;
const stagingAuth = process.env.OPENFOODFACTS_STAGING_AUTH
  ? Buffer.from(process.env.OPENFOODFACTS_STAGING_AUTH).toString('base64')
  : null;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  if (!baseUrl) {
    return NextResponse.json(
      { error: 'Server misconfiguration' },
      { status: 500 },
    );
  }

  const { code } = await params;
  if (!/^\d{1,14}$/.test(code)) {
    return NextResponse.json({ error: 'Invalid barcode' }, { status: 400 });
  }

  const url = `${baseUrl}/api/v2/product/${code}?fields=code,product_name,nutriments`;
  const headers: Record<string, string> = {
    'User-Agent': 'Nutripare/1.0 (nutripare@gmail.com)',
  };
  if (isStaging && stagingAuth) {
    headers['Authorization'] = `Basic ${stagingAuth}`;
  }

  try {
    const res = await fetch(url, { headers, next: { revalidate: 3600 } });
    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
    }
    const data = await res.json();
    if (data.status === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 502 },
    );
  }
}
