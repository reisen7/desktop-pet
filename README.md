# 给源小舞的专属桌面宠物

<div align="center">
  <img src="assets/love.jpg" width="120" height="120" style="border-radius: 50%; object-fit: cover; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" alt="源小舞">
  <br><br>
  <p>
    <em>
      "在这个由 0 和 1 编织的世界里，你是我最温柔的 Bug，<br>
      也是我永远不想修复的 Feature。<br>
      愿这个小小的桌面精灵，能代替我跨越屏幕的距离，<br>
      在你工作的间隙，在你发呆的片刻，<br>
      给你最长情的陪伴和最温暖的守候。✨"
    </em>
  </p>
</div>

一个专门为源小舞定制的可爱桌面宠物应用，基于 **Electron** 和 **Tauri** 开发，让可爱的角色永远陪伴小舞的工作和学习！

##  功能特色

-  **智能心情系统**: 4种不同心情状态，每种都有独特的表情和行为
  - **开心模式** (happy-smile): 活泼开朗，喜欢弹跳和旋转
  - **可爱模式** (cute-wink): 俏皮眨眼，爱撒娇和摆动
  - **困倦模式** (sleepy-tired): 慵懒安静，偏爱漂浮和休息
  - **害羞模式** (shy-blush): 腼腆可爱，轻柔摇摆和颤动
-  **奔跑动画**: 经典的雪碧图奔跑动画，还原原版效果
-  **心情动画**: 根据当前心情智能选择合适的动画效果
-  **源小舞专属对话**: 每种心情都有专属的对话内容，所有对话都亲切地称呼"小舞"或"源小舞"
-  **智能行为**: 自动随机心情变化、移动、说话、奔跑等行为
-  **模式切换**: 静态模式和奔跑模式自由切换
-  **交互操作**: 点击、双击、右键菜单等丰富交互
-  **控制面板**: 方便的控制面板管理宠物
-  **桌面置顶**: 始终显示在桌面最前方
-  **透明背景**: 完美融入桌面环境

##  快速开始

### 1. 安装依赖

```bash
# 进入项目目录
cd desktop-pet

# 安装依赖
npm install
```

### 2. 运行应用

本项目支持两种运行模式：**Electron** (传统模式) 和 **Tauri** (轻量级模式)。

####  Electron 模式

**开发环境运行：**
```bash
npm run dev
```

**生产环境运行：**
```bash
npm start
```

**打包应用：**
```bash
npm run build
```
打包后的文件位于 `dist/` 目录下。

####  Tauri 模式

Tauri 模式生成的应用体积更小，性能更好。
请确保已安装 Rust 和 Tauri 依赖。参考 [Tauri 官方文档](https://tauri.app/v1/guides/getting-started/prerequisites)。

**开发环境运行：**
```bash
npm run tauri:dev
```

**打包应用：**
```bash
npm run tauri:build
```
打包后的文件位于 `src-tauri/target/release/bundle/` 目录下。

##  使用说明

### 基本操作
- **单击宠物**: 显示对话泡泡并播放弹跳动画
- **双击宠物**: 播放随机动画效果
- **右键宠物**: 显示功能菜单
- **拖拽宠物**: 移动宠物到指定位置
- **鼠标悬停**: 宠物会放大并可能说话

### 右键菜单功能
- **切换心情**: 在4种心情状态间切换
- **切换模式**: 在静态模式和奔跑模式之间切换
- **说话**: 让宠物说一句话
- **隐藏**: 暂时隐藏宠物
- **退出**: 关闭应用

### 控制面板功能
- **显示/隐藏宠物**: 控制宠物的显示状态
- **召唤宠物**: 将宠物移动到屏幕中央
- **开发者工具**: 打开调试工具
- **退出应用**: 完全关闭应用

##  自定义

### 更换宠物图片
将你喜欢的图片放在项目根目录，然后修改 `pet.js` 中的 `petImages` 数组：

```javascript
this.petImages = [
    '../your-image-1.jpg',
    '../your-image-2.jpg',
    // 添加更多图片...
];
```

### 自定义对话内容
修改 `pet.js` 中的 `speeches` 数组：

```javascript
this.speeches = [
    '你的自定义对话1',
    '你的自定义对话2',
    // 添加更多对话...
];
```

### 调整行为频率
修改 `startRandomBehavior()` 方法中的时间间隔：

```javascript
const delay = Math.random() * 20000 + 10000; // 10-30秒间隔
```

##  项目结构

```
desktop-pet/
 main.js          # Electron 主进程
 pet.html         # 宠物界面 (Electron)
 pet.css          # 宠物样式
 pet.js           # 宠物逻辑
 control.html     # 控制面板
 src-tauri/       # Tauri 后端代码 (Rust)
 dist_tauri/      # Tauri 构建输出目录
 package.json     # 项目配置
 README.md        # 说明文档
```

##  技术栈

- **Electron**: 跨平台桌面应用框架
- **Tauri**: 轻量级桌面应用构建工具
- **Rust**: Tauri 后端语言
- **HTML/CSS/JavaScript**: 前端技术
- **Node.js**: 运行环境

##  系统要求

- Windows 10 或更高版本
- Node.js 16.0 或更高版本
- 至少 100MB 可用内存 (Electron 模式) 或 更少 (Tauri 模式)

##  常见问题

### Q: 宠物不显示怎么办？
A: 检查是否被其他窗口遮挡，或者使用控制面板的"召唤宠物"功能。

### Q: 如何完全关闭应用？
A: 右键宠物选择"退出"，或者在控制面板点击"退出应用"。

### Q: 宠物移动太频繁怎么办？
A: 可以修改 `pet.js` 中的随机行为时间间隔。

##  更新日志

### v1.0.0
- 初始版本发布
- 基本的宠物功能
- 多种动画效果
- 控制面板
- 新增 Tauri 支持

##  贡献

欢迎提交 Issue 和 Pull Request！

##  许可证

MIT License
