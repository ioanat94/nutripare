import { NextResponse } from 'next/server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const url = `https://world.openfoodfacts.net/api/v2/product/${code}?fields=code,product_name,nutriments`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: 'Basic ' + btoa('off:off') },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
    }
    const data = await res.json();
    if (data.status === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 502 });
  }
}
