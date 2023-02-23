import { serverInstance as server } from '../server/chat-server-script.js';
import type { IWebSocket } from '../protocol/ws-interface.js';
import type * as ServerInterfaceTypes from '../protocol/server-types.js';
import type * as ClientInterfaceTypes from '../protocol/client-types.js';
import { debug, sendPayLoad } from './server-dispatcher-functions.js';

export function userExit(load: ClientInterfaceTypes.exitMe['payload'], ws: IWebSocket): void {
  debug(`inside exit function for person with name ${load.name}`);
  const checkPerson = server.getUser(load.name);
  if (checkPerson === undefined) {
    const loginAnswer: ServerInterfaceTypes.exitMeSendback = {
      command: 'exitMeSendback',
      payload: { succeeded: false, typeOfFail: 'userNotConnected' },
    };
    sendPayLoad(loginAnswer, ws);
    return;
  }
  if (checkPerson.isConnected()) {
    server.disconnectUser(checkPerson);
    const exitAnswer: ServerInterfaceTypes.exitMeSendback = {
      command: 'exitMeSendback',
      payload: { succeeded: true },
    };
    sendPayLoad(exitAnswer, ws);
    return;
  }
}
