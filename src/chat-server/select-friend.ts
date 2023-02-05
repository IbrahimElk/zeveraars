import { User } from '../user/user.js';
import { DirectMessageChannel } from '../channel/directmessagechannel.js';
import type { Channel } from '../channel/channel.js';
import { serverInstance as server } from './chat-server-script.js';
import type { IWebSocket } from '../protocol/ws-interface.js';
import type * as ServerInterfaceTypes from '../protocol/protocol-types-server.js';
import type * as ClientInterfaceTypes from '../protocol/protocol-types-client.js';
import type { Message } from '../message/message.js';
import { debug, sendPayLoad } from './server-dispatcher-functions.js';

/** This function is called when the user wants to select a friend. This means that he/she 'opens the channel' in their
 *  terminal. This function checks if the user and his supposed friend are defined, if they are friends, if the user
 *  is connected and if they have a 'friend channel'. If one of the above checks fails a selectFriendSendback interface
 *  will be created containing the boolean false in the succeded field and the message telling the client what went
 *  wring in the string TypeOfFail. If all the checks succeed the same interface will be sent to the client side,
 *  but the succeeded boolean will contain true and all the previous senders, texts and dates in this channel will
 *  be in this interface.
 *
 * @param load This parameter will contain the payload (the information) of the selectFriend interface called upon by the client-side containing the username
 *              of the user that called the function (so the one that want's to select the other user) and the username of the supposed friend.
 * @param ws This parameter is the WebSocket that is used for sending the selectFriendSendBack interface to the client-side of the server.
 * @returns This function will return a selectFriendSendBack interface. If the the checks above are satisfied the succeded boolean in the interface will
 *           be true and the fields sender, texts and dates will contain the right information. If this isn't the case this boolean will be false and
 *           the typeOfFail will contain the string telling the client-side what went wrong so it can report it to the user.
 * @author Vincent Ferrante
 */

export function selectFriend(load: ClientInterfaceTypes.removeFriend['payload'], ws: IWebSocket): void {
  const checkMe: User | undefined = server.getUser(load.username);
  debug('cenckMe: ', checkMe?.getName());

  //Check if the user exists
  if (checkMe === undefined) {
    const selectFriendAnswer: ServerInterfaceTypes.selectFriendSendback = {
      command: 'selectFriendSendback',
      payload: {
        succeeded: false,
        typeOfFail: 'nonExistingUsername',
        messages: [{ sender: '', text: '', date: '' }],
      },
    };
    debug('send back statement in selectFriend function');
    sendPayLoad(selectFriendAnswer, ws);
    return;
  }
  //Check if the user is connected
  if (!checkMe.isConnected()) {
    const selectFriendAnswer: ServerInterfaceTypes.selectFriendSendback = {
      command: 'selectFriendSendback',
      payload: {
        succeeded: false,
        typeOfFail: 'userNotConnected',
        messages: [{ sender: '', text: '', date: '' }],
      },
    };
    debug('send back statement in selectFriend function');
    sendPayLoad(selectFriendAnswer, ws);
    return;
  }
  const dummy: User = new User('dummy', 'dummy_PW', ws);
  const me: User = server.getUser(load.username) ?? dummy;
  const checkFriend: User | undefined = server.getUser(load.friendname);
  //Check if the friend exists
  if (checkFriend === undefined) {
    const selectFriendAnswer: ServerInterfaceTypes.selectFriendSendback = {
      command: 'selectFriendSendback',
      payload: {
        succeeded: false,
        typeOfFail: 'friendNotExisting',
        messages: [{ sender: '', text: '', date: '' }],
      },
    };
    debug('send back statement in selectFriend function');
    sendPayLoad(selectFriendAnswer, ws);
    return;
  }
  const friend: User = server.getUser(load.friendname) ?? dummy;
  if (!me.getFriends().has(friend)) {
    const selectFriendAnswer: ServerInterfaceTypes.selectFriendSendback = {
      command: 'selectFriendSendback',
      payload: {
        succeeded: false,
        typeOfFail: "usersAren'tFriends",
        messages: [{ sender: '', text: '', date: '' }],
      },
    };
    debug('send back statement in selectFriend function');
    sendPayLoad(selectFriendAnswer, ws);
    return;
  }
  //Check if the users have a direct channel
  const myChannels: Set<Channel> = me.getChannels();
  let ourChannel: Channel | undefined = undefined;
  myChannels.forEach((channel) => {
    if (channel.getUsers().has(friend) && channel instanceof DirectMessageChannel) {
      ourChannel = channel;
      me.setConnectedChannel(channel); //FIXME:
    }
  });

  //Check if there doesn't exist a direct channel
  if (ourChannel === undefined) {
    const selectFriendAnswer: ServerInterfaceTypes.selectFriendSendback = {
      command: 'selectFriendSendback',
      payload: {
        succeeded: false,
        typeOfFail: 'noExistingDirectChannel',
        messages: [{ sender: '', text: '', date: '' }],
      },
    };
    debug('send back statement in selectFriend function');
    sendPayLoad(selectFriendAnswer, ws);
    return;
  } else {
    const dummyChannel = new DirectMessageChannel('dummychannel', dummy, dummy, false);
    const thisChannel: Channel = ourChannel ?? dummyChannel;

    const msgsendback: ServerInterfaceTypes.selectFriendSendback['payload']['messages'] = new Array<{
      sender: string;
      text: string;
      date: string;
    }>();
    const messages: Array<Message> = thisChannel.getMessages();
    messages.forEach((message) => {
      msgsendback.push({
        date: message.getDate().toString(),
        sender: message.getUser()?.getName() ?? dummy.getName(),
        text: message.getText(),
      });
    });

    const selectFriendAnswer: ServerInterfaceTypes.selectFriendSendback = {
      command: 'selectFriendSendback',
      payload: { succeeded: true, messages: msgsendback },
    };
    debug('CORRECT send back statement in selectFriend function');
    sendPayLoad(selectFriendAnswer, ws);
    return;
  }
}
