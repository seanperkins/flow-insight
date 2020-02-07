import { SidePanelViewController } from "./SidePanelViewController";
import { MainPanelViewController } from "./MainPanelViewController";
import { ConsoleViewController } from "./ConsoleViewController";
import { ResourceCircuitController } from "./ResourceCircuitController";
import { BrowserController } from "./BrowserController";

/**
 * generates view controllers for components
 * @author ZoeDreams
 */
export class ActiveViewControllerFactory {
  /**
   * an array of views store as a cluttered object list in memory
   * @type {{}}
   */
  static viewsByName = {};

  /**
   * the views of the gui that have controllers
   * @returns {{RESOURCE_PANEL: string, MAIN_PANEL: string, CONSOLE_PANEL: string, SIDE_PANEL: string}}
   * @constructor
   */
  static get Views() {
    return {
      RESOURCE_PANEL: "resource-panel",
      SIDE_PANEL: "side-panel",
      MAIN_PANEL: "main-panel",
      CONSOLE_PANEL: "console-panel",
      BROWSER_PANEL: "browser-panel"
    };
  }

  /**
   * helper function to create a new view controller
   * @param name - the name of the controller to load
   * @param scope - the given scope
   * @returns {*} - the controller instance
   */
  static getViewController(name, scope) {
    return ActiveViewControllerFactory._findOrCreateViewController(name, scope);
  }

  /**
   * looks up the controller in a static array of this class
   * @param name
   * @param scope
   * @returns {*}
   */
  static _findOrCreateViewController(name, scope) {
    let ctlr;
    if (ActiveViewControllerFactory.viewsByName[name] != null) {
      ctlr = ActiveViewControllerFactory.viewsByName[name];
    } else {
      ctlr = ActiveViewControllerFactory.initializeNewViewController(
        name,
        scope
      );
      ActiveViewControllerFactory.viewsByName[name] = ctlr;
    }
    return ctlr;
  }

  /**
   * creates a new initialized controller with the given scope
   * @param name - the name of the controller
   * @param scope - the given scope to create in
   * @returns {ConsoleViewController|ResourceCircuitController|MainPanelViewController|null|SidePanelViewController}
   */
  static initializeNewViewController(name, scope) {
    switch (name) {
      case ActiveViewControllerFactory.Views.RESOURCE_PANEL:
        return new ResourceCircuitController(scope);
      case ActiveViewControllerFactory.Views.SIDE_PANEL:
        return new SidePanelViewController(scope);
      case ActiveViewControllerFactory.Views.MAIN_PANEL:
        return new MainPanelViewController(scope);
      case ActiveViewControllerFactory.Views.CONSOLE_PANEL:
        return new ConsoleViewController(scope);
      case ActiveViewControllerFactory.Views.BROWSER_PANEL:
        return new BrowserController(scope);
      default:
        return null;
    }
  }
}
