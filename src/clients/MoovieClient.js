import { BaseClient } from "./BaseClient";
import { RendererEventFactory } from "../events/RendererEventFactory";

/**
 * this class is used to converse with gridtime about moovies
 */
export class MoovieClient extends BaseClient {
  /**
   * stores the event replies for client events
   * @type {Map<any, any>}
   */
  static replies = new Map();

  /**
   * builds the Client for moovie requests in Gridtime
   * @param scope
   */
  constructor(scope) {
    super(scope, "[MoovieClient]");
    this.event = RendererEventFactory.createEvent(
      RendererEventFactory.Events.MOOVIE_CLIENT,
      this,
      null,
      this.onMoovieEventReply
    );
  }

  /**
   * general enum list of all of our possible circuit events
   * @constructor
   */
  static get Events() {
    return {
      CREATE_MOOVIE_CIRCUIT: "create-moovie-circuit",
      GET_MOOVIE_CIRCUITS: "get-moovie-circuits",
      GET_MOOVIE_CIRCUIT: "get-moovie-circuit",
      JOIN_MOOVIE: "join-moovie",
      LEAVE_MOOVIE: "leave-moovie",
      START_MOOVIE: "start-moovie",
      PAUSE_MOOVIE: "pause-moovie",
      RESUME_MOOVIE: "resume-moovie"
    };
  }

  /**
   * initializes the class in the current application context
   * @param scope
   */
  static init(scope) {
    if (!MoovieClient.instance) {
      MoovieClient.instance = new MoovieClient(scope);
    }
  }

  /**
   * Creates a new moovie room to be listed on the available moovies, that others can join
   * @param title
   * @param year
   * @param link
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static createMoovieCircuit(
    title,
    year,
    link,
    scope,
    callback
  ) {
    let event = MoovieClient.instance.createClientEvent(
      MoovieClient.Events.CREATE_MOOVIE_CIRCUIT,
      {
        title: title,
        year: year,
        link: link
      },
      scope,
      callback
    );

    MoovieClient.instance.notifyMoovie(event);
    return event;
  }

  /**
   * Get a list of all available open moovie circuits
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static getMoovieCircuits(
    scope,
    callback
  ) {
    let event = MoovieClient.instance.createClientEvent(
      MoovieClient.Events.GET_MOOVIE_CIRCUITS,
      {},
      scope,
      callback
    );

    MoovieClient.instance.notifyMoovie(event);
    return event;
  }


  /**
   * Get a specific movie circuit
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static getMoovieCircuit(
    circuitId,
    scope,
    callback
  ) {
    let event = MoovieClient.instance.createClientEvent(
      MoovieClient.Events.GET_MOOVIE_CIRCUIT,
      {circuitId: circuitId},
      scope,
      callback
    );

    MoovieClient.instance.notifyMoovie(event);
    return event;
  }

  /**
   * Add self to the specified moovie circuit
   * @param circuitId
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static joinMoovie(
    circuitId,
    scope,
    callback
  ) {
    let event = MoovieClient.instance.createClientEvent(
      MoovieClient.Events.JOIN_MOOVIE,
      {circuitId: circuitId},
      scope,
      callback
    );

    MoovieClient.instance.notifyMoovie(event);
    return event;
  }

  /**
   * Leave the specified moovie circuit
   * @param circuitId
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static leaveMoovie(
    circuitId,
    scope,
    callback
  ) {
    let event = MoovieClient.instance.createClientEvent(
      MoovieClient.Events.LEAVE_MOOVIE,
      {circuitId: circuitId},
      scope,
      callback
    );

    MoovieClient.instance.notifyMoovie(event);
    return event;
  }

  /**
   * Starts the timer for the specified moovie, must be joined to start the timer
   * @param circuitId
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static startMoovie(
    circuitId,
    scope,
    callback
  ) {
    let event = MoovieClient.instance.createClientEvent(
      MoovieClient.Events.START_MOOVIE,
      {circuitId: circuitId},
      scope,
      callback
    );

    MoovieClient.instance.notifyMoovie(event);
    return event;
  }

  /**
   * Pauses the timer for the specified moovie, must be joined to pause the timer
   * @param circuitId
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static pauseMoovie(
    circuitId,
    scope,
    callback
  ) {
    let event = MoovieClient.instance.createClientEvent(
      MoovieClient.Events.PAUSE_MOOVIE,
      {circuitId: circuitId},
      scope,
      callback
    );

    MoovieClient.instance.notifyMoovie(event);
    return event;
  }

  /**
   * Resumes the timer for the specified moovie, must be joined to resume the timer
   * @param circuitId
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static resumeMoovie(
    circuitId,
    scope,
    callback
  ) {
    let event = MoovieClient.instance.createClientEvent(
      MoovieClient.Events.RESUME_MOOVIE,
      {circuitId: circuitId},
      scope,
      callback
    );

    MoovieClient.instance.notifyMoovie(event);
    return event;
  }

  /**
   * the event callback used by the event manager. removes the event from
   * the local map when its recieved the response from the main process. the
   * call back is bound to the scope of what was pass into the api of this client
   * @param event
   * @param arg
   */
  onMoovieEventReply = (event, arg) => {
    let clientEvent = MoovieClient.replies.get(arg.id);
    this.logReply(
      MoovieClient.name,
      MoovieClient.replies.size,
      arg.id,
      arg.type
    );
    if (clientEvent) {
      MoovieClient.replies.delete(arg.id);
      clientEvent.callback(event, arg);
    }
  };


  /**
   * notifies the main process moovie that we have a new event to process. This
   * function will add the client event and callback into a map to look up when
   * this events reply is ready from the main prcess thread
   * @param clientEvent
   */
  notifyMoovie(clientEvent) {
    console.log(
      "[" +
        MoovieClient.name +
        "] notify -> " +
        JSON.stringify(clientEvent)
    );
    MoovieClient.replies.set(clientEvent.id, clientEvent);
    this.event.dispatch(clientEvent, true);
  }
}
