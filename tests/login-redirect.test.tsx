// Tests for the safeRedirect helper extracted from app/login/page.tsx.
// The helper is not exported, so we replicate it here to keep tests pure.
function safeRedirect(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

describe('safeRedirect', () => {
  it('passes through a valid relative URL', () => {
    expect(safeRedirect('/compare')).toBe('/compare');
  });

  it('falls back to / for an external URL', () => {
    expect(safeRedirect('https://evil.com')).toBe('/');
  });

  it('falls back to / for a protocol-relative URL', () => {
    expect(safeRedirect('//evil.com')).toBe('/');
  });

  it('falls back to / for an empty string', () => {
    expect(safeRedirect('')).toBe('/');
  });

  it('falls back to / for null', () => {
    expect(safeRedirect(null)).toBe('/');
  });
});
