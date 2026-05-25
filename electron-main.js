const { app, BrowserWindow, protocol, net, session } = require('electron');
const path = require('path');
const fs = require('fs');
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

// Helper to get clean, safe filenames for TTS caching
function getTtsFilename(text) {
  const clean = text.trim().toLowerCase();
  if (/^[a-z]{1,30}$/.test(clean)) {
    return `${clean}.mp3`;
  }
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  return `sentence_${Math.abs(hash)}.mp3`;
}

app.whenReady().then(() => {
  // Ensure the local caching folder exists in the app data directory
  const ttsCacheDir = path.join(app.getPath('userData'), 'tts_cache');
  if (!fs.existsSync(ttsCacheDir)) {
    fs.mkdirSync(ttsCacheDir, { recursive: true });
  }

  // Modify headers to allow Google Translate TTS to work perfectly in Electron without 403 Forbidden
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['https://translate.google.com/*'] },
    (details, callback) => {
      details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      details.requestHeaders['Referer'] = 'https://translate.google.com/';
      delete details.requestHeaders['Origin'];
      callback({ cancel: false, requestHeaders: details.requestHeaders });
    }
  );

  // Set up protocol handler to serve built assets and dynamic local caching TTS streams
  protocol.handle('app', async (request) => {
    const urlObj = new URL(request.url);
    if (urlObj.pathname === '/tts') {
      try {
        const text = urlObj.searchParams.get('text') || '';
        if (!text) {
          return new Response('No text provided', { status: 400 });
        }

        const filename = getTtsFilename(text);
        const cachedFilePath = path.join(ttsCacheDir, filename);

        if (fs.existsSync(cachedFilePath)) {
          return net.fetch(pathToFileURL(cachedFilePath).toString());
        }

        // Cache miss: Stream from Google Translate Web-TTS API using Node fetch
        const encodedText = encodeURIComponent(text);
        const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodedText}`;

        const response = await fetch(googleTtsUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://translate.google.com/'
          }
        });

        if (!response.ok) {
          throw new Error(`Google TTS request failed: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await fs.promises.writeFile(cachedFilePath, buffer);

        return net.fetch(pathToFileURL(cachedFilePath).toString());
      } catch (err) {
        console.error("Local TTS proxy failure:", err);
        return new Response('TTS proxy offline compilation failure', { status: 500 });
      }
    }

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

