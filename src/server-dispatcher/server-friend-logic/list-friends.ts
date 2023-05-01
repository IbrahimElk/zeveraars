import type { User } from '../../objects/user/user.js';
import type { IWebSocket } from '../../front-end/proto/ws-interface.js';
import type * as ServerInterfaceTypes from '../../front-end/proto/server-types.js';
import type * as ClientInterfaceTypes from '../../front-end/proto/client-types.js';
import type { ChatServer } from '../../server/chat-server.js';

export async function listfriends(
  load: ClientInterfaceTypes.getList['payload'],
  chatServer: ChatServer,
  ws: IWebSocket
): Promise<void> {
  const user: User | undefined = await chatServer.getUserBySessionID(load.sessionID);
  if (user === undefined) {
    sendFail(ws, 'nonExistingUsername');
    return;
  } else {
    const friendsListUuid = user.getFriends();
    const stringList: { friendname: string; friendID: string }[] = [];
    for (const uuid of friendsListUuid) {
      const friend = await chatServer.getUserByUUID(uuid);
      if (friend !== undefined) {
        stringList.push({ friendname: friend.getName(), friendID: friend.getUUID() });
      }
    }
    sendSucces(ws, stringList);
    return;
  }
}
function sendFail(ws: IWebSocket, typeOfFail: string) {
  const answer: ServerInterfaceTypes.getListFriendSendback = {
    command: 'getListFriendSendback',
    payload: { succeeded: false, typeOfFail: typeOfFail },
  };
  ws.send(JSON.stringify(answer));
}

function sendSucces(ws: IWebSocket, stringList: { friendname: string; friendID: string }[]) {
  const answer: ServerInterfaceTypes.getListFriendSendback = {
    command: 'getListFriendSendback',
    payload: { succeeded: true, list: stringList },
  };
  console.log(stringList);
  ws.send(JSON.stringify(answer));
}
