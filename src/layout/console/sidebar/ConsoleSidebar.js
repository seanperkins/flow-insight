import React, {Component} from "react";
import {Divider, Icon, Menu, Popup,} from "semantic-ui-react";
import {RendererControllerFactory} from "../../../controllers/RendererControllerFactory";
import {SidePanelViewController} from "../../../controllers/SidePanelViewController";
import {DimensionController} from "../../../controllers/DimensionController";
import {RendererEventFactory} from "../../../events/RendererEventFactory";
import {BaseClient} from "../../../clients/BaseClient";
import {MemberClient} from "../../../clients/MemberClient";
import {NotificationClient} from "../../../clients/NotificationClient";

/**
 * this component is the sidebar to the console. This animates a slide.
 * @type{ConsoleSidebar}
 */
export default class ConsoleSidebar extends Component {
  /**
   * the class name of our root console side bar component
   * @type {string}
   */
  static className = "consoleSidebar";

  /**
   * the class name of our alarm menu item
   * @type {string}
   */
  static alarmClassName = "alarm";

  /**
   * builds the console sidebar and panel with given properties
   * @param props
   */
  constructor(props) {
    super(props);
    this.name = "[ConsoleSidebar]";
    this.xpTimer = null;
    this.state = {
      isAlarm: false,
      isXPUpdate: false,
      xpUpdateAmount: 0,
      unreadNotificationCount: 0,
      activeItem:
        SidePanelViewController.MenuSelection.TEAM,
      iconFervie: "heart outline",
      iconTeam: "home",
      iconWTF: "lightning",
      iconCircuit: "shuffle",
      iconNotifications: "bell outline",
      iconDashboard: "chart line",
    };
    this.myController =
      RendererControllerFactory.getViewController(
        RendererControllerFactory.Views.CONSOLE_SIDEBAR
      );

    this.talkRoomMessageListener =
      RendererEventFactory.createEvent(
        RendererEventFactory.Events.TALK_MESSAGE_ROOM,
        this,
        this.onTalkRoomMessage
      );

    this.meDataRefreshListener =
      RendererEventFactory.createEvent(
        RendererEventFactory.Events.ME_DATA_REFRESH,
        this,
        this.onMeRefresh
      );

    this.notificationReadUpdate =
      RendererEventFactory.createEvent(
        RendererEventFactory.Events
          .VIEW_CONSOLE_NOTIFICATION_READ_UPDATE,
        this,
        this.onNotificationReadUpdate
      );

    this.refreshNotificationsListener =
      RendererEventFactory.createEvent(
        RendererEventFactory.Events
          .NOTIFICATION_DATA_REFRESH,
        this,
        this.refreshNotificationStatus
      );
  }

  /**
   * called when the sidebar is created in the view and will render
   */
  componentDidMount() {
    this.myController.configurePulseListener(
      this,
      this.onPulse
    );
    this.myController.configureHeartbeatListener(
      this,
      this.onHeartbeat
    );
    this.myController.configureMenuListener(
      this,
      this.onRefresh
    );
    this.myController.configureSidebarShowListener(
      this,
      this.onSidebarShow
    );

    this.circuitStartStopListener =
      RendererEventFactory.createEvent(
        RendererEventFactory.Events
          .VIEW_CONSOLE_CIRCUIT_START_STOP,
        this,
        this.onCircuitStartStop
      );
    this.circuitPauseResumeListener =
      RendererEventFactory.createEvent(
        RendererEventFactory.Events
          .VIEW_CONSOLE_CIRCUIT_PAUSE_RESUME,
        this,
        this.onCircuitPauseResume
      );
    this.circuitSolveListener =
      RendererEventFactory.createEvent(
        RendererEventFactory.Events
          .VIEW_CONSOLE_CIRCUIT_SOLVE,
        this,
        this.onCircuitSolve
      );
    this.circuitJoinLeaveListener =
      RendererEventFactory.createEvent(
        RendererEventFactory.Events
          .VIEW_CONSOLE_CIRCUIT_JOIN_LEAVE,
        this,
        this.onCircuitJoinLeave
      );

    this.meUpdateListener =
      RendererEventFactory.createEvent(
        RendererEventFactory.Events.VIEW_CONSOLE_ME_UPDATE,
        this,
        this.onMeUpdate
      );


    this.setAlarmStateBasedOnStatus(MemberClient.me);
    setTimeout(() => {
      this.refreshNotificationStatus();
    }, 3000);
  }

