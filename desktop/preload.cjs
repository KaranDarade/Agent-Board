const { contextBridge, ipcRenderer, shell } = require('electron');

// Secure context bridge for Agent Board Desktop
contextBridge.exposeInMainWorld('agentBoardDesktop', {
  isDesktop: true,
  platform: process.platform,
  
  // Safely open links in user's external default browser
  openExternal: (url) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        shell.openExternal(url);
      }
    } catch (e) {
      console.error('Invalid URL:', url);
    }
  },

  // Auto-update controls
  checkForUpdates: () => ipcRenderer.send('app:check-updates'),
  onUpdateStatus: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('app:update-status', handler);
    return () => ipcRenderer.removeListener('app:update-status', handler);
  }
});
