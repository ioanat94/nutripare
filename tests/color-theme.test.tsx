import * as fs from 'fs';
import * as path from 'path';

import { render } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('next/font/google', () => ({
  Geist: () => ({ variable: '--font-geist-sans' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono' }),
}));

import RootLayout from '@/app/layout';

const globalsCss = fs.readFileSync(
  path.resolve(__dirname, '../app/globals.css'),
  'utf-8'
);

describe('Color theme', () => {
  describe('globals.css', () => {
    it('contains --primary in :root block with a non-grey value', () => {
      const rootBlock = globalsCss.match(/:root\s*\{([^}]+)\}/)?.[1] ?? '';
      const primaryMatch = rootBlock.match(/--primary:\s*([^;]+);/);
      expect(primaryMatch).not.toBeNull();
      const value = primaryMatch![1].trim();
      // Grey values have chroma of 0; our teal-green has C=0.17
      expect(value).not.toMatch(/oklch\([^)]*\s0\s0[^)]*\)/);
    });

    it('contains --primary in .dark block with a non-grey value', () => {
      const darkBlock = globalsCss.match(/\.dark\s*\{([^}]+)\}/)?.[1] ?? '';
      const primaryMatch = darkBlock.match(/--primary:\s*([^;]+);/);
      expect(primaryMatch).not.toBeNull();
      const value = primaryMatch![1].trim();
      expect(value).not.toMatch(/oklch\([^)]*\s0\s0[^)]*\)/);
    });

    it('has all core tokens present and non-empty in :root', () => {
      const rootBlock = globalsCss.match(/:root\s*\{([^}]+)\}/)?.[1] ?? '';
      const coreTokens = ['--background', '--foreground', '--primary', '--primary-foreground', '--border', '--ring'];
      for (const token of coreTokens) {
        expect(rootBlock).toMatch(new RegExp(`${token}:\\s*[^;]+;`));
      }
    });

    it('has all core tokens present and non-empty in .dark', () => {
      const darkBlock = globalsCss.match(/\.dark\s*\{([^}]+)\}/)?.[1] ?? '';
      const coreTokens = ['--background', '--foreground', '--primary', '--primary-foreground', '--border', '--ring'];
      for (const token of coreTokens) {
        expect(darkBlock).toMatch(new RegExp(`${token}:\\s*[^;]+;`));
      }
    });
  });

  describe('RootLayout', () => {
    it('applies dark class to html element by default', () => {
      const { container } = render(
        <RootLayout>
          <div />
        </RootLayout>
      );
      const html = container.closest('html') ?? document.documentElement;
      expect(html).toHaveClass('dark');
    });
  });
});
