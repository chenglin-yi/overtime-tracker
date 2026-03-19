# 加班记 - Overtime Tracker

一款简单实用的加班记录移动应用，让每一份付出都有据可查。

## 功能特性

- 📱 **一键打卡**：快速记录加班时间，自动计算加班时长
- 📊 **数据统计**：多维度统计加班数据（日/周/月/年）
- 📝 **补打卡**：支持历史日期补打卡
- 📤 **数据导出**：支持导出Excel格式报表
- 🔔 **通知提醒**：本地通知提醒功能
- 🎨 **主题切换**：支持深色/浅色主题
- 👋 **用户引导**：首次使用引导页面

## 技术栈

- **框架**: React Native with Expo SDK 55
- **语言**: TypeScript
- **状态管理**: Zustand
- **数据存储**: SQLite (expo-sqlite)
- **UI组件**: React Native Paper
- **导航**: React Navigation
- **图表**: react-native-chart-kit
- **数据导出**: xlsx
- **通知**: expo-notifications
- **构建**: EAS Build

## 项目结构

```
ledger/
├── app/                    # 应用主目录
│   ├── (tabs)/            # 底部标签页面
│   │   ├── index.tsx      # 首页
│   │   ├── statistics.tsx # 统计页
│   │   ├── records.tsx    # 记录页
│   │   └── settings.tsx   # 设置页
│   └── components/        # 公共组件
│       └── OnboardingScreen.tsx  # 引导页
├── assets/                # 静态资源
├── constants/             # 常量定义
├── database/              # 数据库相关
│   ├── index.ts           # 数据库初始化
│   └── repositories/      # 数据仓库
├── services/              # 服务层
├── stores/                # 状态管理
├── types/                 # TypeScript类型定义
├── utils/                 # 工具函数
├── App.tsx                # 应用入口
├── app.json               # Expo配置
└── package.json           # 项目依赖
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm start
```

### 运行在Android

```bash
npm run android
```

### 运行在iOS

```bash
npm run ios
```

## 构建应用

### 使用EAS Build构建Android APK

```bash
eas build --platform android --profile preview
```

## 提交规范

本项目遵循Conventional Commits提交规范：

- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

## 许可证

MIT
