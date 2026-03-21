const { app, BrowserWindow, globalShortcut, ipcMain, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

// ==================== LOAD .env.local ====================
function loadEnvFile() {
    const envPath = path.join(__dirname, '..', '.env.local');
    try {
        const content = fs.readFileSync(envPath, 'utf8');
        for (const line of content.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx === -1) continue;
            const key = trimmed.slice(0, eqIdx).trim();
            let value = trimmed.slice(eqIdx + 1).trim();
            // Strip surrounding quotes
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            // Always overwrite — .env.local takes priority
            process.env[key] = value;
        }
        console.log('[ENV] Loaded .env.local:', envPath);
    } catch (err) {
        console.warn('[ENV] .env.local not found:', envPath, err.message);
    }
}
loadEnvFile();

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

    // Load the app — dev server or built files
    const isDev = process.argv.includes('--dev');
    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    }

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

// ==================== RSS FETCH ====================
ipcMain.handle('fetch-rss', async (event, feedUrl) => {
    const RSS_HEADERS = {
        'User-Agent': 'Mozilla/5.0 (compatible; TraderJournal/1.0; RSS Reader)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    };

    const fetchWithRedirects = (targetUrl, maxRedirects = 5) => {
        return new Promise((resolve) => {
            if (maxRedirects <= 0) {
                resolve({ ok: false, error: 'Too many redirects' });
                return;
            }

            let parsedUrl;
            try {
                parsedUrl = new URL(targetUrl);
            } catch {
                resolve({ ok: false, error: `Invalid URL: ${targetUrl}` });
                return;
            }

            const lib = parsedUrl.protocol === 'https:' ? https : http;
            const request = lib.get(
                targetUrl,
                { headers: RSS_HEADERS, timeout: 15000 },
                (res) => {
                    // Handle redirects — resolve relative URLs against the original
                    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                        const resolvedUrl = new URL(res.headers.location, targetUrl).href;
                        res.resume(); // drain response body
                        fetchWithRedirects(resolvedUrl, maxRedirects - 1).then(resolve);
                        return;
                    }

                    if (res.statusCode !== 200) {
                        resolve({ ok: false, error: `HTTP ${res.statusCode}` });
                        return;
                    }

                    let data = '';
                    res.setEncoding('utf8');
                    res.on('data', (chunk) => { data += chunk; });
                    res.on('end', () => resolve({ ok: true, data }));
                    res.on('error', (err) => resolve({ ok: false, error: err.message }));
                }
            );

            request.on('error', (err) => resolve({ ok: false, error: err.message }));
            request.on('timeout', () => {
                request.destroy();
                resolve({ ok: false, error: 'Request timed out' });
            });
        });
    };

    return fetchWithRedirects(feedUrl);
});

// ==================== AI DISCUSS (OpenRouter) ====================
const AI_MODEL = 'google/gemini-2.5-flash';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

