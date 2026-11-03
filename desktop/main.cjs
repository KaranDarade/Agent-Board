const { app, BrowserWindow, Tray, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow = null;
let tray = null;
let serverProcess = null;
let isQuitting = false;

const SERVER_PORT = 3001;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;

// Register custom deep link protocol (agentboard://)
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('agentboard', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('agentboard');
}

function handleDeepLinkUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return;
  try {
    if (urlStr.startsWith('agentboard://')) {
      const parsed = new URL(urlStr);
      const token = parsed.searchParams.get('token');
      if (token && mainWindow) {
        mainWindow.webContents.send('app:auth-token', { token });
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      }
    }
  } catch (err) {
    console.error('[Desktop] Deep link parse error:', err.message);
  }
}

// Enforce single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

app.on('second-instance', (event, commandLine) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
  // Windows: deep link argument in commandLine
  const deepLink = commandLine.find(arg => arg && arg.startsWith('agentboard://'));
  if (deepLink) {
    handleDeepLinkUrl(deepLink);
  }
});

app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLinkUrl(url);
});

// Check if local engine is already active on port 3001
function checkServerHealthy() {
  return new Promise((resolve) => {
    const req = http.get(`${SERVER_URL}/api/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Start internal Node backend if not already running
async function ensureServerRunning() {
  const isHealthy = await checkServerHealthy();
  if (isHealthy) {
    console.log('[Desktop] Connected to running Agent Board server on port', SERVER_PORT);
    return;
  }

  console.log('[Desktop] Starting internal Agent Board server...');
  try {
    const serverScript = path.join(__dirname, '..', 'server', 'index.js');
    await import(pathToFileURL(serverScript).href);
    console.log('[Desktop] Internal server initialized in-process.');
  } catch (importErr) {
    console.warn('[Desktop] In-process server import failed, falling back to process spawn:', importErr.message);
    try {
      const serverScript = path.join(__dirname, '..', 'server', 'index.js');
      serverProcess = spawn(process.execPath, [serverScript], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, PORT: String(SERVER_PORT), IS_DESKTOP: 'true', ELECTRON_RUN_AS_NODE: '1' },
        stdio: ['ignore', 'pipe', 'pipe']
      });
      serverProcess.stdout.on('data', (d) => console.log('[Server stdout]', d.toString()));
      serverProcess.stderr.on('data', (d) => console.error('[Server stderr]', d.toString()));
    } catch (spawnErr) {
      console.error('[Desktop] Failed to spawn fallback server process:', spawnErr.message);
    }
  }

  // Wait for server to become healthy
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 200));
    if (await checkServerHealthy()) {
      console.log('[Desktop] Server is now healthy.');
      return;
    }
  }
  console.warn('[Desktop] Server health check timed out. Attempting window load anyway.');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 840,
    minHeight: 600,
    title: 'Agent Board',
    backgroundColor: '#0b0f19',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true
    }
  });

  mainWindow.loadURL(SERVER_URL);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Minimize to tray on close unless quitting
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      if (tray) {
        tray.displayBalloon?.({
          title: 'Agent Board',
          content: 'Running in the background. Access from the system tray.'
        });
      }
    }
  });

  // Security: prevent unverified external navigation inside the webview
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url);
      if (parsed.origin !== SERVER_URL) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
    } catch (e) {}
    return { action: 'allow' };
  });
}

function createTray() {
  // Use a fallback empty or default icon in dev if asset is missing
  try {
    const iconPath = path.join(__dirname, '..', 'client', 'dist', 'favicon.ico');
    tray = new Tray(iconPath);
  } catch (e) {
    // If icon file is not yet available, skip tray
    return;
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Agent Board',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Check for Updates...',
      click: () => {
        checkForUpdates(true);
      }
    },
    {
      label: 'Restart Engine',
      click: async () => {
        if (serverProcess) {
          serverProcess.kill();
          serverProcess = null;
        }
        await ensureServerRunning();
        if (mainWindow) mainWindow.reload();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit Agent Board',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Agent Board — Universal AI Agent Command Center');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// In-App Auto-Update implementation
function checkForUpdates(manual = false) {
  if (!app.isPackaged) {
    if (manual && mainWindow) {
      mainWindow.webContents.send('app:update-status', {
        status: 'checking',
        message: 'Checking for updates...'
      });
      setTimeout(() => {
        mainWindow?.webContents.send('app:update-status', {
          status: 'latest',
          version: app.getVersion() || '1.0.0',
          message: `Agent Board is up to date (v${app.getVersion() || '1.0.0'}).`
        });
      }, 900);
    }
    return;
  }

  try {
    const { autoUpdater } = require('electron-updater');
    autoUpdater.autoDownload = true;

    autoUpdater.on('checking-for-update', () => {
      mainWindow?.webContents.send('app:update-status', { status: 'checking', message: 'Checking for updates...' });
    });

    autoUpdater.on('update-available', (info) => {
      mainWindow?.webContents.send('app:update-status', {
        status: 'available',
        version: info.version,
        message: `Version ${info.version} is available and downloading in background...`
      });
    });

    autoUpdater.on('download-progress', (progressObj) => {
      mainWindow?.webContents.send('app:update-progress', {
        percent: Math.round(progressObj.percent),
        bytesPerSecond: progressObj.bytesPerSecond,
        transferred: progressObj.transferred,
        total: progressObj.total
      });
    });

    autoUpdater.on('update-not-available', () => {
      if (manual) {
        mainWindow?.webContents.send('app:update-status', {
          status: 'latest',
          version: app.getVersion() || '1.0.0',
          message: `Agent Board is up to date (v${app.getVersion() || '1.0.0'}).`
        });
      }
    });

    autoUpdater.on('update-downloaded', (info) => {
      mainWindow?.webContents.send('app:update-status', {
        status: 'ready',
        version: info.version,
        message: `Version ${info.version} ready. Restart to apply update.`
      });
    });

    autoUpdater.on('error', (err) => {
      console.warn('[AutoUpdater Error]:', err.message);
      mainWindow?.webContents.send('app:update-status', {
        status: 'error',
        message: err.message || 'Error checking for updates'
      });
    });

    autoUpdater.checkForUpdatesAndNotify();
  } catch (err) {
    console.warn('Could not initialize auto-updater:', err.message);
  }
}

// IPC listeners from renderer
ipcMain.on('app:check-updates', () => {
  checkForUpdates(true);
});

ipcMain.on('app:install-update', () => {
  try {
    if (app.isPackaged) {
      const { autoUpdater } = require('electron-updater');
      isQuitting = true;
      autoUpdater.quitAndInstall();
    } else {
      console.log('[AutoUpdater] Development restart simulated.');
      app.relaunch();
      app.exit(0);
    }
  } catch (err) {
    console.error('[AutoUpdater] Install error:', err.message);
  }
});

ipcMain.on('app:simulate-update', () => {
  if (!mainWindow) return;
  mainWindow.webContents.send('app:update-status', { status: 'checking', message: 'Checking for updates...' });
  setTimeout(() => {
    mainWindow?.webContents.send('app:update-status', { status: 'available', version: '1.0.1', message: 'Version 1.0.1 available. Downloading update...' });
    let pct = 0;
    const interval = setInterval(() => {
      pct += 25;
      mainWindow?.webContents.send('app:update-progress', { percent: pct });
      if (pct >= 100) {
        clearInterval(interval);
        mainWindow?.webContents.send('app:update-status', { status: 'ready', version: '1.0.1', message: 'Version 1.0.1 ready. Restart to apply update.' });
      }
    }, 400);
  }, 800);
});

app.whenReady().then(async () => {
  await ensureServerRunning();
  createWindow();
  createTray();

  // Run update check in packaged app
  setTimeout(() => {
    checkForUpdates(false);
  }, 4000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  isQuitting = true;
  if (serverProcess) {
    try {
      serverProcess.kill();
      serverProcess = null;
    } catch (e) {}
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // If not quitting explicitly, keep running in background tray
    if (isQuitting) {
      app.quit();
    }
  }
});
