const BaseController = require("./BaseController"),
  EventFactory = require("../events/EventFactory"),
  DatabaseFactory = require("../database/DatabaseFactory"),
  Util = require("../Util");

/**
 * This class is used to coordinate controllers across the talknet service
 * @type {TalkToController}
 */
module.exports = class TalkToController extends (
  BaseController
) {
  /**
   * builds our static Circuit controller which interfaces mainly with our local database
   * @param scope
   */
  constructor(scope) {
    super(scope, TalkToController);
    if (!TalkToController.instance) {
      TalkToController.instance = this;
      TalkToController.wireControllersTogether();
    }
  }

  /**
   * general enum list of all of our possible circuit events
   * @constructor
   */
  static get Events() {
    return {
      GET_ALL_TALK_MESSAGES_FROM_ROOM:
        "get-all-talk-messages-from-room",
      PUBLISH_CHAT_TO_ROOM: "publish-chat-to-room",
      PUBLISH_PUPPET_CHAT_TO_ROOM: "publish-puppet-chat-to-room",
      JOIN_EXISTING_ROOM: "join-existing-room",
      LEAVE_EXISTING_ROOM: "leave-existing-room",
    };
  }

  /**
   * links associated controller classes here
   */
  static wireControllersTogether() {
    BaseController.wireControllersTo(
      TalkToController.instance
    );
  }

  /**
   * configures application wide events here
   */
  configureEvents() {
    BaseController.configEvents(TalkToController.instance);
    this.talkToClientEventListener =
      EventFactory.createEvent(
        EventFactory.Types.TALK_TO_CLIENT,
        this,
        this.onTalkToClientEvent,
        null
      );
  }

  /**
   * notified when we get a circuit event
   * @param event
   * @param arg
   * @returns {string}
   */
  onTalkToClientEvent(event, arg) {
    this.logRequest(this.name, arg);
    if (!arg.args) {
      this.handleError(
        TalkToController.Error.ERROR_ARGS,
        event,
        arg
      );
    } else {
      switch (arg.type) {
        case TalkToController.Events
          .GET_ALL_TALK_MESSAGES_FROM_ROOM:
          this.handleGetAllTalkMessagesFromRoomEvent(
            event,
            arg
          );
          break;
        case TalkToController.Events.PUBLISH_CHAT_TO_ROOM:
          this.handlePublishChatToRoomEvent(event, arg);
          break;
        case TalkToController.Events.PUBLISH_PUPPET_CHAT_TO_ROOM:
          this.handlePublishPuppetChatToRoomEvent(event, arg);
          break;
        case TalkToController.Events.JOIN_EXISTING_ROOM:
          this.handleJoinExistingRoomEvent(event, arg);
          break;
        case TalkToController.Events.LEAVE_EXISTING_ROOM:
          this.handleLeaveExistingRoomEvent(event, arg);
          break;
        default:
          throw new Error(
            TalkToController.Error.UNKNOWN_TALK_TO_EVENT +
              " '" +
              arg.type +
              "'."
          );
      }
    }
  }

  /**
   * helped function which is used to load all room messages into the db collection
   * @param event
   * @param arg
   * @param callback
   */
  handleLoadAllTalkNessagesFromRoomEvent(
    event,
    arg,
    callback
  ) {
    let roomName = arg.args.roomName,
      urn =
        TalkToController.Paths.TALK +
        TalkToController.Paths.TO +
        TalkToController.Paths.ROOM +
        TalkToController.Paths.SEPARATOR +
        roomName;

    this.doClientRequest(
      TalkToController.Contexts.TALK_TO_CLIENT,
      {},
      TalkToController.Names
        .GET_ALL_TALK_MESSAGES_FROM_ROOM,
      TalkToController.Types.GET,
      urn,
      (store) =>
        this.delegateLoadAllTalkMessagesFromRoomCallback(
          store,
          event,
          arg,
          callback
        )
    );
  }

  /**
   * callback processor for our load all talk messages from a specific room
   * action. We need to find and update any existing ones. I dont think we need to
   * batch room these, however we should have some type of process that can
   * room duplicates, if any exist.
   * @param store
   * @param event
   * @param arg
   * @param callback
   */
  delegateLoadAllTalkMessagesFromRoomCallback(
    store,
    event,
    arg,
    callback
  ) {
    if (store.error) {
      arg.error = store.error;
    } else {
      let messages = store.data;
      if (messages) {
        let uri = Util.getUriFromMessageArray(messages),
          roomName =
            Util.getRoomNameFromMessageArray(messages),
          database = DatabaseFactory.getDatabase(
            DatabaseFactory.Names.TALK
          ),
          messageCollection =
            database.getCollectionForRoomTalkMessages(uri),
          statusCollection =
            database.getCollectionForRoomStatusTalkMessages(
              uri
            ),
          messageView =
            database.getViewTalkMessagesForCollection(
              messageCollection
            ),
          statusView =
            database.getViewStatusTalkMessagesForCollection(
              statusCollection
            );

        database.findRoomAndInsert(roomName, uri);
        for (
          let i = 0, message = null, len = messages.length;
          i < len;
          i++
        ) {
          message = messages[i];
          if (
            message.messageType ===
            (TalkToController.MessageTypes.CIRCUIT_STATUS ||
              TalkToController.MessageTypes
                .ROOM_MEMBER_STATUS_EVENT)
          ) {
            database.insertRoomStatusMessage(
              message,
              statusCollection
            );
          } else if (
            TalkToController.MessageTypes
              .CHAT_MESSAGE_DETAILS
          ) {
            database.insertRoomChatMessage(
              message,
              messageCollection
            );
          } else {
            console.warn(
              TalkToController.Error
                .UNKNOWN_TALK_MESSAGE_TYPE +
                " '" +
                message.messageType +
                "'."
            );
          }
        }
        this.logResults(
          this.name,
          arg.type,
          arg.id,
          messageView.count() + "+" + statusView.count()
        );
      }
    }
    this.delegateCallbackOrEventReplyTo(
      event,
      arg,
      callback
    );
  }

  /**
   * gets our talk messages from a given room name
   * @param event
   * @param arg
   * @param callback
   */

  handleGetAllTalkMessagesFromRoomEvent(
    event,
    arg,
    callback
  ) {
    let roomName = arg.args.roomName,
      uri = arg.args.uri,
      database = DatabaseFactory.getDatabase(
        DatabaseFactory.Names.TALK
      ),
      collection =
        database.getCollectionForRoomTalkMessages(uri),
      view =
        database.getViewTalkMessagesForCollection(
          collection
        );

    this.delegateGetFromViewOrLoadCallback(
      roomName,
      uri,
      view,
      event,
      arg,
      callback
    );
  }

  /**
   * processes our talk status message requests from our server on gridtime.
   * we assume that we have already loaded some messages with a load call first.
   * @param roomName
   * @param uri
   * @param view
   * @param event
   * @param arg
   * @param callback
   */
  delegateGetFromViewOrLoadCallback(
    roomName,
    uri,
    view,
    event,
    arg,
    callback
  ) {
    //these cached messages will be stale as soon as we leave the room,
    // since we only hear messages for rooms we are joined
    // if (this.hasRoomByRoomName(roomName)) {
    //   arg.data = view.data();
    //   this.logResults(
    //     this.name,
    //     arg.type,
    //     arg.id,
    //     view.count()
    //   );
    //   this.delegateCallbackOrEventReplyTo(
    //     event,
    //     arg,
    //     callback
    //   );
    // } else {
    this.handleLoadAllTalkNessagesFromRoomEvent(
      null,
      {
        args: { roomName: roomName, uri: uri },
        type: arg.type,
        id: arg.id,
      },
      () => {
        arg.data = view.data();
        this.delegateCallbackOrEventReplyTo(
          event,
          arg,
          callback
        );
      }
    );
  }


  /**
   * Publish a puppet type message to the talk room,
   * which works exactly the same as normal chat, except sends a different object type
   * requires a puppet claim in the room
   * @param event
   * @param arg
   * @param callback
   */
  handlePublishPuppetChatToRoomEvent(event, arg, callback) {
    let roomName = arg.args.roomName,
      text = arg.args.text,
      urn =
        TalkToController.Paths.TALK +
        TalkToController.Paths.TO +
        TalkToController.Paths.ROOM +
        TalkToController.Paths.SEPARATOR +
        roomName +
        TalkToController.Paths.PUPPET;

    this.doClientRequest(
      TalkToController.Contexts.TALK_TO_CLIENT,
      { chatMessage: text },
      TalkToController.Names.PUBLISH_PUPPET_CHAT_TO_ROOM,
      TalkToController.Types.POST,
      urn,
      (store) =>
        this.delegatePublishChatToRoomCallback(
          store,
          event,
          arg,
          callback
        )
    );
  }



  /**
   * process our publish to chat room service event. This is called by an action
   * from the gui client. This controller posts this request to gridtime,
   * which will update the database. Grid time will subsequentially make a REST
   * call to talknet server to broadcast this text message. Talk then will route
   * the message to all connected cliented to that specific room that is
   * stored as a guid.
   * @param event
   * @param arg
   * @param callback
   */
  handlePublishChatToRoomEvent(event, arg, callback) {
    let roomName = arg.args.roomName,
      text = arg.args.text,
      urn =
        TalkToController.Paths.TALK +
        TalkToController.Paths.TO +
        TalkToController.Paths.ROOM +
        TalkToController.Paths.SEPARATOR +
        roomName +
        TalkToController.Paths.CHAT;

    this.doClientRequest(
      TalkToController.Contexts.TALK_TO_CLIENT,
      { chatMessage: text },
      TalkToController.Names.PUBLISH_CHAT_TO_ROOM,
      TalkToController.Types.POST,
      urn,
      (store) =>
        this.delegatePublishChatToRoomCallback(
          store,
          event,
          arg,
          callback
        )
    );
  }

  /**
   * handles the callback logic of the publish to chat room event on gridtim. this collection is used to
   * store temporary messages awaiting arrival from the gridtime to talk push.
   * @param store
   * @param event
   * @param arg
   * @param callback
   */
  delegatePublishChatToRoomCallback(
    store,
    event,
    arg,
    callback
  ) {
    if (store.error) {
      arg.error = store.error;
    } else {
      arg.data = store.data;
    }
    this.logResults(
      this.name,
      arg.type,
      arg.id,
      JSON.stringify(arg.args)
    );
    this.delegateCallbackOrEventReplyTo(
      event,
      arg,
      callback
    );
  }

  /**
   * joins a talk room from a given room name. This is set within the
   * arg.args object that is passed  in from our client. This function
   * will make a dtp http request to gridtime for joining a room. Talk
   * will not complain if you join a room that you already are in. if
   * room doesn't exist in talk, the server will create a new one. Also
   * the  room will remain open until everyone is kicked (left) from
   * the room
   * @param event
   * @param arg
   * @param callback
   */
  handleJoinExistingRoomEvent(event, arg, callback) {
    let roomName = arg.args.roomName,
      urn =
        TalkToController.Paths.TALK +
        TalkToController.Paths.TO +
        TalkToController.Paths.ROOM +
        TalkToController.Paths.SEPARATOR +
        roomName +
        TalkToController.Paths.JOIN;

    this.doClientRequest(
      TalkToController.Contexts.TALK_TO_CLIENT,
      {},
      TalkToController.Names.JOIN_EXISTING_ROOM,
      TalkToController.Types.POST,
      urn,
      (store) =>
        this.delegateJoinExistingRoomCallback(
          store,
          event,
          arg,
          callback
        )
    );
  }

  /**
   * processes the callback for our join existing room request on grid.
   * This will just log the action, and if an error return it to the
   * client.
   * @param store
   * @param event
   * @param arg
   * @param callback
   */
  delegateJoinExistingRoomCallback(
    store,
    event,
    arg,
    callback
  ) {
    if (store.error) {
      arg.error = store.error;
    } else {
      arg.data = store.data;
    }
    this.logResults(
      this.name,
      arg.type,
      arg.id,
      JSON.stringify(arg.args)
    );
    this.delegateCallbackOrEventReplyTo(
      event,
      arg,
      callback
    );
  }

  /**
   * processes our client event for leaving a room on talk. To do this
   * we make a request with gridtime to join when connecting to this
   * from the renderer's circuit resource class. This calls calls the
   * talkto client which joins the  room. This renderer class also will
   * call leave on the talkto client. See gridtimes TalkToClient.java
   * class for more information.
   * @param event
   * @param arg - our argument. requires .args.roomName
   * @param callback
   */
  handleLeaveExistingRoomEvent(event, arg, callback) {
    let roomName = arg.args.roomName,
      urn =
        TalkToController.Paths.TALK +
        TalkToController.Paths.TO +
        TalkToController.Paths.ROOM +
        TalkToController.Paths.SEPARATOR +
        roomName +
        TalkToController.Paths.LEAVE;

    this.doClientRequest(
      TalkToController.Contexts.TALK_TO_CLIENT,
      {},
      TalkToController.Names.LEAVE_EXISTING_ROOM,
      TalkToController.Types.POST,
      urn,
      (store) =>
        this.delegateLeaveExistingRoomCallback(
          store,
          event,
          arg,
          callback
        )
    );
  }

  /**
   * processes our callback for leaving a room on the talk sever. This
   * is done by making a http dto request to gridtime's TalkToClient
   * class.
   * @param store
   * @param event
   * @param arg
   * @param callback
   */
  delegateLeaveExistingRoomCallback(
    store,
    event,
    arg,
    callback
  ) {
    if (store.error) {
      arg.error = store.error;
    } else {
      arg.data = store.data;
    }
    this.logResults(
      this.name,
      arg.type,
      arg.id,
      JSON.stringify(arg.args)
    );
    this.delegateCallbackOrEventReplyTo(
      event,
      arg,
      callback
    );
  }
};
