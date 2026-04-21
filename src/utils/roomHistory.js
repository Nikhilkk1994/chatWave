const HISTORY_LIMIT = 40;
const histories = new Map();

/**
 * @param {string} room
 * @param {{ username: string, text: string }} entry
 */
function appendMessage(room, entry) {
    if (!room || !entry.text) return;
    const text = String(entry.text).slice(0, 4000);
    if (!histories.has(room)) histories.set(room, []);
    const arr = histories.get(room);
    arr.push({ username: entry.username, text });
    if (arr.length > HISTORY_LIMIT) arr.splice(0, arr.length - HISTORY_LIMIT);
}

/**
 * @param {string} room
 * @returns {{ username: string, text: string }[]}
 */
function getHistory(room) {
    return histories.get(room) || [];
}

module.exports = { appendMessage, getHistory };
