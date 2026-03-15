import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Button, Card, Text, Switch, List, Divider, Modal, TextInput, IconButton, ProgressBar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
import { useSettingsStore } from '../../stores/settingsStore';
import { useOvertimeStore } from '../../stores/overtimeStore';
import notificationService from '../../services/notificationService';
import analyticsService from '../../services/analyticsService';

const SettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettingsStore();
  const { records, loadRecords, addRecord } = useOvertimeStore();
  const [workDays, setWorkDays] = useState(settings.workDays);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [timeType, setTimeType] = useState('morningStart');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState('');
  
  const handleWorkDayToggle = (day: number) => {
    let newWorkDays;
    if (workDays.includes(day)) {
      newWorkDays = workDays.filter(d => d !== day);
    } else {
      newWorkDays = [...workDays, day].sort();
    }
    setWorkDays(newWorkDays);
    updateSettings({ workDays: newWorkDays });
  };
  
  const handleTimeEdit = (type: string) => {
    setTimeType(type);
    // 解析当前时间并设置到选择器
    const currentTime = settings[type as keyof typeof settings];
    if (typeof currentTime === 'string') {
      const [hours, minutes] = currentTime.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes);
      setSelectedTime(date);
    }
    setModalVisible(true);
  };
  
  const handleTimeChange = (event: any, time: Date | undefined) => {
    setShowTimePicker(false);
    if (time) {
      setSelectedTime(time);
    }
  };
  
  const handleTimeConfirm = () => {
    const hours = selectedTime.getHours().toString().padStart(2, '0');
    const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    updateSettings({ [timeType]: timeString } as any);
    setModalVisible(false);
  };
  
  const handleExportData = async () => {
    try {
      setIsLoading(true);
      setProgress(0);
      
      // 加载所有记录
      await loadRecords();
      setProgress(0.3);
      
      if (records.length === 0) {
        Alert.alert('提示', '没有加班记录可导出');
        setIsLoading(false);
        return;
      }
      
      // 准备导出数据
      const exportData = records.map(record => ({
        日期: record.date,
        打卡时间: record.punchTime,
        上午上班: record.workStartMorning,
        上午下班: record.workEndMorning,
        下午上班: record.workStartAfternoon,
        下午下班: record.workEndAfternoon,
        '加班时长(分钟)': record.overtimeMinutes,
        '加班时长(小时)': (record.overtimeMinutes / 60).toFixed(2),
        加班理由: record.reason,
        是否补卡: record.isMakeup ? '是' : '否',
        补卡说明: record.makeupNote || ''
      }));
      
      setProgress(0.6);
      
      // 创建工作簿和工作表
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(workbook, worksheet, '加班记录');
      
      // 生成Excel文件
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
      
      setProgress(0.8);
      
      // 保存文件
      const fileName = `加班记录_${new Date().toISOString().slice(0, 10)}.xlsx`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, excelBuffer, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      setProgress(1);
      
      // 记录导出数据事件
      analyticsService.trackExportData('excel', records.length);
      
      // 分享文件
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('提示', `文件已保存到: ${fileUri}`);
      }
    } catch (error) {
      console.error('导出数据失败:', error);
      Alert.alert('错误', '导出数据失败，请重试');
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };
  

  
  const handleBackupData = async () => {
    try {
      setIsLoading(true);
      setProgress(0);
      
      // 加载所有记录
      await loadRecords();
      setProgress(0.5);
      
      // 准备备份数据
      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        settings: settings,
        records: records
      };
      
      // 保存备份文件
      const fileName = `加班记录备份_${new Date().toISOString().slice(0, 10)}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(backupData, null, 2));
      setProgress(1);
      
      // 分享备份文件
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('提示', `备份文件已保存到: ${fileUri}`);
      }
    } catch (error) {
      console.error('备份数据失败:', error);
      Alert.alert('错误', '备份数据失败，请重试');
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };
  
  const handleRestoreData = async () => {
    try {
      setIsLoading(true);
      setProgress(0);
      
      // 选择备份文件
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true
      });
      
      if (result.canceled) {
        setIsLoading(false);
        return;
      }
      
      setProgress(0.3);
      
      // 读取备份文件
      const fileUri = result.assets[0].uri;
      const backupContent = await FileSystem.readAsStringAsync(fileUri);
      const backupData = JSON.parse(backupContent);
      
      setProgress(0.6);
      
      // 恢复设置
      if (backupData.settings) {
        await updateSettings(backupData.settings);
      }
      
      // 恢复记录
      if (backupData.records && Array.isArray(backupData.records)) {
        // 清空现有记录（简单实现，实际应用中可能需要更复杂的逻辑）
        // 这里我们直接添加新记录，因为当前没有删除所有记录的方法
        for (const record of backupData.records) {
          await addRecord(record);
        }
      }
      
      setProgress(1);
      
      Alert.alert('成功', '数据恢复成功，请重启应用');
    } catch (error) {
      console.error('恢复数据失败:', error);
      Alert.alert('错误', '恢复数据失败，请检查备份文件格式');
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };
  
  const handleSubmitFeedback = () => {
    if (!feedbackContent.trim()) {
      Alert.alert('提示', '请输入您的反馈内容');
      return;
    }
    
    // 这里可以实现实际的反馈提交逻辑，例如发送到服务器或存储到本地
    console.log('用户反馈:', feedbackContent);
    
    Alert.alert('成功', '感谢您的反馈！我们会认真处理您的意见。');
    setFeedbackModalVisible(false);
    setFeedbackContent('');
  };
  
  return (
    <ScrollView 
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* 工作时间设置 */}
      <Card style={styles.card}>
        <Card.Title 
          title="工作时间设置" 
          left={props => <List.Icon {...props} icon="clock-outline" />}
        />
        <Card.Content>
          <List.Item
            title="上午上班"
            description={settings.morningStart}
            left={props => <List.Icon {...props} icon="weather-sunset-up" />}
            onPress={() => handleTimeEdit('morningStart')}
          />
          <Divider />
          <List.Item
            title="上午下班"
            description={settings.morningEnd}
            left={props => <List.Icon {...props} icon="weather-sunset" />}
            onPress={() => handleTimeEdit('morningEnd')}
          />
          <Divider />
          <List.Item
            title="下午上班"
            description={settings.afternoonStart}
            left={props => <List.Icon {...props} icon="weather-sunset-up" />}
            onPress={() => handleTimeEdit('afternoonStart')}
          />
          <Divider />
          <List.Item
            title="下午下班"
            description={settings.afternoonEnd}
            left={props => <List.Icon {...props} icon="weather-night" />}
            onPress={() => handleTimeEdit('afternoonEnd')}
          />
        </Card.Content>
      </Card>
      
      {/* 工作日设置 */}
      <Card style={styles.card}>
        <Card.Title 
          title="工作日设置" 
          left={props => <List.Icon {...props} icon="calendar-check" />}
        />
        <Card.Content>
          <View style={styles.workDaysContainer}>
            {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day, index) => (
              <View key={index} style={styles.workDayItem}>
                <Text style={[styles.workDayText, workDays.includes(index + 1) && styles.workDayTextActive]}>
                  {day}
                </Text>
                <Switch
                  value={workDays.includes(index + 1)}
                  onValueChange={() => handleWorkDayToggle(index + 1)}
                  color="#1E3A5F"
                />
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>
      
      {/* 提醒设置 */}
      <Card style={styles.card}>
        <Card.Title 
          title="提醒设置" 
          left={props => <List.Icon {...props} icon="bell-outline" />}
        />
        <Card.Content>
          <List.Item
            title="下班提醒"
            description="下班后提醒打卡"
            left={props => <List.Icon {...props} icon="bell" />}
            right={props => (
              <Switch
                value={settings.reminderEnabled}
                onValueChange={async (value) => {
                  await updateSettings({ reminderEnabled: value });
                  if (value) {
                    await notificationService.scheduleOffWorkReminder(settings);
                  } else {
                    await notificationService.cancelAllNotifications();
                  }
                }}
                color="#1E3A5F"
              />
            )}
          />
        </Card.Content>
      </Card>
      
      {/* 数据管理 */}
      <Card style={styles.card}>
        <Card.Title 
          title="数据管理" 
          left={props => <List.Icon {...props} icon="database" />}
        />
        <Card.Content>
          <View style={styles.dataButtonsContainer}>
            <Button
              mode="outlined"
              style={styles.dataButton}
              icon="file-excel"
              onPress={handleExportData}
              disabled={isLoading}
            >
              导出数据
            </Button>
            <Button
              mode="outlined"
              style={styles.dataButton}
              icon="backup-restore"
              onPress={handleBackupData}
              disabled={isLoading}
            >
              备份数据
            </Button>
            <Button
              mode="outlined"
              style={styles.dataButton}
              icon="restore"
              onPress={handleRestoreData}
              disabled={isLoading}
            >
              恢复数据
            </Button>
          </View>
          {isLoading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>处理中...</Text>
              <ProgressBar progress={progress} color="#1E3A5F" style={styles.progressBar} />
            </View>
          )}
        </Card.Content>
      </Card>
      
      {/* 关于 */}
      <Card style={styles.card}>
        <Card.Title 
          title="关于" 
          left={props => <List.Icon {...props} icon="information-outline" />}
        />
        <Card.Content>
          <View style={styles.aboutContainer}>
            <View style={styles.aboutIconContainer}>
              <IconButton
                icon="clock-alert"
                size={48}
                iconColor="#1E3A5F"
              />
            </View>
            <Text style={styles.aboutText}>加班记 v1.0.0</Text>
            <Text style={styles.aboutDescription}>一款简单实用的加班记录工具</Text>
            <Button
              mode="outlined"
              style={styles.feedbackButton}
              icon="message-text"
              onPress={() => setFeedbackModalVisible(true)}
            >
              意见反馈
            </Button>
          </View>
        </Card.Content>
      </Card>
      
      {/* 时间选择模态框 */}
      <Modal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        contentContainerStyle={styles.modalContent}
      >
        <Text style={styles.modalTitle}>
          {timeType === 'morningStart' ? '设置上午上班时间' :
           timeType === 'morningEnd' ? '设置上午下班时间' :
           timeType === 'afternoonStart' ? '设置下午上班时间' :
           '设置下午下班时间'}
        </Text>
        {showTimePicker ? (
          <DateTimePicker
            value={selectedTime}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        ) : (
          <Button
            mode="outlined"
            style={styles.timeButton}
            onPress={() => setShowTimePicker(true)}
          >
            选择时间: {selectedTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </Button>
        )}
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
            onPress={handleTimeConfirm}
          >
            确认
          </Button>
        </View>
      </Modal>
      
      {/* 反馈模态框 */}
      <Modal
        visible={feedbackModalVisible}
        onDismiss={() => setFeedbackModalVisible(false)}
        contentContainerStyle={styles.modalContent}
      >
        <Text style={styles.modalTitle}>意见反馈</Text>
        <TextInput
          label="请输入您的反馈内容"
          value={feedbackContent}
          onChangeText={setFeedbackContent}
          style={styles.input}
          multiline
          numberOfLines={5}
          maxLength={500}
        />
        <View style={styles.modalButtons}>
          <Button
            mode="outlined"
            style={styles.modalButton}
            onPress={() => {
              setFeedbackModalVisible(false);
              setFeedbackContent('');
            }}
          >
            取消
          </Button>
          <Button
            mode="contained"
            style={styles.modalButton}
            onPress={handleSubmitFeedback}
          >
            提交
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
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    elevation: 2,
    borderRadius: 8,
  },
  workDaysContainer: {
    marginTop: 8,
  },
  workDayItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  workDayText: {
    fontSize: 14,
    color: '#666',
  },
  workDayTextActive: {
    color: '#1E3A5F',
    fontWeight: '500',
  },
  dataButtonsContainer: {
    marginTop: 8,
  },
  dataButton: {
    marginBottom: 12,
    borderRadius: 6,
  },
  aboutContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  aboutIconContainer: {
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1E3A5F',
  },
  aboutDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#1E3A5F',
  },
  timeButton: {
    marginBottom: 16,
    borderRadius: 6,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 6,
  },
  loadingContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  feedbackButton: {
    marginTop: 16,
    width: '100%',
  },
});

export default SettingsScreen;
