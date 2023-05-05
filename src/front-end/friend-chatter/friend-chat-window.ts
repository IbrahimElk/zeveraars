import { ClientFriend } from '../client-dispatcher/client-friend-logic.js';
import { client } from '../main.js';
import { showMessage } from '../channel-chatter/chat-message.js';
import { ClientChannel } from '../client-dispatcher/client-channel-logic.js';
import { ClientUser } from '../client-dispatcher/client-user.js';
import { ClientMisc } from '../client-dispatcher/client-misc-logic.js';
import { encodeHTMlInput } from '../encode-decode/encode.js';

declare const bootstrap: any;

let channelCUID = '';
const friendUUID = ClientUser.getCurrentFriend();
if (friendUUID) {
  let name = '';
  const clientUUID = ClientUser.getUUID();
  if (clientUUID) {
    const uuids = [clientUUID, friendUUID].sort();
    name = uuids.join('');
  }
  channelCUID = '#' + name;
}

if (window.location.href.includes('friend-chat-window.html')) {
  ClientMisc.validateSession();
  window.onbeforeunload = function () {
    ClientChannel.disconnectChannel(channelCUID); //FIXME:
  };
  enterPage();
}

function enterPage(): void {
  ClientChannel.connectChannel(channelCUID);
  // ClientChannel.connectChannel(client, channelId); //FIXME:
  // ClientChannel.connectChannel(channelId); //FIX

  // for (const msg of messages) {
  //   showMessage(msg.date, msg.sender, msg.text, msg.trust);
  // }

  const textInputMessage = document.getElementById('messageInput') as HTMLInputElement;

  textInputMessage.addEventListener('keypress', (event) => {
    //code voor shortcut ENTER
    if (event.key === 'Enter') {
      shortcut();
    }
    const start = Date.now().valueOf();
    ClientUser.AddTimeStamp(encodeHTMlInput(event.key), start);
  });

  const textInputButtonChannel = document.getElementById('buttonSend') as HTMLButtonElement;

  textInputButtonChannel.addEventListener('click', () => {
    console.log('attempting to send a message...');
    ClientChannel.sendChannelMessage(
      encodeHTMlInput(textInputMessage.value),
      Array.from(ClientUser.GetDeltaCalulations()),
      channelCUID
    );
    ClientUser.removeCurrentTimeStamps();
    textInputMessage.value = '';
  });

  //code voor shortcut CTRL-F, //FIXME: SEARCH OLD MESSAGES
  document.body.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.ctrlKey && event.key.toLowerCase() === 'f') {
      event.preventDefault(); // prevent the default behavior of CTRL-F
      // call the function to open the "Find" dialog box here
      showSearchBar();
    }
  });
  // closing search bar
  const closeButton = document.getElementById('close-button') as HTMLButtonElement;
  closeButton.addEventListener('click', (event) => {
    event.preventDefault();
    const input1 = document.getElementById('input1') as HTMLInputElement;
    input1.style.display = 'none';
  });
}
const textInputMessage = document.getElementById('messageInput') as HTMLInputElement;

function shortcut() {
  console.log('attempting to send a message...');
  ClientChannel.sendChannelMessage(
    encodeHTMlInput(textInputMessage.value),
    Array.from(ClientUser.GetDeltaCalulations()),
    channelCUID
  );
  ClientUser.removeCurrentTimeStamps();
  textInputMessage.value = '';
}

function showSearchBar() {
  const input1 = document.getElementById('input1') as HTMLInputElement;
  input1.style.display = 'inline-block';
}
