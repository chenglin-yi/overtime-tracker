import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Card, Text, TextInput, Modal, IconButton, Chip } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDate, getWeekday } from '../../utils/date';
import { minutesToHours } from '../../utils/time';
import { useOvertimeStore } from '../../stores/overtimeStore';
import { useSettingsStore } from '../../stores/settingsStore';
import CalendarView from '../../components/CalendarView';

const RecordsScreen = () => {
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [punchTime, setPunchTime] = useState(new Date());
  const [reason, setReason] = useState('');
  const [makeupNote, setMakeupNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [editReason, setEditReason] = useState('');
  const [editOvertimeMinutes, setEditOvertimeMinutes] = useState(0);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  
  const { loadRecords, records, deleteRecord, createRecord, updateRecord } = useOvertimeStore();
  const { settings } = useSettingsStore();
  
  useEffect(() => {
    loadRecords();
  }, []);
  
  // 当records状态变化时，重新按月份分组
  useEffect(() => {
    // 这里不需要做任何操作，因为groupedRecords是根据records计算的
    // 当records变化时，groupedRecords会自动重新计算
  }, [records]);
  
  // 按月份分组记录
  const groupedRecords = records.reduce((groups, record) => {
    const month = record.date.substring(0, 7); // YYYY-MM
    if (!groups[month]) {
      groups[month] = [];
    }
    groups[month].push(record);
    return groups;
  }, {} as Record<string, any[]>);
  
  const handleDelete = (id: string) => {
    Alert.alert(
      '确认删除',
      '确定要删除这条记录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            await deleteRecord(id);
            Alert.alert('成功', '记录已删除');
          }
        }
      ]
    );
  };
  
  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setEditReason(record.reason);
    setEditOvertimeMinutes(record.overtimeMinutes);
    setEditModalVisible(true);
  };
  
  const handleSaveEdit = async () => {
    if (!editReason.trim()) {
      Alert.alert('提示', '请输入加班理由');
      return;
    }
    
    try {
      await updateRecord(editingRecord.id, {
        reason: editReason,
        overtimeMinutes: editOvertimeMinutes
      });
      Alert.alert('成功', '记录已更新');
      setEditModalVisible(false);
      setEditingRecord(null);
      setEditReason('');
      setEditOvertimeMinutes(0);
    } catch (error) {
      console.error('编辑记录失败:', error);
      Alert.alert('错误', '编辑失败，请重试');
    }
  };
  
  // 批量删除相关函数
  const handleLongPress = (recordId: string) => {
    setIsSelectionMode(true);
    setSelectedRecords([recordId]);
  };
  
  const handleSelectRecord = (recordId: string) => {
    setSelectedRecords(prev => {
      if (prev.includes(recordId)) {
        return prev.filter(id => id !== recordId);
      } else {
        return [...prev, recordId];
      }
    });
  };
  
  const handleExitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedRecords([]);
  };
  
  const handleBatchDelete = () => {
    if (selectedRecords.length === 0) {
      return;
    }
    
    Alert.alert(
      '确认删除',
      `确定要删除选中的 ${selectedRecords.length} 条记录吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const id of selectedRecords) {
                await deleteRecord(id);
              }
              Alert.alert('成功', `已删除 ${selectedRecords.length} 条记录`);
              handleExitSelectionMode();
            } catch (error) {
              console.error('批量删除失败:', error);
              Alert.alert('错误', '批量删除失败，请重试');
            }
          }
        }
      ]
    );
  };
  
  const handleMakeupPunch = async () => {
    if (!reason.trim()) {
      Alert.alert('提示', '请输入加班理由');
      return;
    }
    if (!makeupNote.trim()) {
      Alert.alert('提示', '请输入补卡说明');
      return;
    }
    
    try {
      // 合并日期和时间信息
      const combinedDate = new Date(selectedDate);
      combinedDate.setHours(punchTime.getHours(), punchTime.getMinutes());
      
      // 调用创建记录的方法，传入isMakeup为true
      await createRecord(combinedDate, reason, settings, true, makeupNote);
      // 重新加载记录，确保状态更新
      await loadRecords();
      Alert.alert('成功', '补卡记录已创建');
      setModalVisible(false);
      setReason('');
      setMakeupNote('');
    } catch (error) {
      console.error('补卡失败:', error);
      Alert.alert('错误', '补卡失败，请重试');
    }
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 头部 */}
      <View style={styles.header}>
        {isSelectionMode ? (
          <>
            <Text style={styles.headerTitle}>已选择 {selectedRecords.length} 项</Text>
            <View style={styles.headerActions}>
              <Button
                mode="text"
                onPress={handleExitSelectionMode}
                style={styles.headerButton}
              >
                取消
              </Button>
              <Button
                mode="text"
                onPress={handleBatchDelete}
                style={styles.headerButton}
                disabled={selectedRecords.length === 0}
              >
                删除
              </Button>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.headerTitle}>打卡记录</Text>
            <View style={styles.headerActions}>
              <IconButton
                icon="calendar-month"
                size={24}
                onPress={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
              />
              <IconButton
                icon="plus"
                size={24}
                onPress={() => setModalVisible(true)}
              />
            </View>
          </>
        )}
      </View>
      
      {/* 视图模式切换 */}
      {!isSelectionMode && (
        <View style={styles.viewModeContainer}>
          <Chip
            selected={viewMode === 'list'}
            onPress={() => setViewMode('list')}
            style={styles.viewModeChip}
            icon="format-list-bulleted"
          >
            列表
          </Chip>
          <Chip
            selected={viewMode === 'calendar'}
            onPress={() => setViewMode('calendar')}
            style={styles.viewModeChip}
            icon="calendar-month"
          >
            日历
          </Chip>
        </View>
      )}
      
      {/* 内容区域 */}
      {viewMode === 'list' ? (
        /* 记录列表 */
        <ScrollView contentContainerStyle={styles.contentContainer}>
          {Object.entries(groupedRecords).length === 0 ? (
            <Text style={styles.emptyText}>暂无记录</Text>
          ) : (
            Object.entries(groupedRecords).map(([month, monthRecords]) => (
              <View key={month} style={styles.monthGroup}>
                <Text style={styles.monthTitle}>{month}</Text>
                {monthRecords.map((record) => (
                  <Card 
                    key={record.id} 
                    style={[styles.recordCard, selectedRecords.includes(record.id) && styles.selectedRecordCard]}
                    onLongPress={() => !isSelectionMode && handleLongPress(record.id)}
                    onPress={() => isSelectionMode && handleSelectRecord(record.id)}
                  >
                    <Card.Content>
                      {isSelectionMode && (
                        <View style={styles.selectionIndicator}>
                          <IconButton
                            icon={selectedRecords.includes(record.id) ? "checkbox-marked" : "checkbox-blank-outline"}
                            size={20}
                            onPress={() => handleSelectRecord(record.id)}
                          />
                        </View>
                      )}
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
                      {!isSelectionMode && (
                        <View style={styles.recordActions}>
                          <Button
                            mode="text"
                            style={styles.actionButton}
                            onPress={() => handleEdit(record)}
                          >
                            编辑
                          </Button>
                          <Button
                            mode="text"
                            style={styles.actionButton}
                            onPress={() => handleDelete(record.id)}
                          >
                            删除
                          </Button>
                        </View>
                      )}
                    </Card.Content>
                  </Card>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        /* 日历视图 */
        <CalendarView 
          records={records}
          onDatePress={(dateStr) => {
            // 点击日期时，如果有记录则显示详情
            const record = records.find(r => r.date === dateStr);
            if (record) {
              handleEdit(record);
            }
          }}
        />
      )}
      
      {/* 补打卡弹窗 */}
      <Modal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        contentContainerStyle={styles.modalContent}
      >
        <Text style={styles.modalTitle}>补打卡</Text>
        
        {/* 日期选择 */}
        <View style={styles.formItem}>
          <Text style={styles.formLabel}>日期</Text>
          <Button
            mode="outlined"
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            {formatDate(selectedDate)}
          </Button>
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) setSelectedDate(date);
              }}
            />
          )}
        </View>
        
        {/* 时间选择 */}
        <View style={styles.formItem}>
          <Text style={styles.formLabel}>打卡时间</Text>
          <Button
            mode="outlined"
            style={styles.dateButton}
            onPress={() => setShowTimePicker(true)}
          >
            {punchTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </Button>
          {showTimePicker && (
            <DateTimePicker
              value={punchTime}
              mode="time"
              display="default"
              onChange={(event, time) => {
                setShowTimePicker(false);
                if (time) setPunchTime(time);
              }}
            />
          )}
        </View>
        
        {/* 加班理由 */}
        <TextInput
          label="加班理由"
          value={reason}
          onChangeText={setReason}
          style={styles.input}
          multiline
          maxLength={50}
        />
        
        {/* 补卡说明 */}
        <TextInput
          label="补卡说明"
          value={makeupNote}
          onChangeText={setMakeupNote}
          style={styles.input}
          multiline
          maxLength={100}
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
            onPress={handleMakeupPunch}
          >
            确认
          </Button>
        </View>
      </Modal>
      
      {/* 编辑记录弹窗 */}
      <Modal
        visible={editModalVisible}
        onDismiss={() => setEditModalVisible(false)}
        contentContainerStyle={styles.modalContent}
      >
        <Text style={styles.modalTitle}>编辑记录</Text>
        
        {/* 加班理由 */}
        <TextInput
          label="加班理由"
          value={editReason}
          onChangeText={setEditReason}
          style={styles.input}
          multiline
          maxLength={100}
        />
        
        {/* 加班时长（小时） */}
        <TextInput
          label="加班时长（小时）"
          value={(editOvertimeMinutes / 60).toFixed(1)}
          onChangeText={(text) => {
            const hours = parseFloat(text) || 0;
            setEditOvertimeMinutes(Math.round(hours * 60));
          }}
          style={styles.input}
          keyboardType="decimal-pad"
        />
        
        <View style={styles.modalButtons}>
          <Button
            mode="outlined"
            style={styles.modalButton}
            onPress={() => {
              setEditModalVisible(false);
              setEditingRecord(null);
              setEditReason('');
              setEditOvertimeMinutes(0);
            }}
          >
            取消
          </Button>
          <Button
            mode="contained"
            style={styles.modalButton}
            onPress={handleSaveEdit}
          >
            保存
          </Button>
        </View>
      </Modal>
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
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 8,
  },
  viewModeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  viewModeChip: {
    marginHorizontal: 8,
  },
  selectedRecordCard: {
    backgroundColor: '#E3F2FD',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  monthGroup: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1E3A5F',
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
    marginBottom: 8,
  },
  makeupTag: {
    fontSize: 12,
    color: '#F5A623',
    marginBottom: 8,
  },
  recordActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    marginLeft: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 40,
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
  formItem: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
  },
  dateButton: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
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

export default RecordsScreen;