  /**
   * called when we remove the console sidebar panel and menu from view
   */
  componentWillUnmount() {
    this.myController.clearHeartbeatListener();
    this.myController.clearMenuListener();
    this.myController.clearPulseListener();
    this.myController.clearSidebarShowListener();
    this.meDataRefreshListener.clear();
    this.meUpdateListener.clear();
    this.refreshNotificationsListener.clear();
    this.circuitStartStopListener.clear();
    this.circuitPauseResumeListener.clear();
    this.talkRoomMessageListener.clear();
    this.directMessageListener.clear();
  }

  /**
   * Called when notifications are read or updated in the notification panel, and the dot needs updating
   */
  onNotificationReadUpdate = () => {
    this.refreshNotificationStatus();
  };

  /**
   * Refresh the unread notification count so we update the dot
   */
  refreshNotificationStatus = () => {
    NotificationClient.getUnreadNotificationCount(
      this,
      (arg) => {
        if (arg.error) {
          console.error(
            "Unable to get unread notification count"
          );
        } else {
          let count = arg.data.count;
          this.setState({
            unreadNotificationCount: count,
          });
        }
      }
    );
  };

  /**
   * event handler that is called whenever we receive a talk message
   * from our talk network. This panel is looking for member status updates for us
   * that might indicate a change in our alarm status
   * and we need to refresh
   * @param event
   * @param arg
   */
  onTalkRoomMessage = (event, arg) => {
    let mType = arg.messageType,
      data = arg.data;

    if (mType === BaseClient.MessageTypes.TEAM_MEMBER) {
      if (this.isMe(data.id)) {
        this.setAlarmStateBasedOnStatus(data);
      }
    } else if (mType === BaseClient.MessageTypes.XP_STATUS_UPDATE) {
      if (this.isMe(data.memberId)) {
        this.setXpUpdateState(data);
      }
    }
  };


  /**
   * For refresh me status data, this happens after disconnect/refresh
   */
  onMeRefresh() {
    MemberClient.getMe(this, (arg) => {
      this.setAlarmStateBasedOnStatus(arg.data);
    });
  }

  setXpUpdateState(xpUpdate) {
    let oldXP = xpUpdate.oldXPSummary.totalXP;
    let newXP = xpUpdate.newXPSummary.totalXP;

    this.xpTimer = setTimeout(() => {
      this.setState({
        isXPUpdate: false,
      });
    }, 2000);

    this.setState({
      isXPUpdate: true,
      xpUpdateAmount: newXP - oldXP,
    });
  }

  setAlarmStateBasedOnStatus(me) {
    let isAlarm = false;
    if (me && me.activeCircuit) {
      isAlarm = true;
    } else {
      isAlarm = false;
    }
    this.setState({
      isAlarm: isAlarm,
    });
  }

  /**
   * checks to see if this is use based on a member id
   * @param id
   * @returns {boolean}
   */
  isMe(id) {
    let me = MemberClient.me;
    return me && me["id"] === id;
  }

  /**
   * called when our app heartbeat pulses
   * @param event
   * @param arg
   */
  onHeartbeat(event, arg) {
    this.setState({
      isOnline: arg.isOnline,
      pingTime: arg.pingTime,
      latencyTime: arg.latencyTime,
      talkUrl: arg.talkUrl,
      server: arg.server,
      errorMsg: arg.message,
    });
  }

  /**
   * called when we pulse the app every 20 s from talk socket ping pong
   * @param event
   * @param arg
   */
  onPulse(event, arg) {
    this.setState({
      latencyTime: arg.latencyTime,
    });
  }

  /**
   * event handler for when our me is reloaded
   * @param event
   * @param arg
   */
  onMeUpdate = (event, arg) => {
    this.setAlarmStateBasedOnStatus(MemberClient.me);
  };

  /**
   * event handler for when we join or leave a circuit
   * @param event
   * @param arg
   */
  onCircuitJoinLeave = (event, arg) => {
    this.setState({
      isAlarm: arg > 0,
    });
  };

  /**
   * event handler for when we start and stop our active circuit
   * @param event
   * @param arg
   */
  onCircuitStartStop = (event, arg) => {
    this.setState({
      isAlarm: arg > 0,
    });
  };

  /**
   * handles our pause and resume event that was spawned from our resource
   * circuit controller.. usually ;)
   * @param event
   * @param arg
   */
  onCircuitPauseResume = (event, arg) => {
    this.setState({
      isAlarm: arg < 0,
    });
  };

