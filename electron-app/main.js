const { app, BrowserWindow, globalShortcut, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let isAlwaysOnTop = false;
let isMaximized = false;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 800,
        frame: false,
        titleBarStyle: 'hidden',
        trafficLightPosition: { x: -100, y: -100 },
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        icon: path.join(__dirname, 'icons', 'icon.png'),
        title: 'Trader Journal',
        backgroundColor: '#0f172a',
        resizable: true,
    });

    mainWindow.on('maximize', () => {
        isMaximized = true;
        mainWindow.webContents.send('window-state-changed', { isMaximized: true });
    });

    mainWindow.on('unmaximize', () => {
        isMaximized = false;
        mainWindow.webContents.send('window-state-changed', { isMaximized: false });
    });

    // Load the built React app
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));

    // Inject custom titlebar after page loads
    mainWindow.webContents.on('did-finish-load', () => {
        const titlebarScript = fs.readFileSync(path.join(__dirname, 'titlebar.js'), 'utf8');
        mainWindow.webContents.executeJavaScript(titlebarScript);
    });

    // Create application menu
    const menu = Menu.buildFromTemplate([
        {
            label: 'App',
            submenu: [
                { role: 'reload' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Always on Top',
                    type: 'checkbox',
                    checked: isAlwaysOnTop,
                    accelerator: 'CmdOrCtrl+T',
                    click: () => toggleAlwaysOnTop()
                },
                {
                    label: 'Full Screen',
                    accelerator: 'F11',
                    click: () => toggleFullScreen()
                },
                { type: 'separator' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { role: 'resetZoom' }
            ]
        }
    ]);
    Menu.setApplicationMenu(menu);

    // Register global shortcuts
    globalShortcut.register('CmdOrCtrl+T', toggleAlwaysOnTop);
    globalShortcut.register('F11', toggleFullScreen);
    globalShortcut.register('Escape', () => {
        if (mainWindow.isFullScreen()) {
            mainWindow.setFullScreen(false);
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function toggleAlwaysOnTop() {
    isAlwaysOnTop = !isAlwaysOnTop;
    mainWindow.setAlwaysOnTop(isAlwaysOnTop);

    // Update menu checkbox
    const menu = Menu.getApplicationMenu();
    const viewMenu = menu.items.find(item => item.label === 'View');
    const alwaysOnTopItem = viewMenu.submenu.items.find(item => item.label === 'Always on Top');
    alwaysOnTopItem.checked = isAlwaysOnTop;
}

function toggleFullScreen() {
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
}

// IPC handlers for renderer process
ipcMain.handle('toggle-always-on-top', () => {
    toggleAlwaysOnTop();
    return isAlwaysOnTop;
});

ipcMain.handle('toggle-fullscreen', () => {
    toggleFullScreen();
    return mainWindow.isFullScreen();
});

ipcMain.handle('get-window-state', () => ({
    isAlwaysOnTop,
    isFullScreen: mainWindow.isFullScreen(),
    isMaximized: mainWindow.isMaximized()
}));

ipcMain.handle('minimize-window', () => {
    mainWindow.minimize();
});

ipcMain.handle('maximize-window', () => {
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
    return mainWindow.isMaximized();
});

ipcMain.handle('close-window', () => {
    mainWindow.close();
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    globalShortcut.unregisterAll();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
