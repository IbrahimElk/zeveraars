/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
//Author: Guust Luyckx
//Date: 2022/10/31

import fs from 'fs';
import type { Channel } from '../channel/channel.js';
import { CUID } from '../channel/cuid.js';
import { DirectMessageChannel } from '../channel/directmessagechannel.js';
import { PrivateChannel } from '../channel/privatechannel.js';
import { PublicChannel } from '../channel/publicchannel.js';
import { Message } from '../message/message.js';
import { MUID } from '../message/muid.js';
import { User } from '../user/user.js';
import { UUID } from '../user/uuid.js';

/**
 * This function saves an (array of) object(s) of the class Channel as a json string.
 * @param channel this input should be a Channel object or an array of Channel objects
 */

export async function channelSave(channel: Channel | Channel[]): Promise<string> {
  return new Promise((resolve) => {
    if (channel instanceof Array) {
      for (const x of channel) {
        const obj = JSON.stringify(x, (_key, value) => (value instanceof Set ? [...value] : value));
        const id = x.getCUID().toString();
        const path = './assets/database/channels/' + id + '.json';
        fs.writeFileSync(path, obj);
      }
    } else {
      const obj = JSON.stringify(channel, (_key, value) => (value instanceof Set ? [...value] : value));
      const id = channel.getCUID().toString();
      const path = './assets/database/channels/' + id + '.json';
      fs.writeFileSync(path, obj);
    }
    return resolve('Done');
  });
}

/**
 * This function loads all the Channel objects that are currently stored as a json file.
 * @returns an array with all the Channel objects
 */

export async function channelsLoad(): Promise<Channel[]> {
  return new Promise((resolve) => {
    const directory = fs.opendirSync('./assets/database/channels');
    let file;
    const results = [];
    while ((file = directory.readSync()) !== null) {
      const path = './assets/database/channels/' + file.name;
      const result = fs.readFileSync(path, 'utf-8');
      const savedChannel = JSON.parse(result);
      const savedChannelCUID: CUID = Object.assign(new CUID(), savedChannel['CUID']);
      savedChannel['CUID'] = savedChannelCUID;
      const channelMessagesArray = [];
      for (const savedMessage of savedChannel['messages']) {
        savedMessage['MUID'] = Object.assign(new MUID(), savedMessage['MUID']);
        savedMessage['USER'] = Object.assign(new UUID(), savedMessage['USER']);
        const message = Object.assign(new Message(new User('dummy', 'password'), ''), savedMessage);
        channelMessagesArray.push(message);
      }
      savedChannel['messages'] = channelMessagesArray;
      const savedChannelUsersSet = new Set<UUID>();
      const savedChannelUsers = savedChannel['users'];
      for (const uuid of savedChannelUsers) {
        const savedChannelUsersUUID: UUID = Object.assign(new UUID(), uuid);
        savedChannelUsersSet.add(savedChannelUsersUUID);
      }
      savedChannel['users'] = savedChannelUsersSet;
      let channel;
      if (savedChannel['channelType'] === 'PrivateChannel') {
        savedChannel['owner'] = Object.assign(new UUID(), savedChannel['owner']);
        delete savedChannel['channelType'];
        channel = Object.assign(
          new PrivateChannel('anyvalueforinitalizing', new User('dummy', 'password')),
          savedChannel
        );
      }
      if (savedChannel['channelType'] === 'PublicChannel') {
        savedChannel['owner'] = Object.assign(new UUID(), savedChannel['owner']);
        delete savedChannel['channelType'];
        channel = Object.assign(
          new PublicChannel('anyvalueforinitalizing', new User('dummy', 'password')),
          savedChannel
        );
      }
      if (savedChannel['channelType'] === 'DirectMessageChannel') {
        delete savedChannel['channelType'];
        channel = Object.assign(
          new DirectMessageChannel(
            'anyvalueforinitalizing',
            new User('dummy', 'password'),
            new User('dummy', 'password')
          ),
          savedChannel
        );
      }
      results.push(channel);
    }
    directory.closeSync();
    return resolve(results);
  });
}

/**
 * This function returns a Channel object based on its name.
 * The string has to be a valid string of an object that is stored as a json.
 * @param name the name of the Channel object (it has to be a real name of a channel that is stored as a json)
 * @returns the Channel object
 */

