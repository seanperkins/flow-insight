const { ipcMain } = require("electron"),
  log = require("electron-log"),
  Util = require("../Util"),
  App = require("../app/App");

/* 
 * an object class used to instantiate new event with callbacks.
 */
class MainEvent {
  /*
   * eventType: the name of the event to listen on
   * scope: parent object that created the event
   * callback: the function to dispatch
   * reply: the reply function to dispatch
   * async: true to send an async message back
   */
  constructor(eventType, scope, callback, reply, async) {
    log.info("[EventManager] create event : " + eventType);
    this.type = eventType;
    this.scope = scope;
    this.callback = callback;
    this.reply = reply;
    this.async = async;
    global.App.EventManager.initSender(this);
    global.App.EventManager.initReturnValues(this);
    global.App.EventManager.register(this);
  }

  /*
   * fires the event associated with the event's channel.
   */
  dispatch(arg) {
    return EventManager.dispatch(this.type, arg);
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
    super(event, ...args);
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
  constructor() {
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
  initSender(event) {
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
  initReturnValues(event) {
    event.returnValues = {
      callback: null,
      reply: null
    };
  }

  /*
   * adds new event into a global array to manage. There can exist multiple
   * events of the same name, and even same functions. They are referenced 
   * with variable pointers. The event should be store as a variable in the 
   * scope class
   */
  register(event) {
    log.info("[EventManager] register event : " + event.type);
    event = this.createListener(event);
    ipcMain.on(event.type, event.listener);
    log.info("[EventManager] store event : " + event.type);
    this.events.push(event);
  }

  /*
   * creates the listener for renderer events, passes event and args. Any
   * exception is caught, logged, and returned as an object back to the 
   * EventManagerHelper for processing
   */
  createListener(event) {
    event.listener = (_event, _arg) => {
      log.info("[EventManager] renderer event : " + event.type + " -> " + _arg);
      try {
        let value = EventManager.executeCallback(event, _arg);
        _event.returnValue = value;
        if (event.async) {
          log.info(
            "[EventManager] reply event -> " + event.type + " : " + value
          );
          _event.sender.send(event.type + "-reply", value);
        }
      } catch (e) {
        log.error("[EventManager] " + e.toString() + "\n\n" + e.stack + "\n");
        _event.returnValue = e;
      }
    };
    return event;
  }

  /*
   * removes an event from the global events registry. The event much match
   * the pointer to it. not by the name. Returns the event that was removed.
   */
  unregister(event) {
    let index = this.events.indexOf(event);
    log.info(
      "[EventManager] unregister event : " + event.type + " @ [" + index + "]"
    );
    this.events.splice(index, 1);
    ipcMain.removeListener(event.type, event.listener);
    return event;
  }

  /*
   * removes the listeners and returns an empty object
   */
  destroy(event) {
    log.info("[EventManager] destroy event : " + event.type);
    this.unregister(event);
    for (let property in event) {
      delete event[property];
    }
    return null;
  }

  /*
   * called by the dispatch function of the Manager
   * arg: data object sent from the scope
   * event: the scope of this event callback
   */
  executeCallback(event, arg) {
    log.info("[EventManager] execute callback -> " + event.type + " : " + arg);
    try {
      if (event.callback) return event.callback(event, arg);
    } catch (e) {
      throw new EventCallbackException(event.type, e);
    }
  }

  /*
   * called automatically if a reply function is specified
   * arg: data object sent from the scope
   * event: the scope of this event callback
   */
  executeReply(event, arg) {
    log.info(
      "[EventManager] execute reply -> " + event.type + "-reply : " + arg
    );
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
    log.info("[EventManager] dispatch event : " + eventType);
    let windows = global.App.WindowManager.windows,
      manager = global.App.EventManager,
      returnedEvents = [];
    for (var i = 0; i < manager.events.length; i++) {
      if (manager.events[i].type === eventType) {
        returnedEvents.push(manager.handleEvent(manager.events[i], arg));
      }
    }
    if (returnedEvents.length === 0) {
      log.info("[EventManager] no events found : " + eventType);
      return [];
    }
    log.info(
      "[EventManager] handled {" +
        returnedEvents.length +
        "} events : " +
        eventType
    );
    for (var j = 0; j < windows.length; j++) {
      windows[j].window.webContents.send(eventType, arg);
    }
    log.info(
      "[EventManager] dispatched {" +
        windows.length +
        "} window events : " +
        eventType
    );
    return returnedEvents;
  }

  /*
   * handles the event dispatching by envoking the callback and reply functions
   */
  handleEvent(event, arg) {
    this.initReturnValues(event);
    try {
      log.info("[EventManager] handle callback : " + event.type);
      event.returnValues.callback = this.executeCallback(event, arg);
      if (event.reply) {
        log.info("[EventManager] handle reply : " + event.type + "-reply");
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
  // TODO this should use global.App.handleError()
  handleError(event, error) {
    if (error instanceof EventCallbackException) {
      event.returnValues.callback = error;
    } else if (error instanceof EventReplyException) {
      event.returnValues.reply = error;
    }
    log.error(
      "[EventManager] " + error.toString() + "\n\n" + error.stack + "\n"
    );
  }
}

module.exports = {
  EventManager,
  MainEvent,
  EventCallbackException,
  EventReplyException
};
