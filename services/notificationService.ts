import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 配置通知行为
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// 存储键
const REMINDER_ENABLED_KEY = 'reminder_enabled';
const REMINDER_TIME_KEY = 'reminder_time';
const LAST_MONTHLY_SUMMARY_KEY = 'last_monthly_summary';

class NotificationService {
  private isInitialized = false;

  /**
   * 初始化通知服务
   */
  async initialize(): Promise<boolean> {
    try {
      // 检查是否在真实设备上
      if (!Device.isDevice) {
        console.log('模拟器不支持推送通知，使用本地通知');
        // 在模拟器上也可以使用本地通知
        this.isInitialized = true;
        return true;
      }

      // 请求通知权限
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('通知权限未授予');
        this.isInitialized = true; // 仍然标记为已初始化，允许使用本地通知
        return true;
      }

      // Android需要设置通知渠道
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: '默认通知',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        await Notifications.setNotificationChannelAsync('reminder', {
          name: '打卡提醒',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1E3A5F',
        });
      }

      console.log('通知服务初始化成功');
      this.isInitialized = true;
      return true;
    } catch (error: any) {
      console.log('通知服务初始化失败:', error);
      this.isInitialized = true; // 即使失败也标记为已初始化
      return false;
    }
  }

  /**
   * 清理通知监听器
   */
  cleanup() {
    // 清理工作（如果需要）
  }

  /**
   * 请求通知权限
   */
  async requestPermission(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('请求通知权限失败:', error);
      return false;
    }
  }

  /**
   * 立即发送本地通知
   */
  async sendLocalNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: true,
        },
        trigger: null, // 立即发送
      });
      console.log('本地通知已发送:', title);
    } catch (error) {
      console.error('发送本地通知失败:', error);
    }
  }

  /**
   * 设置下班打卡提醒
   * @param reminderMinutes 下班前多少分钟提醒
   */
  async scheduleOffWorkReminder(reminderMinutes: number = 30): Promise<void> {
    try {
      // 先取消所有现有的提醒
      await this.cancelAllNotifications();

      // 获取设置
      const settingsStr = await AsyncStorage.getItem('user_settings');
      let afternoonEnd = '18:00';
      
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        afternoonEnd = settings.afternoonEnd || '18:00';
      }

      // 解析下班时间
      const [endHour, endMinute] = afternoonEnd.split(':').map(Number);
      
      // 计算提醒时间
      const now = new Date();
      const reminderTime = new Date();
      reminderTime.setHours(endHour, endMinute - reminderMinutes, 0, 0);

      // 如果提醒时间已过，设置为明天
      if (reminderTime <= now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }

      // 计算延迟时间（秒）
      const delaySeconds = Math.floor((reminderTime.getTime() - now.getTime()) / 1000);

      console.log(`设置下班提醒: ${reminderTime.toLocaleString()}, 延迟: ${delaySeconds}秒`);

      // 设置每日重复提醒
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '下班打卡提醒',
          body: `还有${reminderMinutes}分钟就下班了，记得打卡哦！`,
          data: { type: 'off_work_reminder' },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: endHour,
          minute: endMinute - reminderMinutes,
          channelId: 'reminder',
        },
      });

      // 保存提醒状态
      await AsyncStorage.setItem(REMINDER_ENABLED_KEY, 'true');
      await AsyncStorage.setItem(REMINDER_TIME_KEY, reminderMinutes.toString());

      console.log('下班打卡提醒已设置');
    } catch (error) {
      console.error('设置下班提醒失败:', error);
    }
  }

  /**
   * 取消所有通知
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.setItem(REMINDER_ENABLED_KEY, 'false');
      console.log('所有通知已取消');
    } catch (error) {
      console.error('取消通知失败:', error);
    }
  }

  /**
   * 检查并发送月度汇总
   */
  async checkMonthlySummary(): Promise<void> {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      // 检查是否是月初（1-3号）
      if (now.getDate() > 3) {
        return;
      }

      // 检查本月是否已发送过汇总
      const lastSummary = await AsyncStorage.getItem(LAST_MONTHLY_SUMMARY_KEY);
      const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (lastSummary === currentMonth) {
        return;
      }

      // 获取上个月的记录
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      
      const startDate = lastMonth.toISOString().split('T')[0];
      const endDate = lastMonthEnd.toISOString().split('T')[0];

      // 发送汇总通知
      await this.sendLocalNotification(
        '月度加班汇总',
        `上月加班数据已生成，点击查看详细统计。`,
        { type: 'monthly_summary', startDate, endDate }
      );

      // 记录已发送
      await AsyncStorage.setItem(LAST_MONTHLY_SUMMARY_KEY, currentMonth);
    } catch (error) {
      console.error('检查月度汇总失败:', error);
    }
  }

  /**
   * 发送月度汇总通知
   */
  async sendMonthlySummary(totalMinutes: number): Promise<void> {
    try {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      
      await this.sendLocalNotification(
        '月度加班汇总',
        `上月累计加班 ${hours} 小时 ${minutes} 分钟`,
        { type: 'monthly_summary' }
      );
    } catch (error) {
      console.error('发送月度汇总失败:', error);
    }
  }

  /**
   * 测试通知
   */
  async testNotification(): Promise<void> {
    await this.sendLocalNotification(
      '测试通知',
      '这是一条测试通知，通知功能正常工作！',
      { type: 'test' }
    );
  }

  /**
   * 获取通知权限状态
   */
  async getPermissionStatus(): Promise<string> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status;
    } catch (error) {
      return 'undetermined';
    }
  }
}

export default new NotificationService();