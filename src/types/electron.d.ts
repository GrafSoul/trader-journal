// ==================== ELECTRON API TYPES ====================

export interface FetchRssResult {
  ok: boolean;
  data?: string;
  error?: string;
}

export interface ElectronAPI {
  // Window controls
  toggleAlwaysOnTop: () => Promise<boolean>;
  toggleFullscreen: () => Promise<boolean>;
  getWindowState: () => Promise<{
    isAlwaysOnTop: boolean;
    isFullScreen: boolean;
    isMaximized: boolean;
  }>;
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<boolean>;
  closeWindow: () => Promise<void>;
  onWindowStateChanged: (
    callback: (state: { isMaximized: boolean }) => void
  ) => void;
  // News
  fetchRss: (url: string) => Promise<FetchRssResult>;
  openExternal: (url: string) => Promise<void>;
  // AI
  aiDiscuss: (request: import("./ai").AiDiscussRequest) => Promise<FetchRssResult>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
