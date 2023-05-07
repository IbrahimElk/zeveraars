/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */ //FIXME:
import type { User } from '../../objects/user/user.js';
import type { Channel } from '../../objects/channel/channel.js';
import type { IWebSocket } from '../../front-end/proto/ws-interface.js';
import type * as ServerInterfaceTypes from '../../front-end/proto/server-types.js';
import type * as ClientInterfaceTypes from '../../front-end/proto/client-types.js';
import type { ChatServer } from '../../server/chat-server.js';

import Debug from 'debug';
const debug = Debug('select-channel.ts');

export async function disconnectChannel(
  load: ClientInterfaceTypes.disconnectChannel['payload'],
  chatServer: ChatServer,
  ws: IWebSocket
): Promise<void> {
  const checkMe: User | undefined = await chatServer.getUserBySessionID(load.sessionID);
  //Check if the user is connected
  if (checkMe === undefined) {
    sendFail(ws, 'userNotConnected');
    return;
  }

  const checkChannel: Channel | undefined = await chatServer.getChannelByCUID(load.channelCUID);
  //Check if the channel exists
  if (checkChannel === undefined) {
    sendFail(ws, 'channelNotExisting');
    return;
  }
  if (!checkChannel.isConnectedUser(checkMe)) {
    sendFail(ws, 'userNotConnectedToChannel');
    return;
  }
  checkMe.disconnectFromChannel(checkChannel, ws);
  if (!checkMe.isConnectedToChannel(checkChannel)) checkChannel.systemRemoveConnected(checkMe);
  await sendSucces(ws, checkChannel, checkMe, chatServer);
  return;
}

function sendFail(ws: IWebSocket, typeOfFail: string) {
  const answer: ServerInterfaceTypes.disconnectChannelSendback = {
    command: 'disconnectChannelSendback',
    payload: { succeeded: false, typeOfFail: typeOfFail },
  };
  ws.send(JSON.stringify(answer));
}

async function sendSucces(ws: IWebSocket, channel: Channel, user: User, chatServer: ChatServer) {
  const answer: ServerInterfaceTypes.disconnectChannelSendback = {
    command: 'disconnectChannelSendback',
    payload: {
      succeeded: true,
      user: user.getPublicUser(),
    },
  };

  // for every connected user in channel
  for (const connectedUUID of channel.getConnectedUsers()) {
    const connectedUser = await chatServer.getUserByUUID(connectedUUID);
    if (connectedUser === undefined) return;
    const connectedWS = connectedUser.getChannelWebSockets(channel);
    if (connectedWS === undefined) return;
    // for every connected websocket in channel
    for (const tab of connectedWS) {
      tab.send(JSON.stringify(answer));
    }
  }
  console.log(channel.getConnectedUsers());
}

// TODO: INITIALIZE ALL POSSIBLE CHATROOMS FOR A CERTAIN USER IF IT DOESNT EXIST YET THROUGH INFORMATION IN JSON.
// SEE chatserver.cuid for all possible existing chatrooms.

// WE NEMEN AAN DAT DE LESSON NAMES ALLEMAAL VERSCHILLEND ZIJN EN UNIEK.
// OF ER BESTAAT WAARSCHIJNLIJK VOOR ELKE LES
// function joinAllChatRooms(user: User, lesson: string, server: ChatServer) {
//   // FOR EACH LESSON, DOES THE RESPECTIVE CHANNEL ALREADY EXIST?
//   if (!server.cuidAlreadyInUse('#' + lesson)) {
//     // } else {
//     const nwchannel = new PublicChannel(lesson, '#' + lesson);
//     server.setCachePublicChannel(nwchannel);
//     user.addPublicChannel(nwchannel.getCUID());
//     nwchannel.addUser(user.getUUID());
//   }
//   //   }
//   // }
// }