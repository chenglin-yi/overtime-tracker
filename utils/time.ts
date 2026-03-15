export function calculateOvertime(punchTime: Date, workEndTime: string): number {
  const [endHour, endMinute] = workEndTime.split(':').map(Number);
  const workEnd = new Date(punchTime);
  workEnd.setHours(endHour, endMinute, 0, 0);
  
  const diffMs = punchTime.getTime() - workEnd.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60)));
}

export function getWorkEndTime(date: Date, afternoonEnd: string): string {
  return afternoonEnd; // 默认使用下午下班时间
}

export function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

export function minutesToHours(minutes: number): number {
  return Math.round((minutes / 60) * 10) / 10;
}
