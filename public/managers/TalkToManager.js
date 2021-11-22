const TalkToController = require("../controllers/TalkToController"),
  log = require("electron-log"),
  chalk = require("chalk");

/**
 * managing class for the talk to rest client for grid, these are async
 */
module.exports = class TalkToManager {
  /**
   * builds the talk to manager for the global app scope
   */
  constructor() {
    this.name = "[TalkToManager]";
    this.myController = new TalkToController(this);
    this.myController.configureEvents();
  }

  /**
   * function that is used to initialize the talk to manager
   * @param callback
   */
  init(callback) {
    this.handleInitCallback(callback);
  }

  /**
   * handles our callback in response from our controller event processing
   * @param callback
   */
  handleInitCallback(callback) {
    if (callback) {
      callback();
    }
  }

  /**
   * joins a talk room by a given uri id rather than by the actual string name.
   * The values known by the talkto manager and controller do not transmit the
   * actual string name over the join transaction between the shell, gridtime,
   * and talk
   * @param roomId
   */
  joinRoomById(roomId) {
    TalkToController.instance.handleJoinExistingRoomEvent(
      {},
      {
        id: roomId,
        type: TalkToController.Names.JOIN_EXISTING_ROOM,
        args: {
          roomName: roomId,
        },
      },
      (arg) => {
        log.info(
          chalk.green(this.name) +
            " joined -> " +
            JSON.stringify(arg)
        );
      }
    );
  }

  /**
   * the inverse of joinRoomById. Not yet implemented.
   * @param roomId
   */
  leaveRoomByIds(roomId) {
    console.log("!!! -> leaveTalkRoomById", roomId);
  }
};
