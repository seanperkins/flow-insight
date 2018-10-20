import React, { Component } from "react";
import {Button, Image, Menu, Progress, Segment, Transition, Icon} from "semantic-ui-react";
import {DataStoreFactory} from "../DataStoreFactory";
import {RendererEventFactory} from "../RendererEventFactory";

const {remote} = window.require("electron");

const electronLog = remote.require("electron-log");

//
// this component is the tab panel wrapper for the console content
//
export default class ConsoleSidebarPanel extends Component {
  constructor(props) {
    super(props);
    this.state = this.loadState();

  }

  log = msg => {
    electronLog.info(`[${this.constructor.name}] ${msg}`);
  };

  /// laods the stored state from parent or use default values
  loadState() {
    let state = this.props.loadStateCb();
    if (!state) {
      return {
        activeItem: "spirit",
        spiritVisible: true,
        badgesVisible: false,
        animationType: "fly down",
        animationDelay: 350,
        level: 0,
        percentXP: 99,
        totalXP: 99999,
        title: ""
      };
    }
    return state;
  }

  componentWillReceiveProps = (nextProps) => {
    this.log("componentWillReceiveProps ZZZZZZZZZZZZZZZ "+nextProps.xpSummary);

    let xpSummaryDto = nextProps.xpSummary;

    let flameRating = nextProps.flameRating;

    let flameString = "0";
    if (flameRating > 0) {
      flameString = "+" + flameRating;
    } else if (flameRating < 0) {
      flameString = flameRating;
    }

    this.setState({
      level: xpSummaryDto.level,
      percentXP: Math.round((xpSummaryDto.xpProgress / xpSummaryDto.xpRequiredToLevel) * 100),
      totalXP: xpSummaryDto.totalXP,
      title: xpSummaryDto.title,
      flameRating: flameString
    });
    //
    // this.log("recentProjects = "+ nextProps.recentProjects);
    // this.log("recentTasks = "+ nextProps.recentTasksByProjectId);
    // this.log("recentEntry = "+ nextProps.recentEntry);
    //
    // this.populateProjects(nextProps.recentProjects);
    //
    // let defaultProject = this.initCurrentProject(nextProps.recentProjects, nextProps.recentEntry);
    // this.populateTasks(defaultProject, nextProps.recentTasksByProjectId, nextProps.recentEntry);

  };


  /// stores this components state in the parents state
  saveState(state) {
    this.props.saveStateCb(state);
  }

    /// performs a simple calculation for dynamic height of panel
  calculateMenuHeight() {
    let heights = {
      rootBorder: 4,
      contentMargin: 8,
      contentHeader: 34,
      bottomMenuHeight: 28
    };
    return (
      window.innerHeight -
      heights.rootBorder -
      heights.contentMargin -
      heights.contentHeader -
      heights.bottomMenuHeight
    );
  }

  /// updates display to show spirit content
  handleSpiritClick = (e, { name }) => {
    this.setState({
      activeItem: name,
      spiritVisible: false,
      badgesVisible: false
    });
    setTimeout(() => {
      this.setState({
        spiritVisible: true
      });
    }, this.state.animationDelay);
  };

  /// updates the display to show the badges content
  handleBadgesClick = (e, { name }) => {
    this.setState({
      activeItem: name,
      spiritVisible: false,
      badgesVisible: false
    });
    setTimeout(() => {
      this.setState({
        badgesVisible: true
      });
    }, this.state.animationDelay);
  };

  /// make sure we are saving the state when hiding component
  componentWillUnmount() {
    this.saveState(this.state);
  }

  //the side panel, needs to affect the journal for the activeRow, so this method
  //so I need to torchie to display the active mood level
  //then I need torchie's buttons to adjust the active mood, or the historical mood if activeRow is set to something historical
  //don't worry about persisting these changes quite yet
  //we will call save on change, and if the active row is the latest, we will update server status immediately
  //mood lamps across the office reflect this rage status

  handleClickForRage = () => {
    this.log("Rage!");
    this.props.adjustFlameCb(-1);
  };

  handleClickForYay =() => {
    this.log("Yay!");
    this.props.adjustFlameCb(+1);
  };



  /// renders the console sidebar panel of the console view
  render() {
    const { activeItem } = this.state;
    const spiritContent = (
      <div className="spiritContent">
        <Image centered src="./assets/images/spirit.png" />
        <div className="level">
          <b>Level {this.state.level} </b>
        </div>
        <div className="level">
          <i>Torchie {this.state.title} </i>
        </div>
        <Progress size="small" percent={this.state.percentXP} color="violet" inverted progress>
          {this.state.totalXP} XP
        </Progress>

        <div className='ui fluid buttons'>
            <button className='ui icon button rageButton' tabIndex='0' onClick={this.handleClickForRage}>
              <Image centered src="./assets/images/wtf/24x24.png" />
            </button>

            
            {/*<button className='ui label flameRating'>*/}
              {/*{this.state.flameRating}*/}
            {/*</button>*/}

            <button toggle className='ui icon button yayButton' tabIndex='0' onClick={this.handleClickForYay}>
              <Image centered src="./assets/images/yay/24x24.png" />
            </button>
        </div>

      </div>
    );
    const badgesContent = (
      <div className="badgesContent">No Badges Earned :(</div>
    );
    return (
      <div
        id="component"
        className="consoleSidebarPanel"
        style={{
          width: this.props.width,
          opacity: this.props.opacity
        }}
      >
        <Segment.Group>
          <Menu size="mini" inverted pointing secondary>
            <Menu.Item
              name="spirit"
              active={activeItem === "spirit"}
              onClick={this.handleSpiritClick}
            />
            <Menu.Item
              name="badges"
              active={activeItem === "badges"}
              onClick={this.handleBadgesClick}
            />
          </Menu>
          <Segment inverted style={{ height: this.calculateMenuHeight() }}>
            <Transition
              visible={this.state.spiritVisible}
              animation={this.state.animationType}
              duration={this.state.animationDelay}
              unmountOnHide
            >
              {spiritContent}
            </Transition>
            <Transition
              visible={this.state.badgesVisible}
              animation={this.state.animationType}
              duration={this.state.animationDelay}
              unmountOnHide
            >
              {badgesContent}
            </Transition>
          </Segment>
        </Segment.Group>
      </div>
    );
  }
}
