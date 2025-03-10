import { BaseClient } from "./BaseClient";
import { RendererEventFactory } from "../events/RendererEventFactory";

/**
 * this class is used to converse with gridtime about fervie details
 */
export class FervieClient extends BaseClient {
  /**
   * stores the event replies for client events
   * @type {Map<any, any>}
   */
  static replies = new Map();

  /**
   * builds the Client for fervie requests in Gridtime
   * @param scope
   */
  constructor(scope) {
    super(scope, "[FervieClient]");
    this.event = RendererEventFactory.createEvent(
      RendererEventFactory.Events.FERVIE_CLIENT,
      this,
      null,
      this.onFervieEventReply
    );
  }

  /**
   * general enum list of all of our possible circuit events
   * @returns {{HAS_OUTGOING_PAIR_REQUEST:string, CANCEL_PAIR_REQUEST:string, SAVE_FERVIE_DETAILS: string, REQUEST_PAIR_LINK: string, CONFIRM_PAIR_LINK:string, STOP_PAIRING:string}}
   * @constructor
   */
  static get Events() {
    return {
      SAVE_FERVIE_DETAILS: "save-fervie-details",
      REQUEST_PAIR_LINK: "request-pair-link",
      CONFIRM_PAIR_LINK: "confirm-pair-link",
      STOP_PAIRING: "stop-pairing",
      CANCEL_PAIR_REQUEST: "cancel-pair-request",
      HAS_OUTGOING_PAIR_REQUEST: "has-outgoing-pair-request"
    };
  }

  /**
   * initializes the class in the current application context
   * @param scope
   */
  static init(scope) {
    if (!FervieClient.instance) {
      FervieClient.instance = new FervieClient(scope);
    }
  }

  /**
   * saves configured fervie details like color and accessories then pushes an update over talknet
   * @param fervieColor
   * @param fervieSecondaryColor
   * @param fervieTertiaryColor
   * @param fervieAccessory
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static saveFervieDetails(
    fervieColor,
    fervieSecondaryColor,
    fervieTertiaryColor,
    fervieAccessory,
    scope,
    callback
  ) {
    let event = FervieClient.instance.createClientEvent(
      FervieClient.Events.SAVE_FERVIE_DETAILS,
      {
        fervieColor: fervieColor,
        fervieSecondaryColor: fervieSecondaryColor,
        fervieTertiaryColor: fervieTertiaryColor,
        fervieAccessory: fervieAccessory,
      },
      scope,
      callback
    );

    FervieClient.instance.notifyFervie(event);
    return event;
  }

  /**
   * Create a pairing link with the specified team member
   * @param memberId
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static requestPairingLink(memberId, scope, callback) {
    let event = FervieClient.instance.createClientEvent(
      FervieClient.Events.REQUEST_PAIR_LINK,
      {
        memberId: memberId,
      },
      scope,
      callback
    );

    FervieClient.instance.notifyFervie(event);
    return event;
  }

  /**
   * Get outgoing pairing request for a specific user
   * @param memberId
   * @param scope
   * @param callback
   */
  static hasOutgoingPairingRequest(memberId, scope, callback) {
    let event = FervieClient.instance.createClientEvent(
      FervieClient.Events.HAS_OUTGOING_PAIR_REQUEST,
      {
        memberId: memberId,
      },
      scope,
      callback
    );

    FervieClient.instance.notifyFervie(event);
    return event;
  }


  /**
   * Cancel a pair request to a specified team member
   * @param memberId
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static cancelPairRequest(memberId, scope, callback) {
    let event = FervieClient.instance.createClientEvent(
      FervieClient.Events.CANCEL_PAIR_REQUEST,
      {
        memberId: memberId,
      },
      scope,
      callback
    );

    FervieClient.instance.notifyFervie(event);
    return event;
  }

  /**
   * Create a pairing link with the specified team member
   * @param fromMemberId
   * @param toMemberId
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static confirmPairingLink(
    fromMemberId,
    toMemberId,
    scope,
    callback
  ) {
    let event = FervieClient.instance.createClientEvent(
      FervieClient.Events.CONFIRM_PAIR_LINK,
      {
        fromMemberId: fromMemberId,
        toMemberId: toMemberId,
      },
      scope,
      callback
    );

    FervieClient.instance.notifyFervie(event);
    return event;
  }

  /**
   * Stop pairing and break away from any existing pairing networks
   * @param scope
   * @param callback
   * @returns {RendererClientEvent}
   */
  static stopPairing(scope, callback) {
    let event = FervieClient.instance.createClientEvent(
      FervieClient.Events.STOP_PAIRING,
      {},
      scope,
      callback
    );

    FervieClient.instance.notifyFervie(event);
    return event;
  }

  /**
   * the event callback used by the event manager. removes the event from
   * the local map when its recieved the response from the main process. the
   * call back is bound to the scope of what was pass into the api of this client
   * @param event
   * @param arg
   */
  onFervieEventReply = (event, arg) => {
    let clientEvent = FervieClient.replies.get(arg.id);
    this.logReply(
      FervieClient.name,
      FervieClient.replies.size,
      arg.id,
      arg.type
    );
    if (clientEvent) {
      FervieClient.replies.delete(arg.id);
      clientEvent.callback(event, arg);
    }
  };

  /**
   * notifies the main process fervie that we have a new event to process. This
   * function will add the client event and callback into a map to look up when
   * this events reply is ready from the main prcess thread
   * @param clientEvent
   */
  notifyFervie(clientEvent) {
    console.log(
      "[" +
        FervieClient.name +
        "] notify -> " +
        JSON.stringify(clientEvent)
    );
    FervieClient.replies.set(clientEvent.id, clientEvent);
    this.event.dispatch(clientEvent, true);
  }
}