export function channelLoad(cuid: CUID): Channel {
  const name = cuid.toString();
  const path = './assets/database/channels/' + name + '.json';
  const result = fs.readFileSync(path, 'utf-8');
  const savedChannel = JSON.parse(result);
  const savedChannelCUID: CUID = Object.assign(new CUID(), savedChannel['CUID']);
  savedChannel['CUID'] = savedChannelCUID;
  const channelMessagesArray = [];
  for (const savedMessage of savedChannel['messages']) {
    savedMessage['MUID'] = Object.assign(new MUID(), savedMessage['MUID']);
    savedMessage['USER'] = Object.assign(new UUID(), savedMessage['USER']);
    const message = Object.assign(new Message(new User('dummy', 'password'), ''), savedMessage);
    channelMessagesArray.push(message);
  }
  savedChannel['messages'] = channelMessagesArray;
  const savedChannelUsersSet = new Set<UUID>();
  const savedChannelUsers = savedChannel['users'];
  for (const uuid of savedChannelUsers) {
    const savedChannelUsersUUID: UUID = Object.assign(new UUID(), uuid);
    savedChannelUsersSet.add(savedChannelUsersUUID);
  }
  savedChannel['users'] = savedChannelUsersSet;
  if (savedChannel['channelType'] === 'PrivateChannel') {
    savedChannel['owner'] = Object.assign(new UUID(), savedChannel['owner']);
    delete savedChannel['channelType'];
    const channel: PrivateChannel = Object.assign(
      new PrivateChannel('anyvalueforinitalizing', new User('dummy', 'password')),
      savedChannel
    );
    return channel;
  }
  if (savedChannel['channelType'] === 'PublicChannel') {
    savedChannel['owner'] = Object.assign(new UUID(), savedChannel['owner']);
    delete savedChannel['channelType'];
    const channel: PublicChannel = Object.assign(
      new PublicChannel('anyvalueforinitalizing', new User('dummy', 'password')),
      savedChannel
    );
    return channel;
  } else {
    delete savedChannel['channelType'];
    const channel: DirectMessageChannel = Object.assign(
      new DirectMessageChannel('anyvalueforinitalizing', new User('dummy', 'password'), new User('dummy', 'password')),
      savedChannel
    );
    return channel;
  }
}

/**
 * This function saves an object of the class User as a json string.
 * @param user this input should be a User object
 */

export async function userSave(user: User): Promise<string> {
  return new Promise((resolve) => {
    const obj = JSON.stringify(user, (_key, value) => (value instanceof Set ? [...value] : value));
    const id = user.getUUID().toString();
    const path = './assets/database/users/' + id + '.json';
    fs.writeFileSync(path, obj);
    return resolve('done');
  });
}

/**
 * This function returns a User object based on its userid.
 * The string has to be a valid string of an object that is stored as a json.
 * @param userid the userid of the User object (it has to be a real userid of a channel that is stored as a json)
 * @returns the User object
 */

export function userLoad(uuid: UUID): User {
  const userId = uuid.toString();
  const path = './assets/database/users/' + userId + '.json';
  const result = fs.readFileSync(path, 'utf-8');
  const savedUser = JSON.parse(result);
  const savedUserUuid: UUID = Object.assign(new UUID(), savedUser['UUID']);
  savedUser['UUID'] = savedUserUuid;
  const savedUserChannelsSet = new Set<CUID>();
  const savedUserChannels = savedUser['channels'];
  for (const cuid of savedUserChannels) {
    const savedUserChannelsCUID: CUID = Object.assign(new CUID(), cuid);
    savedUserChannelsSet.add(savedUserChannelsCUID);
  }
  savedUser['channels'] = savedUserChannelsSet;
  const savedUserFriendsSet = new Set<UUID>();
  const savedUserFriends = savedUser['friends'];
  for (const uuid of savedUserFriends) {
    const savedUserFriendsUUID: UUID = Object.assign(new UUID(), uuid);
    savedUserFriendsSet.add(savedUserFriendsUUID);
  }
  savedUser['friends'] = savedUserFriendsSet;
  const user: User = Object.assign(new User('anyvalueforinitalizing', 'anyvalueforinitalizing'), savedUser);
  return user;
}

/**
 * This function loads all the User objects that are currently stored as a json file.
 * @returns an array with all the User objects
 */

export async function usersLoad(): Promise<User[]> {
  return new Promise((resolve) => {
    const directory = fs.opendirSync('./assets/database/users');
    let file;
    const results = [];
    while ((file = directory.readSync()) !== null) {
      const path = './assets/database/users/' + file.name;
      const result = fs.readFileSync(path, 'utf-8');
      const savedUser = JSON.parse(result);
      const savedUserUuid: UUID = Object.assign(new UUID(), savedUser['UUID']);
      savedUser['UUID'] = savedUserUuid;
      const savedUserChannelsSet = new Set<CUID>();
      const savedUserChannels = savedUser['channels'];
      for (const cuid of savedUserChannels) {
        const savedUserChannelsCUID: CUID = Object.assign(new CUID(), cuid);
        savedUserChannelsSet.add(savedUserChannelsCUID);
      }
      savedUser['channels'] = savedUserChannelsSet;
      const savedUserFriendsSet = new Set<UUID>();
      const savedUserFriends = savedUser['friends'];
      for (const uuid of savedUserFriends) {
        const savedUserFriendsUUID: UUID = Object.assign(new UUID(), uuid);
        savedUserFriendsSet.add(savedUserFriendsUUID);
      }
      savedUser['friends'] = savedUserFriendsSet;
      const user = Object.assign(new User('anyvalueforinitalizing', 'anyvalueforinitalizing'), savedUser);
      results.push(user);
    }
    directory.closeSync();
    return resolve(results);
  });
}
