// @authors: Ibrahim El Kaddouri, Maité Desmedt, Vincent Ferrante
// @date 2022-11-28

import { User } from '../user/user.js';
import { DirectMessageChannel } from '../channel/directmessagechannel.js';
import type { Channel } from '../channel/channel.js';

//import { Friendchannel } from "../channel/friendchannel.js";
//import { Privatechannel } from "../channel/privatechannel.js";
//import { Publicchannel } from "../channel/publicchannel.js";
import { serverInstance as server } from '../chat-server/chat-server-script.js';
import { Detective } from '../keystroke-fingerprinting/imposter.js';

import type { IWebSocket, IWebSocketServer } from '../protocol/ws-interface.js';
import { WebSocket } from 'ws';
import type { Server } from '../server/server.js';
import type * as ServerInterfaceTypes from '../protocol/protocol-types-server.js';
import type * as ClientInterfaceTypes from '../protocol/protocol-types-client.js';
import Debug from 'debug';
import { Message } from '../message/message.js';
const debug = Debug('server-dispatcher-functions: ');

const ERROR_CODES = {
  0: 'An incorrect message format was given.',
  1: 'An incorrect message type / command was given.',
};

export function ServerFriendMessageHandler(
  ws: IWebSocket,
  message: ClientInterfaceTypes.friendMessage['payload'],
  Server: Server
): void {
  // vind de verstuurder aan de hand van de websocket
  const user: User | undefined = Server.systemGetUserFromWebSocket(ws);
  if (user !== undefined) {
    // als het de user vindt, check of de verstuurde bericht van die user is.
    const notimposter: boolean = CheckKeypressFingerprinting(user, message.NgramDelta);
    //const notimposter = true;
    debug('notimposter: ', notimposter);
    if (notimposter) {
      // indien bericht van de user is, doorsturen naar iedereen
      const Aload: ServerInterfaceTypes.friendMessageSendback = {
        command: 'friendMessageSendback',
        payload: {
          text: message.text,
          date: message.date,
          sender: user.getName(),
        },
      };
      sendToEveryoneInFriendChannel(user, ws, Aload);
    }
    // indien bericht van de user is, doorsturen naar iedereen
    // const Aload: ServerInterfaceTypes.friendMessageSendback = {
    //   command: 'friendMessageSendback',
    //   payload: {
    //     text: message.text,
    //     date: message.date,
    //     sender: user.getName(),
    //   },
    // };
    // voeg de verstuurde ngram toe aan de user.
    // user.setNgrams(new Map(Object.entries(message.NgramDelta)));
    //   // verstuur het bericht naar alle leden in de channel.
    // sendToEveryoneInFriendChannel(user, ws, Aload);
    else {
      // indien bericht NIET van de user is.
      const messageWarning: ServerInterfaceTypes.friendMessageSendback = {
        command: 'friendMessageSendback',
        payload: {
          sender: 'server',
          text: 'This message was typed at a different typing speed than usual. Be careful',
          date: Date.now()
            .toString()
            .replace(/T/, ' ') // replace T with a space
            .replace(/\..+/, ''), // delete the dot and everything after,,
        },
      };

      const Aload: ServerInterfaceTypes.friendMessageSendback = {
        command: 'friendMessageSendback',
        payload: {
          text: message.text,
          date: message.date,
          sender: user.getName(),
        },
      };
      //verstuur een warning van de server naar alle leden in de channel.
      sendToEveryoneInFriendChannel(user, ws, messageWarning);
      sendToEveryoneInFriendChannel(user, ws, Aload);
    }
  }
}

// TODO: we gaan er van uit dat elk user al iets heeft van ngram stuff, initiele fase al doorgeloopt.
// We kunnen dat doen bij de registratie van een user om een specifieke tekst over te typen.
// dit wordt dan gerigstreerd en opgeslaan. en bij het opstellen van de tekst moet alle mogelijke combinatie van ngram mogelijk zijn.
// dus in database sws alle mogelijke "aa","ab" te vinden (in gelijke kansen?).
function CheckKeypressFingerprinting(user: User, NgramDelta: Record<string, number>) {
  debug('inside CheckKeypressFingerprinting for friendmessagesendback');
  const mapping: Map<string, number> = new Map(Object.entries(NgramDelta));
  return Detective(user.getNgrams(), mapping, 0.48, 0.25, 0.75);
}

function sendToEveryoneInFriendChannel(user: User, ws: IWebSocket, load: ServerInterfaceTypes.friendMessageSendback) {
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
        if (clientWs.readyState === WebSocket.OPEN) {
          debug('verzonden');
          clientWs.send(JSON.stringify(load));
        }
      }
      // if (ws.readyState === WebSocket.OPEN) {
      //   ws.send(JSON.stringify(load));
      // }
    }
  }
}

