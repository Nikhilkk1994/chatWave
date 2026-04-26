const express = require('express');
const bcrypt = require('bcryptjs');
const { createUser, findByUsername, findById, isValidUsername, normalizeUsername } = require('../db/userRepository');

const router = express.Router();
const SALT_ROUNDS = 10;

function passwordOk(p) {
    return typeof p === 'string' && p.length >= 8 && p.length <= 128;
}

router.post('/signup', async (req, res) => {
    try {
        const username = normalizeUsername(req.body.username);
        const password = req.body.password;
        if (!isValidUsername(username)) {
            return res.status(400).json({ error: 'Username must be 3–32 characters (letters, numbers, _ or -).' });
        }
        if (!passwordOk(password)) {
            return res.status(400).json({ error: 'Password must be at least 8 characters.' });
        }
        const hash = bcrypt.hashSync(password, SALT_ROUNDS);
        const user = await createUser(username, hash);
        if (!user) {
            return res.status(409).json({ error: 'That username is already taken.' });
        }
        req.session.userId = user.id;
        req.session.username = user.username;
        return res.json({ ok: true, username: user.username });
    } catch (err) {
        console.error('signup', err);
        return res.status(500).json({ error: 'Could not create account.' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const username = normalizeUsername(req.body.username);
        const password = req.body.password;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required.' });
        }
        const row = await findByUsername(username);
        if (!row || !bcrypt.compareSync(password, row.password_hash)) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }
        req.session.userId = row.id;
        req.session.username = row.username;
        return res.json({ ok: true, username: row.username });
    } catch (err) {
        console.error('login', err);
        return res.status(500).json({ error: 'Login failed.' });
    }
});

router.get('/me', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not signed in' });
        }
        const user = await findById(req.session.userId);
        if (!user) {
            req.session.destroy(() => {});
            return res.status(401).json({ error: 'Not signed in' });
        }
        return res.json({ username: user.username, id: user.id });
    } catch (err) {
        console.error('me', err);
        return res.status(500).json({ error: 'Session check failed.' });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ error: 'Logout failed' });
        res.clearCookie('connect.sid');
        return res.json({ ok: true });
    });
});

module.exports = router;
