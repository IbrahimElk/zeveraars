import * as THREE from 'three';
import { BuildingNames } from './dataToImport.js';
import { openFriendsList } from '../friendslist.js';
import { client } from '../../main.js';

function redirected(buildingname: BuildingNames) {
  if (client.isTimeTableInitialised()) {
    sessionStorage.setItem('aula', buildingname);
    window.location.href = '../channel-chatter/chat-window.html';
  }
}

export function redirect(building: THREE.Object3D<THREE.Event>) {
  let buildingName;
  if (building instanceof THREE.Mesh && building.parent instanceof THREE.Group) {
    buildingName = building.parent.name;
  } else {
    buildingName = building.name;
  }
  switch (buildingName) {
    case BuildingNames.nameacco:
      openFriendsList(client);

      break;
    case BuildingNames.namea200:
      redirected(BuildingNames.namea200);
      break;
    case BuildingNames.namec200:
      redirected(BuildingNames.namec200);
      break;
    case BuildingNames.namee200:
      redirected(BuildingNames.namee200);

      break;
    case BuildingNames.namek200:
      redirected(BuildingNames.namek200);

      break;
    case BuildingNames.namel200:
      redirected(BuildingNames.namel200);

      break;
    case BuildingNames.namem200:
      redirected(BuildingNames.namem200);

      break;
    case BuildingNames.namen200:
      redirected(BuildingNames.namen200);

      break;
    case BuildingNames.names200:
      redirected(BuildingNames.names200);

      break;
    case BuildingNames.nameb200:
      redirected(BuildingNames.nameb200);

      break;
    case BuildingNames.namemoni:
      redirected(BuildingNames.namemoni);

      break;
    case BuildingNames.namef200:
      redirected(BuildingNames.namef200);

      break;
    case BuildingNames.nameh200:
      redirected(BuildingNames.nameh200);

      break;
    case BuildingNames.namenano:
      redirected(BuildingNames.namenano);

      break;
    case BuildingNames.named200:
      redirected(BuildingNames.named200);

      break;
    case BuildingNames.nameqdv:
      redirected(BuildingNames.nameqdv);

      break;
    case BuildingNames.nameg200:
      redirected(BuildingNames.nameg200);

      break;
    default:
      break;
  }
}