/**
 * This function is called by the client side when the user wants to log into the server. It will check if the user is a real (defined) user, if the user isn't already connected and if
 *  the password the user gives matches with the password that is saved in the database. If one of the above is unsatisfied the function will send
 *  a message back to the client side containing an error and specifying what went wrong so it can show it to the user. If the clauses are satisfied,
 *  the sendBack message will contain the boolean true and the user will be instantiated.
 *
 * @param load This parameter is the payload (information) of an interface (like all the other (user)functions in this file). In this case it is the login interface that specifies the
 *              type of interface and contains the username and the password that the user has given while trying to log into the chatter.
 * @param ws This parameter specifies the WebSocket that handles the connection between the server and the user. It is used to send back the information
 *            to the user.
 * @returns This function will always generate a 'loginSendBack' interface to send it's conclusions to the client-side. If one of the clauses specified
 *            above (in the description) isn't satisfied, the succeded boolean in this interface will be false and the typeOfFail string will contain a
 *            string specifying what went wrong (if the user gave the wrong username, he/she doesn't have to do the same thing as when he/she gives the
 *            wrong password). If the clauses are satisfied the succeded boolean will contain true.
 * @author Vincent Ferrante
 *
 * @Maite heeft deze docu geschreven:
 * This function is called when a user wants to log in.
 * Firstly, it checks if the user already exist in the database. If this is not the case, the user will not be able to log in.
 * Secondly, it checks if the user is already connected. If this is the case, the user will not be able to log in.
 * Lastly, it checks if the password in the load-parameter matches the password that is linked to the username according to the information saved in the database.
 * Only if this is the case, the user will be able to log in.
 *
 * @param {load} {This contains the username and the password of the user who wants to log in.}
 * @param {ws} {This is the IWebSocket needed to send a message back to the client}
 */
export function login(load: ClientInterfaceTypes.logIn['payload'], ws: IWebSocket): void {
  debug(`inside login function for person with name ${load.name}`);
  const checkPerson: User | undefined = server.getUser(load.name);
  debug(load.name, checkPerson);
  //Check if a user exists with this name, otherwise a user could be created
  if (checkPerson === undefined) {
    const loginAnswer: ServerInterfaceTypes.loginSendback = {
      command: 'loginSendback',
      payload: { succeeded: false, typeOfFail: 'nonExistingName' },
    };
    const result = JSON.stringify(loginAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in login function');
        ws.send(result);
      }
    }
    return;
  }
  //Check if the user is already connected
  debug('Is this person connected: ', checkPerson.isConnected());
  //server.printConnectedUsers();
  if (checkPerson.isConnected()) {
    // person.setConnected(false);
    const loginAnswer: ServerInterfaceTypes.loginSendback = {
      command: 'loginSendback',
      payload: { succeeded: false, typeOfFail: 'userAlreadyConnected' },
    };
    const result = JSON.stringify(loginAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in login function');
        ws.send(result);
      }
    }
    return;
  }
  const person: User = new User(load.name, load.password, ws);
  //Check if passwords match
  if (person.getPassword() !== load.password) {
    // person.setConnected(false);
    const loginAnswer: ServerInterfaceTypes.loginSendback = {
      command: 'loginSendback',
      payload: { succeeded: false, typeOfFail: 'falsePW' },
    };
    const result = JSON.stringify(loginAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in login function');
        ws.send(result);
      }
    }
    return;
  } else {
    // const user: User = new User(load.name, load.password, ws, undefined);
    //server.systemConnectUser(person);
    const loginAnswer: ServerInterfaceTypes.loginSendback = {
      command: 'loginSendback',
      payload: { succeeded: true },
    };
    const result = JSON.stringify(loginAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in login function');
        ws.send(result);
      }
    }
    return;
  }
}
function getConnectUserFromName(name: string): User | undefined {
  const checkPerson: Set<User> = server.getConnectedUsers();
  for (const element of checkPerson) {
    if (element.getName() === name) {
      return element;
    }
  }
  return undefined;
}
export function exit(load: ClientInterfaceTypes.exitMe['payload'], ws: IWebSocket): void {
  debug(`inside exit function for person with name ${load.name}`);
  const checkPerson: User | undefined = getConnectUserFromName(load.name);
  if (checkPerson === undefined) {
    const loginAnswer: ServerInterfaceTypes.exitMeSendback = {
      command: 'exitMeSendback',
      payload: { succeeded: false, typeOfFail: 'userNotConnected' },
    };
    const result = JSON.stringify(loginAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in exit function');
        ws.send(result);
      }
    }
    return;
  } else {
    server.systemDisconnectUser(checkPerson);
    const exitAnswer: ServerInterfaceTypes.exitMeSendback = {
      command: 'exitMeSendback',
      payload: { succeeded: true },
    };
    const result = JSON.stringify(exitAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in exit function');
        ws.send(result);
      }
    }
    return;
  }
}

