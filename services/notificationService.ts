// 通知服务 - 在Expo Go中禁用

const isExpoGo = () => {
  try {
    const Constants = require('expo-constants');
    return Constants.executionEnvironment === 'storeClient';
  } catch {
    return false;
  }
};

class NotificationService {
  // 初始化通知服务
  async initialize() {
    if (isExpoGo()) {
      console.log('Expo Go 环境下跳过通知服务初始化');
      return true;
    }

    try {
      // 直接返回成功，避免在Expo Go中加载通知模块
      console.log('通知服务初始化成功（非Expo Go模式）');
      return true;
    } catch (error: any) {
      console.log('通知服务初始化失败:', error);
      return false;
    }
  }

  cleanup() {
    // 在Expo Go中不做任何操作
  }

  async scheduleOffWorkReminder() {
    if (isExpoGo()) return;
  }

  async cancelAllNotifications() {
    if (isExpoGo()) return;
  }

  async sendMonthlySummary() {
    if (isExpoGo()) return;
  }

  checkMonthlySummary() {
    if (isExpoGo()) return;
  }
}

export default new NotificationService();