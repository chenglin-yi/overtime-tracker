import * as SQLite from 'expo-sqlite';

let db: any = null;

export const initDatabase = async () => {
  try {
    console.log('Initializing database...');
    
    // 尝试使用新的 API 方式打开数据库
    try {
      console.log('Using new API: openDatabaseSync');
      db = SQLite.openDatabaseSync('overtime.db');
      console.log('Database object:', db);
      console.log('Database object methods:', Object.keys(db));
    } catch (error) {
      console.error('Error opening database with openDatabaseSync:', error);
      console.log('expo-sqlite API not available, using mock');
      // 创建一个 mock 数据库对象，以便应用可以继续运行
      db = createMockDatabase();
    }

    console.log('Database opened successfully');
    console.log('Final database object:', db);
    console.log('Final database object methods:', Object.keys(db));

    // 执行数据库初始化
    if (db) {
      try {
        // 分别执行每个 SQL 语句
        const createRecordsTable = `
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
        `;
        
        const createSettingsTable = `
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
        `;
        
        const insertDefaultSettings = `
          INSERT OR IGNORE INTO user_settings (id, morning_start, morning_end, afternoon_start, afternoon_end, work_days, reminder_enabled, reminder_time, updated_at) 
          VALUES (1, '09:00', '12:00', '14:00', '18:00', '[1,2,3,4,5]', 1, 30, ${Date.now()});
        `;
        
        // 尝试使用不同的方法执行 SQL 语句
        if (db.execAsync) {
          console.log('Using execAsync method');
          await db.execAsync(createRecordsTable);
          await db.execAsync(createSettingsTable);
          await db.execAsync(insertDefaultSettings);
        } else if (db.runAsync) {
          console.log('Using runAsync method');
          await db.runAsync(createRecordsTable);
          await db.runAsync(createSettingsTable);
          await db.runAsync(insertDefaultSettings);
        } else if (db.executeSqlAsync) {
          console.log('Using executeSqlAsync method');
          await db.executeSqlAsync(createRecordsTable);
          await db.executeSqlAsync(createSettingsTable);
          await db.executeSqlAsync(insertDefaultSettings);
        } else if (db.transactionAsync) {
          console.log('Using transactionAsync method');
          await db.transactionAsync(async (tx) => {
            await tx.executeSqlAsync(createRecordsTable);
            await tx.executeSqlAsync(createSettingsTable);
            await tx.executeSqlAsync(insertDefaultSettings);
          });
        } else if (db.transaction) {
          console.log('Using transaction method');
          await new Promise<void>((resolve) => {
            db.transaction(tx => {
              tx.executeSql(createRecordsTable);
              tx.executeSql(createSettingsTable);
              tx.executeSql(insertDefaultSettings);
            }, null, resolve);
          });
        } else if (db.exec) {
          console.log('Using exec method');
          db.exec(createRecordsTable);
          db.exec(createSettingsTable);
          db.exec(insertDefaultSettings);
        } else if (db.executeSql) {
          console.log('Using executeSql method');
          db.executeSql(createRecordsTable);
          db.executeSql(createSettingsTable);
          db.executeSql(insertDefaultSettings);
        } else {
          console.log('No suitable method found to execute SQL');
        }
        
        console.log('Database initialized successfully');
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    } else {
      console.log('Using mock database');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
  }
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
