import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Holiday {
  date: string;
  name: string;
  isHoliday: boolean; // true=放假, false=调休上班
}

// 本地备份数据（网络不可用时的兜底方案）
const FALLBACK_HOLIDAYS: Holiday[] = [
  // 2025年
  { date: '2025-01-01', name: '元旦', isHoliday: true },
  { date: '2025-01-26', name: '春节调休', isHoliday: false },
  { date: '2025-01-28', name: '春节', isHoliday: true },
  { date: '2025-01-29', name: '春节', isHoliday: true },
  { date: '2025-01-30', name: '春节', isHoliday: true },
  { date: '2025-01-31', name: '春节', isHoliday: true },
  { date: '2025-02-01', name: '春节', isHoliday: true },
  { date: '2025-02-02', name: '春节', isHoliday: true },
  { date: '2025-02-03', name: '春节', isHoliday: true },
  { date: '2025-02-04', name: '春节', isHoliday: true },
  { date: '2025-02-08', name: '春节调休', isHoliday: false },
  { date: '2025-04-04', name: '清明节', isHoliday: true },
  { date: '2025-04-05', name: '清明节', isHoliday: true },
  { date: '2025-04-06', name: '清明节', isHoliday: true },
  { date: '2025-04-27', name: '劳动节调休', isHoliday: false },
  { date: '2025-05-01', name: '劳动节', isHoliday: true },
  { date: '2025-05-02', name: '劳动节', isHoliday: true },
  { date: '2025-05-03', name: '劳动节', isHoliday: true },
  { date: '2025-05-04', name: '劳动节', isHoliday: true },
  { date: '2025-05-05', name: '劳动节', isHoliday: true },
  { date: '2025-05-31', name: '端午节', isHoliday: true },
  { date: '2025-06-01', name: '端午节', isHoliday: true },
  { date: '2025-06-02', name: '端午节', isHoliday: true },
  { date: '2025-09-28', name: '国庆节调休', isHoliday: false },
  { date: '2025-10-01', name: '国庆节', isHoliday: true },
  { date: '2025-10-02', name: '国庆节', isHoliday: true },
  { date: '2025-10-03', name: '国庆节', isHoliday: true },
  { date: '2025-10-04', name: '国庆节', isHoliday: true },
  { date: '2025-10-05', name: '国庆节', isHoliday: true },
  { date: '2025-10-06', name: '国庆节', isHoliday: true },
  { date: '2025-10-07', name: '国庆节', isHoliday: true },
  { date: '2025-10-08', name: '国庆节', isHoliday: true },
  { date: '2025-10-11', name: '国庆节调休', isHoliday: false },
  // 2026年
  { date: '2026-01-01', name: '元旦', isHoliday: true },
  { date: '2026-01-02', name: '元旦', isHoliday: true },
  { date: '2026-01-03', name: '元旦', isHoliday: true },
  { date: '2026-01-04', name: '元旦调休', isHoliday: false },
  { date: '2026-02-14', name: '春节调休', isHoliday: false },
  { date: '2026-02-15', name: '春节', isHoliday: true },
  { date: '2026-02-16', name: '春节', isHoliday: true },
  { date: '2026-02-17', name: '春节', isHoliday: true },
  { date: '2026-02-18', name: '春节', isHoliday: true },
  { date: '2026-02-19', name: '春节', isHoliday: true },
  { date: '2026-02-20', name: '春节', isHoliday: true },
  { date: '2026-02-21', name: '春节', isHoliday: true },
  { date: '2026-02-22', name: '春节', isHoliday: true },
  { date: '2026-02-23', name: '春节', isHoliday: true },
  { date: '2026-02-28', name: '春节调休', isHoliday: false },
  { date: '2026-04-04', name: '清明节', isHoliday: true },
  { date: '2026-04-05', name: '清明节', isHoliday: true },
  { date: '2026-04-06', name: '清明节', isHoliday: true },
  { date: '2026-05-01', name: '劳动节', isHoliday: true },
  { date: '2026-05-02', name: '劳动节', isHoliday: true },
  { date: '2026-05-03', name: '劳动节', isHoliday: true },
  { date: '2026-05-04', name: '劳动节', isHoliday: true },
  { date: '2026-05-05', name: '劳动节', isHoliday: true },
  { date: '2026-05-09', name: '劳动节调休', isHoliday: false },
  { date: '2026-06-19', name: '端午节', isHoliday: true },
  { date: '2026-06-20', name: '端午节', isHoliday: true },
  { date: '2026-06-21', name: '端午节', isHoliday: true },
  { date: '2026-09-25', name: '中秋节', isHoliday: true },
  { date: '2026-09-26', name: '中秋节', isHoliday: true },
  { date: '2026-09-27', name: '中秋节', isHoliday: true },
  { date: '2026-09-20', name: '国庆节调休', isHoliday: false },
  { date: '2026-10-01', name: '国庆节', isHoliday: true },
  { date: '2026-10-02', name: '国庆节', isHoliday: true },
  { date: '2026-10-03', name: '国庆节', isHoliday: true },
  { date: '2026-10-04', name: '国庆节', isHoliday: true },
  { date: '2026-10-05', name: '国庆节', isHoliday: true },
  { date: '2026-10-06', name: '国庆节', isHoliday: true },
  { date: '2026-10-07', name: '国庆节', isHoliday: true },
  { date: '2026-10-10', name: '国庆节调休', isHoliday: false },
];

