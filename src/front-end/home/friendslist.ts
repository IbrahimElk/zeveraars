import type { ClientUser } from '../client-dispatcher/client-user.js';
import { ClientFriend } from '../client-dispatcher/client-friend-logic.js';

export function openFriendsList(client: ClientUser) {
  const myOffcanvas = document.getElementById('myOffcanvas');
  const addFriendButton = document.getElementById('addFriendBtn') as HTMLElement;
  const closeButton = document.getElementById('close-button') as HTMLElement;

  // OPEN CANVAS
  myOffcanvas?.classList.toggle('show');

  // ADD FRIEND KNOP
  addFriendButton.addEventListener('click', function () {
    addFriend();
  });

  // CLOSE CANVAS KNOP
  closeButton.addEventListener('click', function () {
    myOffcanvas?.classList.remove('show'); // remove the 'show' class to hide the offcanvas
    const friendsListEl = document.getElementById('friendslist') as HTMLElement;
    while (friendsListEl.firstChild) {
      friendsListEl.removeChild(friendsListEl.firstChild);
    }
  });

  // LIST FRIENDS
  ClientFriend.getListFriends();

  // TODO: REMOVE FRIEND BUTTON
}

function addFriend() {
  const usernameID = (document.getElementById('newFriendUsername') as HTMLInputElement).value;
  ClientFriend.addFriend(usernameID);
}
