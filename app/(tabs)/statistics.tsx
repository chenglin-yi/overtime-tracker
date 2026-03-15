import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Card, Text, SegmentedButtons, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { formatDate, getWeekRange, getMonthRange, getYearRange, getDaysInMonth, getMonthsInYear } from '../../utils/date';
import { minutesToHours } from '../../utils/time';
import { useOvertimeStore } from '../../stores/overtimeStore';
import analyticsService from '../../services/analyticsService';

const StatisticsScreen = () => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('week');
  const [stats, setStats] = useState<any>({});
  const [localRecords, setLocalRecords] = useState<any[]>([]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [chartData, setChartData] = useState<any>(null);
  
  const { loadRecordsByDateRange, records } = useOvertimeStore();
  
  useEffect(() => {
    loadStatistics();
    // 记录查看统计事件
    analyticsService.trackViewStatistics(activeTab);
  }, [activeTab, records]);
  
  // 页面加载时加载统计数据
  useEffect(() => {
    loadStatistics();
  }, []);
  
  const loadStatistics = async () => {
    const today = new Date();
    let selectedStartDate, selectedEndDate;
    
    switch (activeTab) {
      case 'day':
        selectedStartDate = formatDate(today);
        selectedEndDate = formatDate(today);
        break;
      case 'week':
        const weekRange = getWeekRange(today);
        selectedStartDate = weekRange.start;
        selectedEndDate = weekRange.end;
        break;
      case 'month':
        const monthRange = getMonthRange(today);
        selectedStartDate = monthRange.start;
        selectedEndDate = monthRange.end;
        break;
      case 'year':
        const yearRange = getYearRange(today);
        selectedStartDate = yearRange.start;
        selectedEndDate = yearRange.end;
        break;
      case 'custom':
        selectedStartDate = formatDate(startDate);
        selectedEndDate = formatDate(endDate);
        break;
      default:
        return;
    }
    
    const data = await loadRecordsByDateRange(selectedStartDate, selectedEndDate);
    setLocalRecords(data);
    
    // 计算统计数据
    const totalMinutes = data.reduce((sum, record) => sum + record.overtimeMinutes, 0);
    const uniqueDays = new Set(data.map(record => record.date)).size;
    
    setStats({
      totalHours: minutesToHours(totalMinutes),
      days: uniqueDays,
      averageHours: uniqueDays > 0 ? minutesToHours(totalMinutes / uniqueDays) : 0,
      startDate: selectedStartDate,
      endDate: selectedEndDate
    });
    
    // 生成图表数据
    generateChartData(data, activeTab, today);
  };
  
  const generateChartData = (data: any[], tab: string, date: Date) => {
    switch (tab) {
      case 'week':
        generateWeekChart(data);
        break;
      case 'month':
        generateMonthChart(data, date);
        break;
      case 'year':
        generateYearChart(data, date);
        break;
      default:
        setChartData(null);
    }
  };
  
  const generateWeekChart = (data: any[]) => {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const today = new Date();
    const weekRange = getWeekRange(today);
    const startDate = new Date(weekRange.start);
    
    // 初始化每天的加班时长为0
    const dayData = Array(7).fill(0);
    
    // 填充实际数据
    data.forEach(record => {
      const recordDate = new Date(record.date);
      const dayIndex = recordDate.getDay();
      dayData[dayIndex] += record.overtimeMinutes / 60; // 转换为小时
    });
    
    setChartData({
      type: 'bar',
      data: {
        labels: weekdays,
        datasets: [{
          data: dayData
        }]
      },
      title: '本周每日加班时长'
    });
  };
  
  const generateMonthChart = (data: any[], date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    
    // 初始化每天的加班时长为0
    const dayData = Array(daysInMonth).fill(0);
    
    // 填充实际数据
    data.forEach(record => {
      const recordDate = new Date(record.date);
      const day = recordDate.getDate() - 1; // 数组索引从0开始
      dayData[day] += record.overtimeMinutes / 60; // 转换为小时
    });
    
    // 生成日期标签（每5天显示一个）
    const labels = [];
    for (let i = 1; i <= daysInMonth; i += 5) {
      labels.push(i.toString());
    }
    
    // 对应生成数据点
    const chartData = [];
    for (let i = 0; i < daysInMonth; i += 5) {
      chartData.push(dayData[i]);
    }
    
    setChartData({
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: chartData
        }]
      },
      title: '本月每日加班时长'
    });
  };
  
  const generateYearChart = (data: any[], date: Date) => {
    const months = getMonthsInYear();
    
    // 初始化每月的加班时长为0
    const monthData = Array(12).fill(0);
    
    // 填充实际数据
    data.forEach(record => {
      const recordDate = new Date(record.date);
      const month = recordDate.getMonth();
      monthData[month] += record.overtimeMinutes / 60; // 转换为小时
    });
    
    setChartData({
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          data: monthData
        }]
      },
      title: '本年每月加班时长'
    });
  };
  
  return (
    <ScrollView 
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* 维度切换 */}
      <View style={styles.segmentedButtonsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <SegmentedButtons
            value={activeTab}
            onValueChange={setActiveTab}
            buttons={[
              { value: 'day', label: '日' },
              { value: 'week', label: '周' },
              { value: 'month', label: '月' },
              { value: 'year', label: '年' },
              { value: 'custom', label: '自定义' },
            ]}
            style={styles.segmentedButtons}
          />
        </ScrollView>
      </View>
      
      {/* 自定义日期选择 */}
      {activeTab === 'custom' && (
        <View style={styles.datePickerContainer}>
          <Text style={styles.datePickerLabel}>选择日期范围</Text>
          <View style={styles.datePickerRow}>
            <Button
              mode="outlined"
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              开始日期: {formatDate(startDate)}
            </Button>
            <Button
              mode="outlined"
              style={styles.dateButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              结束日期: {formatDate(endDate)}
            </Button>
          </View>
          <Button
            mode="contained"
            style={styles.applyButton}
            onPress={loadStatistics}
          >
            应用
          </Button>
          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowStartDatePicker(false);
                if (date) setStartDate(date);
              }}
            />
          )}
          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowEndDatePicker(false);
                if (date) setEndDate(date);
              }}
            />
          )}
        </View>
      )}
      
      {/* 统计卡片 */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <Text style={styles.statsTitle}>
            {activeTab === 'day' ? '今日' : 
             activeTab === 'week' ? '本周' : 
             activeTab === 'month' ? '本月' : '本年'} 统计
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>总时长</Text>
              <Text style={styles.statValue}>{stats.totalHours || 0} 小时</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>打卡天数</Text>
              <Text style={styles.statValue}>{stats.days || 0} 天</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>日均时长</Text>
              <Text style={styles.statValue}>{stats.averageHours || 0} 小时</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>时间段</Text>
              <Text style={styles.statValue}>
                {stats.startDate} - {stats.endDate}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
      
      {/* 图表 */}
      {chartData && (
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text style={styles.chartTitle}>{chartData.title}</Text>
            <View style={styles.chartContainer}>
              {chartData.type === 'bar' && (
                <BarChart
                  data={chartData.data}
                  width={Dimensions.get('window').width - 64}
                  height={220}
                  yAxisLabel="小时"
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(30, 58, 95, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16
                    },
                    barPercentage: 0.7
                  }}
                  style={{
                    marginVertical: 8,
                    borderRadius: 16
                  }}
                />
              )}
              {chartData.type === 'line' && (
                <LineChart
                  data={chartData.data}
                  width={Dimensions.get('window').width - 64}
                  height={220}
                  yAxisLabel="小时"
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(30, 58, 95, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16
                    },
                    propsForDots: {
                      r: "6",
                      strokeWidth: "2",
                      stroke: "#1E3A5F"
                    }
                  }}
                  style={{
                    marginVertical: 8,
                    borderRadius: 16
                  }}
                />
              )}
            </View>
          </Card.Content>
        </Card>
      )}
      
      {/* 详细记录 */}
      <View style={styles.recordsSection}>
        <Text style={styles.sectionTitle}>详细记录</Text>
        {localRecords.length === 0 ? (
          <Text style={styles.emptyText}>暂无记录</Text>
        ) : (
          localRecords.map((record) => (
            <Card key={record.id} style={styles.recordCard}>
              <Card.Content>
                <View style={styles.recordHeader}>
                  <Text style={styles.recordDate}>{record.date}</Text>
                  <Text style={styles.recordTime}>{record.punchTime}</Text>
                </View>
                <Text style={styles.recordDuration}>
                  加班时长: {minutesToHours(record.overtimeMinutes)} 小时
                </Text>
                <Text style={styles.recordReason} numberOfLines={2}>
                  理由: {record.reason}
                </Text>
              </Card.Content>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    paddingBottom: 20,
  },
  segmentedButtonsContainer: {
    margin: 16,
  },
  segmentedButtons: {
    width: '100%',
  },
  datePickerContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  datePickerLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  applyButton: {
    marginTop: 8,
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E3A5F',
  },
  recordsSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  recordCard: {
    marginBottom: 8,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  recordDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  recordTime: {
    fontSize: 14,
    color: '#666',
  },
  recordDuration: {
    fontSize: 14,
    color: '#1E3A5F',
    marginBottom: 4,
  },
  recordReason: {
    fontSize: 14,
    color: '#333',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  chartCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
  },
});

export default StatisticsScreen;
