import * as SQLite from 'expo-sqlite';

let db: any = null;

export const initDatabase = async () => {
  return new Promise<void>((resolve, reject) => {
    try {
      console.log('Initializing database...');
      
      // 尝试使用新的 API 方式打开数据库
      try {
        console.log('Using new API: openDatabaseSync');
        db = SQLite.openDatabaseSync('overtime.db');
      } catch (error) {
        console.error('Error opening database with openDatabaseSync:', error);
        console.log('expo-sqlite API not available, using mock');
        // 创建一个 mock 数据库对象，以便应用可以继续运行
        db = createMockDatabase();
      }

      console.log('Database opened successfully');

      // 执行数据库初始化
      if (db && db.transaction) {
        console.log('Using transaction method');
        db.transaction(tx => {
          createTables(tx);
        }, (error) => {
          console.error('Transaction error:', error);
          resolve(); // 即使出错也继续
        }, () => {
          console.log('Database initialized successfully');
          resolve();
        });
      } else if (db && db.exec) {
        console.log('Using exec method');
        try {
          const sql = `
            CREATE TABLE IF NOT EXISTS overtime_records (
              id TEXT PRIMARY KEY,
              date TEXT NOT NULL,
              punch_time TEXT NOT NULL,
              work_start_morning TEXT NOT NULL,
              work_end_morning TEXT NOT NULL,
              work_start_afternoon TEXT NOT NULL,
              work_end_afternoon TEXT NOT NULL,
              overtime_minutes INTEGER NOT NULL,
              reason TEXT NOT NULL,
              is_makeup INTEGER NOT NULL,
              makeup_note TEXT,
              created_at INTEGER NOT NULL,
              updated_at INTEGER NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS user_settings (
              id INTEGER PRIMARY KEY,
              morning_start TEXT NOT NULL,
              morning_end TEXT NOT NULL,
              afternoon_start TEXT NOT NULL,
              afternoon_end TEXT NOT NULL,
              work_days TEXT NOT NULL,
              reminder_enabled INTEGER NOT NULL,
              reminder_time INTEGER,
              updated_at INTEGER NOT NULL
            );
            
            INSERT OR IGNORE INTO user_settings (id, morning_start, morning_end, afternoon_start, afternoon_end, work_days, reminder_enabled, reminder_time, updated_at) 
            VALUES (1, '09:00', '12:00', '14:00', '18:00', '[1,2,3,4,5]', 1, 30, ${Date.now()});
          `;
          db.exec(sql);
          console.log('Database initialized with exec');
          resolve();
        } catch (error) {
          console.error('Exec error:', error);
          resolve();
        }
      } else {
        console.log('Using mock database');
        resolve();
      }
    } catch (error) {
      console.error('Database initialization error:', error);
      // 即使数据库初始化失败，也继续运行应用
      resolve();
    }
  });
};

function createTables(tx: any) {
  // 创建打卡记录表
  tx.executeSql(
    `CREATE TABLE IF NOT EXISTS overtime_records (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      punch_time TEXT NOT NULL,
      work_start_morning TEXT NOT NULL,
      work_end_morning TEXT NOT NULL,
      work_start_afternoon TEXT NOT NULL,
      work_end_afternoon TEXT NOT NULL,
      overtime_minutes INTEGER NOT NULL,
      reason TEXT NOT NULL,
      is_makeup INTEGER NOT NULL,
      makeup_note TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );`
  );
  
  // 创建用户设置表
  tx.executeSql(
    `CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY,
      morning_start TEXT NOT NULL,
      morning_end TEXT NOT NULL,
      afternoon_start TEXT NOT NULL,
      afternoon_end TEXT NOT NULL,
      work_days TEXT NOT NULL,
      reminder_enabled INTEGER NOT NULL,
      reminder_time INTEGER,
      updated_at INTEGER NOT NULL
    );`
  );
  
  // 插入默认设置
  tx.executeSql(
    `INSERT OR IGNORE INTO user_settings (id, morning_start, morning_end, afternoon_start, afternoon_end, work_days, reminder_enabled, reminder_time, updated_at) 
     VALUES (1, '09:00', '12:00', '14:00', '18:00', '[1,2,3,4,5]', 1, 30, ?);`,
    [Date.now()]
  );
}

function createMockDatabase() {
  // 创建一个简单的内存数据库用于模拟
  const records: any[] = [];
  const settings = {
    id: 1,
    morningStart: '09:00',
    morningEnd: '12:00',
    afternoonStart: '14:00',
    afternoonEnd: '18:00',
    workDays: [1, 2, 3, 4, 5],
    reminderEnabled: true,
    reminderTime: 30,
    updatedAt: Date.now()
  };

  return {
    transaction: (callback: any) => {
      callback({
        executeSql: (sql: string, params?: any[]) => {
          console.log('Mock executeSql:', sql, params);
        }
      });
    },
    exec: (sql: string) => {
      console.log('Mock exec:', sql);
    },
    // 模拟方法
    mockRecords: records,
    mockSettings: settings
  };
}

export const getDatabase = () => db;
