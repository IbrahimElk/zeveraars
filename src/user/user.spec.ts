//Author: Barteld Van Nieuwenhove
//Date: 2022/11/14

import { expect, describe, it, vi } from 'vitest';
import { serverInstance, serverSave } from '../database/server_database.js';
import { User } from '../user/user.js';

/**
 * Tests basic functionalities of User object. Only to be tested on fresh server.
 * Does not work on gitlab due to adding files.
 */
describe('User', () => {
  it('password and name tests', async () => {
    // const user = new User('Hello', 'world');
    // expect(user.getName()).toEqual('Hello');
    // expect(user.getPassword()).toEqual('world');
    // user.setName('newName');
    // user.setPassword('newPassword');
    // expect(user.getName()).toEqual('newName');
    // expect(user.getPassword()).toEqual('newPassword');
    // await serverSave(serverInstance, 'test');
  });
  it('friend test', async () => {
    // const user = new User('Hello', 'world');
    // const friend = new User('Goodbye', 'world');
    // expect(user.isFriend(friend)).toEqual(false);
    // user.addFriend(friend);
    // expect(user.isFriend(friend)).toEqual(true);
    // expect(friend.isFriend(user)).toEqual(true);
    // await serverSave(serverInstance, 'test');
  });
});