  /**
   * event handler for when the user solves a wtf. this will remove
   * the flashing active circuit model from the wtf button.
   * @param event
   * @param arg
   */
  onCircuitSolve = (event, arg) => {
    this.setState({
      isAlarm: false,
    });
  };

  /**
   * event listener for when our sidebar panel needs to update and change
   * @param event
   * @param arg
   */
  onSidebarShow(event, arg) {
    console.log(
      this.name +
        " shortcut received -> sidebar show : " +
        arg
    );
    switch (arg) {
      case 1:
        this.showPanel(
          SidePanelViewController.MenuSelection.TEAM
        );
        break;
      case 2:
        this.showPanel(
          SidePanelViewController.MenuSelection.CIRCUITS
        );
        break;
      case 3:
        this.showPanel(
          SidePanelViewController.MenuSelection.FERVIE
        );
        break;
      case 4:
        this.showPanel(
          SidePanelViewController.MenuSelection
            .NOTIFICATIONS
        );
        break;
      case 0:
        this.showPanel(
          SidePanelViewController.MenuSelection.WTF
        );
        break;
      default:
        throw new Error(
          "Unknown console sidebar show arg " + arg
        );
    }
  }

  /**
   * function handler that os called when the console layout perspective changes
   */
  onRefresh() {
    let activeMenuItem =
      this.myController.activeMenuSelection;
    let state = {
      activeItem: activeMenuItem,
      iconFervie: "heart",
      iconTeam: "home",
      iconWTF: "lightning",
      iconNotifications: "bell",
      iconCircuit: "shuffle",
      iconDashboard: "chart line",
    };
    let oStr = " outline";
    switch (activeMenuItem) {
      case SidePanelViewController.MenuSelection.TEAM:
        state.iconFervie += oStr;
        //state.iconCircuit += oStr;
        state.iconNotifications += oStr;
        break;
      case SidePanelViewController.MenuSelection.CIRCUITS:
        state.iconFervie += oStr;
        //state.iconTeam += oStr;
        state.iconNotifications += oStr;
        break;
      case SidePanelViewController.MenuSelection.FERVIE:
        //state.iconTeam += oStr;
        //state.iconCircuit += oStr;
        state.iconNotifications += oStr;
        break;
      case SidePanelViewController.MenuSelection
        .NOTIFICATIONS:
        state.iconFervie += oStr;
        //state.iconTeam += oStr;
        //state.iconCircuit += oStr;
        break;
      case SidePanelViewController.MenuSelection.DASHBOARD:
        state.iconFervie += oStr;
        state.iconNotifications += oStr;
        //state.iconTeam += oStr;
        //state.iconCircuit += oStr;
        break;
      case SidePanelViewController.MenuSelection.NONE:
        state.iconFervie += oStr;
        //state.iconTeam += oStr;
        //state.iconCircuit += oStr;
        state.iconNotifications += oStr;
        break;
      default:
        break;
    }
    this.setState(state);
  }

  /**
   * event click handler for the menu
   * @param e
   * @param name
   */
  handleItemClick = (e, { name }) => {
    if (this.state.activeItem === name) {
      this.myController.hidePanel();
    } else if (
      name === SidePanelViewController.MenuSelection.WTF &&
      this.state.isAlarm
    ) {
      this.myController.loadWTF();
    } else if (
      name === SidePanelViewController.MenuSelection.WTF
    ) {
      this.myController.startWTF();
    } else {
      this.myController.showPanel(name);
    }
  };

  /**
   * renders our network connection popup tooltip on our shell
   * @param server
   * @param pingTime
   * @param talkUrl
   * @param latencyTime
   * @param isOnline
   * @param errorMsg
   * @returns {*}
   */
  getPopupContent(
    server,
    pingTime,
    talkUrl,
    latencyTime,
    isOnline,
    errorMsg
  ) {
    return (
      <div>
        <div>
          <i>{server}</i>
        </div>
        <div>
          <i>ping: </i>
          <b>
            <i>
              {pingTime <= 0
                ? "calculating..."
                : pingTime + "ms"}
            </i>
          </b>
        </div>
        <Divider />
        <div>
          <i>{talkUrl}</i>
        </div>
        <div>
          <i>latency: </i>
          <b>
            <i>
              {latencyTime <= 0
                ? "calculating..."
                : latencyTime + "ms"}
            </i>
          </b>
        </div>
        {!isOnline && (
          <div className="errorMsg">
            <i style={{ color: "red" }}>
              <b>{errorMsg}</b>
            </i>
          </div>
        )}
      </div>
    );
  }

