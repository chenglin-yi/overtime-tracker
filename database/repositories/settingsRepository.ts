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

      return new Promise((resolve, reject) => {
        if (db.transaction) {
          // 旧版本 API
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
        } else {
          // 新版本 API 或 mock
          console.log('Using memory settings (no transaction method)');
          resolve(memorySettings);
        }
      });
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

      return new Promise((resolve, reject) => {
        if (db.transaction) {
          // 旧版本 API
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
        } else {
          // 新版本 API 或 mock
          console.log('Updating memory settings only (no transaction method)');
          resolve();
        }
      });
    } catch (error) {
      console.error('Error in updateSettings:', error);
    }
  }
};
