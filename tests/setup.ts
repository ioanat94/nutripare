import "@testing-library/jest-dom";

import React from "react";

import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import enMessages from "../messages/en.json";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

afterEach(() => {
  cleanup();
});

// Resolve a dot-notation key like "NutritionTable.perHundredG" against a nested object
function resolveKey(obj: Record<string, unknown>, key: string): string {
  const parts = key.split(".");
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur && typeof cur === "object") {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  return typeof cur === "string" ? cur : key;
}

const translatorCache = new Map<string, ReturnType<typeof makeTranslator>>();

function makeTranslator(namespace: string) {
  const ns = (enMessages as Record<string, unknown>)[namespace] as
    | Record<string, unknown>
    | undefined;

  function t(key: string, params?: Record<string, unknown>): string {
    let value = ns ? resolveKey(ns as Record<string, unknown>, key) : key;
    if (params && typeof value === "string") {
      for (const [k, v] of Object.entries(params)) {
        if (typeof v !== "function") {
          value = value.replace(`{${k}}`, String(v));
        }
      }
    }
    return value;
  }

  // t.rich renders the message with component replacements as React nodes
  t.rich = (key: string, params?: Record<string, unknown>): React.ReactNode => {
    const value = ns ? resolveKey(ns as Record<string, unknown>, key) : key;
    if (!params || typeof value !== "string") return value;

    // Simple tag parser: replace <tag>content</tag> with component(content)
    const parts: React.ReactNode[] = [];
    let remaining = value;
    const tagPattern = /<(\w+)>([\s\S]*?)<\/\1>/g;
    let lastIndex = 0;
    let match;
    while ((match = tagPattern.exec(value)) !== null) {
      if (match.index > lastIndex) {
        parts.push(remaining.slice(0, match.index - lastIndex));
      }
      const tagName = match[1];
      const content = match[2];
      const factory = params[tagName];
      if (typeof factory === "function") {
        parts.push(factory(content));
      } else {
        parts.push(content);
      }
      lastIndex = match.index + match[0].length;
      remaining = value.slice(lastIndex);
    }
    if (remaining) parts.push(remaining);
    return parts.length === 1
      ? parts[0]
      : React.createElement(React.Fragment, null, ...parts);
  };

  return t;
}

function getTranslator(namespace: string) {
  if (!translatorCache.has(namespace)) {
    translatorCache.set(namespace, makeTranslator(namespace));
  }

  return translatorCache.get(namespace)!;
}

// Mock next-intl so components work without NextIntlClientProvider in tests
vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => getTranslator(namespace),
  useLocale: () => "en",
  useMessages: () => enMessages,
}));

// Mock @/i18n/navigation so tests don't need locale-aware router
vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => {
    return React.createElement("a", { href, ...props }, children);
  },
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  redirect: vi.fn(),
}));