/**
 * This function is called by the client-side when a new user wants to register. It will check if the given username alredy is in use, and if the passwoord
 *  he/she wants to use is 'safe' enough (contains at leaast 8 characters, an uppercase letter, a lowercase letter and a punctuation mark). If these clauses
 *  are unsatisfied, an interface "registrationSendBack" wil be sent to the client-side containing the succeded boolean that will be false and the typeOfFail
 *  string that will contain a string specifying what went wrong. If all the clauses are satisfied, the function will send the same interface, but the
 *  succeded boolean will be true, and the user will be created.
 *
 * @param load This parameter is the payload (information) of a registration interface that will contain the username and password the user has given while trying to log into the
 *              chatter.
 * @param ws This parameter is the WebSocket that is used for sending the registrationSendBack interface to the client-side of the server.
 * @returns This function will always generate a 'registrationSendBack' interface to send it's conclusions to the client-side. If one of the clauses
 *            specified above (in the description) isn't satisfied, the succeded boolean in this interface will be false and the typeOfFail string will
 *            contain a string specifying what went wrong (if the user gave the wrong username, he/she doesn't have to do the same thing as when he/she
 *            gives a weak password). If the clauses are satisfied the succeded boolean will contain true.
 * @author Vincent Ferrante
 *
 * @maite
 * This function is called when a new user wants to register.
 * Firstly, it checks if there exists already a user in the database with the same username as in the load-parameter. If this is the case, the user will not be able to register.
 * Secondly, it checks if the password meets the correct requirements by calling the function checkPW.
 * The password has to be at least 8 characters long and it needs to contain at least one punctuation and one capital letter.
 * If one of this requirements is not met, the user will not be able to register.
 * Thirdly, it checks if the username is not an empty string. If the username is an empty string, the user will not be able to register.
 * Lastly, if all three requirements above are met, this function will create a new user with the parameters of this function.
 *
 * @param {load} {This contains the username and the password of the user who wants to register.}
 * @param {ws} {This is the IWebSocket needed to send a message back to the client}
 *
 */
export function register(load: ClientInterfaceTypes.registration['payload'], ws: IWebSocket): void {
  debug('inside register function ');
  const letters: string[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ&|é@#(§è!ç{à}°)_-¨*$[]%£ùµ´`^?./+,;:=~><\\"\''.split('');
  const NgramCounter = new Map(
    letters
      .map((a) => letters.map((b) => a + b)) // [["AA","AB",...,"AZ"],["BA","BB",...,"BZ"], ... ,["ZA","ZB",...,"ZZ"]]
      .flat(1) // ["AA","AB",...,"AZ","BA","BB",...,"BZ", ... ,"ZA","ZB",...,"ZZ"]
      .map((a) => [a, 0]) //[["AA",0],["AB",0],...,["ZZ",0]]
  );

  const NgramDelta = new Map(Object.entries(load.NgramDelta)); //van object terug naar map
  const checkPerson: User | undefined = server.getUser(load.name);

  //Check if a user exists with the given (through the parameters) name
  // debug('checkPerson', checkPerson);

  if (checkPerson !== undefined) {
    debug('and this is user.getNgrams in register function', checkPerson.getNgrams());
    const registrationAnswer: ServerInterfaceTypes.registrationSendback = {
      command: 'registrationSendback',
      payload: { succeeded: false, typeOfFail: 'existingName' },
    };
    const result = JSON.stringify(registrationAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in register function');
        ws.send(result);
      }
    }
    return;
  }
  //Check if the given password is long enough
  else if (checkPW(load.password) !== 'true') {
    const registrationAnswer: ServerInterfaceTypes.registrationSendback = {
      command: 'registrationSendback',
      payload: { succeeded: false, typeOfFail: checkPW(load.password) },
    };
    const result = JSON.stringify(registrationAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in register function');
        ws.send(result);
      }
    }
    return;
  } else if (load.name.length < 1) {
    const registrationAnswer: ServerInterfaceTypes.registrationSendback = {
      command: 'registrationSendback',
      payload: { succeeded: false, typeOfFail: 'length of name is shorter than 1' },
    };
    const result = JSON.stringify(registrationAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in register function');
        ws.send(result);
      }
    }
    return;
  }
  //Create a new user
  else {
    debug('create new user');
    new User(load.name, load.password, ws, undefined, NgramDelta, NgramCounter);
    const registrationAnswer: ServerInterfaceTypes.registrationSendback = {
      command: 'registrationSendback',
      payload: { succeeded: true },
    };
    const result = JSON.stringify(registrationAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in register function');
        ws.send(result);
      }
    }
    server.printUsers();
    server.printConnectedUsers();
    return;
  }
}

