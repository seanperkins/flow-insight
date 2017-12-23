import React, { Component } from "react";
import ConsoleContent from "./ConsoleContent";
import ConsoleMenu from "./ConsoleMenu";

/*
 * this component is the tab panel wrapper for the console content
 */
export default class ConsoleLayout extends Component {
  constructor(props) {
    super(props);
  }

  /*
   * renders the tab component of the console view
   */
  render() {
    return (
      <div id="component" className="consoleLayout">
        <div id="wrapper" className="consoleContent">
          <ConsoleContent />
        </div>
        <div id="wrapper" className="consoleMenu">
          <ConsoleMenu />
        </div>
      </div>
    );
  }
}
