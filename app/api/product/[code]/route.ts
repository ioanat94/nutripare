import { NextResponse } from 'next/server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const url = `https://world.openfoodfacts.net/api/v2/product/${code}?fields=code,product_name,nutriments`;
  const res = await fetch(url, {
    headers: { Authorization: 'Basic ' + btoa('off:off') },
  });
  const data = await res.json();
  return NextResponse.json(data);
}