/**
 * This is a helper-function used in the function register that checks if the password is strong enough. That means that is checks if the password contains
 *  at least one uppercase-, and one lowercase letter, a punctuation mark and at least 8 characters.
 * IMPORTANT: The order of checks is: length -> contais an uppercase letter -> contains a lowercase letter -> contains a punctuation mar. If the password
 *  doesn't satisfy a clause, the resulting clauses will not be checked. For example if the password is long enough, but doesn'contain an uppercase letter
 *  and a punctuation mark, the user will only know that his/her password must contain an uppercase letter. When he/ she fixes this mistake but the password
 *  still doesn't contain a punctuation mark it will be reported to him/her the next time he/she tries to register.
 *
 * @param password This parameter is the password the user want's to use, so it's the password the function has to check.
 * @returns This function returns the string message specifying the result of the function. It starts of as 'false' and if all the checks are satisfied it
 *            will contain 'true'. If one of the clauses is unsatisfied message will contain the string specifying which check has failed.
 * @author Vincent Ferrante
 */
function checkPW(password: string): string {
  let message = 'false';
  if (password.length < 8) {
    message = 'shortPW';
  }
  let hasUppercase = false;
  let hasPunctuation = false;
  const punctuation = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';
  for (let i = 0; i < password.length; i++) {
    if (password.charAt(i) === password.charAt(i).toUpperCase()) {
      hasUppercase = true;
    }
    if (punctuation.includes(password.charAt(i))) {
      hasPunctuation = true;
    }
  }
  if (!hasUppercase) {
    message = 'noUppercaseInPW';
  } else if (!hasPunctuation) {
    message = 'noPunctuationInPW';
  } else {
    message = 'true';
  }
  return message;
}

/**
 * This function is called by the client-side if the user want's to join a channel. It will check if the user or channel are undefined, if the user is
 *   connected and if the user already is a member of the channel. If one of these clauses fail, a joinChannelSendBack interface will be returned to the
 *   client-side containing a boolean succeded, which will be false, and a string: typeOfFail specifying what went wrong, so the user knows what he/she
 *   has to do if he/she want's to join the channel. If all the checks succeed, succeded will contain true and the user will be added to the channel.
 *
 * @param load  This parameter will contain the payload (the information) of the joinChannel interface called upon by the client-side containing the username
 *              of the user that called the function (so the one that want's to join the channel) and the channelName of the channel he/she want's to join.
 * @param ws This parameter is the WebSocket that is used for sending the joinChannelSendBack interface to the client-side of the server.
 * @returns This function will return an joinChannelSendBack interface. If the checks above are satisfied the succeded boolean in the interface will be true.
 *            If this isn't the case this boolean will be false and the typeOfFail will contain the string telling the client-side what went wrong so it
 *            can report it to the user.
 * @author Vincent Ferrante
 */
export function joinChannel(load: ClientInterfaceTypes.joinChannel['payload'], ws: IWebSocket): void {
  debug('inside joinChannel function ');
  //Check if a user exists with this name
  const checkPerson: User | undefined = server.getUser(load.username);
  if (checkPerson === undefined) {
    const joinChannelAnswer: ServerInterfaceTypes.joinChannelSendback = {
      command: 'joinChannelSendback',
      payload: { succeeded: false, typeOfFail: 'nonExistingUsername' },
    };
    const result = JSON.stringify(joinChannelAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in joinChannel function');
        ws.send(result);
      }
    }
    return;
  }
  // const person: User | undefined = server.getUser(load.username);
  //Check if the given user is connected
  if (!checkPerson.isConnected()) {
    const joinChannelAnswer: ServerInterfaceTypes.joinChannelSendback = {
      command: 'joinChannelSendback',
      payload: { succeeded: false, typeOfFail: 'userNotConnected' },
    };
    const result = JSON.stringify(joinChannelAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in joinChannel function');
        ws.send(result);
      }
    }
    return;
  }
  //Check if a channel exists with this name
  const checkChannel: Channel | undefined = server.getChannel(load.channelname);
  if (checkChannel === undefined) {
    const joinChannelAnswer: ServerInterfaceTypes.joinChannelSendback = {
      command: 'joinChannelSendback',
      payload: { succeeded: false, typeOfFail: 'nonExistingChannelname' },
    };
    const result = JSON.stringify(joinChannelAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in joinChannel function');
        ws.send(result);
      }
    }
    return;
  }
  // const channel: Channel = server.getChannel(load.channelname);
  //Check if the given user is already in the given channel
  if (checkChannel.getUsers().has(checkPerson)) {
    const joinChannelAnswer: ServerInterfaceTypes.joinChannelSendback = {
      command: 'joinChannelSendback',
      payload: { succeeded: false, typeOfFail: 'userInChannel' },
    };
    const result = JSON.stringify(joinChannelAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in joinChannel function');
        ws.send(result);
      }
    }
    return;
  } else {
    checkPerson.addChannel(checkChannel);
    const joinChannelAnswer: ServerInterfaceTypes.joinChannelSendback = {
      command: 'joinChannelSendback',
      payload: { succeeded: true },
    };
    const result = JSON.stringify(joinChannelAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in joinChannel function');
        ws.send(result);
      }
    }
    return;
  }
}

