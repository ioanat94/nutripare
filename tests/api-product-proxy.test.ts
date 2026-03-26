import { GET } from '@/app/api/product/[code]/route';

function makeParams(code: string) {
  return { params: Promise.resolve({ code }) };
}

describe('GET /api/product/[code]', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 502 when upstream fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    const res = await GET(new Request('http://localhost'), makeParams('123'));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('returns 502 when res.ok is false', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    }));
    const res = await GET(new Request('http://localhost'), makeParams('123'));
    expect(res.status).toBe(502);
  });

  it('returns 404 when data.status is 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 0 }),
    }));
    const res = await GET(new Request('http://localhost'), makeParams('123'));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('returns 200 with data on success', async () => {
    const mockData = { status: 1, product: { product_name: 'Test' } };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    }));
    const res = await GET(new Request('http://localhost'), makeParams('123'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockData);
  });
});
