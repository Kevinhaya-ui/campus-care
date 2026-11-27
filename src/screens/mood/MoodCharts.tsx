import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { getMoodMeta, MoodEntryRow } from './moodMeta';

interface WeeklyLineChartProps {
  entries: MoodEntryRow[];
  language: 'id' | 'en';
}

export function WeeklyIntensityLineChart({ entries, language }: WeeklyLineChartProps) {
  const days = Array.from({ length: 7 }, (_, i) =>
    dayjs().subtract(6 - i, 'day')
  );

  const pointsData = days.map((d) => {
    const dateStr = d.format('YYYY-MM-DD');
    const found = entries.find((e) => e.entry_date === dateStr);
    return {
      label: d.locale(language === 'id' ? 'id' : 'en').format('dd'),
      intensity: found ? found.intensity : null,
    };
  });

  const width = 300;
  const height = 140;
  const padX = 24;
  const padTop = 16;
  const padBottom = 26;
  const plotW = width - padX * 2;
  const plotH = height - padTop - padBottom;

  const getX = (idx: number) => padX + (idx / 6) * plotW;
  const getY = (val: number) => padTop + ((5 - val) / 4) * plotH;

  const validPoints = pointsData
    .map((p, idx) => (p.intensity !== null ? { x: getX(idx), y: getY(p.intensity), val: p.intensity } : null))
    .filter((p): p is { x: number; y: number; val: number } => p !== null);

  const pathD = validPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  return (
    <View style={styles.chartWrap}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {[1, 2, 3, 4, 5].map((level) => {
          const y = getY(level);
          return (
            <React.Fragment key={level}>
              <Line
                x1={padX}
                y1={y}
                x2={width - padX}
                y2={y}
                stroke="#EDF2F7"
                strokeWidth={1}
              />
              <SvgText
                x={8}
                y={y + 4}
                fontSize={10}
                fill={Colors.muted}
              >
                {level}
              </SvgText>
            </React.Fragment>
          );
        })}

        {validPoints.length >= 2 && (
          <Path
            d={pathD}
            fill="none"
            stroke={Colors.primary}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {validPoints.map((p, idx) => (
          <Circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r={4.5}
            fill={Colors.primary}
            stroke={Colors.white}
            strokeWidth={2}
          />
        ))}

        {pointsData.map((p, idx) => (
          <SvgText
            key={idx}
            x={getX(idx)}
            y={height - 6}
            fontSize={10}
            fill={Colors.muted}
            textAnchor="middle"
          >
            {p.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

interface HorizontalBarItem {
  label: string;
  count: number;
  color: string;
}

export function HorizontalStatBars({ items }: { items: HorizontalBarItem[] }) {
  const max = Math.max(...items.map((i) => i.count), 1);

  return (
    <View style={styles.barsList}>
      {items.map((item) => {
        const pct = Math.max((item.count / max) * 100, 6);
        return (
          <View key={item.label} style={styles.barRow}>
            <View style={styles.barHeader}>
              <Text style={styles.barLabel} numberOfLines={1}>{item.label}</Text>
              <Text style={styles.barCount}>{item.count}</Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: item.color }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

interface MonthlyCalendarProps {
  entries: MoodEntryRow[];
  monthDate: dayjs.Dayjs;
  selectedDate: string | null;
  language: 'id' | 'en';
  onChangeMonth: (next: dayjs.Dayjs) => void;
  onSelectDate: (dateStr: string) => void;
}

export function MonthlyMoodCalendar({
  entries,
  monthDate,
  selectedDate,
  language,
  onChangeMonth,
  onSelectDate,
}: MonthlyCalendarProps) {
  const startOfMonth = monthDate.startOf('month');
  const daysInMonth = monthDate.daysInMonth();
  const startWeekday = startOfMonth.day(); // 0 = Sun

  const entryMap = new Map<string, MoodEntryRow>();
  entries.forEach((e) => entryMap.set(e.entry_date, e));

  const weekHeaders = language === 'id'
    ? ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <View>
      <View style={styles.calHeader}>
        <TouchableOpacity
          onPress={() => onChangeMonth(monthDate.subtract(1, 'month'))}
          style={styles.calNavBtn}
          hitSlop={8}
        >
          <ChevronLeft size={20} color={Colors.navy} />
        </TouchableOpacity>
        <Text style={styles.calMonthTitle}>
          {monthDate.locale(language === 'id' ? 'id' : 'en').format('MMMM YYYY')}
        </Text>
        <TouchableOpacity
          onPress={() => onChangeMonth(monthDate.add(1, 'month'))}
          style={styles.calNavBtn}
          hitSlop={8}
        >
          <ChevronRight size={20} color={Colors.navy} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {weekHeaders.map((w) => (
          <Text key={w} style={styles.weekHeader}>{w}</Text>
        ))}
      </View>

      <View style={styles.calGrid}>
        {cells.map((day, idx) => {
          if (day === null) {
            return <View key={`empty-${idx}`} style={styles.calCell} />;
          }
          const dateStr = monthDate.date(day).format('YYYY-MM-DD');
          const entry = entryMap.get(dateStr);
          const isSelected = selectedDate === dateStr;
          const meta = entry ? getMoodMeta(entry.mood) : null;

          return (
            <TouchableOpacity
              key={dateStr}
              style={[
                styles.calCell,
                entry && { backgroundColor: meta?.bg ?? Colors.lavender },
                isSelected && styles.calCellSelected,
              ]}
              onPress={() => onSelectDate(dateStr)}
              activeOpacity={0.75}
            >
              <Text style={[styles.calDayNum, isSelected && styles.calDayNumSelected]}>
                {day}
              </Text>
              {entry && (
                <View style={[styles.calDot, { backgroundColor: meta?.accent ?? Colors.primary }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartWrap: { alignItems: 'center', justifyContent: 'center' },
  barsList: { gap: 10 },
  barRow: { gap: 4 },
  barHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barLabel: { fontSize: FontSize.xs, color: Colors.navy, fontWeight: '600', flex: 1, marginRight: 8 },
  barCount: { fontSize: FontSize.xs, color: Colors.muted, fontWeight: '700' },
  barTrack: { height: 8, backgroundColor: '#EEF2F6', borderRadius: Radius.full, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: Radius.full },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  calNavBtn: { padding: 6, borderRadius: Radius.sm, backgroundColor: Colors.warmwhite },
  calMonthTitle: { fontSize: FontSize.base, fontWeight: '700', color: Colors.navy, textTransform: 'capitalize' },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekHeader: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: Colors.muted },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: {
    width: '14.285%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
    marginVertical: 2,
  },
  calCellSelected: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  calDayNum: { fontSize: FontSize.xs, color: Colors.navy, fontWeight: '600' },
  calDayNumSelected: { color: Colors.primary, fontWeight: '700' },
  calDot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
});
