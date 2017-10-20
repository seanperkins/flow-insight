import React, { Component } from "react";
import { EventManagerHelper, RendererEvent } from "../EventManagerHelper";
import {
  Divider,
  Transition,
  Icon,
  Header,
  Progress,
  Segment
} from "semantic-ui-react";

/*
 * This view class is used to show application loading which consists of:
 *    1> checking for ner version to update
 *    2> downloading update if there is one, auto restart
 *    3> load database file into memory
 *    4> read user configuration
 *    5> authenticate user API-Key if online
 */
export default class LoadingView extends Component {
  /*
   * State is used to store the local data about the current view
   */
  state = {
    visible: true,
    header: {
      title: "Loading MetaOS",
      text: "Checking for new version...",
      icon: "hand spock"
    },
    progress: { color: "violet", value: 0, total: 5, label: "Checking..." }
  };

  /*
   * toggles the view state to trigger animation on icon
   */
  onHideShow = () => this.setState({ visible: !this.state.visible });

  constructor(props) {
    super(props);
    console.log("[LoadingView] component instantiated");
    this.registerEvents();
  }

  registerEvents() {
    console.log("[LoadingView] register events");

    let shownEvent = new RendererEvent(
      EventManagerHelper.EventTypes.WINDOW_LOADING_SHOWN,
      this,
      (event, arg) => {
        console.log("[LoadingView] loading window shown");
        // console.log(this);
      }
    );

    let loadEvent = new RendererEvent(
      EventManagerHelper.EventTypes.APPLOADER_LOAD,
      this,
      function(event, arg) {
        console.log("[LoadingView] apploader load event : " + arg);
        console.log(this);
      }
    );

    this.events = {
      shown: shownEvent,
      load: loadEvent
    };
  }

  /*
   * An update can be caused by changes to props or state. These methods are 
   * called when a component is being re-rendered:
   *
   * componentWillReceiveProps()
   * shouldComponentUpdate()
   * componentWillUpdate()
   * render()
   * componentDidUpdate()
   */
  componentWillMount() {
    console.log("[LoadingView] component will mount");
    // STUB
  }

  componentDidMount() {
    console.log("[LoadingView] component did mount");
  }

  componentWillUnmount() {
    console.log("[LoadingView] component did unmount");
    // STUB
  }

  /*
   * renders the view into our root element of our window
   */
  render() {
    return (
      <Segment basic>
        <Header as="h4" floated="left">
          <Transition
            visible={this.state.visible}
            transitionOnMount
            animation="scale"
            duration={800}
            onHide={this.onHideShow}
            onShow={this.onHideShow}
          >
            <Icon
              size="big"
              circular
              inverted
              color="violet"
              name={this.state.header.icon}
            />
          </Transition>
        </Header>
        <Header as="h3" floated="left">
          <Header.Content>
            {this.state.header.title}
            <Header.Subheader>{this.state.header.text}</Header.Subheader>
          </Header.Content>
        </Header>
        <Divider clearing />
        <Progress
          color={this.state.progress.color}
          value={this.state.progress.value}
          total={this.state.progress.total}
          progress="percent"
          active
          size="small"
        >
          {this.state.progress.label}
        </Progress>
      </Segment>
    );
  }
}
