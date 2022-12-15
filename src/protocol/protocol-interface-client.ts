// @author John Gao
// @date 2022-11-21

import { z } from 'zod';
/**
 * All the interfaces that the client can send to the server.
 * Each interface contains a command, which identifies the type of the interface
 * and a payload, containing the information useful to the server.
 */

//TODO: UPDATE
// VRAGEN AAN PROF/ASSISTENT WAT EEN BETERE DATATYPE IS.a
export const Schema =
  //:schemaType
  {
    logIn: 'logIn',
    registration: 'registration',
    addFriend: 'addFriend',
    selectFriend: 'SelectFriend',
    exitFriend: 'exitFriend',
    removeFriend: 'removeFriend',
    joinChannel: 'joinChannel',
    exitChannel: 'exitChannel',
    leaveChannel: 'leaveChannel',
    selectChannel: 'selectChannel',
    getList: 'getList',
    friendMessage: 'friendMessage',
    exitMe: 'exitMe',
    ErrorSchema: 'ERROR',
  };

export const ErrorSchema = z.object({
  command: z.literal('ERROR'),
  payload: z.object({
    Status: z.string(),
  }),
});

export const logIn = z.object({
  command: z.literal('logIn'),
  payload: z.object({
    name: z.string(),
    password: z.string(),
  }),
});

export const registration = z.object({
  command: z.literal('registration'),
  payload: z.object({
    name: z.string(),
    password: z.string(),
    NgramDelta: z.record(z.number()),
  }),
});

export const addFriend = z.object({
  command: z.literal('addFriend'),
  payload: z.object({
    username: z.string(),
    friendname: z.string(),
  }),
});

export const selectFriend = z.object({
  command: z.literal('SelectFriend'),
  payload: z.object({
    username: z.string(),
    friendname: z.string(),
  }),
});

export const removeFriend = z.object({
  command: z.literal('removeFriend'),
  payload: z.object({
    username: z.string(),
    friendname: z.string(),
  }),
});

export const joinChannel = z.object({
  command: z.literal('joinChannel'),
  payload: z.object({
    channelname: z.string(),
    username: z.string(),
  }),
});

export const selectChannel = z.object({
  command: z.literal('selectChannel'),
  payload: z.object({
    channelname: z.string(),
    username: z.string(),
  }),
});

export const leaveChannel = z.object({
  command: z.literal('leaveChannel'),
  payload: z.object({
    channelname: z.string(),
    username: z.string(),
  }),
});

export const getList = z.object({
  command: z.literal('getList'),
  payload: z.object({
    username: z.string(),
    string: z.string(),
  }),
});

export const friendMessage = z.object({
  command: z.literal('friendMessage'),
  payload: z.object({
    text: z.string(),
    date: z.string(),
    NgramDelta: z.record(z.number()),
  }),
});
export const exitMe = z.object({
  command: z.literal('exitMe'),
  payload: z.object({
    name: z.string(),
  }),
});

//FIXME: bijvoegen schemas in z.union
export const MessageSchema = z.union([
  logIn,
  registration,
  addFriend,
  selectFriend,
  removeFriend,
  joinChannel,
  leaveChannel,
  selectChannel,
  getList,
  friendMessage,
  ErrorSchema,
  exitMe,
]);