/**
 * This function is called by the client-side if the user want's to leave a channel. It will check if the user or channel are undefined, if the user is
 *   connected and if the user isn't a member of the channel. If one of these clauses fail, a leaveChannelSendBack interface will be returned to the
 *   client-side containing a boolean succeded, which will be false, and a string: typeOfFail specifying what went wrong, so the user knows what he/she
 *   has to do if he/she want's to leave the channel. If all the checks succeed, succeded will contain true and the user will be removed from the channel.
 *
 * @param load  This parameter will contain the payload (the information) of the removeChannel interface called upon by the client-side containing the username
 *              of the user that called the function (so the one that want's leave the channel) and the channelName of the channel he/she want's to leave.
 * @param ws This parameter is the WebSocket that is used for sending the leaveChannelSendBack interface to the client-side of the server.
 * @returns This function will return an leaveChannelSendBack interface. If the checks above are satisfied the succeded boolean in the interface will be true.
 *            If this isn't the case this boolean will be false and the typeOfFail will contain the string telling the client-side what went wrong so it
 *            can report it to the user.
 * @author Vincent Ferrante
 */

export function leaveChannel(load: ClientInterfaceTypes.leaveChannel['payload'], ws: IWebSocket): void {
  debug('inside leaveChannel function ');
  //Check if a user exists with this name
  const checkPerson: User | undefined = server.getUser(load.username);
  if (checkPerson === undefined) {
    const leaveChannelAnswer: ServerInterfaceTypes.leaveChannelSendback = {
      command: 'leaveChannelSendback',
      payload: { succeeded: false, typeOfFail: 'nonExistingUsername' },
    };
    const result = JSON.stringify(leaveChannelAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in leaveChannel function');
        ws.send(result);
      }
    }
    return;
  }
  // const person: User = server.getUser(load.username);
  //Check if this user is connected
  if (!checkPerson.isConnected()) {
    const leaveChannelAnswer: ServerInterfaceTypes.leaveChannelSendback = {
      command: 'leaveChannelSendback',
      payload: { succeeded: false, typeOfFail: 'userNotConnected' },
    };
    const result = JSON.stringify(leaveChannelAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in leaveChannel function');
        ws.send(result);
      }
    }
    return;
  }
  //Check if a channel exists with this name
  const checkChannel: Channel | undefined = server.getChannel(load.channelname);
  if (checkChannel === undefined) {
    const leaveChannelAnswer: ServerInterfaceTypes.leaveChannelSendback = {
      command: 'leaveChannelSendback',
      payload: { succeeded: false, typeOfFail: 'nonExistingChannelname' },
    };
    const result = JSON.stringify(leaveChannelAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in leaveChannel function');
        ws.send(result);
      }
    }
    return;
  }
  //Check if the given user is in the channel
  // const channel: Channel = server.getChannel(load.channelname) as Channel;
  if (!checkChannel.getUsers().has(checkPerson)) {
    const leaveChannelAnswer: ServerInterfaceTypes.leaveChannelSendback = {
      command: 'leaveChannelSendback',
      payload: { succeeded: false, typeOfFail: 'userNotInChannel' },
    };
    const result = JSON.stringify(leaveChannelAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in leaveChannel function');
        ws.send(result);
      }
    }
    return;
  } else {
    checkPerson.removeChannel(checkChannel);
    const leaveChannelAnswer: ServerInterfaceTypes.leaveChannelSendback = {
      command: 'leaveChannelSendback',
      payload: { succeeded: true },
    };
    const result = JSON.stringify(leaveChannelAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in leaveChannel function');
        ws.send(result);
      }
    }
    return;
  }
}

/**
 * This function is called by hte client-side when the user want's to add another user to his/her friend list. It will check if both users are defined,
 *  if the user is connected and if the users  are already friends. If one of the above isn't the case an addFriendSendBack interface will be created
 *  containing the succeded boolean false and the typeOfFail string telling the user what went wrong. If all the clauses are satisfied, the function will
 *  send the same interface, but the succeded boolean will be true, and the users will contain eachother in their friend lists.
 *
 * @param load This parameter will contain the payload (the information) of the addFriend interface called upon by the client-side containing the username
 *              of the user that called the function (so the one that want's to add the other user as a friend) and the username of the friend.
 * @param ws This parameter is the WebSocket that is used for sending the addFriendSendBack interface to the client-side of the server.
 * @returns This function will return an addFriendSendBack interface. if the checks above are satisfied the succeded boolean in the interface will be true.
 *            If this isn't the case this boolean will be false and the typeOfFail will contain the string telling the client-side what went wrong so it
 *            can report it to the user.
 * @author Vincent Ferrante
 */
