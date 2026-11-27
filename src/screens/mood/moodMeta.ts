import React from 'react';
import {
  AlertCircle,
  BatteryLow,
  CloudRain,
  Flame,
  Laugh,
  Meh,
  Smile,
  Zap,
} from 'lucide-react-native';
import { Colors } from '../../constants/theme';

export type MoodKey =
  | 'Very Happy'
  | 'Happy'
  | 'Neutral'
  | 'Sad'
  | 'Anxious'
  | 'Stressed'
  | 'Angry'
  | 'Exhausted';

export interface MoodEntryRow {
  id: string;
  mood: MoodKey;
  intensity: number;
  triggers: string[];
  reflection: string | null;
  entry_date: string;
}

export const MOOD_OPTIONS: {
  key: MoodKey;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  bg: string;
  accent: string;
}[] = [
  { key: 'Very Happy', Icon: Laugh, bg: Colors.mint, accent: '#3B9E6E' },
  { key: 'Happy', Icon: Smile, bg: '#E6F7EE', accent: '#4CAF82' },
  { key: 'Neutral', Icon: Meh, bg: Colors.skyblue, accent: '#4F86B8' },
  { key: 'Sad', Icon: CloudRain, bg: '#E3ECF7', accent: '#5D7EA8' },
  { key: 'Anxious', Icon: AlertCircle, bg: Colors.lavender, accent: '#7C5CBF' },
  { key: 'Stressed', Icon: Zap, bg: Colors.peach, accent: '#D97742' },
  { key: 'Angry', Icon: Flame, bg: '#FDE8E8', accent: '#E05C5C' },
  { key: 'Exhausted', Icon: BatteryLow, bg: '#EFEFF5', accent: '#6B7280' },
];

export const TRIGGER_KEYS = [
  'academic',
  'assignments',
  'exams',
  'relationships',
  'family',
  'financial',
  'physical',
  'sleep',
  'social',
  'achievements',
  'other',
] as const;

export function getMoodMeta(mood: string) {
  return MOOD_OPTIONS.find((m) => m.key === mood) ?? MOOD_OPTIONS[2];
}
