type CellData = {
  value: string;
  className: string;
  emoji: '👑' | '🚩' | null;
};
export type RowData = { label: string; cells: CellData[] };
