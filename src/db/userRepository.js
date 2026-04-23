const { db } = require('./database');

function normalizeUsername(raw) {
    return String(raw || '').trim().slice(0, 32);
}

function isValidUsername(u) {
    return /^[a-zA-Z0-9_-]{3,32}$/.test(u);
}

/**
 * @param {string} username
 * @param {string} passwordHash
 * @returns {{ id: number, username: string } | null}
 */
function createUser(username, passwordHash) {
    const u = normalizeUsername(username);
    if (!isValidUsername(u)) return null;
    const now = Date.now();
    try {
        const info = db
            .prepare('INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)')
            .run(u, passwordHash, now);
        return { id: Number(info.lastInsertRowid), username: u };
    } catch (_) {
        return null;
    }
}

/**
 * @param {string} username
 * @returns {{ id: number, username: string, password_hash: string } | undefined}
 */
function findByUsername(username) {
    const u = normalizeUsername(username);
    return db.prepare('SELECT id, username, password_hash FROM users WHERE username = ? COLLATE NOCASE').get(u);
}

/**
 * @param {number} id
 */
function findById(id) {
    return db.prepare('SELECT id, username FROM users WHERE id = ?').get(id);
}

module.exports = { createUser, findByUsername, findById, isValidUsername, normalizeUsername };
