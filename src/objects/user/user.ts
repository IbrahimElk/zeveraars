//Author: Barteld Van Nieuwenhove, El Kaddouri Ibrahim
//Date: 2022/10/31

import type { Channel } from '../channel/channel.js';
import type { IWebSocket } from '../../front-end/proto/ws-interface.js';
import type { DirectMessageChannel } from '../channel/directmessagechannel.js';
import type { PublicChannel } from '../channel/publicchannel.js';
import Debug from 'debug';
import { TimeSlot, Timetable } from '../timeTable/timeTable.js';
import type { KULTimetable } from '../timeTable/fakeTimeTable.js';
import { v4 as uuid } from 'uuid';
import { ChatterAPI } from '../../server/chatterapi.js';
// import { Main } from '../../server/main.js';

const debug = Debug('user.ts');
export class User {
  private UUID: string;
  private name: string;
  private password: string;
  private friendChannels: Set<string>;
  private publicChannels: Set<string>;
  private friends: Set<string>;
  private connectedChannel: string | undefined;
  private webSocket: Set<IWebSocket>;
  private sessionID: string | undefined;
  private ngramMean: Map<string, number>;
  private ngramCounter: Map<string, number>;
  private timeTable: Timetable | undefined;

  constructor(name: string, password: string) {
    this.UUID = '@' + name;
    this.name = name;
    this.password = password;
    this.friendChannels = new Set<string>();
    this.publicChannels = new Set<string>();
    this.friends = new Set<string>();
    this.connectedChannel = undefined;
    this.ngramMean = new Map<string, number>();
    this.ngramCounter = new Map<string, number>();
    this.webSocket = new Set<IWebSocket>();
    this.sessionID = undefined;
    this.timeTable = undefined;
  }
  // ------------------------------------------------------------------------------------------------------------
  // GETTER FUNCTIONS
  // ------------------------------------------------------------------------------------------------------------

  /**
   * Retrieves the UUID of this user.
   * @returns The UUID associated with this user
   */
  public getUUID(): string {
    return this.UUID;
  }

  /**
   * Retrieves the name of this user.
   * @returns A string representing this user name.
   */
  public getName(): string {
    return this.name;
  }
  /**
   * Retrieves the password of this user.
   * @returns The password of this user.
   */
  // TODO: SHould be hashed.!!
  public getPassword(): string {
    return this.password;
  }

  /**
   * Retrieves all friends of this user.
   * @returns A set of UUIDS representing all friends this user has.
   */
  public getFriends(): Set<string> {
    return new Set<string>(this.friends);
  }
  /**
   *
   */
  getPublicChannels(): Set<string> {
    return new Set<string>(this.publicChannels);
  }
  /**
   *
   */
  getFriendChannels(): Set<string> {
    return new Set<string>(this.friendChannels);
  }

  /**
   * Retreives channel this user is currently connected to.
   * @returns The channel this user is currently connected to, if none it returns the default channel.
   */
  public getConnectedChannel(): string | undefined {
    const channelCUID = this.connectedChannel;
    if (channelCUID !== undefined) {
      return channelCUID;
    } else {
      return undefined;
    }
  }

  /**
   * Retrieves the server to client websocket.
   * @returns The websocket for communicating from server to client if this user is connected to the server, undefined otherwise.
   */
  public getWebSocket(): Set<IWebSocket> | undefined {
    // websocket is immutable, so no need to shallow copy or deep copy
    return new Set(this.webSocket);
  }
  public getSessionID(): string | undefined {
    return this.sessionID;
  }

  // ------------------------------------------------------------------------------------------------------------
  // iS FUNCTIONS
  // ------------------------------------------------------------------------------------------------------------

