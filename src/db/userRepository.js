const { store } = require('./database');

function normalizeUsername(raw) {
    return String(raw || '').trim().slice(0, 32);
}

function isValidUsername(u) {
    return /^[a-zA-Z0-9_-]{3,32}$/.test(u);
}

/**
 * @param {string} username
 * @param {string} passwordHash
 * @returns {Promise<{ id: number, username: string } | null>}
 */
async function createUser(username, passwordHash) {
    const u = normalizeUsername(username);
    if (!isValidUsername(u)) return null;
    const now = Date.now();
    return store.createUser(u, passwordHash, now);
}

/**
 * @param {string} username
 * @returns {Promise<{ id: number, username: string, password_hash: string } | undefined>}
 */
function findByUsername(username) {
    const u = normalizeUsername(username);
    return store.findByUsername(u);
}

/**
 * @param {number} id
 * @returns {Promise<{ id: number, username: string } | undefined>}
 */
function findById(id) {
    return store.findById(id);
}

module.exports = { createUser, findByUsername, findById, isValidUsername, normalizeUsername };
