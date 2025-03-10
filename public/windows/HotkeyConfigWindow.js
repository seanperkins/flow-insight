const { BrowserWindow } = require("electron"),
  log = require("electron-log"),
  Util = require("../Util"),
  ViewManagerHelper = require("../managers/ViewManagerHelper"),
  WindowManagerHelper = require("../managers/WindowManagerHelper"),
  EventFactory = require("../events/EventFactory");

/**
 * A small floating window for configuring hotkey mappings. Draggable around the screen, and detached from the console.
 * Can only open one windows of this type.
 */
module.exports = class HotkeyConfigWindow {
  constructor(windowName, arg) {
    this.arg = arg;
    this.name = windowName;
    this.view = ViewManagerHelper.ViewNames.HOTKEY;
    this.url = global.App.WindowManager.getWindowViewURL(
      this.view,
      arg
    );
    this.icon = Util.getAppIcon("icon.ico");
    this.display = global.App.WindowManager.getDisplay();
    this.autoShow = true;
    this.width = Math.floor(this.display.workAreaSize.width * 0.25);
    this.height = Math.floor((this.display.workAreaSize.height / 2) * 0.6);
    this.window = new BrowserWindow({
      titleBarStyle: "customButtonsOnHover",
      name: this.name,
      width: this.width,
      height: this.height,
      x: Math.floor(this.display.workAreaSize.width /2 - this.width/2),
      y: Math.floor(this.display.workAreaSize.height / 2 - this.height/2 - 100),
      resizable: false,
      movable: true,
      frame: false,
      show: false,
      icon: this.icon,
      backgroundColor: "#1B1C1D",
      fullscreenable: false,
      webPreferences: {
        toolbar: false,
        nodeIntegration: true,
        contextIsolation: false,
      },
    });
    this.window.name = this.name;
    this.window.setMenu(null);
    this.window.on("show", () => this.onShowCb());
    this.window.on("closed", () => this.onClosedCb());
    // this.events = {
    //   shown: EventFactory.createEvent(
    //     EventFactory.Types.WINDOW_CHART_SHOWN,
    //     this
    //   ),
    //   closed: EventFactory.createEvent(
    //     EventFactory.Types.WINDOW_CHART_CLOSED,
    //     this
    //   ),
    // };
  }

  onShowCb() {
    log.info("[HotkeyConfigWindow] opened window");
  }

  onClosedCb() {
    log.info("[HotkeyConfigWindow] closed window");
  }
};