export function addfriend(load: ClientInterfaceTypes.addFriend['payload'], ws: IWebSocket): void {
  debug('inside addFriend function ');
  //FIXME: esinterrors
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
  const checkMe: User | undefined = server.getUser(load.username);
  //Check if a user exists with the given username, otherwise it could be created
  if (checkMe === undefined) {
    const addFriendAnswer: ServerInterfaceTypes.addFriendSendback = {
      command: 'addFriendSendback',
      payload: { succeeded: false, typeOfFail: 'nonExistingUsername' },
    };
    const result = JSON.stringify(addFriendAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in addFriend function');
        ws.send(result);
      }
    }
    return;
  }
  //Check if this user is connected
  if (!checkMe.isConnected()) {
    const addFriendAnswer: ServerInterfaceTypes.addFriendSendback = {
      command: 'addFriendSendback',
      payload: { succeeded: false, typeOfFail: 'userNotConnected' },
    };
    const result = JSON.stringify(addFriendAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in addFriend function');
        ws.send(result);
      }
    }
    return;
  }
  const dummy: User = new User(load.username, 'dummy_PW', ws);
  const me: User = server.getUser(load.username) ?? dummy;

  const checkFriend: User | undefined = server.getUser(load.friendname);
  //Check if a user exists with the given friendname, otherwise it could be created
  if (checkFriend === undefined) {
    const addFriendAnswer: ServerInterfaceTypes.addFriendSendback = {
      command: 'addFriendSendback',
      payload: { succeeded: false, typeOfFail: 'nonExistingFriendname' },
    };
    const result = JSON.stringify(addFriendAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in addFriend function');
        ws.send(result);
      }
    }
    return;
  }
  const dummyF: User = new User(load.friendname, 'dummy_PW', ws);
  const friend: User = server.getUser(load.friendname) ?? dummyF;

  //Check if the given users are already friends
  const myFriends: Set<User> = me.getFriends();
  if (myFriends.has(friend)) {
    const addFriendAnswer: ServerInterfaceTypes.addFriendSendback = {
      command: 'addFriendSendback',
      payload: { succeeded: false, typeOfFail: 'usersAlreadyFriends' },
    };
    const result = JSON.stringify(addFriendAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in addFriend function');
        ws.send(result);
      }
    }
    return;
  } else {
    debug('hallo ik ben ibrahim en ik ben in de else stateùtn');
    me.addFriend(friend);
    // @Maité wrote this part
    let channelName = ' ';
    const username1: string = me.getName();
    const username2: string = friend.getName();
    if (username1 < username2) {
      channelName = username1 + username2;
    } else {
      channelName = username2 + username1;
    }
    //FIXME:
    const nwchannel = new DirectMessageChannel(channelName, me, friend, false);
    server.systemCacheChannel(nwchannel);
    me.addChannel(nwchannel);
    friend.addChannel(nwchannel);
    me.setConnectedChannel(nwchannel);
    const addFriendAnswer: ServerInterfaceTypes.addFriendSendback = {
      command: 'addFriendSendback',
      payload: { succeeded: true },
    };
    const result = JSON.stringify(addFriendAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in addFriend function');
        ws.send(result);
      }
    }
    return;
  }
}

/**
 * This function is called by the client-side when the user want's to remove another user from his/her friend list. It will check if both users are defined,
 *  if the user is connected and if the users aren't friends. If one of the above isn't the case an removeFriendSendBack interface will be created
 *  containing the succeded boolean false and the typeOfFail string telling the user what went wrong. If all the clauses are satisfied, the function will
 *  send the same interface, but the succeded boolean will be true, and the users will be deleted from their friend lists.
 *
 * @param load This parameter will contain the payload (the information) of the removeFriend interface called upon by the client-side containing the username
 *              of the user that called the function (so the one that want's to remove the other user as a friend) and the username of the friend.
 * @param ws This parameter is the WebSocket that is used for sending the removeFriendSendBack interface to the client-side of the server.
 * @returns This function will return a removeFriendSendBack interface. If the the checks above are satisfied the succeded boolean in the interface will
 *           be true. If this isn't the case this boolean will be false and the typeOfFail will contain the string telling the client-side what went wrong
 *           so it can report it to the user.
 * @author Vincent Ferrante
 */
