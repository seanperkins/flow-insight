import React, { Component } from "react";
import JournalEntry from "./components/JournalEntry";
import { DimensionController } from "../../../../controllers/DimensionController";
import {
  Grid,
  Icon,
  Message,
  Transition
} from "semantic-ui-react";
import JournalItem from "./components/JournalItem";
import { JournalClient } from "../../../../clients/JournalClient";
import { scrollTo } from "../../../../UtilScroll";
import { MemberClient } from "../../../../clients/MemberClient";
import { RendererEventFactory } from "../../../../events/RendererEventFactory";
import UtilRenderer from "../../../../UtilRenderer";
import { BaseClient } from "../../../../clients/BaseClient";
import Mousetrap from "mousetrap";

/**
 * this component is the tab panel wrapper for the console content
 */
export default class JournalResource extends Component {
  /**
   * general purpose string to reprent ourselves.. again.
   * @returns {{ME: string}}
   * @constructor
   */
  static get Strings() {
    return {
      ME: "me"
    };
  }

  /**
   * our string values of keyboard key names
   * @returns {{DOWN: string, LEFT: string, RIGHT: string, UP: string}}
   * @constructor
   */
  static get Keys() {
    return {
      UP: "up",
      DOWN: "down",
      LEFT: "left",
      RIGHT: "right"
    };
  }

  /**
   * builds the basic journal layout component
   * @param props
   */
  constructor(props) {
    super(props);
    this.name = "[JournalResource]";
    this.resource = props.resource;
    this.journalIntentions = [];
    this.journalItems = [];
    this.projects = [];
    this.tasks = [];
    this.lastProject = null;
    this.lastTask = null;
    this.activeJournalItem = null;
    this.loadCount = 0;
    this.timeout = null;
    this.error = null;
    this.username = JournalResource.Strings.ME;
    this.talkRoomMessageListener = RendererEventFactory.createEvent(
      RendererEventFactory.Events.TALK_MESSAGE_ROOM,
      this,
      this.onTalkRoomMessage
    );
  }

  /**
   * this function is called when ever a talk message is recieve over
   * one of the rooms that the torchie client is connected to. This
   * is regulated and brokered by gridtime server.
   * @param event
   * @param arg
   */
  onTalkRoomMessage = (event, arg) => {
    let mType = arg.messageType,
      data = arg.data,
      username = data.username,
      me = MemberClient.me;

    switch (mType) {
      case BaseClient.MessageTypes
        .INTENTION_STARTED_DETAILS:
        if (
          !this.isMyJournal() &&
          this.username === username
        ) {
          let journalEntry = data.journalEntry,
            hasIntention = UtilRenderer.hasMessageByIdInArray(
              this.journalIntentions,
              journalEntry
            );

          if (!hasIntention) {
            this.journalIntentions.push(journalEntry);
            this.scrollToJournalItemById();
            this.forceUpdate();
          }
        }
        break;
      case BaseClient.MessageTypes
        .INTENTION_FINISHED_DETAILS:
        if (
          (!this.isMyJournal() &&
            this.username === username) ||
          (this.isMyJournal() && me.username === username)
        ) {
          this.updateJournalIntentions(data.journalEntry);
        }
        break;
      case BaseClient.MessageTypes
        .INTENTION_ABORTED_DETAILS:
        if (
          (!this.isMyJournal() &&
            this.username === username) ||
          (this.isMyJournal() && me.username === username)
        ) {
          this.updateJournalIntentions(data.journalEntry);
        }
        break;
      case BaseClient.MessageTypes.JOURNAL_ENTRY_DTO:
        if (
          (!this.isMyJournal() &&
            this.username === username) ||
          (this.isMyJournal() && me.username === username)
        ) {
          this.updateJournalIntentions(data);
        }
        break;
      default:
        break;
    }
  };

