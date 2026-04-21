const path = require('path');
const envPath = path.join(__dirname, '..', '.env');
const dotenvResult = require('dotenv').config({ path: envPath });
if (dotenvResult.error) {
    if (dotenvResult.error.code === 'ENOENT') {
        console.warn(`[env] No .env file at ${envPath} (create it with ANTHROPIC_API_KEY=...)`);
    } else {
        console.warn('[env]', dotenvResult.error.message);
    }
}
const http = require('http');
const crypto = require('crypto');
const express = require('express');
const socketIO = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIO(server)
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')
const { appendMessage: appendRoomMessage, getHistory: getRoomHistory } = require('./utils/roomHistory')
const { ClaudeCompanion } = require('./companion/ClaudeCompanion')

const companion = new ClaudeCompanion()
const AI_DISPLAY_NAME = (process.env.COMPANION_DISPLAY_NAME || 'ChatWave AI').trim()
const companionAskCooldownMs = Number(process.env.COMPANION_COOLDOWN_MS) || 4000
const lastCompanionAsk = new Map()

const PORT = 3001; //process.env.PORT || 3001;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
    console.log('New websocket connection')
    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room })
        if (error) return callback(error)
        socket.join(user.room)
        socket.hbEventTime = Date.now()
        socket.emit('personChatMessage', { text: 'Welcome to the chat', username: user.username })
        socket.broadcast.to(user.room).emit('personChatMessage', { text: `joined the chat`, username: user.username })
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) })
        callback()
    })

    socket.on('typing', ({ isTyping }) => {
        const user = getUser(socket.id)
        if (!user) return
        socket.broadcast.to(user.room).emit('userTyping', {
            username: user.username,
            isTyping: Boolean(isTyping)
        })
    })

    socket.on('sendMessage', (eventData, callback) => {
        console.log('sendMessage', JSON.stringify(eventData))
        const user = getUser(socket.id)
        if (!user) return callback('User not found')
        const text = String(eventData.text ?? '').slice(0, 4000)
        const payload = { text, username: user.username, room: user.room }
        appendRoomMessage(user.room, { username: user.username, text })
        io.to(user.room).emit('personChatMessage', payload)
        callback()
    })

    socket.on('askCompanion', async ({ prompt, stream }, callback) => {
        const done = typeof callback === 'function' ? callback : () => {}
        const user = getUser(socket.id)
        if (!user) return done('User not found')
        if (!companion.isConfigured()) {
            return done('AI companion is not configured (set ANTHROPIC_API_KEY).')
        }
        const trimmed = String(prompt ?? '').trim().slice(0, 4000)
        if (!trimmed) return done('Prompt is required')

        const now = Date.now()
        const last = lastCompanionAsk.get(socket.id) || 0
        if (now - last < companionAskCooldownMs) {
            return done('Please wait a moment before asking again.')
        }
        lastCompanionAsk.set(socket.id, now)

        const requestId = crypto.randomUUID()
        const messages = companion.buildMessages(getRoomHistory(user.room), trimmed)

        try {
            let reply = ''
            if (stream) {
                reply = await companion.streamCompletion(messages, (chunk) => {
                    socket.emit('aiChunk', { requestId, chunk })
                })
            } else {
                reply = await companion.complete(messages)
            }
            if (!reply) reply = '(No response)'

            appendRoomMessage(user.room, { username: user.username, text: trimmed })
            appendRoomMessage(user.room, { username: AI_DISPLAY_NAME, text: reply })
            io.to(user.room).emit('personChatMessage', {
                text: reply,
                username: AI_DISPLAY_NAME,
                isAi: true,
                companionRequestId: stream ? requestId : null,
            })
            if (stream) socket.emit('aiDone', { requestId })
            done()
        } catch (err) {
            console.error('askCompanion', err)
            const msg = err.message || 'Companion request failed'
            socket.emit('companionError', { message: msg })
            done(msg)
        }
    })

    socket.on('sendLocation', (latitude, longitude) => {
        const user = getUser(socket.id);
        if (!user) return;
        io.to(user.room).emit('personChatMessage', {
            text: '',
            username: user.username,
            isLocation: true,
            url: `https://google.com/maps?q=${latitude},${longitude}`,
            latitude: latitude,
            longitude: longitude
        });
    })

    socket.on('sendAudio', (eventData) => {
        const user = getUser(socket.id);
        if (!user) return;
        io.to(user.room).emit('personChatMessage', {
            text: '',
            username: user.username,
            isAudio: true,
            audioData: eventData.audioData // Cross-browser compatible base64
        });
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('userTyping', { username: user.username, isTyping: false })
            io.to(user.room).emit('personChatMessage', { text: `${user.username} has left the chat`, username: user.username })
            io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) })
        }
    })

})

server.listen(PORT, () => {console.log(`Server is running on port ${PORT}`)});
