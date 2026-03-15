export interface OvertimeRecord {
  id: string;
  date: string;         // 日期 (YYYY-MM-DD)
  punchTime: string;    // 打卡时间 (HH:mm)
  workStartMorning: string;    // 上午上班标准时间
  workEndMorning: string;      // 上午下班标准时间
  workStartAfternoon: string;  // 下午上班标准时间
  workEndAfternoon: string;    // 下午下班标准时间
  overtimeMinutes: number;  // 加班时长（分钟）
  reason: string;       // 加班理由
  isMakeup: boolean;    // 是否补打卡
  makeupNote?: string;  // 补打卡详细说明
  createdAt: number;    // 创建时间戳
  updatedAt: number;    // 更新时间戳
}