  /**
   * renders the sidebar of the console view
   */
  render() {
    const {
      activeItem,
      isOnline,
      pingTime,
      latencyTime,
      talkUrl,
      server,
      errorMsg,
    } = this.state;

    let iconClassName = isOnline
        ? "signal"
        : "remove circle",
      menuClassName = isOnline
        ? "networkConnect"
        : "networkConnectError",
      iconColor = isOnline ? "green" : "red";

    if (isOnline === undefined) {
      menuClassName = "networkLoading";
      iconClassName = "wait";
      iconColor = "grey";
    }

    let heartAnimClass = "";
    let xpAnimClass = "";
    let xpAmount = "";

    if (this.state.isXPUpdate) {
      heartAnimClass = "fervieHeartFade";
      xpAnimClass = "xpFloat";
      xpAmount = "+" + this.state.xpUpdateAmount + "XP";
    }

    const networkConnectMenuItem = (
      <Menu.Item header className={menuClassName}>
        <Icon name={iconClassName} color={iconColor} />
      </Menu.Item>
    );
    const popupContent = this.getPopupContent(
      server,
      pingTime,
      talkUrl,
      latencyTime,
      isOnline,
      errorMsg
    );

    let notificationIcon = "";
    if (this.state.unreadNotificationCount > 0) {
      notificationIcon = (
        <Icon.Group>
          <Icon name={this.state.iconNotifications} />
          <Icon
            inverted
            corner="bottom right"
            name="circle"
            color="red"
          />
        </Icon.Group>
      );
    } else {
      notificationIcon = (
        <Icon name={this.state.iconNotifications} />
      );
    }

    return (
      <div
        id="component"
        className={ConsoleSidebar.className}
      >
        <Menu
          inverted
          icon
          vertical
          style={{
            height:
              DimensionController.getConsoleSidebarHeight(),
          }}
        >
          <Menu.Item
            name={
              SidePanelViewController.MenuSelection.TEAM
            }
            active={
              activeItem ===
              SidePanelViewController.MenuSelection.TEAM
            }
            onClick={this.handleItemClick}
          >
            <Icon name={this.state.iconTeam} />
          </Menu.Item>
          <Menu.Item
            name={
              SidePanelViewController.MenuSelection.CIRCUITS
            }
            active={
              activeItem ===
              SidePanelViewController.MenuSelection.CIRCUITS
            }
            onClick={this.handleItemClick}
          >
            <Icon name={this.state.iconCircuit} />
          </Menu.Item>
          <Menu.Item
            name={
              SidePanelViewController.MenuSelection.FERVIE
            }
            active={
              activeItem ===
              SidePanelViewController.MenuSelection.FERVIE
            }
            onClick={this.handleItemClick}
          >
            <Icon
              className={heartAnimClass}
              name={this.state.iconFervie}
            />
            <div className={xpAnimClass}>{xpAmount}</div>
          </Menu.Item>
          <Menu.Item
            name={
              SidePanelViewController.MenuSelection
                .NOTIFICATIONS
            }
            active={
              activeItem ===
              SidePanelViewController.MenuSelection
                .NOTIFICATIONS
            }
            onClick={this.handleItemClick}
          >
            {notificationIcon}
          </Menu.Item>

          <Menu.Item
            name={
              SidePanelViewController.MenuSelection
                .DASHBOARD
            }
            active={
              activeItem ===
              SidePanelViewController.MenuSelection
                .DASHBOARD
            }
            onClick={this.handleItemClick}
          >
            <Icon name={this.state.iconDashboard} />
          </Menu.Item>

          <Menu.Item
            name={SidePanelViewController.MenuSelection.WTF}
            active={
              activeItem ===
              SidePanelViewController.MenuSelection.WTF
            }
            onClick={this.handleItemClick}
            className={
              this.state.isAlarm
                ? ConsoleSidebar.alarmClassName
                : ""
            }
          >
            <Icon name={this.state.iconWTF} />
          </Menu.Item>
          <Popup
            trigger={networkConnectMenuItem}
            className="chunkTitle"
            content={popupContent}
            position="top left"
            inverted
          />
        </Menu>
      </div>
    );
  }
}