export function removefriend(load: ClientInterfaceTypes.removeFriend['payload'], ws: IWebSocket): void {
  debug('inside addFriend function ');
  const checkMe: User | undefined = server.getUser(load.username); // FIXME: changed server.getUser() to systemGetUserFromWebsocket
  //Check if a user exists with the given username, otherwise it could be created
  if (checkMe === undefined) {
    const removeFriendAnswer: ServerInterfaceTypes.removeFriendSendback = {
      command: 'removeFriendSendback',
      payload: { succeeded: false, typeOfFail: 'nonExistingUsername' },
    };
    const result = JSON.stringify(removeFriendAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in removeFriend function');
        ws.send(result);
      }
    }
    return;
  }
  //Check if this user is connected
  if (!checkMe.isConnected()) {
    const removeFriendAnswer: ServerInterfaceTypes.removeFriendSendback = {
      command: 'removeFriendSendback',
      payload: { succeeded: false, typeOfFail: 'userNotConnected' },
    };
    const result = JSON.stringify(removeFriendAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in removeFriend function');
        ws.send(result);
      }
    }
    return;
  }
  const dummyU: User = new User('dummy', 'dummy_PW', ws);
  const me: User = server.getUser(load.username) ?? dummyU;
  //FIXME: eslint errors
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
  const checkFriend: User | undefined = server.getUser(load.friendname);
  //Check if a user exists with the given friendname, otherwise it could be created
  if (checkFriend === undefined) {
    const removeFriendAnswer: ServerInterfaceTypes.removeFriendSendback = {
      command: 'removeFriendSendback',
      payload: { succeeded: false, typeOfFail: 'nonExistingFriendname' },
    };
    const result = JSON.stringify(removeFriendAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in removeFriend function');
        ws.send(result);
      }
    }
    return;
  }
  const dummyF: User = new User('dummyF', 'dummy_PW', ws);
  const friend: User = server.getUser(load.friendname) ?? dummyF;

  //Check if the given users aren't friends
  const myFriends: Set<User> = me.getFriends();
  if (!myFriends.has(friend)) {
    const removeFriendAnswer: ServerInterfaceTypes.removeFriendSendback = {
      command: 'removeFriendSendback',
      payload: { succeeded: false, typeOfFail: 'usersNotFriends' },
    };
    const result = JSON.stringify(removeFriendAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in removeFriend function');
        ws.send(result);
      }
    }
    return;
  } else {
    me.removeFriend(friend);
    //remove the friend channel
    const removeFriendAnswer: ServerInterfaceTypes.removeFriendSendback = {
      command: 'removeFriendSendback',
      payload: { succeeded: true },
    };
    const result = JSON.stringify(removeFriendAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in removeFriend function');
        ws.send(result);
      }
    }
    return;
  }
}

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
    const result = JSON.stringify(getListAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in getList function');
        ws.send(result);
      }
    } else {
      console.log('ws is undefined');
    }
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
    const result = JSON.stringify(getListAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in getList function');
        ws.send(result);
      }
    } else {
      console.log('ws is undefined');
    }
    return;
  }
}
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
  debug('inside selectFriend function ');
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
    const result = JSON.stringify(selectFriendAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in selectFriend function');
        ws.send(result);
      }
    }
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
    const result = JSON.stringify(selectFriendAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in selectFriend function');
        ws.send(result);
      }
    }
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
    const result = JSON.stringify(selectFriendAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in selectFriend function');
        ws.send(result);
      }
    }
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
    const result = JSON.stringify(selectFriendAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in selectFriend function');
        ws.send(result);
      }
    }
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
    const result = JSON.stringify(selectFriendAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in selectFriend function');
        ws.send(result);
      }
    }
    return;
  } else {
    const dummyChannel = new DirectMessageChannel('dummychannel', dummy, dummy, false);
    const thisChannel: Channel = ourChannel ?? dummyChannel;

    const msgsendback: ServerInterfaceTypes.selectFriendSendback['payload']['messages'] = new Array<{
      sender: string;
      text: string;
      date: string;
    }>();
    // debug('thisChannel', thisChannel);
    const messages: Array<Message> = thisChannel.getMessages();
    messages.forEach((message) => {
      // debug('message', message);
      msgsendback.push({
        date: message.getDate().toString(),
        sender: message.getUser()?.getName() ?? dummy.getName(),
        text: message.getText(),
      });
    });
    // debug('msgsendback', msgsendback);

    const selectFriendAnswer: ServerInterfaceTypes.selectFriendSendback = {
      command: 'selectFriendSendback',
      payload: { succeeded: true, messages: msgsendback },
    };
    const result = JSON.stringify(selectFriendAnswer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('CORRECT send back statement in selectFriend function');
        ws.send(result);
      }
    }
    return;
  }
}

