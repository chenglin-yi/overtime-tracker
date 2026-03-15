export interface UserSettings {
  id: number;
  morningStart: string; // 上午上班 如 "09:00"
  morningEnd: string;   // 上午下班 如 "12:00"
  afternoonStart: string; // 下午上班 如 "14:00"
  afternoonEnd: string;   // 下午下班 如 "18:00"
  workDays: number[];   // 工作日 [1,2,3,4,5] 表示周一到周五
  reminderEnabled: boolean;
  reminderTime?: number;  // 下班后多久提醒（分钟）
  updatedAt?: number;
}