// 缓存配置
const CACHE_KEY = 'holiday_data_cache';
const CACHE_TIME_KEY = 'holiday_cache_time';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7天缓存（节假日数据变化不频繁）

// 内存缓存
let holidayCache: Map<string, Holiday> = new Map();
let isInitialized = false;

// 数据源配置（按优先级排序）
const DATA_SOURCES = [
  {
    name: 'NateScarlet/holiday-cn (jsdelivr CDN)',
    baseUrl: 'https://cdn.jsdelivr.net/gh/NateScarlet/holiday-cn@master',
    type: 'github-json',
  },
  {
    name: 'NateScarlet/holiday-cn (Gitee镜像)',
    baseUrl: 'https://gitee.com/natescarlet/holiday-cn/raw/master',
    type: 'github-json',
  },
];

// 请求超时配置
const REQUEST_TIMEOUT = 10000; // 10秒超时

/**
 * 带超时的fetch请求
 */
async function fetchWithTimeout(url: string, timeout: number = REQUEST_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 从指定数据源获取指定年份的节假日数据
 */
async function fetchFromSource(source: typeof DATA_SOURCES[0], year: number): Promise<Holiday[]> {
  const url = `${source.baseUrl}/${year}.json`;
  console.log(`正在从 ${source.name} 获取${year}年数据...`);
  
  const response = await fetchWithTimeout(url);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.days || !Array.isArray(data.days)) {
    throw new Error('数据格式错误');
  }
  
  const holidays: Holiday[] = data.days.map((day: any) => ({
    date: day.date,
    name: day.name,
    isHoliday: day.isOffDay,
  }));
  
  console.log(`从 ${source.name} 成功获取${year}年数据，共${holidays.length}条`);
  return holidays;
}

/**
 * 从多个数据源获取节假日数据（自动切换）
 */
async function fetchHolidaysFromRemote(year: number): Promise<Holiday[]> {
  for (const source of DATA_SOURCES) {
    try {
      const holidays = await fetchFromSource(source, year);
      if (holidays.length > 0) {
        return holidays;
      }
    } catch (error) {
      console.warn(`${source.name} 获取${year}年数据失败:`, error);
      continue; // 尝试下一个数据源
    }
  }
  
  // 所有数据源都失败
  console.warn(`所有数据源都无法获取${year}年数据`);
  return [];
}

/**
 * 初始化节假日数据
 * 优先级：缓存 > 远程API > 本地备份
 */
export async function initHolidayData(): Promise<void> {
  if (isInitialized) {
    return;
  }
  
  try {
    // 1. 尝试从缓存读取
    const cachedData = await loadFromCache();
    if (cachedData && cachedData.length > 0) {
      cachedData.forEach(h => holidayCache.set(h.date, h));
      isInitialized = true;
      console.log('从缓存加载节假日数据成功，共', cachedData.length, '条');
      
      // 后台静默更新（不阻塞主流程）
      refreshHolidayDataInBackground();
      return;
    }
    
    // 2. 从远程获取数据
    await refreshHolidayData();
    
  } catch (error) {
    console.error('初始化节假日数据失败:', error);
    loadFallbackData();
  }
}

/**
 * 后台静默刷新节假日数据
 */
async function refreshHolidayDataInBackground(): Promise<void> {
  try {
    await refreshHolidayData();
  } catch (error) {
    console.warn('后台刷新节假日数据失败:', error);
    // 静默失败，不影响用户体验
  }
}

/**
 * 从远程刷新节假日数据
 */