ipcMain.handle('ai-discuss', async (event, request) => {
    const apiKey = process.env.OPENROUTER_API_KEY ?? '';

    if (!apiKey) {
        return { ok: false, error: 'OPENROUTER_API_KEY not configured. Add it to .env.local' };
    }

    const { context, messages, fetchArticle } = request;

    // Optionally fetch article content
    let articleText = '';
    if (fetchArticle && context.url) {
        try {
            const fetchUrl = new URL(context.url);
            const lib = fetchUrl.protocol === 'https:' ? https : http;

            articleText = await new Promise((resolve) => {
                const req = lib.get(
                    context.url,
                    {
                        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TraderJournal/1.0)' },
                        timeout: 10000,
                    },
                    (res) => {
                        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                            const redirectUrl = new URL(res.headers.location, context.url).href;
                            const redirectLib = redirectUrl.startsWith('https:') ? https : http;
                            redirectLib.get(redirectUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 }, (rRes) => {
                                let data = '';
                                rRes.setEncoding('utf8');
                                rRes.on('data', (chunk) => { data += chunk; });
                                rRes.on('end', () => resolve(data));
                                rRes.on('error', () => resolve(''));
                            }).on('error', () => resolve(''));
                            res.resume();
                            return;
                        }
                        let data = '';
                        res.setEncoding('utf8');
                        res.on('data', (chunk) => { data += chunk; });
                        res.on('end', () => resolve(data));
                        res.on('error', () => resolve(''));
                    }
                );
                req.on('error', () => resolve(''));
                req.on('timeout', () => { req.destroy(); resolve(''); });
            });

            if (articleText) {
                articleText = articleText
                    .replace(/<script[\s\S]*?<\/script>/gi, '')
                    .replace(/<style[\s\S]*?<\/style>/gi, '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .slice(0, 8000);
            }
        } catch {
            // continue without article
        }
    }

    // Build system message
    const metaStr = context.meta
        ? Object.entries(context.meta).map(([k, v]) => `${k}: ${v}`).join('\n')
        : '';

    const systemMessage = `You are a senior financial analyst AI assistant in a Trader Journal desktop app.
The user wants to discuss a ${context.type === 'calendar' ? 'economic calendar event' : 'financial news article'}.

# Context
- **Title:** ${context.title}
- **Source:** ${context.source}
- **Description:** ${context.description}
${metaStr ? `- **Details:**\n${metaStr}` : ''}
${articleText ? `\n# Full article text\n${articleText}` : ''}

# Response rules
1. **Language:** Always respond in the same language the user writes in (Russian or English)
2. **Formatting:** ALWAYS use rich Markdown formatting in your responses:
   - Use **bold** for key terms, numbers, asset names, and important conclusions
   - Use bullet lists and numbered lists for structured information
   - Use headings (## or ###) to separate sections when the response is long
   - Use \`code\` for ticker symbols, currency pairs (e.g. \`EUR/USD\`, \`S&P 500\`)
   - Use > blockquotes for citing article text
   - Use --- separators between logical sections
3. **Content focus:**
   - Lead with the key takeaway in **bold**
   - Analyze market impact: which assets, sectors, currencies are affected
   - Provide actionable trading implications
   - When article text is available, reference and quote specific details
   - Include relevant context: historical precedents, related events
4. **Tone:** Professional, concise, data-driven. No fluff.`;

    // OpenAI-compatible messages
    const apiMessages = [
        { role: 'system', content: systemMessage },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    try {
        const postData = JSON.stringify({
            model: AI_MODEL,
            messages: apiMessages,
            max_tokens: 2048,
            temperature: 0.7,
        });

        const result = await new Promise((resolve) => {
            const parsedUrl = new URL(OPENROUTER_URL);
            const req = https.request(
                {
                    hostname: parsedUrl.hostname,
                    path: parsedUrl.pathname,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                        'X-Title': 'Trader Journal',
                        'Content-Length': Buffer.byteLength(postData),
                    },
                    timeout: 30000,
                },
                (res) => {
                    let data = '';
                    res.setEncoding('utf8');
                    res.on('data', (chunk) => { data += chunk; });
                    res.on('end', () => {
                        try {
                            const parsed = JSON.parse(data);
                            if (res.statusCode !== 200) {
                                resolve({ ok: false, error: `OpenRouter ${res.statusCode}: ${parsed.error?.message ?? data}` });
                                return;
                            }
                            const text = parsed.choices?.[0]?.message?.content ?? '';
                            resolve({ ok: true, data: text });
                        } catch {
                            resolve({ ok: false, error: `Failed to parse response: ${data.slice(0, 200)}` });
                        }
                    });
                    res.on('error', (err) => resolve({ ok: false, error: err.message }));
                }
            );
            req.on('error', (err) => resolve({ ok: false, error: err.message }));
            req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'Request timed out' }); });
            req.write(postData);
            req.end();
        });

        return result;
    } catch (err) {
        return { ok: false, error: err.message ?? 'AI request failed' };
    }
});

// ==================== OPEN EXTERNAL URL ====================
ipcMain.handle('open-external', async (event, url) => {
    await shell.openExternal(url);
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