  /**
   * updates our journal intentions with new data  from our network. After we look though
   * our array of intention, we scroll to the last item in our journal intentions, and
   * call a react force update. This update will make a reference pointer to each of the
   * reach components though a nested prop.pusher() function which routes the react fiber
   * component to its parent.
   * @param data
   */
  updateJournalIntentions(data) {
    this.journalIntentions = UtilRenderer.updateMessageInArrayById(
      this.journalIntentions,
      data
    );
    this.forceUpdate();
  }

  /**
   * make sure we clear our talk room listener when destroying this component
   */
  componentWillUnmount() {
    this.talkRoomMessageListener.clear();
    this.clearKeyboardShortcuts();
  }

  /**
   * gets our user name from a given journal resource from our browser
   * @param props
   * @returns {string}
   */
  getUserNameFromResource(props) {
    return props.resource.uriArr[1];
  }

  /**
   * this function is called when we load a new resource into this resource view. recycles the component
   * @param nextProps
   * @param nextState
   * @param nextContext
   * @returns {boolean}
   */
  shouldComponentUpdate(nextProps, nextState, nextContext) {
    if (
      nextProps.resource.uri === this.props.resource.uri
    ) {
      return false;
    }
    this.refreshJournal(nextProps);
    return false;
  }

  /**
   * load our recent journalIntentions after we load this page resource. This is only called when we
   * initially create the window's console view or switch resource views
   */
  componentDidMount() {
    this.refreshJournal(this.props);
    this.setKeyboardShortcuts();
  }

  isMe() {
      let username = this.getUserNameFromResource(this.props);
      if (
          username === JournalResource.Strings.ME ||
          username === MemberClient.me.username
      ) {
          return true;
      }
      return false;
  }

  /**
   * binds our keyboard shortcut to our callback. Called when the journal resource is
   * loaded for ourselves.
   */
  setKeyboardShortcuts() {
    Mousetrap.bind(
      JournalResource.Keys.UP,
      this.handleKeyPressUp
    );
    Mousetrap.bind(
      JournalResource.Keys.DOWN,
      this.handleKeyPressDown
    );
    if (this.isMyJournal()) {
      Mousetrap.bind(
        JournalResource.Keys.LEFT,
        this.handleKeyPressLeft
      );
      Mousetrap.bind(
        JournalResource.Keys.RIGHT,
        this.handleKeyPressRight
      );
    }
  }

  /**
   * event handler for our key press up
   * @param e
   * @param combo
   */
  handleKeyPressUp = (e, combo) => {
    if (
      this.activeJournalItem &&
      this.journalItems.length > 1
    ) {
      for (let i = 1; i < this.journalItems.length; i++) {
        if (
          this.journalItems[i].props.model.id ===
          this.activeJournalItem.props.model.id
        ) {
          this.updateActiveJournalItemSelection(
            this.journalItems[i - 1]
          );
          break;
        }
      }
    } else if (
      !this.activeJournalItem &&
      this.journalItems.length > 0
    ) {
      this.updateActiveJournalItemSelection(
        this.journalItems[this.journalItems.length - 1]
      );
    }
  };

  /**
   * event handler for our key press down
   * @param e
   * @param combo
   */
  handleKeyPressDown = (e, combo) => {
    if (
      this.activeJournalItem &&
      this.journalItems.length > 1
    ) {
      for (
        let i = 0;
        i < this.journalItems.length - 1;
        i++
      ) {
        if (
          this.journalItems[i].props.model.id ===
          this.activeJournalItem.props.model.id
        ) {
          this.updateActiveJournalItemSelection(
            this.journalItems[i + 1]
          );
          break;
        }
      }
    } else if (
      !this.activeJournalItem &&
      this.journalItems.length > 0
    ) {
      this.updateActiveJournalItemSelection(
        this.journalItems[this.journalItems.length - 1]
      );
    }
  };

  /**
   * event handler for when the user presses the left arrow keys
   * @param e
   * @param combo
   */
  handleKeyPressLeft = (e, combo) => {
    if (this.isMe() && this.activeJournalItem) {
      this.changeFlameRating(-1, this.activeJournalItem);
    }
    //ignore if nothing selected
  };

