const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    toggleAlwaysOnTop: () => ipcRenderer.invoke('toggle-always-on-top'),
    toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
    getWindowState: () => ipcRenderer.invoke('get-window-state'),
    minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
    maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
    closeWindow: () => ipcRenderer.invoke('close-window'),
    onWindowStateChanged: (callback) => ipcRenderer.on('window-state-changed', (event, state) => callback(state)),
});
