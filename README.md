# ChatWave

Real-time chat with **sign up / log in**, a **JSON file user store** on disk (`data/users.json` by default), **cookie sessions**, then **pick a room** and chat. Optional **Claude** “Ask AI” when `ANTHROPIC_API_KEY` is set.

## Flow

1. Open `/` → **home** (`public/home.html`): sign up or log in.  
2. After success → **`/join`** → enter a **room name** → **Enter chat** → `chat.html?room=...`.  
3. The server puts your **username from the session** into the room (the client cannot pick another user’s name for the socket `join`).  
4. **Leave room** returns to **`/join`** (session stays active).

Accounts are stored under **`USER_DATA_DIR`** (default `./data`) in **`users.json`** — they persist across server restarts until you delete that file or directory.

## Stack

- Express, express-session, cookie-parser  
- File-backed users (`data/users.json`), bcryptjs  
- Socket.IO 2.x  
- Optional Anthropic SDK for the companion  

## Setup

```bash
npm install
cp .env.example .env
# Edit .env: SESSION_SECRET (random string), ANTHROPIC_API_KEY (optional)
npm start
```

Open **http://localhost:3001/** (or `PORT` from `.env`).

## API (same origin, JSON)

| Method | Path | Body | Result |
|--------|------|------|--------|
| POST | `/api/signup` | `{ "username", "password" }` | Sets session; username `3–32` chars `[a-zA-Z0-9_-]`, password `≥ 8` |
| POST | `/api/login` | `{ "username", "password" }` | Sets session |
| GET | `/api/me` | — | `{ username, id }` or 401 |
| POST | `/api/logout` | — | Clears session |

## Deploy notes

- Set a strong **`SESSION_SECRET`** in production.  
- **In-memory DB** is not suitable for multiple server instances; use a real DB file or hosted DB if you scale horizontally.  
- Socket.IO must reach the same host that set the session cookie; use `withCredentials: true` on the client (already in `public/js/chat.js`).

## License

ISC (see `package.json`).
