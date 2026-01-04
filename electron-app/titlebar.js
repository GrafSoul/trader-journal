// Custom titlebar injection for Electron
(function () {
    const titlebarHTML = `
    <div id="electron-titlebar">
      <div class="titlebar-drag">
        <span class="titlebar-title">Trader Journal</span>
      </div>
      <div class="titlebar-controls">
        <button class="titlebar-btn titlebar-pin" id="btn-pin" title="Always on Top (Ctrl+T)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v10m0 0l-4-4m4 4l4-4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/>
          </svg>
        </button>
        <button class="titlebar-btn" id="btn-minimize" title="Minimize">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        <button class="titlebar-btn" id="btn-maximize" title="Maximize">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="4" y="4" width="16" height="16" rx="2"/>
          </svg>
        </button>
        <button class="titlebar-btn titlebar-close" id="btn-close" title="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="6" y1="6" x2="18" y2="18"/>
            <line x1="6" y1="18" x2="18" y2="6"/>
          </svg>
        </button>
      </div>
    </div>
  `;

    const titlebarCSS = `
    #electron-titlebar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 36px;
      background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 99999;
      border-bottom: 1px solid #334155;
      user-select: none;
    }
    .titlebar-drag {
      flex: 1;
      height: 100%;
      display: flex;
      align-items: center;
      padding-left: 12px;
      -webkit-app-region: drag;
    }
    .titlebar-title {
      color: #94a3b8;
      font-size: 13px;
      font-weight: 500;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .titlebar-controls {
      display: flex;
      height: 100%;
      -webkit-app-region: no-drag;
    }
    .titlebar-btn {
      width: 46px;
      height: 100%;
      border: none;
      background: transparent;
      color: #94a3b8;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, color 0.15s;
    }
    .titlebar-btn:hover {
      background: #334155;
      color: #f1f5f9;
    }
    .titlebar-btn.titlebar-close:hover {
      background: #dc2626;
      color: white;
    }
    .titlebar-btn.titlebar-pin.active {
      background: #3b82f6;
      color: white;
    }
    .titlebar-btn.titlebar-pin.active:hover {
      background: #2563eb;
    }
    body {
      padding-top: 36px !important;
      box-sizing: border-box;
    }
    #root {
      height: calc(100vh - 36px) !important;
      overflow: hidden !important;
    }
  `;

    // Inject CSS
    const style = document.createElement('style');
    style.textContent = titlebarCSS;
    document.head.appendChild(style);

    // Inject titlebar HTML
    const titlebar = document.createElement('div');
    titlebar.innerHTML = titlebarHTML;
    document.body.insertBefore(titlebar.firstElementChild, document.body.firstChild);

    // Wire up buttons
    const btnPin = document.getElementById('btn-pin');
    const btnMinimize = document.getElementById('btn-minimize');
    const btnMaximize = document.getElementById('btn-maximize');
    const btnClose = document.getElementById('btn-close');

    if (window.electronAPI) {
        btnPin.addEventListener('click', async () => {
            const isOnTop = await window.electronAPI.toggleAlwaysOnTop();
            btnPin.classList.toggle('active', isOnTop);
        });

        btnMinimize.addEventListener('click', () => {
            window.electronAPI.minimizeWindow();
        });

        btnMaximize.addEventListener('click', () => {
            window.electronAPI.maximizeWindow();
        });

        btnClose.addEventListener('click', () => {
            window.electronAPI.closeWindow();
        });

        // Update maximize button icon on state change
        window.electronAPI.onWindowStateChanged((state) => {
            if (state.isMaximized) {
                btnMaximize.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="6" y="6" width="12" height="12" rx="1"/>
            <path d="M8 6V5a1 1 0 011-1h10a1 1 0 011 1v10a1 1 0 01-1 1h-1"/>
          </svg>
        `;
            } else {
                btnMaximize.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="4" y="4" width="16" height="16" rx="2"/>
          </svg>
        `;
            }
        });

        // Init state
        window.electronAPI.getWindowState().then((state) => {
            btnPin.classList.toggle('active', state.isAlwaysOnTop);
        });
    }
})();
