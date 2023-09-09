// Guust Luycx
// 29/04/2023
/**
 * Resizes the "listUsers" and "messageList" elements to fit the screen height.
 * This function should be called on page load and window resize events.
 * @param {Document} document - The HTML document object
 * @param {number} windowInnerHeight - The height of the window inner area in pixels
 * @param {number} ACTIVE_USERS_CARD_HEIGHT - The height of the active users card in pixels
 * @param {number} MESSAGE_LIST_CARD_HEIGHT - The height of the message list card in pixels
 * @returns {void}
 */
export function channelChatResize(document, windowInnerHeight, ACTIVE_USERS_CARD_HEIGHT, MESSAGE_LIST_CARD_HEIGHT) {
    const listUsers = document.getElementById('listUsers');
    const messageList = document.getElementById('messageList');
    listUsers.style.height = `${windowInnerHeight - ACTIVE_USERS_CARD_HEIGHT}px`;
    messageList.style.height = `${windowInnerHeight - MESSAGE_LIST_CARD_HEIGHT}px`;
}
export function friendChatResize(document, windowInnerHeight, MESSAGE_LIST_CARD_HEIGHT) {
    const messageList = document.getElementById('messageList');
    messageList.style.height = `${windowInnerHeight - MESSAGE_LIST_CARD_HEIGHT}px`;
}
//# sourceMappingURL=resize.js.map