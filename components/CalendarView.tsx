import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, IconButton, Chip } from 'react-native-paper';
import { getHoliday, Holiday } from '../services/holidayService';

interface CalendarViewProps {
  records: any[];
  onDatePress?: (date: string) => void;
}

type ViewMode = 'month' | 'year';

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

const CalendarView: React.FC<CalendarViewProps> = ({ records, onDatePress }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  // 获取当月的天数
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // 获取当月第一天是周几（0=周日，1=周一...）
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 7 : day; // 转换为1=周一...7=周日
  };

  // 格式化日期为YYYY-MM-DD
  const formatDateStr = (year: number, month: number, day: number) => {
    return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  // 检查某天是否有打卡记录
  const getRecordForDate = (dateStr: string) => {
    return records.find(r => r.date === dateStr);
  };

  // 检查某天是否是节假日
  const getHolidayInfo = (dateStr: string): Holiday | null => {
    const date = new Date(dateStr);
    return getHoliday(date);
  };

  // 上个月/年
  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setFullYear(newDate.getFullYear() - 1);
    }
    setCurrentDate(newDate);
  };

  // 下个月/年
  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setFullYear(newDate.getFullYear() + 1);
    }
    setCurrentDate(newDate);
  };

  // 回到今天
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // 渲染月视图
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    // 生成日历网格
    const calendarDays = [];
    
    // 填充上个月的空白
    for (let i = 1; i < firstDay; i++) {
      calendarDays.push(null);
    }
    
    // 填充本月的天数
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(day);
    }

    // 按周分组
    const weeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }

    return (
      <View style={styles.monthContainer}>
        {/* 星期表头 */}
        <View style={styles.weekdayHeader}>
          {WEEKDAYS.map((day, index) => (
            <View key={index} style={styles.weekdayCell}>
              <Text style={[
                styles.weekdayText,
                (index === 5 || index === 6) && styles.weekendText
              ]}>
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* 日期网格 */}
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {week.map((day, dayIndex) => {
              if (day === null) {
                return <View key={`empty-${dayIndex}`} style={styles.dayCell} />;
              }

              const dateStr = formatDateStr(year, month, day);
              const record = getRecordForDate(dateStr);
              const holiday = getHolidayInfo(dateStr);
              const isToday = dateStr === formatDateStr(
                new Date().getFullYear(),
                new Date().getMonth(),
                new Date().getDate()
              );
              const isWeekend = dayIndex >= 5; // 周六、周日

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[
                    styles.dayCell,
                    isToday && styles.todayCell,
                    holiday?.isHoliday && styles.holidayCell,
                    holiday && !holiday.isHoliday && styles.workdayCell,
                    record && styles.recordedCell,
                  ]}
                  onPress={() => onDatePress?.(dateStr)}
                >
                  <Text style={[
                    styles.dayText,
                    isToday && styles.todayText,
                    isWeekend && !holiday && styles.weekendDayText,
                    holiday?.isHoliday && styles.holidayText,
                  ]}>
                    {day}
                  </Text>
                  {holiday && (
                    <Text style={styles.holidayName} numberOfLines={1}>
                      {holiday.name}
                    </Text>
                  )}
                  {record && (
                    <View style={styles.recordDot} />
                  )}
                </TouchableOpacity>
              );
            })}
            {/* 补齐空位 */}
            {week.length < 7 && Array(7 - week.length).fill(null).map((_, i) => (
              <View key={`fill-${i}`} style={styles.dayCell} />
            ))}
          </View>
        ))}
      </View>
    );
  };

  // 渲染年视图
  const renderYearView = () => {
    const year = currentDate.getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => i);

    return (
      <ScrollView style={styles.yearContainer}>
        <View style={styles.yearGrid}>
          {months.map(month => (
            <TouchableOpacity
              key={month}
              style={styles.yearMonthCard}
              onPress={() => {
                const newDate = new Date(year, month, 1);
                setCurrentDate(newDate);
                setViewMode('month');
              }}
            >
              <Text style={styles.yearMonthTitle}>{month + 1}月</Text>
              <View style={styles.yearMonthWeekdays}>
                {WEEKDAYS.map((day, i) => (
                  <Text key={i} style={[styles.yearWeekdayText, (i >= 5) && styles.yearWeekendText]}>
                    {day}
                  </Text>
                ))}
              </View>
              {renderMiniMonth(year, month)}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  // 渲染迷你月份（年视图中使用）
  const renderMiniMonth = (year: number, month: number) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];
    for (let i = 1; i < firstDay; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <View>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.yearWeekRow}>
            {week.map((day, dayIndex) => {
              if (day === null) {
                return <View key={`empty-${dayIndex}`} style={styles.yearDayCell} />;
              }

              const dateStr = formatDateStr(year, month, day);
              const record = getRecordForDate(dateStr);
              const holiday = getHolidayInfo(dateStr);

              return (
                <View
                  key={dateStr}
                  style={[
                    styles.yearDayCell,
                    holiday?.isHoliday && styles.yearHolidayCell,
                    record && styles.yearRecordedCell,
                  ]}
                >
                  <Text style={[
                    styles.yearDayText,
                    holiday?.isHoliday && styles.yearHolidayText,
                    (dayIndex >= 5) && styles.yearWeekendDayText,
                  ]}>
                    {day}
                  </Text>
                </View>
              );
            })}
            {week.length < 7 && Array(7 - week.length).fill(null).map((_, i) => (
              <View key={`fill-${i}`} style={styles.yearDayCell} />
            ))}
          </View>
        ))}
      </View>
    );
  };

  // 统计信息
  const stats = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    
    let holidays = 0;
    let workdays = 0;
    let recordedDays = 0;
    let totalOvertimeMinutes = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDateStr(year, month, day);
      const holiday = getHolidayInfo(dateStr);
      const record = getRecordForDate(dateStr);

      if (holiday?.isHoliday) {
        holidays++;
      } else {
        workdays++;
      }

      if (record) {
        recordedDays++;
        totalOvertimeMinutes += record.overtimeMinutes || 0;
      }
    }

    return { holidays, workdays, recordedDays, totalOvertimeMinutes };
  }, [currentDate, records]);

  return (
    <View style={styles.container}>
      {/* 头部控制栏 */}
      <View style={styles.header}>
        <IconButton icon="chevron-left" onPress={handlePrevious} />
        <TouchableOpacity onPress={handleToday}>
          <Text style={styles.headerTitle}>
            {viewMode === 'month'
              ? `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`
              : `${currentDate.getFullYear()}年`
            }
          </Text>
        </TouchableOpacity>
        <IconButton icon="chevron-right" onPress={handleNext} />
      </View>

      {/* 视图切换 */}
      <View style={styles.viewToggle}>
        <Chip
          selected={viewMode === 'month'}
          onPress={() => setViewMode('month')}
          style={styles.viewChip}
        >
          月视图
        </Chip>
        <Chip
          selected={viewMode === 'year'}
          onPress={() => setViewMode('year')}
          style={styles.viewChip}
        >
          年视图
        </Chip>
      </View>

      {/* 统计信息（仅月视图显示） */}
      {viewMode === 'month' && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.holidays}</Text>
            <Text style={styles.statLabel}>节假日</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.workdays}</Text>
            <Text style={styles.statLabel}>工作日</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.recordedDays}</Text>
            <Text style={styles.statLabel}>已打卡</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{(stats.totalOvertimeMinutes / 60).toFixed(1)}</Text>
            <Text style={styles.statLabel}>加班(h)</Text>
          </View>
        </View>
      )}

      {/* 图例 */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.holidayLegend]} />
          <Text style={styles.legendText}>节假日</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.workdayLegend]} />
          <Text style={styles.legendText}>调休上班</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.recordedLegend]} />
          <Text style={styles.legendText}>已打卡</Text>
        </View>
      </View>

      {/* 日历内容 */}
      {viewMode === 'month' ? renderMonthView() : renderYearView()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3A5F',
  },
  viewToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  viewChip: {
    marginHorizontal: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: 'white',
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3A5F',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: 'white',
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  holidayLegend: {
    backgroundColor: '#FF6B6B',
  },
  workdayLegend: {
    backgroundColor: '#4ECDC4',
  },
  recordedLegend: {
    backgroundColor: '#1E3A5F',
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  // 月视图样式
  monthContainer: {
    backgroundColor: 'white',
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
    padding: 8,
  },
  weekdayHeader: {
    flexDirection: 'row',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  weekendText: {
    color: '#FF6B6B',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  todayCell: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  holidayCell: {
    backgroundColor: '#FFF3F3',
    borderRadius: 8,
  },
  workdayCell: {
    backgroundColor: '#F0FFF0',
    borderRadius: 8,
  },
  recordedCell: {
    borderWidth: 2,
    borderColor: '#1E3A5F',
    borderRadius: 8,
  },
  dayText: {
    fontSize: 14,
    color: '#333',
  },
  todayText: {
    color: '#1E3A5F',
    fontWeight: 'bold',
  },
  weekendDayText: {
    color: '#FF6B6B',
  },
  holidayText: {
    color: '#FF6B6B',
    fontWeight: '500',
  },
  holidayName: {
    fontSize: 8,
    color: '#FF6B6B',
    marginTop: 2,
  },
  recordDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E3A5F',
    marginTop: 2,
  },
  // 年视图样式
  yearContainer: {
    flex: 1,
    marginTop: 8,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  yearMonthCard: {
    width: '33.33%',
    padding: 8,
  },
  yearMonthTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E3A5F',
    marginBottom: 8,
    textAlign: 'center',
  },
  yearMonthWeekdays: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  yearWeekdayText: {
    flex: 1,
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
  },
  yearWeekendText: {
    color: '#FF6B6B',
  },
  yearWeekRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  yearDayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 1,
  },
  yearHolidayCell: {
    backgroundColor: '#FFE0E0',
    borderRadius: 4,
  },
  yearRecordedCell: {
    backgroundColor: '#E3F2FD',
    borderRadius: 4,
  },
  yearDayText: {
    fontSize: 10,
    color: '#333',
  },
  yearHolidayText: {
    color: '#FF6B6B',
  },
  yearWeekendDayText: {
    color: '#FF6B6B',
  },
});

export default CalendarView;