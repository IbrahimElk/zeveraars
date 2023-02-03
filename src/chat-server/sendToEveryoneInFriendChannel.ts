import type { User } from '../user/user.js';
import type { Channel } from '../channel/channel.js';
import type { IWebSocket } from '../protocol/ws-interface.js';
import type * as ServerInterfaceTypes from '../protocol/protocol-types-server.js';
import { Message } from '../message/message.js';
import { debug } from './server-dispatcher-functions.js';

export function sendToEveryoneInFriendChannel(
  user: User,
  ws: IWebSocket,
  load: ServerInterfaceTypes.friendMessageSendback
) {
  debug('inside sendToEveryoneInFriendChannel for friendmessagesendback');
  // aan de hand van de webscocket die behoort tot de verzender client,
  // weten bij welke channel hij heeft geselecteerd. (connectedChannel in user)
  //FIXME:
  const channel: Channel | undefined = user.getConnectedChannel();
  // BERICHT OPSLAAN IN CHANNEL
  channel.addMessage(new Message(user, load.payload.text));

  //channel.addMessage(new Message(server.getUser(load.payload.sender), load.payload.text));
  // channel.addMessage(new Message(user, load.payload.text));
  for (const client of channel.getUsers()) {
    if (client !== user) {
      const clientWs: IWebSocket | undefined = client.getWebSocket();
      if (clientWs !== undefined) {
        debug('verzonden');
        clientWs.send(JSON.stringify(load));
      }
      //   ws.send(JSON.stringify(load));
    }
  }
}
