const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      // Disable web security strictly to allow local ES modules to run via file:// protocol
      // Since this app only loads local files, this is acceptable.
      webSecurity: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // The build.js script copies everything to dist, so we load from there
  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
