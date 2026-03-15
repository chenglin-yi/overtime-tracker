import { UserSettings } from '../types/settings';

export const DEFAULT_SETTINGS: UserSettings = {
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
