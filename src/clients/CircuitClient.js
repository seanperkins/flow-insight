import { BaseClient } from "./BaseClient";
import { RendererEventFactory } from "../events/RendererEventFactory";
import { RendererClientEvent } from "../events/RendererClientEvent";
import { LearningCircuitModel } from "../models/LearningCircuitModel";

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
   * our circuit event listeners that other classes use
   * @type {*}
   */
  static listeners = [];

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
  }

  /**
   * general enum list of all of our possible circuit events
   * @returns {{LOAD_ALL_MY_DO_IT_LATER_CIRCUITS: string, LOAD_ALL_MY_PARTICIPATING_CIRCUITS: string, LOAD_CIRCUIT_WITH_ALL_DETAILS: string, CREATE_CIRCUIT: string, LOAD_ACTIVE_CIRCUIT: string}}
   * @constructor
   */
  static get Events() {
    return {
      LOAD_ALL_MY_PARTICIPATING_CIRCUITS: "load-all-my-participating-circuits",
      LOAD_ALL_MY_DO_IT_LATER_CIRCUITS: "load-all-my-do-it-later-circuits",
      LOAD_ACTIVE_CIRCUIT: "load-active-circuit",
      LOAD_CIRCUIT_WITH_ALL_DETAILS: "load-circuit-with-all-details"
    };
  }

  /**
   * initializes the class in the current application context
   * @param scope
   */
  static init(scope) {
    if (!CircuitClient.instance) {
      CircuitClient.instance = new CircuitClient(scope);
    }
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
    console.log(
      "[" +
        CircuitClient.name +
        "] reply {" +
        CircuitClient.replies.size +
        "} : " +
        arg.id +
        " -> " +
        arg.type
    );
    if (clientEvent) {
      CircuitClient.replies.delete(arg.id);
    }
    clientEvent.callback(event, arg);
    this.notifyListeners(clientEvent);
  };

  /**
   * notifies the main process circuit that we have a new event to process. This
   * function will add the client event and callback into a map to look up when
   * this events reply is ready from the main prcess thread
   * @param clientEvent
   */
  notifyCircuit(clientEvent) {
    console.log(
      "[" + CircuitClient.name + "] notify -> " + JSON.stringify(clientEvent)
    );
    CircuitClient.replies.set(clientEvent.id, clientEvent);
    this.event.dispatch(clientEvent, true);
  }

  /**
   * notifies any additional listeners that we have recieved some new data from the
   * circuit controller
   * @param clientEvent
   */
  notifyListeners(clientEvent) {
    console.log(
      "[" +
        CircuitClient.name +
        "] notify listeners {" +
        CircuitClient.listeners.length +
        "}-> " +
        JSON.stringify(clientEvent)
    );
    for (var i = CircuitClient.listeners.length - 1; i >= 0; i--) {
      let listener = CircuitClient.listeners[i];
      console.log(listener);

      // TODO this needs execute the callback of this listener
    }
  }

  /**
   * registers a new listener that is associated to a given client event. These listeners
   * are wrapped as client events to maintain consistency
   * @param clientEvent
   */
  registerListener(clientEvent) {
    console.log(
      "[" + CircuitClient.name + "] register -> " + JSON.stringify(clientEvent)
    );
    CircuitClient.listeners.push(clientEvent);
  }

  /**
   * removes the listener from our memory. this is important
   * @param clientEvent
   */
  unregisterListener(clientEvent) {
    console.log(
      "[" +
        CircuitClient.name +
        "] unregister {" +
        CircuitClient.listeners.length +
        "} -> " +
        JSON.stringify(clientEvent)
    );
    for (var i = CircuitClient.listeners.length - 1; i >= 0; i--) {
      console.log(CircuitClient.listeners[i]);
      if (clientEvent === CircuitClient.listeners[i]) {
        CircuitClient.listeners.splice(i, 1);
      }
    }
  }
}
