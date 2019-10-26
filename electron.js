const { app, BrowserWindow, powerSaveBlocker  } = require('electron');
const { autoUpdater } = require("electron-updater");
const { join } = require('path');
const { format } = require('url');

powerSaveBlocker.start('prevent-app-suspension');

let browserWindow;

let interval;

autoUpdater.on("update-available", () => {
  clearInterval(interval);
});

autoUpdater.on("update-downloaded", () => {
  autoUpdater.quitAndInstall();
});

function startAutoUpdate() {
  interval = setInterval(() => {
    autoUpdater.checkForUpdates();
  }, 60 * 60 * 1000);
  autoUpdater.checkForUpdates();
}


function createWindow() {
  browserWindow = new BrowserWindow({
    title: 'SEMI REST',
    // icon: join(__dirname, 'assets/icon.png'),
    fullscreen: true,
    show: false
  });
  browserWindow.loadURL(format({
    pathname: join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));
  browserWindow.once('ready-to-show', () => {
    browserWindow.show();
  });
  browserWindow.on('closed', () => {
    browserWindow = null;
  });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (browserWindow) {
      if (browserWindow.isMinimized()) {
        browserWindow.restore();
      }
      browserWindow.focus();
    }
  });
  app.on('ready', () => {
    createWindow();
    startAutoUpdate();
  });
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
  app.on('activate', () => {
    if (browserWindow === null) {
      createWindow();
    }
  });
}

process.on('uncaughtException', () => { });
