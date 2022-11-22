//Author: Barteld Van Nieuwenhove
//Date: 2022/10/31

import type { User } from '../user/user.js';
import type { UUID } from '../user/uuid.js';
import { server } from '../server/server.js';
import { Channel } from './channel.js';

export class PrivateChannel extends Channel {
  private owner: UUID;

  constructor(name: string, owner: User) {
    super(name);
    this.owner = owner.getUUID();
    this.addUser(owner);
  }

  /**
   * Adds specified user to this Private Channel.
   * @param user The user to be added.
   */
  addUser(user: User): void {
    if (this.users.has(user.getUUID())) return;
    this.users.add(user.getUUID());
    if (!user.getChannels().has(this)) {
      user.addChannel(this);
    }
  }

  /**
   * Removes specified user from this Private Channel.
   * @param user The user to be removed.
   */
  removeUser(user: User): void {
    this.users.delete(user.getUUID());
    if (user.getChannels().has(this)) {
      user.removeChannel(this);
    }
  }

  /**
   * Retrieves the user owning this Private Channel.
   * @returns The user representing the owner.
   */
  getOwner(): User {
    const owner = server.getUser(this.owner);
    if (owner === undefined) {
      throw new Error('impossible, perhaps if we allow deletion of users this is possible');
    }
    return owner;
  }
  /**
   * Connects a user to the channel and adds them to the members if needed.
   * @param user
   */
  override systemAddConnected(user: User): void {
    if (this.connected.has(user.getUUID())) {
      return;
    } else {
      this.connected.add(user.getUUID());
      if (!this.users.has(user.getUUID())) {
        this.users.add(user.getUUID());
      }
    }
  }

  /**
   * Makes a JSON representation of this private channel.
   * @returns A JSON represenation of this private channel.
   */
  toJSON() {
    return {
      CUID: this.getCUID(),
      name: this.getName(),
      messages: this.getMessages(),
      users: this.getUsers(),
      DATECREATED: this.getDateCreated(),
      owner: this.owner,
      channelType: 'PrivateChannel',
    };
  }
}
