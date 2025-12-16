const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let petWindow;

function createPetWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    
    petWindow = new BrowserWindow({
        width: 800, // 增加宽度以容纳超宽气泡
        height: 200, // 改回原来的高度
        x: Math.floor(width / 2 - 400), // 调整居中位置
        y: Math.floor(height / 2 - 100),
        frame: false,
        transparent: true,
        hasShadow: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        show: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    petWindow.loadFile('pet.html');
    
    // 开发模式下打开开发者工具
    if (process.argv.includes('--dev')) {
        petWindow.webContents.openDevTools();
    }
    
    // 监听窗口关闭事件
    petWindow.on('closed', () => {
        petWindow = null;
    });

    return petWindow;
}

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 400,
        height: 300,
        autoHideMenuBar: true, // 隐藏菜单栏
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('control.html');
    
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createMainWindow();
    createPetWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
            createPetWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC 通信处理
ipcMain.on('move-pet', (event, x, y) => {
    if (petWindow) {
        petWindow.setPosition(x, y);
    }
});

ipcMain.on('drag-pet', (event, dx, dy) => {
    if (petWindow) {
        const [x, y] = petWindow.getPosition();
        petWindow.setPosition(x + dx, y + dy);
    }
});

// 新增：动态调整窗口大小
ipcMain.on('resize-window', (event, width, height) => {
    if (petWindow) {
        const bounds = petWindow.getBounds();
        // 保持中心点不变
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        
        const newX = Math.floor(centerX - width / 2);
        const newY = Math.floor(centerY - height / 2);
        
        petWindow.setBounds({
            x: newX,
            y: newY,
            width: width,
            height: height
        });
    }
});

ipcMain.on('hide-pet', () => {
    if (petWindow) {
        petWindow.hide();
    }
});

ipcMain.on('show-pet', () => {
    if (petWindow) {
        petWindow.show();
    }
});

ipcMain.on('quit-app', () => {
    app.quit();
});

// 新增：控制鼠标穿透
ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        win.setIgnoreMouseEvents(ignore, options);
    }
});
