const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Window controls
    toggleAlwaysOnTop: () => ipcRenderer.invoke('toggle-always-on-top'),
    toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
    getWindowState: () => ipcRenderer.invoke('get-window-state'),
    minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
    maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
    closeWindow: () => ipcRenderer.invoke('close-window'),
    onWindowStateChanged: (callback) => ipcRenderer.on('window-state-changed', (event, state) => callback(state)),
    // News
    fetchRss: (url) => ipcRenderer.invoke('fetch-rss', url),
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    // AI
    aiDiscuss: (request) => ipcRenderer.invoke('ai-discuss', request),
});
