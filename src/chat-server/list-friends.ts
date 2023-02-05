import type { User } from '../user/user.js';
import { serverInstance as server } from './chat-server-script.js';
import type { IWebSocket } from '../protocol/ws-interface.js';
import type * as ServerInterfaceTypes from '../protocol/protocol-types-server.js';
import type * as ClientInterfaceTypes from '../protocol/protocol-types-client.js';
import { debug, sendPayLoad } from './server-dispatcher-functions.js';

/**
 * This functions send a user a list of his friends.
 *
 * @param {load} {This contains the username of the user who wants to get a list of his friends.}
 * @param {ws} {This is the IWebSocket this function needs to send a message back to the correct client}
 *
 */

export function listfriends(load: ClientInterfaceTypes.getList['payload'], ws: IWebSocket): void {
  const user: User | undefined = server.getUser(load.username);
  if (user === undefined) {
    const getListAnswer: ServerInterfaceTypes.getListSendback = {
      command: 'getListSendback',
      payload: { succeeded: false, typeOfFail: 'user is undefined', list: [] },
    };
    debug('send back statement in getList function');
    sendPayLoad(getListAnswer, ws);
    return;
  } else {
    const friendsList = user.getFriends();
    const stringList: string[] = [];
    for (const friend of friendsList) {
      stringList.push(friend.getName());
    }
    const getListAnswer: ServerInterfaceTypes.getListSendback = {
      command: 'getListSendback',
      payload: { succeeded: true, list: stringList },
    };
    debug('send back statement in getList function');
    sendPayLoad(getListAnswer, ws);
    return;
  }
}
