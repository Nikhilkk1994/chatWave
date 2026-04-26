const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Persists users as JSON on disk (no SQLite / native addons).
 * Uses a mutex so concurrent signups cannot corrupt the file.
 */
class FileUserStore {
    /**
     * @param {string} dataDir absolute directory for users.json
     */
    constructor(dataDir) {
        this.dataDir = dataDir;
        this.filePath = path.join(dataDir, 'users.json');
        /** @type {Promise<void>} */
        this._chain = Promise.resolve();
    }

    /**
     * @template T
     * @param {() => Promise<T>} fn
     * @returns {Promise<T>}
     */
    _serialized(fn) {
        const next = this._chain.then(fn, fn);
        this._chain = next.then(
            () => undefined,
            () => undefined
        );
        return next;
    }

    async _readState() {
        try {
            const raw = await fs.readFile(this.filePath, 'utf8');
            const parsed = JSON.parse(raw);
            if (!parsed || !Array.isArray(parsed.users)) {
                return { nextId: 1, users: [] };
            }
            return {
                nextId: Number(parsed.nextId) || 1,
                users: parsed.users,
            };
        } catch (err) {
            if (err && err.code === 'ENOENT') {
                return { nextId: 1, users: [] };
            }
            throw err;
        }
    }

    /**
     * @param {{ nextId: number, users: object[] }} state
     */
    async _writeState(state) {
        await fs.mkdir(this.dataDir, { recursive: true });
        const tmp = path.join(
            this.dataDir,
            `.users.${crypto.randomBytes(8).toString('hex')}.tmp`
        );
        await fs.writeFile(tmp, JSON.stringify(state, null, 0), 'utf8');
        await fs.rename(tmp, this.filePath);
    }

    /**
     * @param {string} username
     * @param {string} passwordHash
     * @param {number} createdAt
     * @returns {Promise<{ id: number, username: string } | null>}
     */
    async createUser(username, passwordHash, createdAt) {
        return this._serialized(async () => {
            const state = await this._readState();
            const key = username.toLowerCase();
            const taken = state.users.some((u) => u.username_lower === key);
            if (taken) return null;
            const id = state.nextId;
            state.nextId = id + 1;
            state.users.push({
                id,
                username,
                username_lower: key,
                password_hash: passwordHash,
                created_at: createdAt,
            });
            await this._writeState(state);
            return { id, username };
        });
    }

    /**
     * @param {string} username
     * @returns {Promise<{ id: number, username: string, password_hash: string } | undefined>}
     */
    async findByUsername(username) {
        const state = await this._readState();
        const key = String(username || '').trim().toLowerCase();
        const row = state.users.find((u) => u.username_lower === key);
        if (!row) return undefined;
        return {
            id: row.id,
            username: row.username,
            password_hash: row.password_hash,
        };
    }

    /**
     * @param {number} id
     * @returns {Promise<{ id: number, username: string } | undefined>}
     */
    async findById(id) {
        const state = await this._readState();
        const row = state.users.find((u) => Number(u.id) === Number(id));
        if (!row) return undefined;
        return { id: row.id, username: row.username };
    }
}

module.exports = { FileUserStore };
