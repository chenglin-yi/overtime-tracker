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

      try {
        console.log('Database object in create:', db);
        console.log('Database object methods in create:', Object.keys(db));
        
        const sql = `INSERT INTO overtime_records (id, date, punch_time, work_start_morning, work_end_morning, work_start_afternoon, work_end_afternoon, overtime_minutes, reason, is_makeup, makeup_note, created_at, updated_at) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
        const params = [
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
        ];

        if (db.runAsync) {
          // 新版本 API（Expo SDK 55+）
          console.log('Using runAsync method');
          const execSql = `INSERT INTO overtime_records (id, date, punch_time, work_start_morning, work_end_morning, work_start_afternoon, work_end_afternoon, overtime_minutes, reason, is_makeup, makeup_note, created_at, updated_at) 
                          VALUES ('${record.id}', '${record.date}', '${record.punchTime}', '${record.workStartMorning}', '${record.workEndMorning}', '${record.workStartAfternoon}', '${record.workEndAfternoon}', ${record.overtimeMinutes}, '${record.reason}', ${record.isMakeup ? 1 : 0}, ${record.makeupNote ? `'${record.makeupNote}'` : 'NULL'}, ${record.createdAt}, ${record.updatedAt});`;
          await db.runAsync(execSql);
        } else if (db.executeSqlAsync) {
          // 新版本 API
          console.log('Using executeSqlAsync method');
          await db.executeSqlAsync(sql, params);
        } else if (db.transactionAsync) {
          // 新版本 API
          console.log('Using transactionAsync method');
          await db.transactionAsync(async (tx) => {
            await tx.executeSqlAsync(sql, params);
          });
        } else if (db.transaction) {
          // 旧版本 API
          console.log('Using transaction method');
          await new Promise<void>((resolve, reject) => {
            db.transaction(tx => {
              tx.executeSql(
                sql,
                params,
                () => resolve(),
                (_, error) => {
                  console.error('Error creating record:', error);
                  resolve(); // 即使失败也继续
                  return false;
                }
              );
            });
          });
        } else if (db.executeSql) {
          // 新版本 API
          console.log('Using new API: executeSql');
          await db.executeSql(sql, params);
        } else if (db.exec) {
          // 其他支持 exec 的 API
          console.log('Using exec method');
          // 构建带参数的 SQL 语句
          const execSql = `INSERT INTO overtime_records (id, date, punch_time, work_start_morning, work_end_morning, work_start_afternoon, work_end_afternoon, overtime_minutes, reason, is_makeup, makeup_note, created_at, updated_at) 
                          VALUES ('${record.id}', '${record.date}', '${record.punchTime}', '${record.workStartMorning}', '${record.workEndMorning}', '${record.workStartAfternoon}', '${record.workEndAfternoon}', ${record.overtimeMinutes}, '${record.reason}', ${record.isMakeup ? 1 : 0}, ${record.makeupNote ? `'${record.makeupNote}'` : 'NULL'}, ${record.createdAt}, ${record.updatedAt});`;
          db.exec(execSql);
        }
        return record;
      } catch (error) {
        console.error('Error creating record in database:', error);
        return record;
      }
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

      try {
        if (db.getFirstAsync) {
          // 新版本 API（Expo SDK 55+）
          console.log('Using getFirstAsync method');
          const result = await db.getAllAsync(`SELECT * FROM overtime_records WHERE date = '${date}' ORDER BY punch_time DESC;`);
          const records: OvertimeRecord[] = [];
          if (result) {
            for (const row of result) {
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
          }
          return records;
        } else if (db.executeSqlAsync) {
          // 新版本 API
          console.log('Using executeSqlAsync method');
          const result = await db.executeSqlAsync('SELECT * FROM overtime_records WHERE date = ? ORDER BY punch_time DESC;', [date]);
          const records: OvertimeRecord[] = [];
          if (result && result.rows) {
            for (let i = 0; i < result.rows.length; i++) {
              const row = result.rows.item(i);
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
          }
          return records;
        } else if (db.transactionAsync) {
          // 新版本 API
          console.log('Using transactionAsync method');
          const records: OvertimeRecord[] = [];
          await db.transactionAsync(async (tx) => {
            const result = await tx.executeSqlAsync('SELECT * FROM overtime_records WHERE date = ? ORDER BY punch_time DESC;', [date]);
            if (result && result.rows) {
              for (let i = 0; i < result.rows.length; i++) {
                const row = result.rows.item(i);
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
            }
          });
          return records;
        } else if (db.transaction) {
          // 旧版本 API
          return await new Promise<OvertimeRecord[]>((resolve, reject) => {
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
          });
        } else if (db.executeSql) {
          // 新版本 API
          console.log('Using new API: executeSql');
          const result = await db.executeSql('SELECT * FROM overtime_records WHERE date = ? ORDER BY punch_time DESC;', [date]);
          const records: OvertimeRecord[] = [];
          for (let i = 0; i < result.rows.length; i++) {
            const row = result.rows.item(i);
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
          return records;
        } else {
          // 其他情况
          console.log('Getting records from memory (no transaction or executeSql method)');
          return memoryRecords.filter(record => record.date === date);
        }
      } catch (error) {
        console.error('Error getting records by date:', error);
        return memoryRecords.filter(record => record.date === date);
      }
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

      try {
        if (db.getFirstAsync) {
          // 新版本 API（Expo SDK 55+）
          console.log('Using getFirstAsync method');
          const result = await db.getAllAsync(`SELECT * FROM overtime_records WHERE date >= '${startDate}' AND date <= '${endDate}' ORDER BY date DESC, punch_time DESC;`);
          const records: OvertimeRecord[] = [];
          if (result) {
            for (const row of result) {
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
          }
          return records;
        } else if (db.executeSqlAsync) {
          // 新版本 API
          console.log('Using executeSqlAsync method');
          const result = await db.executeSqlAsync('SELECT * FROM overtime_records WHERE date >= ? AND date <= ? ORDER BY date DESC, punch_time DESC;', [startDate, endDate]);
          const records: OvertimeRecord[] = [];
          if (result && result.rows) {
            for (let i = 0; i < result.rows.length; i++) {
              const row = result.rows.item(i);
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
          }
          return records;
        } else if (db.transactionAsync) {
          // 新版本 API
          console.log('Using transactionAsync method');
          const records: OvertimeRecord[] = [];
          await db.transactionAsync(async (tx) => {
            const result = await tx.executeSqlAsync('SELECT * FROM overtime_records WHERE date >= ? AND date <= ? ORDER BY date DESC, punch_time DESC;', [startDate, endDate]);
            if (result && result.rows) {
              for (let i = 0; i < result.rows.length; i++) {
                const row = result.rows.item(i);
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
            }
          });
          return records;
        } else if (db.transaction) {
          // 旧版本 API
          return await new Promise<OvertimeRecord[]>((resolve, reject) => {
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
          });
        } else if (db.executeSql) {
          // 新版本 API
          console.log('Using new API: executeSql');
          const result = await db.executeSql('SELECT * FROM overtime_records WHERE date >= ? AND date <= ? ORDER BY date DESC, punch_time DESC;', [startDate, endDate]);
          const records: OvertimeRecord[] = [];
          for (let i = 0; i < result.rows.length; i++) {
            const row = result.rows.item(i);
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
          return records;
        } else {
          // 其他情况
          console.log('Getting records from memory (no transaction or executeSql method)');
          return memoryRecords.filter(record => 
            record.date >= startDate && record.date <= endDate
          );
        }
      } catch (error) {
        console.error('Error getting records by date range:', error);
        return memoryRecords.filter(record => 
          record.date >= startDate && record.date <= endDate
        );
      }
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

      try {
        if (db.getFirstAsync) {
          // 新版本 API（Expo SDK 55+）
          console.log('Using getFirstAsync method');
          const result = await db.getAllAsync('SELECT * FROM overtime_records ORDER BY date DESC, punch_time DESC;');
          const records: OvertimeRecord[] = [];
          if (result) {
            for (const row of result) {
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
          }
          memoryRecords = records; // 同步到内存
          return records;
        } else if (db.executeSqlAsync) {
          // 新版本 API
          console.log('Using executeSqlAsync method');
          const result = await db.executeSqlAsync('SELECT * FROM overtime_records ORDER BY date DESC, punch_time DESC;', []);
          const records: OvertimeRecord[] = [];
          if (result && result.rows) {
            for (let i = 0; i < result.rows.length; i++) {
              const row = result.rows.item(i);
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
          }
          memoryRecords = records; // 同步到内存
          return records;
        } else if (db.transactionAsync) {
          // 新版本 API
          console.log('Using transactionAsync method');
          const records: OvertimeRecord[] = [];
          await db.transactionAsync(async (tx) => {
            const result = await tx.executeSqlAsync('SELECT * FROM overtime_records ORDER BY date DESC, punch_time DESC;', []);
            if (result && result.rows) {
              for (let i = 0; i < result.rows.length; i++) {
                const row = result.rows.item(i);
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
            }
          });
          memoryRecords = records; // 同步到内存
          return records;
        } else if (db.transaction) {
          // 旧版本 API
          return await new Promise<OvertimeRecord[]>((resolve, reject) => {
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
          });
        } else if (db.executeSql) {
          // 新版本 API
          console.log('Using new API: executeSql');
          const result = await db.executeSql('SELECT * FROM overtime_records ORDER BY date DESC, punch_time DESC;', []);
          const records: OvertimeRecord[] = [];
          for (let i = 0; i < result.rows.length; i++) {
            const row = result.rows.item(i);
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
          return records;
        } else {
          // 其他情况
          console.log('Getting all records from memory (no transaction or executeSql method)');
          return memoryRecords;
        }
      } catch (error) {
        console.error('Error getting all records:', error);
        return memoryRecords;
      }
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

      try {
        // 先获取原记录
        let updatedRecord: OvertimeRecord | null = null;
        
        if (db.transaction) {
          // 旧版本 API
          await new Promise<void>((resolve, reject) => {
            db.transaction(tx => {
              tx.executeSql(
                'SELECT * FROM overtime_records WHERE id = ?;',
                [id],
                (_, { rows }) => {
                  if (rows.length === 0) {
                    resolve();
                    return;
                  }

                  const oldRecord = rows.item(0);
                  updatedRecord = {
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
                    () => resolve(),
                    (_, error) => {
                      console.error('Error updating record:', error);
                      resolve();
                      return false;
                    }
                  );
                },
                (_, error) => {
                  console.error('Error getting record for update:', error);
                  resolve();
                  return false;
                }
              );
            });
          });
        } else if (db.executeSql) {
          // 新版本 API
          console.log('Using new API: executeSql');
          const result = await db.executeSql('SELECT * FROM overtime_records WHERE id = ?;', [id]);
          if (result.rows.length > 0) {
            const oldRecord = result.rows.item(0);
            updatedRecord = {
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

            await db.executeSql(
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
              ]
            );
          }
        } else {
          // 其他情况
          console.log('Updating record in memory only (no transaction or executeSql method)');
        }

        return updatedRecord || memoryRecords[index] || null;
      } catch (error) {
        console.error('Error updating record:', error);
        return memoryRecords[index] || null;
      }
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

      try {
        console.log('Database object in delete:', db);
        console.log('Database object methods in delete:', Object.keys(db));
        
        if (db.runAsync) {
          // 新版本 API（Expo SDK 55+）
          console.log('Using runAsync method for delete');
          await db.runAsync(`DELETE FROM overtime_records WHERE id = '${id}';`);
        } else if (db.executeSqlAsync) {
          // 新版本 API
          console.log('Using executeSqlAsync method for delete');
          await db.executeSqlAsync('DELETE FROM overtime_records WHERE id = ?;', [id]);
        } else if (db.transactionAsync) {
          // 新版本 API
          console.log('Using transactionAsync method for delete');
          await db.transactionAsync(async (tx) => {
            await tx.executeSqlAsync('DELETE FROM overtime_records WHERE id = ?;', [id]);
          });
        } else if (db.transaction) {
          // 旧版本 API
          console.log('Using transaction method for delete');
          await new Promise<void>((resolve, reject) => {
            db.transaction(tx => {
              tx.executeSql(
                'DELETE FROM overtime_records WHERE id = ?;',
                [id],
                () => resolve(),
                (_, error) => {
                  console.error('Error deleting record:', error);
                  resolve();
                  return false;
                }
              );
            });
          });
        } else if (db.executeSql) {
          // 新版本 API
          console.log('Using executeSql method for delete');
          await db.executeSql('DELETE FROM overtime_records WHERE id = ?;', [id]);
        } else if (db.exec) {
          // 其他支持 exec 的 API
          console.log('Using exec method for delete');
          db.exec(`DELETE FROM overtime_records WHERE id = '${id}';`);
        } else {
          // 其他情况
          console.log('Deleting record from memory only (no supported method)');
        }
        return deletedFromMemory;
      } catch (error) {
        console.error('Error deleting record from database:', error);
        return deletedFromMemory;
      }
    } catch (error) {
      console.error('Error in deleteRecord:', error);
      return false;
    }
  }
};
