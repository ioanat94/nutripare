'use client';

import { useState } from 'react';

const STORAGE_KEY = 'nutripare-table-expanded';

function readStored(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function useExpandedTable() {
  const [expanded, setExpanded] = useState<boolean>(readStored);

  function toggleExpanded() {
    const next = !expanded;
    setExpanded(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch (err) {
      console.error('Failed to persist table expansion:', err);
    }
  }

  return { expanded, toggleExpanded };
}
