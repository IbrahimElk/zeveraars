//Author: Barteld Van Nieuwenhove
//Date: 2022/11/14

import exp from 'constants';
import { channel } from 'diagnostics_channel';
import { expect, describe, it, vi } from 'vitest';
import { Message } from '../message/message.js';
import { User } from '../user/user.js';
import { Channel } from './channel.js';
import { PublicChannel } from './publicchannel.js';

describe('Channel', () => {
  it('name tests', () => {
    const owner = new User('Hello', 'world');
    const channel = new PublicChannel('publicChannel', owner);
    expect(channel.getName()).toEqual('publicChannel');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    expect(channel.getUsers().size).toEqual(1);
    expect(channel.getOwner()).toEqual(owner);
    channel.addUser(new User('Heeey', 'Hooo'));
    expect(channel.getUsers().size).toEqual(2);
    const firstMessage = new Message(owner, 'First message');
    channel.addMessage(firstMessage);
    expect(channel.getMessages().length).toEqual(1);
    const secondMessage = new Message(new User('Haaay', 'hooo'), 'First message');
    channel.addMessage(secondMessage);
    expect(channel.getMessages().length).toEqual(2);
    expect(channel.getMessages(2)[0]).toEqual(secondMessage);
    expect(channel.getMessages(2)[1]).toEqual(firstMessage);
  });
});