  /**
   * Checks whether a user is friends with this user.
   * @param friend The user being checked whether they are this user's friend.
   * @returns True if the given user is friends with this user, false otherwise.
   */
  public isFriend(friend: User): boolean {
    for (const uuid of this.friends) {
      if (friend.UUID === uuid) {
        return true;
      }
    }
    return false;
  }
  /**
   * Checks whether a channel is saved to this user.
   * @param channel The channel to be checked wheter it's saved to this user
   * @returns a boolean indicating whether the channel has been saved to this user or not.
   */
  public isPartOfFriendChannel(channel: DirectMessageChannel): boolean {
    for (const cuid of this.friendChannels) {
      if (channel.getCUID() === cuid) {
        return true;
      }
    }
    return false;
  }
  /**
   * Checks whether a channel is saved to this user.
   * @param channel The channel to be checked wheter it's saved to this user
   * @returns a boolean indicating whether the channel has been saved to this user or not.
   */
  public isPartOfPublicChannel(channel: PublicChannel): boolean {
    for (const cuid of this.publicChannels) {
      if (channel.getCUID() === cuid) {
        return true;
      }
    }
    return false;
  }

  // ------------------------------------------------------------------------------------------------------------
  // SETTER FUNCTIONS
  // ------------------------------------------------------------------------------------------------------------

  /**
   * Overrides this user's current name with a new one.
   * @param newName A string representing the new name.
   */
  public setName(newName: string): void {
    this.name = newName;
  }

  /**
   * Overrides this user's current password with a new one.
   * @param newPassword A string representing the new password.
   */
  public setPassword(newPassword: string): void {
    this.password = newPassword;
  }

  public addWebsocket(websocket: IWebSocket): void {
    this.webSocket.add(websocket);
  }

  public removeWebSocket(websocket: IWebSocket): void {
    this.webSocket.delete(websocket);
  }

  public setsessionID(sessionID: string): void {
    this.sessionID = sessionID;
  }

  /**
   * Adds a user to this user's set of friends.
   * @param friend The user being added to this user's friends.
   */
  public addFriend(friendId: string): void {
    this.friends.add(friendId);
    // friend.friends.add(this.UUID); //FIXME:
  }
  /**
   * Removes a user from this user's set of friends.
   * @param friend The user being removed from this user's friends.
   */
  public removeFriend(friendId: string): void {
    this.friends.delete(friendId);
    // friend.friends.delete(this.UUID);//FIXME:
  }
  /**
   * Adds a channel to this user's saved channels
   * @param channel The channel to be added to this user.
   */
  public addFriendChannel(channelId: string): void {
    this.friendChannels.add(channelId);
  }
  /**
   * Adds a channel to this user's saved channels
   * @param channel The channel to be added to this user.
   */
  public addPublicChannel(channelId: string): void {
    this.publicChannels.add(channelId);
  }
  /**
   * Removes a channel from this user's saved channels
   * @param channel The channel to be removed from this user.
   */
  public removeFriendChannel(channelId: string): void {
    this.friendChannels.delete(channelId);
  }
  /**
   * Removes a channel from this user's saved channels
   * @param channel The channel to be removed from this user.
   */
  public removePublicChannel(channelId: string): void {
    this.publicChannels.delete(channelId);
  }

  /**
   * Sets the channel this user is currently connected to. If this user has never connected to this channel it gets saved to this users saved channels.
   * @param newChannel The channel to connect this user to.
   */
  public async connectToChannel(newChannel: Channel): Promise<void> {
    if (this.connectedChannel === undefined) return;
    const oldConnectedChannel = await ChatterAPI.getChatServer().getChannelByCUID(this.connectedChannel);
    if (oldConnectedChannel === undefined) return;
    else oldConnectedChannel.systemRemoveConnected(this);

    newChannel.systemAddConnected(this);
    this.connectedChannel = newChannel.getCUID();
  }

