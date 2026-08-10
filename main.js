const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const https = require("https");

app.commandLine.appendSwitch("no-sandbox");

let win;
let offline = false;


function pingServer() {
  return new Promise((resolve) => {
    const req = https.get("https://chatsec.pl/", (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });

    req.on("error", () => {
      resolve(false);
    });

    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function showOffline() {
  if (!offline) {
    offline = true;
    win.loadFile(path.join(__dirname, "connection_error.html"));
  }
}

function showOnline() {
  if (offline) {
    offline = false;
    win.loadURL("https://chatsec.pl");
  }
}

function startConnectionMonitor() {
  setInterval(async () => {
    const online = await pingServer();

    if (online) {
      showOnline();
    } else {
      showOffline();
    }
  }, 10000);
}

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 400,
    minHeight: 600,
    autoHideMenuBar: true,
    backgroundColor: "#0b0d11",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadURL("https://chatsec.pl");

  win.webContents.on("did-fail-load", () => {
    showOffline();
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith("https://chatsec.pl")) {
      shell.openExternal(url);
    }

    return { action: "deny" };
  });

  startConnectionMonitor();
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
