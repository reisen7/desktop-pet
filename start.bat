@echo off
echo 正在启动桌面宠物...
echo.

REM 检查是否安装了 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未检测到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

REM 检查是否安装了依赖
if not exist "node_modules" (
    echo 正在安装依赖包...
    npm install
    if errorlevel 1 (
        echo 依赖安装失败，请检查网络连接
        pause
        exit /b 1
    )
)

REM 启动应用
echo 启动桌面宠物应用...
npm start

pause
