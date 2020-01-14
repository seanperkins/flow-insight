let settings = require("electron-settings"),
  log = require("electron-log"),
  fs = require("fs"),
  crypto = require("crypto-js"),
  Util = require("../Util"),
  AppError = require("./AppError");

/**
 * Application class used to manage our settings stores in ~/.flow
 * @class AppSettings
 * @type {module.App.AppSettings}
 */
module.exports = class AppSettings {
  /**
   * Represent a group of Settings
   * @constructor
   */
  constructor() {
    let flowPath = this.getOrCreateFlowHomeDir();
    let path = Util.getAppSettingsPath();
    log.info("[AppSettings] set paths", flowPath, path);
    settings.setPath(path);
    this.path = settings.file();

    // TODO implement this to store the key https://stackoverflow.com/questions/6226189/how-to-convert-a-string-to-bytearray

    this.keyToken = "70rCh13 L0v3";
    log.info("[AppSettings] load settings -> " + this.path);
  }

  /**
   * Verifies the path of the settings
   * @returns {boolean}
   */
  check() {
    let path = Util.getAppSettingsPath();
    log.info("[AppSettings] check path -> " + path);
    if (fs.existsSync(path)) {
      log.info("[AppSettings] has settings -> true");
      return true;
    }
    log.info("[AppSettings] has settings -> false");
    return false;
  }

  /**
   * sets and encrypts the api key that is set by the activator
   * @param apiUrl
   * @param apiKey
   */
  save(apiUrl, apiKey) {
    apiKey = crypto.AES.encrypt(apiKey, this.keyToken).toString();

    log.info("[AppSettings] save api key and url", apiUrl, apiKey);
    settings.set(AppSettings.Keys.APP_API_URL, apiUrl);
    settings.set(AppSettings.Keys.APP_API_KEY, apiKey);
    this.exportApiKey();
  }

  /**
   * exports the decrypted api key to a file that the application activator creates.
   * @param callback
   */
  exportApiKey(callback) {
    let path = Util.getApiKeyPath();

    log.info("[AppSettings] write api key file", path);
    fs.writeFileSync(path, this.getApiKey());
  }

  /**
   * gets the .flow directory in the users directory, or creates it if it doesn't exist
   * @returns {*}
   */
  getOrCreateFlowHomeDir() {
    let path = Util.getFlowHomePath();

    try {
      fs.accessSync(path, fs.constants.R_OK | fs.constants.W_OK);
    } catch (err) {
      fs.mkdirSync(path);
    }
    return path;
  }

  /**
   * decrypts and returns the stored api key in settings
   * @returns {string|null}
   */
  getApiKey() {
    log.info("[AppSettings] get api key");
    let key = settings.get(AppSettings.Keys.APP_API_KEY);
    if (key) {
      let bytes = crypto.AES.decrypt(key, this.keyToken);
      return bytes.toString(crypto.enc.Utf8);
    }
    return null;
  }

  getDisplayIndex() {
    return settings.get(AppSettings.Keys.DISPLAY_INDEX);
  }

  setDisplayIndex(index) {
    settings.set(AppSettings.Keys.DISPLAY_INDEX, index);
  }

  /**
   * enum map of possible settings key pairs
   * @returns {{APP_API_KEY: string}}
   * @constructor
   */
  static get Keys() {
    return {
      APP_API_URL: "apiUrl",
      APP_API_KEY: "apiKey",
      DISPLAY_INDEX: "displayIndex"
    };
  }
};
