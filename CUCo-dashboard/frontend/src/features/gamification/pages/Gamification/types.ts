export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  createdAt: Date;
}

export interface PlacedItem {
  itemId: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}