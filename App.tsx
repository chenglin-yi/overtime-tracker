import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Provider as PaperProvider } from 'react-native-paper';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 导入页面
import HomeScreen from './app/(tabs)/index';
import StatisticsScreen from './app/(tabs)/statistics';
import RecordsScreen from './app/(tabs)/records';
import SettingsScreen from './app/(tabs)/settings';
import OnboardingScreen from './app/components/OnboardingScreen';

// 导入数据库初始化
import { initDatabase } from './database';
import notificationService from './services/notificationService';
import analyticsService from './services/analyticsService';

const Tab = createBottomTabNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // 初始化应用
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('开始初始化应用...');
        
        // 记录App启动事件
        analyticsService.trackAppLaunch();
        
        // 检查是否需要显示引导页
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        if (!hasSeenOnboarding) {
          setShowOnboarding(true);
        }
        
        // 初始化数据库
        console.log('开始初始化数据库...');
        await initDatabase();
        console.log('数据库初始化成功');
        
        // 初始化通知服务
        console.log('开始初始化通知服务...');
        await notificationService.initialize();
        
        // 检查是否需要发送月度汇总
        notificationService.checkMonthlySummary();
      } catch (err) {
        console.error('初始化失败:', err);
        setError('初始化失败');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();

    // 清理通知监听器
    return () => {
      notificationService.cleanup();
    };
  }, []);

  // 处理引导页完成
  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      setShowOnboarding(false);
    } catch (error) {
      console.error('保存引导页状态失败:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A5F" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={64} color="#F5A623" />
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorSubtext}>应用将在无数据库模式下运行</Text>
      </View>
    );
  }

  // 显示引导页
  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  // 显示主应用
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => {
              console.log('路由:', route.name);
              return {
                tabBarIcon: ({ focused, color, size }) => {
                  let iconName: keyof typeof MaterialCommunityIcons.glyphMap;

                  if (route.name === 'Home') {
                    iconName = focused ? 'home' : 'home-outline';
                  } else if (route.name === 'Statistics') {
                    iconName = focused ? 'chart-bar' : 'chart-bar';
                  } else if (route.name === 'Records') {
                    iconName = focused ? 'format-list-bulleted' : 'format-list-bulleted';
                  } else if (route.name === 'Settings') {
                    iconName = focused ? 'cog' : 'cog-outline';
                  } else {
                    iconName = 'alert-circle';
                  }

                  return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#1E3A5F',
                tabBarInactiveTintColor: 'gray',
              };
            }}
          >
            <Tab.Screen 
              name="Home" 
              component={HomeScreen} 
              options={{ title: '首页' }}
            />
            <Tab.Screen 
              name="Statistics" 
              component={StatisticsScreen} 
              options={{ title: '统计' }}
            />
            <Tab.Screen 
              name="Records" 
              component={RecordsScreen} 
              options={{ title: '记录' }}
            />
            <Tab.Screen 
              name="Settings" 
              component={SettingsScreen} 
              options={{ title: '设置' }}
            />
          </Tab.Navigator>
          <StatusBar style="auto" />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1E3A5F',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F5A623',
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