  /**
   * Disconnects the user from the channel it is connected to. If this user has never connected to this channel it gets saved to this users saved channels.
   * @param newChannel The channel to connect this user to.
   */
  public async disconnectFromChannel(): Promise<void> {
    if (this.connectedChannel === undefined) return;
    if (this.connectedChannel === undefined) return;
    const oldConnectedChannel = await ChatterAPI.getChatServer().getChannelByCUID(this.connectedChannel);
    if (oldConnectedChannel === undefined) return;
    oldConnectedChannel.systemRemoveConnected(this);
    this.connectedChannel = undefined;
  }

  //--------------------------------------------------------------------------------
  //-----------------------------// FOR KEYSTROKES //-----------------------------//
  //--------------------------------------------------------------------------------

  getNgrams(): Map<string, number> {
    return new Map(this.ngramMean);
  }

  /**
   *
   * @param NewNgram
   */
  setNgrams(newNgram: Map<string, number>) {
    for (const element of newNgram) {
      this.changeStateUser(element, this.ngramMean, this.ngramCounter);
    }
  }
  /**
   * M_k−1 + (x_k − M_k−1)/k
   * @param NewValue
   * @param OldValue
   * @param Kvalue
   * @returns
   */
  private calculateNewMean(newValue: number, oldValue: number, kValue: number) {
    const newMeanOfUser = oldValue + (newValue - oldValue) / kValue;
    return newMeanOfUser;
  }
  /**
   *
   * @param NewNgramElement
   * @param NgramMean
   * @param NgramCounter
   */
  private changeStateUser(
    newNgramElement: [string, number],
    ngramMean: Map<string, number>,
    ngramCounter: Map<string, number>
  ) {
    if (ngramMean.has(newNgramElement[0]) && ngramMean.has(newNgramElement[0])) {
      //typecast gedaan maar ook gecontroleerd via .has()
      let kValue: number = ngramCounter.get(newNgramElement[0]) as number;
      const newMean: number = this.calculateNewMean(
        newNgramElement[1],
        ngramMean.get(newNgramElement[0]) as number,
        kValue
      );
      this.ngramMean.set(newNgramElement[0], newMean);
      this.ngramCounter.set(newNgramElement[0], kValue++);
    }
  }

  //--------------------------------------------------------------------------------
  //----------------------------// FOR TIMETABLE //-------------------------------//
  //--------------------------------------------------------------------------------

  /**
   * Retreives the timetable of this user.
   * @returns The timeTable of this user if it exists, undefined otherwise.
   */
  getTimeTable(): Timetable | undefined {
    return this.timeTable;
  }

  public updateTimeTable(timetable: KULTimetable): void {
    const timeSlotArray: TimeSlot[] = [];
    for (const timeSlot of timetable.timeSlots) {
      const startHours = Number.parseInt(timeSlot.startTime.slice(2, 4));
      const startMinutes = Number.parseInt(timeSlot.startTime.slice(5, 7));
      const startSeconds = Number.parseInt(timeSlot.startTime.slice(8, 10));
      const startTime = new Date().setUTCHours(startHours, startMinutes, startSeconds);

      const endHours = Number.parseInt(timeSlot.endTime.slice(2, 4));
      const endMinutes = Number.parseInt(timeSlot.endTime.slice(5, 7));
      const endSeconds = Number.parseInt(timeSlot.endTime.slice(8, 10));
      const endTime = new Date().setUTCHours(endHours, endMinutes, endSeconds);

      timeSlotArray.push(
        new TimeSlot(
          timeSlot.longDescription,
          startTime,
          endTime
          // User.hashDescriptionToBuilding(timeSlot.longDescription)
        )
      );
    }
    this.timeTable = new Timetable(timeSlotArray);
  }

  /**
   * Makes a JSON representation of this user.
   * @returns A JSON represenation of this user.
   */
  toJSON() {
    return {
      UUID: this.UUID,
      name: this.name,
      password: this.password,
      publicChannels: [...this.publicChannels],
      friendChannels: [...this.friendChannels],
      friends: [...this.friends],
      ngramMean: Array.from(this.ngramMean.entries()),
      ngramCounter: Array.from(this.ngramCounter.entries()),
    };
  }
}
