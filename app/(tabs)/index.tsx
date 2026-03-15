import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Card, Text, TextInput, Modal } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDate, getWeekday } from '../../utils/date';
import { minutesToHours } from '../../utils/time';
import { useOvertimeStore } from '../../stores/overtimeStore';
import { useSettingsStore } from '../../stores/settingsStore';
import analyticsService from '../../services/analyticsService';

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  
  const { loadSettings, settings } = useSettingsStore();
  const { loadRecords, loadRecordsByDate, createRecord, records } = useOvertimeStore();
  
  const today = formatDate(new Date());
  const [todayRecords, setTodayRecords] = useState<any[]>([]);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  
  useEffect(() => {
    loadSettings();
    loadRecords();
  }, []);
  
  useEffect(() => {
    // 直接从records状态中获取今日记录，而不是通过异步操作
    const todayRecordsFromState = records.filter(record => record.date === today);
    setTodayRecords(todayRecordsFromState);
    
    // 获取最近的5条记录（包括今日），按创建时间倒序排序
    const recent = [...records]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);
    setRecentRecords(recent);
  }, [records, today]);
  
  const handlePunch = () => {
    // 记录打卡按钮点击事件
    analyticsService.trackPunchClick();
    setModalVisible(true);
  };
  
  const handleConfirmPunch = async () => {
    if (!reason.trim()) {
      Alert.alert('提示', '请输入加班理由');
      return;
    }
    
    try {
      const record = await createRecord(new Date(), reason, settings);
      // 记录打卡成功事件
      analyticsService.trackPunchSuccess(record.isMakeup, record.overtimeMinutes);
      // 重新加载记录，确保状态更新
      await loadRecords();
      setReason('');
      setModalVisible(false);
      Alert.alert('成功', '打卡成功！');
    } catch (error) {
      Alert.alert('错误', '打卡失败，请重试');
    }
  };
  
  const hasPunchedToday = todayRecords.length > 0;
  const todayOvertime = todayRecords.reduce((sum, record) => sum + record.overtimeMinutes, 0);
  
  return (
    <ScrollView 
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* 今日状态卡片 */}
      <Card style={styles.statusCard}>
        <Card.Content>
          <Text style={styles.statusTitle}>
            {hasPunchedToday ? '🌞 今日已打卡' : '🌙 今日未打卡'}
          </Text>
          <Text style={styles.workTime}>
            标准工时: {settings.morningStart}-{settings.morningEnd}, {settings.afternoonStart}-{settings.afternoonEnd}
          </Text>
          {hasPunchedToday && (
            <Text style={styles.overtime}>今日加班时长: {minutesToHours(todayOvertime)} 小时</Text>
          )}
        </Card.Content>
      </Card>
      
      {/* 打卡按钮 */}
      <Button
        mode="contained"
        style={styles.punchButton}
        labelStyle={styles.punchButtonLabel}
        onPress={handlePunch}
      >
        打卡
      </Button>
      
      {/* 最近记录 */}
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>最近打卡记录</Text>
        {recentRecords.length === 0 ? (
          <Text style={styles.emptyText}>暂无记录</Text>
        ) : (
          recentRecords.map((record) => (
            <Card key={record.id} style={styles.recordCard}>
              <Card.Content>
                <View style={styles.recordHeader}>
                  <Text style={styles.recordDate}>
                    {record.date} {getWeekday(new Date(record.date))}
                  </Text>
                  <Text style={styles.recordTime}>{record.punchTime}</Text>
                </View>
                <Text style={styles.recordDuration}>
                  加班时长: {minutesToHours(record.overtimeMinutes)} 小时
                </Text>
                <Text style={styles.recordReason} numberOfLines={2}>
                  理由: {record.reason}
                </Text>
                {record.isMakeup && (
                  <Text style={styles.makeupTag}>补卡</Text>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </View>
      
      {/* 打卡弹窗 */}
      <Modal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        contentContainerStyle={styles.modalContent}
      >
        <Text style={styles.modalTitle}>打卡</Text>
        <TextInput
          label="加班理由"
          value={reason}
          onChangeText={setReason}
          style={styles.input}
          multiline
          maxLength={50}
        />
        <View style={styles.modalButtons}>
          <Button
            mode="outlined"
            style={styles.modalButton}
            onPress={() => setModalVisible(false)}
          >
            取消
          </Button>
          <Button
            mode="contained"
            style={styles.modalButton}
            onPress={handleConfirmPunch}
          >
            确认
          </Button>
        </View>
      </Modal>
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
  statusCard: {
    margin: 16,
    padding: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  workTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  overtime: {
    fontSize: 16,
    color: '#1E3A5F',
    marginTop: 8,
  },
  punchButton: {
    marginHorizontal: 16,
    marginVertical: 20,
    paddingVertical: 12,
    backgroundColor: '#1E3A5F',
  },
  punchButtonLabel: {
    fontSize: 18,
  },
  recentSection: {
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
  makeupTag: {
    fontSize: 12,
    color: '#F5A623',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
  },
});

export default HomeScreen;
