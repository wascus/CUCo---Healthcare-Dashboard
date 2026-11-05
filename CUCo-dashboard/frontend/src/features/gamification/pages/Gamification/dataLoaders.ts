import type { JournalEntry } from './types';

function getStorageKey(key: string, userId: string | null): string {
  return userId ? `${key}:${userId}` : key;
}

export const loadDiaryEntries = (userId?: string | null): JournalEntry[] => {
  try {
    const key = getStorageKey('diary-entries', userId ?? null);
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((entry: any) => ({
        ...entry,
        createdAt: new Date(entry.createdAt)
      }));
    }
  } catch (error) {
    console.error('Error loading diary entries:', error);
  }
  return [];
};