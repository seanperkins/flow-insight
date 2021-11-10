import { BaseClient } from "./BaseClient";
import { RendererEventFactory } from "../events/RendererEventFactory";

/**
 * the client which is used to make circuit requests to gridtime. Basically we
 * will use this class to fire an event which the main process listens for. On
 * notification it will make a rest call to grid time. the response is the
 * piped into the calling function to this client.
 *
 * EXAMPLE:
 *
 * `CircuitClient.createLearningCircuitModel("angry_teachers", this, model => {
 *     console.log(model);
 *   });`
 */
export class CircuitClient extends BaseClient {
  /**
   * stores the event replies for client events
   * @type {Map<any, any>}
   */
  static replies = new Map();

  /**
   * our current active circuit assigned by grid time
   * @type {LearningCircuitDto}
   */
  static activeCircuit = null;

  /**
   * builds the Client for a Circuit in Gridtime
   * @param scope
   */
  constructor(scope) {
    super(scope, "[CircuitClient]");
    this.event = RendererEventFactory.createEvent(
      RendererEventFactory.Events.CIRCUIT_CLIENT,
      this,
      null,
      this.onCircuitEventReply
    );
    this.circuitStartStopNotifier = RendererEventFactory.createEvent(
      RendererEventFactory.Events
        .VIEW_CONSOLE_CIRCUIT_START_STOP,
      this,
      this.handleCircuitStartStopCallback
    );

    this.circuitPauseResumeNotifier = RendererEventFactory.createEvent(
      RendererEventFactory.Events
        .VIEW_CONSOLE_CIRCUIT_PAUSE_RESUME,
      this,
      this.handleCircuitStartStopCallback
    );

    this.circuitJoinLeaveNotifier = RendererEventFactory.createEvent(
      RendererEventFactory.Events
        .VIEW_CONSOLE_CIRCUIT_JOIN_LEAVE,
      this,
      this.handleCircuitStartStopCallback
    );

    this.circuitSolveNotifier = RendererEventFactory.createEvent(
      RendererEventFactory.Events
        .VIEW_CONSOLE_CIRCUIT_SOLVE,
      this,
      this.handleCircuitStartStopCallback
    );
  }

  /**
   * callback handler for our circuit stop start alarm that is notified. What we do
   * is check the argument which is an integer. This integer is positive for an an
   * active alarm. For now 1 represents a wtf, and -1 clears the alarm. Please note
   * that this negative value could be used to trigger additional levels of detail.
   * @param event
   * @param arg
   */
  handleCircuitStartStopCallback = (event, arg) => {
    if (arg < 0) {
      CircuitClient.activeCircuit = null;
    }
  };

  /**
   * notifies the system know we are starting a wtf session
   */
  static fireCircuitStartNotifyEvent() {
    CircuitClient.instance.circuitStartStopNotifier.dispatch(
      1
    );
  }

