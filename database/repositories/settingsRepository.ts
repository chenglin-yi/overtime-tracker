import { getDatabase } from '../index';
import { UserSettings } from '../../types/settings';
import { DEFAULT_SETTINGS } from '../../constants/defaultSettings';

// 内存存储作为后备
let memorySettings: UserSettings = DEFAULT_SETTINGS;

export const settingsRepository = {
  async getSettings(): Promise<UserSettings> {
    try {
      const db = getDatabase();
      
      if (!db) {
        console.log('Using memory settings');
        return memorySettings;
      }

      try {
        if (db.getFirstAsync) {
          // 新版本 API（Expo SDK 55+）
          console.log('Using getFirstAsync method');
          const result = await db.getFirstAsync('SELECT * FROM user_settings WHERE id = 1;');
          if (result) {
            const settings: UserSettings = {
              id: result.id,
              morningStart: result.morning_start,
              morningEnd: result.morning_end,
              afternoonStart: result.afternoon_start,
              afternoonEnd: result.afternoon_end,
              workDays: JSON.parse(result.work_days),
              reminderEnabled: result.reminder_enabled === 1,
              reminderTime: result.reminder_time,
              updatedAt: result.updated_at
            };
            memorySettings = settings; // 同步到内存
            return settings;
          } else {
            return DEFAULT_SETTINGS;
          }
        } else if (db.executeSqlAsync) {
          // 新版本 API
          console.log('Using executeSqlAsync method');
          const result = await db.executeSqlAsync('SELECT * FROM user_settings WHERE id = 1;', []);
          if (result && result.rows && result.rows.length > 0) {
            const row = result.rows.item(0);
            const settings: UserSettings = {
              id: row.id,
              morningStart: row.morning_start,
              morningEnd: row.morning_end,
              afternoonStart: row.afternoon_start,
              afternoonEnd: row.afternoon_end,
              workDays: JSON.parse(row.work_days),
              reminderEnabled: row.reminder_enabled === 1,
              reminderTime: row.reminder_time,
              updatedAt: row.updated_at
            };
            memorySettings = settings; // 同步到内存
            return settings;
          } else {
            return DEFAULT_SETTINGS;
          }
        } else if (db.transactionAsync) {
          // 新版本 API
          console.log('Using transactionAsync method');
          let settings: UserSettings = DEFAULT_SETTINGS;
          await db.transactionAsync(async (tx) => {
            const result = await tx.executeSqlAsync('SELECT * FROM user_settings WHERE id = 1;', []);
            if (result && result.rows && result.rows.length > 0) {
              const row = result.rows.item(0);
              settings = {
                id: row.id,
                morningStart: row.morning_start,
                morningEnd: row.morning_end,
                afternoonStart: row.afternoon_start,
                afternoonEnd: row.afternoon_end,
                workDays: JSON.parse(row.work_days),
                reminderEnabled: row.reminder_enabled === 1,
                reminderTime: row.reminder_time,
                updatedAt: row.updated_at
              };
              memorySettings = settings; // 同步到内存
            }
          });
          return settings;
        } else if (db.transaction) {
          // 旧版本 API
          return await new Promise<UserSettings>((resolve, reject) => {
            db.transaction(tx => {
              tx.executeSql(
                'SELECT * FROM user_settings WHERE id = 1;',
                [],
                (_, { rows }) => {
                  if (rows.length > 0) {
                    const row = rows.item(0);
                    const settings: UserSettings = {
                      id: row.id,
                      morningStart: row.morning_start,
                      morningEnd: row.morning_end,
                      afternoonStart: row.afternoon_start,
                      afternoonEnd: row.afternoon_end,
                      workDays: JSON.parse(row.work_days),
                      reminderEnabled: row.reminder_enabled === 1,
                      reminderTime: row.reminder_time,
                      updatedAt: row.updated_at
                    };
                    memorySettings = settings; // 同步到内存
                    resolve(settings);
                  } else {
                    resolve(DEFAULT_SETTINGS);
                  }
                },
                (_, error) => {
                  console.error('Error getting settings:', error);
                  resolve(memorySettings);
                  return false;
                }
              );
            });
          });
        } else if (db.executeSql) {
          // 新版本 API
          console.log('Using new API: executeSql');
          const result = await db.executeSql('SELECT * FROM user_settings WHERE id = 1;', []);
          if (result.rows.length > 0) {
            const row = result.rows.item(0);
            const settings: UserSettings = {
              id: row.id,
              morningStart: row.morning_start,
              morningEnd: row.morning_end,
              afternoonStart: row.afternoon_start,
              afternoonEnd: row.afternoon_end,
              workDays: JSON.parse(row.work_days),
              reminderEnabled: row.reminder_enabled === 1,
              reminderTime: row.reminder_time,
              updatedAt: row.updated_at
            };
            memorySettings = settings; // 同步到内存
            return settings;
          } else {
            return DEFAULT_SETTINGS;
          }
        } else {
          // 其他情况
          console.log('Using memory settings (no transaction or executeSql method)');
          return memorySettings;
        }
      } catch (error) {
        console.error('Error getting settings:', error);
        return memorySettings;
      }
    } catch (error) {
      console.error('Error in getSettings:', error);
      return memorySettings;
    }
  },

  async update(settings: UserSettings): Promise<void> {
    try {
      const db = getDatabase();
      memorySettings = settings; // 先更新内存
      
      if (!db) {
        console.log('Updating memory settings only');
        return;
      }

      try {
        if (db.runAsync) {
          // 新版本 API（Expo SDK 55+）
          console.log('Using runAsync method');
          // 构建带参数的 SQL 语句
          const updateSql = `UPDATE user_settings SET 
            morning_start = '${settings.morningStart}', 
            morning_end = '${settings.morningEnd}', 
            afternoon_start = '${settings.afternoonStart}', 
            afternoon_end = '${settings.afternoonEnd}', 
            work_days = '${JSON.stringify(settings.workDays)}', 
            reminder_enabled = ${settings.reminderEnabled ? 1 : 0}, 
            reminder_time = ${settings.reminderTime}, 
            updated_at = ${Date.now()} 
           WHERE id = ${settings.id};`;
          await db.runAsync(updateSql);
          
          // 检查是否需要插入
          const checkResult = await db.getFirstAsync(`SELECT * FROM user_settings WHERE id = ${settings.id};`);
          if (!checkResult) {
            // 如果没有更新，尝试插入
            const insertSql = `INSERT INTO user_settings (id, morning_start, morning_end, afternoon_start, afternoon_end, work_days, reminder_enabled, reminder_time, updated_at) 
             VALUES (${settings.id}, '${settings.morningStart}', '${settings.morningEnd}', '${settings.afternoonStart}', '${settings.afternoonEnd}', '${JSON.stringify(settings.workDays)}', ${settings.reminderEnabled ? 1 : 0}, ${settings.reminderTime}, ${Date.now()});`;
            await db.runAsync(insertSql);
          }
        } else if (db.executeSqlAsync) {
          // 新版本 API
          console.log('Using executeSqlAsync method');
          const result = await db.executeSqlAsync(
            `UPDATE user_settings SET 
              morning_start = ?, 
              morning_end = ?, 
              afternoon_start = ?, 
              afternoon_end = ?, 
              work_days = ?, 
              reminder_enabled = ?, 
              reminder_time = ?, 
              updated_at = ? 
             WHERE id = ?;`,
            [
              settings.morningStart,
              settings.morningEnd,
              settings.afternoonStart,
              settings.afternoonEnd,
              JSON.stringify(settings.workDays),
              settings.reminderEnabled ? 1 : 0,
              settings.reminderTime,
              Date.now(),
              settings.id
            ]
          );
          
          if (result && result.rowsAffected === 0) {
            // 如果没有更新，尝试插入
            await db.executeSqlAsync(
              `INSERT INTO user_settings (id, morning_start, morning_end, afternoon_start, afternoon_end, work_days, reminder_enabled, reminder_time, updated_at) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
              [
                settings.id,
                settings.morningStart,
                settings.morningEnd,
                settings.afternoonStart,
                settings.afternoonEnd,
                JSON.stringify(settings.workDays),
                settings.reminderEnabled ? 1 : 0,
                settings.reminderTime,
                Date.now()
              ]
            );
          }
        } else if (db.transactionAsync) {
          // 新版本 API
          console.log('Using transactionAsync method');
          await db.transactionAsync(async (tx) => {
            const result = await tx.executeSqlAsync(
              `UPDATE user_settings SET 
                morning_start = ?, 
                morning_end = ?, 
                afternoon_start = ?, 
                afternoon_end = ?, 
                work_days = ?, 
                reminder_enabled = ?, 
                reminder_time = ?, 
                updated_at = ? 
               WHERE id = ?;`,
              [
                settings.morningStart,
                settings.morningEnd,
                settings.afternoonStart,
                settings.afternoonEnd,
                JSON.stringify(settings.workDays),
                settings.reminderEnabled ? 1 : 0,
                settings.reminderTime,
                Date.now(),
                settings.id
              ]
            );
            
            if (result && result.rowsAffected === 0) {
              // 如果没有更新，尝试插入
              await tx.executeSqlAsync(
                `INSERT INTO user_settings (id, morning_start, morning_end, afternoon_start, afternoon_end, work_days, reminder_enabled, reminder_time, updated_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
                [
                  settings.id,
                  settings.morningStart,
                  settings.morningEnd,
                  settings.afternoonStart,
                  settings.afternoonEnd,
                  JSON.stringify(settings.workDays),
                  settings.reminderEnabled ? 1 : 0,
                  settings.reminderTime,
                  Date.now()
                ]
              );
            }
          });
        } else if (db.transaction) {
          // 旧版本 API
          await new Promise<void>((resolve, reject) => {
            db.transaction(tx => {
              tx.executeSql(
                `UPDATE user_settings SET 
                  morning_start = ?, 
                  morning_end = ?, 
                  afternoon_start = ?, 
                  afternoon_end = ?, 
                  work_days = ?, 
                  reminder_enabled = ?, 
                  reminder_time = ?, 
                  updated_at = ? 
                 WHERE id = ?;`,
                [
                  settings.morningStart,
                  settings.morningEnd,
                  settings.afternoonStart,
                  settings.afternoonEnd,
                  JSON.stringify(settings.workDays),
                  settings.reminderEnabled ? 1 : 0,
                  settings.reminderTime,
                  Date.now(),
                  settings.id
                ],
                (_, { rowsAffected }) => {
                  if (rowsAffected > 0) {
                    resolve();
                  } else {
                    // 如果没有更新，尝试插入
                    tx.executeSql(
                      `INSERT INTO user_settings (id, morning_start, morning_end, afternoon_start, afternoon_end, work_days, reminder_enabled, reminder_time, updated_at) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
                      [
                        settings.id,
                        settings.morningStart,
                        settings.morningEnd,
                        settings.afternoonStart,
                        settings.afternoonEnd,
                        JSON.stringify(settings.workDays),
                        settings.reminderEnabled ? 1 : 0,
                        settings.reminderTime,
                        Date.now()
                      ],
                      () => resolve(),
                      (_, error) => {
                        console.error('Error inserting settings:', error);
                        resolve();
                        return false;
                      }
                    );
                  }
                },
                (_, error) => {
                  console.error('Error updating settings:', error);
                  resolve();
                  return false;
                }
              );
            });
          });
        } else if (db.executeSql) {
          // 新版本 API
          console.log('Using new API: executeSql');
          const result = await db.executeSql(
            `UPDATE user_settings SET 
              morning_start = ?, 
              morning_end = ?, 
              afternoon_start = ?, 
              afternoon_end = ?, 
              work_days = ?, 
              reminder_enabled = ?, 
              reminder_time = ?, 
              updated_at = ? 
             WHERE id = ?;`,
            [
              settings.morningStart,
              settings.morningEnd,
              settings.afternoonStart,
              settings.afternoonEnd,
              JSON.stringify(settings.workDays),
              settings.reminderEnabled ? 1 : 0,
              settings.reminderTime,
              Date.now(),
              settings.id
            ]
          );
          
          if (result.rowsAffected === 0) {
            // 如果没有更新，尝试插入
            await db.executeSql(
              `INSERT INTO user_settings (id, morning_start, morning_end, afternoon_start, afternoon_end, work_days, reminder_enabled, reminder_time, updated_at) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
              [
                settings.id,
                settings.morningStart,
                settings.morningEnd,
                settings.afternoonStart,
                settings.afternoonEnd,
                JSON.stringify(settings.workDays),
                settings.reminderEnabled ? 1 : 0,
                settings.reminderTime,
                Date.now()
              ]
            );
          }
        } else {
          // 其他情况
          console.log('Updating memory settings only (no transaction or executeSql method)');
        }
      } catch (error) {
        console.error('Error updating settings:', error);
      }
    } catch (error) {
      console.error('Error in updateSettings:', error);
    }
  }
};