  /**
   * event handler for when the user presses the right arrow key
   * @param e
   * @param combo
   */
  handleKeyPressRight = (e, combo) => {
    if (this.isMe() && this.activeJournalItem) {
      this.changeFlameRating(1, this.activeJournalItem);
    }
    //ignore if nothing selected
  };

  /**
   * changes our existing journal items model with our new flame rating. This performs
   * a remote call to gridtime which will push our new model via talk to the clients
   * whom require this update.  Allows rapidly changing flame rating and sends to server after pausing 1/2 second.
   * @param amount
   * @param journalItem
   */
  changeFlameRating(amount, journalItem) {
    let intentionId = journalItem.props.model.id,
      flameRating = journalItem.state.flameRating;

    if (flameRating === undefined) {
      flameRating = journalItem.props.model.flameRating;
    }
    if (
      (flameRating >= 5 && amount > 0) ||
      (flameRating <= -5 && amount < 0)
    ) {
      console.log("cancel update.");
      return;
    }

    if (!flameRating) {
      flameRating = 0;
    }

    flameRating += amount;

    journalItem.setState({
      flameRating: flameRating
    });

    if (this.timeout) {
        clearTimeout(this.timeout);
    }

    let that = this;
    this.timeout = setTimeout(function() {
        JournalClient.updateFlameRating(
            intentionId,
            flameRating,
            that,
            arg => {
                that.hasCallbackError(arg);
            }
        );
    }, 500);

  }

  /**
   * called to update the journal item as our new active item in the grid. This function
   * will set the isActive property of the state of the active journal item that is a
   * react component. We then switch the new component into our managed array and set
   * its active state property to true.
   * @param journalItem
   */
  updateActiveJournalItemSelection(journalItem) {

    if (this.activeJournalItem) {
      this.activeJournalItem.setState({ isActive: false });
    }
    this.activeJournalItem = journalItem;
    this.activeJournalItem.setState({ isActive: true });

    this.scrollToJournalItemById(
      this.activeJournalItem.props.model.id,
      true
    );
  }

  /**
   * clears keyboard shortcuts for our journal.
   */
  clearKeyboardShortcuts() {
    Mousetrap.unbind(JournalResource.Keys.UP);
    Mousetrap.unbind(JournalResource.Keys.DOWN);
    Mousetrap.unbind(JournalResource.Keys.LEFT);
    Mousetrap.unbind(JournalResource.Keys.RIGHT);
  }

  /**
   * refreshes our journal in the gui by getting journal items from our local database.
   * if an empty array is return we make a load call on gridtime through our client
   * interface and controllers. This will scroll to the bottom of the grid when we
   * have everything loaded.
   * @param props
   */
  refreshJournal(props) {
    this.error = null;
    this.loadCount = 0;
    this.isFlameUpdating = false;
    this.activeJournalItem = null;
    this.journalItems = [];
    this.username = this.getUserNameFromResource(props);

    JournalClient.getRecentProjects(this, arg => {
      if (!this.hasCallbackError(arg)) {
        this.projects = arg.data;
        this.handleCallback();
      }
    });
    JournalClient.getRecentTasks(this, arg => {
      if (!this.hasCallbackError(arg)) {
        this.tasks = arg.data;
        this.handleCallback();
      }
    });
    JournalClient.getRecentIntentions(
      this.username,
      this,
      arg => {
          if (
              !this.hasCallbackError(arg) &&
              arg.data &&
              arg.data.length > 0
          ) {
              this.journalIntentions = arg.data;

              //this is where we need to handle updating the recent project/task to match the last intention
              this.lastProject = this.getLastProjectId(arg.data);
              this.lastTask = this.getLastTaskId(arg.data);

              this.handleCallback();
          }
      }
      );
  }

    getLastProjectId(intentions) {
      if (intentions && intentions.length > 0) {
        return intentions[intentions.length - 1].projectId;
      }
      return null;
    }

    getLastTaskId(intentions) {
        if (intentions && intentions.length > 0) {
            return intentions[intentions.length - 1].taskId;
        }
        return null;
    }

