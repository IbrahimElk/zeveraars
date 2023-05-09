//Author: Ibrahim El Kaddouri
//Date: 2022/11/14

import type * as ClientInteraceTypes from './../proto/client-types.js';
import type * as ServerInterfaceTypes from './../proto/server-types.js';
import type { IWebSocket } from '../proto/ws-interface.js';
import { ClientUser } from './client-user.js';
import { encodeHTMlInput } from '../encode-decode/encode.js';

export class ClientLogin {
  public static Id_of_tags = {
    input_username_login: `sign-in-username`,
    input_password_login: `password`,
    input_username_reg: `register-username`,
    input_password_reg: `password-register`,
  };
  /**
   * Request a login from the server by clicking on a button.
   * @param ws websocket, connected to the server
   * @param document document, the login web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree.
   * @author Ibrahim
   */
  public static login(ws: IWebSocket | WebSocket, usernameInput: string, passwordInput: string) {
    const sessionID = ClientUser.getsessionID();
    if (sessionID) {
      const login: ClientInteraceTypes.login = {
        command: 'login',
        payload: {
          sessionID,
          usernameUUID: encodeHTMlInput(`@${usernameInput}`),
          password: encodeHTMlInput(passwordInput),
        },
      };
      console.log('login');
      ws.send(JSON.stringify(login));
    }
  }
  /**
   * Request a registration from the server by clicking on a button.
   * @param ws websocket, connected to the server
   * @param document document, the login web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree.
   * @author Ibrahim
   */
  public static registration(ws: IWebSocket | WebSocket, document: Document) {
    const username = document.getElementById(ClientLogin.Id_of_tags.input_username_reg) as HTMLInputElement;
    const password = document.getElementById(ClientLogin.Id_of_tags.input_password_reg) as HTMLInputElement;
    const sessionId = ClientUser.getsessionID();
    if (sessionId) {
      const registration: ClientInteraceTypes.registration = {
        command: 'registration',
        payload: {
          sessionID: sessionId,
          usernameUUID: encodeHTMlInput(username.value),
          password: encodeHTMlInput(password.value),
        },
      };
      ws.send(JSON.stringify(registration));
    }
  }

  public static logout(): void {
    const sessionId = ClientUser.getsessionID();
    if (sessionId) {
      const logoutJSON: ClientInteraceTypes.logout = {
        command: 'logout',
        payload: { sessionID: sessionId },
      };
      const ws = ClientUser.getWebSocket();
      ws.send(JSON.stringify(logoutJSON));
    }
  }

  public static timetableRequest(authenticationCode: string) {
    const sessionId = ClientUser.getsessionID();
    if (sessionId) {
      const classRequest: ClientInteraceTypes.requestTimetable = {
        command: 'requestTimetable',
        payload: {
          sessionID: sessionId,
          authenticationCode: authenticationCode,
        },
      };
      const ws = ClientUser.getWebSocket();
      ws.send(JSON.stringify(classRequest));
    }
  }

  // --------------------------------------------------------------------------------------------------------------------------
  // SENDBACK FUNCTIONS
  // --------------------------------------------------------------------------------------------------------------------------

  public static registrationSendback(payload: ServerInterfaceTypes.registrationSendback['payload']): void {
    if (payload.succeeded) {
      console.log('registrationSendback');
      ClientUser.setUUID(payload.user.UUID);
      ClientUser.setUsername(payload.user.name);
      ClientUser.setProfilePicture(payload.user.profilePicture);
      ClientUser.updateTimetable(payload.timetable);

      // if without kuleuven login(this branch)
      window.location.href = './home/home.html';

      // if with kuleuven login(other branch)
      // const authUrl = `https://webwsq.aps.kuleuven.be/sap/bc/sec/oauth2/authorize?state=anystate&response_type=code&client_id=OA_UADCKXHLP&redirect_uri=https://zeveraar.westeurope.cloudapp.azure.com/home/home.html&scope=ZC_EP_UURROOSTER_OAUTH_SRV_0001%20ZC_EP_OPO_INFO_SRV_0001`;
      // window.location.href = authUrl;
    } else {
      alert(
        `You were not able to succesfully register because of the following problem: ${payload.typeOfFail}\n Please try again`
      );
    }
  }
  public static loginSendback(payload: ServerInterfaceTypes.loginSendback['payload']) {
    if (payload.succeeded) {
      ClientUser.setUUID(payload.user.UUID);
      ClientUser.setUsername(payload.user.name);
      ClientUser.setProfilePicture(payload.user.profilePicture);
      ClientUser.updateTimetable(payload.timetable);

      window.location.href = './home/home.html';

      // if with kuleuven login(other branch) (timetable is opgeslagen in localStorage)
      // window.location.href = './home/home.html';
    } else {
      const error = payload.typeOfFail;
      alert(`You were not able to succesfully login because of the following problem: ${error}\n Please try again`);
    }
  }
  public static logoutSendback(payload: ServerInterfaceTypes.logoutSendback['payload']): void {
    if (payload.succeeded) {
      sessionStorage.clear();
      const ws = ClientUser.getWebSocket() as WebSocket;
      ws.close();
      window.location.href = '../index.html';
    } else {
      const error = payload.typeOfFail;
      alert(`You were not able to succesfully logout because of the following problem: ${error}\n Please try again`);
    }
  }

  public static timetableRequestSendback(payload: ServerInterfaceTypes.requestTimetableSendback['payload']) {
    if (payload.succeeded) {
      ClientUser.updateTimetable(payload.timetable);
      window.location.href = '../home/home.html';
    } else {
      const error = payload.typeOfFail;
      alert(`You were not able to get the next class because of the following problem: ${error}\n Please try again`);
    }
  }

  // store session ID in browser cookie for an hour, and you can access the value from any path within any tab in the browser
  public static sessionIDSendback(payload: ServerInterfaceTypes.sessionIDSendback['payload']) {
    ClientUser.setsessionID(payload.value);
    console.log('sessionIDSendback');
  }
}
