import type { User } from '../../objects/user/user.js';
import type * as ServerInterfaceTypes from '../../front-end/proto/server-types.js';
import { Message } from '../../objects/message/message.js';
import type { ChatServer } from '../../server/chat-server.js';
import type { PublicChannel } from '../../objects/channel/publicchannel.js';

export async function sendMessage(
  user: User,
  channel: PublicChannel,
  chatServer: ChatServer,
  text: string,
  date: string,
  trustLevel: number
) {
  const aLoad: ServerInterfaceTypes.messageSendbackChannel = {
    command: 'messageSendbackChannel',
    payload: {
      succeeded: true,
      text: text,
      date: date,
      user: user.getPublicUser(),
      trustLevel: trustLevel,
    },
  };

  channel.addMessage(new Message(user, date, text, trustLevel));
  // FOR EVERY CLIENT IN CHANNEL
  for (const client of channel.getConnectedUsers()) {
    const clientUser = await chatServer.getUserByUUID(client);
    if (clientUser !== undefined) {
      const clientWs = clientUser.getWebSocket();
      if (clientWs !== undefined) {
        // FOR EVERT TAB OPENED
        for (const tab of clientWs) {
          tab.send(JSON.stringify(aLoad));
        }
      }
    }
  }
}