  /**
   * does stuff when our client callback errors out
   * @param arg
   * @returns {boolean}
   */
  hasCallbackError(arg) {
    if (arg.error) {
      this.error = arg.error;
      this.forceUpdate();
      return true;
    }
    return false;
  }

  /**
   * handles our callback for loading data from our local database
   */
  handleCallback() {
    this.loadCount++;
    if (this.loadCount === 3) { //the 3 load calls are asynchronous, so make sure we only update this on the last one
      this.forceUpdate(() => {
        this.scrollToJournalItemById();
      });
    }
  }

  /**
   * scrolls our journal items grid into the view of a selected item by
   * id, or if null it will just scroll to the bottom. This can perform
   * smooth or auto (jump directly to) performance. In order to center
   * selected journal items in our grid we must manually loop through the
   * array of children and calculate the rendered pixel from the offsetHeight.
   * After this then fire the callback.
   * @param id
   * @param smooth
   * @param callback
   */
  scrollToJournalItemById(id, smooth, callback) {
    let rootElement = document.getElementById(
        "journal-items-grid"
      ),
      parentElement = rootElement.parentElement,
      smoothStr = smooth ? "smooth" : "auto",
      theHeight = 0;

    if (id) {
      let array = rootElement.children;
      for (let i = 0; i < array.length; i++) {
        let obj = array[i];
        theHeight += obj.offsetHeight;
        if (
          obj.id === this.activeJournalItem.props.model.id
        ) {
          theHeight -=
            parentElement.offsetHeight / 2 +
            obj.offsetHeight / 2;
          break;
        }
      }
      scrollTo(parentElement, {
        behavior: smoothStr,
        top: theHeight
      }).then(callback);
    } else if (parentElement && rootElement) {
      theHeight = rootElement.scrollHeight;
      scrollTo(parentElement, {
        behavior: smoothStr,
        top: theHeight
      }).then(callback);
    }
  }

  /**
   * event handler that is called when we finish sliding the journal entry in to the user.
   */
  onEntryShown = () => {
    this.scrollToJournalItemById(null, true);

    if (this.isMyJournal()) {
       document.getElementById("intentionTextInput").focus();
    }
  };

  /**
   * saves the journal entry from the callback event
   * @param projectId
   * @param taskId
   * @param intention
   */
  handleCreateIntention = (
    projectId,
    taskId,
    intention
  ) => {
    this.error = null;
    JournalClient.createIntention(
      projectId,
      taskId,
      intention,
      this,
      arg => {
        if (!this.hasCallbackError(arg) && arg.data) {
          this.journalIntentions.push(arg.data);
          this.forceUpdate(() => {
            this.updateActiveJournalItemSelection(
              this.journalItems[
                this.journalItems.length - 1
              ]
            );
          });
        }
      }
    );
  };

  /**
   * create a task reference using our journal client
   * @param projectId
   * @param name
   * @param callback
   */
  handleCreateTask = (projectId, name, callback) => {
    JournalClient.findOrCreateTask(
      projectId,
      name,
      "",
      this,
      arg => {
        this.createProjectOrTaskHelper(
          this.tasks,
          arg,
          callback
        );
      }
    );
  };

  /**
   * creates new project on the journal client and controller
   * @param name
   * @param callback
   */
  handleCreateProject = (name, callback) => {
    JournalClient.findOrCreateProject(
      name,
      "",
      false,
      this,
      arg => {
        this.createProjectOrTaskHelper(
          this.projects,
          arg,
          callback
        );
      }
    );
  };

  /**
   * helps create a project or task from the client request
   * @param objects
   * @param arg
   * @param callback
   */
  createProjectOrTaskHelper(objects, arg, callback) {
    if (arg.error) {
      this.error = arg.error;
      this.forceUpdate();
    } else {
      let obj = arg.data;
      objects.push(obj);
      this.error = null;
      if (callback) {
        callback(obj);
      }
    }
  }

  /**
   * delegates our journal item by having its constructor call this function which
   * pushes the react's fiber component. This allows access to the underlying react
   * component api.
   * @param journalItem
   */
  journalItemPusher = journalItem => {
    this.journalItems.push(journalItem);
  };



