// author: Dirk Nuyens
// date: 2022-10-24

import { expect, describe, it } from 'vitest';

import { MockWebSocket, MockWebSocketServer } from '../../../../src/front-end/proto/__mock__/ws-mock.js';

// async function flushPromises() {
//   await new Promise((resolve) => setTimeout(resolve));
// }

describe('MockWebSocket', () => {
  it('has state CONNECTING when there is no MockWebSocketServer', () => {
    const ws = new MockWebSocket('fakeURL', 'socket-1');
    expect(ws.readyState).toEqual(0);
  });

  it('fires event listeners on receive', async () => {
    const ws = new MockWebSocket('fakeURL', 'socket-1');
    // first put the event handler
    let d = '';
    const p = new Promise<void>((resolve) => {
      // Note: do not put expect inside a promise...
      ws.on('message', async (data) => {
        d = data.toString();
        await Promise.resolve();
        resolve();
      });
      ws.receive('hello');
    });
    await p;
    expect(d).toEqual('hello');
  }, 100000);

  it('fires event listeners on receive with multiple listeners', async () => {
    const ws = new MockWebSocket('fakeURL', 'socket-1');
    let d2 = '';
    const p2 = new Promise<void>((done2) => {
      // Note: do not put expect inside a promise...
      ws.on('message', async (data) => {
        d2 = data.toString();
        done2();
        await Promise.resolve();
      });
    });
    let d3 = '';
    const p3 = new Promise<void>((done3) => {
      // Note: do not put expect inside a promise...
      ws.on('message', async (data) => {
        d3 = data.toString();
        done3();
        await Promise.resolve();
      });
      ws.receive('hello');
    });
    await Promise.all([p2, p3]);
    expect(d2).toEqual('hello');
    expect(d3).toEqual('hello');
  });
});

describe('MockWebSocketServer', () => {
  const fakeURL = 'fakeURL-1';
  const wss = new MockWebSocketServer(fakeURL);

  it('allows a MockWebSocket to connect', () => {
    const ws = new MockWebSocket(fakeURL, 'socket-1');
    expect(wss.socketsClientToServer.has(ws)).toEqual(true);
  });

  describe('MockWebSocket', () => {
    it('signals the connection is open and has state OPEN', async () => {
      const ws = new MockWebSocket(fakeURL, 'socket-2');
      let b = undefined;
      const p = new Promise<void>((resolve) => {
        // Note: do not put expect inside a promise...
        ws.on('open', () => {
          b = wss.socketsClientToServer.has(ws);
          resolve();
        });
      });
      await p;
      expect(b).toBe(true);
      expect(ws.readyState).toEqual(1);
    });
  });

  it('delivers a message from client to server and server to client', async () => {
    const ws3 = new MockWebSocket(fakeURL, 'socket-3');
    const ws3ServerEnd = wss.socketsClientToServer.get(ws3);
    expect(ws3ServerEnd).toBeDefined();
    expect(ws3ServerEnd?.end).toEqual('server');
    let d = '';
    const p = new Promise<void>((resolve) => {
      // Note: do not put expect inside a promise...
      ws3ServerEnd?.on('message', async (data) => {
        d = data.toString();
        resolve();
        await Promise.resolve();
      });
      ws3.send('hello again!');
    });
    await p;
    expect(d).toEqual('hello again!');
    //
    d = '';
    const p2 = new Promise<void>((resolve) => {
      // Note: do not put expect inside a promise...
      ws3.on('message', async (data) => {
        d = data.toString();
        resolve();
        await Promise.resolve();
      });
      ws3ServerEnd?.send('from me as well');
    });
    await p2;
    expect(d).toEqual('from me as well');
  });
});
