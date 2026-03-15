class AnalyticsService {
  // 记录App启动事件
  trackAppLaunch() {
    const event = {
      event_name: 'app_launch',
      timestamp: new Date().toISOString(),
      device_info: {
        platform: 'react-native',
        app_version: '1.0.0',
      },
    };
    this.sendEvent(event);
  }

  // 记录打卡按钮点击事件
  trackPunchClick() {
    const event = {
      event_name: 'punch_click',
      timestamp: new Date().toISOString(),
    };
    this.sendEvent(event);
  }

  // 记录打卡成功事件
  trackPunchSuccess(isMakeup: boolean, overtimeMinutes: number) {
    const event = {
      event_name: 'punch_success',
      timestamp: new Date().toISOString(),
      properties: {
        is_makeup: isMakeup,
        overtime_minutes: overtimeMinutes,
      },
    };
    this.sendEvent(event);
  }

  // 记录数据导出事件
  trackExportData(format: string, recordCount: number) {
    const event = {
      event_name: 'export_data',
      timestamp: new Date().toISOString(),
      properties: {
        format: format,
        record_count: recordCount,
      },
    };
    this.sendEvent(event);
  }

  // 记录查看统计事件
  trackViewStatistics(dimension: string) {
    const event = {
      event_name: 'view_statistics',
      timestamp: new Date().toISOString(),
      properties: {
        dimension: dimension,
      },
    };
    this.sendEvent(event);
  }

  // 发送事件（实际应用中可以替换为真实的埋点SDK）
  private sendEvent(event: any) {
    console.log('Analytics Event:', event);
    // 这里可以集成真实的埋点SDK，如Firebase Analytics、Amplitude等
    // 例如：analytics.track(event.event_name, event.properties);
  }
}

export default new AnalyticsService();