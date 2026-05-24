const { app, BrowserWindow, protocol, net } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

// Register the custom scheme 'app' as privileged
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }
]);

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      webSecurity: true, // Enabled web security strictly for production safety
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load from secure custom origin instead of file://
  mainWindow.loadURL('app://hub/index.html');
}

app.whenReady().then(() => {
  // Set up protocol handler to serve built assets from dist directory
  protocol.handle('app', (request) => {
    const relativeUrl = request.url.replace('app://hub/', '');
    const cleanPath = relativeUrl.split('?')[0].split('#')[0];
    const filePath = path.join(__dirname, 'dist', cleanPath);
    return net.fetch(pathToFileURL(filePath).toString());
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

