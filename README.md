# Minecraft-Optimizer

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const CurseForgeAPI = require('./curseforge-api');
const { ModOptimizer } = require('./mod-optimizer');

let mainWindow;
let curseForgeAPI;
let modOptimizer;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile('index.html');
}

// IPC handlers
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.filePaths[0];
});

ipcMain.handle('set-api-key', async (event, apiKey) => {
  try {
    curseForgeAPI = new CurseForgeAPI(apiKey);
    modOptimizer = new ModOptimizer(curseForgeAPI);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-minecraft-versions', async () => {
  try {
    if (!curseForgeAPI) {
      throw new Error('API key not set');
    }
    const versions = await curseForgeAPI.getMinecraftVersions();
    return { success: true, data: versions };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('optimize-minecraft', async (event, { minecraftPath, gameVersion, modLoader }) => {
  try {
    if (!modOptimizer) {
      throw new Error('API key not set');
    }

    const compatibleMods = await modOptimizer.findCompatibleMods(gameVersion, modLoader);
    const downloadResults = await modOptimizer.downloadMods(compatibleMods, minecraftPath);
    
    return { success: true, data: downloadResults };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
