//Author: Guust Luyckx, Barteld Van Nieuwenhove, El Kaddouri Ibrahim
//Date: 2022/10/31

import fs from 'fs';
import { z } from 'zod';
import { User } from '../objects/user/user.js';

import Debug from 'debug';
import { decrypt } from './security/decryprt.js';
import { arrayBufferToString, stringToUint8Array } from './security/util.js';
import { encrypt } from './security/encrypt.js';
const debug = Debug('user-database');

const userJSONSchema = z.object({
  UUID: z.string(),
  name: z.string(),
  password: z.string(),
  profilePicture: z.string(),
  publicChannels: z.array(z.string()),
  friendChannels: z.array(z.string()),
  friends: z.array(z.string()),
  ngrams: z.array(z.tuple([z.string(), z.number()])),
  verificationSucceeded: z.boolean(),
});
export type UserJSONSchema = z.infer<typeof userJSONSchema>;

/**
 * delete a user from database
 * @param user the user instance to be deleted from database
 */
export function userDelete(user: User): void {
  const id = user.getUUID();
  const path = './assets/database/users/' + id + '.json';
  try {
    fs.unlinkSync(path);
  } catch (error) {
    console.error('Error while deleting user:', error);
  }
}

/**
 * saves a user to database
 * @param user the user instance to be saved to the database
 */
export async function userSave(user: User): Promise<void> {
  const id = user.getUUID();
  console.log('welp');
  console.log(user);
  const path = './assets/database/users/' + id + '.json';
  try {
    const encryptedUser = await encrypt(user);
    fs.writeFileSync(
      path,
      arrayBufferToString(encryptedUser.iv) + '\n' + arrayBufferToString(encryptedUser.encryptedObject)
    );
  } catch (error) {
    console.error('Error while saving user:', error);
  }
}

/**
 * loads a user object from the database
 * @param identifier the unique identifier for a user object (UUID)
 * @returns
 */
export async function userLoad(identifier: string): Promise<User | undefined> {
  console.log('userLoad' + identifier);
  const savedUserCheck = await loadingUser(identifier);
  if (savedUserCheck !== undefined) {
    const savedUser = User.fromJSON(savedUserCheck);
    return savedUser;
  }
  return undefined;
}

/**
 * loading of user object into an intermediate json form.
 * @param identifier a unqiue identifier for the user object to be loaded
 * @returns
 */
async function loadingUser(identifier: string): Promise<UserJSONSchema | undefined> {
  const path = './assets/database/users/' + identifier + '.json';
  let userObject: object;
  try {
    const encryptedUser = fs.readFileSync(path, 'utf-8');
    const iv = encryptedUser.slice(0, encryptedUser.indexOf('\n'));
    const cypher = encryptedUser.slice(encryptedUser.indexOf('\n') + 1);
    userObject = await decrypt(stringToUint8Array(cypher), stringToUint8Array(iv));
  } catch (error) {
    console.log('Channel with CUID ' + identifier + ' does not exist');
    console.error(error);
    return undefined;
  }
  const savedUserCheck = userJSONSchema.safeParse(userObject);
  if (!savedUserCheck.success) {
    console.log('error channel ' + identifier + ' corrupted. This may result in unexpected behaviour');
    console.log(savedUserCheck.error);
    return undefined;
  }
  return savedUserCheck.data;
}
