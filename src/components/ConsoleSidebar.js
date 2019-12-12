import React, { Component } from "react";
import { Icon, Divider, Menu } from "semantic-ui-react";
import { ActiveViewControllerFactory } from "../perspective/ActiveViewControllerFactory";
import { SidePanelViewController } from "../perspective/SidePanelViewController";

//
// this component is the sidebar to the console. This animates a slide.
//
export default class ConsoleSidebar extends Component {
  constructor(props) {
    super(props);
    this.name = "[ConsoleSidebar]";

    this.state = {
      activeItem: SidePanelViewController.MenuSelection.PROFILE,
      iconProfile: "heart",
      iconMessages: "user outline",
      iconNotifications: "bell outline"
    };

    this.myController = ActiveViewControllerFactory.createViewController(
      ActiveViewControllerFactory.Views.SIDE_PANEL
    );
  }

  componentDidMount = () => {
    this.myController.configureMenuListener(
      this,
      this.onRefreshActivePerspective
    );
  };

  componentWillUnmount = () => {
    this.myController.configureMenuListener(this, null);
  };

  onRefreshActivePerspective() {
    console.log(this.name + " - onRefreshActivePerspective!");

    let activeMenuItem = this.myController.activeMenuSelection;

    let state = {
      activeItem: activeMenuItem,
      iconProfile: "heart",
      iconMessages: "user",
      iconNotifications: "bell"
    };
    switch (activeMenuItem) {
      case SidePanelViewController.MenuSelection.PROFILE:
        state.iconMessages += " outline";
        state.iconNotifications += " outline";
        break;
      case SidePanelViewController.MenuSelection.MESSAGES:
        state.iconProfile += " outline";
        state.iconNotifications += " outline";
        break;
      case SidePanelViewController.MenuSelection.NOTIFICATIONS:
        state.iconProfile += " outline";
        state.iconMessages += " outline";
        break;
      case SidePanelViewController.MenuSelection.NONE:
        state.iconProfile += " outline";
        state.iconMessages += " outline";
        state.iconNotifications += " outline";
        break;

      default:
        break;
    }
    this.setState(state);
  }

  /// performs a simple calculation for dynamic height of menu
  calculateMenuHeight() {
    let heights = {
      rootBorder: 2,
      bottomMenuHeight: 28
    };

    return window.innerHeight - heights.rootBorder - heights.bottomMenuHeight;
  }

  deselectItem = name => {
    this.myController.hidePanel();
  };

  selectItem = name => {
    this.myController.showPanel(name);
  };

  handleItemClick = (e, { name }) => {
    if (this.state.activeItem === name) {
      this.deselectItem(name);
    } else {
      this.selectItem(name);
    }
  };

  /// renders the sidebar of the console view
  render() {
    const { activeItem } = this.state;

    return (
      <div id="component" className="consoleSidebar">
        {/*<Divider clearing />*/}
        <Menu
          inverted
          icon
          vertical
          style={{ height: this.calculateMenuHeight() }}
        >
          <Menu.Item
            name={SidePanelViewController.MenuSelection.PROFILE}
            active={
              activeItem === SidePanelViewController.MenuSelection.PROFILE
            }
            onClick={this.handleItemClick}
          >
            <Icon name={this.state.iconProfile}>
              {/*<Label color="red" floating size="mini">*/}
              {/*  !*/}
              {/*</Label>*/}
            </Icon>
          </Menu.Item>
          <Menu.Item
            name={SidePanelViewController.MenuSelection.MESSAGES}
            active={
              activeItem === SidePanelViewController.MenuSelection.MESSAGES
            }
            onClick={this.handleItemClick}
          >
            <Icon name={this.state.iconMessages}>
              {/*<Label color="red" floating size="mini">*/}
              {/*  7*/}
              {/*</Label>*/}
            </Icon>
          </Menu.Item>
          <Menu.Item
            name={SidePanelViewController.MenuSelection.NOTIFICATIONS}
            active={
              activeItem === SidePanelViewController.MenuSelection.NOTIFICATIONS
            }
            onClick={this.handleItemClick}
            disabled
          >
            <Icon name={this.state.iconNotifications}>
              {/*<Label color="red" floating size="mini">*/}
              {/*  23*/}
              {/*</Label>*/}
            </Icon>
          </Menu.Item>
        </Menu>
      </div>
    );
  }
}