  /**
   * general enum list of all of our possible circuit events
   * @returns {{LOAD_CIRCUIT_MEMBERS: string, LOAD_ALL_MY_DO_IT_LATER_CIRCUITS: string, LOAD_ALL_MY_RETRO_CIRCUITS: string, LOAD_ALL_MY_PARTICIPATING_CIRCUITS: string, PAUSE_WTF_WITH_DO_IT_LATER: string, SOLVE_WTF: string, GET_ALL_MY_RETRO_CIRCUITS: string, GET_CIRCUIT_MEMBERS: string, CANCEL_WTF: string, START_WTF: string, GET_CIRCUIT_WITH_ALL_DETAILS: string, LOAD_ACTIVE_CIRCUIT: string, LEAVE_WTF: string, GET_ACTIVE_CIRCUIT: string, START_WTF_WITH_CUSTOM_CIRCUIT_NAME: string, GET_ALL_MY_PARTICIPATING_CIRCUITS: string, LOAD_CIRCUIT_WITH_ALL_DETAILS: string, JOIN_WTF: string, GET_ALL_MY_DO_IT_LATER_CIRCUITS: string, RESUME_WTF: string}}
   * @constructor
   */
  static get Events() {
    return {
      START_WTF: "start-wtf",
      START_WTF_WITH_CUSTOM_CIRCUIT_NAME:
        "start-wtf-with-custom-circuit-name",
      JOIN_WTF: "join-wtf",
      LEAVE_WTF: "leave-wtf",
      LOAD_ALL_MY_PARTICIPATING_CIRCUITS:
        "load-all-my-participating-circuits",
      LOAD_ALL_MY_DO_IT_LATER_CIRCUITS:
        "load-all-my-do-it-later-circuits",
      LOAD_ALL_MY_RETRO_CIRCUITS:
        "load-all-my-retro-circuits",
      LOAD_ALL_MY_SOLVED_CIRCUITS:
        "load-all-my-solved-circuits",
      LOAD_ACTIVE_CIRCUIT: "load-active-circuit",
      LOAD_CIRCUIT_WITH_ALL_DETAILS:
        "load-circuit-with-all-details",
      LOAD_CIRCUIT_MEMBERS: "load-circuit-members",
      GET_ALL_MY_PARTICIPATING_CIRCUITS:
        "get-all-my-participating-circuits",
      GET_ALL_MY_DO_IT_LATER_CIRCUITS:
        "get-all-my-do-it-later-circuits",
      GET_ALL_MY_RETRO_CIRCUITS:
        "get-all-my-retro-circuits",
      GET_ACTIVE_CIRCUIT: "get-active-circuit",
      GET_CIRCUIT_WITH_ALL_DETAILS:
        "get-circuit-with-all-details",
      GET_CIRCUIT_MEMBERS: "get-circuit-members",
      SOLVE_WTF: "solve-wtf",
      CANCEL_WTF: "cancel-wtf",
      CLOSE_WTF: "close-wtf",
      RESUME_WTF: "resume-wtf",
      START_RETRO_FOR_WTF: "start-retro-for-wtf",
      PAUSE_WTF_WITH_DO_IT_LATER:
        "pause-wtf-with-do-it-later",
      UPDATE_CIRCUIT_DESCRIPTION:
        "update-circuit-description"
    };
  }

  /**
   * initializes the class in the current application context
   * @param scope
   */
  static init(scope) {
    if (!CircuitClient.instance) {
      CircuitClient.instance = new CircuitClient(scope);
      CircuitClient.getActiveCircuit(this, arg => {
        let circuit = arg.data[0];
        if (circuit) {
          CircuitClient.activeCircuit = circuit;
          CircuitClient.fireCircuitStartNotifyEvent();
        } else {
          CircuitClient.activeCircuit = null;
        }
      });
    }
  }

