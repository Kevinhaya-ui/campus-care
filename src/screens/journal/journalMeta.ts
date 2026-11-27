export const JOURNAL_TAG_KEYS = [
  'academic',
  'personal',
  'relationships',
  'family',
  'achievement',
  'reflection',
  'other',
] as const;

export type JournalTagKey = (typeof JOURNAL_TAG_KEYS)[number];

export interface JournalEntryRow {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  mood: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}
