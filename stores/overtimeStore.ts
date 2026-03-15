import { create } from 'zustand';
import { OvertimeRecord } from '../types/record';
import { recordRepository } from '../database/repositories/recordRepository';
import { formatDate, formatTime } from '../utils/date';
import { calculateOvertime, getWorkEndTime } from '../utils/time';
import { UserSettings } from '../types/settings';

// 生成唯一ID的替代方案
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9) + Math.random().toString(36).substring(2, 9);
}

interface OvertimeState {
  records: OvertimeRecord[];
  loading: boolean;
  
  loadRecords: () => Promise<void>;
  loadRecordsByDate: (date: string) => Promise<OvertimeRecord[]>;
  loadRecordsByDateRange: (startDate: string, endDate: string) => Promise<OvertimeRecord[]>;
  createRecord: (punchTime: Date, reason: string, settings: UserSettings, isMakeup?: boolean, makeupNote?: string) => Promise<OvertimeRecord>;
  addRecord: (record: OvertimeRecord) => Promise<OvertimeRecord>;
  updateRecord: (id: string, updates: Partial<OvertimeRecord>) => Promise<OvertimeRecord | null>;
  deleteRecord: (id: string) => Promise<boolean>;
}

export const useOvertimeStore = create<OvertimeState>((set, get) => ({
  records: [],
  loading: false,
  
  loadRecords: async () => {
    set({ loading: true });
    try {
      const records = await recordRepository.getAll();
      set({ records });
    } catch (error) {
      console.error('加载记录失败:', error);
    } finally {
      set({ loading: false });
    }
  },
  
  loadRecordsByDate: async (date: string) => {
    try {
      return await recordRepository.getByDate(date);
    } catch (error) {
      console.error('加载日期记录失败:', error);
      return [];
    }
  },
  
  loadRecordsByDateRange: async (startDate: string, endDate: string) => {
    try {
      return await recordRepository.getByDateRange(startDate, endDate);
    } catch (error) {
      console.error('加载日期范围记录失败:', error);
      return [];
    }
  },
  
  createRecord: async (punchTime: Date, reason: string, settings: UserSettings, isMakeup = false, makeupNote?: string) => {
    const workEndTime = getWorkEndTime(punchTime, settings.afternoonEnd);
    const overtimeMinutes = calculateOvertime(punchTime, workEndTime);
    
    const record: OvertimeRecord = {
      id: generateId(),
      date: formatDate(punchTime),
      punchTime: formatTime(punchTime),
      workStartMorning: settings.morningStart,
      workEndMorning: settings.morningEnd,
      workStartAfternoon: settings.afternoonStart,
      workEndAfternoon: settings.afternoonEnd,
      overtimeMinutes,
      reason,
      isMakeup,
      makeupNote,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    try {
      const createdRecord = await recordRepository.create(record);
      const currentRecords = get().records;
      // 检查是否已经存在相同ID的记录
      const exists = currentRecords.some(r => r.id === createdRecord.id);
      if (!exists) {
        set({ records: [createdRecord, ...currentRecords] });
      }
      return createdRecord;
    } catch (error) {
      console.error('创建记录失败:', error);
      // 即使失败也返回记录，确保打卡成功
      const currentRecords = get().records;
      // 检查是否已经存在相同ID的记录
      const exists = currentRecords.some(r => r.id === record.id);
      if (!exists) {
        set({ records: [record, ...currentRecords] });
      }
      return record;
    }
  },
  
  updateRecord: async (id: string, updates: Partial<OvertimeRecord>) => {
    try {
      const updatedRecord = await recordRepository.update(id, updates);
      if (updatedRecord) {
        const currentRecords = get().records;
        const newRecords = currentRecords.map(record => 
          record.id === id ? updatedRecord : record
        );
        set({ records: newRecords });
      }
      return updatedRecord;
    } catch (error) {
      console.error('更新记录失败:', error);
      throw error;
    }
  },
  
  deleteRecord: async (id: string) => {
    try {
      const success = await recordRepository.delete(id);
      if (success) {
        const currentRecords = get().records;
        const newRecords = currentRecords.filter(record => record.id !== id);
        set({ records: newRecords });
      }
      return success;
    } catch (error) {
      console.error('删除记录失败:', error);
      return false;
    }
  },
  
  addRecord: async (record: OvertimeRecord) => {
    try {
      const createdRecord = await recordRepository.create(record);
      const currentRecords = get().records;
      // 检查是否已经存在相同ID的记录
      const exists = currentRecords.some(r => r.id === createdRecord.id);
      if (!exists) {
        set({ records: [createdRecord, ...currentRecords] });
      }
      return createdRecord;
    } catch (error) {
      console.error('添加记录失败:', error);
      // 即使失败也返回记录
      const currentRecords = get().records;
      // 检查是否已经存在相同ID的记录
      const exists = currentRecords.some(r => r.id === record.id);
      if (!exists) {
        set({ records: [record, ...currentRecords] });
      }
      return record;
    }
  }
}));
