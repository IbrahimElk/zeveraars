// Author: Maité Desmedt
// Date: 18/4/2023
import { openFriendsList } from '../friend-chatter/friendslist.js';
// @ts-ignore
import * as THREE from 'three';
import { BuildingNames } from '../threejs/dataToImport.js';
//import { ClientChannel } from '../../client-dispatcher/client-channel-logic.js';

export function redirect(building: THREE.Object3D<THREE.Event>) {
  let buildingName;
  if (building instanceof THREE.Mesh && building.parent instanceof THREE.Group) {
    buildingName = building.parent.name;
  } else {
    buildingName = building.name;
  }
  switch (buildingName) {
    case BuildingNames.nameacco:
      openFriendsList();
      break;
    case BuildingNames.namea200:
      sessionStorage.setItem('aula', BuildingNames.namea200);
      window.location.href = 'chatter/chat-window.html';
      break;
    case BuildingNames.namec200:
      sessionStorage.setItem('aula', BuildingNames.namec200);
      window.location.href = 'chatter/chat-window.html';
      break;
    case BuildingNames.namee200:
      sessionStorage.setItem('aula', BuildingNames.namee200);
      window.location.href = 'chatter/chat-window.html';
      break;
    case BuildingNames.namek200:
      sessionStorage.setItem('aula', BuildingNames.namek200);
      window.location.href = 'chatter/chat-window.html';
      break;
    case BuildingNames.namel200:
      sessionStorage.setItem('aula', BuildingNames.namel200);
      window.location.href = 'chatter/chat-window.html';
      break;
    case BuildingNames.namem200:
      sessionStorage.setItem('aula', BuildingNames.namem200);
      window.location.href = 'chatter/chat-window.html';
      break;
    case BuildingNames.namen200:
      sessionStorage.setItem('aula', BuildingNames.namen200);
      window.location.href = 'chatter/chat-window.html';
      break;
    case BuildingNames.names200:
      sessionStorage.setItem('aula', BuildingNames.names200);
      window.location.href = 'chatter/chat-window.html';
      break;
    case BuildingNames.nameb200:
      sessionStorage.setItem('aula', BuildingNames.nameb200);
      window.location.href = 'chatter/chat-window.html';
      break;
    case BuildingNames.namemoni:
      sessionStorage.setItem('aula', BuildingNames.namemoni);
      window.location.href = 'chatter/chat-window.html';
      break;
    case BuildingNames.namef200:
      sessionStorage.setItem('aula', BuildingNames.namef200);
      window.location.href = 'chatter/chat-window.html';
      break;
    case BuildingNames.nameh200:
      sessionStorage.setItem('aula', BuildingNames.nameh200);
      window.location.href = 'chatter/chat-window.html';
      break;
    case BuildingNames.namenano:
      sessionStorage.setItem('aula', BuildingNames.namenano);
      window.location.href = 'chatter/chat-window.html';
      break;
    case BuildingNames.named200:
      sessionStorage.setItem('aula', BuildingNames.named200);
      window.location.href = 'chatter/chat-window.html';
      break;
    case BuildingNames.nameqdv:
      sessionStorage.setItem('aula', BuildingNames.nameqdv);
      window.location.href = 'chatter/chat-window.html';
      break;
    case BuildingNames.nameg200:
      sessionStorage.setItem('aula', BuildingNames.nameg200);
      window.location.href = 'chatter/chat-window.html';
      break;
    default:
      break;
  }
}
