const { BrowserWindow } = require("electron"),
  log = require("electron-log"),
  Util = require("../Util"),
  ViewManagerHelper = require("../managers/ViewManagerHelper"),
  WindowManagerHelper = require("../managers/WindowManagerHelper"),
  EventFactory = require("../managers/EventFactory");

/*
 * The Application loading window. Loads LoadingView class. This window
 * is always show when the application first loads
 */
module.exports = class ActivatorWindow {
  constructor() {
    this.name = WindowManagerHelper.WindowNames.ACTIVATOR;
    this.view = ViewManagerHelper.ViewNames.ACTIVATOR;
    this.url = global.App.WindowManager.getWindowViewURL(this.view);
    this.icon = Util.getAppIcon("icon.ico");
    this.autoShow = true;
    this.activatorFinished = false;
    this.window = new BrowserWindow({
      name: this.name,
      width: 600,
      height: 340,
      minWidth: 600,
      minHeight: 340,
      resizable: false,
      movable: true,
      center: true,
      frame: true,
      show: false,
      icon: this.icon,
      backgroundColor: "#000000",
      fullscreenable: false,
      webPreferences: { toolbar: false }
    });
    this.window.name = this.name;
    this.window.setMenu(null);
    this.window.on("closed", () => this.onClosedCb());

    //
    // TODO move datastoreload and datastoreloaded into datamanager class
    //
    this.events = {
      dataStoreLoad: EventFactory.createEvent(
        EventFactory.Types.DATASTORE_LOAD,
        this,
        (event, arg) => {
          console.log("DATASTORE_LOAD");
          console.log(arg);
          arg.timestamp = new Date().getTime();
          arg.data = {
            status: "VALID",
            message: "Your account has been successfully activated.",
            email: "kara@dreamscale.io",
            apiKey: "FASFD423fsfd32d2322d"
          };
          console.log("DATASTORE_LOAD_RESPONSE");
          console.log(arg);
          this.events.dataStoreLoaded.dispatch(arg);
        }
      ),
      dataStoreLoaded: EventFactory.createEvent(
        EventFactory.Types.DATASTORE_LOADED,
        this
      ),
      closeActivator: EventFactory.createEvent(
        EventFactory.Types.WINDOW_ACTIVATOR_CLOSE,
        this,
        (event, arg) => this.onActivatorCloseCb(event, arg)
      )
    };
  }

  onClosedCb() {
    if (!this.activatorFinished) {
      log.info("[ActivatorWindow] closed window -> quit application");
      global.App.quit();
    } else {
      log.info("[ActivatorWindow] closed window -> load application");
    }
  }

  onActivatorCloseCb(event, arg) {
    this.activatorFinished = true;
    global.App.WindowManager.closeWindow(this, true);
  }
};
