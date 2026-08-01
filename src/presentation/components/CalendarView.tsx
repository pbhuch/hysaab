import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { ThemeColors } from '../theme/theme';
import { AttendanceStatus } from '../../domain/types';

interface CalendarViewProps {
  year: number;
  month: number; // 0-11
  attendanceMap: Record<string, AttendanceStatus>; // key: YYYY-MM-DD
  colors: ThemeColors;
  onDatePress: (dateStr: string, currentStatus?: AttendanceStatus) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  year,
  month,
  attendanceMap,
  colors,
  onDatePress,
}) => {
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const totalDays = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const cells: (number | null)[] = [];

  // Fill initial blanks
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push(null);
  }

  // Fill dates
  for (let i = 1; i <= totalDays; i++) {
    cells.push(i);
  }

  const getStatusColor = (status?: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return colors.success;
      case 'absent_paid':
        return colors.info;
      case 'absent_unpaid':
        return colors.danger;
      case 'half_day':
        return colors.warning;
      default:
        return 'transparent';
    }
  };

  const getStatusLabel = (status?: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return 'P';
      case 'absent_paid':
        return 'AP';
      case 'absent_unpaid':
        return 'AU';
      case 'half_day':
        return 'HD';
      default:
        return '';
    }
  };

  return (
    <View style={styles.container}>
      {/* Days of week header */}
      <View style={styles.row}>
        {daysOfWeek.map((day, idx) => (
          <Text key={idx} style={[styles.headerCell, { color: colors.textMuted }]}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.grid}>
        {cells.map((day, idx) => {
          if (day === null) {
            return <View key={idx} style={styles.cell} />;
          }

          const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const status = attendanceMap[dayStr];
          const hasStatus = !!status;
          const bgCol = getStatusColor(status);

          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.cell,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              onPress={() => onDatePress(dayStr, status)}
            >
              <Text style={[styles.dayText, { color: colors.text }]}>{day}</Text>
              
              {hasStatus ? (
                <View style={[styles.badge, { backgroundColor: bgCol }]}>
                  <Text style={styles.badgeText}>{getStatusLabel(status)}</Text>
                </View>
              ) : (
                <Text style={[styles.placeholderText, { color: colors.textMuted }]}>-</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.legendText, { color: colors.text }]}>Present</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.info }]} />
          <Text style={[styles.legendText, { color: colors.text }]}>Paid Abs</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={[styles.legendText, { color: colors.text }]}>Half Day</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
          <Text style={[styles.legendText, { color: colors.text }]}>Unpaid Abs</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  headerCell: {
    width: '13%',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  cell: {
    width: '14.28%',
    aspectRatio: 1,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    position: 'relative',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  badge: {
    marginTop: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  placeholderText: {
    fontSize: 10,
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#cccccc',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
  },
});
export default CalendarView;