/**
 * This functions creates a directMessageChannel if it does not exists yet.
 * It is called by the function that adds friends.
 *
 * @param {username1} {This is the username of the user who adds a new friend.}
 * @param {username2} {This is the username of the added friend.}
 * @param {ws} {This is the IWebSocket this function needs to send a message back to the correct client}
 *
 */
function createDirectChannel(username1: string, username2: string, ws: IWebSocket): void {
  const user1: User | undefined = server.getUser(username1);
  const user2: User | undefined = server.getUser(username2);
  if (user1 === undefined) {
    const Answer: ServerInterfaceTypes.createDirectChannelSendback = {
      command: 'createDirectChannelSendback',
      payload: { succeeded: false, typeOfFail: 'the user is undefined' },
    };
    const result = JSON.stringify(Answer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in createDirectChannel function');
        ws.send(result);
      }
    } else {
      console.log('ws is undefined');
    }
    return;
  } else if (user2 === undefined) {
    const Answer: ServerInterfaceTypes.createDirectChannelSendback = {
      command: 'createDirectChannelSendback',
      payload: { succeeded: false, typeOfFail: 'the friend is undefined' },
    };
    const result = JSON.stringify(Answer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in createDirectChannel function');
        ws.send(result);
      }
    } else {
      console.log('ws is undefined');
    }
    return;
  } else {
    let channelName = ' ';
    if (username1 < username2) {
      channelName = username1 + username2;
    }
    channelName = username2 + username1;

    const checkChannel: Channel | undefined = server.getChannel(channelName);
    if (checkChannel !== undefined) {
      const Answer: ServerInterfaceTypes.createDirectChannelSendback = {
        command: 'createDirectChannelSendback',
        payload: { succeeded: false, typeOfFail: 'existingName' },
      };
      const result = JSON.stringify(Answer);
      if (ws !== undefined) {
        if (ws.readyState === WebSocket.OPEN) {
          debug('send back statement in createDirectChannel function');
          ws.send(result);
        }
      }
      return;
    } else {
      new DirectMessageChannel(channelName, user1, user2);
      const Answer: ServerInterfaceTypes.createDirectChannelSendback = {
        command: 'createDirectChannelSendback',
        payload: { succeeded: true },
      };
      const result = JSON.stringify(Answer);
      if (ws !== undefined) {
        if (ws.readyState === WebSocket.OPEN) {
          debug('send back statement in register function');
          ws.send(result);
        }
      }
      return;
    }
  }
}

function deleteChannel(channelName: string, ws: IWebSocket): void {
  const channel: Channel | undefined = server.getChannel(channelName);
  if (channel === undefined) {
    const Answer: ServerInterfaceTypes.deleteChannelSendback = {
      command: 'deleteChannelSendback',
      payload: { succeeded: false, typeOfFail: 'nonexisting channel' },
    };
    const result = JSON.stringify(Answer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in deleteChannel function');
        ws.send(result);
      }
    }
    return;
  } else {
    //this function does not exists yet:
    //server.deleteChannel(channelName);
    const Answer: ServerInterfaceTypes.deleteChannelSendback = {
      command: 'deleteChannelSendback',
      payload: { succeeded: true },
    };
    const result = JSON.stringify(Answer);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        debug('send back statement in deleteChannel function');
        ws.send(result);
      }
    }
    return;
  }
}

/**
 * Server ontvangt string, wordt gedecodeert,
 * men stelt vast dat er iets fout loopt, een verkeerde formaat, of een lege veld ...
 * Dan zal de dispatcher deze functie oproepen met nodige errorcode.
 * Deze functie is eigenlijk een functie in de "server",
 * Die de error json zal terug sturen naar de client.
 *
 * @param STATUS_CODE number, definieert wat er is fout gelopen.
 * @returns void
 */
export function callSendBackInServer(STATUS_CODE: number, ws: IWebSocket): void {
  // wordt niet automatisch ingevuld want is error handler. (just to be safe)
  const ListOfJsonErrorMessages1: ServerInterfaceTypes.Error[] = [];
  debug('inside callSendBackInServer function in server-dispatcher-functions');

  switch (STATUS_CODE) {
    case 0:
      ListOfJsonErrorMessages1.push({
        command: 'ERROR',
        payload: { Status: ERROR_CODES[0] },
      });
      break;
    case 1:
      ListOfJsonErrorMessages1.push({
        command: 'ERROR',
        payload: { Status: ERROR_CODES[1] },
      });
      break;
  }
  if (ListOfJsonErrorMessages1[0] !== undefined) {
    debug('send back statement in callSendBackInServer function');
    ws.send(JSON.stringify(ListOfJsonErrorMessages1[0]));
  }
  return;
}