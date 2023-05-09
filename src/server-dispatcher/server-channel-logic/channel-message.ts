import type { User } from '../../objects/user/user.js';
import type { IWebSocket } from '../../front-end/proto/ws-interface.js';
import type * as ServerInterfaceTypes from '../../front-end/proto/server-types.js';
import type * as ClientInterfaceTypes from '../../front-end/proto/client-types.js';
import { Detective } from '../../front-end/keystroke-fingerprinting/imposter.js';
import type { ChatServer } from '../../server/chat-server.js';
import type { Channel } from '../../objects/channel/channel.js';
import { Message } from '../../objects/message/message.js';
import { DirectMessageChannel } from '../../objects/channel/directmessagechannel.js';

export async function channelMessage(
  message: ClientInterfaceTypes.channelMessage['payload'],
  server: ChatServer,
  ws: IWebSocket
): Promise<void> {
  const user: User | undefined = await server.getUserBySessionID(message.sessionID);
  if (user === undefined) {
    sendFail(ws, 'userNotConnected');
    return;
  }
  const channel = await server.getChannelByCUID(message.channelCUID);
  if (channel === undefined) {
    sendFail(ws, 'nonExistingChannel');
    return;
  }
  if (!user.isConnectedToChannel(channel)) {
    sendFail(ws, 'notConnectedToChannel');
    return;
  }
  let isNotification = false;
  if (channel instanceof DirectMessageChannel) {
    isNotification = true;
  }
  let trustLevelCalculated = 0;
  const verification: boolean = user.getVerification();
  if (message.NgramDelta.length === 0 || message.NgramDelta.at(0)?.[0].length === 1) {
    trustLevelCalculated = user.getLastTrustLevel();
  } else if (verification) {
    const arr_of_other_users = new Array<Map<string, number>>();
    for (const other of await server.getUsersForKeystrokes()) {
      if (other !== user) {
        arr_of_other_users.push(other.getNgrams());
      }
    }
    trustLevelCalculated = Detective(user.getNgrams(), new Map(message.NgramDelta), arr_of_other_users);
    user.setLastTrustLevel(trustLevelCalculated);
  }

  await sendMessage(user, channel, server, message.text, message.date, trustLevelCalculated, isNotification);
  if (trustLevelCalculated > 0.75) {
    user.bufferNgrams(new Map<string, number>(message.NgramDelta));
  }
}

function sendFail(ws: IWebSocket, typeOfFail: string) {
  const answer: ServerInterfaceTypes.messageSendbackChannel = {
    command: 'messageSendbackChannel',
    payload: { succeeded: false, typeOfFail: typeOfFail },
  };
  ws.send(JSON.stringify(answer));
}

async function sendMessage(
  user: User,
  channel: Channel,
  chatServer: ChatServer,
  text: string,
  date: string,
  trustLevel: number,
  isNotification: boolean
) {
  const aLoad: ServerInterfaceTypes.messageSendbackChannel = {
    command: 'messageSendbackChannel',
    payload: {
      succeeded: true,
      text: text,
      date: date,
      user: user.getPublicUser(),
      trustLevel: trustLevel,
      isNotification: isNotification,
    },
  };

  channel.addMessage(new Message(user, date, text, trustLevel));
  // FOR EVERY CLIENT IN CHANNEL
  for (const client of channel.getUsers()) {
    const clientUser = await chatServer.getUserByUUID(client);
    if (clientUser === undefined) {
      console.log('clientuser error');
      return;
    }
    const clientWs = clientUser.getChannelWebSockets(channel);
    if (clientWs === undefined) {
      console.log('client ws error');
      return;
    }
    // FOR EVERT TAB OPENED
    for (const tab of clientWs) {
      console.log('verstuur nr client');
      console.log(JSON.stringify(aLoad));
      tab.send(JSON.stringify(aLoad));
    }
  }
}