  /**
   * starts a new wtf session by creating a new learning circuit on gridtime
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static startWtf(scope, callback) {
    let event = CircuitClient.instance.createClientEvent(
      CircuitClient.Events.START_WTF,
      {},
      scope,
      callback
    );
    CircuitClient.instance.notifyCircuit(event);
    return event;
  }

  /**
   * starts a new wtf session with a custom name by creating a bnew learning circuit in gridtime.
   * @param circuitName
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static startWtfWithCustomCircuitName(
    circuitName,
    scope,
    callback
  ) {
    let event = CircuitClient.instance.createClientEvent(
      CircuitClient.Events
        .START_WTF_WITH_CUSTOM_CIRCUIT_NAME,
      { circuitName: circuitName },
      scope,
      callback
    );
    CircuitClient.instance.notifyCircuit(event);
    return event;
  }

  /**
   * loads all of our participating circuits we have joined into our local database
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static loadAllMyParticipatingCircuits(scope, callback) {
    let event = CircuitClient.instance.createClientEvent(
      CircuitClient.Events
        .LOAD_ALL_MY_PARTICIPATING_CIRCUITS,
      {},
      scope,
      callback
    );
    CircuitClient.instance.notifyCircuit(event);
    return event;
  }

  /**
   * loads all of our do it later circuits into our local database
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static loadAllMyDoItLaterCircuits(scope, callback) {
    let event = CircuitClient.instance.createClientEvent(
      CircuitClient.Events.LOAD_ALL_MY_DO_IT_LATER_CIRCUITS,
      {},
      scope,
      callback
    );
    CircuitClient.instance.notifyCircuit(event);
    return event;
  }

  /**
   * loads all of our retro circuits into our local database
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static loadAllMyRetroCircuits(scope, callback) {
    let event = CircuitClient.instance.createClientEvent(
      CircuitClient.Events.LOAD_ALL_MY_RETRO_CIRCUITS,
      {},
      scope,
      callback
    );
    CircuitClient.instance.notifyCircuit(event);
    return event;
  }

  /**
   * loads our active circuit into our local database with members. This
   * is accomplished by making two requests chained together. The first
   * request gets our active circuit information. The subsequent request get
   * our member information -- who is in the circuit.
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static loadActiveCircuit(scope, callback) {
    let event = CircuitClient.instance.createClientEvent(
      CircuitClient.Events.LOAD_ACTIVE_CIRCUIT,
      {},
      scope,
      callback
    );
    CircuitClient.instance.notifyCircuit(event);
    return event;
  }

  /**
   * loads a team learning circuit by its circuit name with members into
   * our local database from grid time. This is usually called by our
   * load active circuit function.
   * @param circuitName
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static loadCircuitWithAllDetails(
    circuitName,
    scope,
    callback
  ) {
    let event = CircuitClient.instance.createClientEvent(
      CircuitClient.Events.LOAD_CIRCUIT_WITH_ALL_DETAILS,
      { circuitName: circuitName },
      scope,
      callback
    );
    CircuitClient.instance.notifyCircuit(event);
    return event;
  }

  /**
   * loads circuit members for a given circuit from gridtime. These data
   * sets are updated  dynamically with talk messages. The uri argument is
   * used by the controller and database to locate the correct collection
   * associated with the circuit. Similiar to how the TalkTo controller works.
   * @param circuitName
   * @param uri
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static loadCircuitMembers(
    circuitName,
    uri,
    scope,
    callback
  ) {
    let event = CircuitClient.instance.createClientEvent(
      CircuitClient.Events.LOAD_CIRCUIT_MEMBERS,
      { circuitName: circuitName, uri: uri },
      scope,
      callback
    );
    CircuitClient.instance.notifyCircuit(event);
    return event;
  }

  /**
   * gets all of our participating circuits from our local db
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static getAllMyLiveCircuits(scope, callback) {
    let event = CircuitClient.instance.createClientEvent(
      CircuitClient.Events
        .GET_ALL_MY_PARTICIPATING_CIRCUITS,
      {},
      scope,
      callback
    );
    CircuitClient.instance.notifyCircuit(event);
    return event;
  }

  /**
   * gets all of our circuits that are on hold we are part of
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static getAllMyDoItLaterCircuits(scope, callback) {
    let event = CircuitClient.instance.createClientEvent(
      CircuitClient.Events.GET_ALL_MY_DO_IT_LATER_CIRCUITS,
      {},
      scope,
      callback
    );
    CircuitClient.instance.notifyCircuit(event);
    return event;
  }

  /**
   * gets all of our circuits that are on hold we are part of
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static getAllMyRetroCircuits(scope, callback) {
    let event = CircuitClient.instance.createClientEvent(
      CircuitClient.Events.GET_ALL_MY_RETRO_CIRCUITS,
      {},
      scope,
      callback
    );
    CircuitClient.instance.notifyCircuit(event);
    return event;
  }

  /**
   * gets our active circuit from what is loaded in our local database
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static getActiveCircuit(scope, callback) {
    let event = CircuitClient.instance.createClientEvent(
      CircuitClient.Events.GET_ACTIVE_CIRCUIT,
      {},
      scope,
      callback
    );
    CircuitClient.instance.notifyCircuit(event);
    return event;
  }

  /**
   * gets our circuit with all member details from our local database. this assumes
   * that the data is loaded. if not it will load a copy from gridtime
   * @param circuitName
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static getCircuitWithAllDetails(
    circuitName,
    scope,
    callback
  ) {
    let event = CircuitClient.instance.createClientEvent(
      CircuitClient.Events.GET_CIRCUIT_WITH_ALL_DETAILS,
      { circuitName: circuitName },
      scope,
      callback
    );
    CircuitClient.instance.notifyCircuit(event);
    return event;
  }

  /**
   * gets the members for a given circuit. The controller will call load if
   * needed.
   * @param circuitName
   * @param uri
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static getCircuitMembers(
    circuitName,
    uri,
    scope,
    callback
  ) {
    let event = CircuitClient.instance.createClientEvent(
      CircuitClient.Events.GET_CIRCUIT_MEMBERS,
      { circuitName: circuitName, uri: uri },
      scope,
      callback
    );
    CircuitClient.instance.notifyCircuit(event);
    return event;
  }

  /**
   * joins the member to the circuit name through the backend controller
   * @param circuitName
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static joinWtf(circuitName, scope, callback) {
    let event = CircuitClient.instance.createClientEvent(
      CircuitClient.Events.JOIN_WTF,
      { circuitName: circuitName },
      scope,
      callback
    );
    CircuitClient.instance.notifyCircuit(event);
    return event;
  }

  /**
   * removes the member to the circuit name through the backend controller
   * @param circuitName
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static leaveWtf(circuitName, scope, callback) {
    let event = CircuitClient.instance.createClientEvent(
      CircuitClient.Events.LEAVE_WTF,
      { circuitName: circuitName },
      scope,
      callback
    );
    CircuitClient.instance.notifyCircuit(event);
    return event;
  }

  /**
   * solves our a circuit on grid time
   * @param circuitName
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static solveWtf(circuitName, scope, callback) {
    let event = CircuitClient.instance.createClientEvent(
      CircuitClient.Events.SOLVE_WTF,
      { circuitName: circuitName },
      scope,
      callback
    );
    CircuitClient.instance.notifyCircuit(event);
    return event;
  }


  /**
   * start retro for our a circuit on grid time
   * @param circuitName
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static startRetro(circuitName, scope, callback) {
    let event = CircuitClient.instance.createClientEvent(
      CircuitClient.Events.START_RETRO_FOR_WTF,
      { circuitName: circuitName },
      scope,
      callback
    );
    CircuitClient.instance.notifyCircuit(event);
    return event;
  }

  /**
   * cancel's our current circuit on grid time
   * @param circuitName
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static cancelWtf(circuitName, scope, callback) {
    let event = CircuitClient.instance.createClientEvent(
      CircuitClient.Events.CANCEL_WTF,
      { circuitName: circuitName },
      scope,
      callback
    );
    CircuitClient.instance.notifyCircuit(event);
    return event;
  }

  /**
   * close our current circuit on grid time
   * @param circuitName
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static closeWtf(circuitName, scope, callback) {
    let event = CircuitClient.instance.createClientEvent(
      CircuitClient.Events.CLOSE_WTF,
      { circuitName: circuitName },
      scope,
      callback
    );
    console.log("notify on close");
    CircuitClient.instance.notifyCircuit(event);
    return event;
  }

  /**
   * resumes a given circuit from whatever on_hold  status that it may
   * have.
   * @param circuitName
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static resumeWtf(circuitName, scope, callback) {
    let event = CircuitClient.instance.createClientEvent(
      CircuitClient.Events.RESUME_WTF,
      { circuitName: circuitName },
      scope,
      callback
    );
    CircuitClient.instance.notifyCircuit(event);
    return event;
  }

  /**
   * pauses the given circuit and sets the status to ON_HOLD which is
   * also known as do it later.
   * @param circuitName
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static pauseWTFWithDoItLater(
    circuitName,
    scope,
    callback
  ) {
    let event = CircuitClient.instance.createClientEvent(
      CircuitClient.Events.PAUSE_WTF_WITH_DO_IT_LATER,
      { circuitName: circuitName },
      scope,
      callback
    );
    CircuitClient.instance.notifyCircuit(event);
    return event;
  }

  /**
   * Updates the description name of the specified circuit
   * also known as do it later.
   * @param circuitName
   * @param description
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static updateCircuitDescription(
    circuitName,
    description,
    scope,
    callback
  ) {
    let event = CircuitClient.instance.createClientEvent(
      CircuitClient.Events.UPDATE_CIRCUIT_DESCRIPTION,
      {
        circuitName: circuitName,
        description: description
      },
      scope,
      callback
    );
    CircuitClient.instance.notifyCircuit(event);
    return event;
  }

  /**
   * the event callback used by the event manager. removes the event from
   * the local map when its recieved the response from the main process. the
   * call back is bound to the scope of what was pass into the api of this client
   * @param event
   * @param arg
   */
  onCircuitEventReply = (event, arg) => {
    let clientEvent = CircuitClient.replies.get(arg.id);
    this.logReply(
      CircuitClient.name,
      CircuitClient.replies.size,
      arg.id,
      arg.type
    );
    if (clientEvent) {
      CircuitClient.replies.delete(arg.id);
    }
    clientEvent.callback(event, arg);
  };

  /**
   * notifies the main process circuit that we have a new event to process. This
   * function will add the client event and callback into a map to look up when
   * this events reply is ready from the main prcess thread
   * @param clientEvent
   */
  notifyCircuit(clientEvent) {
    console.log(
      "[" +
        CircuitClient.name +
        "] notify -> " +
        JSON.stringify(clientEvent)
    );
    CircuitClient.replies.set(clientEvent.id, clientEvent);
    this.event.dispatch(clientEvent, true);
  }
}
