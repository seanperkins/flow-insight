const { ipcMain } = require("electron"),
  log = require("electron-log"),
  Util = require("./Util"),
  WindowManager = require("./WindowManager");

/* 
 * an object class used to instantiate new event with callbacks.
 */
class MainEvent {
  /*
   * eventType: the name of the event to listen on
   * caller: parent object that created the event
   * callback: the function to dispatch
   * async: weather to send an async message back
   */
  constructor(eventType, caller, callback, reply, async) {
    log.info("create event : " + eventType);
    this.type = eventType;
    this.caller = caller;
    this.callback = callback;
    this.reply = reply;
    this.async = async;
    EventManager.initSender(this);
    EventManager.initReturnValues(this);
    EventManager.registerEvent(this);
  }

  /*
   * fires the event associated with the event's channel.
   */
  dispatch(arg) {
    return EventManager.dispatch(this.type, arg);
  }

  /*
   * called by the dispatch function of the Manager
   * arg: data object sent from the caller
   * event: the caller of this event callback
   */
  executeCb(event, arg) {
    log.info("execute callback -> " + this.type + " : " + arg);
    try {
      return this.callback(event, arg);
    } catch (e) {
      throw new EventCallbackException(this.type, e);
    }
  }
}

/*
 * Base Exception class for any specific type of event
 */
class EventException extends Error {
  constructor(event, ...args) {
    super(...args);
    this.class = "Error";
    this.name = "EventException";
    this.event = event;
    this.msg = this.message;
    this.date = new Date();
  }

  /*
   * returns the error in string format
   */
  toString() {
    return (
      "[ " +
      this.name +
      " :: " +
      this.event +
      " -> " +
      this.message +
      " @ " +
      Util.getDateTimeString(this.date) +
      " ]"
    );
  }
}

/*
 * Exception class to throw errors in Callback functions
 */
class EventCallbackException extends EventException {
  constructor(event, ...args) {
    super(event, ...args);
    this.name = "EventCallbackException";
  }
}

/*
 * Exception class to throw errors in Reply functions
 */
class EventReplyException extends EventException {
  constructor(event, ...args) {
    super(...args);
    this.name = "EventReplyException";
  }
}

/*
 * This class is used to managed the ipc events within the main process.
 * the helper class in ./src/EventManagerHelp is used to help look up
 * event names in the render process that are defined here. When creating
 * new events make sure to update both classes
 */
class EventManager {
  /*
   * Initialization method that creates an array to store events in
   */
  static init() {
    log.info("[EventManager] Initialize");
    this.events = [];
  }

  /*
   * Static array containing all of our events the app uses
   */
  static get Events() {
    return this.events;
  }

  /*
   * creates new sender object that can dispatch the event in a 
   * feedback loop. Useful for calling circular events within 
   * a state machine.
   */
  static initSender(event) {
    event.sender = {
      send: function(_eventType, _arg) {
        EventManager.dispatch(_eventType, _arg);
      }
    };
  }

  /*
   * creates returnValues object with null values. called when dispatching 
   * a new event channel
   */
  static initReturnValues(event) {
    event.returnValues = {
      callback: null,
      reply: null
    };
  }

  /*
   * adds new event into a global array to manage. There can exist multiple
   * events of the same name, and even same functions. They are referenced 
   * with variable pointers. The event should be store as a variable in the 
   * caller class
   */
  static registerEvent(mainEvent) {
    log.info("register event : " + mainEvent.type);
    mainEvent = this.createListener(mainEvent);
    ipcMain.on(mainEvent.type, mainEvent.listener);
    log.info("store event : " + mainEvent.type);
    this.events.push(mainEvent);
  }

  /*
   * creates the listener for renderer events, passes event and args. Any
   * exception is caught, logged, and returned as an object back to the 
   * EventManagerHelper for processing
   */
  static createListener(mainEvent) {
    mainEvent.listener = (event, arg) => {
      log.info("renderer event : " + mainEvent.type + " -> " + arg);
      try {
        let value = mainEvent.executeCb(mainEvent, arg);
        event.returnValue = value;
        if (mainEvent.async) {
          log.info("reply event -> " + mainEvent.type + " : " + value);
          event.sender.send(mainEvent.type + "-reply", value);
        }
      } catch (e) {
        log.error(e.toString() + "\n\n" + e.stack + "\n");
        event.returnValue = e;
      }
    };
    return mainEvent;
  }

  /*
   * removes an event from the global events registry. The event much match
   * the pointer to it. not by the name. Returns the event that was removed.
   */
  static unregisterEvent(event) {
    let index = this.events.indexOf(event);
    log.info("unregister event : " + event.type + " @ [" + index + "]");
    this.events.splice(index, 1);
    ipcMain.removeListener(event.type, event.listener);
    return event;
  }

  /*
   * removes the listeners and returns an empty object
   */
  static destroy(event) {
    this.unregisterEvent(event);
    for (let property in event) {
      delete event[property];
    }
    return null;
  }

  /*
   * called automatically if a reply function is specified
   * arg: data object sent from the caller
   * event: the caller of this event callback
   */
  static executeReply(event, arg) {
    log.info("execute reply -> " + event.type + "-reply : " + arg);
    try {
      return event.reply(event, arg);
    } catch (e) {
      throw new EventReplyException(event.type, e);
    }
  }

  /*
   * called to execute the event callback within main process threads
   */
  static dispatch(eventType, arg) {
    log.info("dispatch event : " + eventType);
    let returnedEvents = [];
    for (var i = 0; i < this.events.length; i++) {
      if (this.events[i].type === eventType) {
        log.info("found event : " + eventType);
        returnedEvents.push(this.handleEvent(this.events[i], arg));
      }
    }
    for (var j = 0; j < WindowManager.Windows.length; j++) {
      log.info("dispatch window event : " + eventType);
      WindowManager.Windows[j].window.webContents.send(eventType, arg);
    }
    return returnedEvents;
  }

  /*
   * handles the event dispatching by envoking the callback and reply functions
   */
  static handleEvent(event, arg) {
    this.initReturnValues(event);
    try {
      log.info("handle callback : " + event.type);
      event.returnValues.callback = event.executeCb(event, arg);
      if (event.reply) {
        log.info("handle reply : " + event.type + "-reply");
        event.returnValues.reply = this.executeReply(event, arg);
      }
    } catch (error) {
      this.handleError(event, error);
    } finally {
      return event;
    }
  }

  /*
   * handles and logs any errors that events might throw, and then stores
   * the exception as the return value for future procession in call stack
   */
  static handleError(event, error) {
    if (error instanceof EventCallbackException) {
      event.returnValues.callback = error;
    } else if (error instanceof EventReplyException) {
      event.returnValues.reply = error;
    }
    log.error(error.toString() + "\n\n" + error.stack + "\n");
  }

  /*
   * static enum subclass to store event names. These are basically the type
   * of possible events that can be dispatched by the Manager. When adding new 
   * events make sure to update this and ./src/EventManagerHelper 
   */
  static get EventTypes() {
    let prefix = "metaos-ipc-";
    return {
      TEST_EVENT: prefix + "test"
    };
  }
}

module.exports = {
  EventManager,
  MainEvent,
  EventCallbackException,
  EventReplyException
};