async function refreshHolidayData(): Promise<void> {
  const currentYear = new Date().getFullYear();
  const allHolidays: Holiday[] = [];
  
  // 并发获取多年数据
  const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
  const promises = years.map(year => fetchHolidaysFromRemote(year));
  const results = await Promise.allSettled(promises);
  
  results.forEach(result => {
    if (result.status === 'fulfilled' && result.value.length > 0) {
      allHolidays.push(...result.value);
    }
  });
  
  if (allHolidays.length > 0) {
    // 更新内存缓存
    holidayCache.clear();
    allHolidays.forEach(h => holidayCache.set(h.date, h));
    isInitialized = true;
    
    // 持久化到本地存储
    await saveToCache(allHolidays);
    console.log(`节假日数据更新成功，共${allHolidays.length}条`);
  } else if (!isInitialized) {
    // 无法获取远程数据，使用本地备份
    loadFallbackData();
  }
}

/**
 * 加载本地备份数据
 */
function loadFallbackData(): void {
  console.log('使用本地备份节假日数据');
  FALLBACK_HOLIDAYS.forEach(h => holidayCache.set(h.date, h));
  isInitialized = true;
}

/**
 * 从AsyncStorage加载缓存
 */
async function loadFromCache(): Promise<Holiday[] | null> {
  try {
    const [dataStr, timeStr] = await Promise.all([
      AsyncStorage.getItem(CACHE_KEY),
      AsyncStorage.getItem(CACHE_TIME_KEY),
    ]);
    
    if (!dataStr || !timeStr) {
      return null;
    }
    
    const cacheTime = parseInt(timeStr, 10);
    const now = Date.now();
    
    // 检查缓存是否过期
    if (now - cacheTime > CACHE_DURATION) {
      console.log('缓存已过期');
      return null;
    }
    
    return JSON.parse(dataStr);
  } catch (error) {
    console.warn('读取缓存失败:', error);
    return null;
  }
}

/**
 * 保存数据到AsyncStorage
 */
async function saveToCache(holidays: Holiday[]): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(holidays)),
      AsyncStorage.setItem(CACHE_TIME_KEY, Date.now().toString()),
    ]);
    console.log('节假日数据已缓存');
  } catch (error) {
    console.warn('保存缓存失败:', error);
  }
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 获取指定日期的节假日信息
 */
export function getHoliday(date: Date): Holiday | null {
  const dateStr = formatDate(date);
  return holidayCache.get(dateStr) || null;
}

/**
 * 判断是否为节假日（放假）
 */
export function isHoliday(date: Date): boolean {
  const holiday = getHoliday(date);
  return holiday ? holiday.isHoliday : false;
}

/**
 * 判断是否为调休上班日
 */
export function isWorkdayOnHoliday(date: Date): boolean {
  const holiday = getHoliday(date);
  return holiday ? !holiday.isHoliday : false;
}

/**
 * 判断是否为实际工作日（考虑节假日和调休）
 */
export function isRealWorkDay(date: Date, workDays: number[]): boolean {
  // 先检查是否为节假日
  if (isHoliday(date)) {
    return false;
  }
  
  // 检查是否为调休上班日
  if (isWorkdayOnHoliday(date)) {
    return true;
  }
  
  // 按照正常工作日配置判断
  const dayOfWeek = date.getDay();
  const jsDay = dayOfWeek === 0 ? 7 : dayOfWeek; // 转换为1-7表示周一到周日
  return workDays.includes(jsDay);
}

/**
 * 强制刷新节假日数据
 */
export async function forceRefreshHolidays(): Promise<boolean> {
  try {
    // 清除缓存
    await Promise.all([
      AsyncStorage.removeItem(CACHE_KEY),
      AsyncStorage.removeItem(CACHE_TIME_KEY),
    ]);
    holidayCache.clear();
    isInitialized = false;
    
    // 重新获取数据
    await initHolidayData();
    return true;
  } catch (error) {
    console.error('强制刷新失败:', error);
    return false;
  }
}

/**
 * 获取节假日数据统计信息
 */
export function getHolidayStats(): { total: number; years: number[]; lastUpdate: string | null } {
  const years = new Set<number>();
  holidayCache.forEach((_, dateStr) => {
    const year = parseInt(dateStr.substring(0, 4), 10);
    years.add(year);
  });
  
  return {
    total: holidayCache.size,
    years: Array.from(years).sort(),
    lastUpdate: null, // 可以扩展为从缓存读取
  };
}