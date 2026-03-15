import { getDatabase } from '../index';
import { OvertimeRecord } from '../../types/record';

// 内存存储作为后备
let memoryRecords: OvertimeRecord[] = [];

export const recordRepository = {
  async create(record: OvertimeRecord): Promise<OvertimeRecord> {
    try {
      const db = getDatabase();
      memoryRecords.unshift(record); // 先添加到内存
      
      if (!db) {
        console.log('Creating record in memory only');
        return record;
      }

      return new Promise((resolve, reject) => {
        if (db.transaction) {
          // 旧版本 API
          db.transaction(tx => {
            tx.executeSql(
              `INSERT INTO overtime_records (id, date, punch_time, work_start_morning, work_end_morning, work_start_afternoon, work_end_afternoon, overtime_minutes, reason, is_makeup, makeup_note, created_at, updated_at) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
              [
                record.id,
                record.date,
                record.punchTime,
                record.workStartMorning,
                record.workEndMorning,
                record.workStartAfternoon,
                record.workEndAfternoon,
                record.overtimeMinutes,
                record.reason,
                record.isMakeup ? 1 : 0,
                record.makeupNote,
                record.createdAt,
                record.updatedAt
              ],
              (_, { rowsAffected }) => {
                if (rowsAffected > 0) {
                  resolve(record);
                } else {
                  console.log('Insert failed, using memory record');
                  resolve(record); // 即使插入失败也返回内存中的记录
                }
              },
              (_, error) => {
                console.error('Error creating record:', error);
                resolve(record); // 即使失败也返回内存中的记录
                return false;
              }
            );
          });
        } else {
          // 新版本 API 或 mock
          console.log('Creating record in memory only (no transaction method)');
          resolve(record);
        }
      });
    } catch (error) {
      console.error('Error in createRecord:', error);
      return record;
    }
  },

  async getByDate(date: string): Promise<OvertimeRecord[]> {
    try {
      const db = getDatabase();
      
      if (!db) {
        console.log('Getting records from memory');
        return memoryRecords.filter(record => record.date === date);
      }

      return new Promise((resolve, reject) => {
        if (db.transaction) {
          // 旧版本 API
          db.transaction(tx => {
            tx.executeSql(
              'SELECT * FROM overtime_records WHERE date = ? ORDER BY punch_time DESC;',
              [date],
              (_, { rows }) => {
                const records: OvertimeRecord[] = [];
                for (let i = 0; i < rows.length; i++) {
                  const row = rows.item(i);
                  records.push({
                    id: row.id,
                    date: row.date,
                    punchTime: row.punch_time,
                    workStartMorning: row.work_start_morning,
                    workEndMorning: row.work_end_morning,
                    workStartAfternoon: row.work_start_afternoon,
                    workEndAfternoon: row.work_end_afternoon,
                    overtimeMinutes: row.overtime_minutes,
                    reason: row.reason,
                    isMakeup: row.is_makeup === 1,
                    makeupNote: row.makeup_note,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at
                  });
                }
                resolve(records);
              },
              (_, error) => {
                console.error('Error getting records by date:', error);
                resolve(memoryRecords.filter(record => record.date === date));
                return false;
              }
            );
          });
        } else {
          // 新版本 API 或 mock
          console.log('Getting records from memory (no transaction method)');
          resolve(memoryRecords.filter(record => record.date === date));
        }
      });
    } catch (error) {
      console.error('Error in getByDate:', error);
      return memoryRecords.filter(record => record.date === date);
    }
  },

  async getByDateRange(startDate: string, endDate: string): Promise<OvertimeRecord[]> {
    try {
      const db = getDatabase();
      
      if (!db) {
        console.log('Getting records from memory');
        return memoryRecords.filter(record => 
          record.date >= startDate && record.date <= endDate
        );
      }

      return new Promise((resolve, reject) => {
        if (db.transaction) {
          // 旧版本 API
          db.transaction(tx => {
            tx.executeSql(
              'SELECT * FROM overtime_records WHERE date >= ? AND date <= ? ORDER BY date DESC, punch_time DESC;',
              [startDate, endDate],
              (_, { rows }) => {
                const records: OvertimeRecord[] = [];
                for (let i = 0; i < rows.length; i++) {
                  const row = rows.item(i);
                  records.push({
                    id: row.id,
                    date: row.date,
                    punchTime: row.punch_time,
                    workStartMorning: row.work_start_morning,
                    workEndMorning: row.work_end_morning,
                    workStartAfternoon: row.work_start_afternoon,
                    workEndAfternoon: row.work_end_afternoon,
                    overtimeMinutes: row.overtime_minutes,
                    reason: row.reason,
                    isMakeup: row.is_makeup === 1,
                    makeupNote: row.makeup_note,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at
                  });
                }
                resolve(records);
              },
              (_, error) => {
                console.error('Error getting records by date range:', error);
                resolve(memoryRecords.filter(record => 
                  record.date >= startDate && record.date <= endDate
                ));
                return false;
              }
            );
          });
        } else {
          // 新版本 API 或 mock
          console.log('Getting records from memory (no transaction method)');
          resolve(memoryRecords.filter(record => 
            record.date >= startDate && record.date <= endDate
          ));
        }
      });
    } catch (error) {
      console.error('Error in getByDateRange:', error);
      return memoryRecords.filter(record => 
        record.date >= startDate && record.date <= endDate
      );
    }
  },

  async getAll(): Promise<OvertimeRecord[]> {
    try {
      const db = getDatabase();
      
      if (!db) {
        console.log('Getting all records from memory');
        return memoryRecords;
      }

      return new Promise((resolve, reject) => {
        if (db.transaction) {
          // 旧版本 API
          db.transaction(tx => {
            tx.executeSql(
              'SELECT * FROM overtime_records ORDER BY date DESC, punch_time DESC;',
              [],
              (_, { rows }) => {
                const records: OvertimeRecord[] = [];
                for (let i = 0; i < rows.length; i++) {
                  const row = rows.item(i);
                  records.push({
                    id: row.id,
                    date: row.date,
                    punchTime: row.punch_time,
                    workStartMorning: row.work_start_morning,
                    workEndMorning: row.work_end_morning,
                    workStartAfternoon: row.work_start_afternoon,
                    workEndAfternoon: row.work_end_afternoon,
                    overtimeMinutes: row.overtime_minutes,
                    reason: row.reason,
                    isMakeup: row.is_makeup === 1,
                    makeupNote: row.makeup_note,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at
                  });
                }
                memoryRecords = records; // 同步到内存
                resolve(records);
              },
              (_, error) => {
                console.error('Error getting all records:', error);
                resolve(memoryRecords);
                return false;
              }
            );
          });
        } else {
          // 新版本 API 或 mock
          console.log('Getting all records from memory (no transaction method)');
          resolve(memoryRecords);
        }
      });
    } catch (error) {
      console.error('Error in getAll:', error);
      return memoryRecords;
    }
  },

  async update(id: string, updates: Partial<OvertimeRecord>): Promise<OvertimeRecord | null> {
    try {
      const db = getDatabase();
      
      // 先更新内存中的记录
      const index = memoryRecords.findIndex(record => record.id === id);
      if (index !== -1) {
        memoryRecords[index] = {
          ...memoryRecords[index],
          ...updates,
          updatedAt: Date.now()
        };
      }
      
      if (!db) {
        console.log('Updating record in memory only');
        return memoryRecords[index] || null;
      }

      return new Promise((resolve, reject) => {
        if (db.transaction) {
          // 先获取原记录
          db.transaction(tx => {
            tx.executeSql(
              'SELECT * FROM overtime_records WHERE id = ?;',
              [id],
              (_, { rows }) => {
                if (rows.length === 0) {
                  resolve(memoryRecords[index] || null);
                  return;
                }

                const oldRecord = rows.item(0);
                const updatedRecord: OvertimeRecord = {
                  id: oldRecord.id,
                  date: oldRecord.date,
                  punchTime: oldRecord.punch_time,
                  workStartMorning: oldRecord.work_start_morning,
                  workEndMorning: oldRecord.work_end_morning,
                  workStartAfternoon: oldRecord.work_start_afternoon,
                  workEndAfternoon: oldRecord.work_end_afternoon,
                  overtimeMinutes: oldRecord.overtime_minutes,
                  reason: oldRecord.reason,
                  isMakeup: oldRecord.is_makeup === 1,
                  makeupNote: oldRecord.makeup_note,
                  createdAt: oldRecord.created_at,
                  updatedAt: Date.now(),
                  ...updates
                };

                tx.executeSql(
                  `UPDATE overtime_records SET 
                    reason = ?, 
                    overtime_minutes = ?, 
                    makeup_note = ?, 
                    updated_at = ? 
                   WHERE id = ?;`,
                  [
                    updatedRecord.reason,
                    updatedRecord.overtimeMinutes,
                    updatedRecord.makeupNote,
                    updatedRecord.updatedAt,
                    id
                  ],
                  (_, { rowsAffected }) => {
                    if (rowsAffected > 0) {
                      resolve(updatedRecord);
                    } else {
                      resolve(memoryRecords[index] || updatedRecord);
                    }
                  },
                  (_, error) => {
                    console.error('Error updating record:', error);
                    resolve(memoryRecords[index] || updatedRecord);
                    return false;
                  }
                );
              },
              (_, error) => {
                console.error('Error getting record for update:', error);
                resolve(memoryRecords[index] || null);
                return false;
              }
            );
          });
        } else {
          // 新版本 API 或 mock
          console.log('Updating record in memory only (no transaction method)');
          resolve(memoryRecords[index] || null);
        }
      });
    } catch (error) {
      console.error('Error in updateRecord:', error);
      const record = memoryRecords.find(r => r.id === id);
      return record || null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const db = getDatabase();
      
      // 先从内存中删除
      const initialLength = memoryRecords.length;
      memoryRecords = memoryRecords.filter(record => record.id !== id);
      const deletedFromMemory = memoryRecords.length < initialLength;
      
      if (!db) {
        console.log('Deleting record from memory only');
        return deletedFromMemory;
      }

      return new Promise((resolve, reject) => {
        if (db.transaction) {
          // 旧版本 API
          db.transaction(tx => {
            tx.executeSql(
              'DELETE FROM overtime_records WHERE id = ?;',
              [id],
              (_, { rowsAffected }) => {
                resolve(rowsAffected > 0 || deletedFromMemory);
              },
              (_, error) => {
                console.error('Error deleting record:', error);
                resolve(deletedFromMemory);
                return false;
              }
            );
          });
        } else {
          // 新版本 API 或 mock
          console.log('Deleting record from memory only (no transaction method)');
          resolve(deletedFromMemory);
        }
      });
    } catch (error) {
      console.error('Error in deleteRecord:', error);
      return false;
    }
  }
};