  /**
   * event callback for when we set a row active
   * @param journalItem
   */
  onRowClick = journalItem => {

    if (
      this.activeJournalItem &&
      this.activeJournalItem.props.model.id ===
        journalItem.props.model.id &&
      this.activeJournalItem.state.isActive
    ) {
      //this deselects if you click a row again
      this.activeJournalItem.setState({
        isActive: false
      });
      this.activeJournalItem = null;
      return;
    }

    if (this.activeJournalItem) {
      //this deselects the old item
      this.activeJournalItem.setState({
        isActive: false
      });
    }
    //then sets the new item
    this.activeJournalItem = journalItem;
    this.activeJournalItem.setState({
      isActive: true
    });

    //then scrolls to the new item
    this.scrollToJournalItemById(
      journalItem.props.model.id,
      true
    );
  };

  /**
   * event callback for when a user finishes a intention. This
   * routes into each of the child journal items that this resource
   * stores in the journalIntentions array.
   * @param data
   * @param arg
   */
  onFinishIntention = (data, arg) => {
    this.updateJournalIntentions(arg.data);
  };

  /**
   * event callback for when a user aborts an intention. This
   * routes into the child components of the journal resource.
   * @param data
   * @param arg
   */
  onAbortIntention = (data, arg) => {
    this.updateJournalIntentions(arg.data);
  };

  /**
   * determines if we should render this from the point of view as ourselves
   * @returns {boolean}
   */
  isMyJournal() {
    return (
      this.username === JournalResource.Strings.ME ||
      this.username === MemberClient.me.username
    );
  }

  /**
   * renders the array of journal items
   * @returns {array}
   */
  getJournalItemsContent() {
    return this.journalIntentions.map(item => {
      return (
        <JournalItem
          key={item.id}
          pusher={this.journalItemPusher}
          model={item}
          onRowClick={this.onRowClick}
          onFinishIntention={this.onFinishIntention}
          onAbortIntention={this.onAbortIntention}
        />
      );
    });
  }

  /**
   * wraps our journal items array
   * @returns {*}
   */
  getJournalItemsWrapperContent() {
    return (
      <div id="wrapper" className="journalIntentions">
        <div
          id="component"
          className="journalIntentions"
          style={{
            height: DimensionController.getJournalItemsPanelHeight(
              this.isMyJournal()
            )
          }}
        >
          <Grid id="journal-items-grid" inverted>
            {this.getJournalItemsContent()}
          </Grid>
        </div>
      </div>
    );
  }

  /**
   * renders our error for the screen
   * @returns {*}
   */
  getJournalErrorContent() {
    return (
      <Message icon negative size="large">
        <Icon name="warning sign" />
        <Message.Content>
          <Message.Header>{this.error} :(</Message.Header>
          These were not the cats you were looking for
          =|^.^|=
        </Message.Content>
      </Message>
    );
  }

  /**
   * renders our journal entry component in the journal resource view
   * @returns {*}
   */
  getJournalEntryContent() {
    return (
      <Transition
        visible={this.isMyJournal()}
        animation="fade"
        duration={420}
        onComplete={this.onEntryShown}
      >
        <div id="wrapper" className="journalEntry ">
          <JournalEntry
            projects={this.projects}
            tasks={this.tasks}
            lastProject={this.lastProject}
            lastTask={this.lastTask}
            createIntention={this.handleCreateIntention}
            createTask={this.handleCreateTask}
            createProject={this.handleCreateProject}
          />
        </div>
      </Transition>
    );
  }

  /**
   * renders the journal layout of the console view
   * @returns {*} - returns the JSX for this component
   */
  render() {
    let error = !!this.error;

    return (
      <div
        id="component"
        className={
          "journalLayout" + (error ? " error" : "")
        }
      >
        {error && this.getJournalErrorContent()}
        {!error && this.getJournalItemsWrapperContent()}
        {!error && this.getJournalEntryContent()}
      </div>
    );
  }
}
