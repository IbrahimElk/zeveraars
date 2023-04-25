import type { User } from '../../objects/user/user.js';
import type { Channel } from '../../objects/channel/channel.js';
import type { IWebSocket } from '../../protocol/ws-interface.js';
import type * as ServerInterfaceTypes from '../../protocol/server-types.js';
import type * as ClientInterfaceTypes from '../../protocol/client-types.js';
import type { Message } from '../../objects/message/message.js';
import type { ChatServer } from '../../server/chat-server.js';
import Debug from 'debug';
const debug = Debug('select-friend.ts');

export async function selectFriend(
  load: ClientInterfaceTypes.selectFriend['payload'],
  chatserver: ChatServer,
  ws: IWebSocket
): Promise<void> {
  const checkMe: User | undefined = await chatserver.getUserByWebsocket(ws);

  //Check if the user exists
  if (checkMe === undefined) {
    sendFail(ws, 'userNotConnected');
    return;
  }

  const checkFriend: User | undefined = await chatserver.getUserByUserId(load.friendUuid);
  //Check if the friend exists
  if (checkFriend === undefined) {
    sendFail(ws, 'friendNotExisting');
    return;
  }
  if (!checkMe.isFriend(checkFriend)) {
    sendFail(ws, "usersAren'tFriends");
    return;
  }
  //Check if the users have a direct channel
  const channelCuid = nameOfFriendChannel(checkMe, checkFriend);
  const mychannel = await chatserver.getFriendChannelByChannelId(channelCuid);
  if (mychannel !== undefined) {
    sendSucces(ws, mychannel, load);
    checkMe.setConnectedChannel(mychannel);
    return;
  } else {
    sendFail(ws, 'noExistingDirectChannel');
    return;
  }
}

// returns the first common friend channel as a string, or undefined if there are no common friend channels.
function nameOfFriendChannel(me: User, friend: User) {
  return '#' + me.getUUID() + friend.getUUID();
}

function sendFail(ws: IWebSocket, typeOfFail: string) {
  const answer: ServerInterfaceTypes.selectFriendSendback = {
    command: 'selectFriendSendback',
    payload: { succeeded: false, typeOfFail: typeOfFail },
  };
  ws.send(JSON.stringify(answer));
}

function sendSucces(ws: IWebSocket, channel: Channel, load: ClientInterfaceTypes.selectFriend['payload']) {
  const msgback: ServerInterfaceTypes.selectFriendSendback['payload'] = {
    succeeded: true,
    //TODO: zoek correcte friendNameUuid
    friendNameUuid: load.friendUuid,
    messages: new Array<{
      sender: string;
      text: string;
      date: string;
    }>(),
  };
  const messagesFromChannel: Array<Message> = channel.getMessages();
  messagesFromChannel.forEach((message) => {
    msgback.messages.push({
      date: message.getDate().toString(),
      sender: message.getUserName(),
      text: message.getText(),
    });
  });
  const msgsendback: ServerInterfaceTypes.selectFriendSendback = {
    command: 'selectFriendSendback',
    payload: msgback,
  };
  ws.send(JSON.stringify(msgsendback));
}